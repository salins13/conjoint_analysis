const SHEET_NAME = "Responses";
const HEADERS = [
  "submittedAt",
  "participantId",
  "surveyDate",
  "name",
  "email",
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

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || "{}");
    const sheet = getOrCreateSheet_();
    ensureHeader_(sheet);

    const row = buildRow_(payload);
    sheet.appendRow(row);

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
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
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

function jsonOutput_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
