# Textbook Tracker

Static web app (no build step) for tracking textbook exercises, skills, notes and GitHub projects. Data is cached in the browser and synced to Google Sheets.

## Structure
```
index.html          page shell
css/style.css       styles
js/chart.js         own chart library (pie, line, bar, radar; midpoint-rule smoothing)
js/db.js            data schema, local cache, Google Sheets sync
js/files.js         PDF file saver (IndexedDB) and per-textbook zip archiver
js/app.js           home page, textbook wall, xlsx import/export, GitHub API, print helper
apps-script/Code.gs Google Sheets backend
```

## Run locally
```bash
git clone https://github.com/<you>/textbook-tracker.git
cd textbook-tracker
python3 -m http.server 8000   # open http://localhost:8000
```

## Google Sheets database
1. Create a Google Sheet, open **Extensions > Apps Script**, paste `apps-script/Code.gs`.
2. **Deploy > New deployment > Web app**, Execute as **Me**, Access **Anyone**. Copy the `/exec` URL.
3. In the app: **Settings > Apps Script URL**, then use **Load from Sheets** / **Save to Sheets**.
Tabs `textbooks` and `exercises` are created automatically.

## GitHub integration
Create a fine-grained token with repository **Administration: write** (or a classic token with `public_repo`) and paste it in Settings with your username. It is stored only in your browser's localStorage.

## Publish on GitHub Pages
```bash
git init && git add . && git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<you>/textbook-tracker.git
git push -u origin main
```
Then **Settings > Pages > Deploy from a branch > main / (root)**. Site: `https://<you>.github.io/textbook-tracker/`.

## Branches
- `main`: released, deployed to Pages
- `dev`: integration branch
- `feature/<name>`: one feature each, e.g. `git switch -c feature/archiver dev`, then open a PR into `dev`

## Backups
Use **Export .xlsx** on the home page; **Import .xlsx** restores it.

## Files and archives
Attach the textbook, solution manual and testbank PDFs on a textbook wall (kept in your browser). **Download archive** zips metadata, notes, data and files into folders.

## Version
Current: v0.0.0, see CHANGELOG.md.
