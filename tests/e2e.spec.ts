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

  /* 2 ▸ stub outbound API calls */
  await page.route(`${API}/project-summary/*`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        project_id: '123',
        project_name: 'Demo Project',
      }),
    })
  );

  await page.route(`${API}/timeline/*`, (route) =>
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
    })
  );

  await page.route(`${API}/send-approval-email`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'ok', token: 'abc' }),
    })
  );

  await page.route(`${API}/download-acta/*`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ url: `${API}/file.pdf` }),
    })
  );

  await page.route(`${API}/extract-project-place/*`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{}',
    })
  );

  /* 3 ▸ Dashboard workflow */
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');

  await page.fill('input[placeholder="1000000061690051"]', '123');

  await Promise.all([
    page.waitForRequest(`${API}/project-summary/123`),
    page.waitForRequest(`${API}/timeline/123`),
    page.getByRole('button', { name: /Retrieve/i }).click(),
  ]);

  await expect(
    page.getByRole('heading', { name: /Demo Project/i })
  ).toBeVisible();
  await expect(page.getByRole('row', { name: /Kickoff/i })).toBeVisible();

  await Promise.all([
    page.waitForRequest(`${API}/download-acta/123?format=pdf`),
    page.getByRole('button', { name: /PDF/i }).click(),
  ]);

  await Promise.all([
    page.waitForRequest(`${API}/send-approval-email`),
    page.getByRole('button', { name: /Generate Acta/i }).click(),
  ]);

  await Promise.all([
    page.waitForRequest(`${API}/extract-project-place/123`),
    page.getByRole('button', { name: /Extract ProjectPlace Data/i }).click(),
  ]);
});
