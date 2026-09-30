/* FS: file saver + archiver.
   Textbook, solution manual and testbank PDFs are stored in this browser's IndexedDB (not synced to Sheets).
   Archive = one zip per textbook: metadata.txt, notes/, data/, files/. */
const FS = (() => {
  const KINDS = ['textbook', 'solutions', 'testbank'], key = (id, k) => `${id}/${k}`;
  const open = () => new Promise((ok, no) => {
    const r = indexedDB.open('tbt-files', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('f');
    r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error);
  });
  const tx = async (mode, fn) => {
    const d = await open();
    return new Promise((ok, no) => {
      const t = d.transaction('f', mode), q = fn(t.objectStore('f'));
      t.oncomplete = () => ok(q && q.result); t.onerror = () => no(t.error);
    });
  };
  const meta = (t, S) => `Title: ${t.title}\nAuthor: ${t.author}\nPages: ${t.pages}\nHours: ${t.hours}\nSolved: ${S.done}/${S.total}\nRepos: ${t.repos.join(', ')}\nSkills: ${Object.entries(t.skills).map(([n, p]) => n + ' ' + p + '%').join(', ')}\n`;

  return {
    KINDS, meta,
    put: (id, k, file) => tx('readwrite', s => s.put(file, key(id, k))),
    get: (id, k) => tx('readonly', s => s.get(key(id, k))),
    del: (id, k) => tx('readwrite', s => s.delete(key(id, k))),
    async archive(t, S, E) {
      const zip = new JSZip(), root = zip.folder(t.title.replace(/[^\w\- ]+/g, '_'));
      root.file('metadata.txt', meta(t, S));
      root.folder('notes').file('notes.md', t.notes || '');
      const data = root.folder('data');
      data.file('textbook.json', JSON.stringify(t, null, 2));
      data.file('exercises.json', JSON.stringify(E, null, 2));
      const files = root.folder('files');
      for (const k of KINDS) { const b = await this.get(t.id, k); if (b) files.file(`${k}-${b.name}`, b); }
      return zip.generateAsync({ type: 'blob' });
    }
  };
})();
