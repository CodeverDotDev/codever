describe('Dashboard personal page', () => {
  beforeEach(() => {
    cy.kcLogin('mock', 'mock');
  });

  describe('My Bookmarks page', () => {
    it('test sorting via button group', () => {
      cy.intercept(
        {
          method: 'GET',
          url: '**/api/personal/users/*/bookmarks*',
          query: { orderBy: 'LAST_CREATED' },
        },
        {
          fixture:
            'personal/dashboard/dashboard-my-bookmarks-latest-created.json',
        }
      ).as('getLastCreatedBookmarks');
      cy.intercept(
        {
          method: 'GET',
          url: '**/api/personal/users/*/bookmarks*',
          query: { orderBy: 'MOST_USED' },
        },
        {
          fixture: 'personal/dashboard/dashboard-my-bookmarks-most-visited.json',
        }
      ).as('getMostUsedBookmarks');

      cy.visit('/dashboard/bookmarks');
      cy.wait('@getLastCreatedBookmarks');

      cy.get('[data-test*=bookmarks-sorting-btn-group-btn-latest]').should(
        'have.class',
        'btn-secondary'
      );
      cy.get(
        '[data-test*=bookmarks-sorting-btn-group-btn-most-visited]'
      ).should('have.class', 'btn-outline-secondary');
      //should see 2 results
      cy.get('[data-test="bookmarks-list-wrapper"]')
        .find('[data-test="bookmark-list-element"]')
        .should('have.length', 2);

      //click on Most visited now
      cy.get(
        '[data-test*=bookmarks-sorting-btn-group-btn-most-visited]'
      ).click();
      cy.wait('@getMostUsedBookmarks');

      cy.get('[data-test*=bookmarks-sorting-btn-group-btn-latest]').should(
        'have.class',
        'btn-outline-secondary'
      );
      cy.get(
        '[data-test*=bookmarks-sorting-btn-group-btn-most-visited]'
      ).should('have.class', 'btn-secondary');

      //should have 1 result
      cy.get('[data-test="bookmarks-list-wrapper"]')
        .find('[data-test="bookmark-list-element"]')
        .should('have.length', 1);
    });

    it('should properly filter bookmarks via input filter', () => {
      cy.intercept(
        {
          method: 'GET',
          url: '**/api/personal/users/*/bookmarks*',
          query: { orderBy: 'LAST_CREATED' },
        },
        {
          fixture:
            'personal/dashboard/dashboard-my-bookmarks-latest-created.json',
        }
      ).as('getLastCreatedBookmarks');

      cy.visit('/dashboard/bookmarks');
      cy.wait('@getLastCreatedBookmarks');

      cy.get('[data-test="bookmarks-list-wrapper"]')
        .find('[data-test="bookmark-list-element"]')
        .should('have.length', 2);

      cy.get('[data-test*=bookmarks-search-results-input-filter]').type(
        'codever{enter}'
      );

      cy.get('[data-test="bookmarks-list-wrapper"]')
        .find('[data-test="bookmark-list-element"]')
        .should('have.length', 1);
    });
  });

  describe('Legacy dashboard routes', () => {
    it('redirects exact roots without intercepting nested actions', () => {
      cy.visit('/my-bookmarks');
      cy.location('pathname').should('eq', '/dashboard/bookmarks');

      cy.visit('/my-notes');
      cy.location('pathname').should('eq', '/dashboard/notes');

      cy.visit('/my-bookmarks/new');
      cy.get('app-save-bookmark-form').should('exist');

      cy.visit('/my-notes/new');
      cy.get('app-note-editor').should('exist');
    });
  });

  it('shows the overview for old tab URLs and links to the tags page', () => {
    cy.visit('/dashboard?tab=notes');
    cy.contains('h1', 'My dashboard').should('be.visible');
    cy.get('app-my-notes').should('not.exist');
    cy.get('a[href="/dashboard/tags"]').click();
    cy.location('pathname').should('eq', '/dashboard/tags');
    cy.get('app-user-tags').should('exist');
  });

  afterEach(() => {
    cy.kcLogout();
  });
});
