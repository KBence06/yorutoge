// ===================== WORKSHOP: step-by-step installs =====================
// Each part goes in through a short procedure: lift or open up, remove the old part, swap,
// torque it down, then whatever the part needs (bleeding, flashing, squeegeeing).
const LOC = { intake: 'bay', header: 'bay', cam: 'bay', turbo: 'bay', ic: 'bay', inj: 'bay', boost: 'bay', strut: 'bay', camber: 'bay',
  exhaust: 'under', flywheel: 'under', clutch: 'under', lsd: 'under', final: 'under', arb: 'under',
  susp: 'wheel', pads: 'wheel', brakes: 'wheel', tires: 'wheel', wheels: 'wheel',
  ecu: 'cabin', pump: 'cabin', hbrake: 'cabin', cage: 'cabin', seat: 'cabin', interior: 'cabin', hood: 'out', wing: 'out', kit: 'out', decal: 'out',
  flares: 'out', lights: 'bay', tail: 'out', tint: 'cabin', banner: 'out', neon: 'under' };
const ADDITIVE = new Set(['wing', 'kit', 'cage', 'strut', 'decal', 'boost', 'flares', 'tint', 'banner', 'neon']);

const ArtCache = {
  m: new Map(),
  get(p, grey) {
    const k = p.id + (grey ? ':g' : ''); if (this.m.has(k)) return this.m.get(k);
    const cv = document.createElement('canvas'); cv.width = cv.height = 320; const g = cv.getContext('2d');
    if (grey) g.filter = 'grayscale(1) brightness(0.72) contrast(1.15)';
    partArt(g, p, 320, 320, { bare: true }); this.m.set(k, cv); return cv;
  }
};
const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
function sceneBg(ctx, W, H, floor = 0.66) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#1b1e26'); g.addColorStop(floor - 0.005, '#262931'); g.addColorStop(floor, '#3b3a37'); g.addColorStop(1, '#1d1c1a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2;
  for (let y = 40; y < H * floor; y += 52) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  const r = ctx.createRadialGradient(W / 2, H * 0.3, 10, W / 2, H * 0.3, W * 0.75);
  r.addColorStop(0, 'rgba(255,225,180,0.14)'); r.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
}
function hexBolt(ctx, x, y, r, rot, ring) {
  if (ring) { ctx.fillStyle = ring; ctx.beginPath(); ctx.arc(x, y, r * 1.35, 0, 7); ctx.fill(); }
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0);
  ctx.fillStyle = '#c9ccd2'; ctx.beginPath();
  for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + 0.3; k ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-r * 0.6, -r * 0.7, r * 0.5, r * 0.25);
  ctx.fillStyle = '#7d828c'; ctx.beginPath(); ctx.arc(0, 0, r * 0.45, 0, 7); ctx.fill(); ctx.restore();
}
function tapHint(ctx, x, y, t, label) {
  const p = 0.5 + 0.5 * Math.sin(t * 5);
  ctx.strokeStyle = `rgba(78,230,212,${0.35 + 0.5 * p})`; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, y, 30 + p * 14, 0, 7); ctx.stroke();
  if (label) { ctx.fillStyle = '#4ee6d4'; ctx.font = `800 30px ${cssVar('--f-disp')}`; ctx.textAlign = 'center'; ctx.fillText(label, x, y - 56); }
}
function partFace(ctx, c, p, cx, cy, R, grey) { // what you look at when you put a wrench on it
  if (p.slot === 'tires' || p.slot === 'wheels') {
    const style = p.slot === 'wheels' && !grey ? p.fx.wheel : carVisual(c).wheel;
    drawWheel(ctx, cx, cy, R * 1.5, style); return;
  }
  ctx.fillStyle = grey ? '#3a3d44' : '#4a4e57'; ctx.beginPath(); ctx.arc(cx, cy, R * 1.12, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, R * 1.0, 0, 7); ctx.stroke();
  const a = ArtCache.get(p, grey); ctx.drawImage(a, cx - R * 0.9, cy - R * 0.9, R * 1.8, R * 1.8);
}

// ---------------------------------------------------------------- steps
function jackStep(c, focus, lowering) {
  const pumps = 6;
  return {
    name: lowering ? 'Leengedés' : 'Emelés', auto: true, lift: lowering ? 1 : 0, anim: 0, n: 0, queue: 0, holding: false, done: false, bounce: 0, t: 0,
    manual: lowering ? ['Ellenőrizd, hogy nem maradt-e szerszám a kocsi alatt.', 'Koppints a képre: nyílik a szelep, és az autó lassan leereszkedik.'] : ['Az emelőt a küszöb alatti, megerősített emelési ponthoz tedd.', `Koppints a pumpáláshoz, ${pumps} löket kell.`],
    status() { return lowering ? (this.done ? 'Négy keréken áll.' : this.holding ? 'Ereszkedik…' : 'Koppints a szelep nyitásához.') : (this.done ? 'Fent van, bak alatta. Mehet a munka.' : `Pumpálás: ${this.n} / ${pumps}`); },
    down() { if (this.done) return; if (lowering) { this.holding = true; Audio2.burst(1400, 0.5, 0.6, 0.04); } else if (this.anim <= 0) { this.anim = 1; Audio2.burst(160, 1, 0.2, 0.22, 'lowpass'); } else if (this.n + 1 + this.queue < pumps) this.queue++; },
    up() { },
    draw(ctx, W, H, dt) {
      this.t += dt;
      if (!lowering && this.anim > 0) { this.anim -= dt / 0.4; if (this.anim <= 0) { this.anim = 0; this.n++; if (this.n >= pumps) this.done = true; else if (this.queue > 0) { this.queue--; this.anim = 1; Audio2.burst(160, 1, 0.2, 0.22, 'lowpass'); } } }
      if (lowering && this.holding && !this.done) { this.lift = Math.max(0, this.lift - dt * 0.5); if (this.lift === 0) { this.done = true; this.bounce = 1; Audio2.clunk(); } }
      if (this.bounce > 0) this.bounce = Math.max(0, this.bounce - dt * 1.8);
      const lift = lowering ? this.lift : (this.n + (this.anim > 0 ? ease(1 - this.anim) : 0)) / pumps;
      sceneBg(ctx, W, H, 0.72);
      const sh = carShape(c.model, carVisual(c).lower), len = W * 1.5, k = len / sh.L;
      const fz = focus === 'wheel' ? sh.wheels.zf : -0.2;
      const cx = W * 0.5 - fz * k, gy = H * 0.78, up = lift * H * 0.075 + Math.sin(this.bounce * 16) * this.bounce * 8;
      ctx.save(); ctx.translate(0, -up); drawCarSide(ctx, c, cx, gy, len); ctx.restore();
      // floor jack
      const sill = Math.min(sh.up[0][1], sh.up[sh.up.length - 1][1]);
      const jz = focus === 'wheel' ? sh.wheels.zf - sh.wheels.ra - 0.22 : 0.3, jx = cx + jz * k, saddle = gy - sill * k - up + 4;
      const px = jx - 120, py = gy - 26;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#9a0f18'; ctx.lineWidth = 22; ctx.beginPath(); ctx.moveTo(px + 40, py); ctx.lineTo(jx, saddle + 10); ctx.stroke();
      ctx.fillStyle = '#c3121f'; ctx.beginPath(); ctx.moveTo(px - 70, gy - 6); ctx.lineTo(jx + 40, gy - 6); ctx.lineTo(jx + 20, gy - 34); ctx.lineTo(px - 50, gy - 40); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#111'; for (const wx of [px - 50, jx + 24]) { ctx.beginPath(); ctx.arc(wx, gy - 6, 11, 0, 7); ctx.fill(); }
      ctx.fillStyle = '#2a2b30'; ctx.fillRect(jx - 26, saddle, 52, 12);
      const pump = !lowering && this.anim > 0 ? Math.sin(Math.PI * (1 - this.anim)) : 0;
      const ha = -2.35 + pump * 0.55, hl = 240;
      ctx.strokeStyle = '#9da2aa'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(px - 40, py - 6); ctx.lineTo(px - 40 + Math.cos(ha) * hl, py - 6 + Math.sin(ha) * hl); ctx.stroke();
      ctx.strokeStyle = '#151518'; ctx.lineWidth = 18; ctx.beginPath(); ctx.moveTo(px - 40 + Math.cos(ha) * (hl - 40), py - 6 + Math.sin(ha) * (hl - 40)); ctx.lineTo(px - 40 + Math.cos(ha) * hl, py - 6 + Math.sin(ha) * hl); ctx.stroke();
      ctx.lineCap = 'butt';
      if (!this.done && !this.holding) tapHint(ctx, lowering ? px - 40 : px - 40 + Math.cos(ha) * hl, lowering ? py - 6 : py - 6 + Math.sin(ha) * hl, this.t, lowering ? 'SZELEP' : 'PUMPÁLD');
    }
  };
}

