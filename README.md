# AI Product Survey - GitHub Pages + Google Sheets

This project is a static web-based survey form designed for deployment on **GitHub Pages**.

Flow:

`GitHub Pages survey form -> Google Apps Script web app -> Google Sheet`

## Files

- `index.html` - the survey page
- `styles.css` - styling for desktop and mobile
- `survey-data.js` - the 12 conjoint choice tasks from `cbc_cards.csv`
- `app.js` - renders tasks and submits responses
- `google-apps-script/Code.gs` - receives POST requests and appends responses to Google Sheets

## 1. Create the Google Sheet

1. Create a new Google Sheet.
2. Name it something like `AI Product Survey Responses`.
3. Open `Extensions -> Apps Script`.
4. Replace the default script with the contents of `google-apps-script/Code.gs`.
5. Save the project.

## 2. Deploy the Google Apps Script

1. In Apps Script, click `Deploy -> New deployment`.
2. Choose `Web app`.
3. Set:
   - Execute as: `Me`
   - Who has access: `Anyone`
4. Deploy and copy the **Web app URL**.

## 3. Connect the static site to Google Apps Script

1. Open `app.js`.
2. Replace:

```js
const APPS_SCRIPT_URL = "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";
```

with your deployed web app URL.

## 4. Publish on GitHub Pages

1. Create a new GitHub repository.
2. Upload these files to the repository root:
   - `index.html`
   - `styles.css`
   - `survey-data.js`
   - `app.js`
3. In GitHub, go to `Settings -> Pages`.
4. Under `Build and deployment`, choose:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
5. Save.

Your survey will be available at:

`https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`

## 5. Test submission

1. Open the GitHub Pages URL.
2. Complete the form.
3. Submit one test response.
4. Confirm a new row appears in the Google Sheet.

## Notes

- The form uses `fetch(..., { mode: "no-cors" })` because GitHub Pages and Google Apps Script run on different domains.
- The Apps Script stores both flattened columns and the full raw JSON payload.
- If you change the conjoint design later, update `survey-data.js` to match the new cards.
