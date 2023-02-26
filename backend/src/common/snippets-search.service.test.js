const snippetsSearchService = require('./snippets-search.service');

const Snippet = require('../model/snippet');
jest.mock('../model/snippet', () => {
  return {
    find: jest.fn(() => ({
      sort: jest.fn(() => ({
        skip: jest.fn(() => ({
          limit: jest.fn(() => ({
            lean: jest.fn(() => ({
              exec: jest.fn(() => Promise.resolve([{_id: '123', name: 'Test Snippet'}]))
            }))
          }))
        }))
      }))
    }))
  };
});

describe('findSnippets to have been called with', () => {
  const input = {
    isPublic: false,
    userId: 'user1',
    page: 1,
    limit: 10,
    searchInclude: 'any'
  }

  test.each([
    [
      {
        ...input,
        query: 'codever testing'
      },
      {
        userId: input.userId,
        $text: {$search: 'codever testing'}
      }
    ],
    [
      {
        ...input,
        userId: undefined,
        isPublic: true,
        query: 'codever testing'
      },
      {
        public: true,
        $text: {$search: 'codever testing'}
      }
    ],
    [
      {
        ...input,
        searchInclude: undefined,
        query: 'codever testing'
      },
      {
        userId: input.userId,
        $text: {$search: '"codever" "testing"'}
      }
    ],
    [
      {
        ...input,
        searchInclude: undefined,
        query: 'codever testing -javascript'
      },
      {
        userId: input.userId,
        $text: {$search: '"codever" "testing" -javascript'}
      }
    ],
    [
      {
        ...input,
        query: '[javascript]'
      },
      {
        userId: input.userId,
        tags:
          {
            $all: ['javascript']
          }
      }
    ],
    [
      {
        ...input,
        query: '[javascript] jest testing'
      },
      {
        userId: input.userId,
        $text: {$search: 'jest testing'},
        tags:
          {
            $all: ['javascript']
          }
      }
    ],
    [
      {
        ...input,
        query: '[javascript] jest testing site:codever.dev'
      },
      {
        userId: input.userId,
        $text: {$search: 'jest testing'},
        tags:
          {
            $all: ['javascript']
          }
      }
    ],
  ])('given input params %p , should use filter %p ', async (input, expectedFilter) => {
    await snippetsSearchService.findSnippets(input.isPublic, input.userId, input.query, input.page, input.limit, input.searchInclude);
    expect(Snippet.find).toHaveBeenCalledWith(expectedFilter, {score: {$meta: 'textScore'}});
  });
});
