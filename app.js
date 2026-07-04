// =============================================
// BiasharaKit v2.1 - Premium Offline SME Toolkit
// Modern, responsive, glassmorphism UI with persistence
// =============================================

let receiptItems = [];
let calculationMode = 'P2P';
let receiptNumber = 1;

// DOM Elements
const mpesaInput = document.getElementById('mpesaAmount');
const costLeft = document.getElementById('costLeft');
const costRight = document.getElementById('costRight');
const labelOutputLeft = document.getElementById('labelOutputLeft');
const labelOutputRight = document.getElementById('labelOutputRight');

const tabP2P = document.getElementById('tabP2P');
const tabPaybill = document.getElementById('tabPaybill');
const tabTill = document.getElementById('tabTill');

const bizNameInput = document.getElementById('bizName');
const customerNameInput = document.getElementById('customerName');
const itemNameInput = document.getElementById('itemName');
const itemPriceInput = document.getElementById('itemPrice');
const itemVatCheckbox = document.getElementById('itemVat');
const addItemBtn = document.getElementById('addItemBtn');
const clearListBtn = document.getElementById('clearListBtn');
const itemsListEl = document.getElementById('itemsList');
const receiptPreview = document.getElementById('receiptPreview');
const copyReceiptBtn = document.getElementById('copyReceiptBtn');
const printBtn = document.getElementById('printBtn');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
        themeIcon.textContent = '🌙';
    } else {
        themeIcon.textContent = '☀️';
    }
}

themeToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    themeIcon.textContent = isDark ? '🌙' : '☀️';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// Tab Switching
function switchTab(mode, activeTab, inactive1, inactive2) {
    calculationMode = mode;
    
    // Reset all tabs
    [tabP2P, tabPaybill, tabTill].forEach(tab => {
        tab.classList.remove('active', 'bg-white', 'dark:bg-slate-700', 'shadow-sm', 'text-amber-600');
        tab.classList.add('text-slate-600', 'dark:text-slate-400');
    });
    
    activeTab.classList.add('active', 'bg-white', 'dark:bg-slate-700', 'shadow-sm', 'text-amber-600');
    
    runTariffCalculation();
}

// Attach tab listeners
tabP2P.addEventListener('click', () => switchTab('P2P', tabP2P, tabPaybill, tabTill));
tabPaybill.addEventListener('click', () => switchTab('PAYBILL', tabPaybill, tabP2P, tabTill));
tabTill.addEventListener('click', () => switchTab('TILL', tabTill, tabP2P, tabPaybill));

