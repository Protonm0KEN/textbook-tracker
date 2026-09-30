# Changelog

## v0.0.0 (2026-09-30), first version

**Commit title:** `feat: Textbook Tracker v0.0.0, textbook walls, custom charts, Sheets sync`

**Description:** First working version of Textbook Tracker, a static web app for following your progress through textbooks. Each textbook has a wall with exercise tracking, key notes with LaTeX, hour and page trackers, linked GitHub projects, a challenge reward, files and an archive. Charts come from a small in-house library, and data is cached in the browser and synced to Google Sheets.

### Added
- Chart library (`js/chart.js`): pie, line, bar, radar; midpoint-rule smoothing for long date ranges
- Main page radar of overall progress across all textbooks
- Textbook wall: exercises (todo, done, interesting, hard), trackers, skills radar, notes with LaTeX (KaTeX)
- GitHub links, plus repo creation from the wall through the GitHub API
- Challenge reward with progress bar and claim button
- Odd/even print helper that alternates passes per book
- Data layer (`js/db.js`): documented schema, local cache, Google Sheets sync (`apps-script/Code.gs`)
- Metadata `.txt`, `.xlsx` export/import, per-textbook zip archiver, PDF file saver (`js/files.js`)
- README with install, Sheets setup, GitHub Pages and branch workflow

### Known limitations
- Saved PDFs live in the browser (IndexedDB) and are not synced to Sheets
- GitHub token is stored in localStorage
- Not yet tested across browsers

### Release
```bash
git add . && git commit -m "feat: Textbook Tracker v0.0.0, textbook walls, custom charts, Sheets sync"
git tag -a v0.0.0 -m "First version"
git push origin main --tags
```
