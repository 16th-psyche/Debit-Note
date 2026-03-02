# Expense Reimbursement – QuantumLeap

A lightweight, browser-based expense reimbursement form builder for QuantumLeap team members. Fill in your expense details and download a print-ready PDF — no server, no installation, no login required.

Create the debit note here: [https://16th-psyche.github.io/Resume-builder/](https://16th-psyche.github.io/Debit-Note/)

## Features

- **Live A4 preview** — see exactly how the PDF will look as you type
- **PDF export** — generates a formatted, branded PDF matching the official QuantumLeap expense form
- **Auto-save** — form data is saved to `localStorage` automatically; your progress persists across page refreshes
- **Dynamic expense rows** — add or remove rows as needed
- **Cash advance deduction** — enter a cash advance amount and the total is calculated automatically
- **Expense categories** — Business Meals, Travel, Accommodation, Conveyance, Printing & Stationary, Event Expense, Other

## Getting Started

No build step or installation needed. Just open the file directly in a browser:

```
open index.html
```

Or double-click `index.html` in Finder / File Explorer.

> Works in any modern browser (Chrome, Firefox, Safari, Edge).

## Project Structure

```
├── index.html          # App shell — form layout and live preview panel
├── js/
│   └── app.js          # All application logic (~460 lines)
├── css/
│   └── style.css       # Apple HIG design system (~460 lines)
└── assets/
    └── QL Logo.png     # QuantumLeap company logo (embedded in PDF)
```

## How It Works

1. Fill in **Employee Name**, **Manager Name**, **Department**, **Expense Period**, and **Submission Date**
2. Add one or more expense rows with date, description, category, bill number, and amount
3. Optionally enter a **Cash Advance** amount — it will be deducted from the subtotal
4. Click **Download PDF** — a formatted A4 PDF downloads instantly

## PDF Layout

The generated PDF matches the official QuantumLeap expense reimbursement format:

- Company header with logo and address
- "Expense Reimbursement" title badge
- Employee info block (name, manager, department, period, submission date)
- Itemised expense table with yellow header
- Subtotal → Less Cash Advance → **Total Reimbursement**

## Tech Stack

| Layer | Library / Approach |
|---|---|
| UI | Vanilla HTML / CSS / JS |
| PDF rendering | [html2canvas v1.4.1](https://html2canvas.hertzen.com/) + [jsPDF v2.5.1](https://github.com/parallax/jsPDF) |
| Persistence | Browser `localStorage` |
| Fonts | System font stack (no external fonts) |

No npm, no bundler, no framework.

## Customisation

To adapt this for a different company:

- Replace `QL Logo.png` with your logo
- Update the company name and address in `buildPDFHTML()` inside `app.js`
- Adjust expense categories in the `CATEGORIES` array at the top of `app.js`
