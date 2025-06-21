import { defineConfig, expect, test } from '@playwright/test';

export default defineConfig({
  use: {
    baseURL: process.env.LIVE_BASE_URL ?? 'http://localhost:4173',
    trace: 'on',
    screenshot: 'only-on-failure',
    ignoreHTTPSErrors: true,
  },
});

test('CloudFront health endpoint returns ok', async ({ request }) => {
  const res = await request.get('/health');
  expect(res.status()).toBe(200);
  await expect(res).toHaveJSON({ status: 'ok' });
});

test('Dashboard happy path', async ({ page }) => {
  await page.goto('/dashboard');
  await page.fill('input[placeholder="1000000061690051"]', '1000000061690051');

  await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes('/project-summary/') && r.status() === 200,
    ),
    page.getByRole('button', { name: /Retrieve/i }).click(),
  ]);

  await expect(
    page.locator('h1', { hasText: 'Project Dashboard' }),
  ).toBeVisible();

  await expect(page.getByRole('button', { name: /^PDF$/ })).toBeEnabled();
  await expect(page.getByRole('button', { name: /Generate Acta/i })).toBeEnabled();
  await expect(
    page.getByRole('button', { name: /Extract ProjectPlace Data/i }),
  ).toBeEnabled();
});
