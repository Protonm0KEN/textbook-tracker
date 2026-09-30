/* TBChart: canvas chart library (pie, line, bar, radar). No dependencies.
   Smoothing uses the midpoint rule: window average = (1/w) * integral of daily counts,
   so long date ranges stay smooth and cost stays O(points). */
const TBChart = (() => {
  const COL = { interesting: '#e0a100', done: '#1f9d55', todo: '#3b82f6', hard: '#e5484d' };
  const ACC = '#2f5bea';

  // Midpoint rule: integral of f over [a,b] using n panels
  const mid = (f, a, b, n = 32) => { const h = (b - a) / n; let s = 0; for (let i = 0; i < n; i++) s += f(a + (i + .5) * h); return s * h; };
  const dstr = d => new Date(d * 864e5).toISOString().slice(5, 10);

  function init(cv, title) {
    const r = devicePixelRatio || 1, w = cv.clientWidth || 320, h = cv.clientHeight || 220;
    cv.width = w * r; cv.height = h * r;
    const g = cv.getContext('2d'); g.scale(r, r);
    const fg = getComputedStyle(cv).color;
    g.fillStyle = g.strokeStyle = fg; g.font = '12px system-ui'; g.textAlign = 'left';
    g.fillText(title, 4, 14);
    return { g, w, h, fg };
  }
  const empty = (g, w, h) => g.fillText('No data yet', w / 2 - 30, h / 2);

  // Smoothed average of solved exercises per day. days = array of integer day numbers.
  function average(days, N = 90) {
    if (!days.length) return { xs: [], ys: [] };
    const m = {}; days.forEach(d => m[d] = (m[d] || 0) + 1);
    const a = days.reduce((x, y) => Math.min(x, y)), b = days.reduce((x, y) => Math.max(x, y));
    const span = b - a + 1, w = Math.max(3, span / 25), f = t => m[Math.floor(t)] || 0;
    const n = Math.min(N, span * 2), xs = [], ys = [];
    for (let i = 0; i < n; i++) {
      const t = a + (i + .5) * span / n;
      xs.push(t); ys.push(mid(f, t - w / 2, t + w / 2, Math.ceil(w * 4)) / w);
    }
    return { xs, ys };
  }

  // Downsample to k bars: each bar = midpoint-rule average over its bin
  const rebin = (ys, k) => {
    if (ys.length <= k) return ys;
    const o = [], L = ys.length;
    for (let i = 0; i < k; i++) {
      const a = i * L / k, b = (i + 1) * L / k;
      o.push(mid(t => ys[Math.min(L - 1, Math.floor(t))], a, b, 8) / (b - a));
    }
    return o;
  };

  function xy(cv, title, s, bar) {
    const { g, w, h } = init(cv, title);
    if (!s.ys.length) return empty(g, w, h);
    g.textAlign = 'right'; g.fillText('exercises per day', w - 4, 14); g.textAlign = 'left';
    const ys = bar ? rebin(s.ys, 30) : s.ys;
    const L = 34, R = w - 8, T = 26, B = h - 20, mx = Math.max(...ys, 1e-9) * 1.1;
    const X = i => L + (i + .5) * (R - L) / ys.length, Y = v => B - v / mx * (B - T);
    g.globalAlpha = .3;
    for (let i = 0; i <= 4; i++) { const y = B - i * (B - T) / 4; g.beginPath(); g.moveTo(L, y); g.lineTo(R, y); g.stroke(); }
    g.globalAlpha = 1;
    for (let i = 0; i <= 4; i++) g.fillText((mx * i / 4).toFixed(1), 0, B - i * (B - T) / 4 + 4);
    g.fillText(dstr(s.xs[0]), L, h - 5); g.textAlign = 'right'; g.fillText(dstr(s.xs[s.xs.length - 1]), R, h - 5);
    g.fillStyle = g.strokeStyle = COL.done;
    if (bar) { const bw = (R - L) / ys.length * .8; ys.forEach((v, i) => g.fillRect(X(i) - bw / 2, Y(v), bw, B - Y(v))); }
    else { g.lineWidth = 2; g.beginPath(); ys.forEach((v, i) => i ? g.lineTo(X(i), Y(v)) : g.moveTo(X(i), Y(v))); g.stroke(); }
  }

  // d = [{k:label, v:value, c:color}]
  function pie(cv, title, d) {
    const { g, w, h, fg } = init(cv, title), t = d.reduce((s, x) => s + x.v, 0);
    if (!t) return empty(g, w, h);
    const cx = w * .32, cy = h / 2 + 8, r = Math.min(cx, h / 2) - 14; let a = -Math.PI / 2;
    d.forEach((x, i) => {
      const s = x.v / t * 2 * Math.PI;
      g.fillStyle = x.c; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, r, a, a + s); g.fill(); a += s;
      g.fillRect(w * .65, 44 + i * 22, 10, 10); g.fillStyle = fg; g.fillText(`${x.k}: ${x.v}`, w * .65 + 16, 53 + i * 22);
    });
  }

  // d = [{k:label, v:percent 0-100}]
  function radar(cv, title, d) {
    const { g, w, h, fg } = init(cv, title);
    if (!d.length) return empty(g, w, h);
    const cx = w / 2, cy = h / 2 + 8, r = Math.min(w, h) / 2 - 38, n = d.length;
    const P = (i, v) => [cx + Math.sin(2 * Math.PI * i / n) * r * v / 100, cy - Math.cos(2 * Math.PI * i / n) * r * v / 100];
    const poly = (f) => { g.beginPath(); d.forEach((x, i) => g[i ? 'lineTo' : 'moveTo'](...P(i, f(x)))); g.closePath(); };
    g.globalAlpha = .3;
    [25, 50, 75, 100].forEach(v => { poly(() => v); g.stroke(); });
    d.forEach((_, i) => { g.beginPath(); g.moveTo(cx, cy); g.lineTo(...P(i, 100)); g.stroke(); });
    g.fillStyle = g.strokeStyle = ACC; g.globalAlpha = .35; poly(x => x.v); g.fill();
    g.globalAlpha = 1; g.lineWidth = 2; g.stroke();
    g.fillStyle = fg; g.textAlign = 'center';
    d.forEach((x, i) => { const [px, py] = P(i, 118); g.fillText(`${String(x.k).slice(0, 14)} ${x.v}%`, px, py); });
  }

  return { mid, average, pie, radar, COL, line: (c, t, s) => xy(c, t, s, 0), bar: (c, t, s) => xy(c, t, s, 1) };
})();
