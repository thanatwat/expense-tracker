// ตัวแปรสำหรับเก็บข้อมูลทั่วไป
let currentPage = 1;
let totalPages = 1;
let categories = [];
let currentTab = 'add';

// เมื่อเอกสารโหลดเสร็จ
document.addEventListener('DOMContentLoaded', function() {
  // ตั้งค่าวันที่เริ่มต้นเป็นวันนี้
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('date').value = today;

  // โหลดหมวดหมู่
  loadCategories();

  // เพิ่ม event listener สำหรับฟอร์ม
  document.getElementById('transaction-form').addEventListener('submit', handleFormSubmit);

  // เพิ่ม event listener สำหรับปุ่มแท็บ
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      switchTab(this.dataset.tab);
    });
  });

  // เพิ่ม event listener สำหรับการเลือกประเภทรายการ
  document.querySelectorAll('input[name="type"]').forEach(radio => {
    radio.addEventListener('change', updateCategoryOptions);
  });

  // เริ่มต้นที่แท็บ "เพิ่มรายการ"
  switchTab('add');
});

// สลับแท็บ
function switchTab(tabId) {
  currentTab = tabId;

  // ซ่อนแท็บทั้งหมด
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });

  // แสดงเฉพาะแท็บที่เลือก
  document.getElementById(tabId).classList.add('active');

  // เปลี่ยนสถานะปุ่ม
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.tab === tabId) {
      btn.classList.add('active');
    }
  });

  // โหลดข้อมูลตามแท็บ
  if (tabId === 'history') {
    loadTransactions(1);
  } else if (tabId === 'report') {
    loadSummaryData();
  }
}

// โหลดข้อมูลหมวดหมู่
function loadCategories() {
  fetch('/.netlify/functions/getCategories')
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        categories = data.categories;
        updateCategoryOptions();
      } else {
        showNotification(data.message || 'ไม่สามารถโหลดหมวดหมู่ได้', 'error');
      }
    })
    .catch(error => {
      console.error('Error loading categories:', error);
      showNotification('เกิดข้อผิดพลาดในการโหลดหมวดหมู่', 'error');
    });
}

// อัพเดทตัวเลือกหมวดหมู่
function updateCategoryOptions() {
  const categorySelect = document.getElementById('category');
  const selectedType = document.querySelector('input[name="type"]:checked').value;
  
  // ล้างตัวเลือกเดิม
  categorySelect.innerHTML = '<option value="" disabled selected>เลือกหมวดหมู่</option>';
  
  // กรองหมวดหมู่ตามประเภทที่เลือก
  const filteredCategories = categories.filter(category => category.type === selectedType);
  
  // เพิ่มตัวเลือกใหม่
  filteredCategories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.name;
    option.textContent = category.name;
    categorySelect.appendChild(option);
  });
}

