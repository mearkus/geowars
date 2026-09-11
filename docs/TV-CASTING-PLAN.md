# Geo Wars on the TV — Android Casting Plan

**Status:** proposal / roadmap. Nothing here is implemented yet.
**Goal:** on Android, send the game to a TV or casting device so the TV renders the game and the phone is *only* a controller.

---

## 1. The headline finding

The hard part is not casting. It is that **the phone controller cannot operate the user interface.**

The codebase already has the correct shape for TV play:

| Piece | Where | State |
|---|---|---|
| Host renders, accepts input from elsewhere | `InputManager.update()` short-circuit, `index.html:592` | Works |
| Phone sends dual-stick input | `_initControllerMode()`, `index.html:3153` | Works |
| Pairing + QR handshake | `PeerManager`, `index.html:683`; `_ensureQRCode()`, `index.html:2764` | Works |

Point any smart TV browser (Tizen, webOS, Fire TV Silk, an Android TV browser) at
`https://mearkus.github.io/geowars/`, scan the QR with a phone, and you already have TV-display /
phone-controller play today. But you get stuck immediately, because:

1. **The boot state is `auth`** (`index.html:1718`). The first screen wants an email and a password
   typed into a DOM `<input>`. A TV has no keyboard.
2. **Menus are mouse/touch only.** Every button is a click zone rebuilt per frame via `_addZone()`
   (`index.html:1865`). Remote input feeds `left` / `right` / `shooting` and nothing else
   (`index.html:592-598`), so a paired phone can fly the ship but cannot press `PLAY`, `RESUME`,
   or `BACK`.
3. **The protocol has no buttons.** `{ lx, ly, rx, ry, s }` is the entire vocabulary, and it is
   one-directional — the host never talks back to the phone.

So the work splits cleanly into *make the phone a real controller* (needed for every TV path, no
platform risk) and *make casting one tap on Android* (platform risk, needs a decision gate).
Do them in that order.

---

## 2. Target architecture

### 2.1 Three roles, one file

Today the app boots into one of two paths (`index.html:3372`): game, or controller if
`?controller=` is present. Introduce an explicit third role and a single boot switch:

| Role | URL | Renders | Input source | Notes |
|---|---|---|---|---|
| `game` | `/` | full game | local kb/mouse/touch, or remote | today's behaviour, unchanged |
| `display` | `/?role=display` | full game, 10-foot UI | **remote only** | runs on the TV / cast receiver |
| `controller` | `/?controller=<id>` | gamepad UI | — | runs on the phone |

`display` differs from `game` in that it never shows touch sticks, never opens a DOM text input,
skips the auth screen in favour of a phone-driven sign-in, applies overscan-safe margins, and
runs the reduced-effects render tier (§5).

### 2.2 Transport abstraction — the key refactor

`PeerManager` (`index.html:683`) hardcodes PeerJS. Every casting option below is *just a different
byte pipe*. Extract the interface first and the platform choice stops being load-bearing:

```js
class Transport {
  // host side
  static async host(onMessage, onState) -> { id, url, send(msg), close() }
  // controller side
  static async join(id, onMessage, onState) -> { send(msg), close() }
}
```

Implementations, all satisfying the same contract:

- `PeerJsTransport` — today's WebRTC/PeerJS path. Keep as the universal fallback.
- `CastTransport` — Cast custom-namespace messaging (§3.1), Android's one-tap path.
- `LoopbackTransport` — `BroadcastChannel`, same browser, two tabs. **Test-only, and the reason
  this refactor pays for itself** (§6).

`Game` holds a `this.transport`; `PeerManager` becomes a thin wrapper over `PeerJsTransport` so
the existing menu flow does not change.

### 2.3 Protocol v2

Versioned, bidirectional, backward compatible.

**Phone → host**, coalesced to one send per animation frame (today it sends on *every* touch event,
`index.html:3264` — unbounded and wasteful):

