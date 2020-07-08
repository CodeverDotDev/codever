var request = require('superagent');
var cheerio = require('cheerio');

const HttpStatus = require('http-status-codes/index');

/* scrape URL for data:
  - title
  - meta description
  - tags
  - published date
* */
let getScrapedDataForLocation = async (location) => {
  const response = await request.get(location);

  if (response.statusCode == HttpStatus.OK) {
    const $ = cheerio.load(response.text);
    const webpageTitle = $("title").text();
    const metaDescription = $('meta[name=description]').attr("content");
    const webpageInfo = {
      title: webpageTitle,
      metaDescription: metaDescription,
      publishedOn: '',
      videoDuration: null
    }

    return webpageInfo;
  }
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

  let webpageInfo = {
    title: title,
    metaDescription: description.substring(0, 600),
    publishedOn: publishedOn,
    videoDuration: videoDuration
  }

  if(tags) { //some youtube videos might not have tags defined
    webpageInfo.tags = tags.slice(0,8).map(tag => tag.toLowerCase().trim().replace(/\s+/g, '-'));
  }
  return webpageInfo;
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

  const webpageInfo = {
    title: title,
    tags: tags,
    publishedOn: publishedOn
  }

  return webpageInfo;
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
  getScrapedDataForLocation: getScrapedDataForLocation,
  getYoutubeVideoData: getYoutubeVideoData,
  getStackoverflowQuestionData: getStackoverflowQuestionData
};
