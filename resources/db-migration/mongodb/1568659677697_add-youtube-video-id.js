db.bookmarks.find().forEach(
  function(e) {
    var bookmarkUrl = e.location;
    var isYoutubeVideo= false;
    var youtubeVideoId = '';
    if(isYoutubeVideo) {
      e.youtubeVideoId = youtubeVideoId;
    }
  }
);


db.bookmarks.find().forEach(
  function(e) {
    var bookmarkUrl = e.location;
    var isYoutubeVideo= false;
    var youtubeVideoId = '';
    if ( bookmarkUrl.startsWith('https://youtu.be/') ) {
      print(bookmarkUrl);
      youtubeVideoId = bookmarkUrl.split('/').pop();
      isYoutubeVideo = true;
    } else if ( bookmarkUrl.startsWith('https://www.youtube.com/watch') ) {
      print(bookmarkUrl);
      youtubeVideoId = bookmarkUrl.split('v=')[1];
      var ampersandPosition = youtubeVideoId.indexOf('&');
      if ( ampersandPosition !== -1 ) {
        youtubeVideoId = youtubeVideoId.substring(0, ampersandPosition);
      }
      isYoutubeVideo = true;
    }
    if(isYoutubeVideo) {
      print('youtubeVideoId ' + youtubeVideoId);
      e.youtubeVideoId = youtubeVideoId;
      db.bookmarks.save(e);
    }
  }
);

db.bookmarks.find({location: /www\.youtube\.com/}).count()
db.bookmarks.find({location: /youtu\.be/}).count()
