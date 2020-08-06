window.onload = () => {
    init();
}

async function init() {
    $('#file_chooser').change(fileChanged);
    $('.btn-start').click(btnStartClicked);
}

function btnStartClicked() {
    
}

function fileChanged() {
    const file   = this.files[0];
    const reader = new FileReader();

    reader.onload = function() {
        try {
            const data = $.csv.toArrays(reader.result);
            data.shift();

            paidOrders = data.map(function(a) {
                return a[2];
            });
        } catch (error) {
            console.log(error.message);
            paidOrders = [];
        }
    }
    reader.readAsText(file);

    $('#file_name').val(file.name);
}

/**
 * Callback function when google api loaded
 */
function onGoogleAPILoad() {
    gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: DISCOVERY_DOCS,
    }).then(function () {
        chrome.identity.getAuthToken({interactive: true}, function(token) {
            console.log(token);
            gapi.auth.setToken({
              'access_token': token,
            });
        });
    }, function(error) {
        console.log('error', error);
    });
}

/**
 * Show progress
 * @param {string} selector 
 */
function showProgress(selector) {
    Ladda.create(document.querySelector(selector)).start();
}

/**
 * Hide progress
 * @param {string} selector 
 */
function hideProgress(selector) {
    Ladda.create(document.querySelector(selector)).stop();
}

let paidOrders = [];