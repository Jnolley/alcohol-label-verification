describe('Label Form Validation', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display the form on page load', () => {
    cy.get('h1').should('contain', 'TTB Label Verification');
    cy.get('[data-cy="brand-name-input"]').should('exist');
    cy.get('[data-cy="product-type-input"]').should('exist');
    cy.get('[data-cy="alcohol-content-input"]').should('exist');
    cy.get('[data-cy="net-contents-value-input"]').should('exist');
    cy.get('[data-cy="net-contents-unit-select"]').should('exist');
  });

  it('should show validation errors for required fields', () => {
    //Submit without filling form
    cy.get('[data-cy="submit-button"]').should('be.disabled');
  });

  it('should enable submit button when form is valid and image is uploaded', () => {
    cy.fillLabelForm({
      brandName: 'Old Tom Distillery',
      productType: 'Kentucky Straight Bourbon Whiskey',
      alcoholContent: 45,
      netContentsValue: 750,
      netContentsUnit: 'ml'
    });

    // Submit should still be disabled without image
    cy.get('[data-cy="submit-button"]').should('be.disabled');

    // Upload image (will need a test image)
    // cy.uploadImage('test-label.jpg');

    // Submit should now be enabled
    // cy.get('[data-cy="submit-button"]').should('not.be.disabled');
  });

  it('should validate alcohol content range', () => {
    cy.get('[data-cy="alcohol-content-input"]').type('-5');
    cy.get('[data-cy="alcohol-content-input"]').should('have.class', 'ng-invalid');

    cy.get('[data-cy="alcohol-content-input"]').clear().type('150');
    cy.get('[data-cy="alcohol-content-input"]').should('have.class', 'ng-invalid');

    cy.get('[data-cy="alcohol-content-input"]').clear().type('45');
    cy.get('[data-cy="alcohol-content-input"]').should('have.class', 'ng-valid');
  });

  it('should allow optional net contents field to be empty', () => {
    cy.fillLabelForm({
      brandName: 'Old Tom Distillery',
      productType: 'Bourbon',
      alcoholContent: 45
    });

    // Net contents is optional, form should still be valid
    cy.get('[data-cy="net-contents-value-input"]').should('not.have.class', 'ng-invalid');
  });
});