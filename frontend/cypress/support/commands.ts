// ***********************************************
// Custom Cypress commands
// ***********************************************

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Fill out the label verification form
       * @param data Form data
       */
      fillLabelForm(data: {
        brandName: string;
        productType: string;
        alcoholContent: number;
        netContents?: string;
      }): Chainable<void>;

      /**
       * Upload an image file
       * @param fileName File name in fixtures folder
       */
      uploadImage(fileName: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add('fillLabelForm', (data) => {
  if (data.brandName) {
    cy.get('[data-cy="brand-name-input"]').clear().type(data.brandName);
  }
  if (data.productType) {
    cy.get('[data-cy="product-type-input"]').clear().type(data.productType);
  }
  if (data.alcoholContent) {
    cy.get('[data-cy="alcohol-content-input"]').clear().type(data.alcoholContent.toString());
  }
  if (data.netContents) {
    cy.get('[data-cy="net-contents-input"]').clear().type(data.netContents);
  }
});

Cypress.Commands.add('uploadImage', (fileName) => {
  cy.get('[data-cy="file-input"]').selectFile(`cypress/fixtures/${fileName}`, { force: true });
});

export {};
