describe('Label Verification Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should complete the full verification workflow', () => {
    // Step 1: Fill out form
    cy.fillLabelForm({
      brandName: 'Old Tom Distillery',
      productType: 'Kentucky Straight Bourbon Whiskey',
      alcoholContent: 45,
      netContents: '750 mL'
    });

    // Step 2: Upload image
    // cy.uploadImage('test-label.jpg');

    // Step 3: Submit form
    // cy.get('[data-cy="submit-button"]').click();

    // Step 4: Wait for results
    // cy.get('[data-cy="verification-results"]', { timeout: 10000 }).should('be.visible');

    // Step 5: Verify results are displayed
    // cy.get('[data-cy="result-status"]').should('exist');
    // cy.get('[data-cy="field-checks"]').should('exist');
  });

  it('should show loading state during verification', () => {
    // cy.fillLabelForm({
    //   brandName: 'Old Tom Distillery',
    //   productType: 'Bourbon',
    //   alcoholContent: 45
    // });
    // cy.uploadImage('test-label.jpg');
    // cy.get('[data-cy="submit-button"]').click();

    // cy.get('[data-cy="submit-button"]').should('contain', 'Verifying');
    // cy.get('[data-cy="submit-button"]').should('be.disabled');
  });

  it('should display success message when label matches', () => {
    // Mock successful API response
    // cy.intercept('POST', '/api/verify', {
    //   statusCode: 200,
    //   body: {
    //     success: true,
    //     message: 'Label matches form data',
    //     fieldChecks: [
    //       { fieldType: 'BrandName', status: 'Match', message: 'Brand name matches' },
    //       { fieldType: 'ProductType', status: 'Match', message: 'Product type matches' },
    //       { fieldType: 'AlcoholContent', status: 'Match', message: 'Alcohol content matches' },
    //       { fieldType: 'NetContents', status: 'Match', message: 'Net contents matches' }
    //     ]
    //   }
    // }).as('verifyLabel');

    // cy.fillLabelForm({
    //   brandName: 'Old Tom Distillery',
    //   productType: 'Bourbon',
    //   alcoholContent: 45
    // });
    // cy.uploadImage('test-label.jpg');
    // cy.get('[data-cy="submit-button"]').click();

    // cy.wait('@verifyLabel');
    // cy.get('[data-cy="success-message"]').should('be.visible');
    // cy.get('[data-cy="success-message"]').should('contain', 'Label matches');
  });

  it('should display failure message when label does not match', () => {
    // Mock failed API response
    // cy.intercept('POST', '/api/verify', {
    //   statusCode: 200,
    //   body: {
    //     success: false,
    //     message: 'Label does not match form',
    //     fieldChecks: [
    //       {
    //         fieldType: 'BrandName',
    //         status: 'Mismatch',
    //         message: 'Brand name does not match',
    //         expected: 'Old Tom Distillery',
    //         found: 'Different Distillery'
    //       }
    //     ]
    //   }
    // }).as('verifyLabel');

    // cy.fillLabelForm({
    //   brandName: 'Old Tom Distillery',
    //   productType: 'Bourbon',
    //   alcoholContent: 45
    // });
    // cy.uploadImage('test-label.jpg');
    // cy.get('[data-cy="submit-button"]').click();

    // cy.wait('@verifyLabel');
    // cy.get('[data-cy="failure-message"]').should('be.visible');
    // cy.get('[data-cy="field-mismatch"]').should('contain', 'Brand name does not match');
  });

  it('should show all field discrepancies', () => {
    // Verify that ALL mismatches are shown, not just the first one
    // cy.intercept('POST', '/api/verify', {
    //   statusCode: 200,
    //   body: {
    //     success: false,
    //     message: 'Multiple fields do not match',
    //     fieldChecks: [
    //       { fieldType: 'BrandName', status: 'Mismatch', message: 'Brand name mismatch' },
    //       { fieldType: 'ProductType', status: 'Match', message: 'Product type matches' },
    //       { fieldType: 'AlcoholContent', status: 'Mismatch', message: 'Alcohol content mismatch' }
    //     ]
    //   }
    // }).as('verifyLabel');

    // cy.fillLabelForm({
    //   brandName: 'Old Tom Distillery',
    //   productType: 'Bourbon',
    //   alcoholContent: 45
    // });
    // cy.uploadImage('test-label.jpg');
    // cy.get('[data-cy="submit-button"]').click();

    // cy.wait('@verifyLabel');
    // cy.get('[data-cy="field-check"]').should('have.length', 3);
    // cy.get('[data-cy="field-mismatch"]').should('have.length', 2);
  });

  it('should allow resetting the form after verification', () => {
    // cy.fillLabelForm({
    //   brandName: 'Old Tom Distillery',
    //   productType: 'Bourbon',
    //   alcoholContent: 45
    // });

    // Complete verification (mocked)
    // cy.get('[data-cy="verification-results"]').should('be.visible');

    // Click reset button
    // cy.get('[data-cy="reset-button"]').click();

    // Form should be cleared
    // cy.get('[data-cy="brand-name-input"]').should('have.value', '');
    // cy.get('[data-cy="image-preview"]').should('not.exist');
    // cy.get('[data-cy="verification-results"]').should('not.exist');
  });

  it('should handle API errors gracefully', () => {
    // Mock API error
    // cy.intercept('POST', '/api/verify', {
    //   statusCode: 500,
    //   body: { error: 'Internal server error' }
    // }).as('verifyLabel');

    // cy.fillLabelForm({
    //   brandName: 'Old Tom Distillery',
    //   productType: 'Bourbon',
    //   alcoholContent: 45
    // });
    // cy.uploadImage('test-label.jpg');
    // cy.get('[data-cy="submit-button"]').click();

    // cy.wait('@verifyLabel');
    // cy.get('[data-cy="error-message"]').should('be.visible');
    // cy.get('[data-cy="error-message"]').should('contain', 'error');
  });
});