// M-PESA Tariff Engine (Fixed & Optimized)
function runTariffCalculation() {
    const amount = parseFloat(mpesaInput.value) || 0;
    
    if (calculationMode === 'P2P') {
        labelOutputLeft.textContent = "Send to M-Pesa (P2P)";
        labelOutputRight.textContent = "Agent Withdrawal";
        
        let sendFee = 0;
        let withdrawFee = 0;

        if (amount >= 1 && amount <= 49) { 
            sendFee = 0; withdrawFee = 0; 
        } else if (amount >= 50 && amount <= 100) { 
            sendFee = 0; withdrawFee = 11; 
        } else if (amount >= 101 && amount <= 500) { 
            sendFee = 7; withdrawFee = 29; 
        } else if (amount >= 501 && amount <= 1000) { 
            sendFee = 13; withdrawFee = 29; 
        } else if (amount >= 1001 && amount <= 1500) { 
            sendFee = 23; withdrawFee = 29; 
        } else if (amount >= 1501 && amount <= 2500) { 
            sendFee = 33; withdrawFee = 29; 
        } else if (amount >= 2501 && amount <= 3500) { 
            sendFee = 56; withdrawFee = 52; 
        } else if (amount >= 3501 && amount <= 5000) { 
            sendFee = 57; withdrawFee = 69; 
        } else if (amount >= 5001 && amount <= 7500) { 
            sendFee = 78; withdrawFee = 87; 
        } else if (amount >= 7501 && amount <= 10000) { 
            sendFee = 90; withdrawFee = 115; 
        } else if (amount >= 10001 && amount <= 15000) { 
            sendFee = 100; withdrawFee = 167; 
        } else if (amount >= 15001 && amount <= 20000) { 
            sendFee = 105; withdrawFee = 185; 
        } else if (amount >= 20001 && amount <= 250000) { 
            sendFee = 108; withdrawFee = 309; 
        } else if (amount > 250000) {
            sendFee = 108; withdrawFee = "Limit Exceeded";
        }

        costLeft.textContent = `Ksh ${sendFee}`;
        costRight.textContent = typeof withdrawFee === 'number' ? `Ksh ${withdrawFee}` : withdrawFee;

    } else if (calculationMode === 'PAYBILL') {
        labelOutputLeft.textContent = "Customer Paybill Fee";
        labelOutputRight.textContent = "Business Absorbs";
        
        let customerCharge = 0;
        if (amount <= 100) customerCharge = 0;
        else if (amount <= 500) customerCharge = 7;
        else if (amount <= 1000) customerCharge = 13;
        else if (amount <= 1500) customerCharge = 23;
        else if (amount <= 2500) customerCharge = 33;
        else if (amount <= 3500) customerCharge = 53;
        else if (amount <= 5000) customerCharge = 57;
        else if (amount <= 7500) customerCharge = 78;
        else if (amount <= 10000) customerCharge = 90;
        else customerCharge = 108;

        costLeft.textContent = `Ksh ${customerCharge}`;
        costRight.textContent = `Ksh 0`;

    } else if (calculationMode === 'TILL') {
        labelOutputLeft.textContent = "Customer (Free)";
        labelOutputRight.textContent = "Merchant Commission";
        
        let merchantFee = amount <= 200 ? 0 : Math.min(amount * 0.005, 200);
        costLeft.textContent = `Ksh 0`;
        costRight.textContent = `Ksh ${merchantFee.toFixed(2)}`;
    }
}

mpesaInput.addEventListener('input', runTariffCalculation);

// Receipt Management
function renderItemsList() {
    itemsListEl.innerHTML = '';
    
    if (receiptItems.length === 0) {
        itemsListEl.innerHTML = `<div class="text-center py-12 text-slate-400 dark:text-slate-500 italic">No items added yet...</div>`;
        return;
    }
    
    receiptItems.forEach((item, index) => {
        const itemEl = document.createElement('div');
        itemEl.className = `receipt-item flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 group`;
        
        itemEl.innerHTML = `
            <div class="flex-1">
                <div class="font-medium">${item.name}</div>
                <div class="text-xs text-slate-500 dark:text-slate-400">Ksh ${item.price.toFixed(2)} ${item.vatAmount > 0 ? '(VAT incl.)' : ''}</div>
            </div>
            <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button onclick="editItem(${index})" class="text-amber-500 hover:text-amber-600 p-1">✏️</button>
                <button onclick="deleteItem(${index})" class="text-rose-500 hover:text-rose-600 p-1">🗑️</button>
            </div>
        `;
        
        itemsListEl.appendChild(itemEl);
    });
}

window.editItem = function(index) {
    const item = receiptItems[index];
    itemNameInput.value = item.name;
    itemPriceInput.value = item.price;
    itemVatCheckbox.checked = item.vatAmount > 0;
    receiptItems.splice(index, 1);
    renderItemsList();
    updateReceiptDisplay();
};

window.deleteItem = function(index) {
    if (confirm('Delete this item?')) {
        receiptItems.splice(index, 1);
        renderItemsList();
        updateReceiptDisplay();
    }
};

addItemBtn.addEventListener('click', () => {
    const name = itemNameInput.value.trim();
    const price = parseFloat(itemPriceInput.value) || 0;
    const isVat = itemVatCheckbox.checked;

    if (!name || price <= 0) {
        alert("Please enter valid item name and price");
        return;
    }

    let vatAmount = 0;
    if (isVat) {
        vatAmount = price - (price / 1.16);
    }

    receiptItems.push({ name, price, vatAmount });
    
    itemNameInput.value = '';
    itemPriceInput.value = '';
    itemVatCheckbox.checked = false;
    
    renderItemsList();
    updateReceiptDisplay();
});

