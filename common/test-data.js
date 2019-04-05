const common = require('./config');
const config = common.config();
module.exports = {

  bookmarkExample : {
    "name": "Cleaner code in NodeJs with async-await - Mongoose calls example – CodingpediaOrg",
    "location": "http://www.codingpedia.org/ama/cleaner-code-in-nodejs-with-async-await-mongoose-calls-example",
    "language": "en",
    "tags": [
      "nodejs",
      "async-await",
      "mongoose",
      "mongodb"
    ],
    "publishedOn": "2017-11-05",
    "githubURL": "https://github.com/Codingpedia/bookmarks-api",
    "description": "Example showing migration of Mongoose calls from previously using callbacks to using the new async-await feature in NodeJs",
    "descriptionHtml": "<p>Example showing migration of Mongoose calls from previously using callbacks to using the new async-await feature in NodeJs</p>",
    "userId": config.integration_tests.test_user_id,
    "shared": true,
    "starredBy": [],
    "lastAccessedAt": null
  }
}
