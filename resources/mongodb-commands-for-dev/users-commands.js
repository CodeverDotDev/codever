// reset arrays for all users
db.users.update({},
  {
    $set: {
      pinned: [],
      history: [],
      watchedTags: [],
      likes: [],
      readLater: []
    }
  },
  {multi: true}
);

//remove a tag from all public bookmarks
db.bookmarks.update(
  {public: true},
  {$pull: {tags: "algoritmos"}},
  {multi: true}
);


//reset array for specific user
db.users.update({userId: "55d49696-c07d-4b31-929c-29f7c8f1a10a"},
  {
    $set: {
      pinned: [],
      history: [],
      watchedTags: [],
      likes: [],
      readLater: []
    }
  }
);


//delete user by user id
db.users.remove({userId: "8daef41c-14d6-4baa-8601-d18b4aeea248"});

// find bookmarks for users with text and in starss
db.bookmarks.find(
  {
    $or: [
      {userId: '55d49696-c07d-4b31-929c-29f7c8f1a10a'},
      {"_id": {$in: [ObjectId('5c8f9ed7d865f0e0e5e49dc5')]}}
    ],
    $text: {$search: 'java'}
  }
).pretty();

//get all tags of userId grouped by count desc
db.bookmarks.aggregate([
  //first stage - filter
  {
    $match: {
      userId: "33d22b0e-9474-46b3-9da4-b1fb5d273abc"
    },
  },

  //second stage - unwind tags
  {$unwind: "$tags"},

  //third stage - group
  {
    $group: {
      _id: {
        tag: '$tags'
      },
      count: {
        $sum: 1
      }
    }
  },

  //fourth stage - order by count desc
  {
    $sort: {count: -1}
  }

]);

//get all "public" tags for user
db.bookmarks.aggregate([
  //first stage - filter
  {
    $match: {
      "$and": [
        {
          userId: "33d22b0e-9474-46b3-9da4-b1fb5d273abc"
        },
        {public: true}
      ]
    },
  },

  //second stage - unwind tags
  {$unwind: "$tags"},

  //third stage - group
  {
    $group: {
      _id: {
        tag: '$tags'
      },
      count: {
        $sum: 1
      }
    }
  },

  //fourth stage - order by count desc
  {
    $sort: {count: -1}
  }

]);