clearListBtn.addEventListener('click', () => {
    if (confirm('Clear all items?')) {
        receiptItems = [];
        renderItemsList();
        updateReceiptDisplay();
    }
});

// Receipt Display
function updateReceiptDisplay() {
    const storeName = bizNameInput.value.trim().toUpperCase() || "MY DUKA";
    const customerName = customerNameInput.value.trim();
    const currentDate = new Date().toLocaleDateString('en-KE', { 
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' 
    });
    const currentTime = new Date().toLocaleTimeString('en-KE', { 
        hour: '2-digit', minute: '2-digit' 
    });

    let total = 0;
    let totalVat = 0;
    
    let text = `*🧾 ${storeName}*\n`;
    text += `📍 Receipt #${String(receiptNumber).padStart(4, '0')}\n`;
    text += `📅 ${currentDate}   ⏰ ${currentTime}\n`;
    
    if (customerName) text += `👤 Customer: ${customerName}\n`;
    text += `--------------------------------\n\n`;

    receiptItems.forEach((item, i) => {
        text += `${i+1}. ${item.name}\n   Ksh ${item.price.toFixed(2)}\n`;
        total += item.price;
        totalVat += item.vatAmount;
    });

    text += `\n--------------------------------\n`;
    if (totalVat > 0) text += `VAT (16% KRA): Ksh ${totalVat.toFixed(2)}\n`;
    text += `*TOTAL: Ksh ${total.toFixed(2)}*\n\n`;
    text += `Thank you! Karibu tena 🙏\n`;
    text += `_Powered by BiasharaKit v2.1_`;

    receiptPreview.textContent = text;
}

// Copy, Print, PDF
copyReceiptBtn.addEventListener('click', () => {
    if (receiptItems.length === 0) return alert("Add some items first!");
    
    navigator.clipboard.writeText(receiptPreview.textContent).then(() => {
        const orig = copyReceiptBtn.innerHTML;
        copyReceiptBtn.innerHTML = `✅ Copied!`;
        setTimeout(() => copyReceiptBtn.innerHTML = orig, 1800);
    });
});

printBtn.addEventListener('click', () => {
    if (receiptItems.length === 0) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<html><head><title>Receipt</title><style>body{font-family:monospace;padding:40px;}</style></head><body>${receiptPreview.innerHTML.replace(/\n/g, '<br>')}</body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
});

downloadPdfBtn.addEventListener('click', () => {
    if (receiptItems.length === 0) return alert("No items to export");
    printBtn.click();
});

// Local Storage
function saveToLocalStorage() {
    localStorage.setItem('biashara_receiptItems', JSON.stringify(receiptItems));
    localStorage.setItem('biashara_bizName', bizNameInput.value);
    localStorage.setItem('biashara_customerName', customerNameInput.value);
}

function loadFromLocalStorage() {
    const savedItems = localStorage.getItem('biashara_receiptItems');
    if (savedItems) receiptItems = JSON.parse(savedItems);
    
    const savedBiz = localStorage.getItem('biashara_bizName');
    if (savedBiz) bizNameInput.value = savedBiz;
    
    const savedCustomer = localStorage.getItem('biashara_customerName');
    if (savedCustomer) customerNameInput.value = savedCustomer;
    
    renderItemsList();
    updateReceiptDisplay();
}

function setupAutoSave() {
    [bizNameInput, customerNameInput].forEach(el => {
        el.addEventListener('input', () => {
            saveToLocalStorage();
            updateReceiptDisplay();
        });
    });
}

// Initialize
function initializeApp() {
    initTheme();
    loadFromLocalStorage();
    setupAutoSave();
    runTariffCalculation();
    updateReceiptDisplay();
    
    receiptNumber = parseInt(localStorage.getItem('receiptNumber') || '1');
    localStorage.setItem('receiptNumber', receiptNumber + 1);
}

document.addEventListener('DOMContentLoaded', initializeApp);