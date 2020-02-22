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
        "blog"
      ],
      "name": "Share coding knowledge – CodepediaOrg",
      "location": "https://www.codepedia.org/",
      "userId": "39108679-04a7-451e-aff3-207eb40c3263",
      "language": "en",
      "description": "Coding knowledge hub, providing free educational content for professionals involved in software development. The website covers different topics and technologies with posts whose difficulty levels range from beginner to “hard-core” programming.",
      "descriptionHtml": "<p>Coding knowledge hub, providing free educational content for professionals involved in software development. The website covers different topics and technologies with posts whose difficulty levels range from beginner to “hard-core” programming.</p>",
      "publishedOn": null,
      "sourceCodeURL": "",
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
        "resources"
      ],
      "name": "Bookmarks Manager for Devevelopers & Co",
      "location": "https://www.bookmarks.dev/",
      "userId": "39108679-04a7-451e-aff3-207eb40c3263",
      "language": "en",
      "description": "Bookmarks Manager for Developers & Co",
      "descriptionHtml": "<p>Bookmarks Manager for Developers &amp; Co</p>",
      "publishedOn": null,
      "sourceCodeURL": "https://github.com/CodepediaOrg/bookmarks.dev",
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
      "name": "Collection of public dev bookmarks, shared with from www.bookmarks.dev",
      "location": "https://github.com/CodepediaOrg/bookmarks#readme",
      "userId": "39108679-04a7-451e-aff3-207eb40c3263",
      "language": "en",
      "description": ":bookmark: :star: Collection of public dev bookmarks, shared with :heart: from www.bookmarks.dev  - CodepediaOrg/bookmarks",
      "descriptionHtml": "<p>:bookmark: :star: Collection of public dev bookmarks, shared with :heart: from www.bookmarks.dev  - CodepediaOrg/bookmarks</p>",
      "publishedOn": null,
      "sourceCodeURL": "https://github.com/CodepediaOrg/bookmarks",
      "public": true,
      "lastAccessedAt": ISODate("2019-10-23T12:24:50.804Z"),
      "likeCount": 0,
      "createdAt": ISODate("2019-10-23T12:24:50.823Z"),
      "updatedAt": ISODate("2019-10-23T12:24:50.823Z"),
      "__v": 0
    }
  ]
);

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
      name: 2,
      location: 5,
      description: 1,
      tags: 3,
      sourceCodeURL: 1
    },
    name: "full_text_search",
    default_language: "none",
    language_override: "none"
  }
);

db.bookmarks.createIndex(
  { location: 1, userId:1 },
  {
    unique: true,
    name:"unique_user_and_location"
  }
);
