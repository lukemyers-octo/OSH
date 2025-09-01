const { google } = require('googleapis');

// --- CONFIGURATION ---
// 1. Find the spreadsheet ID from your Google Sheet's URL.
const SPREADSHEET_ID = '18f2iIZhmWsPnpp3AXDQA48XsjQkCFqBapApdBuLIvjA';
// 2. Set the sheet name and the range of data to fetch.
const RANGE = 'Sheet1!A:Z'; // Example: 'Sheet1!A:D' to get columns A through D

/**
 * Converts an array of sheet rows into an array of JSON objects.
 * Assumes the first row is the header row.
 * @param {any[][]} rows The raw rows from the Google Sheets API.
 * @returns {object[]} An array of objects.
 */
const rowsToObjects = (rows) => {
  if (!rows || rows.length === 0) {
    return [];
  }
  const headers = rows[0];
  const data = rows.slice(1);
  return data.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
};

/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
exports.googleSheetsProxy = async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).send('');
    return;
  }

  try {
    // Create an auth client
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    // Create a Sheets API client
    const sheets = google.sheets({ version: 'v4', auth });

    // Fetch the data from the sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
    });

    // Convert the rows to a more useful JSON format
    const data = rowsToObjects(response.data.values);

    res.status(200).json(data);

  } catch (error) {
    console.error('Error fetching from Google Sheets API:', error);
    // Provide a more specific error message if the API call fails
    const errorMessage = error.response?.data?.error?.message || 'Internal Server Error';
    res.status(500).json({ error: errorMessage });
  }
};