// ===================== ONLINE: a room for up to four, joined with a four-letter code or by quick match =====================
// The browsers talk directly (WebRTC through PeerJS). There is no game server: the player who opened the room
// relays between the others. Each player drives on their own screen and sends where their car is a dozen times a second.
const NET_LIBS = ['https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js', 'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js'];
const NET_V = 11, NET_MAX = 4, NET_PUB = ['PUB1', 'PUB2', 'PUB3'];
const NET_LANES = { 1: [0], 2: [-1.75, 1.75], 3: [-2.3, 0, 2.3], 4: [-2.55, -0.85, 0.85, 2.55] };
const NET_ABC = 'ABCDEFGHJKLMNPRSTUVWXYZ23456789';

// the other player's car: eased toward the last position we were told, carried forward by its speed in between
class NetCar {
  constructor(T, s0, lat0) { this.T = T; this.s = s0; this.lat = lat0; this.v = 0; this.yawVis = 0; this.braking = true; this.m = null; this.age = 0; this.gone = false; this.x = this.y = this.z = this.h = 0; this.place(); }
  push(m) { this.m = m; this.age = 0; }
  place() { const p = trackPoint(this.T, this.s); this.x = p.x + Math.cos(p.h) * this.lat; this.z = p.z - Math.sin(p.h) * this.lat; this.y = p.y; this.h = p.h; }
  step(dt) {
    const m = this.m; if (!m) return;
    this.age += dt; const a = Math.min(this.age, 0.6), sT = m.s + m.v * a, T = this.T;
    if (Math.abs(sT - this.s) > 35) this.s = sT; else this.s += (sT - this.s) * Math.min(1, dt * 9);
    this.lat += (m.l - this.lat) * Math.min(1, dt * 8); this.v += (m.v - this.v) * Math.min(1, dt * 8);
    this.yawVis += (m.y - this.yawVis) * Math.min(1, dt * 8); this.braking = !!m.b;
    this.s = clamp(this.s, 0, T.N - 3); this.place();
  }
}

