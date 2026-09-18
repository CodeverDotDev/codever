chrome.action.onClicked.addListener(launchCodeverDialog);

function launchCodeverDialog(tab) {
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['launch-codever-dialog.js']
    });
}

chrome.runtime.onInstalled.addListener(function () {
    // Add code to create a context menu using manifest V3's contextMenus API
    chrome.contextMenus.create({
        id: "save-to-codever",
        title: "Save to Codever",
        contexts: ["all"]
    });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener(function (info, tab) {
    if (info.menuItemId === "save-to-codever") {
        launchCodeverDialog(tab);
    }
});
