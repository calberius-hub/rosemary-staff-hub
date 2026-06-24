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

> **No hardcoded secrets.** All sensitive values (emails, spreadsheet ID) live in Apps Script Script Properties — never in source files.

### 1. Deploy Code.js to Apps Script

1. Go to [script.google.com](https://script.google.com) and create a new project named **Rosemary Staff Hub**
2. Paste the contents of `Code.js` into the editor (replace the default `myFunction`)
3. Paste `appsscript.json` content via **Project Settings → Edit appsscript.json**

### 2. Set Script Properties

In Apps Script → **Project Settings → Script Properties**, add:

| Property | Value |
|---|---|
| `APPROVER_EMAILS` | `calberius@sds-ar.com,ralberius@sds-ar.com` |

> `SPREADSHEET_ID` is set **automatically** in the next step — do not add it manually yet.

See `SCRIPT_PROPERTIES.md` for full details.

### 3. Run the one-time setup function

In the Apps Script editor:
1. Select `setupRosemaryStaffHub_` from the function dropdown
2. Click **Run**
3. Authorize permissions when prompted
4. Check the **Execution Log** — it will print the Spreadsheet URL

This creates the **Rosemary Staff Hub** Google Spreadsheet with three pre-formatted sheets:
- **PTO Requests** — Timestamp, Employee, Start Date, End Date, Type, Notes, Status
- **Weekly Reports** — Timestamp, Employee, Week Ending, Hours Worked, Tasks Completed, Maintenance Issues, Resident Interactions, Needs Attention
- **Monthly Reports** — Timestamp, Employee, Month, Total Hours, PTO Days Used, Open Maintenance, Notable Events, Needs Attention

And saves `SPREADSHEET_ID` to Script Properties automatically.

### 4. Deploy as a Web App

1. Go to **Deploy → New Deployment**
   - Type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
2. Click **Deploy** and copy the Web App URL

### 5. Connect the Frontend

In `index.html` **and** `dashboard.html`, replace the placeholder at the top of the `<script>` block:
```js
const WEB_APP_URL = 'PASTE_APPS_SCRIPT_URL_HERE';
```
with your deployed Web App URL.

### 6. Push to GitHub

```bash
cd ~/projects/rosemary-staff-hub
git add .
git commit -m "feat: wire in web app URL"
git push origin main
```

### 7. Connect Netlify

1. Log in to [Netlify](https://netlify.com) and click **Add new site → Import an existing project**
2. Connect the `calberius-hub/rosemary-staff-hub` GitHub repo
3. Build settings:
   - **Build command:** *(leave blank)*
   - **Publish directory:** `.`
4. Deploy and set the custom domain: `rosemary-staff.netlify.app`

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
| `SCRIPT_PROPERTIES.md` | Script Properties setup guide for Apps Script |
