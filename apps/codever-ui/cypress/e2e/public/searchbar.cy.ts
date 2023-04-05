describe('visit home page', () => {
  it('passes', () => {
    cy.visit('/');
    // if(cy.window().its('innerWidth')
    cy.get('[data-test*=search-selection-dropdown-small]').click();
    // cy.get('[data-test*=public-bookmarks-selection-check]').click();
  });
});
