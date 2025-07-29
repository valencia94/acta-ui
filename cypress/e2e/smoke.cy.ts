// cypress/e2e/smoke.cy.ts
// Smoke test to verify core dashboard functionality

describe('Dashboard Smoke Test', () => {
  const email = Cypress.env('CYPRESS_EMAIL') || 'test@example.com'
  const password = Cypress.env('CYPRESS_PW') || 'testpassword'

  beforeEach(() => {
    // Ensure we start fresh
    cy.clearCookies()
    cy.clearLocalStorage()
    cy.window().then((win) => {
      win.sessionStorage.clear()
    })
  })

  it('should log in and display project cards', () => {
    // 1. Visit /login
    cy.visit('/login')
    cy.url().should('include', '/login')

    // 2. Programmatically log in with CYPRESS_EMAIL / CYPRESS_PW
    cy.loginWithCredentials(email, password)

    // 3. Confirm .project-card count > 0 within 10 s
    cy.get('.project-card', { timeout: 10000 })
      .should('have.length.greaterThan', 0)

    // Additional verification: ensure dashboard elements are present
    cy.get('[data-testid="projects-section"]').should('be.visible')
    cy.contains('Your Projects').should('be.visible')
    
    // Verify we're on the dashboard
    cy.url().should('include', '/dashboard')
  })

  it('should handle retry functionality after project load failure', () => {
    // This test verifies the retry button functionality
    cy.visit('/login')
    cy.loginWithCredentials(email, password)

    // If there's an error state, test retry functionality
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Retry")').length > 0) {
        // If retry button is present, click it
        cy.get('button:contains("Retry")').should('be.visible').click()
        
        // Verify loading state
        cy.get('button:contains("Retrying...")').should('be.visible')
        
        // Wait for retry to complete (success or failure)
        cy.get('button:contains("Retrying...")', { timeout: 10000 }).should('not.exist')
      }
    })

    // Verify final state has projects or proper error handling
    cy.get('.project-card', { timeout: 10000 }).should('exist')
  })
})