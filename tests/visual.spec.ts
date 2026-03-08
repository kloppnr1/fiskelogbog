import { test, expect } from '@playwright/test';

test.describe('Fiskevejr visual regression suite', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for API data to load (FCOO/DMI/Yr.no)
    // Wait until trend data appears (Vandtemp row with temperature values)
    await page.waitForFunction(
      () => document.body.innerText.includes('Vandtemp'),
      { timeout: 20000 }
    );
    // Extra settle time for all graphs/sections to render
    await page.waitForTimeout(3000);
  });

  test('screenshots captured for human review', async ({ page }, testInfo) => {
    const vp = testInfo.project.name;

    // Full-page screenshot
    await page.screenshot({
      path: `tests/screenshots/fiskevejr-${vp}.png`,
      fullPage: true,
    });

    // Section screenshot of Fiskevejr area
    const fiskevejrSection = page.locator('text=FISKEVEJR').first();
    if (await fiskevejrSection.isVisible()) {
      await fiskevejrSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: `tests/screenshots/fiskevejr-${vp}-section.png`,
        fullPage: false,
      });
    }
  });

  test('5 essential graphs visible', async ({ page }) => {
    // Each graph row has a label: Vandtemp, Strøm, Vandstand, Vind, Skydække
    const graphLabels = ['Vandtemp', 'Vandstand', 'Vind'];
    for (const label of graphLabels) {
      const el = page.getByText(label, { exact: true }).first();
      await expect(el).toBeVisible({ timeout: 5000 });
    }
    // Strøm and Skydække may use Danish special chars - use flexible matching
    const stromEl = page.getByText(/Str[øo]m/i).first();
    await expect(stromEl).toBeVisible({ timeout: 5000 });

    const cloudEl = page.getByText(/Skyd[æa]kke/i).first();
    await expect(cloudEl).toBeVisible({ timeout: 5000 });
  });

  test('value labels readable in trend rows', async ({ page }) => {
    // Each trend row shows numeric values (e.g., "3°C", "-17 cm", "0.5 m/s", "69%")
    // Verify at least temperature values appear
    const tempValues = page.getByText(/\d+°C/).first();
    await expect(tempValues).toBeVisible({ timeout: 5000 });

    // Verify wind speed values
    const windValues = page.getByText(/[\d.]+ m\/s/).first();
    await expect(windValues).toBeVisible({ timeout: 5000 });

    // Verify water level values (cm)
    const levelValues = page.getByText(/[+-]?\d+ cm/).first();
    await expect(levelValues).toBeVisible({ timeout: 5000 });

    // Verify cloud percentage
    const cloudValues = page.getByText(/\d+%/).first();
    await expect(cloudValues).toBeVisible({ timeout: 5000 });
  });

  test('direction indicators visible for wind and current', async ({ page }) => {
    // Wind and current rows contain compass directions (S, N, SV, NV, SØ, NØ, Ø, V)
    // Check that at least some direction text appears in page content
    const bodyText = await page.evaluate(() => document.body.innerText);

    // Match compass directions followed by space or newline in trend context
    const directionPattern = /\b[NSØV]{1,2}\b/g;
    const matches = bodyText.match(directionPattern);
    expect(matches).toBeTruthy();
    expect(matches!.length).toBeGreaterThan(5);
  });

  test('I DAG marker visible (now indicator)', async ({ page }) => {
    // The site uses "I DAG" as the current-day marker in the trend grid
    const idagMarker = page.getByText('I DAG', { exact: true }).first();
    await expect(idagMarker).toBeVisible({ timeout: 5000 });
  });

  test('sun times displayed with values', async ({ page }) => {
    // Solopgang (sunrise) should be visible with a time
    const sunrise = page.getByText('Solopgang').first();
    await expect(sunrise).toBeVisible({ timeout: 5000 });

    // Solnedgang (sunset) should be visible with a time
    const sunset = page.getByText('Solnedgang').first();
    await expect(sunset).toBeVisible({ timeout: 5000 });

    // Verify time values exist (HH:MM format)
    const bodyText = await page.evaluate(() => document.body.innerText);
    const timePattern = /\d{1,2}:\d{2}/g;
    const times = bodyText.match(timePattern);
    expect(times).toBeTruthy();
    expect(times!.length).toBeGreaterThanOrEqual(3); // sunrise, midday, sunset
  });

  test('no horizontal overflow (layout not broken)', async ({ page }) => {
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.body.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
  });

  test('11 fishing spots listed', async ({ page }) => {
    // "DINE FISKESPOTS" heading
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText).toContain('DINE FISKESPOTS');

    // All 11 spot names (using actual names from data/spots.ts)
    const spotNames = [
      'Grønne Fyr',
      'Marselisborg',
      'Norsminde',
      'Ballehage',
      'Moesgaard',
      'Kysing Næs',
      'Skæring',
      'Kalø Vig',
      'Dyngby',
      'Ørnereden',
      'Brabrand Sø',
    ];

    for (const spot of spotNames) {
      expect(bodyText, `Missing spot: ${spot}`).toContain(spot);
    }
  });

  test('graph labels not cut off (left labels within viewport)', async ({ page }) => {
    // Verify graph label elements are within viewport bounds
    const labelPositions = await page.evaluate(() => {
      const labels = ['Vandtemp', 'Vandstand', 'Vind'];
      const results: Array<{ label: string; left: number; visible: boolean }> = [];
      document.querySelectorAll('*').forEach(el => {
        const text = el.textContent?.trim();
        if (text && labels.includes(text) && el.children.length === 0) {
          const rect = el.getBoundingClientRect();
          results.push({
            label: text,
            left: rect.left,
            visible: rect.left >= 0 && rect.right <= window.innerWidth + 5,
          });
        }
      });
      return results;
    });

    expect(labelPositions.length).toBeGreaterThan(0);
    for (const pos of labelPositions) {
      expect(pos.left, `Label "${pos.label}" is cut off (left: ${pos.left})`).toBeGreaterThanOrEqual(-2);
    }
  });

});
