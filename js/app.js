const $ = (s, r = document) => r.querySelector(s), v = $('#v'), D = DB.get();
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const today = () => new Date().toISOString().slice(0, 10), day = s => Math.floor(Date.parse(String(s).slice(0, 10)) / 864e5);
const run = p => p.then(() => alert('Done')).catch(e => alert(e.message));
const dl = (n, x) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([x])); a.download = n; a.click(); };
const prog = (t, s) => { const k = Object.values(t.skills); return Math.round(k.length ? (s.pct + k.reduce((a, b) => a + +b, 0) / k.length) / 2 : s.pct); };
const STATES = ['todo', 'done', 'interesting', 'hard'];

function route() { const [, p, id] = location.hash.split('/'); p == 'tb' && DB.tb(id) ? wall(DB.tb(id)) : home(); }
addEventListener('hashchange', route);
addEventListener('DOMContentLoaded', route);

/* ---------- Home: overall radar + textbook list + settings ---------- */
function home() {
  const c = DB.cfg(), rows = D.textbooks.map(t => ({ t, s: DB.stats(t.id) }));
  v.innerHTML = `
  <div class=c><canvas id=r></canvas></div>
  <div class=c><input id=n placeholder="New textbook title"><button id=a>Add textbook</button>
    <button id=pl>Load from Sheets</button><button id=ps>Save to Sheets</button>
    <button id=xe>Export .xlsx</button> <label class=t>Import .xlsx<input id=xi type=file accept=.xlsx hidden></label></div>
  <div class=g>${rows.map(({ t, s }) => `<a class=c href="#/tb/${t.id}"><b>${esc(t.title)}</b>
    <div class=b><i style="width:${prog(t, s)}%"></i></div>${s.done} of ${s.total} exercises done, ${prog(t, s)}% overall</a>`).join('') || '<p>Add your first textbook above.</p>'}</div>
  <details class=c><summary>Settings</summary>
    Apps Script URL <input id=su value="${esc(c.sheet)}"><br>GitHub user <input id=gu value="${esc(c.user)}">
    Token <input id=gt type=password value="${esc(c.token)}"><button id=sv>Save settings</button></details>`;
  TBChart.radar($('#r'), 'All textbooks: overall progress', rows.map(({ t, s }) => ({ k: t.title, v: prog(t, s) })));
  $('#a').onclick = () => { const n = $('#n').value.trim(); n && (DB.add(n), home()); };
  $('#pl').onclick = () => run(DB.pull().then(home));
  $('#ps').onclick = () => run(DB.push());
  $('#sv').onclick = () => { DB.setCfg({ sheet: $('#su').value.trim(), user: $('#gu').value.trim(), token: $('#gt').value.trim() }); alert('Saved'); };
  $('#xe').onclick = xport; $('#xi').onchange = e => xin(e.target.files[0]);
}

/* ---------- xlsx export / import (SheetJS) ---------- */
function xport() {
  const w = XLSX.utils.book_new(), j = a => a.map(o => Object.fromEntries(Object.entries(o).map(([k, x]) => [k, typeof x == 'object' ? JSON.stringify(x) : x])));
  XLSX.utils.book_append_sheet(w, XLSX.utils.json_to_sheet(j(D.textbooks)), 'textbooks');
  XLSX.utils.book_append_sheet(w, XLSX.utils.json_to_sheet(j(D.exercises)), 'exercises');
  XLSX.writeFile(w, 'textbook-tracker.xlsx');
}
async function xin(f) {
  if (!f) return;
  const w = XLSX.read(await f.arrayBuffer()), r = n => XLSX.utils.sheet_to_json(w.Sheets[n] || {}), p = (x, d) => { try { return JSON.parse(x); } catch (e) { return d; } };
  D.textbooks = r('textbooks').map(t => ({ ...t, repos: p(t.repos, []), skills: p(t.skills, {}), reward: p(t.reward, { name: '', goal: 0, claimed: false }), next: t.next || 'odd' }));
  D.exercises = r('exercises'); DB.save(); home();
}

