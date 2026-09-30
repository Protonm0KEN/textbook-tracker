// Paste into Extensions > Apps Script of a Google Sheet, then Deploy > Web app
// (Execute as: Me, Access: Anyone). Copy the /exec URL into the app's Settings.
const TABS = {
  textbooks: ['id', 'title', 'author', 'pages', 'hours', 'repos', 'notes', 'skills', 'reward', 'next'],
  exercises: ['id', 'tb', 'label', 'status', 'date']
};
const JSON_COLS = ['repos', 'skills', 'reward'];

const tab = n => { const ss = SpreadsheetApp.getActive(); return ss.getSheetByName(n) || ss.insertSheet(n); };
const out = s => ContentService.createTextOutput(s).setMimeType(ContentService.MimeType.JSON);

function doGet() {
  const tz = Session.getScriptTimeZone(), data = {};
  for (const n in TABS) {
    const rows = tab(n).getDataRange().getValues().slice(1);
    data[n] = rows.filter(r => r[0] !== '').map(r => {
      const o = {};
      TABS[n].forEach((k, i) => {
        let x = r[i];
        if (x instanceof Date) x = Utilities.formatDate(x, tz, 'yyyy-MM-dd');
        if (JSON_COLS.includes(k) && x) { try { x = JSON.parse(x); } catch (e) {} }
        o[k] = x;
      });
      return o;
    });
  }
  return out(JSON.stringify(data));
}

function doPost(e) {
  const d = JSON.parse(e.postData.contents);
  for (const n in TABS) {
    const h = TABS[n], sh = tab(n);
    const rows = [h].concat((d[n] || []).map(o => h.map(k => o[k] == null ? '' : typeof o[k] == 'object' ? JSON.stringify(o[k]) : o[k])));
    sh.clear();
    sh.getRange(1, 1, rows.length, h.length).setValues(rows);
  }
  return out('"ok"');
}
