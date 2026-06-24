# Script Properties — Rosemary Staff Hub

Set these in **Apps Script editor → Project Settings → Script Properties**.

| Property | Value |
|---|---|
| `APPROVER_EMAILS` | `calberius@sds-ar.com,ralberius@sds-ar.com` |
| `SPREADSHEET_ID` | *(auto-set when you run `setupRosemaryStaffHub_()`)* |

---

## How to set Script Properties

1. Open your Apps Script project at [script.google.com](https://script.google.com)
2. Click the **⚙️ Project Settings** gear icon (left sidebar)
3. Scroll down to **Script Properties**
4. Click **Add script property** and enter each key/value pair above
5. Click **Save script properties**

> **APPROVER_EMAILS** must be set manually before deploying.  
> **SPREADSHEET_ID** is set automatically when you run `setupRosemaryStaffHub_()` — you do not need to set it by hand.

---

## One-time setup sequence

```
1. Paste Code.js into a new Apps Script project named "Rosemary Staff Hub"
2. In Project Settings → Script Properties, add:
      APPROVER_EMAILS = calberius@sds-ar.com,ralberius@sds-ar.com
3. Run setupRosemaryStaffHub_() from the editor (select it in the function dropdown → Run)
   → This creates the Google Sheet, sets up all 3 tabs, and saves SPREADSHEET_ID automatically
   → Check the Execution Log for the Spreadsheet URL
4. Deploy as Web App:
      Deploy → New Deployment → Type: Web App
      Execute as: Me
      Who has access: Anyone
5. Copy the Web App URL → paste as WEB_APP_URL in index.html and dashboard.html
```
