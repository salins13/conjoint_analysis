const SHEET_NAME = "Sheet1";
const SPREADSHEET_ID = "1SUlIDPNmNE5PJEuOdyERNVgkSRzQVOpfBgsV6bDpL1c";
const BACKUP_EMAIL = "salins13@gmail.com";

const HEADERS = [
  "submittedAt",
  "participantId",
  "surveyDate",
  "name",
  "email",
  "gender",
  "age",
  "profession",
  "experienceYears",
  "workSetting",
  "usesAiTools",
  "involvedInSelection",
  "topFeatures",
  "task1Choice",
  "task2Choice",
  "task3Choice",
  "task4Choice",
  "task5Choice",
  "task6Choice",
  "task7Choice",
  "task8Choice",
  "task9Choice",
  "task10Choice",
  "task11Choice",
  "task12Choice",
  "surveyVersion",
  "totalTasks",
  "userAgent",
  "rawJson",
];

function doGet() {
  return jsonOutput_({
    ok: true,
    message: "Survey Web App is running",
  });
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || "{}");
    const sheet = getOrCreateSheet_();
    ensureHeader_(sheet);

    const row = buildRow_(payload);
    sheet.appendRow(row);
    sendBackupEmail_(payload, sheet);

    return jsonOutput_({
      ok: true,
      message: "Response stored",
    });
  } catch (error) {
    return jsonOutput_({
      ok: false,
      message: error.message,
    });
  }
}

function getOrCreateSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const existing = spreadsheet.getSheetByName(SHEET_NAME);
  return existing || spreadsheet.insertSheet(SHEET_NAME);
}

function ensureHeader_(sheet) {
  if (sheet.getLastRow() > 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    return;
  }

  sheet.appendRow(HEADERS);
  sheet.setFrozenRows(1);
}

function buildRow_(payload) {
  const profile = payload.profile || {};
  const choices = normalizeChoices_(payload.choices || []);
  const metadata = payload.metadata || {};

  return [
    payload.submittedAt || "",
    profile.participantId || "",
    profile.surveyDate || "",
    profile.name || "",
    profile.email || "",
    profile.gender || "",
    profile.age || "",
    profile.profession || "",
    profile.experienceYears || "",
    profile.workSetting || "",
    profile.usesAiTools || "",
    profile.involvedInSelection || "",
    Array.isArray(profile.topFeatures) ? profile.topFeatures.join(", ") : "",
    choices[1] || "",
    choices[2] || "",
    choices[3] || "",
    choices[4] || "",
    choices[5] || "",
    choices[6] || "",
    choices[7] || "",
    choices[8] || "",
    choices[9] || "",
    choices[10] || "",
    choices[11] || "",
    choices[12] || "",
    metadata.surveyVersion || "",
    metadata.totalTasks || "",
    metadata.userAgent || "",
    JSON.stringify(payload),
  ];
}

function normalizeChoices_(choices) {
  return choices.reduce(function (acc, item) {
    acc[item.task] = item.selectedAlternative;
    return acc;
  }, {});
}

function sendBackupEmail_(payload, sheet) {
  const profile = payload.profile || {};
  const choices = normalizeChoices_(payload.choices || []);
  const topFeatures = Array.isArray(profile.topFeatures)
    ? profile.topFeatures.join(", ")
    : "";
  const choiceLines = Array.from({ length: 12 }, function (_, index) {
    const taskNumber = index + 1;
    return "Choice set " + taskNumber + ": Option " + (choices[taskNumber] || "");
  }).join("\n");

  const body = [
    "New survey response received.",
    "",
    "Spreadsheet: " + sheet.getParent().getUrl(),
    "Sheet tab: " + sheet.getName(),
    "",
    "Submitted at: " + (payload.submittedAt || ""),
    "Participant ID: " + (profile.participantId || ""),
    "Survey date: " + (profile.surveyDate || ""),
    "Name: " + (profile.name || ""),
    "Email: " + (profile.email || ""),
    "Gender: " + (profile.gender || ""),
    "Age: " + (profile.age || ""),
    "Profession: " + (profile.profession || ""),
    "Experience years: " + (profile.experienceYears || ""),
    "Work setting: " + (profile.workSetting || ""),
    "Uses AI tools: " + (profile.usesAiTools || ""),
    "Involved in selection: " + (profile.involvedInSelection || ""),
    "Top features: " + topFeatures,
    "",
    "Choices:",
    choiceLines,
    "",
    "Raw JSON:",
    JSON.stringify(payload, null, 2),
  ].join("\n");

  console.log("MailApp quota before send: " + MailApp.getRemainingDailyQuota());
  console.log("Sending backup email to: " + BACKUP_EMAIL);

  MailApp.sendEmail({
    to: BACKUP_EMAIL,
    subject: "New AI Textbook Survey Response - " + (profile.name || "Unnamed respondent"),
    body: body,
  });

  console.log("Backup email accepted by MailApp.");
  console.log("MailApp quota after send: " + MailApp.getRemainingDailyQuota());
}

function testBackupEmail() {
  const recipient = BACKUP_EMAIL.trim();
  const subject = "Test - AI Textbook Survey Email Backup - " + new Date().toISOString();

  console.log("Testing MailApp email.");
  console.log("Recipient: " + recipient);
  console.log("MailApp quota before send: " + MailApp.getRemainingDailyQuota());

  MailApp.sendEmail({
    to: recipient,
    subject: subject,
    body: "This is a test email from Apps Script MailApp.\n\nSent at: " + new Date().toISOString(),
  });

  console.log("MailApp test send completed.");
  console.log("MailApp quota after send: " + MailApp.getRemainingDailyQuota());
}

function testGmailBackupEmail() {
  const recipient = BACKUP_EMAIL.trim();
  const subject = "Test - AI Textbook Survey GmailApp Backup - " + new Date().toISOString();

  console.log("Testing GmailApp email.");
  console.log("Recipient: " + recipient);

  GmailApp.sendEmail(
    recipient,
    subject,
    "This is a test email from Apps Script GmailApp.\n\nSent at: " + new Date().toISOString()
  );

  console.log("GmailApp test send completed. Check Inbox, Spam, All Mail, and Sent.");
}

function jsonOutput_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