function hoodStep(c) {
  return {
    name: 'Motorháztető', auto: true, ang: 0, drag: null, done: false,
    manual: ['Nyisd fel a motorháztetőt, és támaszd ki.', 'Húzd felfelé az ujjad a képen.'],
    status() { return this.done ? 'Nyitva, a kitámasztó a helyén.' : 'Húzd felfelé a motorháztetőt.'; },
    down(x, y) { if (!this.done) this.drag = { y, a: this.ang }; },
    move(x, y) { if (this.drag && !this.done) this.ang = clamp(this.drag.a + (this.drag.y - y) / 240, 0, 1.15); },
    up() { if (!this.drag) return; this.drag = null; if (this.ang > 0.7) { this.ang = 1.02; this.done = true; Audio2.clunk(); } },
    draw(ctx, W, H, dt) {
      if (!this.drag && !this.done && this.ang > 0) this.ang = Math.max(0, this.ang - dt * 2);
      sceneBg(ctx, W, H, 0.74);
      const v = carVisual(c), sh = carShape(c.model, v.lower), len = W * 1.75, k = len / sh.L;
      const cx = W * 0.42 - (sh.cowlZ + sh.L / 2) / 2 * k, gy = H * 0.84, X = z => cx + z * k, Y = y => gy - y * k;
      drawCarSide(ctx, c, cx, gy, len);
      const hp = sh.up.filter(p => p[0] >= sh.cowlZ - 0.02 && p[1] >= sh.beltY - 0.16).sort((a, b) => a[0] - b[0]);
      if (hp.length < 2) { this.done = true; return; }
      const h0 = hp[0], f0 = hp[hp.length - 1];
      if (this.ang > 0.01) {
        ctx.save(); ctx.beginPath(); hp.forEach((p, i) => i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1])));
        ctx.lineTo(X(f0[0]), Y(f0[1] - 0.2)); ctx.lineTo(X(h0[0]), Y(h0[1] - 0.2)); ctx.closePath();
        ctx.fillStyle = '#08090c'; ctx.fill(); ctx.clip();
        const bx = X(h0[0] + 0.15), bw = X(f0[0] - 0.12) - bx, by = Y(h0[1] - 0.02);
        ctx.fillStyle = '#b3141e'; ctx.fillRect(bx + bw * 0.1, by + 6, bw * 0.45, 26);
        ctx.fillStyle = '#c9ccd2'; ctx.fillRect(bx + bw * 0.62, by + 2, bw * 0.3, 14);
        ctx.fillStyle = '#e8c21b'; ctx.beginPath(); ctx.arc(bx + bw * 0.3, by + 4, 7, 0, 7); ctx.fill();
        ctx.restore();
      }
      ctx.save(); ctx.translate(X(h0[0]), Y(h0[1])); ctx.rotate(-this.ang);
      ctx.beginPath(); hp.forEach((p, i) => i ? ctx.lineTo(X(p[0]) - X(h0[0]), Y(p[1]) - Y(h0[1])) : ctx.moveTo(0, 0));
      for (let i = hp.length - 1; i >= 0; i--) ctx.lineTo(X(hp[i][0]) - X(h0[0]), Y(hp[i][1]) - Y(h0[1]) + 0.03 * k);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, -40, 0, 20); g.addColorStop(0, shade(c.paint, 0.35)); g.addColorStop(1, shade(c.paint, -0.3));
      ctx.fillStyle = v.hood === 'carbon' ? '#18191d' : g; ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
      if (this.ang > 0.55) {
        const L = (f0[0] - h0[0]) * k * 0.75, ex = X(h0[0]) + Math.cos(-this.ang) * L, ey = Y(h0[1]) + Math.sin(-this.ang) * L;
        ctx.strokeStyle = '#9da2aa'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(X(f0[0] - 0.2), Y(f0[1] - 0.05)); ctx.lineTo(ex, ey + 4); ctx.stroke();
      }
      if (!this.done && !this.drag) tapHint(ctx, X((h0[0] + f0[0]) / 2), Y(f0[1]) - 40, performance.now() / 1000, '▲ HÚZD');
    }
  };
}

function unboltStep(c, p, n, oldP) {
  const bolts = Array.from({ length: n }, () => ({ a: 0, gone: false }));
  return {
    name: p.slot === 'tires' || p.slot === 'wheels' ? 'Kerékanyák' : 'Kiszerelés', auto: true, done: false, bolts, t: 0,
    manual: [`${n} csavar tartja a ${oldP ? 'régi alkatrészt' : 'gyári alkatrészt'}.`, 'Koppints mindegyikre, a dugókulcs kitekeri.'],
    status() { const g = bolts.filter(b => b.gone).length; return this.done ? 'Minden csavar a tálcán.' : `Kitekerve: ${g} / ${n}`; },
    geom(W, H) { const R = W * (n > 5 ? 0.25 : 0.21); return { cx: W / 2, cy: H * 0.4, R, br: R * 0.74 }; },
    pos(i, W, H) { const g = this.geom(W, H), a = -Math.PI / 2 + i * Math.PI * 2 / n; return [g.cx + Math.cos(a) * g.br, g.cy + Math.sin(a) * g.br]; },
    down(x, y, W, H) {
      let best = -1, bd = 1e9; bolts.forEach((b, i) => { if (b.a || b.gone) return; const [bx, by] = this.pos(i, W, H), d = Math.hypot(x - bx, y - by); if (d < bd) { bd = d; best = i; } });
      if (best >= 0 && bd < W * 0.09) { bolts[best].a = 0.0001; Audio2.burst(4200, 6, 0.35, 0.06); }
    },
    draw(ctx, W, H, dt) {
      this.t += dt; ctx.clearRect(0, 0, W, H);
      const g = this.geom(W, H);
      partFace(ctx, c, oldP || p, g.cx, g.cy, g.R, !oldP);
      const trayY = H * 0.86, got = bolts.filter(b => b.gone).length;
      ctx.fillStyle = '#2b2d33'; ctx.beginPath(); ctx.ellipse(W / 2, trayY, W * 0.3, 34, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#16171b'; ctx.beginPath(); ctx.ellipse(W / 2, trayY - 4, W * 0.27, 24, 0, 0, 7); ctx.fill();
      for (let i = 0; i < got; i++) hexBolt(ctx, W / 2 - (got - 1) * 18 + i * 36, trayY - 6, 12, i);
      bolts.forEach((b, i) => {
        if (b.gone) return;
        const [bx, by] = this.pos(i, W, H), r = W * (n > 6 ? 0.034 : 0.045);
        if (b.a > 0) {
          b.a += dt / 0.75;
          if (b.a < 0.45) { // socket on, turning
            const turn = b.a / 0.45 * Math.PI * 3;
            hexBolt(ctx, bx, by, r, -turn);
            ctx.strokeStyle = '#aab0bb'; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(bx, by, r * 1.5, 0, 7); ctx.stroke();
            ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(-turn - 1) * W * 0.26, by + Math.sin(-turn - 1) * W * 0.26); ctx.stroke(); ctx.lineCap = 'butt';
          } else {
            const k2 = (b.a - 0.45) / 0.55, tx = W / 2 + got * 18, ty = trayY - 6;
            hexBolt(ctx, lerp(bx, tx, ease(Math.min(1, k2))), lerp(by, ty, ease(Math.min(1, k2))) - Math.sin(Math.min(1, k2) * Math.PI) * 60, r * (1 + Math.sin(Math.min(1, k2) * Math.PI) * 0.5), k2 * 6);
          }
          if (b.a >= 1) { b.gone = true; Audio2.click(); if (bolts.every(q => q.gone)) this.done = true; }
        } else { hexBolt(ctx, bx, by, r, 0, '#555b66'); }
      });
      const next = bolts.findIndex(b => !b.a && !b.gone);
      if (next >= 0 && bolts.every(b => !b.a || b.gone) && got === 0) { const [bx, by] = this.pos(next, W, H); tapHint(ctx, bx, by, this.t); }
    }
  };
}

