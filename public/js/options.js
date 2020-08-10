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
    let gPaidOrders     = gPaidOrderRes.result.values;
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
    let requestPaidOrder = {
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
            } else if (col == 3 && value != "#DIV/0!") {
                delete cellData.userEnteredValue.stringValue;
                cellData.userEnteredValue.numberValue = Number(value.replace(/,/g, ''));
            } else if (col == 11) {
                backgroundColor = rowData.values[0].userEnteredFormat.backgroundColor;
            } else if (col == 14) {
                delete cellData.userEnteredValue.stringValue;
                cellData.userEnteredValue.numberValue = value;
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
    
    if (requestOrder.resource.requests.length > 0) { 
        await gapi.client.sheets.spreadsheets.batchUpdate(requestOrder);
    }

    if (requestPaidOrder.resource.requests[0].appendCells.rows.length > 0) {
        await gapi.client.sheets.spreadsheets.batchUpdate(requestPaidOrder);
    }
    
    gPaidOrderRes   = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: paidOrderTab
    });
    gPaidOrders = gPaidOrderRes.result.values;

    if (gPaidOrders[0][0] != 'Card Used') {
        requestPaidOrder = {
            spreadsheetId: spreadsheetId,
            resource: {
                requests: [
                    {
                        insertDimension: {
                            range: {
                                sheetId: gPaidOrderSheetId,
                                dimension: 1, // ROWS
                                startIndex: 0,
                                endIndex: 8
                            },
                            inheritFromBefore: false
                        }
                    }
                ]
            }
        };
        gPaidOrderRes = await gapi.client.sheets.spreadsheets.batchUpdate(requestPaidOrder);
    
        requestPaidOrder = {
            spreadsheetId: spreadsheetId,
            resource: {
                requests: [
                    {
                        updateCells: {
                            rows: [],
                            fields: '*',
                            range: {
                                sheetId: gPaidOrderSheetId,
                                startRowIndex: 0,
                                endRowIndex: 8,
                                startColumnIndex: 0,
                                endColumnIndex: 13
                            }
                        }
                    }
                ]
            }
        };
    
        for (let i = 1; i < 9; i++) {
            const rowData       = { values: [] };
    
            for (let j = 1; j < 14; j++) {
                const cellData      = {
                    userEnteredValue: {
                    },
                    userEnteredFormat: {
                        backgroundColor: Colors.white,
                        horizontalAlignment: 3,
                        textFormat: {
                            foregroundColor: Colors.black
                        }
                    }
                }
    
                if (i === 1 && j === 1) {
                    cellData.userEnteredValue.stringValue = 'Card Used';
                    cellData.userEnteredFormat.horizontalAlignment = 2;
                    cellData.userEnteredFormat.textFormat.bold = true;
                } else if (i === 1 && j === 2) {
                    cellData.userEnteredValue.stringValue = 'Total Cost';
                    cellData.userEnteredFormat.horizontalAlignment = 2;
                    cellData.userEnteredFormat.textFormat.bold = true;
                } else if (i === 1 && j === 3) {
                    cellData.userEnteredValue.stringValue = 'Card Used';
                    cellData.userEnteredFormat.horizontalAlignment = 2;
                    cellData.userEnteredFormat.textFormat.bold = true;
                } else if (i === 1 && j === 3) {
                    cellData.userEnteredValue.stringValue = 'Total Cost';
                    cellData.userEnteredFormat.horizontalAlignment = 2;
                    cellData.userEnteredFormat.textFormat.bold = true;
                } else if (i === 1 && j === 7) {
                    cellData.userEnteredValue.stringValue = 'Total Profit';
                    cellData.userEnteredFormat.horizontalAlignment = 2;
                    cellData.userEnteredFormat.textFormat.bold = true;
                } else if (i === 1 && j === 8) {
                    cellData.userEnteredValue.formulaValue = '=SUM(O10:O)';
                    cellData.userEnteredFormat.horizontalAlignment = 2;
                } else if (i === 2 && j === 1) {
                    cellData.userEnteredValue.stringValue = 'AMEX-Bonvoy';
                    cellData.userEnteredFormat.backgroundColor = Colors['AMEX-Bonvoy'];
                    cellData.userEnteredFormat.horizontalAlignment = 1;
                } else if (i === 3 && j === 1) {
                    cellData.userEnteredValue.stringValue = 'AMEX-Blue';
                    cellData.userEnteredFormat.backgroundColor = Colors['AMEX-Blue'];
                    cellData.userEnteredFormat.horizontalAlignment = 1;
                } else if (i === 4 && j === 1) {
                    cellData.userEnteredValue.stringValue = 'AMEX_ABP (5%)';
                    cellData.userEnteredFormat.backgroundColor = Colors['AMEX_ABP (5%)'];
                    cellData.userEnteredFormat.horizontalAlignment = 1;
                } else if (i === 5 && j === 1) {
                    cellData.userEnteredValue.stringValue = 'P-3783';
                    cellData.userEnteredFormat.backgroundColor = Colors['P-3783'];
                    cellData.userEnteredFormat.horizontalAlignment = 1;
                } else if (i === 6 && j === 1) {
                    cellData.userEnteredValue.stringValue = 'BB-3588';
                    cellData.userEnteredFormat.backgroundColor = Colors['BB-3588'];
                    cellData.userEnteredFormat.horizontalAlignment = 1;
                } else if (i === 7 && j === 1) {
                    cellData.userEnteredValue.stringValue = 'AMEX-Personal';
                    cellData.userEnteredFormat.backgroundColor = Colors['AMEX-Personal'];
                    cellData.userEnteredFormat.horizontalAlignment = 1;
                } else if (i === 8 && j === 1) {
                    cellData.userEnteredValue.stringValue = 'AMZ Credit';
                    cellData.userEnteredFormat.backgroundColor = Colors['AMZ Credit'];
                    cellData.userEnteredFormat.horizontalAlignment = 1;
                } else if (i === 2 && j === 3) {
                    cellData.userEnteredValue.stringValue = 'CHASE';
                    cellData.userEnteredFormat.backgroundColor = Colors['CHASE'];
                    cellData.userEnteredFormat.horizontalAlignment = 1;
                } else if (i === 3 && j === 3) {
                    cellData.userEnteredValue.stringValue = 'Capital One';
                    cellData.userEnteredFormat.backgroundColor = Colors['Capital One'];
                    cellData.userEnteredFormat.horizontalAlignment = 1;
                } else if (i === 4 && j === 3) {
                    cellData.userEnteredValue.stringValue = 'HD Gift Card';
                    cellData.userEnteredFormat.backgroundColor = Colors['HD Gift Card'];
                    cellData.userEnteredFormat.horizontalAlignment = 1;
                } else if (i === 5 && j === 3) {
                    cellData.userEnteredValue.stringValue = 'Merrick';
                    cellData.userEnteredFormat.backgroundColor = Colors['Merrick'];
                    cellData.userEnteredFormat.horizontalAlignment = 1;
                } else if (i === 6 && j === 3) {
                    cellData.userEnteredValue.stringValue = 'Citizens';
                    cellData.userEnteredFormat.backgroundColor = Colors['Citizens'];
                    cellData.userEnteredFormat.horizontalAlignment = 1;
                } else if (i === 7 && j === 3) {
                    cellData.userEnteredValue.stringValue = 'WF-3994';
                    cellData.userEnteredFormat.backgroundColor = Colors['WF-3994'];
                    cellData.userEnteredFormat.horizontalAlignment = 1;
                } else if (i === 8 && j === 3) {
                    cellData.userEnteredValue.stringValue = 'AMEX-CHRIS';
                    cellData.userEnteredFormat.backgroundColor = Colors['AMEX-CHRIS'];
                    cellData.userEnteredFormat.horizontalAlignment = 1;
                } else if (i === 2 && j === 2) {
                    cellData.userEnteredValue.formulaValue = '=SUMIF(A10:A, A2, L10:L)';
                } else if (i === 3 && j === 2) {
                    cellData.userEnteredValue.formulaValue = '=SUMIF(A10:A, A3, L10:L)';
                } else if (i === 4 && j === 2) {
                    cellData.userEnteredValue.formulaValue = '=SUMIF(A10:A, A4, L10:L)';
                } else if (i === 5 && j === 2) {
                    cellData.userEnteredValue.formulaValue = '=SUMIF(A10:A, A5, L10:L)';
                } else if (i === 6 && j === 2) {
                    cellData.userEnteredValue.formulaValue = '=SUMIF(A10:A, A6, L10:L)';
                } else if (i === 7 && j === 2) {
                    cellData.userEnteredValue.formulaValue = '=SUMIF(A10:A, A7, L10:L)';
                } else if (i === 8 && j === 2) {
                    cellData.userEnteredValue.formulaValue = '=SUMIF(A10:A, A8, L10:L)';
                } else if (i === 2 && j === 4) {
                    cellData.userEnteredValue.formulaValue = '=SUMIF(A10:A, C2, L10:L)';
                } else if (i === 3 && j === 4) {
                    cellData.userEnteredValue.formulaValue = '=SUMIF(A10:A, C3, L10:L)';
                } else if (i === 4 && j === 4) {
                    cellData.userEnteredValue.formulaValue = '=SUMIF(A10:A, C4, L10:L)';
                } else if (i === 5 && j === 4) {
                    cellData.userEnteredValue.formulaValue = '=SUMIF(A10:A, C5, L10:L)';
                } else if (i === 6 && j === 4) {
                    cellData.userEnteredValue.formulaValue = '=SUMIF(A10:A, C6, L10:L)';
                } else if (i === 7 && j === 4) {
                    cellData.userEnteredValue.formulaValue = '=SUMIF(A10:A, C7, L10:L)';
                } else if (i === 8 && j === 4) {
                    cellData.userEnteredValue.formulaValue = '=SUMIF(A10:A, C8, L10:L)';
                } else {
                    cellData.userEnteredValue.stringValue = '';
                }
    
                rowData.values.push(cellData);
            }
            
            requestPaidOrder.resource.requests[0].updateCells.rows.push(rowData);
        }
        gPaidOrderRes = await gapi.client.sheets.spreadsheets.batchUpdate(requestPaidOrder);
    }

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
                    paidOrders[i-1].shouldRedColored = true;
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