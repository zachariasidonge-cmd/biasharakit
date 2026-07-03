// Data Models & Live State Arrays
let receiptItems = [];

// DOM Elements Selection
const mpesaInput = document.getElementById('mpesaAmount');
const costSend = document.getElementById('costSend');
const costWithdraw = document.getElementById('costWithdraw');

const bizNameInput = document.getElementById('bizName');
const itemNameInput = document.getElementById('itemName');
const itemPriceInput = document.getElementById('itemPrice');
const addItemBtn = document.getElementById('addItemBtn');
const receiptPreview = document.getElementById('receiptPreview');
const copyReceiptBtn = document.getElementById('copyReceiptBtn');

// --- 1. M-PESA FEE LOGIC (Official Safaricom Tiers) ---
mpesaInput.addEventListener('input', (e) => {
    const amount = parseFloat(e.target.value) || 0;
    
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
        sendFee = 53; withdrawFee = 52;
    } else if (amount >= 3501 && amount <= 5000) {
        sendFee = 57; withdrawFee = 69;
    } else if (amount >= 5011 && amount <= 7500) {
        sendFee = 78; withdrawFee = 87;
    } else if (amount >= 7501 && amount <= 10000) {
        sendFee = 90; withdrawFee = 115;
    } else if (amount >= 10001 && amount <= 15000) {
        sendFee = 100; withdrawFee = 167;
    } else if (amount >= 15001 && amount <= 20000) {
        sendFee = 105; withdrawFee = 185;
    } else if (amount >= 20001 && amount <= 35000) {
        sendFee = 108; withdrawFee = 197;
    } else if (amount >= 35001 && amount <= 50000) {
        sendFee = 108; withdrawFee = 278;
    } else if (amount >= 50001 && amount <= 250000) {
        sendFee = 108; withdrawFee = 309;
    }

    costSend.innerText = `Ksh ${sendFee}`;
    costWithdraw.innerText = amount > 250000 ? "Above limit" : `Ksh ${withdrawFee}`;
});

// --- 2. WHATSAPP RECEIPT LOGIC ---
addItemBtn.addEventListener('click', () => {
    const name = itemNameInput.value.trim();
    const price = parseFloat(itemPriceInput.value) || 0;

    if (name === "" || price <= 0) return;

    receiptItems.push({ name, price });
    
    // Clear item inputs safely
    itemNameInput.value = "";
    itemPriceInput.value = "";
    
    updateReceiptDisplay();
});

function updateReceiptDisplay() {
    const storeName = bizNameInput.value.toUpperCase() || "MY DUKA";
    let total = 0;
    
    let textStructure = `*🧾 ${storeName} RECEIPT*\n`;
    textStructure += `-----------------------------\n`;
    
    receiptItems.forEach((item, index) => {
        textStructure += `${index + 1}. ${item.name} - Ksh ${item.price}\n`;
        total += item.price;
    });
    
    textStructure += `-----------------------------\n`;
    textStructure += `*TOTAL AMOUNT: Ksh ${total}*\n\n`;
    textStructure += `Thank you for your business! 🙏\n`;
    textStructure += `_Generated via BiasharaKit_`;

    receiptPreview.value = textStructure;
}

// Copy Action handler
copyReceiptBtn.addEventListener('click', () => {
    if (receiptItems.length === 0) return;
    
    receiptPreview.select();
    document.execCommand('copy');
    
    const initialText = copyReceiptBtn.innerText;
    copyReceiptBtn.innerText = "✅ Copied Successfully!";
    copyReceiptBtn.classList.replace('bg-emerald-600', 'bg-slate-700');
    
    setTimeout(() => {
        copyReceiptBtn.innerText = initialText;
        copyReceiptBtn.classList.replace('bg-slate-700', 'bg-emerald-600');
    }, 2000);
});