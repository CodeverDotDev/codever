describe('visit about page', () => {
  it('passes', () => {
    cy.visit('/about');
    const aboutEntryTitleSelector = '[data-test*=about-entry-title]';
    cy.contains(aboutEntryTitleSelector, 'Bookmarking for Developers & Co');
  });
});
