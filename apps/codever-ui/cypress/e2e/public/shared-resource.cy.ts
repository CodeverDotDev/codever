describe('Shared resource public page and referrer privacy', () => {
  it('establishes document-level no-referrer protection on direct shared bookmark load', () => {
    cy.intercept('GET', '/api/public/bookmarks/shared/test-token-123', {
      statusCode: 200,
      body: {
        _id: 'b123',
        name: 'Shared Bookmark Title',
        location: 'https://example.com/target',
        tags: ['sharing', 'privacy'],
      },
    }).as('getSharedBookmark');

    cy.visit('/bookmarks/shared/test-token-123');
    cy.wait('@getSharedBookmark');

    // Document-level meta tag must be present
    cy.get('meta[name="referrer"]')
      .should('exist')
      .should('have.attr', 'content', 'no-referrer');

    // Content is displayed read-only
    cy.contains('Shared Bookmark Title').should('be.visible');
    cy.contains('https://example.com/target').should('be.visible');
  });

  it('establishes document-level no-referrer on client-side navigation to shared note, and removes when leaving', () => {
    cy.intercept('GET', '/api/public/notes/shared/note-token-456', {
      statusCode: 200,
      body: {
        _id: 'n456',
        title: 'Shared Note Title',
        content: '# Note Heading\nShared content details.',
        contentType: 'markdown',
      },
    }).as('getSharedNote');

    // Start on another public page
    cy.visit('/about');
    cy.get('meta#shared-resource-referrer-policy').should('not.exist');

    // Navigate to shared note
    cy.visit('/notes/shared/note-token-456');
    cy.wait('@getSharedNote');

    cy.get('meta#shared-resource-referrer-policy')
      .should('exist')
      .should('have.attr', 'content', 'no-referrer');
    cy.contains('Shared Note Title').should('be.visible');

    // Navigate away to about page
    cy.visit('/about');
    cy.get('meta#shared-resource-referrer-policy').should('not.exist');
  });

  it('displays unavailable message for 404/revoked token', () => {
    cy.intercept('GET', '/api/public/bookmarks/shared/invalid-or-revoked', {
      statusCode: 404,
      body: { message: 'Not found' },
    }).as('getNotFound');

    cy.visit('/bookmarks/shared/invalid-or-revoked');
    cy.wait('@getNotFound');

    cy.contains('This link is unavailable.').should('be.visible');
  });
});
