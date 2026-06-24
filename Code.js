// ═══════════════════════════════════════════════════════════════
//  Rosemary Staff Hub — Google Apps Script Backend
//  Deploy as a Web App: Execute as Me (USER_DEPLOYING), Anyone (anonymous)
// ═══════════════════════════════════════════════════════════════
//
//  CONFIG uses Script Properties at runtime — no hardcoded secrets.
//  Run setupRosemaryStaffHub_() once to create the Google Sheet
//  and store its ID automatically.
//
//  Script Properties required:
//    SPREADSHEET_ID  — auto-set by setupRosemaryStaffHub_()
//    APPROVER_EMAILS — comma-separated list set manually in Project Settings
// ═══════════════════════════════════════════════════════════════

// ── Sheet name constants ──────────────────────────────────────────
var SHEETS = {
  PTO:     'PTO Requests',
  WEEKLY:  'Weekly Reports',
  MONTHLY: 'Monthly Reports'
};

// ── Sheet column headers ──────────────────────────────────────────
var HEADERS = {
  PTO:     ['Timestamp', 'Employee', 'Start Date', 'End Date', 'Type', 'Notes', 'Status'],
  WEEKLY:  ['Timestamp', 'Employee', 'Week Ending', 'Tasks Completed', 'Feedback'],
  MONTHLY: ['Timestamp', 'Employee', 'Month', 'Tasks Completed', 'Feedback']
};

// ════════════════════════════════════════════════════════════════
//  setupRosemaryStaffHub_ — ONE-TIME SETUP FUNCTION
//  Run this once from the Apps Script editor.
//  It creates the Google Spreadsheet, sets up all three sheets,
//  and saves the Spreadsheet ID to Script Properties automatically.
// ════════════════════════════════════════════════════════════════
function setupRosemaryStaffHub() {
  var props = PropertiesService.getScriptProperties();

  // Check if already set up
  var existingId = props.getProperty('SPREADSHEET_ID');
  if (existingId) {
    Logger.log('⚠️  setupRosemaryStaffHub_: SPREADSHEET_ID already set (' + existingId + '). Delete the Script Property and re-run if you want to start fresh.');
    return;
  }

  // Create the spreadsheet
  var ss = SpreadsheetApp.create('Rosemary Staff Hub');
  var spreadsheetId = ss.getId();

  // Store ID in Script Properties
  props.setProperty('SPREADSHEET_ID', spreadsheetId);
  Logger.log('✅ SPREADSHEET_ID saved to Script Properties: ' + spreadsheetId);

  // Remove the default blank Sheet1
  var defaultSheet = ss.getSheets()[0];

  // Create the three sheets with headers
  var sheetConfigs = [
    { name: SHEETS.PTO,     headers: HEADERS.PTO },
    { name: SHEETS.WEEKLY,  headers: HEADERS.WEEKLY },
    { name: SHEETS.MONTHLY, headers: HEADERS.MONTHLY }
  ];

  sheetConfigs.forEach(function(cfg) {
    var sheet = ss.insertSheet(cfg.name);
    sheet.appendRow(cfg.headers);
    var headerRange = sheet.getRange(1, 1, 1, cfg.headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#5a8a5e');
    headerRange.setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    Logger.log('✅ Created sheet: ' + cfg.name);
  });

  // Delete the default blank sheet that was created with the spreadsheet
  ss.deleteSheet(defaultSheet);

  Logger.log('');
  Logger.log('════════════════════════════════════════════');
  Logger.log('✅ Rosemary Staff Hub setup complete!');
  Logger.log('   Spreadsheet URL: ' + ss.getUrl());
  Logger.log('════════════════════════════════════════════');
  Logger.log('Next steps:');
  Logger.log('  1. Deploy this script as a Web App (Deploy → New Deployment)');
  Logger.log('     Execute as: Me | Who has access: Anyone');
  Logger.log('  2. Copy the Web App URL into WEB_APP_URL in index.html and dashboard.html');
  Logger.log('  3. Ensure APPROVER_EMAILS Script Property is set (Project Settings → Script Properties)');
}

// ════════════════════════════════════════════════════════════════
//  doPost — handle form submissions
// ════════════════════════════════════════════════════════════════
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action;

    if (action === 'submitPTO') {
      return handleSubmitPTO_(body);
    } else if (action === 'submitWeeklyReport') {
      return handleSubmitWeekly_(body);
    } else if (action === 'submitMonthlyReport') {
      return handleSubmitMonthly_(body);
    } else {
      return jsonResponse_({ success: false, error: 'Unknown action: ' + action });
    }
  } catch (err) {
    return jsonResponse_({ success: false, error: err.message });
  }
}

