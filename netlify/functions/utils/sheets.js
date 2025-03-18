const { google } = require('googleapis');

// ฟังก์ชันเชื่อมต่อกับ Google Sheets API
async function getAuthSheets() {
  const auth = new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/spreadsheets']
  );

  const sheets = google.sheets({ version: 'v4', auth });
  return { auth, sheets };
}

module.exports = { getAuthSheets };