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
    // รับพารามิเตอร์สำหรับการแบ่งหน้า
    const params = event.queryStringParameters || {};
    const page = parseInt(params.page) || 1;
    const perPage = parseInt(params.perPage) || 10;
    
    // ดึงข้อมูลทั้งหมดจาก Google Sheets
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Transactions!A:E'
    });

    // ตรวจสอบว่ามีข้อมูลหรือไม่
    if (!response.data.values || response.data.values.length <= 1) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'ไม่พบข้อมูลรายการ',
          transactions: [],
          pagination: {
            page: 1,
            perPage: perPage,
            total: 0,
            totalPages: 0
          }
        })
      };
    }

    const headers = response.data.values[0];
    const rows = response.data.values.slice(1);
    
    // คำนวณการแบ่งหน้า
    const totalRows = rows.length;
    const totalPages = Math.ceil(totalRows / perPage);
    const startIndex = (page - 1) * perPage;
    const endIndex = Math.min(startIndex + perPage, totalRows);
    
    // ดึงข้อมูลเฉพาะหน้าที่ต้องการ
    const pageRows = rows.slice(startIndex, endIndex);
    
    // แปลงข้อมูลให้อยู่ในรูปแบบที่ใช้งานง่าย
    const transactions = pageRows.map(row => {
      return {
        date: row[0] || '',
        type: row[1] || '',
        category: row[2] || '',
        amount: parseFloat(row[3]) || 0,
        description: row[4] || ''
      };
    });
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        transactions: transactions,
        pagination: {
          page: page,
          perPage: perPage,
          total: totalRows,
          totalPages: totalPages
        }
      })
    };
    
  } catch (error) {
    console.error('Error getting transactions:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรายการ: ' + error.message
      })
    };
  }
};