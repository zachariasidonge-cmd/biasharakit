const STORAGE_KEY = "biasharakit.v3.state";

const defaultState = {
  theme: "light",
  mode: "p2p",
  nextReceiptNumber: 1,
  receiptNumber: 1,
  receiptCreatedAt: new Date().toISOString(),
  business: {
    name: "My Duka",
    phone: "",
    location: "",
    pin: ""
  },
  customerName: "",
  items: [],
  sales: []
};

const els = {
  themeToggle: document.querySelector("#themeToggle"),
  themeIcon: document.querySelector("#themeIcon"),
  segments: document.querySelectorAll(".segment"),
  mpesaAmount: document.querySelector("#mpesaAmount"),
  labelOutputLeft: document.querySelector("#labelOutputLeft"),
  labelOutputRight: document.querySelector("#labelOutputRight"),
  costLeft: document.querySelector("#costLeft"),
  costRight: document.querySelector("#costRight"),
  tariffNote: document.querySelector("#tariffNote"),
  receiptForm: document.querySelector("#receiptForm"),
  receiptNumberLabel: document.querySelector("#receiptNumberLabel"),
  businessName: document.querySelector("#businessName"),
  businessPhone: document.querySelector("#businessPhone"),
  businessLocation: document.querySelector("#businessLocation"),
  businessPin: document.querySelector("#businessPin"),
  customerName: document.querySelector("#customerName"),
  customerNames: document.querySelector("#customerNames"),
  customerLookupTitle: document.querySelector("#customerLookupTitle"),
  customerStats: document.querySelector("#customerStats"),
  editingItemId: document.querySelector("#editingItemId"),
  itemName: document.querySelector("#itemName"),
  itemQty: document.querySelector("#itemQty"),
  itemPrice: document.querySelector("#itemPrice"),
  itemVat: document.querySelector("#itemVat"),
  saveItemBtn: document.querySelector("#saveItemBtn"),
  cancelEditBtn: document.querySelector("#cancelEditBtn"),
  clearListBtn: document.querySelector("#clearListBtn"),
  itemsList: document.querySelector("#itemsList"),
  receiptPreview: document.querySelector("#receiptPreview"),
  newReceiptBtn: document.querySelector("#newReceiptBtn"),
  saveSaleBtn: document.querySelector("#saveSaleBtn"),
  copyReceiptBtn: document.querySelector("#copyReceiptBtn"),
  printBtn: document.querySelector("#printBtn"),
  downloadPdfBtn: document.querySelector("#downloadPdfBtn"),
  reportMonth: document.querySelector("#reportMonth"),
  reportSummary: document.querySelector("#reportSummary"),
  downloadCsvBtn: document.querySelector("#downloadCsvBtn"),
  downloadReportPdfBtn: document.querySelector("#downloadReportPdfBtn"),
  salesTableBody: document.querySelector("#salesTableBody"),
  toast: document.querySelector("#toast")
};

let state = loadState();
let toastTimer;

// Current common Kenya M-PESA brackets. Keep the data table-driven for easy updates.
const tariffTables = {
  p2p: {
    leftLabel: "Send fee",
    rightLabel: "Agent withdrawal",
    note: "Fees are bracket based. Agent withdrawal is unavailable below KSh 50.",
    left: [
      [1, 100, 0],
      [101, 500, 7],
      [501, 1000, 13],
      [1001, 1500, 23],
      [1501, 2500, 33],
      [2501, 3500, 53],
      [3501, 5000, 57],
      [5001, 7500, 78],
      [7501, 10000, 90],
      [10001, 15000, 100],
      [15001, 20000, 105],
      [20001, 250000, 108]
    ],
    right: [
      [50, 100, 11],
      [101, 500, 29],
      [501, 1000, 29],
      [1001, 1500, 29],
      [1501, 2500, 29],
      [2501, 3500, 52],
      [3501, 5000, 69],
      [5001, 7500, 87],
      [7501, 10000, 115],
      [10001, 15000, 167],
      [15001, 20000, 185],
      [20001, 35000, 197],
      [35001, 50000, 278],
      [50001, 250000, 309]
    ]
  },
  paybill: {
    leftLabel: "Customer charge",
    rightLabel: "Business charge",
    note: "Customer Paybill charges usually follow send-money brackets. Confirm special business tariffs with Safaricom.",
    left: [
      [1, 100, 0],
      [101, 500, 7],
      [501, 1000, 13],
      [1001, 1500, 23],
      [1501, 2500, 33],
      [2501, 3500, 53],
      [3501, 5000, 57],
      [5001, 7500, 78],
      [7501, 10000, 90],
      [10001, 15000, 100],
      [15001, 250000, 108]
    ],
    right: [[1, 250000, 0]]
  },
  till: {
    leftLabel: "Customer charge",
    rightLabel: "Merchant estimate",
    note: "Buy Goods is free for customers. Merchant commission is estimated at 0.5%, capped at KSh 200.",
    left: [[1, 250000, 0]],
    right: "merchant"
  }
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved ? mergeState(defaultState, saved) : structuredClone(defaultState);
  } catch {
    return structuredClone(defaultState);
  }
}

