window.onload = () => {
    init();
}

async function init() {
    $('#file_chooser').change(fileChanged);
    $('.btn-start').click(btnStartClicked);
}

async function btnStartClicked() {
    showProgress('.btn-start');

    const url           = $('#sheet_url').val();
    const orderTab      = $('#orders_tab').val();
    const paidOrderTab  = $('#paid_orders_tab').val();
    const spreadsheetId = getSpreadsheetIdFromURL(url);

    let gPaidOrderRes   = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: paidOrderTab
    });
    let gOrderRes       = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: orderTab
    });
    const gPaidOrders   = gPaidOrderRes.result.values;
    const gOrders       = gOrderRes.result.values;
    const gSpreadSheet  = await gapi.client.sheets.spreadsheets.get({
        spreadsheetId: spreadsheetId
    });

    const gOrderSheetId     = getSheetIdByName(orderTab, gSpreadSheet.result.sheets);
    const gPaidOrderSheetId = getSheetIdByName(paidOrderTab, gSpreadSheet.result.sheets);

    const requestOrder = {
        spreadsheetId: spreadsheetId,
        resource: {
            requests: []
        }
    };
    const requestPaidOrder = {
        spreadsheetId: spreadsheetId,
        resource: {
            requests: [
                {
                    appendCells: {
                        sheetId: gPaidOrderSheetId,
                        rows: [],
                        fields: '*'
                    }
                }
            ]
        }
    };

    for (const paidOrder of paidOrders) {
        const gOrderRowNum   = getRowNum(paidOrder.orderNum, gOrders);
        const rowData        = { values: [] };
        
        if (gOrderRowNum == -1) {
            continue;
        }

        if (getRowNum(paidOrder.orderNum, gPaidOrders) > -1) {
            continue;
        }

        requestOrder.resource.requests.push({
            repeatCell: {
                range: {
                    sheetId: gOrderSheetId,
                    startRowIndex: gOrderRowNum,
                    endRowIndex: gOrderRowNum + 1,
                    startColumnIndex: 0,
                    endColumnIndex: gOrders[9].length
                },
                fields: 'userEnteredFormat.backgroundColor',
                cell: {
                    userEnteredFormat: {
                        backgroundColor: Colors.default
                    }
                }
            }
        });

        gOrders[gOrderRowNum].forEach((value, col) => {
            const cellData      = {
                userEnteredValue: {
                    stringValue: value
                },
                userEnteredFormat: {
                    backgroundColor: Colors.default,
                    horizontalAlignment: 3
                }
            }
            const leftCols      = [0, 6];
            const centerCols    = [2, 5]
            let backgroundColor = Colors.default;
            let alignment       = 3;

            if (leftCols.includes(col)) {
                alignment = 1;
            } else if (centerCols.includes(col)) {
                alignment = 2;
            }

            if (col == 0) {
                backgroundColor = Colors[value] || Colors.default;
            } else if (col == 11) {
                backgroundColor = rowData.values[0].userEnteredFormat.backgroundColor;
            } else if (col == 14) {
                backgroundColor = Colors.profit;
            } else if (col > 14 && col < 29) {
                if (value != '') {
                    backgroundColor = rowData.values[0].userEnteredFormat.backgroundColor;
                } else {
                    backgroundColor = Colors.default;
                }
            }

            if (paidOrder.shouldRedColored) {
                backgroundColor = Colors.red;
            }

            cellData.userEnteredFormat.backgroundColor = backgroundColor;
            cellData.userEnteredFormat.horizontalAlignment = alignment;
            
            if (col == 3) {
                cellData.userEnteredFormat.textFormat = {
                    foregroundColor: Colors.roiFontColor,
                    bold: true
                };
            }

            rowData.values.push(cellData);
        });

        requestPaidOrder.resource.requests[0].appendCells.rows.push(rowData);
    }
    
    gOrderRes = await gapi.client.sheets.spreadsheets.batchUpdate(requestOrder);
    gPaidOrderRes = await gapi.client.sheets.spreadsheets.batchUpdate(requestPaidOrder);   

    hideProgress('.btn-start');
}

function fileChanged() {
    const file   = this.files[0];
    const reader = new FileReader();

    reader.onload = function() {
        try {
            let data = $.csv.toArrays(reader.result);
            data.shift();

            data = data.map(function(a) {
                return { 
                    orderNum    : a[2],
                    ordertype   : a[5] 
                };
            });

            paidOrders = data.filter(function(item, index) {
                return index === data.findIndex(function(obj) {
                    return JSON.stringify(obj) === JSON.stringify(item);
                });
            });

            let lastOrderNum = null;
            for (let i = 0; i< paidOrders.length; i++) {
                if (paidOrders[i].orderNum === lastOrderNum) {
                    paidOrders[i].shouldRedColored = true;
                }

                lastOrderNum = paidOrders[i].orderNum;
            }
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
            gapi.auth.setToken({
              'access_token': token,
            });
        });
    }, function(error) {
        console.log('error', error);
    });
}

/**
 * Return index of array that contains a value
 * @param {string} value 
 * @param {array} array 
 */
function getRowNum(value, array) {
    for (let i = 0; i < array.length; i++) {
        if (array[i].includes(value)) {
            return i;
        }
    }

    return -1
}

function getSheetIdByName(name, sheets)  {
    for (const sheet of sheets) {
        if (sheet.properties.title == name) {
            return sheet.properties.sheetId;
        }
    }

    return null;
}

function getSpreadsheetIdFromURL(url) {
    const regExp = /https:\/\/docs\.google\.com\/spreadsheets\/d\/(.*)\/edit/g;
    const match = regExp.exec(url);
    return match ? match[1] : null;
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