# CLAUDE.md — Rosemary Staff Hub

Instructions for future AI coding agents working on this project.

## What This Is

A simple, no-login web app for 4 Rosemary Villas employees (Austin, Jaimie, Lindsey, Nathan) to:
- Submit PTO requests (notifies Cole Alberius + Randy by email)
- Submit weekly reports
- Submit monthly reports

Admin dashboard (`dashboard.html`) is for Cole & Randy only — shows pending PTO and report submission status.

## Architecture (keep it simple)

- **Frontend:** Pure HTML/CSS/JS in `index.html` and `dashboard.html` — NO frameworks, NO build step, NO npm
- **Backend:** Google Apps Script (`Code.js`) — deployed as a Web App
- **Backend URL:** Set in the `WEB_APP_URL` constant at the top of each HTML file's `<script>` block
- **Data store:** Google Sheets (3 sheets: PTO Requests, Weekly Reports, Monthly Reports)

## Design System

Match exactly — do not change these:
- `#f5f1ea` — warm ivory background (employee app)
- `#5a8a5e` — sage green (primary buttons, accents)
- `#8c7342` — gold (headings, highlights)
- `#2c2820` — ink (body text)
- Headings: Cormorant Garamond (Google Font)
- Body: DM Sans (Google Font)
- Admin dashboard (`dashboard.html`): dark `#0f0f0f` background — this is Cole's view

## Employees

Austin, Jaimie, Lindsey, Nathan — all 4 are pre-defined. If a new employee needs to be added, update the name buttons in `index.html` and the `EMPLOYEES` array in `dashboard.html`.

## What NOT to Touch

- No QBO / QuickBooks logic
- No accounting features
- No login/auth — employees just pick their name
- No npm, no build toolchain
- No secrets in files — use placeholder strings like `PASTE_APPS_SCRIPT_URL_HERE`

## Backend (Code.js) Key Functions

- `doPost(e)` — routes by `action` field: `submitPTO`, `submitWeeklyReport`, `submitMonthlyReport`
- `doGet(e)` — routes by `action` field: `getSubmissions?employee=Name`, `getDashboard`
- `notifyApprovers_(type, employee, details)` — sends email via MailApp; reads `APPROVER_EMAIL` from Script Properties
- `getOrCreateSheet_(name, headers)` — auto-creates sheets with headers if they don't exist

## Deployment

GitHub → Netlify auto-deploy. Frontend only needs to be edited and pushed — no build step.
Apps Script is deployed separately (see README.md).

## Common Tasks

**Change PTO notification email:** Update `APPROVER_EMAIL` in Apps Script → Project Settings → Script Properties.

**Add a new form field:** Add the HTML input, add it to the payload object in the JS `submit*` function, update the `HEADERS.*` array and `appendRow()` call in the matching handler in `Code.js`.

**Redeploy Apps Script:** Any change to `Code.js` requires creating a new deployment in Apps Script (or editing the existing one). Update the URL in both HTML files if it changes.
