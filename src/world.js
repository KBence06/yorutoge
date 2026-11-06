// ===================== WORLD: weather, run direction, police heat =====================
const WEATHER = {
  clear: { name: 'Tiszta éjszaka', short: 'Tiszta', jp: '晴', bonus: 1, fog: 1, rain: 0, wet: 0,
    desc: 'Száraz aszfalt, csillagos ég. A gumik azt adják, amit tudnak.' },
  fog: { name: 'Hegyi köd', short: 'Köd', jp: '霧', bonus: 1.15, fog: 3.4, rain: 0, wet: 0.12,
    desc: 'Leült a köd a hegyre. Ötven méterre látsz: a kanyarokat a táblákból és az itinerből kell olvasni.' },
  damp: { name: 'Nyirkos úttest', short: 'Nyirkos', jp: '湿', bonus: 1.1, fog: 1.35, rain: 0, wet: 0.5,
    desc: 'Délután esett. Foltokban még vizes az aszfalt, a fák alatt csúszik.' },
  rain: { name: 'Eső', short: 'Eső', jp: '雨', bonus: 1.3, fog: 1.8, rain: 1, wet: 1,
    desc: 'Szakad. Tócsák az íveken, a félslick gumi úszik. Aki most nyer, arról beszélnek.' }
};
// deterministic per save and day, so the forecast stays true
function weatherFor(day) {
  if (day <= 2) return 'clear';
  const x = Math.sin((day * 1.37 + (S.wseed || 7)) * 12.9898) * 43758.5453, r = x - Math.floor(x);
  return r < 0.5 ? 'clear' : r < 0.64 ? 'fog' : r < 0.8 ? 'damp' : 'rain';
}
const weatherNow = () => weatherFor(S.day);
// grip multiplier on wet road for the fitted tyre (street tyres have the deepest tread)
function tireWet(c) { const t = c.parts.tires && PART[c.parts.tires.id]; return (t && t.fx.wet) || 0.84; }
function wetGrip(c, wk) { const w = WEATHER[wk]; return 1 - (1 - tireWet(c)) * w.wet; }
function rivalWetGrip(wk) { return 1 - (1 - 0.8) * WEATHER[wk].wet; }
function weatherBadge(wk, small) {
  const w = WEATHER[wk];
  return el('span', { class: 'wx wx-' + wk + (small ? ' sm' : '') }, el('b', null, w.jp), el('span', null, small ? w.short : w.name));
}

// ---- running a pass the other way: corners reversed and mirrored, the grade flipped
function tougeDir(tg, rev) {
  if (!rev) return tg;
  return Object.assign({}, tg, { rev: true, dir: tg.dir === 'down' ? 'up' : 'down', grade: -tg.grade, segs: tg.segs.slice().reverse().map(s => s[0] === 's' ? s : ['c', s[1], -s[2]]) });
}
const trackKey = tg => tg.id + (tg.rev ? '_r' : '');
const winKey = (rv, tg) => rv.id + (tg && tg.rev ? '_r' : '');
const dirName = tg => tg.dir === 'down' ? 'völgymenet' : 'hegymenet';

// ---- police attention: racing raises it, quiet nights cool it down
function heatGain(mode, c, res) {
  if (mode === 'tofu' || mode === 'video') return 0; // the film crew has a permit, the tofu run is just a delivery
  let h = mode === 'battle' || mode === 'meet' ? 13 : mode === 'drift' ? 8 : 6;
  if (c.parts.exhaust) h += c.parts.exhaust.id === 'exhaust2' ? 4 : 2;
  if (c.parts.neon) h += 2;
  if (res === 'win' && (mode === 'battle' || mode === 'meet')) h += 2;
  return h;
}
function policeChance() {
  if (!Object.keys(S.wins || {}).length) return 0; // the first night on the mountain is always quiet
  return clamp(((S.heat || 0) - 12) / 100, 0, 0.6);
}
function heatLabel(h) { return h < 20 ? 'nyugodt' : h < 45 ? 'figyelnek' : h < 70 ? 'magas' : 'razzia'; }