function mergeState(base, saved) {
  return {
    ...base,
    ...saved,
    business: { ...base.business, ...(saved.business || {}) },
    receiptCreatedAt: saved.receiptCreatedAt || base.receiptCreatedAt,
    items: Array.isArray(saved.items) ? saved.items : [],
    sales: Array.isArray(saved.sales) ? saved.sales : []
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatMoney(value) {
  return `KSh ${Number(value || 0).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function formatReceiptNumber(value) {
  return String(value).padStart(4, "0");
}

function formatDateTime(value) {
  const date = new Date(value);
  return {
    date: date.toLocaleDateString("en-KE", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric"
    }),
    time: date.toLocaleTimeString("en-KE", {
      hour: "2-digit",
      minute: "2-digit"
    })
  };
}

function getCurrentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function findBracket(amount, table) {
  if (amount <= 0) return 0;
  const bracket = table.find(([min, max]) => amount >= min && amount <= max);
  return bracket ? bracket[2] : null;
}

function calculateTariff() {
  const amount = Number(els.mpesaAmount.value) || 0;
  const table = tariffTables[state.mode];
  const left = findBracket(amount, table.left);
  let right = table.right === "merchant" ? Math.min(amount * 0.005, 200) : findBracket(amount, table.right);

  if (amount > 250000) {
    els.costLeft.textContent = "Limit";
    els.costRight.textContent = "Limit";
    els.tariffNote.textContent = "The calculator supports transactions up to KSh 250,000.";
    return;
  }

  els.labelOutputLeft.textContent = table.leftLabel;
  els.labelOutputRight.textContent = table.rightLabel;
  els.costLeft.textContent = left === null ? "N/A" : formatMoney(left);
  els.costRight.textContent = right === null ? "N/A" : formatMoney(right);
  els.tariffNote.textContent = table.note;
}

function applyTheme() {
  document.documentElement.classList.toggle("dark", state.theme === "dark");
  els.themeIcon.textContent = state.theme === "dark" ? "Light" : "Dark";
}

function syncFormFromState() {
  els.businessName.value = state.business.name;
  els.businessPhone.value = state.business.phone;
  els.businessLocation.value = state.business.location;
  els.businessPin.value = state.business.pin;
  els.customerName.value = state.customerName;
  els.receiptNumberLabel.textContent = `Receipt #${formatReceiptNumber(state.receiptNumber)}`;
  if (!els.reportMonth.value) els.reportMonth.value = getCurrentMonthValue();

  els.segments.forEach((segment) => {
    segment.classList.toggle("active", segment.dataset.mode === state.mode);
  });
}

function updateBusinessState() {
  state.business.name = els.businessName.value.trim();
  state.business.phone = els.businessPhone.value.trim();
  state.business.location = els.businessLocation.value.trim();
  state.business.pin = els.businessPin.value.trim();
  state.customerName = els.customerName.value.trim();
  saveAndRender();
}

function getLineTotals(item) {
  const qty = Number(item.qty) || 1;
  const price = Number(item.price) || 0;
  const total = qty * price;
  const vat = item.vat ? total - total / 1.16 : 0;
  return { qty, price, total, vat };
}

function getReceiptTotals() {
  return state.items.reduce(
    (totals, item) => {
      const line = getLineTotals(item);
      totals.subtotal += line.total - line.vat;
      totals.vat += line.vat;
      totals.total += line.total;
      return totals;
    },
    { subtotal: 0, vat: 0, total: 0 }
  );
}

function getSaleTotals(items) {
  return items.reduce(
    (totals, item) => {
      const line = getLineTotals(item);
      totals.subtotal += line.total - line.vat;
      totals.vat += line.vat;
      totals.total += line.total;
      totals.itemCount += line.qty;
      return totals;
    },
    { subtotal: 0, vat: 0, total: 0, itemCount: 0 }
  );
}

function getCustomerSales(name) {
  const query = name.trim().toLowerCase();
  if (!query) return [];
  return state.sales.filter((sale) => sale.customerName.toLowerCase().includes(query));
}

function renderCustomerLookup() {
  const customerMap = new Map();
  state.sales.forEach((sale) => {
    if (!sale.customerName || sale.customerName === "Walk-in") return;
    const key = sale.customerName.toLowerCase();
    const current = customerMap.get(key) || { name: sale.customerName, total: 0, visits: 0, lastVisit: sale.createdAt };
    current.total += sale.totals.total;
    current.visits += 1;
    if (new Date(sale.createdAt) > new Date(current.lastVisit)) current.lastVisit = sale.createdAt;
    customerMap.set(key, current);
  });

  els.customerNames.innerHTML = [...customerMap.values()]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((customer) => `<option value="${escapeHtml(customer.name)}"></option>`)
    .join("");

  const matches = getCustomerSales(state.customerName);
  if (!state.customerName) {
    els.customerLookupTitle.textContent = "Type a customer name to retrieve their data.";
    els.customerStats.innerHTML = "";
    return;
  }

  if (!matches.length) {
    els.customerLookupTitle.textContent = "No saved sales found for this customer yet.";
    els.customerStats.innerHTML = "";
    return;
  }

  const totals = matches.reduce(
    (summary, sale) => {
      summary.total += sale.totals.total;
      summary.items += sale.totals.itemCount;
      if (!summary.lastVisit || new Date(sale.createdAt) > new Date(summary.lastVisit)) summary.lastVisit = sale.createdAt;
      return summary;
    },
    { total: 0, items: 0, lastVisit: "" }
  );
  const lastVisit = formatDateTime(totals.lastVisit).date;
  const recentSales = matches
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3)
    .map((sale) => {
      const when = formatDateTime(sale.createdAt).date;
      return `<li>#${formatReceiptNumber(sale.receiptNumber)} - ${when} - ${formatMoney(sale.totals.total)}</li>`;
    })
    .join("");

  els.customerLookupTitle.textContent = `${matches.length} saved sale${matches.length === 1 ? "" : "s"} found for ${state.customerName}.`;
  els.customerStats.innerHTML = `
    <div class="stat-chip"><span>Total spent</span><strong>${formatMoney(totals.total)}</strong></div>
    <div class="stat-chip"><span>Items bought</span><strong>${totals.items}</strong></div>
    <div class="stat-chip"><span>Last visit</span><strong>${lastVisit}</strong></div>
    <div class="customer-history"><span>Recent receipts</span><ul>${recentSales}</ul></div>
  `;
}

function getMonthlySales(monthValue) {
  return state.sales.filter((sale) => sale.createdAt.slice(0, 7) === monthValue);
}

function renderReports() {
  const monthValue = els.reportMonth.value || getCurrentMonthValue();
  const sales = getMonthlySales(monthValue);
  const totals = sales.reduce(
    (summary, sale) => {
      summary.revenue += sale.totals.total;
      summary.vat += sale.totals.vat;
      summary.items += sale.totals.itemCount;
      summary.customers.add(sale.customerName);
      return summary;
    },
    { revenue: 0, vat: 0, items: 0, customers: new Set() }
  );

  els.reportSummary.innerHTML = `
    <div class="stat-chip"><span>Sales</span><strong>${sales.length}</strong></div>
    <div class="stat-chip"><span>Revenue</span><strong>${formatMoney(totals.revenue)}</strong></div>
    <div class="stat-chip"><span>VAT</span><strong>${formatMoney(totals.vat)}</strong></div>
    <div class="stat-chip"><span>Customers</span><strong>${totals.customers.size}</strong></div>
  `;

  els.salesTableBody.innerHTML = sales.length ? sales.map((sale) => {
    const when = formatDateTime(sale.createdAt);
    const items = sale.items.map((item) => `${item.qty} x ${item.name}`).join(", ");
    return `
      <tr>
        <td>#${formatReceiptNumber(sale.receiptNumber)}</td>
        <td>${when.date}<br><small>${when.time}</small></td>
        <td>${escapeHtml(sale.customerName)}</td>
        <td>${escapeHtml(items)}</td>
        <td>${formatMoney(sale.totals.total)}</td>
      </tr>
    `;
  }).join("") : `
    <tr>
      <td colspan="5">No saved sales for this month yet.</td>
    </tr>
  `;
}

function renderItems() {
  if (!state.items.length) {
    els.itemsList.innerHTML = '<div class="empty-state">No items yet. Add the first sale item above.</div>';
    return;
  }

  els.itemsList.innerHTML = state.items.map((item) => {
    const line = getLineTotals(item);
    return `
      <article class="receipt-item">
        <div>
          <strong>${escapeHtml(item.name)}</strong>
          <small>${line.qty} x ${formatMoney(line.price)}${item.vat ? " - VAT included" : ""}</small>
        </div>
        <div>
          <div class="item-total">${formatMoney(line.total)}</div>
          <div class="item-actions">
            <button class="item-action" type="button" data-action="edit" data-id="${item.id}" title="Edit item">Edit</button>
            <button class="item-action" type="button" data-action="delete" data-id="${item.id}" title="Delete item">Del</button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function buildReceiptText() {
  const { date, time } = formatDateTime(state.receiptCreatedAt);
  const businessName = state.business.name || "My Duka";
  const totals = getReceiptTotals();
  const lines = [
    businessName.toUpperCase(),
    state.business.phone ? `Tel: ${state.business.phone}` : "",
    state.business.location ? `Location: ${state.business.location}` : "",
    state.business.pin ? `PIN/Note: ${state.business.pin}` : "",
    "--------------------------------",
    `Receipt: #${formatReceiptNumber(state.receiptNumber)}`,
    `Date: ${date}`,
    `Time: ${time}`,
    state.customerName ? `Customer: ${state.customerName}` : "Customer: Walk-in",
    "--------------------------------"
  ].filter(Boolean);

  if (!state.items.length) {
    lines.push("No items added yet.");
  } else {
    state.items.forEach((item, index) => {
      const line = getLineTotals(item);
      lines.push(`${index + 1}. ${item.name}`);
      lines.push(`   ${line.qty} x ${formatMoney(line.price)} = ${formatMoney(line.total)}`);
      if (item.vat) lines.push(`   VAT incl: ${formatMoney(line.vat)}`);
    });
  }

  lines.push("--------------------------------");
  lines.push(`Subtotal: ${formatMoney(totals.subtotal)}`);
  if (totals.vat > 0) lines.push(`VAT 16%:  ${formatMoney(totals.vat)}`);
  lines.push(`TOTAL:    ${formatMoney(totals.total)}`);
  lines.push("--------------------------------");
  lines.push("Thank you. Karibu tena.");
  lines.push("Powered by BiasharaKit");

  return lines.join("\n");
}

function renderReceipt() {
  els.receiptNumberLabel.textContent = `Receipt #${formatReceiptNumber(state.receiptNumber)}`;
  els.receiptPreview.textContent = buildReceiptText();
}

function saveAndRender() {
  saveState();
  renderItems();
  renderCustomerLookup();
  renderReceipt();
  renderReports();
}

function resetItemForm() {
  els.editingItemId.value = "";
  els.itemName.value = "";
  els.itemQty.value = "1";
  els.itemPrice.value = "";
  els.itemVat.checked = false;
  els.saveItemBtn.textContent = "Add item";
  els.cancelEditBtn.classList.add("hidden");
}

function saveItem(event) {
  event.preventDefault();
  const name = els.itemName.value.trim();
  const qty = Math.max(1, Number(els.itemQty.value) || 1);
  const price = Number(els.itemPrice.value);
  const editingId = els.editingItemId.value;

  if (!name || !Number.isFinite(price) || price <= 0) {
    showToast("Enter an item name and a valid price.");
    return;
  }

  const item = {
    id: editingId || uid(),
    name,
    qty,
    price,
    vat: els.itemVat.checked
  };

  if (editingId) {
    state.items = state.items.map((current) => current.id === editingId ? item : current);
    showToast("Item updated.");
  } else {
    state.items.push(item);
    showToast("Item added.");
  }

  resetItemForm();
  saveAndRender();
}

function editItem(id) {
  const item = state.items.find((current) => current.id === id);
  if (!item) return;

  els.editingItemId.value = item.id;
  els.itemName.value = item.name;
  els.itemQty.value = item.qty;
  els.itemPrice.value = item.price;
  els.itemVat.checked = item.vat;
  els.saveItemBtn.textContent = "Save item";
  els.cancelEditBtn.classList.remove("hidden");
  els.itemName.focus();
}

function deleteItem(id) {
  state.items = state.items.filter((item) => item.id !== id);
  resetItemForm();
  saveAndRender();
  showToast("Item deleted.");
}

function clearItems() {
  if (!state.items.length) return;
  if (!confirm("Clear all receipt items?")) return;
  state.items = [];
  resetItemForm();
  saveAndRender();
  showToast("Receipt items cleared.");
}

function startNewReceipt() {
  if (state.items.length && !confirm("Start a new receipt and clear current items?")) return;
  state.nextReceiptNumber = Math.max(state.nextReceiptNumber, state.receiptNumber + 1);
  state.receiptNumber = state.nextReceiptNumber;
  state.nextReceiptNumber += 1;
  state.receiptCreatedAt = new Date().toISOString();
  state.customerName = "";
  state.items = [];
  els.customerName.value = "";
  resetItemForm();
  saveAndRender();
  showToast(`Started receipt #${formatReceiptNumber(state.receiptNumber)}.`);
}

function recordSale() {
  if (!state.items.length) {
    showToast("Add items before saving a sale.");
    return;
  }

  const duplicate = state.sales.some((sale) => sale.receiptNumber === state.receiptNumber);
  if (duplicate && !confirm("This receipt is already saved. Save another copy?")) return;

  const sale = {
    id: uid(),
    receiptNumber: state.receiptNumber,
    createdAt: state.receiptCreatedAt,
    business: { ...state.business },
    customerName: state.customerName || "Walk-in",
    items: state.items.map((item) => ({ ...item })),
    totals: getSaleTotals(state.items)
  };

  state.sales.push(sale);
  saveAndRender();
  showToast(`Sale #${formatReceiptNumber(state.receiptNumber)} saved to reports.`);
}

async function copyReceipt() {
  const text = buildReceiptText();
  try {
    await navigator.clipboard.writeText(text);
    showToast("Receipt copied.");
  } catch {
    fallbackCopy(text);
    showToast("Receipt copied.");
  }
}

function fallbackCopy(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function printReceipt() {
  window.print();
}

function downloadPdf() {
  const text = buildReceiptText();
  const pdfBytes = createSimplePdf(text);
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  downloadBlob(blob, `receipt-${formatReceiptNumber(state.receiptNumber)}.pdf`);
  showToast("PDF downloaded.");
}

function buildMonthlyReportText() {
  const monthValue = els.reportMonth.value || getCurrentMonthValue();
  const sales = getMonthlySales(monthValue);
  const totals = sales.reduce(
    (summary, sale) => {
      summary.subtotal += sale.totals.subtotal;
      summary.vat += sale.totals.vat;
      summary.total += sale.totals.total;
      summary.items += sale.totals.itemCount;
      return summary;
    },
    { subtotal: 0, vat: 0, total: 0, items: 0 }
  );
  const lines = [
    `${state.business.name || "Business"} - Monthly Sales Report`,
    `Month: ${monthValue}`,
    `Generated: ${formatDateTime(new Date().toISOString()).date} ${formatDateTime(new Date().toISOString()).time}`,
    "--------------------------------",
    `Saved sales: ${sales.length}`,
    `Items sold: ${totals.items}`,
    `Subtotal: ${formatMoney(totals.subtotal)}`,
    `VAT: ${formatMoney(totals.vat)}`,
    `Total revenue: ${formatMoney(totals.total)}`,
    "--------------------------------"
  ];

  if (!sales.length) {
    lines.push("No sales recorded for this month.");
  } else {
    sales.forEach((sale) => {
      const when = formatDateTime(sale.createdAt);
      lines.push(`#${formatReceiptNumber(sale.receiptNumber)} | ${when.date} ${when.time}`);
      lines.push(`Customer: ${sale.customerName}`);
      sale.items.forEach((item) => {
        const line = getLineTotals(item);
        lines.push(`  - ${item.qty} x ${item.name} @ ${formatMoney(item.price)} = ${formatMoney(line.total)}`);
      });
      lines.push(`  Subtotal: ${formatMoney(sale.totals.subtotal)} | VAT: ${formatMoney(sale.totals.vat)} | Total: ${formatMoney(sale.totals.total)}`);
      lines.push("");
    });
  }

  return lines.join("\n");
}

function downloadMonthlyReportPdf() {
  const monthValue = els.reportMonth.value || getCurrentMonthValue();
  const pdfBytes = createSimplePdf(buildMonthlyReportText());
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  downloadBlob(blob, `sales-report-${monthValue}.pdf`);
  showToast("Monthly report PDF downloaded.");
}

function downloadMonthlyCsv() {
  const monthValue = els.reportMonth.value || getCurrentMonthValue();
  const rows = [
    ["receipt", "date", "time", "customer", "item", "qty", "unit_price", "vat_included", "line_total", "receipt_total"]
  ];

  getMonthlySales(monthValue).forEach((sale) => {
    const when = formatDateTime(sale.createdAt);
    sale.items.forEach((item) => {
      const line = getLineTotals(item);
      rows.push([
        `#${formatReceiptNumber(sale.receiptNumber)}`,
        when.date,
        when.time,
        sale.customerName,
        item.name,
        item.qty,
        line.price.toFixed(2),
        item.vat ? "yes" : "no",
        line.total.toFixed(2),
        sale.totals.total.toFixed(2)
      ]);
    });
  });

  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), `sales-report-${monthValue}.csv`);
  showToast("Monthly CSV downloaded.");
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// Minimal multi-page PDF writer so the app can export without external libraries.
function createSimplePdf(text) {
  const safeLines = text.split("\n").flatMap((line) => wrapPdfLine(line, 74));
  const linesPerPage = 52;
  const pages = [];
  for (let i = 0; i < safeLines.length; i += linesPerPage) {
    pages.push(safeLines.slice(i, i + linesPerPage));
  }

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>"
  ];

  const pageObjectIds = [];
  pages.forEach((pageLines) => {
    const pageObjectId = objects.length + 1;
    const contentObjectId = pageObjectId + 1;
    pageObjectIds.push(pageObjectId);

    const commands = ["BT", "/F1 9 Tf", "42 800 Td", "13 TL"];
    pageLines.forEach((line, index) => {
      if (index > 0) commands.push("T*");
      commands.push(`(${escapePdf(line)}) Tj`);
    });
    commands.push("ET");

    const stream = commands.join("\n");
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectId} 0 R >>`);
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });

  objects[1] = `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjectIds.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Uint8Array([...pdf].map((char) => char.charCodeAt(0)));
}

function wrapPdfLine(line, maxLength) {
  if (line.length <= maxLength) return [line];
  const words = line.split(" ");
  const lines = [];
  let current = "";
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });
  if (current) lines.push(current);
  return lines;
}

