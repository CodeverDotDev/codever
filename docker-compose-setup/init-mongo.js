db.createUser(
  {
    user: "bookmarks",
    pwd: "secret",
    roles: [
      {
        role: "readWrite",
        db: "dev-bookmarks"
      }
    ]
  }
);


db.auth("bookmarks", "secret");

//insert initial public dev bookmarks
db.bookmarks.insert(
  [
    {
      "tags": [
        "programming",
        "blog",
        "open-source"
      ],
      "name": "Share coding knowledge – CodepediaOrg",
      "location": "https://www.codepedia.org/",
      "userId": "a7908cb5-3b37-4cc1-a751-42f674d870e1",
      "userDisplayName": "Mock",
      "language": "en",
      "description": "Coding knowledge hub, providing free educational content for professionals involved in software development. The website covers different topics and technologies with posts whose difficulty levels range from beginner to “hard-core” programming.",
      "descriptionHtml": "<p>Coding knowledge hub, providing free educational content for professionals involved in software development. The website covers different topics and technologies with posts whose difficulty levels range from beginner to “hard-core” programming.</p>",
      "publishedOn": null,
      "sourceCodeURL": "https://github.com/CodepediaOrg/codepediaorg.github.io",
      "public": true,
      "lastAccessedAt": ISODate("2019-10-23T12:22:10.480Z"),
      "likeCount": 0,
      "createdAt": ISODate("2019-10-23T12:22:10.526Z"),
      "updatedAt": ISODate("2019-10-23T12:22:10.526Z"),
      "__v": 0
    },
    {
      "tags": [
        "programming",
        "blog",
        "resources",
        "open-source"
      ],
      "name": "Bookmarks and Snippets Manager for Developers & Co",
      "location": "https://www.codever.dev/",
      "userId": "a7908cb5-3b37-4cc1-a751-42f674d870e1",
      "userDisplayName": "Mock",
      "language": "en",
      "description": "Bookmarks Manager for Developers & Co",
      "descriptionHtml": "<p>Bookmarks Manager for Developers &amp; Co</p>",
      "publishedOn": null,
      "sourceCodeURL": "https://github.com/CodeverDotDev/codever",
      "public": true,
      "lastAccessedAt": ISODate("2019-10-23T12:23:53.471Z"),
      "likeCount": 0,
      "createdAt": ISODate("2019-10-23T12:23:53.486Z"),
      "updatedAt": ISODate("2019-10-23T12:23:53.486Z"),
      "__v": 0
    },
    {
      "tags": [
        "programming",
        "resource",
        "blog",
        "open-source"
      ],
      "name": "Collection of public dev bookmarks, shared with love from www.codever.land",
      "location": "https://github.com/CodeverDotDev/bookmarks#readme",
      "userId": "a7908cb5-3b37-4cc1-a751-42f674d870e1",
      "userDisplayName": "Mock",
      "language": "en",
      "description": ":bookmark: :star: Collection of public dev bookmarks, shared with :heart: from www.codever.land  - CodepediaOrg/bookmarks",
      "descriptionHtml": "<p>:bookmark: :star: Collection of public dev bookmarks, shared with :heart: from www.codever.land  - CodepediaOrg/bookmarks</p>",
      "publishedOn": null,
      "sourceCodeURL": "https://github.com/CodeverDotDev/bookmarks",
      "public": true,
      "lastAccessedAt": ISODate("2019-10-23T12:24:50.804Z"),
      "likeCount": 0,
      "createdAt": ISODate("2019-10-23T12:24:50.823Z"),
      "updatedAt": ISODate("2019-10-23T12:24:50.823Z"),
      "__v": 0
    },
    {
      "tags": [
        "programming",
        "resource",
        "blog",
        "open-source"
      ],
      "name": "Getting started with www.codever.land",
      "location": "https://www.codever.dev/howto",
      "userId": "a7908cb5-3b37-4cc1-a751-42f674d870e1",
      "userDisplayName": "Mock",
      "language": "en",
      "description": "How to save and search bookmarks, use bookmarklets and chrome extension",
      "descriptionHtml": "<p>How to save and search bookmarks, use bookmarklets and chrome extension. Use snippets and more</p>",
      "publishedOn": null,
      "sourceCodeURL": "https://github.com/CodeverDotDev/bookmarks",
      "public": true,
      "lastAccessedAt": ISODate("2020-03-23T12:24:50.804Z"),
      "likeCount": 0,
      "createdAt": ISODate("2020-03-23T12:24:50.823Z"),
      "updatedAt": ISODate("2020-03-23T12:24:50.823Z"),
      "__v": 0
    }
  ]
);

//bookmarks indexes
db.bookmarks.createIndex(
  {
    name: "text",
    location: "text",
    description: "text",
    tags: "text",
    sourceCodeURL: "text",
  },
  {
    weights: {
      name: 13,
      location: 8,
      description: 5,
      tags: 21,
      sourceCodeURL: 3
    },
    name: "full_text_search",
    default_language: "none",
    language_override: "none"
  }
);

db.bookmarks.createIndex(
  {location: 1, userId: 1},
  {
    unique: true,
    name: "unique_user_and_location"
  }
);

// snippets indexes

db.snippets.createIndex(
  {userId: 1}
);

db.snippets.createIndex(
  {
    title: "text",
    tags: "text",
    "codeSnippets.comment": "text",
    "codeSnippets.code": "text",
    reference: "text"
  },
  {
    weights: {
      title: 8,
      tags: 13,
      "codeSnippets.comment": 3,
      "codeSnippets.code": 3,
      reference: 1
    },
    name: "full_text_search",
    default_language: "none",
    language_override: "none"
  }
);

db.notes.createIndex(
    {
      title: "text",
      reference: "text",
      content: "text",
      tags: "text"
    },
    {
      weights: {
        title: 13,
        reference: 3,
        content: 5,
        tags: 21
      },
      name: "notes_full_text_search",
      default_language: "none",
      language_override: "none"
    }
);
