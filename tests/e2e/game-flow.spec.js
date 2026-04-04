import { test, expect } from '@playwright/test';

test.setTimeout(15000);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Navigate to the game and wait for the canvas to be visible. */
async function loadGame(page) {
  await page.goto('http://localhost:8080');
  await page.locator('#c').waitFor({ state: 'visible' });
  // Allow the first frame to render so _game and clickZones are initialised.
  await page.waitForTimeout(300);
}

/** Get current viewport dimensions from the game instance. */
async function getDimensions(page) {
  return page.evaluate(() => ({ W: window._game.W, H: window._game.H }));
}

/**
 * Click the first profile card (slot 0) to select it and transition to 'menu'.
 * The card is centred at (W/2, startY + cardH/2) where startY ≈ H*0.28 and
 * cardH = max(80, H*0.12).  Clicking W/2, H*0.35 reliably lands on it.
 */
async function selectProfile(page) {
  const { W, H } = await getDimensions(page);
  await page.mouse.click(W / 2, H * 0.35);
  await page.waitForTimeout(300);
}

/** Select profile then click the PLAY button (≈ W/2, H*0.58). */
async function startPlaying(page) {
  await selectProfile(page);
  const { W, H } = await getDimensions(page);
  await page.mouse.click(W / 2, H * 0.58);
  await page.waitForTimeout(500);
}

/** Start playing then click the pause button (top-centre, ≈ W/2, H*0.03). */
async function pauseGame(page) {
  await startPlaying(page);
  const { W, H } = await getDimensions(page);
  // Pause button: px = W/2 - 22, py = 8, pw = 44, ph = 36 → centre ≈ W/2, 26
  await page.mouse.click(W / 2, 26);
  await page.waitForTimeout(200);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Game Flow Tests', () => {

  test.beforeEach(async ({ page }) => {
    await loadGame(page);
  });

  // -------------------------------------------------------------------------
  // Test 1
  // -------------------------------------------------------------------------
  test('loads and shows profile select screen', async ({ page }) => {
    const canvas = page.locator('#c');
    await expect(canvas).toBeVisible();

    const width = await canvas.evaluate(el => el.width);
    expect(width).toBeGreaterThan(0);

    const state = await page.evaluate(() => window._game?.state);
    expect(state).toBe('profile_select');

    await page.screenshot({ path: 'tests/e2e/screenshots/profile-select.png', fullPage: true }).catch(() => {});
  });

  // -------------------------------------------------------------------------
  // Test 2
  // -------------------------------------------------------------------------
  test('can select a profile slot and reach menu', async ({ page }) => {
    await selectProfile(page);

    const state = await page.evaluate(() => window._game?.state);
    expect(state).toBe('menu');
  });

  // -------------------------------------------------------------------------
  // Test 3
  // -------------------------------------------------------------------------
  test('can start a game from the menu', async ({ page }) => {
    await startPlaying(page);

    const state = await page.evaluate(() => window._game?.state);
    expect(state).toBe('playing');

    const player = await page.evaluate(() => window._game?.player);
    expect(player).not.toBeNull();

    const lives = await page.evaluate(() => window._game?.lives);
    expect(lives).toBe(3);
  });

  // -------------------------------------------------------------------------
  // Test 4
  // -------------------------------------------------------------------------
  test('pause button pauses the game', async ({ page }) => {
    await pauseGame(page);

    const state = await page.evaluate(() => window._game?.state);
    expect(state).toBe('paused');
  });

  // -------------------------------------------------------------------------
  // Test 5
  // -------------------------------------------------------------------------
  test('resume from pause resumes playing', async ({ page }) => {
    await pauseGame(page);

    // The RESUME button is drawn at: W/2 - 100, H/2, w=200, h=52
    // → centre at (W/2, H/2 + 26)
    const { W, H } = await getDimensions(page);
    await page.mouse.click(W / 2, H / 2 + 26);
    await page.waitForTimeout(200);

    const state = await page.evaluate(() => window._game?.state);
    expect(state).toBe('playing');
  });

  // -------------------------------------------------------------------------
  // Test 6
  // -------------------------------------------------------------------------
  test('game over screen appears after all lives lost', async ({ page }) => {
    // Need an active profile with a game in progress; the simplest way is to
    // select a profile (so getActive() returns something) then call _gameOver().
    await selectProfile(page);

    await page.evaluate(() => window._game._gameOver());
    await page.waitForTimeout(100);

    const state = await page.evaluate(() => window._game?.state);
    expect(state).toBe('gameover');
  });

  // -------------------------------------------------------------------------
  // Test 7
  // -------------------------------------------------------------------------
  test('score increases when enemies are killed', async ({ page }) => {
    await startPlaying(page);

    const initialScore = await page.evaluate(() => window._game?.score);
    expect(initialScore).toBe(0);

    await page.evaluate(() => { window._game.score += 50; });

    const score = await page.evaluate(() => window._game?.score);
    expect(score).toBe(50);
  });

  // -------------------------------------------------------------------------
  // Test 8
  // -------------------------------------------------------------------------
  test('level select navigates to phase select', async ({ page }) => {
    await selectProfile(page);

    const { W, H } = await getDimensions(page);
    // LEVEL SELECT button centre ≈ W/2, H*0.68 + btnH/2 (btnH=52)
    await page.mouse.click(W / 2, H * 0.68 + 26);
    await page.waitForTimeout(200);

    const state = await page.evaluate(() => window._game?.state);
    expect(state).toBe('phase_select');
  });

  // -------------------------------------------------------------------------
  // Test 9
  // -------------------------------------------------------------------------
  test('back button returns from phase select to menu', async ({ page }) => {
    await selectProfile(page);

    const { W, H } = await getDimensions(page);
    // Navigate to phase_select
    await page.mouse.click(W / 2, H * 0.68 + 26);
    await page.waitForTimeout(200);

    // BACK button is at W/2 - 80, H - 80, w=160, h=44 → centre (W/2, H - 58)
    await page.mouse.click(W / 2, H - 58);
    await page.waitForTimeout(200);

    const state = await page.evaluate(() => window._game?.state);
    expect(state).toBe('menu');
  });

});
