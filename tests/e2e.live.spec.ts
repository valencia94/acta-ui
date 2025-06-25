import { expect, test } from '@playwright/test';

test.use({
  baseURL: process.env.LIVE_BASE_URL ?? 'http://localhost:4173',
  trace: 'on',
  screenshot: 'only-on-failure',
  ignoreHTTPSErrors: true,
});

test('CloudFront health endpoint returns ok', async ({ request }) => {
  const base =
    process.env.LIVE_BASE_URL ??
    (test.info().config.baseURL || 'http://localhost:4173');
  const res = await request.get(`${base}/health`);
  expect(res.status()).toBe(200);
  await expect(res).toHaveJSON({ status: 'ok' });
});

test('Dashboard happy path', async ({ page }) => {
  await page.goto('/dashboard');

  await expect(page.locator('img[alt="Ikusi logo"]')).toBeVisible();
  await page.fill('#projectId', '123');

  await expect(
    page.getByRole('button', { name: /Generate Acta/i })
  ).toBeEnabled();
  await expect(
    page.getByRole('button', { name: /Send for Approval/i })
  ).toBeEnabled();
  await expect(
    page.getByRole('button', { name: /Download \(.pdf\)/i })
  ).toBeEnabled();
});