// จัดการการส่งฟอร์ม
function handleFormSubmit(event) {
  event.preventDefault();
  
  // ปิดการใช้งานปุ่มส่ง
  const submitBtn = document.querySelector('.submit-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'กำลังบันทึก...';
  
  // รวบรวมข้อมูลจากฟอร์ม
  const formData = {
    date: document.getElementById('date').value,
    type: document.querySelector('input[name="type"]:checked').value,
    category: document.getElementById('category').value,
    amount: document.getElementById('amount').value,
    description: document.getElementById('description').value
  };
  
  // ส่งข้อมูลไปบันทึก
  fetch('/.netlify/functions/addTransaction', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
  })
    .then(response => response.json())
    .then(data => {
      // คืนค่าปุ่ม
      submitBtn.disabled = false;
      submitBtn.textContent = 'บันทึกรายการ';
      
      if (data.success) {
        // รีเซ็ตฟอร์ม
        document.getElementById('transaction-form').reset();
        document.getElementById('date').value = new Date().toISOString().split('T')[0];
        document.querySelector('input[name="type"][value="รายรับ"]').checked = true;
        updateCategoryOptions();
        
        // แสดงข้อความสำเร็จ
        showNotification(data.message || 'บันทึกข้อมูลสำเร็จ', 'success');
        
        // รีเฟรชข้อมูลถ้าอยู่ในแท็บอื่น
        if (currentTab === 'history') {
          loadTransactions(1);
        } else if (currentTab === 'report') {
          loadSummaryData();
        }
      } else {
        showNotification(data.message || 'ไม่สามารถบันทึกข้อมูลได้', 'error');
      }
    })
    .catch(error => {
      console.error('Error saving transaction:', error);
      submitBtn.disabled = false;
      submitBtn.textContent = 'บันทึกรายการ';
      showNotification('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
    });
}

// โหลดข้อมูลรายการ
function loadTransactions(page) {
  currentPage = page || 1;
  
  const container = document.getElementById('transactions-list');
  container.innerHTML = '<p class="loading">กำลังโหลดข้อมูล...</p>';
  
  fetch(`/.netlify/functions/getTransactions?page=${currentPage}&perPage=10`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        displayTransactions(data);
      } else {
        container.innerHTML = `<p class="error-message">${data.message || 'ไม่สามารถโหลดข้อมูลได้'}</p>`;
      }
    })
    .catch(error => {
      console.error('Error loading transactions:', error);
      container.innerHTML = '<p class="error-message">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>';
    });
}

// แสดงข้อมูลรายการ
function displayTransactions(data) {
  const container = document.getElementById('transactions-list');
  const paginationControls = document.getElementById('pagination-controls');
  
  container.innerHTML = '';
  
  if (!data.transactions || data.transactions.length === 0) {
    container.innerHTML = '<p>ยังไม่มีรายการ กรุณาเพิ่มรายการใหม่ก่อน</p>';
    paginationControls.innerHTML = '';
    return;
  }
  
  // สร้างรายการแสดงข้อมูล
  const list = document.createElement('div');
  list.className = 'transactions-container';
  
  data.transactions.forEach(transaction => {
    // จัดรูปแบบวันที่
    let dateStr = 'ไม่ระบุวันที่';
    try {
      if (transaction.date) {
        const dateParts = transaction.date.split('-');
        if (dateParts.length === 3) {
          dateStr = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
        } else {
          const date = new Date(transaction.date);
          if (!isNaN(date.getTime())) {
            dateStr = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
          }
        }
      }
    } catch (e) {
      console.warn('Date conversion error:', e);
    }
    
    const type = transaction.type || 'ไม่ระบุ';
    const category = transaction.category || 'ไม่ระบุ';
    const amount = parseFloat(transaction.amount) || 0;
    const description = transaction.description || '';
    
    const item = document.createElement('div');
    item.className = 'transaction-item';
    
    const amountClass = type === 'รายรับ' ? 'income' : 'expense';
    const amountSign = type === 'รายรับ' ? '+' : '-';
    
    item.innerHTML = `
      <div class="transaction-date">${dateStr}</div>
      <div class="transaction-category">${category}</div>
      <div class="transaction-description">${description}</div>
      <div class="transaction-amount ${amountClass}">${amountSign}${amount.toLocaleString()} บาท</div>
    `;
    
    list.appendChild(item);
  });
  
  container.appendChild(list);
  
  // สร้างปุ่มสำหรับการเปลี่ยนหน้า
  paginationControls.innerHTML = '';
  
  if (data.pagination && data.pagination.totalPages > 1) {
    const { page, totalPages } = data.pagination;
    
    // ปุ่มย้อนกลับ
    if (page > 1) {
      const prevBtn = document.createElement('button');
      prevBtn.textContent = 'หน้าก่อนหน้า';
      prevBtn.className = 'pagination-btn';
      prevBtn.onclick = function() { loadTransactions(page - 1); };
      paginationControls.appendChild(prevBtn);
    }
    
    // ข้อความแสดงหน้า
    const pageInfo = document.createElement('span');
    pageInfo.className = 'page-info';
    pageInfo.textContent = `หน้า ${page} จาก ${totalPages}`;
    paginationControls.appendChild(pageInfo);
    
    // ปุ่มหน้าถัดไป
    if (page < totalPages) {
      const nextBtn = document.createElement('button');
      nextBtn.textContent = 'หน้าถัดไป';
      nextBtn.className = 'pagination-btn';
      nextBtn.onclick = function() { loadTransactions(page + 1); };
      paginationControls.appendChild(nextBtn);
    }
  }
}

