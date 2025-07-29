// tests/e2e.smoke.spec.ts
import { expect, test } from "@playwright/test";

const API = process.env.MOCK_API ?? "http://localhost:9999";
test.setTimeout(90_000); // Extended timeout for smoke tests

test.describe("End-to-End Smoke Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Setup auth bypass for testing
    await page.addInitScript(() => {
      // Mock Amplify Auth
      const auth = {
        signIn: async () => ({ username: "test-user@ikusi.com" }),
        currentSession: async () => ({
          getIdToken: () => ({ getJwtToken: () => "mock-jwt-token" }),
        }),
        fetchAuthSession: async () => ({
          tokens: {
            idToken: { toString: () => "mock-jwt-token" }
          }
        }),
      };
      (window as any).Auth = auth;
      localStorage.setItem("ikusi.jwt", "mock-jwt-token");
    });

    // Mock API responses for consistent testing
    await page.route(`${API}/projects-by-pm/*`, route => 
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "123",
            name: "Test Project Alpha",
            pm: "test-user@ikusi.com",
            status: "READY"
          },
          {
            id: "456", 
            name: "Test Project Beta",
            pm: "test-user@ikusi.com", 
            status: "IN PROGRESS"
          }
        ])
      })
    );

    await page.route(`${API}/extract-project-place/*`, route =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          project_id: "123",
          project_name: "Test Project Alpha",
          pm: "test-user@ikusi.com"
        })
      })
    );

    await page.route(`${API}/send-approval-email`, route =>
      route.fulfill({
        status: 200,
        contentType: "application/json", 
        body: JSON.stringify({ 
          message: "Approval email sent successfully",
          token: "approval-token-123"
        })
      })
    );

    await page.route(`${API}/download-acta/*`, route =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ 
          url: `${API}/sample-acta.pdf`
        })
      })
    );
  });

  test("Complete workflow: Login → Dashboard → Select Project → Generate ACTA → Success", async ({ page }) => {
    // 1. Navigate to application
    await page.goto("/");
    
    // Should redirect to dashboard since auth is bypassed
    await expect(page).toHaveURL(/\/dashboard/);
    
    // 2. Verify dashboard loads with header
    await expect(page.locator('img[alt="Ikusi logo"]')).toBeVisible();
    await expect(page.locator('text=Welcome back')).toBeVisible();
    
    // 3. Wait for projects to load
    await page.waitForSelector('[data-testid="projects-section"]', { timeout: 10000 });
    
    // 4. Verify projects are displayed with status badges
    await expect(page.locator('text=Test Project Alpha')).toBeVisible();
    await expect(page.locator('text=Test Project Beta')).toBeVisible();
    
    // Verify status badges are present
    await expect(page.locator('.bg-green-100')).toBeVisible(); // READY status
    await expect(page.locator('.bg-amber-100')).toBeVisible(); // IN PROGRESS status
    
    // 5. Select a project
    await page.click('text=Test Project Alpha');
    
    // 6. Verify buttons are enabled after selection
    const generateButton = page.getByRole("button", { name: /Generate/i });
    const sendApprovalButton = page.getByRole("button", { name: /Send Approval/i });
    const downloadButton = page.getByRole("button", { name: /PDF/i });
    
    await expect(generateButton).toBeEnabled();
    await expect(sendApprovalButton).toBeEnabled();
    await expect(downloadButton).toBeEnabled();
    
    // 7. Generate ACTA document
    await Promise.all([
      page.waitForRequest(/extract-project-place/),
      generateButton.click()
    ]);
    
    // 8. Verify success toast appears
    await expect(page.locator('text=ACTA generation started')).toBeVisible({ timeout: 5000 });
    
    // 9. Test Send for Approval flow
    await sendApprovalButton.click();
    
    // Fill in email dialog
    await expect(page.locator('text=Send Approval Request')).toBeVisible();
    await page.fill('input[placeholder*="email"]', 'client@company.com');
    
    await Promise.all([
      page.waitForRequest(/send-approval-email/),
      page.getByRole("button", { name: /Send/i }).click()
    ]);
    
    // 10. Verify approval success toast
    await expect(page.locator('text=Approval email sent successfully')).toBeVisible({ timeout: 5000 });
    
    console.log("✅ Smoke test completed successfully: Full workflow validated");
  });

  test("Admin Dashboard Access and Bulk Generation", async ({ page }) => {
    // Setup admin user
    await page.addInitScript(() => {
      localStorage.setItem("ikusi.jwt", "admin-jwt-token");
      (window as any).userEmail = "admin@ikusi.com";
    });

    // Mock admin-specific API responses
    await page.route(`${API}/projects`, route =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { project_id: "100", project_name: "Admin Project 1", pm: "pm1@ikusi.com" },
          { project_id: "200", project_name: "Admin Project 2", pm: "pm2@ikusi.com" },
          { project_id: "300", project_name: "Admin Project 3", pm: "pm3@ikusi.com" }
        ])
      })
    );

    await page.route(`${API}/generate-summaries-for-pm/*`, route =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: ["100", "200"],
          failed: ["300"],
          message: "Bulk generation completed"
        })
      })
    );

    // 1. Navigate to admin dashboard
    await page.goto("/admin");
    
    // 2. Verify admin access
    await expect(page.locator('text=Admin Dashboard')).toBeVisible();
    await expect(page.locator('text=System administration')).toBeVisible();
    
    // 3. Verify admin stats are displayed
    await expect(page.locator('text=Total Projects')).toBeVisible();
    await expect(page.locator('text=Active Users')).toBeVisible();
    await expect(page.locator('text=Completed Actas')).toBeVisible();
    
    // 4. Test bulk generation if available
    const bulkGenerateButton = page.locator('text=Generate All Actas');
    if (await bulkGenerateButton.isVisible()) {
      await Promise.all([
        page.waitForRequest(/generate-summaries-for-pm/),
        bulkGenerateButton.click()
      ]);
      
      // 5. Verify bulk generation success/failure toast
      await expect(page.locator('text=Success: 2, Failed: 1')).toBeVisible({ timeout: 10000 });
    }
    
    console.log("✅ Admin dashboard smoke test completed successfully");
  });

  test("Error Handling and Retry Functionality", async ({ page }) => {
    // Mock API error responses
    await page.route(`${API}/projects-by-pm/*`, route =>
      route.fulfill({ status: 500, body: "Internal Server Error" })
    );

    await page.goto("/dashboard");
    
    // Wait for error state
    await expect(page.locator('text=Our servers are experiencing issues')).toBeVisible({ timeout: 10000 });
    
    // Test retry functionality
    const retryButton = page.getByRole("button", { name: /Retry/i });
    await expect(retryButton).toBeVisible();
    
    // Mock successful response for retry
    await page.route(`${API}/projects-by-pm/*`, route =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { id: "123", name: "Retry Test Project", pm: "test@ikusi.com", status: "READY" }
        ])
      })
    );
    
    await retryButton.click();
    
    // Verify successful retry
    await expect(page.locator('text=Retry Test Project')).toBeVisible({ timeout: 5000 });
    
    console.log("✅ Error handling and retry smoke test completed successfully");
  });
});