```js
{ v:2, t:'i', lx, ly, rx, ry, b }   // b = button bitfield
// bits: 1 FIRE  2 A/confirm  4 B/back  8 START/pause
//      16 UP   32 DOWN      64 LEFT  128 RIGHT
{ v:2, t:'text', field:'initials', value:'ABC' }   // phone-driven text entry
{ v:2, t:'hello', name:'Mark', caps:['gyro','vibrate'] }
```

**Host → phone** (new direction; the phone currently never receives anything):

```js
{ v:2, t:'ui', mode:'menu'|'game'|'text', title, hint, focus }  // on change only
{ v:2, t:'hb' }                                                  // 1 Hz heartbeat
{ v:2, t:'vibe', ms }                                            // hit/death feedback
```

The `ui` message is what lets the phone re-skin itself: sticks during `playing`, a d-pad +
A/B during menus, a native text field during `enter_initials` / `set_username` / `auth`.

Compatibility: a message with no `v` is treated as v1 `{lx,ly,rx,ry,s}`, so an old phone tab paired
against a new host keeps working.

### 2.4 UI navigation without a pointer

`clickZones` is rebuilt every frame and each zone already carries `{x,y,w,h,action}`. That is
enough for **spatial focus navigation** with no changes to the ~20 `_button()` call sites:

- `Game._focus` holds the currently focused zone's centre point.
- D-pad direction → pick the zone whose centre is nearest in that direction (angle-weighted
  distance); clamp to the current zone if none.
- `A` invokes `zone.action()`; `B` maps to the screen's `BACK` zone if one exists, else
  `setState('menu')`.
- Draw a focus ring in the existing neon idiom on the focused zone.
- Because zones are re-registered each frame in a stable order, re-resolve focus by nearest centre
  to last frame's focus point — survives layout changes and resizes.

This is a pure function of the zone list: `pickZone(zones, fromPoint, direction) -> index`. Unit
testable, no canvas needed.

**Text entry moves to the phone.** When the host enters a text state it sends
`{t:'ui', mode:'text', field, maxLen}`; the phone shows a real `<input>` (with the phone's own
keyboard) and replies `{t:'text', value}`. This is what unblocks the `auth` boot state on a TV.
Guest play (`_doGuestPlay`, `index.html:2534`) should also be surfaced as the default on `display`.

---

## 3. Casting options, compared

### 3.1 Google Cast custom receiver — *recommended for the Android one-tap path*

