chrome.extension.onMessage.addListener(
    function(request, sender, sendResponse) {
      chrome.identity.getAuthToken({interactive: true}, function(token) {
        gapi.auth.setToken({
          'access_token': token,
        });
  
        const body = {values: [[
          new Date(), // Timestamp
          request.title, // Page title
          request.url, // Page URl
        ]]};
  
        // Append values
        gapi.client.sheets.spreadsheets.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: SPREADSHEET_TAB_NAME,
          valueInputOption: 'USER_ENTERED',
          resource: body
        }).then((response) => {
          console.log(`${response.result.updates.updatedCells} cells appended.`)
          sendResponse({success: true});
        });
      })
  
      // Wait for response
      return true;
    }
  );