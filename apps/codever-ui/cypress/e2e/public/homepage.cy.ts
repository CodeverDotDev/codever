describe('visit home page', () => {
  it('redirects the root and navigates between landing pages', () => {
    cy.visit('/');
    cy.location('pathname').should('eq', '/feed');
    cy.contains('[data-test*=login-register-btn]', 'Login / Register');
    cy.contains('a[mat-tab-link]', 'Feed');

    cy.contains('a[mat-tab-link]', 'History').click();
    cy.location('pathname').should('eq', '/history');
    cy.contains('[data-test*=history-tab-alert]', 'History');

    cy.contains('a[mat-tab-link]', 'Pinned').click();
    cy.location('pathname').should('eq', '/pinned');
    cy.contains('[data-test*=pinned-tab-alert]', 'Pinned');

    cy.contains('a[mat-tab-link]', 'Read Later').click();
    cy.location('pathname').should('eq', '/read-later');
    cy.contains('[data-test*=readlater-tab-alert]', 'Read Later');
  });

  it('redirects legacy landing URLs', () => {
    cy.visit('/?tab=pinned');
    cy.location('pathname').should('eq', '/pinned');

    cy.visit('/readlater');
    cy.location('pathname').should('eq', '/read-later');

    cy.visit('/public/history');
    cy.location('pathname').should('eq', '/history');
  });

  it('does not redirect stale favorites and watched-tags paths', () => {
    cy.visit('/favorites');
    cy.location('pathname').should('eq', '/favorites');

    cy.visit('/watched-tags');
    cy.location('pathname').should('eq', '/watched-tags');
  });
});