function swapStep(c, p, oldP, opts) {
  const noNew = opts && opts.noNew, stockAsOld = !oldP && !(opts && opts.noOld);
  const st = {
    name: noNew ? 'Kipakolás' : 'Csere', auto: true, done: false, phase: (oldP || stockAsOld) ? 'out' : 'in', drag: null, t: 0,
    old: null, nw: null, snap: 0,
    manual: noNew ? ['Vidd ki a kiszerelt darabokat a raktárba.', 'Húzd a bal alsó ládába.'] : [(oldP || stockAsOld) ? 'Húzd a régi alkatrészt a bal oldali ládába.' : 'A helye üres, mehet az új.', 'Utána húzd az újat a dobozból a szaggatott helyre.'],
    status() { return this.done ? (noNew ? 'Kipakolva. Könnyebb lett a kocsi.' : 'A helyén van.') : this.phase === 'out' ? 'Húzd a régi alkatrészt a ládába.' : 'Húzd az újat a helyére.'; },
    spots(W, H) { return { T: [W / 2, H * 0.36], B: [W * 0.2, H * 0.8], X: [W * 0.8, H * 0.8] }; },
    down(x, y, W, H) {
      const s = this.spots(W, H);
      if (this.phase === 'out' && Math.hypot(x - this.old.x, y - this.old.y) < W * 0.22) this.drag = { o: 'old', dx: this.old.x - x, dy: this.old.y - y };
      else if (this.phase === 'in' && Math.hypot(x - this.nw.x, y - this.nw.y) < W * 0.2) this.drag = { o: 'nw', dx: this.nw.x - x, dy: this.nw.y - y };
      void s;
    },
    move(x, y) { if (!this.drag) return; const o = this[this.drag.o]; o.x = x + this.drag.dx; o.y = y + this.drag.dy; },
    up(x, y, W, H) {
      if (!this.drag) return; const s = this.spots(W, H), which = this.drag.o; this.drag = null;
      if (which === 'old') {
        if (Math.hypot(this.old.x - s.B[0], this.old.y - s.B[1]) < W * 0.24) { this.old.fly = 0.0001; Audio2.clunk(); }
        else { this.old.back = 1; }
      } else {
        if (Math.hypot(this.nw.x - s.T[0], this.nw.y - s.T[1]) < W * 0.16) { this.nw.fly = 0.0001; }
        else this.nw.back = 1;
      }
    },
    draw(ctx, W, H, dt) {
      this.t += dt; const s = this.spots(W, H);
      if (!this.old) { this.old = { x: s.T[0], y: s.T[1], sc: 1 }; this.nw = { x: s.X[0], y: s.X[1] - 20, sc: 0.6 }; }
      sceneBg(ctx, W, H, 0.62);
      // workbench top
      ctx.fillStyle = '#4a3a2a'; ctx.fillRect(0, H * 0.62, W, 16); ctx.fillStyle = '#2b2118'; ctx.fillRect(0, H * 0.62 + 16, W, 6);
      // target outline
      if (!noNew) { ctx.setLineDash([14, 10]); ctx.strokeStyle = this.phase === 'in' ? '#4ee6d4' : 'rgba(255,255,255,0.18)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(s.T[0], s.T[1], W * 0.19, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
      // crate for the old part
      const bx = s.B[0], by = s.B[1];
      ctx.fillStyle = '#5a4a36'; ctx.fillRect(bx - 110, by - 50, 220, 110); ctx.fillStyle = '#3e3224'; for (let i = 0; i < 3; i++) ctx.fillRect(bx - 110, by - 44 + i * 36, 220, 6);
      ctx.fillStyle = '#e9e2cf'; ctx.font = `800 22px ${cssVar('--f-disp')}`; ctx.textAlign = 'center'; ctx.fillText(noNew ? 'RAKTÁR' : 'RÉGI ALKATRÉSZ', bx, by + 82);
      // shipping box for the new part
      if (!noNew) {
        const xx = s.X[0], xy = s.X[1];
        ctx.fillStyle = '#b8894f'; ctx.fillRect(xx - 105, xy - 40, 210, 100);
        ctx.fillStyle = '#9c7240'; ctx.beginPath(); ctx.moveTo(xx - 105, xy - 40); ctx.lineTo(xx - 135, xy - 85); ctx.lineTo(xx - 30, xy - 80); ctx.lineTo(xx, xy - 40); ctx.fill();
        ctx.beginPath(); ctx.moveTo(xx + 105, xy - 40); ctx.lineTo(xx + 135, xy - 85); ctx.lineTo(xx + 30, xy - 80); ctx.lineTo(xx, xy - 40); ctx.fill();
        ctx.fillStyle = '#1b1b1f'; ctx.font = `800 20px ${cssVar('--f-disp')}`; ctx.fillText(p.brand.toUpperCase(), xx, xy + 34);
      }
      // parts
      const size = W * 0.36;
      const moveBack = (o, tx, ty) => { if (o.back) { o.back = Math.max(0, o.back - dt * 4); o.x = lerp(tx, o.x, o.back); o.y = lerp(ty, o.y, o.back); } };
      if (this.phase === 'out' || (this.old.fly && this.old.fly < 1)) {
        moveBack(this.old, s.T[0], s.T[1]);
        if (this.old.fly) { this.old.fly += dt / 0.35; const e = ease(Math.min(1, this.old.fly)); this.old.x = lerp(this.old.x, s.B[0], e); this.old.y = lerp(this.old.y, s.B[1] - 20, e); this.old.sc = 1 - 0.5 * e; if (this.old.fly >= 1) { this.phase = noNew ? 'done' : 'in'; if (noNew) this.done = true; } }
        const art = oldP ? ArtCache.get(oldP) : ArtCache.get(p, true), sz = size * (this.old.sc || 1);
        ctx.drawImage(art, this.old.x - sz / 2, this.old.y - sz / 2, sz, sz);
        if (!oldP && !noNew) { ctx.fillStyle = '#e9e2cf'; ctx.font = `800 20px ${cssVar('--f-disp')}`; ctx.fillText('GYÁRI', this.old.x, this.old.y + sz / 2 + 6); }
        if (this.phase === 'out' && !this.drag && !this.old.fly) { ctx.strokeStyle = 'rgba(78,230,212,0.7)'; ctx.setLineDash([8, 8]); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(this.old.x - 60, this.old.y + 70); ctx.quadraticCurveTo(this.old.x - 140, this.old.y + 120, s.B[0] + 40, s.B[1] - 70); ctx.stroke(); ctx.setLineDash([]); tapHint(ctx, this.old.x, this.old.y, this.t); }
      }
      if (!noNew) {
        if (this.phase === 'in') {
          moveBack(this.nw, s.X[0], s.X[1] - 20);
          if (this.drag && this.drag.o === 'nw') this.nw.sc = Math.min(1.05, this.nw.sc + dt * 3);
          if (this.nw.fly) { this.nw.fly += dt / 0.25; const e = ease(Math.min(1, this.nw.fly)); this.nw.x = lerp(this.nw.x, s.T[0], e); this.nw.y = lerp(this.nw.y, s.T[1], e); this.nw.sc = lerp(this.nw.sc, 1.05, e); if (this.nw.fly >= 1) { this.done = true; this.snap = 1; Audio2.clunk(); this.phase = 'done'; } }
          if (!this.drag && !this.nw.fly && !this.nw.back) { this.nw.sc = 0.6 + 0.04 * Math.sin(this.t * 4); }
        }
        if (this.snap > 0) this.snap = Math.max(0, this.snap - dt * 2);
        const sz = size * this.nw.sc * (1 + this.snap * 0.08);
        ctx.drawImage(ArtCache.get(p), this.nw.x - sz / 2, this.nw.y - sz / 2, sz, sz);
        if (this.snap > 0) { ctx.strokeStyle = `rgba(143,227,107,${this.snap})`; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(s.T[0], s.T[1], W * 0.19 + (1 - this.snap) * 40, 0, 7); ctx.stroke(); }
        if (this.phase === 'in' && !this.drag && !this.nw.fly) tapHint(ctx, this.nw.x, this.nw.y - 10, this.t);
      }
    }
  };
  return st;
}

function compressStep() {
  return {
    name: 'Rugóösszehúzó', auto: true, done: false, c: 0, holding: false, msg: '', factor: 1, flash: 0, t: 0,
    manual: ['Fogd be a rugót a rugóösszehúzóba.', 'Tartsd nyomva: a menetes szárak összehúzzák. Engedd el a zöld sávban, akkor jön le a felső tartó.', 'Túl sok: összeér a menet, és a rugó megsérül.'],
    status() { return this.done ? 'Kijött a rugóstag, a rugó biztonságban.' : this.msg || 'Tartsd nyomva az összehúzáshoz.'; },
    down() { if (!this.done) { this.holding = true; this.h0 = performance.now(); this.c0 = this.c; Audio2.ratchet(true); } },
    up() {
      if (!this.holding) return; this.holding = false; Audio2.ratchet(false);
      this.c = Math.min(1, this.c0 + (performance.now() - this.h0) / 1000 * 0.32);
      if (this.c >= 0.55 && this.c <= 0.8) { this.done = true; Audio2.clunk(); }
      else if (this.c < 0.55) this.msg = 'Még feszül, nem jön le a tányér. Húzd tovább.';
    },
    draw(ctx, W, H, dt) {
      this.t += dt;
      if (this.holding && !this.done) {
        this.c = Math.min(1, this.c0 + (performance.now() - this.h0) / 1000 * 0.32);
        if (this.c > 0.92) { this.holding = false; Audio2.ratchet(false); Audio2.burst(3000, 3, 0.4, 0.2); this.flash = 1; this.factor = 0.86; this.c = 0.7; this.msg = 'Összeért a menet, a rugó megsérült. A zöldben engedd el.'; }
      }
      if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 2);
      sceneBg(ctx, W, H, 0.9);
      const cx = W / 2, top = H * 0.12, bot = H * 0.82, L0 = bot - top - 120, L = L0 * (1 - 0.42 * this.c);
      const sTop = bot - 60 - L;
      ctx.fillStyle = '#c9ccd2'; ctx.fillRect(cx - 14, top + 20, 28, bot - top - 40);
      ctx.fillStyle = '#c3121f'; ctx.fillRect(cx - 34, bot - 150, 68, 130);
      ctx.fillStyle = '#3a3d44'; ctx.fillRect(cx - 90, bot - 70, 180, 16); ctx.fillRect(cx - 90, sTop - 18, 180, 16);
      ctx.strokeStyle = this.flash > 0 ? '#ff3d4f' : '#ffd400'; ctx.lineWidth = 16; ctx.beginPath();
      const turns = 7; for (let i = 0; i <= turns * 24; i++) { const t = i / (turns * 24), y = bot - 70 - t * (bot - 70 - sTop), x = cx + Math.sin(t * turns * Math.PI * 2) * 78; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
      for (const s of [-1, 1]) {
        const rx = cx + s * 120; ctx.fillStyle = '#9da2aa'; ctx.fillRect(rx - 6, sTop - 40, 12, bot - sTop - 10);
        ctx.fillStyle = '#2a2b30'; ctx.fillRect(rx - 26, bot - 92, 52, 18); ctx.fillRect(rx - 26, sTop + 18 + (bot - 70 - sTop) * 0.62, 52, 18);
        ctx.strokeStyle = '#2a2b30'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(rx - s * 24, bot - 83); ctx.lineTo(cx + s * 80, bot - 83); ctx.stroke();
      }
      ctx.fillStyle = '#2a2b30'; ctx.fillRect(cx - 60, top, 120, 26);
      const gx = W * 0.08, gw = 30, gh = H * 0.6, gy = H * 0.18;
      ctx.fillStyle = '#16171b'; ctx.fillRect(gx, gy, gw, gh);
      ctx.fillStyle = 'rgba(143,227,107,0.55)'; ctx.fillRect(gx, gy + gh * (1 - 0.8), gw, gh * 0.25);
      ctx.fillStyle = 'rgba(255,61,79,0.55)'; ctx.fillRect(gx, gy, gw, gh * 0.08);
      ctx.fillStyle = '#ffa733'; ctx.fillRect(gx - 6, gy + gh * (1 - this.c) - 3, gw + 12, 6);
      if (!this.done && !this.holding) tapHint(ctx, cx, H * 0.45, this.t, 'TARTSD');
    }
  };
}

function plugStep(c) {
  return {
    name: 'Csatlakozó', auto: true, done: false, x: 0, y: 0, drag: null, init: false, t: 0, lit: 0,
    manual: ['A kábelköteg csatlakozója a régi ECU-ból kihúzva lóg.', 'Húzd a dugót az új ECU aljzatába, amíg kattan.'],
    status() { return this.done ? 'Kattant. Az ECU zöld LED-je ég.' : 'Húzd a csatlakozót az aljzatba.'; },
    sock(W, H) { return [W * 0.66, H * 0.62]; },
    down(x, y) { if (!this.done && Math.hypot(x - this.x, y - this.y) < 110) this.drag = { dx: this.x - x, dy: this.y - y }; },
    move(x, y) { if (this.drag) { this.x = x + this.drag.dx; this.y = y + this.drag.dy; } },
    up(x, y, W, H) { if (!this.drag) return; this.drag = null; const [sx, sy] = this.sock(W, H); if (Math.hypot(this.x - sx, this.y - sy) < 70) { this.x = sx; this.y = sy; this.done = true; this.lit = 1; Audio2.click(); Audio2.clunk(); } },
    draw(ctx, W, H, dt) {
      this.t += dt; if (!this.init) { this.x = W * 0.22; this.y = H * 0.72; this.init = true; }
      sceneBg(ctx, W, H, 0.9);
      const [sx, sy] = this.sock(W, H);
      ctx.drawImage(ArtCache.get(PART.ecu1), W * 0.36, H * 0.12, W * 0.6, W * 0.6);
      ctx.fillStyle = '#0c0c0e'; ctx.fillRect(sx - 52, sy - 22, 104, 44);
      ctx.fillStyle = '#c9a43a'; for (let i = 0; i < 8; i++) ctx.fillRect(sx - 44 + i * 11, sy - 6, 6, 12);
      ctx.strokeStyle = '#26272b'; ctx.lineWidth = 26; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-20, H * 0.25); ctx.bezierCurveTo(W * 0.15, H * 0.3, this.x - 140, this.y - 40, this.x - 50, this.y); ctx.stroke();
      const wires = ['#c3121f', '#e8c21b', '#1d4fa3', '#2b8a3e', '#eee'];
      wires.forEach((col, i) => { ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-20, H * 0.25 - 8 + i * 4); ctx.bezierCurveTo(W * 0.15, H * 0.3 - 8 + i * 4, this.x - 140, this.y - 48 + i * 4, this.x - 52, this.y - 8 + i * 4); ctx.stroke(); });
      ctx.lineCap = 'butt';
      ctx.fillStyle = '#1b1c20'; ctx.fillRect(this.x - 56, this.y - 26, 112, 52); ctx.fillStyle = '#3a3c42'; ctx.fillRect(this.x - 50, this.y - 20, 100, 10);
      if (this.lit) { ctx.fillStyle = '#7dff9a'; ctx.shadowColor = '#7dff9a'; ctx.shadowBlur = 20; ctx.beginPath(); ctx.arc(W * 0.47, H * 0.5, 8, 0, 7); ctx.fill(); ctx.shadowBlur = 0; }
      if (!this.done && !this.drag) { ctx.strokeStyle = 'rgba(78,230,212,0.7)'; ctx.setLineDash([8, 8]); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(this.x + 60, this.y); ctx.lineTo(sx - 60, sy); ctx.stroke(); ctx.setLineDash([]); tapHint(ctx, this.x, this.y, this.t); }
    }
  };
}

