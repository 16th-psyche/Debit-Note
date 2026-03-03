/* ─── State ───────────────────────────────────────────────────── */
let expenses = []; // [{date, description, category, billNumber, amount}]
let logoDataUrl = null;
let zoomLevel = 1;

const CATEGORIES = [
  'Business Meals',
  'Travel',
  'Accommodation',
  'Conveyance',
  'Printing & Stationary',
  'Event Expense',
  'Other',
];

/* ─── Sanitization ───────────────────────────────────────────── */
function san(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ─── Currency Formatting ────────────────────────────────────── */
function fmt(n) {
  const num = parseFloat(n) || 0;
  return '&#8377; ' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPlain(n) {
  const num = parseFloat(n) || 0;
  return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ─── Format Date for Display ────────────────────────────────── */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

/* ─── Format Expense Period ──────────────────────────────────── */
function formatPeriod(monthStr) {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

/* ─── Live Preview ───────────────────────────────────────────── */
function updatePreview() {
  const output = document.getElementById('previewOutput');
  if (!output) return;
  output.innerHTML = buildPDFHTML();
  const wrapper = document.getElementById('previewZoomWrapper');
  if (wrapper) {
    wrapper.style.transform = `scale(${zoomLevel})`;
    // Collapse the empty space below the scaled-down content
    wrapper.style.marginBottom = `-${wrapper.scrollHeight * (1 - zoomLevel)}px`;
  }
}

let previewTimer = null;
function schedulePreview() {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(updatePreview, 150);
}

function adjustZoom(delta) {
  zoomLevel = Math.min(1.2, Math.max(0.4, Math.round((zoomLevel + delta) * 100) / 100));
  document.getElementById('zoomLabel').textContent = Math.round(zoomLevel * 100) + '%';
  updatePreview();
}

function fitZoomToPanel() {
  const panel = document.getElementById('previewPanel');
  if (!panel) return;
  const available = panel.clientWidth - 16; // 8px padding each side
  if (available <= 0) return;
  zoomLevel = Math.min(1.2, Math.max(0.4, Math.round((available / 794) * 100) / 100));
  const label = document.getElementById('zoomLabel');
  if (label) label.textContent = Math.round(zoomLevel * 100) + '%';
  updatePreview();
}

/* ─── Render Expense Rows ────────────────────────────────────── */
function renderExpenses() {
  const tbody = document.getElementById('expenseRows');
  const empty = document.getElementById('emptyState');

  if (expenses.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = '';
    updateTotals();
    updatePreview();
    return;
  }

  empty.style.display = 'none';
  updatePreview();

  tbody.innerHTML = expenses.map((exp, i) => `
    <tr>
      <td class="col-date">
        <input type="date" value="${san(exp.date)}"
          oninput="expenses[${i}].date = this.value; updateTotals(); saveState()" />
      </td>
      <td class="col-desc">
        <input type="text" value="${san(exp.description)}" placeholder="Description"
          oninput="expenses[${i}].description = this.value; saveState()" />
      </td>
      <td class="col-cat">
        <select onchange="expenses[${i}].category = this.value; saveState()">
          ${CATEGORIES.map(c => `<option value="${c}" ${exp.category === c ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
      </td>
      <td class="col-bill">
        <input type="text" value="${san(exp.billNumber)}" placeholder="Bill / Ref No."
          oninput="expenses[${i}].billNumber = this.value; saveState()" />
      </td>
      <td class="col-amount">
        <input type="number" value="${exp.amount || ''}" placeholder="0.00" min="0" step="0.01"
          oninput="expenses[${i}].amount = this.value; updateTotals(); saveState()" />
      </td>
      <td class="col-action">
        <button class="btn-remove" onclick="removeExpense(${i})" title="Remove row">&times;</button>
      </td>
    </tr>
  `).join('');

  updateTotals();
}

/* ─── Add / Remove Expense ───────────────────────────────────── */
function addExpense() {
  expenses.push({ date: '', description: '', category: CATEGORIES[0], billNumber: '', amount: '' });
  renderExpenses();
  // Focus the date field of the new row
  const rows = document.querySelectorAll('#expenseRows tr');
  if (rows.length) {
    const last = rows[rows.length - 1];
    const input = last.querySelector('input[type="date"]');
    if (input) input.focus();
  }
}

function removeExpense(idx) {
  expenses.splice(idx, 1);
  renderExpenses();
  saveState();
}

/* ─── Totals ─────────────────────────────────────────────────── */
function updateTotals() {
  const subtotal = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const advance = parseFloat(document.getElementById('cashAdvance').value) || 0;
  const total = Math.max(0, subtotal - advance);

  document.getElementById('subtotalDisplay').innerHTML = fmt(subtotal);
  document.getElementById('totalDisplay').innerHTML = fmt(total);
}

/* ─── LocalStorage ───────────────────────────────────────────── */
let saveTimer = null;
function saveState() {
  schedulePreview();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const state = {
      employeeName: document.getElementById('employeeName').value,
      managerName: document.getElementById('managerName').value,
      department: document.getElementById('department').value,
      expensePeriod: document.getElementById('expensePeriod').value,
      submissionDate: document.getElementById('submissionDate').value,
      cashAdvance: document.getElementById('cashAdvance').value,
      expenses,
    };
    localStorage.setItem('ql_debit_note', JSON.stringify(state));
    showSaveIndicator();
  }, 400);
}

function loadState() {
  try {
    const raw = localStorage.getItem('ql_debit_note');
    if (!raw) return;
    const state = JSON.parse(raw);
    document.getElementById('employeeName').value = state.employeeName || '';
    document.getElementById('managerName').value = state.managerName || '';
    document.getElementById('department').value = state.department || '';
    document.getElementById('expensePeriod').value = state.expensePeriod || '';
    document.getElementById('submissionDate').value = state.submissionDate || '';
    document.getElementById('cashAdvance').value = state.cashAdvance || '';
    expenses = Array.isArray(state.expenses) ? state.expenses : [];
    renderExpenses();
  } catch (e) {
    // Ignore corrupted state
  }
}

function showSaveIndicator() {
  const el = document.getElementById('saveIndicator');
  el.textContent = 'Saved';
  clearTimeout(showSaveIndicator._t);
  showSaveIndicator._t = setTimeout(() => { el.textContent = ''; }, 2000);
}

/* ─── Clear Form ─────────────────────────────────────────────── */
function clearForm() {
  if (!confirm('Clear all data and start over?')) return;
  document.getElementById('employeeName').value = '';
  document.getElementById('managerName').value = '';
  document.getElementById('department').value = '';
  document.getElementById('expensePeriod').value = '';
  document.getElementById('submissionDate').value = '';
  document.getElementById('cashAdvance').value = '';
  expenses = [];
  renderExpenses();
  updatePreview();
  localStorage.removeItem('ql_debit_note');
  showToast('Form cleared');
}

/* ─── Toast ──────────────────────────────────────────────────── */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => t.classList.remove('show'), 2500);
}

/* ─── Build PDF HTML ─────────────────────────────────────────── */
function buildPDFHTML() {
  const employeeName  = document.getElementById('employeeName').value;
  const managerName   = document.getElementById('managerName').value;
  const department    = document.getElementById('department').value;
  const expensePeriod = document.getElementById('expensePeriod').value;
  const cashAdvanceVal = parseFloat(document.getElementById('cashAdvance').value) || 0;
  const subtotal = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
  const total = Math.max(0, subtotal - cashAdvanceVal);

  // Shared border token — consistent everywhere
  const B = '1px solid #D1D1D6';

  // Expense rows padded to MIN_ROWS so the table doesn't look sparse
  const MIN_ROWS = 10;
  const td = `padding:5px 8px;border:${B};font-size:10px;`;
  let rowsHTML = expenses.map(e => `
    <tr>
      <td style="${td}">${san(formatDate(e.date))}</td>
      <td style="${td};word-wrap:break-word;">${san(e.description)}</td>
      <td style="${td}">${san(e.category)}</td>
      <td style="${td}">${san(e.billNumber)}</td>
      <td style="${td};text-align:right;">${e.amount ? fmtPlain(e.amount) : ''}</td>
    </tr>`).join('');

  for (let i = 0; i < Math.max(0, MIN_ROWS - expenses.length); i++) {
    rowsHTML += `<tr>
      <td style="${td}">&nbsp;</td><td style="${td}"></td>
      <td style="${td}"></td><td style="${td}"></td>
      <td style="${td}"></td>
    </tr>`;
  }

  const submissionDate = document.getElementById('submissionDate').value;
  const periodDisplay = formatPeriod(expensePeriod) || '&nbsp;';
  const submissionDisplay = formatDate(submissionDate) || '&nbsp;';

  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#1C1C1E;width:794px;padding:28px 36px 32px;box-sizing:border-box;background:#fff;">

  <!-- ── Header ───────────────────────────────────────────────── -->
  <div style="text-align:center;padding-bottom:14px;margin-bottom:16px;border-bottom:1.5px solid #E5E5EA;">
    ${logoDataUrl
      ? `<img src="${logoDataUrl}" style="height:68px;width:auto;display:block;margin:0 auto 6px;" />`
      : `<div style="font-size:22px;font-weight:900;margin-bottom:6px;"><span style="color:#F5C518;">Q</span>uantumLeap</div>`
    }
    <div style="font-size:8.5px;color:#6C6C70;line-height:1.7;">
      #86, Shubhodaya, 3rd Floor, Railway Parallel Road, Kumarapark West,<br/>
      Sheshadripuram, Bengaluru, Karnataka &mdash; 560020
    </div>
  </div>

  <!-- ── Title ────────────────────────────────────────────────── -->
  <div style="text-align:center;margin-bottom:16px;">
    <span style="display:inline-block;font-size:15px;font-weight:700;letter-spacing:0.02em;
                 padding:5px 24px;background:#F5C518;border-radius:4px;color:#1C1C1E;">
      Expense Reimbursement
    </span>
  </div>

  <!-- ── Employee Info (single 4-col table, rowspan for Period) ─ -->
  <table style="width:100%;border-collapse:collapse;font-size:10px;margin-bottom:14px;">
    <colgroup>
      <col style="width:20%;"><col style="width:36%;"><col style="width:18%;"><col style="width:26%;">
    </colgroup>
    <tr>
      <td style="background:#FFFAE8;font-weight:600;padding:5px 8px;border:${B};white-space:nowrap;color:#3C3C43;">Employee Name</td>
      <td style="padding:5px 8px;border:${B};">${san(employeeName)}&nbsp;</td>
      <td style="background:#FFFAE8;font-weight:600;padding:5px 8px;border:${B};white-space:nowrap;color:#3C3C43;vertical-align:top;" rowspan="2">Expense Period</td>
      <td style="padding:5px 8px;border:${B};vertical-align:top;" rowspan="2">${periodDisplay}&nbsp;</td>
    </tr>
    <tr>
      <td style="background:#FFFAE8;font-weight:600;padding:5px 8px;border:${B};white-space:nowrap;color:#3C3C43;">Manager Name</td>
      <td style="padding:5px 8px;border:${B};">${san(managerName)}&nbsp;</td>
    </tr>
    <tr>
      <td style="background:#FFFAE8;font-weight:600;padding:5px 8px;border:${B};white-space:nowrap;color:#3C3C43;">Department</td>
      <td style="padding:5px 8px;border:${B};">${san(department)}&nbsp;</td>
      <td style="background:#FFFAE8;font-weight:600;padding:5px 8px;border:${B};white-space:nowrap;color:#3C3C43;">Submission Date</td>
      <td style="padding:5px 8px;border:${B};">${submissionDisplay}&nbsp;</td>
    </tr>
  </table>

  <!-- ── Expense Table + Totals (ONE table → guaranteed column alignment) ── -->
  <table style="width:100%;border-collapse:collapse;font-size:10px;">
    <colgroup>
      <col style="width:110px;">
      <col>
      <col style="width:112px;">
      <col style="width:110px;">
      <col style="width:74px;">
    </colgroup>
    <thead>
      <tr style="background:#F5C518;">
        <th style="padding:5px 8px;border:${B};text-align:left;font-weight:700;">Date</th>
        <th style="padding:5px 8px;border:${B};text-align:left;font-weight:700;">Description</th>
        <th style="padding:5px 8px;border:${B};text-align:left;font-weight:700;">Category</th>
        <th style="padding:5px 8px;border:${B};text-align:left;font-weight:700;">Bill Number</th>
        <th style="padding:5px 8px;border:${B};text-align:right;font-weight:700;">Cost (&#8377;)</th>
      </tr>
    </thead>
    <tbody>${rowsHTML}</tbody>
    <tfoot>
      <tr>
        <td colspan="4" style="padding:5px 8px;border:${B};text-align:right;font-weight:700;color:#3C3C43;">Subtotal</td>
        <td style="padding:5px 8px;border:${B};text-align:right;font-weight:600;">&#8377;&nbsp;${fmtPlain(subtotal)}</td>
      </tr>
      <tr>
        <td colspan="4" style="padding:5px 8px;border:${B};text-align:right;color:#6C6C70;font-size:9.5px;">Less Cash Advance</td>
        <td style="padding:5px 8px;border:${B};text-align:right;color:#6C6C70;">${cashAdvanceVal > 0 ? '&#8377;&nbsp;' + fmtPlain(cashAdvanceVal) : '&mdash;'}</td>
      </tr>
      <tr style="background:#FFFAE8;">
        <td colspan="4" style="padding:6px 8px;border:${B};text-align:right;font-weight:700;color:#1C1C1E;">Total Reimbursement</td>
        <td style="padding:6px 8px;border:${B};text-align:right;font-weight:700;color:#1C1C1E;">&#8377;&nbsp;${fmtPlain(total)}</td>
      </tr>
    </tfoot>
  </table>

  <!-- ── Reminder ──────────────────────────────────────────────── -->
  <div style="text-align:center;font-size:9px;color:#6C6C70;font-style:italic;margin:12px 0 22px;">
    Please attach all original receipts &amp; bills with this form.
  </div>

  <!-- ── Signature ─────────────────────────────────────────────── -->
  <div style="border-top:1.5px solid #1C1C1E;padding-top:8px;width:48%;font-size:10px;">
    <div style="font-weight:700;margin-bottom:28px;">Employee Signature</div>
    <div style="color:#3C3C43;">${san(employeeName) || '&nbsp;'}</div>
  </div>

</div>`;
}

/* ─── Validation ─────────────────────────────────────────────── */
function clearFieldError(el) {
  el.classList.remove('error');
  const err = el.closest('.form-group')?.querySelector('.field-error');
  if (err) err.remove();
}

function validateForm() {
  let valid = true;
  const required = [
    { id: 'employeeName', msg: 'Employee name is required' },
    { id: 'managerName',  msg: 'Manager name is required'  },
    { id: 'department',   msg: 'Department is required'    },
  ];
  required.forEach(({ id, msg }) => {
    const el = document.getElementById(id);
    clearFieldError(el);
    if (!el.value.trim()) {
      el.classList.add('error');
      const err = document.createElement('span');
      err.className = 'field-error';
      err.textContent = msg;
      el.closest('.form-group').appendChild(err);
      if (valid) el.focus();
      valid = false;
    }
  });
  if (!valid) showToast('Please fill in the required fields');
  return valid;
}

/* ─── Download PDF ───────────────────────────────────────────── */
function downloadPDF() {
  if (!validateForm()) return;

  const btn = document.querySelector('.btn-primary');
  const originalHTML = btn.innerHTML;
  btn.disabled = true;
  btn.textContent = 'Printing\u2026';

  const reset = () => {
    btn.disabled = false;
    btn.innerHTML = originalHTML;
  };

  window.onafterprint = function () { window.onafterprint = null; reset(); };
  window.print();
  setTimeout(reset, 1000);
}

/* ─── Preload Logo ───────────────────────────────────────────── */
function loadLogo() {
  return fetch('assets/QL Logo.png')
    .then(r => r.blob())
    .then(blob => new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => { logoDataUrl = reader.result; resolve(); };
      reader.readAsDataURL(blob);
    }))
    .catch(() => { /* logo unavailable – fallback to text */ });
}

/* ─── Init ───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  loadLogo().then(updatePreview);
  loadState();
  if (expenses.length === 0) {
    addExpense();
  }
});
