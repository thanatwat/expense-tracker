const { google } = require('googleapis');
require('dotenv').config();

exports.handler = async function(event, context) {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  
  try {
    // Check if environment variables are set
    if (!process.env.GOOGLE_CLIENT_EMAIL) {
      console.error('GOOGLE_CLIENT_EMAIL is not set');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false, 
          message: 'Server configuration error: Missing GOOGLE_CLIENT_EMAIL'
        })
      };
    }
    
    if (!process.env.GOOGLE_PRIVATE_KEY) {
      console.error('GOOGLE_PRIVATE_KEY is not set');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false, 
          message: 'Server configuration error: Missing GOOGLE_PRIVATE_KEY'
        })
      };
    }
    
    if (!process.env.SPREADSHEET_ID) {
      console.error('SPREADSHEET_ID is not set');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false, 
          message: 'Server configuration error: Missing SPREADSHEET_ID'
        })
      };
    }

    // Log the environment variables (but hide sensitive parts)
    console.log('Environment variables check:');
    console.log('GOOGLE_CLIENT_EMAIL:', process.env.GOOGLE_CLIENT_EMAIL ? 'Set ✓' : 'Not set ✗');
    console.log('GOOGLE_PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY ? 'Set ✓' : 'Not set ✗');
    console.log('SPREADSHEET_ID:', process.env.SPREADSHEET_ID ? 'Set ✓' : 'Not set ✗');

    // ใช้ Base64 Private Key
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;
    if (process.env.GOOGLE_PRIVATE_KEY_BASE64) {
      privateKey = Buffer.from(process.env.GOOGLE_PRIVATE_KEY_BASE64, 'base64').toString();
    } else {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
    
    // ตั้งค่า Google Sheets API
    const auth = new google.auth.JWT(
      process.env.GOOGLE_CLIENT_EMAIL,
      null,
      privateKey,
      ['https://www.googleapis.com/auth/spreadsheets']
    );

    const sheets = google.sheets({ version: 'v4', auth });
    const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

    // ดึงข้อมูลหมวดหมู่จาก Google Sheets
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Categories!A:C'
    });
    
    // ตรวจสอบว่ามีข้อมูลหรือไม่
    if (!response.data.values || response.data.values.length <= 1) {
      return {
        statusCode: 200,
        headers,
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
      headers,
      body: JSON.stringify({
        success: true,
        categories: categories
      })
    };
    
  } catch (error) {
    console.error('Error details:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: `เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่: ${error.message}`
      })
    };
  }
};