// ════════════════════════════════════════════════════════════════
//  doGet — handle data reads
// ════════════════════════════════════════════════════════════════
function doGet(e) {
  try {
    var action = e.parameter.action;

    if (action === 'getSubmissions') {
      var employee = e.parameter.employee || '';
      return handleGetSubmissions_(employee);
    } else if (action === 'getDashboard') {
      return handleGetDashboard_();
    } else if (action === 'getDetailedDashboard') {
      return handleGetDetailedDashboard_();
    } else if (action === 'submitPTO') {
      return handleSubmitPTO_(e.parameter);
    } else if (action === 'submitWeeklyReport') {
      return handleSubmitWeekly_(e.parameter);
    } else if (action === 'submitMonthlyReport') {
      return handleSubmitMonthly_(e.parameter);
    } else {
      return jsonResponse_({ success: false, error: 'Unknown action: ' + action });
    }
  } catch (err) {
    return jsonResponse_({ success: false, error: err.message });
  }
}

// ════════════════════════════════════════════════════════════════
//  PTO Submission
// ════════════════════════════════════════════════════════════════
function handleSubmitPTO_(body) {
  var sheet = getOrCreateSheet_(SHEETS.PTO, HEADERS.PTO);
  var timestamp = new Date().toISOString();

  sheet.appendRow([
    timestamp,
    body.employee   || '',
    body.startDate  || '',
    body.endDate    || '',
    body.type       || '',
    body.notes      || '',
    'Pending'
  ]);

  // Notify approvers
  var details = {
    employee:  body.employee,
    startDate: body.startDate,
    endDate:   body.endDate,
    type:      body.type,
    notes:     body.notes
  };
  notifyApprovers_('PTO', body.employee, details);

  return jsonResponse_({ success: true, message: 'PTO request submitted.' });
}

// ════════════════════════════════════════════════════════════════
//  Weekly Report Submission
// ════════════════════════════════════════════════════════════════
function handleSubmitWeekly_(body) {
  var sheet = getOrCreateSheet_(SHEETS.WEEKLY, HEADERS.WEEKLY);
  var timestamp = new Date().toISOString();

  sheet.appendRow([
    timestamp,
    body.employee   || '',
    body.weekEnding || '',
    body.tasks      || '',
    body.feedback   || ''
  ]);

  notifyApprovers_('Weekly Report', body.employee, {
    weekEnding: body.weekEnding,
    tasks:      body.tasks,
    feedback:   body.feedback
  });

  return jsonResponse_({ success: true, message: 'Weekly report submitted.' });
}

// ════════════════════════════════════════════════════════════════
//  Monthly Report Submission
// ════════════════════════════════════════════════════════════════
function handleSubmitMonthly_(body) {
  var sheet = getOrCreateSheet_(SHEETS.MONTHLY, HEADERS.MONTHLY);
  var timestamp = new Date().toISOString();

  sheet.appendRow([
    timestamp,
    body.employee || '',
    body.month    || '',
    body.tasks    || '',
    body.feedback || ''
  ]);

  notifyApprovers_('Monthly Report', body.employee, {
    month:    body.month,
    tasks:    body.tasks,
    feedback: body.feedback
  });

  return jsonResponse_({ success: true, message: 'Monthly report submitted.' });
}