function escapePdf(text) {
  return text.replace(/[\\()]/g, "\\$&").replace(/[^\x20-\x7E]/g, "");
}

function escapeCsv(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function showToast(message) {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add("show");
  toastTimer = setTimeout(() => els.toast.classList.remove("show"), 2200);
}

function bindEvents() {
  els.themeToggle.addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    applyTheme();
    saveState();
  });

  els.segments.forEach((segment) => {
    segment.addEventListener("click", () => {
      state.mode = segment.dataset.mode;
      syncFormFromState();
      calculateTariff();
      saveState();
    });
  });

  els.mpesaAmount.addEventListener("input", calculateTariff);
  [els.businessName, els.businessPhone, els.businessLocation, els.businessPin, els.customerName].forEach((input) => {
    input.addEventListener("input", updateBusinessState);
  });

  els.receiptForm.addEventListener("submit", saveItem);
  els.cancelEditBtn.addEventListener("click", resetItemForm);
  els.clearListBtn.addEventListener("click", clearItems);
  els.newReceiptBtn.addEventListener("click", startNewReceipt);
  els.saveSaleBtn.addEventListener("click", recordSale);
  els.copyReceiptBtn.addEventListener("click", copyReceipt);
  els.printBtn.addEventListener("click", printReceipt);
  els.downloadPdfBtn.addEventListener("click", downloadPdf);
  els.reportMonth.addEventListener("input", renderReports);
  els.downloadCsvBtn.addEventListener("click", downloadMonthlyCsv);
  els.downloadReportPdfBtn.addEventListener("click", downloadMonthlyReportPdf);

  els.itemsList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    if (button.dataset.action === "edit") editItem(button.dataset.id);
    if (button.dataset.action === "delete") deleteItem(button.dataset.id);
  });
}

function init() {
  bindEvents();
  applyTheme();
  syncFormFromState();
  calculateTariff();
  renderItems();
  renderCustomerLookup();
  renderReceipt();
  renderReports();
}

document.addEventListener("DOMContentLoaded", init);
