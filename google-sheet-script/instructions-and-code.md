# Google Sheets Sync - Instructions and Code

This script now supports adding and deleting entries.

## What to do

1.  **Open your Google Sheet.**
2.  In the top menu, click on **Extensions**, and then click on **Apps Script**.
3.  A new tab will open showing some code. **Delete everything** in the code editor. Make it completely blank.
4.  **Copy the complete code block below** (everything inside the gray box).
5.  **Paste** this correct code into the blank Apps Script editor.
6.  Click the **Save project** icon (it looks like a floppy disk).
7.  Finally, click the blue **Deploy** button at the top right, and then click **New deployment**.
8.  Another window will appear. Just click the **Deploy** button.
9.  **Copy the new Web app URL** it gives you and paste it back into our chat so I can update the app.

---

## Code to Copy

```javascript
const SHEET_NAME = 'Sheet1';
const PIN = '9494';

function doGet(e) {
  const pin = e.parameter.pin;
  if (pin !== PIN) {
    return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid PIN' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const entries = data.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, i) => obj[header] = row[i]);
    return obj;
  }).filter(obj => obj.id); // Filter out empty rows
  
  return ContentService.createTextOutput(JSON.stringify({ entries }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    let data;
    if (e.parameter && e.parameter.data) {
      data = JSON.parse(e.parameter.data);
    } else if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      throw new Error('No data received');
    }

    if (data.pin !== PIN) {
      throw new Error('Invalid PIN');
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const action = data.action;

    if (action === 'ADD_ENTRY') {
      const entry = data.entry;
      sheet.appendRow([
        entry.id,
        entry.amount,
        entry.note,
        entry.type,
        "'" + entry.date,
        entry.time,
        entry.createdAt
      ]);
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Entry added.' }))
        .setMimeType(ContentService.MimeType.JSON);

    } else if (action === 'DELETE_ENTRY') {
      const entryIdToDelete = data.id;
      if (!entryIdToDelete) {
        throw new Error('No entry ID provided for deletion.');
      }
      
      const dataRange = sheet.getDataRange();
      const values = dataRange.getValues();
      const idColumnIndex = 0; // 'id' is in column A

      for (let i = values.length - 1; i >= 1; i--) { // Start from the end, skip header
        if (values[i][idColumnIndex] == entryIdToDelete) {
          sheet.deleteRow(i + 1); // Rows are 1-indexed
          return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Entry deleted.' }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
      
      throw new Error('Entry ID not found for deletion.');

    } else {
      throw new Error('Invalid action specified.');
    }

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message, success: false }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```