// ════════════════════════════════════════════════════════════════
//  Get Submissions for an employee (last 10 across all sheets)
// ════════════════════════════════════════════════════════════════
function handleGetSubmissions_(employee) {
  var submissions = [];

  // PTO Requests
  var ptoSheet = getOrCreateSheet_(SHEETS.PTO, HEADERS.PTO);
  var ptoData  = ptoSheet.getDataRange().getValues();
  for (var i = 1; i < ptoData.length; i++) {
    var row = ptoData[i];
    if (String(row[1]).toLowerCase() === employee.toLowerCase()) {
      submissions.push({
        type:   'PTO – ' + row[4],
        date:   String(row[0]).slice(0, 10),
        status: row[6] || 'Pending'
      });
    }
  }

  // Weekly Reports
  var weeklySheet = getOrCreateSheet_(SHEETS.WEEKLY, HEADERS.WEEKLY);
  var weeklyData  = weeklySheet.getDataRange().getValues();
  for (var j = 1; j < weeklyData.length; j++) {
    var wrow = weeklyData[j];
    if (String(wrow[1]).toLowerCase() === employee.toLowerCase()) {
      submissions.push({
        type:   'Weekly Report',
        date:   String(wrow[2]),   // week ending date
        status: 'Submitted'
      });
    }
  }

  // Monthly Reports
  var monthlySheet = getOrCreateSheet_(SHEETS.MONTHLY, HEADERS.MONTHLY);
  var monthlyData  = monthlySheet.getDataRange().getValues();
  for (var k = 1; k < monthlyData.length; k++) {
    var mrow = monthlyData[k];
    if (String(mrow[1]).toLowerCase() === employee.toLowerCase()) {
      submissions.push({
        type:   'Monthly Report',
        date:   String(mrow[2]),   // month
        status: 'Submitted'
      });
    }
  }

  // Sort by date descending, take last 10
  submissions.sort(function(a, b) {
    return b.date.localeCompare(a.date);
  });
  submissions = submissions.slice(0, 10);

  return jsonResponse_({ success: true, submissions: submissions });
}

// ════════════════════════════════════════════════════════════════
//  Get Dashboard data (Cole's admin view)
// ════════════════════════════════════════════════════════════════
function handleGetDashboard_() {
  var employees = ['Austin', 'Jaimie', 'Lindsey', 'Nathan'];

  // ── Pending PTO ──────────────────────────────────────────────
  var ptoSheet  = getOrCreateSheet_(SHEETS.PTO, HEADERS.PTO);
  var ptoData   = ptoSheet.getDataRange().getValues();
  var pendingPTO = [];
  for (var i = 1; i < ptoData.length; i++) {
    var row = ptoData[i];
    if (String(row[6]).toLowerCase() === 'pending') {
      pendingPTO.push({
        employee:  row[1],
        startDate: row[2],
        endDate:   row[3],
        type:      row[4],
        notes:     row[5],
        status:    row[6],
        timestamp: String(row[0]).slice(0, 10)
      });
    }
  }

  // ── Weekly submissions — who has submitted THIS week ──────────
  var thisMonday = getThisMonday_();
  var weeklySheet = getOrCreateSheet_(SHEETS.WEEKLY, HEADERS.WEEKLY);
  var weeklyData  = weeklySheet.getDataRange().getValues();
  var weeklySubmitted = {};
  employees.forEach(function(emp) { weeklySubmitted[emp] = false; });
  for (var j = 1; j < weeklyData.length; j++) {
    var wrow = weeklyData[j];
    var ts   = new Date(wrow[0]);
    if (ts >= thisMonday) {
      var emp = wrow[1];
      if (weeklySubmitted.hasOwnProperty(emp)) {
        weeklySubmitted[emp] = true;
      }
    }
  }

  // ── Monthly submissions — who has submitted THIS month ────────
  var nowDate  = new Date();
  var thisYearMonth = nowDate.getFullYear() + '-' + String(nowDate.getMonth() + 1).padStart(2, '0');
  var monthlySheet = getOrCreateSheet_(SHEETS.MONTHLY, HEADERS.MONTHLY);
  var monthlyData  = monthlySheet.getDataRange().getValues();
  var monthlySubmitted = {};
  employees.forEach(function(emp) { monthlySubmitted[emp] = false; });
  for (var k = 1; k < monthlyData.length; k++) {
    var mrow  = monthlyData[k];
    var month = String(mrow[2]); // YYYY-MM
    var memp  = mrow[1];
    if (month === thisYearMonth && monthlySubmitted.hasOwnProperty(memp)) {
      monthlySubmitted[memp] = true;
    }
  }

  return jsonResponse_({
    success:          true,
    pendingPTO:       pendingPTO,
    weeklyStatus:     weeklySubmitted,
    monthlyStatus:    monthlySubmitted,
    asOf:             new Date().toISOString()
  });
}

