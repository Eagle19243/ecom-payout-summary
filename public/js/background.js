init();

function init() {
  chrome.tabs.onUpdated.addListener(onTabUpdated);
  chrome.tabs.onActivated.addListener(onTabActivated);
  chrome.pageAction.onClicked.addListener(onExtensionIconClicked);
}

function onTabUpdated(tabId) {
  chrome.pageAction.show(tabId);
}

function onTabActivated(activeInfo) {
  chrome.pageAction.show(activeInfo.tabId);
}

function onExtensionIconClicked() {
  chrome.tabs.create({url: 'html/options.html'});
}
