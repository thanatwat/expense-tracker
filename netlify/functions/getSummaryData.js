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
    // ดึงข้อมูลรายการทั้งหมดจาก Google Sheets
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Transactions!A2:E'
    });

    const rows = response.data.values || [];

    // สร้างข้อมูลสรุป
    let totalIncome = 0;
    let totalExpense = 0;
    let categorySummary = {};

    rows.forEach(row => {
      // ตรวจสอบความถูกต้องของข้อมูล
      if (row.length < 4) return;

      const date = row[0]; // วันที่
      const type = row[1]; // ประเภท (รายรับ/รายจ่าย)
      const category = row[2]; // หมวดหมู่
      const amount = parseFloat(row[3]) || 0; // จำนวนเงิน

      if (type === 'รายรับ') {
        totalIncome += amount;
      } else if (type === 'รายจ่าย') {
        totalExpense += amount;
      }

      // สรุปตามหมวดหมู่
      if (!categorySummary[category]) {
        categorySummary[category] = {
          type: type,
          amount: 0
        };
      }
      categorySummary[category].amount += amount;
    });

    // คำนวณยอดคงเหลือ
    const balance = totalIncome - totalExpense;

    // สร้างข้อมูลสำหรับส่งกลับ
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: {
          totalIncome,
          totalExpense,
          balance,
          categories: categorySummary
        }
      })
    };

  } catch (error) {
    console.error('Error getting summary data:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสรุป: ' + error.message
      })
    };
  }
};