// A patrol car parked in a lay-by. Once it sees you it lights up and follows; it never tries to pass.
class PoliceCar extends RivalCar {
  constructor(T, s0, lat0, skill, grip) {
    super({ id: 'police', car: 'cresta', ps: 250, skill }, T, s0, lat0, grip);
    this.state = 'parked'; this.bust = 0; this.siren = 0; this.lost = false; this.flash = 0;
  }
  update(dt, player) {
    const ds = player.s - this.s;
    if (this.state === 'parked') {
      if (ds > -75) this.state = 'alert';
      return;
    }
    this.flash += dt;
    if (this.state === 'alert' && ds > -18) this.state = 'chase';
    if (this.state === 'chase') {
      if (ds > 120) { this.state = 'lost'; this.lost = true; }
      const i = clamp(Math.floor(this.s), 0, this.T.N - 2);
      // tail the car, settle six metres behind it, stop if it stops
      const tail = ds > 0 && ds < 32;
      const want = tail ? Math.max(0, player.speed + (ds - 6) * 0.7) : ds <= 0 ? 0 : 1e9;
      this.cap = want;
      this.stepPolice(dt, player, tail);
      const near = Math.abs(ds) < 16;
      if (near) this.bust += dt * (0.07 + (player.speed < 10 ? 0.4 : 0) + (player.speed < 2.5 ? 0.9 : 0));
      else this.bust = Math.max(0, this.bust - dt * 0.18);
      this.bust = Math.min(1, this.bust);
    } else if (this.state === 'lost') {
      this.v = Math.max(0, this.v - 6 * dt); this.s += this.v * dt; this.place();
      this.bust = Math.max(0, this.bust - dt * 0.4);
    }
    this.siren = this.state === 'alert' || this.state === 'chase' ? 1 : Math.max(0, this.siren - dt * 0.4);
  }
  stepPolice(dt, player, tail) {
    const T = this.T, i = clamp(Math.floor(this.s), 0, T.N - 2);
    const target = Math.min(this.vmax[i], this.cap);
    let latT = tail ? player.lat : this.line[i];
    latT = clamp(latT, -(ROAD_HW - 0.95), ROAD_HW - 0.95);
    this.lat += clamp(latT - this.lat, -2.2 * dt, 2.2 * dt);
    const acc = Math.min(this.mu * G * 0.8, this.P / (this.mass * Math.max(this.v, 4))) - (0.5 * 1.2 * this.cd * this.v * this.v) / this.mass - G * T.slope[i];
    const dec = this.mu * G * 0.9 + G * T.slope[i];
    this.braking = false;
    if (this.v < target) this.v = Math.min(target, this.v + Math.max(0, acc) * dt);
    else { this.v = Math.max(target, this.v - dec * dt); this.braking = true; }
    this.s += this.v * dt; this.place();
    const ah = T.h[clamp(Math.floor(this.s + 4), 0, T.N - 1)];
    this.yawVis += (clamp(angDiff(ah, this.h) * 0.4, -0.3, 0.3) - this.yawVis) * Math.min(1, dt * 3);
  }
}

// ---- drifting: the aids that fight a slide are switched off, an optional helper holds the angle instead
function driftSet() {
  return Object.assign({}, S.settings, { esc: false, tcs: false, assist: false, brakeAid: false, autoGas: false, steerAid: 'off', driftAid: S.settings.driftAid !== false });
}
const fmtPts = n => Math.round(n).toLocaleString('hu-HU').replace(/,/g, ' ');
// judged per kilometre so a long pass is not worth more just for being long
const DRIFT_GRADES = [['SS', 8500], ['S', 6000], ['A', 4000], ['B', 2400], ['C', 1200], ['D', 0]];
function driftGrade(perKm) { for (const [g, v] of DRIFT_GRADES) if (perKm >= v) return g; return 'D'; }
// the date burnt into the tape: the game starts in October 1998
function tapeDate(day) { const d = new Date(1998, 9, day || 1); return d; }