function flashStep(c) {
  const lines = ['F-MAP LOADER v2.1', 'PORT: COM1 9600 baud ... OK', `JÁRMŰ: ${CARS[c.model].name.toUpperCase()}`, 'ALAPTÉRKÉP KIVÁLASZTVA', 'SZEKTOR 00-3F TÖRLÉSE', 'ÍRÁS', 'ELLENŐRZŐ ÖSSZEG', 'KÉSZ. A GYÚJTÁST LEVEHETED.'];
  return {
    name: 'Feltöltés', auto: true, done: false, k: -1, t: 0,
    manual: ['Laptop a kocsiban, adatkábel az ECU-ban.', 'Koppints a képre a térkép feltöltéséhez. Közben ne indítsd a motort.'],
    status() { return this.done ? 'A térkép az ECU-ban. Hangolható a Tuning fülön.' : this.k < 0 ? 'Koppints a feltöltéshez.' : `Feltöltés: ${Math.round(this.k * 100)}%`; },
    down() { if (this.k < 0) { this.k = 0; Audio2.beep(false); } },
    draw(ctx, W, H, dt) {
      this.t += dt;
      if (this.k >= 0 && !this.done) { this.k = Math.min(1, this.k + dt / 4.2); if (this.k >= 1) { this.done = true; Audio2.beep(true); } }
      ctx.fillStyle = '#2a2b30'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#050b07'; ctx.fillRect(40, 40, W - 80, H * 0.7);
      ctx.font = `30px ${cssVar('--f-crt')}`; ctx.textAlign = 'left';
      const shown = this.k < 0 ? 3 : Math.min(lines.length, 3 + Math.floor(this.k * (lines.length - 2.01)));
      for (let i = 0; i < shown; i++) { ctx.fillStyle = i === shown - 1 && !this.done ? '#d7ffe2' : '#7dff9a'; ctx.fillText(lines[i] + (i === 5 && this.k >= 0 ? ` ${Math.round(Math.min(1, this.k * 1.2) * 100)}%` : ''), 66, 92 + i * 38); }
      if (Math.floor(this.t * 2) % 2 === 0 && !this.done) { ctx.fillStyle = '#7dff9a'; ctx.fillRect(66, 92 + shown * 38 - 24, 16, 28); }
      ctx.fillStyle = '#163a20'; ctx.fillRect(66, H * 0.7 - 20, W - 132, 30);
      ctx.fillStyle = '#7dff9a'; ctx.fillRect(66, H * 0.7 - 20, (W - 132) * Math.max(0, this.k), 30);
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1; for (let y = 40; y < 40 + H * 0.7; y += 4) { ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(W - 40, y); ctx.stroke(); }
      ctx.fillStyle = '#1b1c20'; ctx.fillRect(0, H * 0.8, W, H * 0.2); ctx.fillStyle = '#3a3c42'; for (let r = 0; r < 3; r++) for (let i = 0; i < 12; i++) ctx.fillRect(40 + i * 54, H * 0.82 + r * 34, 46, 26);
      if (this.k < 0) tapHint(ctx, W / 2, H * 0.48, this.t, 'FELTÖLTÉS');
    }
  };
}

