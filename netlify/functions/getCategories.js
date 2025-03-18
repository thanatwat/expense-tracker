const { google } = require('googleapis');
require('dotenv').config();

// ตั้งค่า Google Sheets API
const auth = new google.auth.JWT(
  process.env.GOOGLE_CLIENT_EMAIL,
  null,
  process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/spreadsheets']
);

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

exports.handler = async function(event, context) {
  try {
    // ดึงข้อมูลหมวดหมู่จาก Google Sheets
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Categories!A:C'
    });
    
    // ตรวจสอบว่ามีข้อมูลหรือไม่
    if (!response.data.values || response.data.values.length <= 1) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'ไม่พบข้อมูลหมวดหมู่',
          categories: []
        })
      };
    }
    
    const headers = response.data.values[0];
    const rows = response.data.values.slice(1);
    
    // แปลงข้อมูลให้อยู่ในรูปแบบที่ใช้งานง่าย
    const categories = rows.map(row => {
      return {
        name: row[0] || '',
        type: row[1] || '',
        icon: row[2] || ''
      };
    });
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        categories: categories
      })
    };
    
  } catch (error) {
    console.error('Error getting categories:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่: ' + error.message
      })
    };
  }
};