// โหลดข้อมูลสรุป
function loadSummaryData() {
  const container = document.getElementById('summary-data');
  container.innerHTML = '<p class="loading">กำลังโหลดข้อมูล...</p>';
  
  fetch('/.netlify/functions/getSummaryData')
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        displaySummaryData(result.data);
      } else {
        container.innerHTML = `<p class="error-message">${result.message || 'ไม่สามารถโหลดข้อมูลสรุปได้'}</p>`;
      }
    })
    .catch(error => {
      console.error('Error loading summary data:', error);
      container.innerHTML = '<p class="error-message">เกิดข้อผิดพลาดในการโหลดข้อมูลสรุป</p>';
    });
}

// แสดงข้อมูลสรุป
function displaySummaryData(data) {
  const container = document.getElementById('summary-data');
  container.innerHTML = '';
  
  // สร้างการ์ดสรุปรายรับ
  const incomeCard = document.createElement('div');
  incomeCard.className = 'summary-card';
  incomeCard.innerHTML = `
    <h3>รายรับรวม</h3>
    <div class="summary-value summary-positive">${data.totalIncome.toLocaleString()} บาท</div>
  `;
  container.appendChild(incomeCard);
  
  // สร้างการ์ดสรุปรายจ่าย
  const expenseCard = document.createElement('div');
  expenseCard.className = 'summary-card';
  expenseCard.innerHTML = `
    <h3>รายจ่ายรวม</h3>
    <div class="summary-value summary-negative">${data.totalExpense.toLocaleString()} บาท</div>
  `;
  container.appendChild(expenseCard);
  
  // สร้างการ์ดสรุปยอดคงเหลือ
  const balanceCard = document.createElement('div');
  balanceCard.className = 'summary-card';
  const balanceClass = data.balance >= 0 ? 'summary-positive' : 'summary-negative';
  balanceCard.innerHTML = `
    <h3>ยอดคงเหลือ</h3>
    <div class="summary-value ${balanceClass}">${data.balance.toLocaleString()} บาท</div>
  `;
  container.appendChild(balanceCard);
  
  // สร้างการ์ดสรุปตามหมวดหมู่
  const categoryCard = document.createElement('div');
  categoryCard.className = 'summary-card';
  categoryCard.innerHTML = '<h3>สรุปตามหมวดหมู่</h3>';
  
  // เพิ่มรายการหมวดหมู่
  const categoryList = document.createElement('div');
  categoryList.className = 'category-list';
  
  if (data.categories && Object.keys(data.categories).length > 0) {
    Object.keys(data.categories).forEach(categoryName => {
      const categoryData = data.categories[categoryName];
      const categoryClass = categoryData.type === 'รายรับ' ? 'income' : 'expense';
      const categorySign = categoryData.type === 'รายรับ' ? '+' : '-';
      
      const categoryItem = document.createElement('div');
      categoryItem.className = 'category-item';
      categoryItem.innerHTML = `
        <div>${categoryName}</div>
        <div class="${categoryClass}">${categorySign}${categoryData.amount.toLocaleString()} บาท</div>
      `;
      
      categoryList.appendChild(categoryItem);
    });
  } else {
    categoryList.innerHTML = '<p>ไม่พบข้อมูลหมวดหมู่</p>';
  }
  
  categoryCard.appendChild(categoryList);
  container.appendChild(categoryCard);
}

// แสดงการแจ้งเตือน
function showNotification(message, type = 'success') {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.className = `notification ${type}`;
  notification.classList.add('show');
  
  // ซ่อนการแจ้งเตือนหลังจาก 3 วินาที
  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}