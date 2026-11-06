// ===================== STATE & SAVE =====================
const SAVE_KEY = 'yorutoge.save.v1';
let uidSeq = Date.now() % 100000;
const newUid = () => 'c' + (uidSeq++).toString(36) + Math.random().toString(36).slice(2, 5);

function defaultTune(model) {
  const M = CARS[model], E = M.engine;
  return {
    timing: 0, afr: E.afr, boost: E.stockBoost || 0, limiter: E.limiter, fuel: 'prem',
    rideF: 0, rideR: 0, springF: 1.4, springR: 1.4, damp: 8, camberF: -0.8, camberR: -0.6,
    toeF: 0, toeR: 0.1, arbF: 3, arbR: 3, pressF: 2.1, pressR: 2.1, bias: 0.66, final: M.final
  };
}

function newCar(model, paint) {
  return {
    uid: newUid(), model, paint: paint || CARS[model].paint, parts: {}, tune: defaultTune(model),
    cond: { engine: 1, body: 1, tires: 1, clutch: 1 }, races: 0
  };
}

function defaultState() {
  return {
    v: 1, money: 350000, rep: 0, day: 1, t: 0,
    cars: [newCar('sprint16', '#e9e6dc')], active: 0,
    inv: [], orders: [],
    decor: { posterL: 'p_touge', posterR: null, neon: null, shelf: 's_oil', floorL: 'f_tires', floorR: null, floor: 'fl_concrete', light: 'l_cold' },
    ownedDecor: ['p_touge', 's_oil', 'f_tires', 'fl_concrete', 'l_cold'],
    wins: {}, best: {}, dyno: {},
    settings: { auto: true, abs: true, assist: true, tcs: true, esc: true, aid: 'kezdo', brakeAid: true, steerAid: 'weak', autoGas: false, steer: 'drag', sens: 1, gfx: 'mid', vol: 0.7, cam: 'chase', notes: true, mirror: true, driftAid: true },
    ghosts: {},
    news: ['Megérkeztél Kurozawába. A garázs a tiéd, a Sprint 16 is. A hegyen Sota vár.'],
    jobs: { day: 0, done: {} }, stats: {}, sponsors: {},
    wseed: 1 + Math.floor(Math.random() * 997), heat: 0, dirPref: {}, driftBest: {}
  };
}

let S = defaultState();
const car = () => S.cars[S.active] || S.cars[0];

function sanitize(s) {
  const d = defaultState();
  for (const k of Object.keys(d)) if (s[k] === undefined) s[k] = d[k];
  s.settings = Object.assign({}, d.settings, s.settings || {});
  s.stats = s.stats || {}; s.sponsors = s.sponsors || {}; s.jobs = s.jobs || { day: 0, done: {} };
  s.decor = Object.assign({}, d.decor, s.decor || {});
  for (const c of s.cars) {
    c.tune = Object.assign(defaultTune(c.model), c.tune || {});
    c.cond = Object.assign({ engine: 1, body: 1, tires: 1, clutch: 1 }, c.cond || {});
    c.parts = c.parts || {};
  }
  if (!s.cars.length) s.cars = d.cars;
  if (s.active >= s.cars.length) s.active = 0;
  return s;
}

// ---- persistence: localStorage for instant start, the artifact db for the durable copy
const Save = {
  db: null, uid: null, writing: false, pending: false, timer: null,
  loadLocal() {
    try { const raw = localStorage.getItem(SAVE_KEY); if (raw) return JSON.parse(raw); } catch (e) {}
    return null;
  },
  writeLocal() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} },
  async connect(onRemoteNewer) {
    try {
      if (!window.claude || !window.claude.use) return;
      const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
      if (!db || !user) return;
      const id = await user.id();
      if (!id) return;
      this.db = db; this.uid = id;
      const snap = await db.doc('data/users/' + id + '/save').get();
      if (snap.exists) {
        const d = snap.data();
        const remote = d && d.json ? JSON.parse(d.json) : null;
        if (remote && (remote.t || 0) > (S.t || 0)) { onRemoteNewer(remote); return; }
      }
      this.queue(true);
    } catch (e) { /* playing offline is fine */ }
  },
  queue(now) {
    S.t = Date.now();
    this.writeLocal();
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), now ? 10 : 1500);
  },
  async flush() {
    if (!this.db) return;
    if (this.writing) { this.pending = true; return; }
    this.writing = true;
    try { await this.db.doc('data/users/' + this.uid + '/save').set({ json: JSON.stringify(S), t: S.t }); } catch (e) {}
    this.writing = false;
    if (this.pending) { this.pending = false; this.flush(); }
  }
};
const save = () => Save.queue(false);

// ---- small helpers
const fmtY = n => '¥ ' + Math.round(n).toLocaleString('hu-HU').replace(/,/g, ' ');
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
function el(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'html') e.innerHTML = v;
    else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(k));
  return e;
}
function toast(msg, kind) {
  const t = el('div', { class: 'toast ' + (kind || '') }, msg);
  $('#toasts').append(t);
  setTimeout(() => t.classList.add('out'), 2600);
  setTimeout(() => t.remove(), 3100);
}
function addNews(msg) { S.news.unshift(msg); S.news = S.news.slice(0, 6); }

function partAllowed(p, c) {
  const E = CARS[c.model].engine;
  const hasTurbo = !!(E.turbo || (c.parts.turbo));
  if (p.naOnly && E.turbo) return 'Csak szívómotorhoz';
  if (p.turboOnly && !hasTurbo) return 'Turbó kell hozzá';
  if (p.na && hasTurbo) return 'Csak szívómotorhoz';
  if (p.notRotary && E.rotary) return 'Wankel-motorhoz nem jó';
  return null;
}
function boltsFor(p, c) { return p.bolts === 'lugs' ? CARS[c.model].lugs : p.bolts; }
function torqueFor(p, c) { return p.torque === 'lugs' ? CARS[c.model].lugTorque : p.torque; }

function advanceDay() {
  S.day++;
  const h0 = S.heat || 0; S.heat = Math.max(0, h0 - 6);
  if (h0 >= 45 && S.heat < 45) addNews('Elcsendesedett a hegy. A rendőrök már nem állnak minden éjjel a pihenőben.');
  const arrived = S.orders.filter(o => o.arrive <= S.day);
  S.orders = S.orders.filter(o => o.arrive > S.day);
  for (const o of arrived) S.inv.push(o.pid);
  if (arrived.length) addNews(arrived.length === 1 ? `Csomag érkezett: ${PART[arrived[0].pid].name}.` : `${arrived.length} csomag érkezett. Irány a szerelés.`);
  return arrived;
}

// hand a generated file to the player: inside Claude through the downloads capability, on a phone through the share sheet, else a plain download
async function offerFile(name, blob) {
  try {
    if (window.claude && window.claude.use) {
      const dl = await window.claude.use('downloads');
      if (dl) { await dl.save({ filename: name, data: blob }); return 'saved'; }
    }
  } catch (e) { if (e && e.code === 'declined') return 'declined'; if (e && e.code === 'rate_limited') return 'declined'; }
  try {
    const f = new File([blob], name, { type: blob.type });
    if (navigator.canShare && navigator.share && matchMedia('(pointer:coarse)').matches && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: 'Yoru Tōge' }); return 'shared'; }
  } catch (e) { if (e && e.name === 'AbortError') return 'declined'; }
  try {
    const u = URL.createObjectURL(blob), a = el('a', { href: u, download: name, style: 'display:none' });
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 5000); return 'downloaded';
  } catch (e) { return 'failed'; }
}
