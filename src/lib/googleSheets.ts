/**
 * Google Sheets Integration for Chitti's Pindi Jinnu Business
 * 
 * SETUP INSTRUCTIONS:
 * 
 * 1. Create a new Google Sheet with these columns in row 1:
 *    A: id | B: amount | C: note | D: type | E: date | F: time | G: createdAt
 * 
 * 2. Go to Extensions > Apps Script and paste this code:
 * 
 * ```javascript
 * const SHEET_NAME = 'Sheet1';
 * const PIN = '9494';
 * 
 * function doGet(e) {
 *   const pin = e.parameter.pin;
 *   if (pin !== PIN) {
 *     return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid PIN' }))
 *       .setMimeType(ContentService.MimeType.JSON);
 *   }
 *   
 *   const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
 *   const data = sheet.getDataRange().getValues();
 *   const headers = data[0];
 *   const entries = data.slice(1).map(row => {
 *     const obj = {};
 *     headers.forEach((header, i) => obj[header] = row[i]);
 *     return obj;
 *   }).filter(obj => obj.id); // Filter out empty rows
 *   
 *   return ContentService.createTextOutput(JSON.stringify({ entries }))
 *     .setMimeType(ContentService.MimeType.JSON);
 * }
 * 
 * function doPost(e) {
 *   try {
 *     // Handle both FormData and raw JSON
 *     let data;
 *     if (e.parameter && e.parameter.data) {
 *       data = JSON.parse(e.parameter.data);
 *     } else if (e.postData && e.postData.contents) {
 *       data = JSON.parse(e.postData.contents);
 *     } else {
 *       return ContentService.createTextOutput(JSON.stringify({ error: 'No data received' }))
 *         .setMimeType(ContentService.MimeType.JSON);
 *     }
 *     
 *     if (data.pin !== PIN) {
 *       return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid PIN' }))
 *         .setMimeType(ContentService.MimeType.JSON);
 *     }
 *     
 *     const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
 *     const entry = data.entry;
 *     sheet.appendRow([
 *       entry.id,
 *       entry.amount,
 *       entry.note,
 *       entry.type,
 *       entry.date,
 *       entry.time,
 *       entry.createdAt
 *     ]);
 *     
 *     return ContentService.createTextOutput(JSON.stringify({ success: true }))
 *       .setMimeType(ContentService.MimeType.JSON);
 *   } catch (err) {
 *     return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
 *       .setMimeType(ContentService.MimeType.JSON);
 *   }
 * }
 * ```
 * 
 * 3. Deploy as Web App:
 *    - Click "Deploy" > "New deployment"
 *    - Select "Web app"
 *    - Set "Execute as" to your account
 *    - Set "Who has access" to "Anyone"
 *    - Click "Deploy" and copy the URL
 * 
 * 4. IMPORTANT: After making changes, create a NEW deployment (not just save)
 *    to get the updated version working.
 * 
 * 5. Set the GOOGLE_SCRIPT_URL below to your deployed URL
 */

// Replace with your Google Apps Script Web App URL
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwRkB2dfqghdU1o0QnT4b4K_A7gdUEFABbYf6GRWgVuwWpvZ10kUD8QQun0FMLpfk0FBg/exec';

interface MoneyEntry {
  id: string;
  amount: number;
  note: string;
  type: 'income' | 'expense';
  date: string;
  time: string;
  createdAt: number;
}

export async function syncToGoogleSheets(entry: MoneyEntry, pin: string): Promise<boolean> {
  if (!GOOGLE_SCRIPT_URL) {
    console.warn('Google Sheets URL not configured. Data stored locally only.');
    return false;
  }

  try {
    console.log('Syncing to Google Sheets:', entry);
    
    const formData = new FormData();
    formData.append('data', JSON.stringify({ pin, action: 'ADD_ENTRY', entry }));
    
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: formData,
    });

    const text = await response.text();
    console.log('Google Sheets response:', text);
    
    try {
      const result = JSON.parse(text);
      return result.success === true;
    } catch {
      return response.ok;
    }
  } catch (error) {
    console.error('Failed to sync to Google Sheets:', error);
    return false;
  }
}

export async function deleteFromGoogleSheets(id: string, pin: string): Promise<boolean> {
  if (!GOOGLE_SCRIPT_URL) {
    console.warn('Google Sheets URL not configured. Cannot delete from sheet.');
    return false;
  }

  try {
    console.log('Deleting from Google Sheets, id:', id);

    const formData = new FormData();
    formData.append('data', JSON.stringify({ pin, action: 'DELETE_ENTRY', id }));

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: formData,
    });

    const text = await response.text();
    console.log('Google Sheets delete response:', text);
    const result = JSON.parse(text);
    return result.success === true;
  } catch (error) {
    console.error('Failed to delete from Google Sheets:', error);
    return false;
  }
}

export async function fetchFromGoogleSheets(pin: string): Promise<MoneyEntry[] | null> {
  if (!GOOGLE_SCRIPT_URL) {
    console.warn('Google Sheets URL not configured.');
    return null;
  }

  try {
    const url = `${GOOGLE_SCRIPT_URL}?pin=${encodeURIComponent(pin)}&v=${Date.now()}`;
    const response = await fetch(url);
    const result = await response.json();
    
    if (result.error) {
      console.error('Google Sheets error:', result.error);
      return null;
    }

    // Sanitize and type-cast entries from the sheet
    const entries: MoneyEntry[] = (result.entries || []).map((entry: any) => ({
      id: String(entry.id || ''),
      amount: parseFloat(entry.amount) || 0,
      note: String(entry.note || ''),
      type: entry.type === 'income' ? 'income' : 'expense',
      date: String(entry.date || '').trim().split('T')[0], // Ensure date is in YYYY-MM-DD format and trimmed
      time: String(entry.time || ''),
      createdAt: parseInt(String(entry.createdAt), 10) || 0,
    })).filter((e: MoneyEntry) => e.id); // Filter out entries without an ID

    return entries;
  } catch (error) {
    console.error('Failed to fetch from Google Sheets:', error);
    return null;
  }
}

export function isGoogleSheetsConfigured(): boolean {
  return Boolean(GOOGLE_SCRIPT_URL);
}
