
import { BookmarksFilterPipe } from './bookmarks-filter.pipe';
import { Bookmark } from '../../core/model/bookmark';

describe('BookmarkFilter Pipe', () => {
  let bookmarksFilterPipe: BookmarksFilterPipe;
  let bookmarks: Bookmark[];

  beforeEach(() => {
    bookmarksFilterPipe = new BookmarksFilterPipe();
    bookmarks = [];
    initTestBookmarks();
  });

  it('should be defined', () => {
    expect(bookmarksFilterPipe).toBeDefined();
  });

  it('should return empty list for empty bookmarks list', () => {
    expect(bookmarksFilterPipe.transform([], 'graphql').length).toBe(0);
  });

  it('should return complete list for empty filter text', () => {
    expect(bookmarksFilterPipe.transform(bookmarks, '').length).toBe(2);
  });

  it('should find both bookmarks ', () => {
    expect(bookmarksFilterPipe.transform(bookmarks, 'node.js').length).toBeGreaterThan(1);
  });

  it('should find only one ', () => {
    expect(bookmarksFilterPipe.transform(bookmarks, 'graphql').length).toBe(1);
  });

  it('should find only one with two strings in input filterText', () => {
    expect(bookmarksFilterPipe.transform(bookmarks, 'async-await node.js').length).toBe(1);
  });

  const initTestBookmarks = function () {
    const bookmarkExample: Bookmark = {
      'name': 'Cleaner code in NodeJs with async-await - Mongoose calls example – CodepediaOrg',
      'location': 'https://www.codepedia.org/ama/cleaner-code-in-nodejs-with-async-await-mongoose-calls-example',
      'language': 'en',
      'tags': [
        'node.js',
        'async-await',
        'mongoose',
        'mongodb'
      ],
      'publishedOn': new Date(),
      'sourceCodeURL': 'https://github.com/CodeverDotDev/codever',
      'description': 'Example showing migration of Mongoose calls from previously using callbacks to using the new async-await feature in NodeJs',
      'descriptionHtml': '<p>Example showing migration of Mongoose calls from previously using callbacks to using the new async-await feature in NodeJs</p>',
      'userId': 'testUserId',
      'public': true,
      'likeCount': 0,
      'lastAccessedAt': null,
      'userDisplayName': 'ama'
    }
    bookmarks.push(bookmarkExample);
    const bookmarkExampleTwo: Bookmark = {
      'name': 'Complete example of a CRUD API with Express GraphQL',
      'location': 'https://www.codepedia.org/ama/complete-example-crud-api-express-graphql',
      'language': 'en',
      'tags': [
        'node.js',
        'graphql',
        'expressjs'
      ],
      'publishedOn': new Date(),
      'sourceCodeURL': 'https://github.com/CodepediaOrg/graphql-express-crud-demo',
      'description': 'In this blog post I will present the implementation of a GraphQL server API that provides CRUD operations',
      'descriptionHtml': '<p>In this blog post I will present the implementation of a GraphQL server API that provides CRUD operations</p>',
      'userId': 'testUserId',
      'public': true,
      'likeCount': 0,
      'lastAccessedAt': null,
      'userDisplayName': 'ama'
    }
    bookmarks.push(bookmarkExampleTwo);
  };

});
