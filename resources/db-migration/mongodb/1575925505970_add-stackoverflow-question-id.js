db.bookmarks.find().forEach(
  function(e) {
    var bookmarkUrl = e.location;
    var isStackoverflowQuestion= false;
    var stackoverflowQuestionId = '';
    var regExpMatchArray = bookmarkUrl.match(/stackoverflow\.com\/questions\/(\d+)/);
    if (regExpMatchArray) {
      stackoverflowQuestionId = regExpMatchArray[1];
      isStackoverflowQuestion = true;
    }
    if(isStackoverflowQuestion) {
      print('stackoverflowQuestionId ' + stackoverflowQuestionId);
      print('with location ' + e.location);
      e.stackoverflowQuestionId = stackoverflowQuestionId;
      //db.bookmarks.save(e);
    }
  }
);

db.bookmarks.find({location: /stackverflow\.com/}).count()
db.bookmarks.find({location: /youtu\.be/}).count()
