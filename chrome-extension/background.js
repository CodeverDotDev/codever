chrome.browserAction.onClicked.addListener(iconClicked);

function iconClicked() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {action: "save-bookmark"});
  });
};
