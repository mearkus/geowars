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

async function selectProfile(page) {
  const { W, H } = await getDimensions(page);
  await page.mouse.click(W / 2, H * 0.35);
  await page.waitForTimeout(300);
}

async function startPlaying(page) {
  await selectProfile(page);
  const { W, H } = await getDimensions(page);
  await page.mouse.click(W / 2, H * 0.58);
  await page.waitForTimeout(500);
}

// ---------------------------------------------------------------------------
// Tests — run on all projects including mobile viewports
// ---------------------------------------------------------------------------

test.describe('Mobile Controls Tests', () => {

  test.beforeEach(async ({ page }) => {
    await loadGame(page);
  });

  // -------------------------------------------------------------------------
  // Test 1
  // -------------------------------------------------------------------------
  test('canvas fills the viewport', async ({ page }) => {
    const viewportSize = page.viewportSize();
    const canvasRect = await page.locator('#c').boundingBox();

    expect(canvasRect).not.toBeNull();
    // The canvas is set to window.innerWidth / innerHeight in resize().
    // Allow a small tolerance for sub-pixel / safe-area differences.
    expect(canvasRect.width).toBeGreaterThan(0);
    expect(canvasRect.height).toBeGreaterThan(0);

    if (viewportSize) {
      expect(Math.abs(canvasRect.width - viewportSize.width)).toBeLessThanOrEqual(2);
      expect(Math.abs(canvasRect.height - viewportSize.height)).toBeLessThanOrEqual(2);
    }
  });

  // -------------------------------------------------------------------------
  // Test 2
  // -------------------------------------------------------------------------
  test('touch on left half creates left joystick', async ({ page }) => {
    // Touch joysticks only activate during 'playing' state.
    await startPlaying(page);

    const { W, H } = await getDimensions(page);

    // Tap the left side; the InputManager assigns touches whose clientX < W/2
    // (mapped to canvas coords) as the left stick.
    await page.touchscreen.tap(W * 0.25, H * 0.65);
    await page.waitForTimeout(150);

    const leftStickActive = await page.evaluate(
      () => window._game?.input?.leftStick?.id !== null
    );
    expect(leftStickActive).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Test 3
  // -------------------------------------------------------------------------
  test('touch on right half creates right joystick', async ({ page }) => {
    await startPlaying(page);

    const { W, H } = await getDimensions(page);

    await page.touchscreen.tap(W * 0.75, H * 0.75);
    await page.waitForTimeout(150);

    const rightStickActive = await page.evaluate(
      () => window._game?.input?.rightStick?.id !== null
    );
    expect(rightStickActive).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Test 4
  // -------------------------------------------------------------------------
  test('long press on profile card triggers rename', async ({ page }) => {
    const { W, H } = await getDimensions(page);
    // First card centre ≈ W/2, H*0.35
    const cardX = W / 2;
    const cardY = H * 0.35;

    await page.mouse.move(cardX, cardY);
    await page.mouse.down();
    await page.waitForTimeout(600);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // After a long press the game calls _startRename() which sets
    // nameInput.style.display = 'block'.
    const display = await page.evaluate(
      () => window.getComputedStyle(document.getElementById('nameInput')).display
    );
    expect(display).toBe('block');
  });

  // -------------------------------------------------------------------------
  // Test 5
  // -------------------------------------------------------------------------
  test('input element is hidden by default', async ({ page }) => {
    // The CSS rule sets #nameInput { display: none } and the game never shows
    // it until a long-press rename is triggered.
    const nameInput = page.locator('#nameInput');
    await expect(nameInput).toBeAttached();

    const display = await page.evaluate(
      () => window.getComputedStyle(document.getElementById('nameInput')).display
    );
    expect(display).toBe('none');
  });

  // -------------------------------------------------------------------------
  // Test 6
  // -------------------------------------------------------------------------
  test('viewport-fit meta tag is present', async ({ page }) => {
    const content = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(content).toContain('viewport-fit=cover');
  });

});
