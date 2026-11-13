// ===================== ONLINE: a room for two, joined with a four-letter code =====================
// The two browsers talk to each other directly (WebRTC through PeerJS). There is no game server: each player
// drives on their own screen and sends where their car is a dozen times a second.
const NET_LIB = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
const NET_ABC = 'ABCDEFGHJKLMNPRSTUVWXYZ23456789';

// the other player's car: eased toward the last position we were told, carried forward by its speed in between
class NetCar {
  constructor(T, s0, lat0) { this.T = T; this.s = s0; this.lat = lat0; this.v = 0; this.yawVis = 0; this.braking = true; this.m = null; this.age = 0; this.x = this.y = this.z = this.h = 0; this.place(); }
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
  peer: null, conn: null, code: '', host: false, other: null, cfg: { track: 'kurozawa', rev: false }, st: 'idle', off: 0, msg: '',
  available() { return !window.claude && /^https?:$/.test(location.protocol) && !!window.RTCPeerConnection; },
  load() {
    if (window.Peer) return Promise.resolve();
    if (this._load) return this._load;
    return (this._load = new Promise((res, rej) => { const s = document.createElement('script'); s.src = NET_LIB; s.onload = () => res(); s.onerror = () => { this._load = null; rej(new Error('lib')); }; document.head.append(s); }));
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
    for (const id of Array.isArray(d.parts) ? d.parts.slice(0, 60) : []) if (PART[id]) c.parts[PART[id].slot] = { id, q: 1 };
    const L = d.look || {}; if (FINISHES[L.finish]) c.look.finish = L.finish; if (LIVERIES[L.livery]) c.look.livery = L.livery; if (hex(L.col2)) c.look.col2 = L.col2; if (hex(L.neon)) c.look.neon = L.neon; if (BANNERS.some(b => b[0] === L.banner)) c.look.banner = L.banner;
    return { name: String(d.name || 'Vendég').replace(/[<>]/g, '').slice(0, 14), c, ps: clamp(Math.round(+d.ps || 100), 30, 1500) };
  },
  // ---- lobby
  lobby() {
    const box = el('div', { class: 'netlobby' }); this.box = box;
    UI.open([UI.head('Online szoba', 'Ketten, közvetlen kapcsolattal · tét nélkül'), box]);
    this.draw();
  },
  draw() {
    const box = this.box; if (!box || !box.isConnected) return;
    const st = this.st, kids = [];
    if (this.msg) kids.push(el('div', { class: 'panel', style: 'border-color:#6b2630' }, this.msg));
    if (st === 'idle') {
      const nick = el('input', { class: 'inp', maxlength: 14, value: S.settings.nick || '', placeholder: 'Neved a hegyen', 'aria-label': 'Neved' });
      nick.addEventListener('change', () => { S.settings.nick = nick.value.trim().slice(0, 14); save(); });
      const code = el('input', { class: 'inp code', maxlength: 4, placeholder: 'KÓD', autocapitalize: 'characters', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Szobakód' });
      kids.push(el('label', { class: 'fld' }, el('span', null, 'Név'), nick),
        el('div', { class: 'netcols' },
          el('div', { class: 'panel' }, el('h3', { style: 'margin:0 0 4px' }, 'Szobát nyitok'), el('p', { class: 'muted', style: 'margin:0 0 10px' }, 'Kapsz egy négyjegyű kódot, azt küldd el a másiknak. Te választod a pályát.'), el('button', { class: 'btn primary', onclick: () => { S.settings.nick = nick.value.trim().slice(0, 14); this.open(true); } }, 'Szoba nyitása')),
          el('div', { class: 'panel' }, el('h3', { style: 'margin:0 0 4px' }, 'Csatlakozom'), el('p', { class: 'muted', style: 'margin:0 0 10px' }, 'Írd be a kódot, amit a házigazda küldött.'), el('div', { class: 'row' }, code, el('button', { class: 'btn primary', onclick: () => { S.settings.nick = nick.value.trim().slice(0, 14); const v = code.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); if (v.length !== 4) { toast('A kód négy karakter.', 'bad'); return; } this.open(false, v); } }, 'Belépés')))),
        el('p', { class: 'muted', style: 'font-size:12.5px;margin:0' }, 'Mindketten a saját autótokkal mentek. A másik autóját látod, de nem ütköztök: így egy akadozó kapcsolat nem lök le az útról. Pénz, kopás és nap nem jár érte. Néhány mobilhálózaton a közvetlen kapcsolat nem jön létre; wifin szinte mindig megy.'));
    } else if (st === 'opening' || st === 'joining') {
      kids.push(el('div', { class: 'netwait' }, st === 'opening' ? 'Szoba nyitása…' : 'Csatlakozás…'), el('div', { class: 'row', style: 'justify-content:center' }, el('button', { class: 'btn ghost', onclick: () => this.leave() }, 'Mégse')));
    } else if (st === 'waiting') {
      kids.push(el('div', { class: 'netcode' }, el('small', null, 'Szobakód'), el('b', null, this.code)), el('div', { class: 'netwait' }, 'Várakozás a másik játékosra…'),
        el('div', { class: 'row', style: 'justify-content:center' }, navigator.share ? el('button', { class: 'btn', onclick: () => navigator.share({ title: 'Yoru Tōge', text: `Gyere egy körre! Szobakód: ${this.code}`, url: location.origin + location.pathname }).catch(() => {}) }, 'Kód megosztása') : null, el('button', { class: 'btn ghost', onclick: () => this.leave() }, 'Szoba bezárása')));
    } else if (st === 'room') {
      const o = this.other, me = this.mine(), cfg = this.cfg, tg0 = cfg.track === 'wangan' ? DRAG : TOUGES.find(t => t.id === cfg.track) || TOUGES[0];
      const who = (name, model, ps, tag) => el('div', { class: 'panel netwho' }, el('div', { class: 'eyebrow' }, tag), el('b', null, name), el('span', { class: 'muted' }, `${CARS[model].name} · ${ps} LE`));
      kids.push(el('div', { class: 'netcols' }, who(me.name, me.model, me.ps, this.host ? 'Te · házigazda' : 'Te'), who(o.name, o.c.model, o.ps, this.host ? 'Vendég' : 'Házigazda')));
      if (this.host) {
        const sel = el('select', { class: 'inp', 'aria-label': 'Pálya', onchange: (e) => { cfg.track = e.target.value; if (cfg.track === 'wangan') cfg.rev = false; this.send({ t: 'cfg', cfg }); this.draw(); } },
          ...TOUGES.map(t => el('option', { value: t.id, selected: t.id === cfg.track }, `${t.name} · ${(trackLength(t) / 1000).toFixed(1)} km`)), el('option', { value: 'wangan', selected: cfg.track === 'wangan' }, `${DRAG.name} · 402 m`));
        kids.push(el('label', { class: 'fld' }, el('span', null, 'Pálya'), sel));
        if (cfg.track !== 'wangan') kids.push(el('div', { class: 'seg', role: 'group', 'aria-label': 'Irány' },
          el('button', { class: 'chip', 'aria-pressed': String(!cfg.rev), onclick: () => { cfg.rev = false; this.send({ t: 'cfg', cfg }); this.draw(); } }, tg0.dir === 'down' ? '↓ Downhill' : '↑ Hillclimb'),
          el('button', { class: 'chip', 'aria-pressed': String(cfg.rev), onclick: () => { cfg.rev = true; this.send({ t: 'cfg', cfg }); this.draw(); } }, tg0.dir === 'down' ? '↑ Hillclimb' : '↓ Downhill')));
      } else kids.push(el('div', { class: 'panel' }, el('div', { class: 'eyebrow' }, 'A házigazda választása'), el('b', null, tg0.name), el('span', { class: 'muted' }, cfg.track === 'wangan' ? ' · 402 m állórajt' : ` · ${dirName(tougeDir(tg0, cfg.rev))}`)));
      if (this.last) kids.push(el('div', { class: 'panel netres ' + (this.last.res === 'win' ? 'win' : 'lose') }, el('b', null, this.last.res === 'win' ? 'Nyertél' : 'A másik nyert'), el('span', { class: 'muted' }, this.last.txt)));
      kids.push(el('div', { class: 'row', style: 'justify-content:center' },
        this.host ? el('button', { class: 'btn primary', style: 'min-width:170px', onclick: () => this.launch() }, this.last ? 'Még egy futam' : 'Indítás') : el('span', { class: 'muted' }, 'A házigazda indítja a futamot.'),
        el('button', { class: 'btn ghost', onclick: () => this.leave() }, 'Kilépek a szobából')));
    }
    box.replaceChildren(...kids);
  },
  fail(m) { this.reset(); this.msg = m; this.draw(); },
  reset() { try { if (this.conn) this.conn.close(); } catch (e) {} try { if (this.peer) this.peer.destroy(); } catch (e) {} this.peer = this.conn = this.other = null; this.st = 'idle'; this.code = ''; this.last = null; clearTimeout(this.goT); },
  leave() { this.send({ t: 'bye' }); this.reset(); this.msg = ''; this.draw(); },
  async open(host, code) {
    this.msg = ''; this.host = host; this.st = host ? 'opening' : 'joining'; this.draw(); save();
    try { await this.load(); } catch (e) { this.fail('Nem sikerült betölteni a kapcsolatkezelőt. Van internet?'); return; }
    if (this.st !== 'opening' && this.st !== 'joining') return;
    const mk = (tries) => {
      this.code = host ? Array.from({ length: 4 }, () => NET_ABC[Math.floor(Math.random() * NET_ABC.length)]).join('') : code;
      const peer = this.peer = host ? new Peer('yorutoge-' + this.code, this.peerOpts()) : new Peer(this.peerOpts());
      peer.on('open', () => {
        if (host) { this.st = 'waiting'; this.draw(); }
        else { const conn = peer.connect('yorutoge-' + this.code, { reliable: true }); this.wire(conn); this.joinT = setTimeout(() => { if (this.st === 'joining') this.fail('Nem sikerült kapcsolódni. Jó a kód? Lehet, hogy a hálózatotok nem enged közvetlen kapcsolatot.'); }, 15000); }
      });
      peer.on('connection', (conn) => { if (this.conn) { try { conn.close(); } catch (e) {} return; } this.wire(conn); });
      peer.on('error', (e) => {
        const t = e && e.type;
        if (t === 'unavailable-id' && host && tries < 4) { try { peer.destroy(); } catch (er) {} mk(tries + 1); return; }
        if (t === 'peer-unavailable') { this.fail('Nincs ilyen szoba. Ellenőrizd a kódot.'); return; }
        if (this.st === 'room' && this.conn && this.conn.open) return; // the signalling server dropping does not end an open room
        this.fail('Kapcsolati hiba' + (t ? ` (${t})` : '') + '. Próbáld újra.');
      });
    };
    mk(0);
  },
  wire(conn) {
    this.conn = conn;
    conn.on('open', () => { clearTimeout(this.joinT); this.send({ t: 'hi', me: this.mine(), v: 10 }); if (!this.host) this.ping(); });
    conn.on('data', (m) => { try { this.recv(m); } catch (e) { console.error(e); } });
    const gone = () => { if (this.conn !== conn) return; const racing = Race.active && Race.net; this.reset(); this.msg = 'A másik játékos kilépett, vagy megszakadt a kapcsolat.'; if (racing) { toast('Megszakadt a kapcsolat.', 'bad'); Race.net.finT = null; if (Race.phase === 'race' || Race.phase === 'count') { Race.phase = 'race'; Race.finish('quit'); } else if (Race.introEl && Race.introEl.isConnected) Race.teardown(); } this.draw(); };
    conn.on('close', gone); conn.on('error', gone);
  },
  send(m) { try { if (this.conn && this.conn.open) this.conn.send(m); } catch (e) {} },
  ping() { this.pings = []; let n = 0; const go = () => { if (!this.conn || n++ >= 5) return; this.send({ t: 'ping', c: Date.now() }); setTimeout(go, 220); }; go(); },
  recv(m) {
    if (!m || typeof m !== 'object') return;
    const R = Race.active && Race.net ? Race : null;
    switch (m.t) {
      case 'hi': { const o = this.clean(m.me); if (!o) { this.fail('A másik játékos régebbi vagy újabb verzióval játszik.'); return; } this.other = o; this.st = 'room'; if (this.host) this.send({ t: 'cfg', cfg: this.cfg }); if (!$('#modal').hidden || !Race.active) this.draw(); toast(`${o.name} belépett a szobába.`, 'good'); break; }
      case 'cfg': if (!this.host && m.cfg) { const id = String(m.cfg.track); this.cfg = { track: id === 'wangan' || TOUGES.some(t => t.id === id) ? id : 'kurozawa', rev: !!m.cfg.rev }; this.draw(); } break;
      case 'ping': this.send({ t: 'pong', c: m.c, h: Date.now() }); break;
      case 'pong': { const now = Date.now(), rtt = now - m.c; this.pings.push([rtt, m.h - (m.c + now) / 2]); this.pings.sort((a, b) => a[0] - b[0]); this.off = this.pings[0][1]; break; } // host clock minus ours, from the quickest round trip
      case 'start': if (!this.host && this.other) { const wk = WEATHER[m.wk] ? m.wk : 'clear'; this.begin(wk); } break;
      case 'rdy': this.oRdy = true; this.tryGo(); break;
      case 'go': if (!this.host && R) this.goAt(+m.at - this.off); break;
      case 's': if (R && R.R && R.R.push) R.R.push({ s: clamp(+m.s || 0, 0, R.T.N), l: clamp(+m.l || 0, -6, 6), v: clamp(+m.v || 0, -20, 120), y: clamp(+m.y || 0, -1.6, 1.6), b: !!m.b }); break;
      case 'fin': if (this.hooks) { this.hooks.oFin = m.dnf ? 'dnf' : +m.time || 0; if (!m.dnf) this.hooks.finT = +m.time || 0; else if (R && R.phase === 'race') { toast(`${this.other ? this.other.name : 'A másik'} feladta.`); this.hooks.oQuit = true; } } break;
      case 'bye': try { this.conn.close(); } catch (e) {} break;
    }
  },
  // ---- a race
  launch() { if (!this.host || !this.other) return; const wk = weatherNow(); this.send({ t: 'start', wk }); this.begin(wk); },
  begin(wk) {
    const ready = raceReadiness(car()); if (ready) { toast(ready, 'bad'); this.send({ t: 'fin', dnf: true }); return; }
    const o = this.other, cfg = this.cfg, tg = cfg.track === 'wangan' ? DRAG : tougeDir(TOUGES.find(t => t.id === cfg.track) || TOUGES[0], cfg.rev);
    const rv = { id: 'net', name: o.name, team: 'online', car: o.c.model, color: o.c.paint, vis: carVisual(o.c), ps: o.ps, skill: 0.5, prize: 0, rep: 0, line: '' };
    this.oRdy = false; this.myRdy = false; clearTimeout(this.goT);
    const H = this.hooks = { finT: null, oFin: null, sendT: 0, wk,
      ready: (R) => { this.myRdy = true; const b = $('#rGo'); if (b) { b.disabled = true; b.textContent = 'Várakozás a másikra…'; } this.send({ t: 'rdy' }); this.tryGo(); },
      quit: () => { this.send({ t: 'fin', dnf: true }); },
      tick: (R, dt) => { H.sendT -= dt; if (H.sendT > 0 || R.phase === 'done') return; H.sendT = 0.08; const P = R.P, i = clamp(Math.floor(P.s), 0, R.T.N - 1); this.send({ t: 's', s: +P.s.toFixed(2), l: +P.lat.toFixed(2), v: +P.vLong.toFixed(2), y: +clamp(angDiff(P.h, R.T.h[i]), -1.6, 1.6).toFixed(3), b: P.brk > 0.1 ? 1 : 0 }); },
      finished: (R, res) => { const done = R.P.s >= R.T.finish; this.send(done ? { t: 'fin', time: +R.time.toFixed(3) } : { t: 'fin', dnf: true }); },
      results: (res, t) => {
        const of = H.oFin;
        const win = res === 'win' || (H.oQuit && res !== 'quit' && res !== 'forfeit');
        const zero = cfg.track === 'wangan', f = (x) => zero ? x.toFixed(2) + ' s' : fmtTime(x);
        this.last = { res: win ? 'win' : 'lose', txt: res === 'quit' || res === 'forfeit' ? 'Feladtad a futamot.' : ['blown', 'wreck'].includes(res) ? 'Az autód nem bírta.' : `${tg.name}${zero ? '' : ' · ' + dirName(tg)} · ${res === 'win' ? 'te: ' + f(t) : typeof of === 'number' && of ? o.name + ': ' + f(of) : ''}` };
        S.stats.netRaces = (S.stats.netRaces || 0) + 1; if (win) S.stats.netWins = (S.stats.netWins || 0) + 1; save();
        this.hooks = null; UI.show('touge'); this.lobby();
      } };
    UI.close(); Race.start(tg, rv, 'net', H);
  },
  tryGo() { if (this.host && this.myRdy && this.oRdy && Race.active) { const at = Date.now() + 1200; this.send({ t: 'go', at }); this.goAt(at); this.myRdy = this.oRdy = false; } },
  goAt(at) { clearTimeout(this.goT); this.goT = setTimeout(() => { if (Race.active && Race.net && Race.introEl && Race.introEl.isConnected) Race.go(); }, clamp(at - Date.now(), 0, 6000)); }
};
