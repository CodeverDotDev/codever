chrome.browserAction.onClicked.addListener(function(activeTab) {
  var tabUrl = encodeURIComponent(activeTab.url);
  var addNewBookmarkUrl = 'https://www.bookmarks.dev/personal/new?url=' + tabUrl;

  //Update the url here.
  chrome.tabs.update(activeTab.id, {url: addNewBookmarkUrl});
});
