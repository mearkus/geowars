import { test, expect } from '@playwright/test';

test.setTimeout(15000);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function loadGame(page) {
  await page.goto('http://localhost:8080');
  await page.locator('#c').waitFor({ state: 'visible' });
  await page.waitForTimeout(300);
}

async function getDimensions(page) {
  return page.evaluate(() => ({ W: window._game.W, H: window._game.H }));
}

async function selectFirstProfile(page) {
  const { W, H } = await getDimensions(page);
  await page.mouse.click(W / 2, H * 0.35);
  await page.waitForTimeout(300);
}

async function goToPhaseSelect(page) {
  await selectFirstProfile(page);
  const { W, H } = await getDimensions(page);
  // LEVEL SELECT button: centred at W/2, H*0.68 + 26 (btnH/2=26)
  await page.mouse.click(W / 2, H * 0.68 + 26);
  await page.waitForTimeout(200);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Profile Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Clear all profile data before each test to ensure a clean slate.
    await page.goto('http://localhost:8080');
    await page.evaluate(() => {
      for (let i = 0; i < 3; i++) {
        localStorage.removeItem(`gw_profile_${i}`);
      }
    });
    // Reload so the game re-initialises with the cleared localStorage.
    await page.reload();
    await page.locator('#c').waitFor({ state: 'visible' });
    await page.waitForTimeout(300);
  });

  // -------------------------------------------------------------------------
  // Test 1
  // -------------------------------------------------------------------------
  test('three profile slots are rendered', async ({ page }) => {
    const state = await page.evaluate(() => window._game?.state);
    expect(state).toBe('profile_select');

    // ProfileManager always keeps an array of exactly 3 slots.
    const length = await page.evaluate(() => window._game?.profiles?.profiles?.length);
    expect(length).toBe(3);
  });

  // -------------------------------------------------------------------------
  // Test 2
  // -------------------------------------------------------------------------
  test('selecting empty slot creates a profile', async ({ page }) => {
    await selectFirstProfile(page);

    const profile = await page.evaluate(() => window._game?.profiles?.get(0));
    expect(profile).not.toBeNull();
    expect(profile.name).toBe('PLAYER 1');
    expect(profile.highScore).toBe(0);
  });

  // -------------------------------------------------------------------------
  // Test 3
  // -------------------------------------------------------------------------
  test('profile data persists across page reloads', async ({ page }) => {
    await selectFirstProfile(page);

    // Artificially set a score and trigger game over so the high score is saved.
    await page.evaluate(() => {
      window._game.score = 9999;
      window._game._gameOver();
    });
    await page.waitForTimeout(100);

    // Reload — the game will re-read localStorage.
    await page.reload();
    await page.locator('#c').waitFor({ state: 'visible' });
    await page.waitForTimeout(300);

    const highScore = await page.evaluate(() => window._game?.profiles?.get(0)?.highScore);
    expect(highScore).toBe(9999);
  });

  // -------------------------------------------------------------------------
  // Test 4
  // -------------------------------------------------------------------------
  test('phase 1 unlocked by default, others locked', async ({ page }) => {
    await selectFirstProfile(page);

    const unlockedPhases = await page.evaluate(
      () => window._game?.profiles?.get(0)?.unlockedPhases
    );
    expect(unlockedPhases).toEqual([true, false, false, false, false]);
  });

  // -------------------------------------------------------------------------
  // Test 5
  // -------------------------------------------------------------------------
  test('level select shows locked phases as non-clickable', async ({ page }) => {
    await goToPhaseSelect(page);

    const stateAfterNav = await page.evaluate(() => window._game?.state);
    expect(stateAfterNav).toBe('phase_select');

    // The phase tiles use a dynamic layout based on viewport; calculate where
    // phase index 1 (the second tile, which is LOCKED) would be.
    // tileH = max(58, min(H*0.1, 75)), gap = tileH + max(10, H*0.015)
    // startY = H * 0.24, phase 1 cy = startY + 1 * gap
    // Click the centre of that tile.
    const { W, H } = await getDimensions(page);
    const lockedTileY = await page.evaluate(({ H }) => {
      const tileH = Math.max(58, Math.min(H * 0.1, 75));
      const gap = tileH + Math.max(10, H * 0.015);
      const startY = H * 0.24;
      // Phase index 1 centre
      return startY + 1 * gap + tileH / 2;
    }, { H });

    await page.mouse.click(W / 2, lockedTileY);
    await page.waitForTimeout(200);

    // Locked tiles have no click zone registered, so the state must remain
    // 'phase_select' and not transition to 'playing'.
    const stateAfterClick = await page.evaluate(() => window._game?.state);
    expect(stateAfterClick).toBe('phase_select');
  });

});
