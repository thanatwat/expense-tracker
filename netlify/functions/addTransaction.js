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
    // ตรวจสอบว่าเป็น POST request
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ success: false, message: 'Method Not Allowed' })
      };
    }
    
    // รับข้อมูลจาก request body
    const data = JSON.parse(event.body);
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!data.date || !data.type || !data.category || !data.amount) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: 'กรุณากรอกข้อมูลให้ครบถ้วน (วันที่, ประเภท, หมวดหมู่, จำนวนเงิน)'
        })
      };
    }
    
    // เตรียมข้อมูลสำหรับบันทึก
    const values = [
      [
        data.date,
        data.type,
        data.category,
        parseFloat(data.amount),
        data.description || ''
      ]
    ];
    
    // บันทึกข้อมูลลงใน Google Sheets
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Transactions!A2:E',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: values
      }
    });
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'บันทึกข้อมูลสำเร็จ'
      })
    };
    
  } catch (error) {
    console.error('Error adding transaction:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + error.message
      })
    };
  }
};