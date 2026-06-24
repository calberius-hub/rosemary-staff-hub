// ═══════════════════════════════════════════════════════════════
//  Rosemary Staff Hub — Google Apps Script Backend
//  Deploy as a Web App: Execute as USER_DEPLOYING, Anyone (anonymous)
// ═══════════════════════════════════════════════════════════════

var CONFIG = {
  spreadsheetId: 'PASTE_SPREADSHEET_ID_HERE',
  approverEmail: 'PASTE_APPROVER_EMAIL_HERE'  // overridden by Script Property APPROVER_EMAIL if set
};

// ── Sheet name constants ──────────────────────────────────────────
var SHEETS = {
  PTO:     'PTO Requests',
  WEEKLY:  'Weekly Reports',
  MONTHLY: 'Monthly Reports'
};

// ── Sheet column headers ──────────────────────────────────────────
var HEADERS = {
  PTO:     ['Timestamp', 'Employee', 'Start Date', 'End Date', 'Type', 'Notes', 'Status'],
  WEEKLY:  ['Timestamp', 'Employee', 'Week Ending', 'Hours Worked', 'Tasks Completed',
            'Maintenance Issues', 'Resident Interactions', 'Needs Attention'],
  MONTHLY: ['Timestamp', 'Employee', 'Month', 'Total Hours', 'PTO Days Used',
            'Open Maintenance', 'Notable Events', 'Needs Attention']
};

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
    body.employee    || '',
    body.weekEnding  || '',
    body.hoursWorked || '',
    body.tasks       || '',
    body.maintenance || '',
    body.residents   || '',
    body.attention   || ''
  ]);

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
    body.employee    || '',
    body.month       || '',
    body.totalHours  || '',
    body.ptoDaysUsed || '',
    body.maintenance || '',
    body.events      || '',
    body.attention   || ''
  ]);

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
//  notifyApprovers_
// ════════════════════════════════════════════════════════════════
function notifyApprovers_(type, employee, details) {
  try {
    // Use Script Property if set, otherwise fall back to CONFIG
    var recipientEmail = PropertiesService.getScriptProperties().getProperty('APPROVER_EMAIL')
                         || CONFIG.approverEmail;

    if (!recipientEmail || recipientEmail === 'PASTE_APPROVER_EMAIL_HERE') {
      Logger.log('notifyApprovers_: APPROVER_EMAIL not configured — skipping email.');
      return;
    }

    var subject = 'PTO Request — ' + employee + ' ' + details.startDate + ' to ' + details.endDate;
    var body = [
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

    MailApp.sendEmail({
      to:      recipientEmail,
      subject: subject,
      body:    body
    });

    Logger.log('Approval email sent to ' + recipientEmail);
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
// ════════════════════════════════════════════════════════════════
function getOrCreateSheet_(sheetName, headers) {
  var ss    = SpreadsheetApp.openById(CONFIG.spreadsheetId);
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
