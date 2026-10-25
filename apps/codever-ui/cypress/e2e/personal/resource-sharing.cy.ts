describe('Resource sharing management (Shared by me)', () => {
  beforeEach(() => {
    cy.kcLogin('mock', 'mock');
  });

  it('displays active shared links on the Shared by me page', () => {
    cy.intercept('GET', '/api/personal/users/*/share-links?page=1&limit=55', {
      statusCode: 200,
      body: {
        items: [
          {
            shareLinkId: 'sl-1',
            resourceType: 'bookmark',
            resourceId: 'b-1',
            title: 'My Shared Bookmark',
            public: false,
            createdAt: '2026-10-24T12:00:00.000Z',
          },
          {
            shareLinkId: 'sl-2',
            resourceType: 'note',
            resourceId: 'n-1',
            title: 'My Shared Note',
            public: true,
            createdAt: '2026-10-24T13:00:00.000Z',
          },
        ],
        page: 1,
        limit: 55,
        total: 2,
      },
    }).as('getSharedLinks');

    cy.visit('/dashboard/shared');
    cy.wait('@getSharedLinks');

    cy.contains('h2', 'Shared by me').should('be.visible');
    cy.contains('My Shared Bookmark').should('be.visible');
    cy.contains('My Shared Note').should('be.visible');
    cy.contains('Public').should('be.visible');
  });

  it('allows stopping sharing from dashboard', () => {
    cy.intercept('GET', '/api/personal/users/*/share-links?page=1&limit=55', {
      statusCode: 200,
      body: {
        items: [
          {
            shareLinkId: 'sl-1',
            resourceType: 'bookmark',
            resourceId: 'b-1',
            title: 'Shared Bookmark To Revoke',
            public: false,
            createdAt: '2026-10-24T12:00:00.000Z',
          },
        ],
        page: 1,
        limit: 55,
        total: 1,
      },
    }).as('getSharedLinks');

    cy.intercept('DELETE', '/api/personal/users/*/share-links/sl-1', {
      statusCode: 204,
    }).as('deleteShareLink');

    cy.visit('/dashboard/shared');
    cy.wait('@getSharedLinks');

    // Mock the refresh after delete
    cy.intercept('GET', '/api/personal/users/*/share-links?page=1&limit=55', {
      statusCode: 200,
      body: {
        items: [],
        page: 1,
        limit: 55,
        total: 0,
      },
    }).as('getRefreshedLinks');

    cy.contains('button', 'Stop sharing').click();
    cy.get('app-stop-sharing-dialog').should('be.visible');
    cy.get('app-stop-sharing-dialog')
      .contains('button', 'Stop sharing')
      .click();
    cy.wait('@deleteShareLink');
    cy.wait('@getRefreshedLinks');

    cy.contains('You do not have any active share links.').should('be.visible');
  });

  afterEach(() => {
    cy.kcLogout();
  });
});