const Net = {
  peer: null, conn: null, conns: null, code: '', host: false, pub: false, id: 0, players: [], cfg: { track: 'kurozawa', rev: false }, st: 'idle', off: 0, msg: '', busy: false, racing: null, board: null, hooks: null,
  available() { return !window.claude && /^https?:$/.test(location.protocol) && !!window.RTCPeerConnection; },
  load() {
    if (window.Peer) return Promise.resolve();
    if (this._load) return this._load;
    const one = (src) => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = () => window.Peer ? res() : rej(new Error('lib')); s.onerror = () => { s.remove(); rej(new Error('lib')); }; document.head.append(s); });
    return (this._load = NET_LIBS.reduce((p, src) => p.catch(() => one(src)), Promise.reject()).catch((e) => { this._load = null; throw e; }));
  },
  peerOpts() {
    const q = new URLSearchParams(location.search).get('peer'); // for testing against a local PeerServer: ?peer=localhost:9000
    const o = { debug: 0, config: { iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }, { urls: 'stun:stun.cloudflare.com:3478' }] } };
    if (q) { const [h, p] = q.split(':'); Object.assign(o, { host: h, port: +p || 9000, path: '/', secure: false }); }
    return o;
  },
  nick() { return (S.settings.nick || '').trim().slice(0, 14) || 'Játékos'; },
  mine() { const c = car(); return { name: this.nick(), model: c.model, paint: c.paint, parts: Object.values(c.parts).map(p => p.id), look: c.look || {}, camber: [c.tune.camberF, c.tune.camberR], ps: Math.round(carSpec(c).ps) }; },
  // never trust what arrives: rebuild the other car from ids we know
  clean(d) {
    if (!d || !CARS[d.model]) return null;
    const hex = v => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v : null, c = { model: d.model, paint: hex(d.paint) || CARS[d.model].paint, parts: {}, tune: { camberF: clamp(+(d.camber || [])[0] || 0, -8, 1), camberR: clamp(+(d.camber || [])[1] || 0, -8, 1), rideF: 0, rideR: 0 }, look: {} };
    for (const id of Array.isArray(d.parts) ? d.parts.slice(0, 80) : []) if (PART[id]) c.parts[PART[id].slot] = { id, q: 1 };
    const L = d.look || {}; if (FINISHES[L.finish]) c.look.finish = L.finish; if (LIVERIES[L.livery]) c.look.livery = L.livery; if (hex(L.col2)) c.look.col2 = L.col2; if (hex(L.neon)) c.look.neon = L.neon; if (BANNERS.some(b => b[0] === L.banner)) c.look.banner = L.banner;
    return { name: String(d.name || 'Vendég').replace(/[<>]/g, '').slice(0, 14), c, ps: clamp(Math.round(+d.ps || 100), 30, 1500) };
  },
  who(id) { return this.players.find(p => p.id === id); },
  nameOf(id) { const p = this.who(id); return p ? p.name : (this.board && this.board.names[id]) || 'Valaki'; },
  setCfg(c) { if (!c) return; const id = String(c.track); this.cfg = { track: id === 'wangan' || TOUGES.some(t => t.id === id) ? id : 'kurozawa', rev: !!c.rev }; },
  trackOf(cfg) { return cfg.track === 'wangan' ? DRAG : TOUGES.find(t => t.id === cfg.track) || TOUGES[0]; },
  // ---- lobby
  lobby() {
    const box = el('div', { class: 'netlobby' }); this.box = box;
    UI.open([UI.head('Online szoba', 'Legfeljebb négyen, közvetlen kapcsolattal · tét nélkül'), box]);
    if (this.st === 'room') this.refreshMe();
    this.draw();
  },
  // the car may have changed in the garage since we joined
  refreshMe() {
    const raw = this.mine(), me = this.who(this.id), o = this.clean(raw); if (!me || !o) return;
    Object.assign(me, o, { raw });
    if (this.host) this.room(); else this.send({ t: 'me', me: raw });
  },
  draw() {
    const box = this.box; if (!box || !box.isConnected) return;
    const st = this.st, kids = [];
    if (this.msg) kids.push(el('div', { class: 'panel', style: 'border-color:#6b2630' }, this.msg));
    if (st === 'idle') {
      const nick = el('input', { class: 'inp', maxlength: 14, value: S.settings.nick || '', placeholder: 'Neved a hegyen', 'aria-label': 'Neved' });
      const keep = () => { S.settings.nick = nick.value.trim().slice(0, 14); save(); };
      nick.addEventListener('change', keep);
      const code = el('input', { class: 'inp code', maxlength: 4, placeholder: 'KÓD', autocapitalize: 'characters', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Szobakód' });
      kids.push(el('label', { class: 'fld' }, el('span', null, 'Név'), nick),
        el('div', { class: 'panel netquick' }, el('div', null, el('h3', { style: 'margin:0 0 4px' }, 'Gyors meccs'), el('p', { class: 'muted', style: 'margin:0' }, 'Beülsz egy nyilvános szobába, ahová bárki beléphet. Ha épp nincs ilyen, te nyitod meg, és vársz a többiekre.')), el('button', { class: 'btn primary', onclick: () => { keep(); this.open('quick'); } }, 'Keresés')),
        el('div', { class: 'netcols' },
          el('div', { class: 'panel' }, el('h3', { style: 'margin:0 0 4px' }, 'Saját szobát nyitok'), el('p', { class: 'muted', style: 'margin:0 0 10px' }, 'Kapsz egy négyjegyű kódot, azt küldd el a haveroknak. Te választod a pályát.'), el('button', { class: 'btn primary', onclick: () => { keep(); this.open('host'); } }, 'Szoba nyitása')),
          el('div', { class: 'panel' }, el('h3', { style: 'margin:0 0 4px' }, 'Csatlakozom'), el('p', { class: 'muted', style: 'margin:0 0 10px' }, 'Írd be a kódot, amit a házigazda küldött.'), el('div', { class: 'row' }, code, el('button', { class: 'btn primary', onclick: () => { keep(); const v = code.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); if (v.length !== 4) { toast('A kód négy karakter.', 'bad'); return; } this.open('join', v); } }, 'Belépés')))),
        el('p', { class: 'muted', style: 'font-size:12.5px;margin:0' }, 'Mindenki a saját autójával megy. A többiek autóját látod, de nem ütköztök: így egy akadozó kapcsolat nem lök le az útról. Pénz, kopás és nap nem jár érte. Néhány mobilhálózaton a közvetlen kapcsolat nem jön létre; wifin szinte mindig megy.'));
    } else if (st === 'opening' || st === 'joining') {
      kids.push(el('div', { class: 'netwait' }, this.pub ? 'Nyilvános szoba keresése…' : st === 'opening' ? 'Szoba nyitása…' : 'Csatlakozás…'), el('div', { class: 'row', style: 'justify-content:center' }, el('button', { class: 'btn ghost', onclick: () => this.leave() }, 'Mégse')));
    } else if (st === 'room') {
      const cfg = this.cfg, tg0 = this.trackOf(cfg), n = this.players.length, hostP = this.who(0);
      kids.push(el('div', { class: 'netcode' + (this.pub ? ' pub' : '') }, el('small', null, this.pub ? 'Nyilvános szoba' : 'Szobakód'), el('b', null, this.pub ? `${n} / ${NET_MAX}` : this.code)));
      kids.push(el('div', { class: 'netplayers' }, ...this.players.map(p => el('div', { class: 'panel netwho' + (p.id === this.id ? ' me' : '') }, el('div', { class: 'eyebrow' }, p.id === this.id ? (p.id === 0 ? 'Te · házigazda' : 'Te') : p.id === 0 ? 'Házigazda' : 'Játékos'), el('b', null, p.name), el('span', { class: 'muted' }, `${CARS[p.c.model].name} · ${p.ps} LE`))),
        ...Array.from({ length: NET_MAX - n }, () => el('div', { class: 'panel netwho empty' }, el('span', { class: 'muted' }, 'szabad hely')))));
      if (n < 2) kids.push(el('div', { class: 'netwait' }, this.pub ? 'Várakozás: bárki beléphet a gyors meccsel…' : 'Várakozás a többiekre…'));
      if (this.host) {
        const sel = el('select', { class: 'inp', 'aria-label': 'Pálya', onchange: (e) => { cfg.track = e.target.value; if (cfg.track === 'wangan') cfg.rev = false; this.send({ t: 'cfg', cfg }); this.draw(); } },
          ...TOUGES.map(t => el('option', { value: t.id, selected: t.id === cfg.track }, `${t.name} · ${(trackLength(t) / 1000).toFixed(1)} km`)), el('option', { value: 'wangan', selected: cfg.track === 'wangan' }, `${DRAG.name} · 402 m`));
        kids.push(el('label', { class: 'fld' }, el('span', null, 'Pálya'), sel));
        if (cfg.track !== 'wangan') kids.push(el('div', { class: 'seg', role: 'group', 'aria-label': 'Irány' },
          el('button', { class: 'chip', 'aria-pressed': String(!cfg.rev), onclick: () => { cfg.rev = false; this.send({ t: 'cfg', cfg }); this.draw(); } }, tg0.dir === 'down' ? '↓ Downhill' : '↑ Hillclimb'),
          el('button', { class: 'chip', 'aria-pressed': String(cfg.rev), onclick: () => { cfg.rev = true; this.send({ t: 'cfg', cfg }); this.draw(); } }, tg0.dir === 'down' ? '↑ Hillclimb' : '↓ Downhill')));
      } else kids.push(el('div', { class: 'panel' }, el('div', { class: 'eyebrow' }, `${hostP ? hostP.name : 'A házigazda'} választása`), el('b', null, tg0.name), el('span', { class: 'muted' }, cfg.track === 'wangan' ? ' · 402 m állórajt' : ` · ${dirName(tougeDir(tg0, cfg.rev))}`)));
      const B = this.board;
      if (B) {
        const f = (x) => B.zero ? x.toFixed(2) + ' s' : fmtTime(x), rows = B.ids.map(id => ({ id, t: B.fin[id] })).sort((a, b) => (typeof a.t === 'number' ? a.t : a.t === 'dnf' ? 1e9 : 1e8) - (typeof b.t === 'number' ? b.t : b.t === 'dnf' ? 1e9 : 1e8));
        kids.push(el('div', { class: 'panel netboard' }, el('div', { class: 'eyebrow' }, B.title),
          ...rows.map((r, i) => el('div', { class: 'nbrow' + (r.id === this.id ? ' me' : '') + (i === 0 && typeof r.t === 'number' ? ' first' : '') }, el('span', { class: 'nbpos' }, typeof r.t === 'number' ? `${i + 1}.` : '–'), el('b', null, B.names[r.id] || '?'), el('span', { class: 'nbt' }, typeof r.t === 'number' ? f(r.t) : r.t === 'dnf' ? 'nem ért célba' : 'még úton…')))));
      }
      const busy = this.host ? !!this.racing : this.busy;
      kids.push(el('div', { class: 'row', style: 'justify-content:center' },
        this.host ? el('button', { class: 'btn primary', style: 'min-width:170px', disabled: n < 2 || busy, onclick: () => this.launch() }, busy ? 'Futam folyamatban…' : B ? 'Még egy futam' : 'Indítás') : el('span', { class: 'muted' }, busy ? 'Futam folyamatban, a következőben már benne leszel.' : 'A házigazda indítja a futamot.'),
        !this.pub && navigator.share ? el('button', { class: 'btn', onclick: () => navigator.share({ title: 'Yoru Tōge', text: `Gyere egy körre! Szobakód: ${this.code}`, url: location.origin + location.pathname }).catch(() => {}) }, 'Kód megosztása') : null,
        el('button', { class: 'btn ghost', onclick: () => this.leave() }, this.host ? 'Szoba bezárása' : 'Kilépek')));
    }
    box.replaceChildren(...kids);
  },
  fail(m) { this.reset(); this.msg = m; this.draw(); },
  reset() {
    clearTimeout(this.joinT); clearTimeout(this.goT); clearTimeout(this.forceT);
    const peer = this.peer, conn = this.conn, conns = this.conns;
    this.peer = this.conn = this.conns = null; this.tryNext = null;
    try { if (conn) conn.close(); } catch (e) {}
    if (conns) for (const c of conns.values()) try { c.close(); } catch (e) {}
    try { if (peer) peer.destroy(); } catch (e) {}
    this.players = []; this.st = 'idle'; this.code = ''; this.board = null; this.racing = null; this.busy = false; this.pub = false; this.host = false;
  },
  leave() { this.send({ t: 'bye' }); this.reset(); this.msg = ''; this.draw(); },
  // losing the room in the middle of a race ends the race
  dropped(msg) {
    const racing = Race.active && Race.net; this.reset(); this.msg = msg;
    if (racing) { toast('Megszakadt a kapcsolat.', 'bad'); if (Race.phase === 'race' || Race.phase === 'count') { Race.phase = 'race'; Race.finish('quit'); } else if (Race.introEl && Race.introEl.isConnected) Race.teardown(); }
    this.hooks = null; this.draw();
  },
  async open(mode, code) {
    this.reset(); this.msg = ''; this.host = mode === 'host'; this.pub = mode === 'quick'; this.st = this.host ? 'opening' : 'joining'; this.draw(); save();
    try { await this.load(); } catch (e) { this.fail('Nem sikerült betölteni a kapcsolatkezelőt. Van internet?'); return; }
    if (this.st !== 'opening' && this.st !== 'joining') return;
    if (mode === 'host') this.hostAs(null, 0); else this.joinAs(mode === 'quick' ? NET_PUB.slice() : [code], 0);
  },
  hostAs(code, tries) {
    this.host = true; this.id = 0; this.conns = new Map(); this.nextId = 1; this.st = 'opening';
    const raw = this.mine(); this.players = [Object.assign({ id: 0, raw }, this.clean(raw))];
    this.code = code || Array.from({ length: 4 }, () => NET_ABC[Math.floor(Math.random() * NET_ABC.length)]).join('');
    const peer = this.peer = new Peer('yorutoge-' + this.code, this.peerOpts());
    peer.on('open', () => { if (this.peer !== peer) return; if (this.st === 'opening') { this.st = 'room'; this.draw(); } });
    peer.on('connection', (conn) => { if (this.peer === peer) this.accept(conn); });
    peer.on('disconnected', () => { if (this.peer === peer) setTimeout(() => { try { if (this.peer === peer && !peer.destroyed) peer.reconnect(); } catch (e) {} }, 2000); });
    peer.on('error', (e) => {
      if (this.peer !== peer) return; const t = e && e.type;
      if (t === 'unavailable-id' && this.st === 'opening') {
        try { peer.destroy(); } catch (er) {} this.peer = null;
        if (!code && tries < 4) { this.hostAs(null, tries + 1); return; }
        if (code && tries < 2) { this.st = 'joining'; this.joinAs(NET_PUB.slice(), tries + 1); return; }
        this.fail(code ? 'Most minden nyilvános szoba tele van. Próbáld meg kicsit később, vagy nyiss saját szobát.' : 'Nem sikerült szobát nyitni. Próbáld újra.'); return;
      }
      if (this.st === 'room') return; // the signalling server dropping does not end an open room
      this.fail('Kapcsolati hiba' + (t ? ` (${t})` : '') + '. Próbáld újra.');
    });
  },
  joinAs(codes, round) {
    this.host = false; this.conns = null; this.st = 'joining';
    const peer = this.peer = new Peer(this.peerOpts());
    let i = 0, free = null;
    const next = () => {
      if (this.peer !== peer || this.st !== 'joining') return;
      if (i >= codes.length) {
        if (!this.pub) { this.fail('Nincs ilyen szoba. Ellenőrizd a kódot.'); return; }
        this.tryNext = null; this.peer = null; try { peer.destroy(); } catch (e) {} this.hostAs(free || codes[0], round); this.draw(); return;
      }
      this.code = codes[i++]; const conn = peer.connect('yorutoge-' + this.code, { reliable: true }); this.wire(conn);
      clearTimeout(this.joinT);
      this.joinT = setTimeout(() => { if (this.st !== 'joining' || this.conn !== conn) return; if (this.pub) { this.conn = null; try { conn.close(); } catch (e) {} next(); } else this.fail('Nem sikerült kapcsolódni. Jó a kód? Lehet, hogy a hálózatotok nem enged közvetlen kapcsolatot.'); }, this.pub ? 7000 : 15000);
    };
    this.tryNext = (wasFree) => { if (wasFree && !free) free = this.code; clearTimeout(this.joinT); this.conn = null; next(); };
    peer.on('error', (e) => {
      if (this.peer !== peer) return; const t = e && e.type;
      if (t === 'peer-unavailable') { if (this.st === 'joining') { if (this.pub) this.tryNext(true); else this.fail('Nincs ilyen szoba. Ellenőrizd a kódot.'); } return; }
      if (this.st === 'room' && this.conn && this.conn.open) return;
      this.fail('Kapcsolati hiba' + (t ? ` (${t})` : '') + '. Próbáld újra.');
    });
    peer.on('open', next);
  },
  // guest side: the one connection to the host
  wire(conn) {
    this.conn = conn;
    conn.on('open', () => { if (this.conn !== conn) return; this.send({ t: 'hi', me: this.mine(), v: NET_V }); this.ping(); });
    conn.on('data', (m) => { if (this.conn !== conn) return; try { this.recv(m, 0); } catch (e) { console.error(e); } });
    const gone = () => {
      if (this.conn !== conn) return;
      if (this.st === 'joining') { if (this.pub && this.tryNext) this.tryNext(false); else this.fail('Nem sikerült kapcsolódni. Próbáld újra.'); return; }
      this.dropped('A házigazda kilépett, vagy megszakadt a kapcsolat.');
    };
    conn.on('close', gone); conn.on('error', gone);
  },
  // host side: one connection per guest
  accept(conn) {
    let id = null;
    const say = (m) => { try { conn.send(m); } catch (e) {} };
    conn.on('data', (m) => {
      try {
        if (id != null) { this.recv(m, id); return; }
        if (!m || m.t !== 'hi') return;
        const o = this.clean(m.me);
        if (m.v !== NET_V || !o) { say({ t: 'old' }); say({ t: 'hi', v: NET_V }); setTimeout(() => { try { conn.close(); } catch (e) {} }, 500); return; }
        if (this.players.length >= NET_MAX) { say({ t: 'full' }); setTimeout(() => { try { conn.close(); } catch (e) {} }, 500); return; }
        id = this.nextId++; this.conns.set(id, conn); this.players.push(Object.assign({ id, raw: m.me }, o));
        this.room(); toast(`${o.name} belépett a szobába.`, 'good'); this.draw();
      } catch (e) { console.error(e); }
    });
    const gone = () => {
      if (id == null || !this.conns || this.conns.get(id) !== conn) return;
      const nm = this.nameOf(id); this.conns.delete(id); this.players = this.players.filter(p => p.id !== id);
      if (this.board && this.board.ids.includes(id) && this.board.fin[id] == null) { this.relay({ t: 'fin', dnf: true, i: id }); this.onFin(id, { dnf: true }); }
      if (this.rdy) this.rdy.delete(id);
      this.room(); toast(`${nm} kilépett.`); this.tryGo(); this.draw();
    };
    conn.on('close', gone); conn.on('error', gone);
  },
  room() { if (!this.host || !this.conns) return; const pl = this.players.map(p => ({ id: p.id, me: p.raw })); for (const [id, c] of this.conns) try { if (c.open) c.send({ t: 'room', you: id, pl, cfg: this.cfg, pub: this.pub, code: this.code, busy: !!this.racing }); } catch (e) {} },
  // to everyone else in the room: a guest talks to the host, the host talks to all the guests
  send(m) { try { if (this.host) { if (this.conns) { m.i = 0; for (const c of this.conns.values()) if (c.open) c.send(m); } } else if (this.conn && this.conn.open) this.conn.send(m); } catch (e) {} },
  relay(m, except) { if (!this.conns) return; for (const [id, c] of this.conns) if (id !== except) try { if (c.open) c.send(m); } catch (e) {} },
  sendTo(id, m) { try { const c = this.conns && this.conns.get(id); if (c && c.open) c.send(m); } catch (e) {} },
  ping() { this.pings = []; let n = 0; const conn = this.conn; const go = () => { if (this.conn !== conn || n++ >= 5) return; this.send({ t: 'ping', c: Date.now() }); setTimeout(go, 220); }; go(); },
  // from: the guest's id when we host, 0 when the message came from the host
  recv(m, from) {
    if (!m || typeof m !== 'object') return;
    const R = Race.active && Race.net ? Race : null, H = this.host;
    switch (m.t) {
      case 'hi': if (!H && this.st === 'joining') this.fail('A szoba gazdája másik játékverzióval játszik. Frissítsétek az oldalt mindketten.'); break;
      case 'old': if (!H) this.fail('Eltérő játékverzió. Frissítsd az oldalt, és próbáld újra.'); break;
      case 'full': if (!H && this.st === 'joining') { if (this.pub && this.tryNext) { const c = this.conn; this.tryNext(false); try { c.close(); } catch (e) {} } else this.fail('A szoba megtelt: négyen már bent vannak.'); } break;
      case 'room': {
        if (H) break; clearTimeout(this.joinT);
        this.id = +m.you; this.players = (Array.isArray(m.pl) ? m.pl : []).slice(0, NET_MAX).map(p => { const o = this.clean(p && p.me); return o && Object.assign({ id: +p.id }, o); }).filter(Boolean);
        this.setCfg(m.cfg); this.pub = !!m.pub; this.busy = !!m.busy; if (typeof m.code === 'string') this.code = m.code.replace(/[^A-Z0-9]/g, '').slice(0, 4);
        if (this.st !== 'room') { this.st = 'room'; this.tryNext = null; toast('Beléptél a szobába.', 'good'); }
        this.draw(); break;
      }
      case 'me': if (H && from) { const p = this.who(from), o = this.clean(m.me); if (p && o) { Object.assign(p, o, { raw: m.me }); this.room(); this.draw(); } } break;
      case 'cfg': if (!H) { this.setCfg(m.cfg); this.draw(); } break;
      case 'ping': if (H) this.sendTo(from, { t: 'pong', c: m.c, h: Date.now() }); break;
      case 'pong': if (!H) { const now = Date.now(), rtt = now - m.c; this.pings.push([rtt, m.h - (m.c + now) / 2]); this.pings.sort((a, b) => a[0] - b[0]); this.off = this.pings[0][1]; } break; // host clock minus ours, from the quickest round trip
      case 'start': if (!H && this.st === 'room') { this.busy = true; this.begin(WEATHER[m.wk] ? m.wk : 'clear', Array.isArray(m.ids) ? m.ids.map(Number) : []); } break;
      case 'rdy': if (H && this.rdy) { this.rdy.add(from); this.tryGo(); } break;
      case 'go': if (!H && R) this.goAt(+m.at - this.off); break;
      case 's': {
        const id = H ? from : +m.i, d = { t: 's', i: id, s: +m.s || 0, l: clamp(+m.l || 0, -6, 6), v: clamp(+m.v || 0, -20, 120), y: clamp(+m.y || 0, -1.6, 1.6), b: m.b ? 1 : 0 };
        if (H) this.relay(d, from);
        if (R) R.netPush(id, d); break;
      }
      case 'fin': { const id = H ? from : +m.i, d = m.dnf ? { t: 'fin', dnf: true, i: id } : { t: 'fin', time: +m.time || 0, i: id }; if (H) this.relay(d, from); this.onFin(id, d); break; }
      case 'bye': if (H) { const c = this.conns.get(from); try { if (c) c.close(); } catch (e) {} } else try { this.conn.close(); } catch (e) {} break;
    }
  },
  // ---- a race
  launch() {
    if (!this.host || this.players.length < 2 || this.racing) return;
    const ready = raceReadiness(car()); if (ready) { toast(ready, 'bad'); return; }
    const wk = weatherNow(), ids = this.players.map(p => p.id);
    this.racing = new Set(ids); this.rdy = new Set(); this.send({ t: 'start', wk, ids }); this.begin(wk, ids);
  },
  begin(wk, ids) {
    const me = this.id; ids = ids.filter(id => this.who(id)).sort((a, b) => a - b);
    const cfg = this.cfg, tg0 = this.trackOf(cfg), tg = cfg.track === 'wangan' ? DRAG : tougeDir(tg0, cfg.rev), zero = cfg.track === 'wangan';
    const names = {}; for (const id of ids) names[id] = this.who(id).name;
    this.board = { ids, fin: {}, names, zero, title: `${tg.name}${zero ? ' · 402 m' : ' · ' + dirName(tg)}` };
    const ready = raceReadiness(car());
    if (!ids.includes(me) || ready || Race.active || (typeof Walk !== 'undefined' && Walk.active)) {
      if (ids.includes(me)) { toast(ready || 'A futam nélküled indult el.', 'bad'); this.finMine({ dnf: true }); }
      this.draw(); return;
    }
    const lanes = NET_LANES[ids.length] || NET_LANES[4];
    const rvs = ids.filter(id => id !== me).map(id => { const o = this.who(id); return { id: 'net', nid: id, name: o.name, team: 'online', car: o.c.model, color: o.c.paint, vis: carVisual(o.c), ps: o.ps, skill: 0.5, prize: 0, rep: 0, line: '', lane: lanes[ids.indexOf(id)] }; });
    if (!rvs.length) { this.finMine({ dnf: true }); this.draw(); return; }
    this.myRdy = false; clearTimeout(this.goT); clearTimeout(this.forceT);
    const H = this.hooks = { finT: null, endAt: null, sendT: 0, wk, rvs, lane: lanes[ids.indexOf(me)], n: ids.length,
      ready: (R) => { this.myRdy = true; const b = $('#rGo'); if (b) { b.disabled = true; b.textContent = 'Várakozás a többiekre…'; } if (this.host) { clearTimeout(this.forceT); this.forceT = setTimeout(() => this.tryGo(true), 20000); } else this.send({ t: 'rdy' }); this.tryGo(); },
      quit: () => { this.finMine({ dnf: true }); this.hooks = null; },
      tick: (R, dt) => { H.sendT -= dt; if (H.sendT > 0 || R.phase === 'done') return; H.sendT = 0.08; const P = R.P, i = clamp(Math.floor(P.s), 0, R.T.N - 1); this.send({ t: 's', s: +P.s.toFixed(2), l: +P.lat.toFixed(2), v: +P.vLong.toFixed(2), y: +clamp(angDiff(P.h, R.T.h[i]), -1.6, 1.6).toFixed(3), b: P.brk > 0.1 ? 1 : 0 }); },
      finished: (R, res) => { this.finMine(R.P.s >= R.T.finish ? { time: +R.time.toFixed(3) } : { dnf: true }); },
      results: (res, t) => {
        const B = this.board, mine = B && B.fin[me], win = typeof mine === 'number' && !B.ids.some(id => id !== me && typeof B.fin[id] === 'number' && B.fin[id] < mine);
        S.stats.netRaces = (S.stats.netRaces || 0) + 1; if (win && B.ids.length > 1) S.stats.netWins = (S.stats.netWins || 0) + 1; save();
        this.hooks = null; UI.show('touge'); this.lobby();
      } };
    UI.close(); Race.start(tg, rvs[0] || null, 'net', H);
  },
  finMine(d) { const m = Object.assign({ t: 'fin' }, d); this.send(m); this.onFin(this.id, m); },
  onFin(id, m) {
    const B = this.board; if (!B || !B.ids.includes(id) || B.fin[id] != null) return;
    const tm = m.dnf ? 'dnf' : clamp(+m.time || 0, 1, 3600); B.fin[id] = tm;
    if (this.host && this.racing) { this.racing.delete(id); if (!this.racing.size) { this.racing = null; clearTimeout(this.forceT); } this.room(); }
    if (!this.host && B.ids.every(i => B.fin[i] != null)) this.busy = false;
    if (id !== this.id) {
      const H = this.hooks, R = Race.active && Race.net ? Race : null, nm = B.names[id] || 'Valaki';
      if (tm === 'dnf') { if (R) { R.netGone(id); if (R.phase === 'race') toast(`${nm} kiszállt a futamból.`); } }
      else if (H) {
        if (H.finT == null || tm < H.finT) H.finT = tm;
        if (R && R.phase === 'race' && H.endAt == null) { const left = R.zero ? 10 : 30; H.endAt = R.time + left; toast(`${nm} célba ért. Még ${left} másodperced van.`); }
      }
      if (this.host) this.tryGo();
    } else if (this.host && this.racing && tm === 'dnf') { clearTimeout(this.forceT); this.forceT = setTimeout(() => this.tryGo(true), 20000); this.tryGo(); }
    this.draw();
  },
  tryGo(force) {
    if (!this.host || !this.racing) return;
    const mine = this.racing.has(0);
    if (mine && (!this.myRdy || !Race.active || !Race.net)) return;
    if (!force && [...this.racing].some(id => id !== 0 && !this.rdy.has(id))) return;
    if (!this.rdy.size && !mine) return;
    clearTimeout(this.forceT); const at = Date.now() + 1200; this.send({ t: 'go', at }); if (mine) this.goAt(at); this.myRdy = false; this.rdy = new Set();
  },
  goAt(at) { clearTimeout(this.goT); this.goT = setTimeout(() => { if (Race.active && Race.net && Race.introEl && Race.introEl.isConnected) Race.go(); }, clamp(at - Date.now(), 0, 6000)); }
};
