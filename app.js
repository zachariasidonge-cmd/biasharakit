// App Architecture State
let receiptItems = [];
let calculationMode = 'P2P'; // P2P, PAYBILL, or TILL

// DOM Target Element Mappings
const mpesaInput = document.getElementById('mpesaAmount');
const costLeft = document.getElementById('costLeft');
const costRight = document.getElementById('costRight');
const labelOutputLeft = document.getElementById('labelOutputLeft');
const labelOutputRight = document.getElementById('labelOutputRight');

// Tabs
const tabP2P = document.getElementById('tabP2P');
const tabPaybill = document.getElementById('tabPaybill');
const tabTill = document.getElementById('tabTill');

// Receipt Elements
const bizNameInput = document.getElementById('bizName');
const itemNameInput = document.getElementById('itemName');
const itemPriceInput = document.getElementById('itemPrice');
const itemVatCheckbox = document.getElementById('itemVat');
const addItemBtn = document.getElementById('addItemBtn');
const clearListBtn = document.getElementById('clearListBtn');
const receiptPreview = document.getElementById('receiptPreview');
const copyReceiptBtn = document.getElementById('copyReceiptBtn');

// --- 1. TAB SELECTION SWITCHING LOGIC ---
function switchTab(mode, activeTab, inactive1, inactive2) {
    calculationMode = mode;
    activeTab.className = "py-2 text-xs font-semibold rounded-lg bg-white text-indigo-600 shadow-sm transition";
    inactive1.className = "py-2 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900 transition";
    inactive2.className = "py-2 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900 transition";
    runTariffCalculation();
}

tabP2P.addEventListener('click', () => switchTab('P2P', tabP2P, tabPaybill, tabTill));
tabPaybill.addEventListener('click', () => switchTab('PAYBILL', tabPaybill, tabP2P, tabTill));
tabTill.addEventListener('click', () => switchTab('TILL', tabTill, tabP2P, tabPaybill));

// --- 2. 2026 M-PESA TARIFF ENGINE EXECUTOR ---
mpesaInput.addEventListener('input', runTariffCalculation);

function runTariffCalculation() {
    const amount = parseFloat(mpesaInput.value) || 0;
    
    if (calculationMode === 'P2P') {
        labelOutputLeft.innerText = "Send to M-Pesa User";
        labelOutputRight.innerText = "Agent Withdrawal Fee";
        
        let sendFee = 0;
        let withdrawFee = 0;

        if (amount >= 1 && amount <= 49) { sendFee = 0; withdrawFee = 0; }
        else if (amount >= 50 && amount <= 100) { sendFee = 0; withdrawFee = 11; }
        else if (amount >= 101 && amount <= 500) { sendFee = 7; withdrawFee = 29; }
        else if (amount >= 501 && amount <= 1000) { sendFee = 13; withdrawFee = 29; }
        else if (amount >= 1001 && amount <= 1500) { sendFee = 23; withdrawFee = 29; }
        else if (amount >= 1501 && amount <= 2500) { sendFee = 33; withdrawFee = 29; }
        else if (amount >= 2501 && amount <= 3500) { sendFee = 56; withdrawFee = 52; }
        else if (amount >= 3501 && amount <= 5000) { sendFee = 57; withdrawFee = 69; }
        else if (amount >= 5011 && amount <= 7500) { sendFee = 78; withdrawFee = 87; }
        else if (amount >= 7501 && amount <= 10000) { sendFee = 90; withdrawFee = 115; }
        else if (amount >= 10001 && amount <= 15000) { sendFee = 100; withdrawFee = 167; }
        else if (amount >= 15011 && amount <= 20000) { sendFee = 105; withdrawFee = 185; }
        else if (amount >= 20001 && amount <= 250000) { sendFee = 108; withdrawFee = 309; }

        costLeft.innerText = `Ksh ${sendFee}`;
        costRight.innerText = amount > 150000 ? "Above Limit" : `Ksh ${withdrawFee}`;

    } else if (calculationMode === 'PAYBILL') {
        labelOutputLeft.innerText = "Customer Charge (Paybill)";
        labelOutputRight.innerText = "Business Charge (Absorbed)";
        
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

        costLeft.innerText = `Ksh ${customerCharge}`;
        costRight.innerText = `Ksh 0`;

    } else if (calculationMode === 'TILL') {
        labelOutputLeft.innerText = "Customer Fee (Buy Goods)";
        labelOutputRight.innerText = "Merchant Commission (0.5%)";
        
        // Till payments are free for consumers. Merchant pays standard 0.5% commission capped at Ksh 200
        let merchantFee = amount <= 200 ? 0 : Math.min(amount * 0.005, 200);

        costLeft.innerText = `Ksh 0`;
        costRight.innerText = `Ksh ${merchantFee.toFixed(2)}`;
    }
}

// --- 3. WHATSAPP RECEIPT VAT EXTRACTION CORE ---
addItemBtn.addEventListener('click', () => {
    const name = itemNameInput.value.trim();
    const price = parseFloat(itemPriceInput.value) || 0;
    const isVatApplicable = itemVatCheckbox.checked;

    if (name === "" || price <= 0) return;

    let vatAmount = 0;
    if (isVatApplicable) {
        // Compute internal KRA 16% VAT portion from total retail price
        vatAmount = price - (price / 1.16);
    }

    receiptItems.push({ name, price, vatAmount });
    
    // Clear item block smoothly
    itemNameInput.value = "";
    itemPriceInput.value = "";
    itemVatCheckbox.checked = false;
    
    updateReceiptDisplay();
});

clearListBtn.addEventListener('click', () => {
    receiptItems = [];
    updateReceiptDisplay();
});

function updateReceiptDisplay() {
    const storeName = bizNameInput.value.toUpperCase() || "MY DUKA";
    let total = 0;
    let totalVat = 0;
    
    let textStructure = `*🧾 ${storeName} RECEIPT*\n`;
    textStructure += `-----------------------------\n`;
    
    receiptItems.forEach((item, index) => {
        textStructure += `${index + 1}. ${item.name} - Ksh ${item.price.toFixed(2)}\n`;
        total += item.price;
        totalVat += item.vatAmount;
    });
    
    textStructure += `-----------------------------\n`;
    if (totalVat > 0) {
        textStructure += `Inc. 16% KRA VAT: Ksh ${totalVat.toFixed(2)}\n`;
    }
    textStructure += `*TOTAL AMOUNT: Ksh ${total.toFixed(2)}*\n\n`;
    textStructure += `Thank you for your business! 🙏\n`;
    textStructure += `_Powered by BiasharaKit_`;

    receiptPreview.value = textStructure;
}

// Global Text Copy Action Handler
copyReceiptBtn.addEventListener('click', () => {
    if (receiptItems.length === 0) return;
    
    receiptPreview.select();
    document.execCommand('copy');
    
    const initialText = copyReceiptBtn.innerText;
    copyReceiptBtn.innerText = "✅ Copied Successfully!";
    
    setTimeout(() => {
        copyReceiptBtn.innerText = initialText;
    }, 2000);
});
