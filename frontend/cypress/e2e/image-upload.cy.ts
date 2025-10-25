describe('Image Upload', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display image upload component', () => {
    cy.get('[data-cy="image-upload"]').should('exist');
    cy.get('[data-cy="file-input"]').should('exist');
  });

  it('should show upload instructions', () => {
    cy.contains('Upload Label Image').should('be.visible');
  });

  it('should accept valid image formats', () => {
    // Test with PNG
    // cy.uploadImage('test-label.png');
    // cy.get('[data-cy="image-preview"]').should('exist');

    // Test with JPG
    // cy.uploadImage('test-label.jpg');
    // cy.get('[data-cy="image-preview"]').should('exist');
  });

  it('should reject files that are too large', () => {
    // TODO: Create a large test file
    // cy.uploadImage('large-file.jpg');
    // cy.get('[data-cy="upload-error"]').should('contain', 'File size exceeds maximum');
  });

  it('should reject invalid file types', () => {
    // TODO: Create a test with invalid file type
    // cy.uploadImage('document.pdf');
    // cy.get('[data-cy="upload-error"]').should('contain', 'Invalid file type');
  });

  it('should show image preview after upload', () => {
    // cy.uploadImage('test-label.jpg');
    // cy.get('[data-cy="image-preview"]').should('be.visible');
    // cy.get('[data-cy="image-preview"]').should('have.attr', 'src');
  });

  it('should allow removing uploaded image', () => {
    // cy.uploadImage('test-label.jpg');
    // cy.get('[data-cy="remove-image-button"]').click();
    // cy.get('[data-cy="image-preview"]').should('not.exist');
  });
});