// ════════════════════════════════════════════════════════════════
//  handleGetDetailedDashboard_
//  Returns:
//    - pendingPTO   (same as getDashboard)
//    - ptoByEmployee { Austin: { days: N, requests: [...] }, ... }
//    - reportsByMonth { '2026-06': { weekly: [...], monthly: [...] }, ... }
//    - weeklyStatus / monthlyStatus (same as getDashboard)
// ════════════════════════════════════════════════════════════════
function handleGetDetailedDashboard_() {
  var employees = ['Austin', 'Jaimie', 'Lindsey', 'Nathan'];
  var nowDate   = new Date();
  var thisYear  = nowDate.getFullYear();

  // ── PTO ──────────────────────────────────────────────────────
  var ptoSheet = getOrCreateSheet_(SHEETS.PTO, HEADERS.PTO);
  var ptoData  = ptoSheet.getDataRange().getValues();

  var pendingPTO = [];
  var ptoByEmployee = {};
  employees.forEach(function(emp) {
    ptoByEmployee[emp] = { days: 0, requests: [] };
  });

  for (var i = 1; i < ptoData.length; i++) {
    var row = ptoData[i];
    var emp       = String(row[1]);
    var startStr  = String(row[2]);
    var endStr    = String(row[3]);
    var type      = String(row[4]);
    var notes     = String(row[5]);
    var status    = String(row[6] || 'Pending');
    var timestamp = String(row[0]).slice(0, 10);

    // YTD: count approved/pending PTO days this calendar year
    var startD = new Date(startStr + (startStr.length === 10 ? 'T00:00:00' : ''));
    var endD   = new Date(endStr   + (endStr.length   === 10 ? 'T00:00:00' : ''));
    var days   = (!isNaN(startD) && !isNaN(endD))
                   ? Math.round((endD - startD) / 86400000) + 1
                   : 0;
    var inYear = !isNaN(startD) && startD.getFullYear() === thisYear;

    if (ptoByEmployee[emp] && inYear) {
      ptoByEmployee[emp].days += days;
      ptoByEmployee[emp].requests.push({
        startDate: startStr, endDate: endStr, type: type,
        notes: notes, status: status, days: days, timestamp: timestamp
      });
    }

    if (status.toLowerCase() === 'pending') {
      pendingPTO.push({
        employee: emp, startDate: startStr, endDate: endStr,
        type: type, notes: notes, status: status, timestamp: timestamp
      });
    }
  }

  // ── Weekly reports ────────────────────────────────────────────
  var weeklySheet = getOrCreateSheet_(SHEETS.WEEKLY, HEADERS.WEEKLY);
  var weeklyData  = weeklySheet.getDataRange().getValues();

  // For "this week submitted" check
  var thisMonday = getThisMonday_();
  var weeklySubmitted = {};
  employees.forEach(function(emp) { weeklySubmitted[emp] = false; });

  var reportsByMonth = {};

  for (var j = 1; j < weeklyData.length; j++) {
    var wrow       = weeklyData[j];
    var wts        = new Date(wrow[0]);
    var wemp       = String(wrow[1]);
    var weekEnding = String(wrow[2]);
    var monthKey   = String(wrow[0]).slice(0, 7); // YYYY-MM from timestamp

    if (wts >= thisMonday && weeklySubmitted.hasOwnProperty(wemp)) {
      weeklySubmitted[wemp] = true;
    }

    if (!reportsByMonth[monthKey]) reportsByMonth[monthKey] = { weekly: [], monthly: [] };
    reportsByMonth[monthKey].weekly.push({
      employee:   wemp,
      weekEnding: weekEnding,
      tasks:      String(wrow[3]),
      feedback:   String(wrow[4]),
      timestamp:  String(wrow[0]).slice(0, 10)
    });
  }

  // ── Monthly reports ───────────────────────────────────────────
  var thisYearMonth    = thisYear + '-' + String(nowDate.getMonth() + 1).padStart(2, '0');
  var monthlySheet     = getOrCreateSheet_(SHEETS.MONTHLY, HEADERS.MONTHLY);
  var monthlyData      = monthlySheet.getDataRange().getValues();
  var monthlySubmitted = {};
  employees.forEach(function(emp) { monthlySubmitted[emp] = false; });

  for (var k = 1; k < monthlyData.length; k++) {
    var mrow     = monthlyData[k];
    var memp     = String(mrow[1]);
    var month    = String(mrow[2]);
    var monthKey2 = String(mrow[0]).slice(0, 7);

    if (month === thisYearMonth && monthlySubmitted.hasOwnProperty(memp)) {
      monthlySubmitted[memp] = true;
    }

    if (!reportsByMonth[monthKey2]) reportsByMonth[monthKey2] = { weekly: [], monthly: [] };
    reportsByMonth[monthKey2].monthly.push({
      employee:  memp,
      month:     month,
      tasks:     String(mrow[3]),
      feedback:  String(mrow[4]),
      timestamp: String(mrow[0]).slice(0, 10)
    });
  }

  return jsonResponse_({
    success:         true,
    pendingPTO:      pendingPTO,
    ptoByEmployee:   ptoByEmployee,
    reportsByMonth:  reportsByMonth,
    weeklyStatus:    weeklySubmitted,
    monthlyStatus:   monthlySubmitted,
    asOf:            nowDate.toISOString()
  });
}

