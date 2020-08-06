/**
 * Get active tab
 */
function getActiveTab() {
    return new Promise((resolve) => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs.length > 0) {
                resolve(tabs[0]);
            } else {
                resolve(null);
            }
        });
    });
}

/**
 * Open a URL in a new tab
 */
function openURL(url, tabId) {
    return new Promise((resolve) => {
        if (tabId) {
            chrome.tabs.update(tabId, {url: url}, (tab) => {
                resolve(tab.id);
            });
        } else {
            chrome.tabs.create({url: url}, (tab) => {
                resolve(tab.id);
            });
        }
    });
}

/**
 * Get value from storage against a field.
 * If field is null, return all items in storage
 * @param {string} field 
 */
async function getValueFromStorage(field) {
    return new Promise((resolve, reject) => {
        try {
            chrome.storage.sync.get(null, (items) => {
                if (field) {
                    resolve(items[field]);
                } else {
                    resolve(items);
                }
            });
        } catch {
            if (field) {
                resolve(null);
            } else {
                resolve({});
            }
        }
    });
}

/**
 * Store data to storage
 * @param {object} data
 */
async function setValueToStorage(data) {
    return new Promise(resolve => {
        try {
            chrome.storage.sync.set(data, () => {
                resolve(true);
            });
        } catch {
            resolve(false);
        }
    });
}