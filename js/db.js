/* DB: one state object, cached in localStorage (instant load), synced to Google Sheets via Apps Script.
   SCHEMA (each table = one Sheet tab, same column order in apps-script/Code.gs)
     textbooks: id, title, author, pages, hours, repos[], notes, skills{name:percent}, reward{name,goal,claimed}, next('odd'|'even')
     exercises: id, tb (textbook id), label, status('todo'|'done'|'interesting'|'hard'), date('YYYY-MM-DD')
   Settings (Apps Script URL, GitHub user/token) live under a separate key and are never synced. */
const DB = (() => {
  const K = 'tbt.v1', uid = () => Math.random().toString(36).slice(2, 9);
  let s, cfg;
  try { s = JSON.parse(localStorage.getItem(K)) || { textbooks: [], exercises: [] }; cfg = JSON.parse(localStorage.getItem(K + '.cfg')) || {}; }
  catch (e) { s = { textbooks: [], exercises: [] }; cfg = {}; }

  const save = () => localStorage.setItem(K, JSON.stringify(s));
  const api = async (method, body) => {
    if (!cfg.sheet) throw Error('Set the Apps Script URL in Settings first.');
    const r = await fetch(cfg.sheet, { method, body: body && JSON.stringify(body) });
    return method == 'GET' ? r.json() : r.text();
  };
  const blankReward = () => ({ name: '', goal: 0, claimed: false });

  return {
    get: () => s, cfg: () => cfg, save, uid,
    setCfg: c => { cfg = c; localStorage.setItem(K + '.cfg', JSON.stringify(c)); },
    tb: id => s.textbooks.find(t => t.id == id),
    ex: id => s.exercises.filter(e => e.tb == id),
    add: title => {
      const t = { id: uid(), title, author: '', pages: 0, hours: 0, repos: [], notes: '', skills: {}, reward: blankReward(), next: 'odd' };
      s.textbooks.push(t); save(); return t;
    },
    pull: async () => {
      const d = await api('GET');
      s.textbooks = d.textbooks.map(t => ({ ...t, repos: Array.isArray(t.repos) ? t.repos : [], skills: t.skills || {}, reward: t.reward || blankReward(), next: t.next || 'odd' }));
      s.exercises = d.exercises; save();
    },
    push: () => api('POST', s),
    stats(id) {
      const e = s.exercises.filter(x => x.tb == id), n = k => e.filter(x => x.status == k).length, done = n('done');
      return { total: e.length, done, interesting: n('interesting'), hard: n('hard'), todo: n('todo'), pct: e.length ? Math.round(done / e.length * 100) : 0 };
    }
  };
})();
