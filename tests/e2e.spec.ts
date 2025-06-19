import { expect, test } from '@playwright/test';

// Vitest's expect may already define this symbol when running in certain
// environments which leads Playwright's expect to throw "Cannot redefine
// property: Symbol($$jest-matchers-object)". Ensure it's removed before the
// tests start so Playwright can safely register its own expect implementation.
// Delete any existing expect markers added by other test runners so
// Playwright can register its own without conflicts. If the property is
// non-configurable, overwrite it instead of deleting.
const jestSymbol = Symbol.for('$$jest-matchers-object');
const globalObj = globalThis as Record<symbol, unknown>;
if (Object.getOwnPropertyDescriptor(globalObj, jestSymbol)?.configurable) {
  delete globalObj[jestSymbol];
} else {
  globalObj[jestSymbol] = undefined;
}

const API = 'http://localhost:9999';

test('end-to-end workflow', async ({ page }) => {
  await page.addInitScript(() => {
    const auth = {
      signIn: async () => {
        localStorage.setItem('ikusi.jwt', 'mock-token');
        return { username: 'mock-user' };
      },
      currentSession: async () => ({
        getIdToken: () => ({ getJwtToken: () => 'mock-token' }),
      }),
    };
    interface WithAuth extends Window {
      Auth: typeof auth;
    }
    (window as unknown as WithAuth).Auth = auth;
  });
  await page.route(`${API}/project-summary/*`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ project_id: '123', project_name: 'Demo Project' }),
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
  await page.route(`${API}/sendapprovalemail`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'ok', token: 'abc' }),
    })
  );
  await page.route(`${API}/download-acta/*`, (route) =>
    route.fulfill({
      status: 302,
      headers: { location: `${API}/file.pdf` },
    })
  );
  await page.route(`${API}/extract-project-place/*`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{}',
    })
  );

  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Acta Platform' })
  ).toBeVisible();
  await page.locator('input[type="email"]').fill('user@test.com');
  await page.locator('input[type="password"]').fill('secret');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(
    page.evaluate(() => localStorage.getItem('ikusi.jwt'))
  ).resolves.toBe('mock-token');
  await page.goto('/dashboard');
  await page.locator('input[placeholder="1000000061690051"]').fill('123');
  await Promise.all([
    page.waitForRequest(`${API}/project-summary/123`),
    page.waitForRequest(`${API}/timeline/123`),
    page.getByRole('button', { name: 'Retrieve' }).click(),
  ]);

  await expect(
    page.getByRole('heading', { name: /Demo Project/ })
  ).toBeVisible();
  await expect(page.getByRole('row', { name: /Kickoff/ })).toBeVisible();

  await Promise.all([
    page.waitForRequest(`${API}/download-acta/123?format=pdf`),
    page.getByRole('button', { name: /PDF/ }).click(),
  ]);

  await Promise.all([
    page.waitForRequest(`${API}/sendapprovalemail`),
    page.getByRole('button', { name: 'Generate Acta' }).click(),
  ]);

  await Promise.all([
    page.waitForRequest(`${API}/extract-project-place/123`),
    page.getByRole('button', { name: 'Extract ProjectPlace Data' }).click(),
  ]);
});