function bleedStep() {
  return {
    name: 'Légtelenítés', auto: true, done: false, air: 5, pumps: 0, slug: -1, bubbles: [], t: 0, factor: 1, pedal: 0,
    manual: ['Nyisd ki a légtelenítő csavart, és pumpáld a fékpedált.', 'Koppints a pumpáláshoz. Ha már nem jön buborék a csőben, zárd el a szelepet.', 'Ha bent marad a levegő, szivacsos lesz a fék.'],
    status() { return this.done ? (this.factor < 1 ? 'Elzárva, de maradt benne levegő.' : 'Buborékmentes, kemény a pedál.') : this.pumps === 0 ? 'Koppints a pedál pumpálásához.' : this.air > 0 ? 'Még jön a buborék. Pumpálj tovább.' : 'Tiszta folyadék jön. Zárd el a szelepet.'; },
    buttons() { return this.done ? [] : [el('button', { class: 'btn small' + (this.air <= 0 && this.pumps > 0 ? ' primary' : ''), onclick: () => { this.done = true; this.factor = this.air > 0 ? 0.88 : 1; Audio2.click(); } }, 'Elzárom a szelepet')]; },
    down() { if (this.done || this.slug >= 0) return; this.slug = 0; this.pedal = 1; this.pumps++; this.bubbles = Array.from({ length: Math.max(0, this.air) * 3 }, () => ({ o: Math.random() * 0.5, r: 4 + Math.random() * 7 })); this.air = Math.max(0, this.air - (1 + (Math.random() < 0.4 ? 1 : 0))); Audio2.burst(300, 1, 0.25, 0.15, 'lowpass'); },
    draw(ctx, W, H, dt) {
      this.t += dt; if (this.pedal > 0) this.pedal = Math.max(0, this.pedal - dt * 2.5);
      sceneBg(ctx, W, H, 0.9);
      const path = (u) => { const x = lerp(W * 0.28, W * 0.7, u), y = H * 0.32 + Math.sin(u * Math.PI) * H * 0.3 + u * H * 0.12; return [x, y]; };
      ctx.drawImage(ArtCache.get(PART.bbk1), W * 0.02, H * 0.04, W * 0.42, W * 0.42);
      ctx.strokeStyle = 'rgba(200,220,255,0.35)'; ctx.lineWidth = 22; ctx.lineCap = 'round'; ctx.beginPath();
      for (let i = 0; i <= 40; i++) { const [x, y] = path(i / 40); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
      if (this.slug >= 0) {
        this.slug += dt / 1.1;
        ctx.strokeStyle = 'rgba(214,170,60,0.85)'; ctx.lineWidth = 14; ctx.beginPath();
        const a = Math.max(0, this.slug - 0.6), b = Math.min(1, this.slug);
        for (let i = 0; i <= 20; i++) { const [x, y] = path(lerp(a, b, i / 20)); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
        for (const bb of this.bubbles) { const u = clamp(this.slug - bb.o, 0, 1); if (u <= a || u >= b) continue; const [x, y] = path(u); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(x, y, bb.r, 0, 7); ctx.fill(); }
        if (this.slug > 1.6) this.slug = -1;
      }
      ctx.lineCap = 'butt';
      ctx.fillStyle = 'rgba(220,230,240,0.25)'; ctx.fillRect(W * 0.64, H * 0.66, W * 0.18, H * 0.22);
      ctx.fillStyle = 'rgba(214,170,60,0.75)'; ctx.fillRect(W * 0.64, H * 0.66 + H * 0.22 * (1 - Math.min(0.85, 0.15 + this.pumps * 0.08)), W * 0.18, H * 0.22 * Math.min(0.85, 0.15 + this.pumps * 0.08));
      ctx.save(); ctx.translate(W * 0.84, H * 0.26); ctx.rotate(0.2 + this.pedal * 0.35);
      ctx.fillStyle = '#9da2aa'; ctx.fillRect(-8, -110, 16, 120); ctx.fillStyle = '#1b1c20'; ctx.fillRect(-46, 0, 92, 30); ctx.restore();
      ctx.fillStyle = '#e9e2cf'; ctx.font = `800 24px ${cssVar('--f-disp')}`; ctx.textAlign = 'center'; ctx.fillText('FÉKPEDÁL', W * 0.84, H * 0.44);
      if (!this.done && this.slug < 0) tapHint(ctx, W * 0.84, H * 0.3, this.t, this.pumps ? '' : 'PUMPÁLD');
    }
  };
}

function squeegeeStep(c, p) {
  return {
    name: p.slot === 'tint' ? 'Fólia' : p.slot === 'banner' ? 'Csík' : 'Matrica', auto: true, done: false, bub: null, pt: null, last: null, t: 0, pops: [],
    manual: [p.slot === 'tint' ? 'A fólia az üvegen van, de buborékos.' : 'A matrica fent van, de buborékos.', 'Simítsd ki: húzd az ujjad a buborékokon, kifelé a széle felé.'],
    status() { return this.done ? 'Sima, mint a gyári fényezés.' : `Buborék: ${this.bub ? this.bub.length : 0}`; },
    down(x, y) { this.pt = [x, y]; this.last = [x, y]; },
    move(x, y) {
      if (!this.pt || !this.bub) return;
      const dx = x - this.pt[0], dy = y - this.pt[1];
      if (Math.hypot(dx, dy) > 0.5) { this.last = this.pt; for (const b of this.bub) if (Math.hypot(b.x - x, b.y - y) < 70) { b.x += dx * 1.15; b.y += dy * 1.15; } }
      this.pt = [x, y];
    },
    up() { this.pt = null; },
    draw(ctx, W, H, dt) {
      this.t += dt;
      const rw = W * 0.72, r = { x: (W - rw) / 2, y: H * 0.48 - rw * 0.222, w: rw, h: rw * 0.444 };
      if (!this.bub) this.bub = Array.from({ length: 9 }, () => ({ x: r.x + 40 + Math.random() * (r.w - 80), y: r.y + 24 + Math.random() * (r.h - 48), s: 9 + Math.random() * 10 }));
      const base = p.slot === 'tint' || p.slot === 'banner' ? '#3a4658' : c.paint;
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, shade(base, 0.3)); g.addColorStop(0.5, shade(base, 0.05)); g.addColorStop(1, shade(base, -0.4));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(0, H * 0.18, W, 6); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(W * 0.62, 0, 4, H);
      const S2 = r.w / 0.9; ctx.drawImage(ArtCache.get(p), W / 2 - S2 / 2, H * 0.48 - S2 / 2, S2, S2);
      this.bub = this.bub.filter(b => { const out = b.x < r.x || b.x > r.x + r.w || b.y < r.y || b.y > r.y + r.h; if (out) { this.pops.push({ x: b.x, y: b.y, a: 1 }); Audio2.burst(2600, 4, 0.06, 0.08); } return !out; });
      for (const b of this.bub) { ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(b.x, b.y, b.s, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(b.x - b.s * 0.35, b.y - b.s * 0.35, b.s * 0.25, 0, 7); ctx.fill(); }
      this.pops = this.pops.filter(q => { q.a -= dt * 3; if (q.a <= 0) return false; ctx.strokeStyle = `rgba(255,255,255,${q.a})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(q.x, q.y, 10 + (1 - q.a) * 24, 0, 7); ctx.stroke(); return true; });
      if (this.pt) { ctx.save(); ctx.translate(this.pt[0], this.pt[1]); ctx.rotate(Math.atan2(this.pt[1] - this.last[1], this.pt[0] - this.last[0]) + Math.PI / 2); ctx.fillStyle = '#ffd400'; ctx.fillRect(-70, -12, 140, 24); ctx.fillStyle = '#1b1c20'; ctx.fillRect(-70, 8, 140, 6); ctx.restore(); }
      if (!this.bub.length && !this.done) this.done = true;
      if (!this.pt && !this.done && this.bub.length) tapHint(ctx, this.bub[0].x, this.bub[0].y, this.t, '');
    }
  };
}

function torqueStep(c, p, n, spec, passes) {
  const step = spec <= 12 ? 1 : spec <= 30 ? 2 : spec <= 60 ? 5 : 10;
  const st = {
    name: 'Meghúzás', auto: false, n, spec, passes, pass: 0, step, scaleMax: Math.ceil(spec * 1.6 / (step * 2)) * step * 2,
    bolts: Array.from({ length: n }, () => ({ v: [null, null] })), last: null, orderGood: 0, orderTotal: 0, hold: null, needle: 0, msg: '', done: false, stripped: false,
    manual: [`Csavarok: ${n} db`, `Meghúzási nyomaték: ${spec} Nm`, passes === 2 ? `1. menet: kb. a fele (${Math.round(spec / 2)} Nm), 2. menet: teljes` : null, 'Sorrend: keresztben. Mindig a szemközti csavarral folytasd, ne körbe.', 'Tartsd lenyomva a csavart, és engedd el, amikor a mutató eléri az értéket.', 'Ha egy csavar nem lett pontos, koppints rá újra: kilazítod és újrahúzod.'].filter(Boolean),
    // bolts of the current pass that are off the target by more than the tolerance
    offBolts() { const ps = this.pass, target = passes === 2 && ps === 0 ? spec * 0.5 : spec, tol = passes === 2 && ps === 0 ? 0.25 : 0.04; return this.bolts.map((b, k) => k).filter(k => this.bolts[k].v[ps] != null && Math.abs(this.bolts[k].v[ps] - target) / target > tol); },
    reset() { Object.assign(this, { lastRedo: false, pass: 0, bolts: Array.from({ length: n }, () => ({ v: [null, null] })), last: null, orderGood: 0, orderTotal: 0, hold: null, needle: 0, msg: '', done: false, stripped: false }); },
    geom(W, H) { const R = W * (n > 5 ? 0.25 : 0.21); return { W, H, cx: W / 2, cy: H * 0.31, R, br: R * 0.74, gx: W / 2, gy: H * 0.99, gr: W * 0.36 }; },
    boltPos(i, W, H) { const g = this.geom(W, H), a = -Math.PI / 2 + i * Math.PI * 2 / n; return [g.cx + Math.cos(a) * g.br, g.cy + Math.sin(a) * g.br, a]; },
    status() {
      if (this.stripped) return 'Elszakadt a menet! Menetjavító betét kell.';
      if (this.done) { const q = this.quality(), off = this.offBolts().length; return `${Math.round(q * 100)}% · ${q >= 0.85 ? 'Precíz munka.' : q >= 0.6 ? 'Rendben van, de nem tökéletes.' : 'Hanyag. Kotyogni vagy szivárogni fog.'}${off ? ` ${off} csavar nem pontos: koppints rá, és egyenként újrahúzhatod.` : ''}${this.msg && this.lastRedo ? ' ' + this.msg : ''}`; }
      const doneN = this.bolts.filter(b => b.v[this.pass] != null).length;
      return `${passes === 2 ? (this.pass + 1) + '. menet · ' : ''}${doneN} / ${n} csavar. ${this.msg || 'Kezdheted bármelyikkel.'}`;
    },
    buttons() {
      if (this.stripped) return [el('button', { class: 'btn primary small', onclick: () => { if (!UI.spend(6000)) return; this.reset(); } }, `Menetjavítás · ${fmtY(6000)}`)];
      if (this.done) return [el('button', { class: 'btn small', onclick: () => this.reset() }, 'Mindet újrahúzom')];
      return [];
    },
    down(x, y, W, H) {
      if (this.hold || this.stripped) return;
      let near = -1, nd = 1e9;
      for (let i = 0; i < n; i++) { const [bx, by] = this.boltPos(i, W, H), d = Math.hypot(x - bx, y - by); if (d < nd) { nd = d; near = i; } }
      if (near < 0 || nd > W * 0.08) return;
      if (this.bolts[near].v[this.pass] != null) {
        // already done in this pass: loosen it and pull it again, one bolt at a time
        if (!this.offBolts().includes(near)) { this.msg = 'Ez a csavar már pontos.'; this.lastRedo = true; return; }
        this.hold = { i: near, t0: performance.now(), redo: true }; Audio2.ratchet(true); return;
      }
      if (this.done) return;
      this.hold = { i: near, t0: performance.now() }; Audio2.ratchet(true);
    },
    up() {
      if (!this.hold) return;
      Audio2.ratchet(false);
      const i = this.hold.i, val = this.needle, redo = this.hold.redo; this.hold = null;
      const target = passes === 2 && this.pass === 0 ? spec * 0.5 : spec;
      if (redo) {
        this.bolts[i].v[this.pass] = val; this.lastRedo = true;
        if (val > spec * 1.3) { this.stripped = true; Audio2.clunk(); return; }
        const e2 = (val - target) / target;
        this.msg = Math.abs(e2) <= 0.04 ? `Újrahúzva: ${val.toFixed(0)} Nm, most pontos.` : `Újrahúzva: ${val.toFixed(0)} Nm, ${e2 > 0 ? 'még mindig szoros' : 'még mindig laza'}.`;
        Audio2.click(); return;
      }
      this.lastRedo = false;
      const remaining = this.bolts.map((b, k) => k).filter(k => this.bolts[k].v[this.pass] == null);
      let om = '';
      if (this.last != null && remaining.length > 1) {
        const d = k => { const a = Math.abs(k - this.last) * 2 * Math.PI / n; return Math.min(a, 2 * Math.PI - a); };
        const maxd = Math.max(...remaining.map(d)), stepA = 2 * Math.PI / n, floor = (n <= 5 ? 0.55 : 0.45) * Math.PI;
        const good = d(i) >= maxd - 1e-6 || d(i) >= Math.max(maxd - stepA * 1.01, floor);
        this.orderTotal++; if (good) this.orderGood++; else om = 'Körbe haladtál, keresztben kell.';
      }
      this.bolts[i].v[this.pass] = val; this.last = i;
      if (val > spec * 1.3) { this.stripped = true; Audio2.clunk(); return; }
      const err = (val - target) / target;
      const tol = passes === 2 && this.pass === 0 ? 0.25 : 0.04;
      this.msg = (Math.abs(err) <= tol ? `${val.toFixed(0)} Nm, pontos. ` : `${val.toFixed(0)} Nm, ${err > 0 ? 'túl szoros' : 'laza'}. Koppints rá újra, ha újrahúznád. `) + om;
      Audio2.click();
      if (this.bolts.every(b => b.v[this.pass] != null)) {
        if (this.pass + 1 < passes) { this.pass++; this.last = null; this.msg = 'Első menet kész. Most a teljes nyomaték, ugyanígy keresztben.'; }
        else this.done = true;
      }
    },
    quality() {
      let sum = 0, cnt = 0;
      for (let ps = 0; ps < passes; ps++) {
        const target = passes === 2 && ps === 0 ? spec * 0.5 : spec, tol = passes === 2 && ps === 0 ? 0.25 : 0.04, w = passes === 2 && ps === 0 ? 0.4 : 1;
        for (const b of this.bolts) { const err = Math.abs(b.v[ps] - target) / target; sum += w * clamp(1 - Math.max(0, err - tol) / 0.22, 0, 1); cnt += w; }
      }
      const tq = sum / cnt, oq = this.orderTotal ? this.orderGood / this.orderTotal : 1;
      return clamp(0.7 * tq + 0.3 * oq, 0, 1);
    },
    draw(ctx, W, H) {
      const g = this.geom(W, H);
      if (this.hold) {
        const t = (performance.now() - this.hold.t0) / 1000;
        this.needle = this.scaleMax * Math.min(1, Math.pow(t / 1.9, 1.45)) + Math.sin(t * 31) * this.scaleMax * 0.004;
        if (this.needle >= this.scaleMax * 0.999) this.up();
      }
      ctx.clearRect(0, 0, W, H);
      partFace(ctx, c, p, g.cx, g.cy, g.R, false);
      for (let i = 0; i < n; i++) {
        const [bx, by, a0] = this.boltPos(i, W, H), b = this.bolts[i];
        const v = b.v[this.pass] != null ? b.v[this.pass] : (this.pass > 0 ? b.v[this.pass - 1] : null);
        const target = passes === 2 && (b.v[this.pass] != null ? this.pass : this.pass - 1) === 0 ? spec * 0.5 : spec;
        let ring = '#555b66';
        if (b.v[this.pass] != null || (this.done && v != null)) { const err = Math.abs(v - target) / target, tl = target < spec ? 0.25 : 0.04; ring = err <= tl ? '#8fe36b' : err <= 0.2 ? '#ffa733' : '#ff3d4f'; }
        else if (this.pass > 0) ring = '#4ee6d4';
        const r = W * (n > 6 ? 0.034 : 0.045);
        const spin = this.hold && this.hold.i === i ? -this.needle / this.scaleMax * 3 : 0;
        hexBolt(ctx, bx, by, r, spin, ring);
        if (b.v[this.pass] != null) { ctx.fillStyle = '#ece6d6'; ctx.font = `600 ${W * 0.032}px ${cssVar('--f-body')}`; ctx.textAlign = 'center'; ctx.fillText(Math.round(b.v[this.pass]), g.cx + Math.cos(a0) * g.br * 1.42, g.cy + Math.sin(a0) * g.br * 1.42 + 6); }
        if (this.hold && this.hold.i === i) {
          ctx.strokeStyle = '#ffa733'; ctx.lineWidth = W * 0.018; ctx.beginPath(); ctx.arc(bx, by, r * 1.6, 0, 7); ctx.stroke();
          const a = a0 + Math.PI / 2 + spin * 0.15; ctx.lineWidth = W * 0.03; ctx.strokeStyle = '#aab0bb'; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(a) * W * 0.32, by + Math.sin(a) * W * 0.32); ctx.stroke(); ctx.lineCap = 'butt';
        }
      }
      const a0 = Math.PI + 0.42, a1 = 2 * Math.PI - 0.42;
      ctx.fillStyle = '#e8e0c8'; ctx.beginPath(); ctx.arc(g.gx, g.gy, g.gr * 1.08, a0 - 0.08, a1 + 0.08); ctx.lineTo(g.gx, g.gy); ctx.fill();
      const tgt = passes === 2 && this.pass === 0 ? spec * 0.5 : spec;
      ctx.strokeStyle = 'rgba(31,122,74,0.35)'; ctx.lineWidth = g.gr * 0.12; ctx.beginPath(); ctx.arc(g.gx, g.gy, g.gr * 0.95, a0 + (a1 - a0) * tgt * 0.94 / this.scaleMax, a0 + (a1 - a0) * tgt * 1.06 / this.scaleMax); ctx.stroke();
      ctx.strokeStyle = '#2a2418'; ctx.fillStyle = '#2a2418'; ctx.textAlign = 'center'; ctx.font = `${W * 0.03}px ${cssVar('--f-crt')}`;
      for (let v = 0; v <= this.scaleMax + 1e-6; v += step) {
        const a = a0 + (a1 - a0) * v / this.scaleMax, major = Math.round(v / step) % 5 === 0;
        ctx.lineWidth = major ? 3 : 1.4;
        ctx.beginPath(); ctx.moveTo(g.gx + Math.cos(a) * g.gr * (major ? 0.86 : 0.92), g.gy + Math.sin(a) * g.gr * (major ? 0.86 : 0.92)); ctx.lineTo(g.gx + Math.cos(a) * g.gr, g.gy + Math.sin(a) * g.gr); ctx.stroke();
        if (major) ctx.fillText(Math.round(v), g.gx + Math.cos(a) * g.gr * 0.76, g.gy + Math.sin(a) * g.gr * 0.76 + 8);
      }
      ctx.font = `${W * 0.034}px ${cssVar('--f-crt')}`; ctx.fillText('Nm', g.gx, g.gy - g.gr * 0.42);
      const na = a0 + (a1 - a0) * clamp(this.needle / this.scaleMax, 0, 1);
      ctx.strokeStyle = '#c3121f'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(g.gx, g.gy); ctx.lineTo(g.gx + Math.cos(na) * g.gr * 0.98, g.gy + Math.sin(na) * g.gr * 0.98); ctx.stroke();
      ctx.fillStyle = '#2a2418'; ctx.beginPath(); ctx.arc(g.gx, g.gy, 10, 0, 7); ctx.fill();
    }
  };
  return st;
}

// ---------------------------------------------------------------- the procedure for a given part
function buildSteps(c, p, reSlot) {
  const n = boltsFor(p, c), spec = torqueFor(p, c), loc = LOC[p.slot];
  if (reSlot) return [torqueStep(c, p, n, spec, p.passes || 1)];
  if (p.slot === 'decal' || p.slot === 'tint' || p.slot === 'banner') return [squeegeeStep(c, p)];
  const old = c.parts[p.slot] ? PART[c.parts[p.slot].id] : null;
  const E = CARS[c.model].engine;
  const hasStock = !ADDITIVE.has(p.slot) && !((p.slot === 'turbo' || p.slot === 'ic') && !E.turbo);
  const steps = [];
  if (loc === 'under' || loc === 'wheel') steps.push(jackStep(c, loc === 'wheel' ? 'wheel' : 'mid', false));
  if (loc === 'bay') steps.push(hoodStep(c));
  if (old || hasStock) steps.push(unboltStep(c, p, n, old));
  if (p.slot === 'susp') steps.push(compressStep());
  steps.push(swapStep(c, p, old, { noNew: p.id === 'strip1', noOld: !old && !hasStock }));
  if (p.slot === 'ecu') steps.push(plugStep(c));
  if (p.id !== 'strip1' && n > 0) steps.push(torqueStep(c, p, n, spec, p.passes || 1));
  if (p.slot === 'ecu') steps.push(flashStep(c));
  if (['pads', 'brakes', 'hbrake'].includes(p.slot)) steps.push(bleedStep());
  if (loc === 'under' || loc === 'wheel') steps.push(jackStep(c, loc === 'wheel' ? 'wheel' : 'mid', true));
  return steps;
}

const Install = {
  run: null,
  start(invIdx, reSlot, custom) {
    const c = custom ? custom.c : car(), pid = custom ? custom.p.id : reSlot ? c.parts[reSlot].id : S.inv[invIdx], p = PART[pid];
    if (!p) return;
    Audio2.init();
    const steps = buildSteps(c, p, reSlot);
    const cv = el('canvas', { id: 'instCv', width: 720, height: 720 });
    const prog = el('ol', { class: 'steps' });
    const manual = el('div', { class: 'manual' }), status = el('div', { id: 'instStatus' });
    this.run = { custom, c, p, invIdx, reSlot, steps, i: 0, cv, ctx: cv.getContext('2d'), prog, manual, status, key: '', advanceAt: 0, finished: false };
    UI.open([UI.head(custom ? `Szervizmunka: ${custom.title}` : `${reSlot ? 'Újrahúzás' : 'Beszerelés'}: ${p.name}`, custom ? `${custom.who} · ${CARS[c.model].name}` : `${p.brand} · ${CARS[c.model].name}`), prog,
      el('div', { class: 'inst' }, cv, el('div', { class: 'inst-side' }, manual, status))], true);
    const fit = () => { // keep the canvas square and fully on screen, so taps land where they look
      if (!cv.isConnected) return;
      const col = cv.parentElement.clientWidth, top = cv.getBoundingClientRect().top - $('#sheet').getBoundingClientRect().top + $('#sheet').scrollTop;
      const avail = $('#sheet').clientHeight - top - 16, sz = Math.max(180, Math.min(col, 460, avail > 200 ? avail : col));
      cv.style.width = cv.style.height = Math.floor(sz) + 'px';
    };
    requestAnimationFrame(fit); this.ro && this.ro.disconnect(); this.ro = new ResizeObserver(fit); this.ro.observe($('#sheet'));
    const pos = (e) => { const r = cv.getBoundingClientRect(), s = cv.width / r.width; return [(e.clientX - r.left) * s, (e.clientY - r.top) * s]; };
    const call = (fn, e) => { const run = this.run; if (!run || run.finished) return; const st = run.steps[run.i]; if (st && st[fn]) { const [x, y] = pos(e); st[fn](x, y, cv.width, cv.height); } };
    cv.addEventListener('pointerdown', (e) => { e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (er) {} call('down', e); });
    cv.addEventListener('pointermove', (e) => call('move', e));
    cv.addEventListener('pointerup', (e) => call('up', e));
    cv.addEventListener('pointercancel', (e) => call('up', e));
    this.enter();
    let last = performance.now();
    const loop = (t) => {
      const run = this.run; if (!run || run.cv !== cv || $('#modal').hidden) { Audio2.ratchet(false); return; }
      const dt = Math.min(0.25, (t - last) / 1000); last = t; // animations here are plain tweens, so they keep real time even on slow phones
      const st = run.steps[run.i];
      if (st) st.draw(run.ctx, cv.width, cv.height, dt);
      if (st && st.done && st.auto && !run.advanceAt && !run.finished) run.advanceAt = t + 650;
      if (run.advanceAt && t >= run.advanceAt) { run.advanceAt = 0; this.next(); }
      this.refresh();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  },
  enter() {
    const run = this.run, st = run.steps[run.i];
    run.prog.replaceChildren(...run.steps.map((s, i) => el('li', { class: i < run.i ? 'done' : i === run.i ? 'on' : '' }, el('b', null, i < run.i ? '✓' : String(i + 1)), el('span', null, s.name))));
    run.manual.replaceChildren(el('div', null, `SZERVIZKÖNYV · ${st.name.toUpperCase()}`), ...st.manual.map(m => el('div', null, m)));
    run.key = ''; this.refresh();
  },
  next() {
    const run = this.run;
    if (run.i < run.steps.length - 1) { run.i++; this.enter(); }
    else { run.finished = true; run.key = ''; this.refresh(); }
  },
  quality() {
    const run = this.run; let q = 1;
    for (const s of run.steps) { if (s.quality) q *= s.quality(); if (s.factor) q *= s.factor; }
    return clamp(q, 0, 1);
  },
  refresh() {
    const run = this.run, st = run.steps[run.i];
    const txt = run.finished ? 'fin' : st.status() + '|' + st.done + '|' + (st.stripped || '');
    if (txt === run.key) return; run.key = txt;
    const s = run.status; s.replaceChildren();
    if (run.finished) {
      const q = this.quality(), pc = Math.round(q * 100);
      run.prog.replaceChildren(...run.steps.map(x => el('li', { class: 'done' }, el('b', null, '✓'), el('span', null, x.name))));
      s.append(el('div', { class: 'inst-q' }, `${pc}%`),
        el('p', { style: 'margin:0 0 10px' }, q >= 0.85 ? 'Precíz munka. Ez így gyári minőség.' : q >= 0.6 ? 'Rendben van, de nem tökéletes.' : 'Hanyag munka. Kotyogni, szivárogni fog, vagy nem hozza, amit tudnia kéne.'),
        el('div', { class: 'row' }, el('button', { class: 'btn primary', onclick: () => { if (run.custom) { UI.close(); run.custom.onDone(q); return; } this.apply(run.c, run.p, run.invIdx, run.reSlot, q); UI.close(); toast(`${run.p.name} beszerelve · ${pc}%`, q >= 0.6 ? 'good' : 'bad'); } }, run.custom ? 'Átadom a kocsit' : 'Kész')));
      return;
    }
    s.append(el('div', { class: 'inst-step' }, `${run.i + 1}. lépés · ${st.name}`), el('div', { class: 'muted', style: 'font-size:13.5px;line-height:1.4' }, st.status()));
    const btns = (st.buttons ? st.buttons() : []).slice();
    if (st.done && !st.auto && !st.stripped) btns.unshift(el('button', { class: 'btn primary small', onclick: () => this.next() }, run.i < run.steps.length - 1 ? 'Tovább' : 'Befejezés'));
    if (btns.length) s.append(el('div', { class: 'row', style: 'margin-top:8px' }, ...btns));
  },
  apply(c, p, invIdx, reSlot, q) {
    if (reSlot) { c.parts[reSlot].q = q; }
    else {
      const old = c.parts[p.slot];
      if (old && p.slot !== 'tires') S.inv.push(old.id);
      const idx = S.inv.indexOf(p.id); if (idx >= 0) S.inv.splice(idx, 1);
      c.parts[p.slot] = { id: p.id, q };
      if (p.slot === 'tires') c.cond.tires = 1;
      if (p.slot === 'clutch') c.cond.clutch = 1;
      if (p.fx.boostDefault && !CARS[c.model].engine.turbo) c.tune.boost = p.fx.boostDefault;
    }
    save(); UI.render();
  }
};
