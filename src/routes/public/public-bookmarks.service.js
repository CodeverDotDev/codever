var request = require('superagent');
var cheerio = require('cheerio');
var Bookmark = require('../../model/bookmark');

const NotFoundError = require('../../error/not-found.error');
const HttpStatus = require('http-status-codes/index');
const MAX_NUMBER_RETURNED_RESULTS = 100;

let getBookmarkByLocation = async (location) => {
  const bookmark = await Bookmark.findOne({
    'shared': true,
    location: location
  }).lean().exec();
  if (!bookmark) {
    throw new NotFoundError(`Bookmark NOT_FOUND for location: ${location}`);
  }
  return bookmark;
}

let getLatestBookmarks = async () => {
  const bookmarks = await Bookmark.find({'shared': true})
    .sort({createdAt: -1})
    .limit(MAX_NUMBER_RETURNED_RESULTS)
    .lean().exec();

  return bookmarks;
}

let getBookmarksForTag = async (tag, orderByFilter) => {
  const bookmarks = await Bookmark.find({
    shared: true,
    tags: tag
  })
    .sort(orderByFilter)
    .limit(MAX_NUMBER_RETURNED_RESULTS)
    .lean()
    .exec();

  return bookmarks;

};

/* GET title of bookmark given its url */
let getScrapedDataForLocation = async (location) => {
  const response = await request.get(location);

  if (response.statusCode == HttpStatus.OK) {
    const $ = cheerio.load(response.text);
    const webpageTitle = $("title").text();
    const metaDescription = $('meta[name=description]').attr("content");
    const webpageData = {
      title: webpageTitle,
      metaDescription: metaDescription,
      publishedOn: '',
      videoDuration: null
    }

    return webpageData;
  }
};

/* GET bookmark by id. */
let getBookmarkById = async function (bookmarkId) {
  const bookmark = await Bookmark.findById(bookmarkId);
  if (!bookmark) {
    throw new NotFoundError(`Bookmakr data NOT_FOUND for id: ${request.params.userId}`);
  }
  return bookmark;
};

let getYoutubeVideoData = async (youtubeVideoId) => {
  const response = await request
    .get('https://www.googleapis.com/youtube/v3/videos')
    .query({id: youtubeVideoId})
    .query({key: process.env.YOUTUBE_API_KEY || "change-me-with-a-valid-youtube-key-if-you-need-me"}) //used only when adding youtube videos
    .query({part: 'snippet,contentDetails,statistics,status'});

  let title = response.body.items[0].snippet.title;
  const tags = response.body.items[0].snippet.tags;
  const description = response.body.items[0].snippet.description;
  const publishedAt = response.body.items[0].snippet.publishedAt;
  const publishedOn = publishedAt.substring(0, publishedAt.indexOf('T'));
  const videoDuration = formatDuration(response.body.items[0].contentDetails.duration);
  if (title.endsWith('- YouTube')) {
    title = title.replace('- YouTube', ' - ' + videoDuration);
  } else {
    title = title + ' - ' + videoDuration;
  }

  const webpageData = {
    title: title,
    tags: tags.slice(0,8).map(tag => tag.trim().replace(/\s+/g, '-')),
    metaDescription: description.substring(0, 500),
    publishedOn: publishedOn,
    videoDuration: videoDuration
  }

  return webpageData;
}

let getStackoverflowQuestionData = async (stackoverflowQuestionId) => {
  const response = await request
    .get(`https://api.stackexchange.com/2.2/questions/${stackoverflowQuestionId}`)
    .query({site: 'stackoverflow'})
    .query({key: process.env.STACK_EXCHANGE_API_KEY || "change-me-with-a-valid-stackexchange-key-if-you-need-me"});

  const tags = response.body.items[0].tags;
  const title = response.body.items[0].title;
  const creationDateMillis = response.body.items[0].creation_date * 1000;
  const creationDate = new Date(creationDateMillis).toISOString();
  const publishedOn = creationDate.substring(0, creationDate.indexOf('T'));

  const webpageData = {
    title: title,
    tags: tags,
    publishedOn: publishedOn
  }

  return webpageData;
}

/**
 * Convert youtube api duration format "PT6M10S" to 6m, "PT2H18M43S" to 2h:18min
 * @param duration
 * @returns {null}
 */
function formatDuration(duration) {
  duration = duration.substring(2); // get rid of 'PT'
  if (duration.indexOf('M') >= 0 && duration.indexOf('H') == -1) {
    return duration.substring(0, duration.indexOf('M')) + 'min';
  }

  if (duration.indexOf('M') >= 0 && duration.indexOf('H') >= 0) {
    const hours = duration.substring(0, duration.indexOf('H')) + 'h';
    const minutes = duration.substring(duration.indexOf('H') + 1, duration.indexOf('M')) + 'min';
    return hours + ':' + minutes;
  }

  return null;
}


module.exports = {
  getBookmarkByLocation: getBookmarkByLocation,
  getLatestBookmarks: getLatestBookmarks,
  getBookmarksForTag: getBookmarksForTag,
  getBookmarkById: getBookmarkById,
  getScrapedDataForLocation: getScrapedDataForLocation,
  getYoutubeVideoData: getYoutubeVideoData,
  getStackoverflowQuestionData: getStackoverflowQuestionData
};