/* ---------- Textbook wall ---------- */
function wall(t) {
  const E = DB.ex(t.id), S = DB.stats(t.id), sk = Object.entries(t.skills), R = t.reward, sv = () => DB.save(), re = () => wall(t);
  const reached = R.goal && S.done >= R.goal;
  v.innerHTML = `<a href="#/">Back to all textbooks</a><h2>${esc(t.title)}</h2>
  <div class=g>
    <div class=c><b>Trackers</b><br>Solved ${S.done} of ${S.total}<br>Hours spent <input id=hr type=number step=.25 value="${t.hours}" style=width:80px><br>
      Author <input id=au value="${esc(t.author)}"> Pages <input id=pg type=number value="${t.pages}" style=width:80px><br><button id=md>Download metadata (.txt)</button></div>
    <div class=c><b>Challenge reward</b><br><input id=rn placeholder="Reward" value="${esc(R.name)}"> Goal (solved) <input id=rg type=number value="${R.goal}" style=width:70px>
      <div class=b><i style="width:${R.goal ? Math.min(100, S.done / R.goal * 100) : 0}%"></i></div>
      ${reached ? (R.claimed ? 'Claimed: ' + esc(R.name) : '<button id=rc>Claim reward</button>') : ''}<button id=rs>Save challenge</button></div>
  </div>
  <div class=g><div class=c><canvas id=p></canvas></div><div class=c><canvas id=l></canvas></div>
    <div class=c><canvas id=b></canvas></div><div class=c><canvas id=k></canvas></div></div>
  <div class=c><b>Exercises</b><br><input id=ex placeholder="e.g. 2.3.14"><button id=ea>Add exercise</button>
    <div>${E.map(e => `<span class=t data-i="${e.id}" style="border-left:6px solid ${TBChart.COL[e.status]}">${esc(e.label)} (${e.status})</span>`).join('')}</div>
    <small>Click an exercise to cycle: todo, done, interesting, hard.</small>
    <p><b>Interesting:</b> ${E.filter(e => e.status == 'interesting').map(e => esc(e.label)).join(', ') || 'none yet'}</p></div>
  <div class=c><b>Key notes</b> (LaTeX: $x^2$ inline, $$\\int_0^1 x\\,dx$$ block)<textarea id=nt>${esc(t.notes)}</textarea><div id=pv style="white-space:pre-wrap"></div></div>
  <div class=c><b>Skills</b> ${sk.map(([n, p]) => `<span class=t data-s="${esc(n)}">${esc(n)} ${p}%</span>`).join('')}<button id=sa>Add skill</button></div>
  <div class=c><b>GitHub projects</b><br>${t.repos.map(u => `<a href="${esc(u)}" target=_blank>${esc(u.replace('https://github.com/', ''))}</a>`).join('<br>') || 'none yet'}<br>
    <input id=gl placeholder="Link existing repo URL"><button id=gk>Link repo</button><button id=gc>Create repo for an exercise</button></div>
  <div class=c id=fs><b>Files</b> (saved in this browser)<br><span id=f-textbook></span><br><span id=f-solutions></span><br><span id=f-testbank></span></div>
  <div class=c><b>Archive</b> all data of this textbook as a zip with folders <button id=ar>Download archive</button></div>
  <div class=c><b>Print</b> pages <input id=pf type=number value=1 style=width:70px> to <input id=pt type=number value="${t.pages || 1}" style=width:70px>
    <button id=pr>Print ${t.next} pages next</button></div>`;

  // charts (title of the textbook top-left on each)
  const ds = E.filter(e => e.status == 'done').map(e => day(e.date)).sort((a, b) => a - b), A = TBChart.average(ds), C = TBChart.COL;
  TBChart.pie($('#p'), t.title, [['Interesting', 'interesting'], ['Done', 'done'], ['To-Do', 'todo'], ['Hard', 'hard']].map(([k, s]) => ({ k, v: S[s], c: C[s] })));
  TBChart.line($('#l'), t.title, A); TBChart.bar($('#b'), t.title, A);
  TBChart.radar($('#k'), t.title + ' skills', sk.map(([k, x]) => ({ k, v: +x })));

  // trackers, metadata, reward
  $('#hr').onchange = e => { t.hours = +e.target.value; sv(); };
  $('#au').onchange = e => { t.author = e.target.value; sv(); };
  $('#pg').onchange = e => { t.pages = +e.target.value; sv(); };
  $('#md').onclick = () => dl(`${t.title}.txt`, FS.meta(t, S));
  $('#rs').onclick = () => { R.name = $('#rn').value; R.goal = +$('#rg').value; R.claimed = false; sv(); re(); };
  $('#rc') && ($('#rc').onclick = () => { R.claimed = true; sv(); re(); });

  // exercises
  $('#ea').onclick = () => { const l = $('#ex').value.trim(); l && (D.exercises.push({ id: DB.uid(), tb: t.id, label: l, status: 'todo', date: today() }), sv(), re()); };
  v.querySelectorAll('[data-i]').forEach(el => el.onclick = () => {
    const e = D.exercises.find(x => x.id == el.dataset.i); e.status = STATES[(STATES.indexOf(e.status) + 1) % 4]; e.date = today(); sv(); re();
  });

  // notes with LaTeX (KaTeX auto-render)
  const pv = () => { $('#pv').textContent = $('#nt').value; window.renderMathInElement && renderMathInElement($('#pv'), { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }] }); };
  $('#nt').oninput = e => { t.notes = e.target.value; sv(); pv(); }; pv();

  // skills
  $('#sa').onclick = () => { const n = prompt('Skill name'); n && (t.skills[n] = +prompt('Progress %', 0) || 0, sv(), re()); };
  v.querySelectorAll('[data-s]').forEach(el => el.onclick = () => { t.skills[el.dataset.s] = +prompt('Progress %', t.skills[el.dataset.s]) || 0; sv(); re(); });

  // GitHub: link a repo, or create one straight from the wall via the GitHub API
  $('#gk').onclick = () => { const u = $('#gl').value.trim(); u && (t.repos.push(u), sv(), re()); };
  $('#gc').onclick = async () => {
    const c = DB.cfg(); if (!c.token) return alert('Add your GitHub token in Settings first.');
    const l = prompt('Exercise label (the repo is named after it)'); if (!l) return;
    const name = `${t.title}-${l}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    try {
      const r = await fetch('https://api.github.com/user/repos', { method: 'POST', headers: { Authorization: 'Bearer ' + c.token, Accept: 'application/vnd.github+json' }, body: JSON.stringify({ name, description: `${t.title}, exercise ${l}`, auto_init: true }) });
      const j = await r.json(); j.html_url ? (t.repos.push(j.html_url), sv(), re()) : alert(j.message);
    } catch (e) { alert(e.message); }
  };

  // odd/even print: the pass alternates automatically per book; page list is copied for the print dialog
  $('#pr').onclick = () => {
    const a = +$('#pf').value, b = +$('#pt').value, o = t.next == 'odd' ? 1 : 0, p = [];
    for (let i = a; i <= b; i++) i % 2 == o && p.push(i);
    navigator.clipboard.writeText(p.join(','));
    alert(`Copied ${t.next} pages. Paste them into the "Pages" box of your PDF viewer's print dialog, then flip the paper for the next pass.`);
    t.next = t.next == 'odd' ? 'even' : 'odd'; sv(); re();
  };

  // file saver (textbook, solution manual, testbank) and archiver
  FS.KINDS.forEach(async k => {
    const b = await FS.get(t.id, k);
    $('#f-' + k).innerHTML = `${k}: ` + (b ? `<a href="#" data-o="${k}">${esc(b.name)}</a> <button data-d="${k}">Remove</button>` : `<input type=file accept=.pdf data-u="${k}">`);
  });
  $('#fs').onclick = async e => {
    const o = e.target.dataset.o, d = e.target.dataset.d;
    if (o) { e.preventDefault(); open(URL.createObjectURL(await FS.get(t.id, o))); }
    if (d) { await FS.del(t.id, d); re(); }
  };
  $('#fs').onchange = async e => { const k = e.target.dataset.u; if (k && e.target.files[0]) { await FS.put(t.id, k, e.target.files[0]); re(); } };
  $('#ar').onclick = () => run(FS.archive(t, S, E).then(b => dl(`${t.title}.zip`, b)));
}
