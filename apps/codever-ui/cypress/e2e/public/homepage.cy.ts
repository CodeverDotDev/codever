describe('visit home page', () => {
  it('passes', () => {
    const loginRegisterBtn = '[data-test*=login-register-btn]';
    cy.visit('/');
    cy.contains(loginRegisterBtn, 'Login / Register');
    cy.contains('div.mat-tab-label-content', 'Feed');

    // select "History" tab
    cy.contains('div.mat-tab-label-content', 'History').click();
    cy.contains('[data-test*=history-tab-alert]', 'History');

    // select "Pinned" tab
    cy.contains('div.mat-tab-label-content', 'Pinned').click();
    cy.contains('[data-test*=pinned-tab-alert]', 'Pinned');

    // select "Read Later" tab
    cy.contains('div.mat-tab-label-content', 'Read Later').click();
    cy.contains('[data-test*=readlater-tab-alert]', 'Read Later');
  });
});
