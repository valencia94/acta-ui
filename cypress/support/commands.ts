// cypress/support/commands.ts
// Custom Cypress commands

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login programmatically
       * @param email - User email
       * @param password - User password
       */
      loginWithCredentials(email: string, password: string): Chainable<Element>
    }
  }
}

Cypress.Commands.add('loginWithCredentials', (email: string, password: string) => {
  // Since Amplify UI components might be complex to interact with programmatically,
  // we'll use the UI approach but make it more reliable
  cy.get('[data-amplify-authenticator]').should('be.visible')
  
  // Fill in email
  cy.get('input[name="username"], input[type="email"]').first().clear().type(email)
  
  // Fill in password  
  cy.get('input[name="password"], input[type="password"]').first().clear().type(password)
  
  // Submit the form
  cy.get('button[type="submit"], button').contains(/sign in|login/i).click()
  
  // Wait for authentication to complete - either redirect or dashboard appears
  cy.url().should('not.include', '/login')
  cy.get('[data-testid="projects-section"], .project-card, h1').should('be.visible')
})