// ════════════════════════════════════════════════════════════════
//  notifyApprovers_
//  Reads APPROVER_EMAILS from Script Properties (comma-separated).
//  Sends one email to each address.
// ════════════════════════════════════════════════════════════════
function notifyApprovers_(type, employee, details) {
  try {
    var rawEmails = PropertiesService.getScriptProperties().getProperty('APPROVER_EMAILS') || '';

    if (!rawEmails) {
      Logger.log('notifyApprovers_: APPROVER_EMAILS Script Property not set — skipping email.');
      return;
    }

    // Split on comma, trim whitespace, filter empties
    var recipients = rawEmails.split(',').map(function(e) { return e.trim(); }).filter(Boolean);

    if (recipients.length === 0) {
      Logger.log('notifyApprovers_: No valid recipients found in APPROVER_EMAILS — skipping email.');
      return;
    }

    var subject, body;

    if (type === 'PTO') {
      subject = 'PTO Request — ' + employee + ' (' + details.startDate + ' to ' + details.endDate + ')';
      body = [
        'A new PTO request has been submitted.',
        '',
        'Employee:   ' + employee,
        'Type:       ' + details.type,
        'Start Date: ' + details.startDate,
        'End Date:   ' + details.endDate,
        'Notes:      ' + (details.notes || '(none)'),
        '',
        'Please review and update the Status column in the "PTO Requests" sheet to Approved or Rejected.',
        '',
        '— Rosemary Staff Hub'
      ].join('\n');
    } else if (type === 'Weekly Report') {
      subject = 'Weekly Report — ' + employee + ' (week ending ' + details.weekEnding + ')';
      body = [
        employee + ' submitted a weekly report.',
        '',
        'Week Ending: ' + details.weekEnding,
        'Tasks:       ' + (details.tasks    || '(none)'),
        'Feedback:    ' + (details.feedback || '(none)'),
        '',
        '— Rosemary Staff Hub'
      ].join('\n');
    } else if (type === 'Monthly Report') {
      subject = 'Monthly Report — ' + employee + ' (' + details.month + ')';
      body = [
        employee + ' submitted a monthly report.',
        '',
        'Month:    ' + details.month,
        'Tasks:    ' + (details.tasks    || '(none)'),
        'Feedback: ' + (details.feedback || '(none)'),
        '',
        '— Rosemary Staff Hub'
      ].join('\n');
    } else {
      subject = type + ' — ' + employee;
      body = JSON.stringify(details) + '\n\n— Rosemary Staff Hub';
    }

    recipients.forEach(function(recipient) {
      MailApp.sendEmail({
        to:      recipient,
        subject: subject,
        body:    body
      });
      Logger.log('Approval email sent to ' + recipient);
    });
  } catch (err) {
    Logger.log('notifyApprovers_ error: ' + err.message);
  }
}

// ════════════════════════════════════════════════════════════════
//  jsonResponse_ — ContentService JSON helper
// ════════════════════════════════════════════════════════════════
function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ════════════════════════════════════════════════════════════════
//  getOrCreateSheet_ — ensures sheet exists with headers
//  Reads SPREADSHEET_ID from Script Properties (set by setupRosemaryStaffHub_)
// ════════════════════════════════════════════════════════════════
function getOrCreateSheet_(sheetName, headers) {
  var spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');

  if (!spreadsheetId) {
    throw new Error('SPREADSHEET_ID Script Property is not set. Run setupRosemaryStaffHub_() first.');
  }

  var ss    = SpreadsheetApp.openById(spreadsheetId);
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    // Style header row
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#5a8a5e');
    headerRange.setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }

  return sheet;
}

// ════════════════════════════════════════════════════════════════
//  Utility: get the Monday of the current week (midnight, local)
// ════════════════════════════════════════════════════════════════
function getThisMonday_() {
  var d   = new Date();
  var day = d.getDay(); // 0=Sun
  var diff = (day === 0) ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
