describe('Dashboard personal page', () => {
  beforeEach(() => {
    cy.kcLogin('mock', 'mock');
  });

  describe('My Bookmarks tab>', () => {
    it('test sorting via button group', () => {
      cy.visit('/dashboard');
      cy.intercept(
        'GET',
        '/api/personal/users/*/bookmarks?orderBy=LAST_CREATED',
        {
          fixture:
            'personal/dashboard/dashboard-my-bookmarks-latest-created.json',
        }
      );
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

      cy.intercept('GET', '/api/personal/users/*/bookmarks?orderBy=MOST_USED', {
        fixture: 'personal/dashboard/dashboard-my-bookmarks-most-visited.json',
      });
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
      cy.visit('/dashboard');
      cy.intercept(
        'GET',
        '/api/personal/users/*/bookmarks?orderBy=LAST_CREATED',
        {
          fixture:
            'personal/dashboard/dashboard-my-bookmarks-latest-created.json',
        }
      );

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

  afterEach(() => {
    cy.kcLogout();
  });
});
