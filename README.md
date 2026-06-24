# Rosemary Staff Hub

A mobile-first web app for Rosemary Villas employees to submit PTO requests, weekly reports, and monthly reports. Includes an admin dashboard for Cole & Randy.

**Live URL (employee app):** https://rosemary-staff.netlify.app  
**Live URL (admin dashboard):** https://rosemary-staff.netlify.app/dashboard.html

---

## Architecture

- **Frontend:** Static HTML/CSS/JS — no build step, no frameworks
- **Backend:** Google Apps Script (Code.js) deployed as a Web App
- **Hosting:** GitHub → Netlify auto-deploy

---

## Setup

### 1. Create the Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet named **Rosemary Staff Hub**
2. Copy the spreadsheet ID from the URL (the long string between `/d/` and `/edit`)
3. Open `Code.js` and paste the ID into `CONFIG.spreadsheetId`
   - Or: in Apps Script, go to **Project Settings → Script Properties** and add `SPREADSHEET_ID`

> The backend will auto-create three sheets on first use:
> - **PTO Requests** — Timestamp, Employee, Start Date, End Date, Type, Notes, Status
> - **Weekly Reports** — Timestamp, Employee, Week Ending, Hours Worked, Tasks, Maintenance, Residents, Needs Attention
> - **Monthly Reports** — Timestamp, Employee, Month, Total Hours, PTO Days Used, Open Maintenance, Notable Events, Needs Attention

### 2. Deploy the Apps Script

1. Go to [script.google.com](https://script.google.com) and create a new project named **Rosemary Staff Hub**
2. Paste the contents of `Code.js` into the editor (replace the default `myFunction`)
3. Paste `appsscript.json` content via **Project Settings → Edit appsscript.json**
4. Go to **Deploy → New Deployment**
   - Type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy the Web App URL

### 3. Set Script Properties (optional but recommended)

In Apps Script → **Project Settings → Script Properties**, add:
- `APPROVER_EMAIL` — email address for PTO notifications (e.g., cole@example.com)

You can comma-separate multiple emails in a custom edit to `notifyApprovers_()`.

### 4. Connect the Frontend

In `index.html`, replace the placeholder at the top of the `<script>` block:
```js
const WEB_APP_URL = 'PASTE_APPS_SCRIPT_URL_HERE';
```
with your deployed Web App URL.

Do the same in `dashboard.html`.

### 5. Push to GitHub

```bash
cd ~/projects/rosemary-staff-hub
git init
git remote add origin https://github.com/YOUR_ORG/rosemary-staff-hub.git
git add .
git commit -m "feat: initial Rosemary Staff Hub"
git push -u origin main
```

### 6. Connect Netlify

1. Log in to [Netlify](https://netlify.com) and click **Add new site → Import an existing project**
2. Connect your GitHub repo
3. Build settings:
   - **Build command:** *(leave blank)*
   - **Publish directory:** `.`
4. Deploy! Set a custom domain if desired (e.g., `rosemary-staff.netlify.app`)

---

## Employees — How to Use

1. Open the app URL on your phone
2. Tap your name (Austin, Jaimie, Lindsey, or Nathan)
3. Choose what you want to do:
   - **Request PTO** — fill in dates, type, and optional notes; tap Submit
   - **Weekly Report** — fill in the week's hours, tasks, and notes; tap Submit
   - **Monthly Report** — fill in the month's summary; tap Submit
4. Your **My Recent Submissions** list shows your last 10 submissions and their status

---

## Cole & Randy — How Approvals Work

**PTO Requests:**
1. When an employee submits a PTO request, you'll receive an email notification with the details
2. To approve or reject: open the **PTO Requests** tab in the Google Sheet
3. Find the request and change the **Status** column from `Pending` to `Approved` or `Rejected`
4. (Future enhancement: add a button to notify the employee by email)

**Weekly & Monthly Reports:**
- All submissions land in their respective sheets automatically
- The admin dashboard at `/dashboard.html` shows who has/hasn't submitted this week and month

---

## File Reference

| File | Purpose |
|---|---|
| `index.html` | Employee-facing app (home + all 5 screens) |
| `dashboard.html` | Admin-only dashboard for Cole & Randy |
| `Code.js` | Google Apps Script backend |
| `appsscript.json` | Apps Script project manifest |
| `netlify.toml` | Netlify publish config |
| `README.md` | This file |
| `CLAUDE.md` | Instructions for future coding agents |
