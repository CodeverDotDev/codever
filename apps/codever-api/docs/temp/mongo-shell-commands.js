db.bookmarks
  .find({
    $and: [
      { public: true },
      //{userId: "81848340-efea-4ae0-8a9d-75b5721ae16a"},
      {
        tags: {
          $elemMatch: { $in: ['java'] },
        },
      },
      {
        tags: {
          $not: {
            $elemMatch: { $in: ['spring'] },
          },
        },
      },
    ],
  })
  .pretty();
