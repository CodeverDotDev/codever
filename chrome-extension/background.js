chrome.browserAction.onClicked.addListener(iconClicked);

function iconClicked() {
  chrome.tabs.executeScript({
    file: 'content.js'
  });
};
