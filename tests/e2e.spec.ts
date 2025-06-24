// tests/e2e.spec.ts
import { expect, test } from '@playwright/test';

const API = process.env.MOCK_API ?? 'http://localhost:9999';
test.setTimeout(60_000); // generous head-room for CI

test('end-to-end workflow', async ({ page }) => {
  /* 1 ▸ stub Amplify Auth + seed token */
  await page.addInitScript(() => {
    const auth = {
      signIn: async () => ({ username: 'mock-user' }),
      currentSession: async () => ({
        getIdToken: () => ({ getJwtToken: () => 'mock-token' }),
      }),
    };
    (window as unknown as { Auth: typeof auth }).Auth = auth;
    localStorage.setItem('ikusi.jwt', 'mock-token');
  });

  // Auth is bypassed in CI (VITE_SKIP_AUTH=true); no JWT assertion needed.

  /* 2 ▸ stub outbound API calls */
  await page.route(
    `${API}/project-summary/*`,
    (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          project_id: '123',
          project_name: 'Demo Project',
        }),
      }),
    { times: 1 }
  );

  await page.route(
    `${API}/timeline/*`,
    (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            hito: 'Kickoff',
            actividades: 'Setup',
            desarrollo: 'Init',
            fecha: '2024-01-01',
          },
        ]),
      }),
    { times: 1 }
  );

  await page.route(
    `${API}/send-approval-email`,
    (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'ok', token: 'abc' }),
      }),
    { times: 1 }
  );

  await page.route(
    `${API}/download-acta/*`,
    (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: `${API}/file.pdf` }),
      }),
    { times: 1 }
  );

  await page.route(
    `${API}/extract-project-place/*`,
    (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{}',
      }),
    { times: 1 }
  );

  /* 3 ▸ Dashboard workflow */
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');

  await expect(page.locator('img[alt="Ikusi logo"]')).toBeVisible();

  await Promise.all([
    page.waitForRequest(/download-acta/),
    page.getByRole('button', { name: /Download \(.pdf\)/i }).click(),
  ]);

  await Promise.all([
    page.waitForRequest(`${API}/send-approval-email`),
    page.getByRole('button', { name: /Generate Acta/i }).click(),
  ]);

  await Promise.all([
    page.waitForRequest(/extract-project-place/),
    page.getByRole('button', { name: /Extract ProjectPlace Data/i }).click(),
  ]);
});