The TV runs a **Cast Web Receiver**: a page served over HTTPS (GitHub Pages already qualifies),
loaded by Chromecast/Google TV, registered in the Cast SDK Developer Console for an App ID. The
phone is a **Cast Web Sender** in Chrome for Android, which
[Google supports for Android](https://developer.chrome.com/blog/presentation-api). Input travels on
a **custom namespace** (`urn:x-cast:com.geowars.input`) as JSON messages — no STUN, no TURN, no
WebRTC, no signalling server, and it stays on the local network.

- **Pros:** the real "cast" button users expect; lowest-friction pairing (no QR scan); local-network
  latency; the receiver is the same `index.html` in `display` role.
- **Cons:** a [one-time $5 developer registration](https://developers.google.com/cast/docs/registration)
  and an App ID; the receiver must load the Cast Receiver SDK, which is a second external script;
  test devices must be registered in the console before an unpublished receiver will load; iOS Chrome
  cannot cast at all (irrelevant here — the ask is Android).
- **Unknowns to spike:** exact per-message size and rate ceiling on the custom namespace at 60 Hz;
  real-world input latency on a Chromecast; whether the older/HD Chromecast hardware can hold 60 fps
  (§5).

### 3.2 Presentation API without the Cast SDK

Attractive on paper — `new PresentationRequest(['https://…'])`, a `PresentationConnection` with
`send()`, zero registration. In practice Chrome's Cast integration expects you to present to a
*registered* receiver app; presenting an arbitrary page to a Cast device without registration has
long been "work underway" rather than shipped, and a bare `cast:` URL launches a receiver the sender
then cannot message. **Treat as a spike, not a plan.** If it works it collapses §3.1's cost to zero;
if not, §3.1 is unaffected because both sit behind the same `Transport` interface.

### 3.3 Tab / screen mirroring

Zero code. Also unplayable: mirroring re-encodes video with roughly 0.5–1.5 s of latency in a genre
that needs sub-100 ms, drains the phone, and leaves the game visible on the phone instead of the
controller. Worth one line in the README as "works, but don't"; not worth engineering.

### 3.4 Smart TV browser + QR (works today)

Tizen, webOS, Fire TV Silk and sideloaded Android TV browsers can open the URL and pair via the
existing QR flow. **This is free once §4 Phase 1 lands** and covers every TV that isn't a Chromecast.
Add a short pairing code alongside the QR (typing 6 characters with a TV remote beats aiming a phone
camera at a QR from the sofa).

### 3.5 Native Android app

An Android sender app, or an Android TV WebView/leanback app, gives the most reliable Cast
integration and a Play Store presence. It is also the point where this repo stops being a single
`index.html` with no build step — a direct conflict with the conventions in `CLAUDE.md`. Park it
behind a separate decision; nothing in Phases 1–4 forecloses it.

---

## 4. Roadmap

### Phase 0 — Spikes (half a day, before any feature work)

Three throwaway probes, each answering one question that changes the plan:

1. **Cast receiver hello-world.** Register a dev App ID, publish a stub receiver on a branch, send
   `{ping:1}` at 60 Hz from Chrome on Android over a custom namespace. Measure round-trip latency
   and find the rate/size ceiling.
2. **Render budget on the actual device.** Load today's `index.html` on the target Chromecast /
   Google TV and read frame time during a busy wave. This decides how aggressive §5 has to be.
3. **Presentation API without registration.** 30 minutes: does `PresentationRequest` with an HTTPS
   URL reach a Cast device from Chrome on Android, and does `connection.send()` arrive?

**Gate:** if (1) shows latency under ~80 ms and (2) shows a workable frame time, commit to §3.1.
If (2) fails badly, the Chromecast path needs the §5 work *before* the Cast work, or drops to §3.4
plus §3.5.

### Phase 1 — Make the phone a real controller *(no casting; ship on its own)*

Delivers TV play on any TV with a browser, and improves the existing desktop phone-controller too.

- Extract `Transport`; move PeerJS behind it; add `LoopbackTransport`.
- Protocol v2 with the v1 fallback; coalesce phone sends to one per frame.
- Spatial focus navigation over `clickZones`; focus ring; `A`/`B`/`START` handling.
- Host → phone `ui` messages; phone re-skins between sticks / d-pad / text.
- Phone-driven text entry; `START` maps to pause and `B` to back during play.
- Auto-reconnect: the phone retries with its peer id on wake (today a locked screen ends the session
  with "Refresh to reconnect", `index.html:3360`); the host pauses on disconnect instead of leaving
  the ship drifting, and `_connLostTimer` (`index.html:2957`) becomes a reconnect banner.
- Short pairing code shown next to the QR.

### Phase 2 — Android one-tap cast

Gated on Phase 0.

- Register the Cast App ID; point it at `https://mearkus.github.io/geowars/?role=display`.
- `CastTransport` behind the same interface; load the Cast sender SDK on Android only, receiver SDK
  only when `role=display`, so desktop and offline play carry no new bytes.
- A `CAST TO TV` menu button next to `PHONE CTRL`, shown only when a Cast device is discovered.
- Session handoff: starting a cast moves the current profile/level to the TV rather than restarting.

### Phase 3 — Make it look right on a TV

- Overscan-safe margins (~4–5% inset) for HUD and menus in `display` role; `resize()`
  (`index.html:1925`) caps the backing store at 1920×1080 and forces DPR 1.
- Type scale and stroke widths tuned for a 3 m viewing distance.
- Screen Wake Lock on the receiver; suppress the `document.hidden` auto-pause
  (`index.html:1824`) for `display`, where visibility semantics differ.
- "Controller disconnected" takeover screen instead of a 3-second toast.

### Phase 4 — The payoff features

- **Two-player couch co-op.** The natural reason TV mode exists. Requires a second `Player`, a
  second transport connection, per-player lives/score, and shared-screen camera rules. Largest game
  logic change in this document; treat as its own design pass.
- Phone as second screen: lives, score, multiplier and bomb count on the controller.
- Gyro aim as an optional right stick.
- Haptics on hit and death via `{t:'vibe'}`.

### Phase 5 — Optional native app

Only if Play Store presence or Android TV launcher placement is wanted. Separate decision, separate
directory or repo, and an explicit amendment to the no-build-step convention.

---

## 5. Performance on cast hardware

Chromecast and Google TV GPUs are far weaker than a laptop, and this renderer leans hard on the most
expensive 2D canvas feature there is: **17 `shadowBlur` sites** in `index.html`. Glow via
`shadowBlur` is per-draw-call and murderous at 1080p with hundreds of particles.

Plan a `display`-role render tier:

- Replace `shadowBlur` glow with pre-rendered radial-gradient sprites blitted with
  `globalCompositeOperation = 'lighter'`, or with two-pass layered strokes. Same look, a fraction of
  the cost, and it helps low-end phones too.
- Cap particle count and grid subdivision under the tier.
- Frame-time EMA that auto-downgrades the tier when a budget is missed for N consecutive frames.

Phase 0 probe 2 decides whether this is Phase 3 polish or a Phase 2 prerequisite.

---

## 6. Testing

Two facts about the current setup shape this:

1. **Unit tests do not test `index.html`.** `tests/setup/globals.js:85` loads `src/core.js`,
   `src/entities.js` and `src/data.js` through `vm.Script.runInThisContext()`. `CLAUDE.md` describes
   `src/` as reference mirrors that are not used at runtime — true for the browser, false for the
   test suite. The runtime and the tested code are two separate copies.
2. **They have already drifted.** `src/core.js`'s `InputManager` has no `_remoteInput` and no
   `setRemoteInput()` — the entire phone-controller path is invisible to the 248 unit tests.

So, before adding controller logic:

- Decide the mirror policy and write it down. Either mirror deliberately (and add a cheap drift
  check — extract the class bodies from both files and assert equality), or move the tests onto
  `index.html` by extracting its `<script>` block the way `globals.js` already extracts source files.
  The second is closer to "single file is the truth" and removes the drift class of bug entirely.
- Keep new logic **pure and top-level** so it loads under `runInThisContext`: `pickZone()`,
  the protocol encode/decode, the button bitfield, stick dead-zone maths. These are the pieces worth
  unit tests, and none of them need a canvas or a network.
- E2E: `LoopbackTransport` lets Playwright open two pages — `?role=display` and
  `?controller=loopback` — in one browser context and drive a full pair-navigate-play-pause loop with
  no WebRTC and no TV. This is the single highest-value test addition in the plan.
- Cast itself stays manual-test-only; keep a short device checklist in this file.

---

## 7. Risks and open decisions

| Risk | Impact | Mitigation |
|---|---|---|
| Cast registration cost/latency (dev console, device allowlisting, propagation delay) | blocks Phase 2 | Phase 0 probe 1; §3.4 ships without it |
| Chromecast can't hold 60 fps | Phase 2 unplayable | Phase 0 probe 2; §5 render tier |
| Input latency over Cast exceeds ~80 ms | twin-stick feels wrong | measure in Phase 0; fall back to §3.4 + WebRTC on the LAN |
| External script count grows (PeerJS, QRCode, Supabase, + Cast SDK) | offline/PWA and load time | load Cast SDKs conditionally by role/platform; check `sw.js` caching |
| Two-copy drift between `index.html` and `src/` | silently untested features | §6, decided before Phase 1 |
| `CLAUDE.md` state list is stale (missing `auth`, `verify_email`, `set_username`, `leaderboard`, `enter_initials`) | misleads future work | refresh alongside Phase 1 |

**Decisions needed from the owner:**

1. Pay the $5 and register a Cast App ID? (Gates Phase 2. Everything else proceeds without it.)
2. Is a native Android app acceptable eventually, or is single-file web a hard constraint?
3. Is two-player couch co-op the goal, or is TV mode single-player on a bigger screen?
4. Mirror policy: keep `src/` in sync, or point the unit tests at `index.html`?
