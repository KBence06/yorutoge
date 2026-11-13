// ===================== GARAGE SCENE (2D canvas) =====================
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  if (f >= 0) { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; } else { r *= 1 + f; g *= 1 + f; b *= 1 + f; }
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

function carVisual(c) {
  const v = { wing: null, kit: false, hood: null, decal: null, wheel: 'stock', lower: 0, cage: false, flares: false, lights: null, fogs: false, tail: null, tint: false, banner: false, neon: false };
  const t = c.tune || {}; if (c.parts && c.parts.camber) v.camber = [t.camberF || 0, t.camberR || 0];
  for (const ip of Object.values(c.parts || {})) {
    const f = PART[ip.id] && PART[ip.id].fx || {};
    for (const k of ['wing', 'hood', 'decal', 'wheel', 'lights', 'tail', 'bumper', 'mirrors', 'pipes', 'flares']) if (f[k]) v[k] = f[k];
    for (const k of ['kit', 'cage', 'fogs', 'tint', 'banner', 'neon', 'canards', 'diffuser', 'roofscoop', 'louver', 'pod', 'towhook', 'oilcooler', 'tirelet', 'intneon', 'seat', 'strip']) if (f[k]) v[k] = true;
  }
  const susp = c.parts && c.parts.susp && PART[c.parts.susp.id].fx;
  if (susp && susp.lower) v.lower = susp.lower;
  if (susp && susp.coilover) v.lower = -(c.tune.rideF + c.tune.rideR) / 2000;
  const L = c.look || {};
  v.finish = L.finish || 'gloss'; v.livery = L.livery || null; v.col2 = L.col2 || '#141418';
  v.neonColor = L.neon || NEONS[0][0]; v.bannerText = (BANNERS.find(b => b[0] === L.banner) || BANNERS[0])[1];
  if (L.forceNeon) v.neon = true;
  return v;
}

function lookVis(look) { return { finish: look.finish || 'gloss', livery: look.livery || null, col2: look.col2 || '#141418', neon: !!look.neon, neonColor: look.neon || NEONS[0][0] }; }

// Livery graphics that sit on the door area. Drawn facing right (front of the car on the right).
function drawLiveryGraphic(ctx, kind, col, x, y, w, h) {
  ctx.save(); ctx.translate(x, y);
  if (kind === 'kanji') {
    ctx.fillStyle = col; ctx.font = `${Math.round(h * 0.95)}px ${cssVar('--f-jp')}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('峠', w * 0.5, h * 0.52);
    ctx.font = `800 italic ${Math.round(h * 0.16)}px ${cssVar('--f-disp')}`; ctx.fillText('TŌGE', w * 0.5, h * 0.98);
  } else if (kind === 'tribal') {
    ctx.fillStyle = col;
    const sw = (y0, len, th, bend) => { // one swoosh, pointed toward the front
      ctx.beginPath(); ctx.moveTo(w * 0.02, h * y0);
      ctx.bezierCurveTo(w * 0.3, h * (y0 - bend), w * (len - 0.25), h * (y0 - bend * 0.4), w * len, h * (y0 - bend * 0.9));
      ctx.bezierCurveTo(w * (len - 0.2), h * (y0 - bend * 0.2 + th), w * 0.3, h * (y0 - bend * 0.4 + th), w * 0.02, h * y0);
      ctx.fill();
    };
    sw(0.62, 0.98, 0.22, 0.36); sw(0.78, 0.82, 0.16, 0.18); sw(0.46, 0.66, 0.12, 0.3); sw(0.9, 0.6, 0.1, 0.06);
  } else if (kind === 'flames') { // licks of fire running back from the front wheel
    const g = ctx.createLinearGradient(0, 0, w, 0); g.addColorStop(0, hexA(col, 0)); g.addColorStop(0.25, col); g.addColorStop(1, col); ctx.fillStyle = g;
    for (const [y0, len, th] of [[0.3, 0.95, 0.2], [0.55, 0.8, 0.2], [0.8, 0.9, 0.18], [0.12, 0.6, 0.14]]) {
      ctx.beginPath(); ctx.moveTo(w, h * (y0 - th / 2));
      ctx.bezierCurveTo(w * (1 - len * 0.4), h * (y0 - th), w * (1 - len * 0.7), h * (y0 + th * 0.6), w * (1 - len), h * (y0 - th * 0.3));
      ctx.bezierCurveTo(w * (1 - len * 0.6), h * (y0 + th * 1.1), w * (1 - len * 0.3), h * (y0 + th * 0.2), w, h * (y0 + th / 2)); ctx.fill();
    }
  } else if (kind === 'bolt') {
    ctx.fillStyle = col; ctx.beginPath();
    for (const [i, p] of [[0.02, 0.55], [0.4, 0.2], [0.36, 0.45], [0.7, 0.18], [0.64, 0.42], [0.99, 0.12], [0.6, 0.66], [0.66, 0.44], [0.32, 0.72], [0.38, 0.5]].entries()) i ? ctx.lineTo(w * p[0], h * p[1]) : ctx.moveTo(w * p[0], h * p[1]);
    ctx.closePath(); ctx.fill();
  } else if (kind === 'checker') { // chequered flag fading toward the rear
    const n = 5, cs = h / n;
    for (let iy = 0; iy < n; iy++) for (let ix = 0; ix * cs < w; ix++) { if ((ix + iy) % 2) continue; const fx = 1 - (ix * cs) / w; ctx.fillStyle = hexA(col.length === 7 ? col : '#141418', clamp(1.25 - fx * 1.5, 0, 1)); ctx.fillRect(w - (ix + 1) * cs + iy * cs * 0.25, iy * cs, cs, cs); }
  }
  ctx.restore();
}
const GRAPHIC_LIV = new Set(['tribal', 'kanji', 'flames', 'bolt', 'checker']), DIRECTIONAL_LIV = new Set(['tribal', 'flames', 'bolt', 'checker']);
// door stickers, drawn into a w x h box (text reads left to right)
function drawDecal(ctx, id, w, h) {
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const f = (px) => `800 italic ${Math.round(px)}px ${cssVar('--f-disp')}`;
  if (id === 'wolves') { ctx.font = f(h * 0.2); ctx.fillStyle = '#f2efe6'; ctx.fillRect(w * 0.14, h * 0.6, w * 0.72, h * 0.26); ctx.fillStyle = '#111216'; ctx.fillText('KUROZAWA WOLVES', w * 0.5, h * 0.735); }
  else if (id === 'kaminari') { ctx.font = f(h * 0.24); ctx.fillStyle = '#ffd400'; ctx.fillText('⚡ KAMINARI', w * 0.5, h * 0.72); }
  else if (id === 'loop') { ctx.font = f(h * 0.2); ctx.strokeStyle = '#f2efe6'; ctx.lineWidth = Math.max(2, h * 0.03); ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.7, w * 0.36, h * 0.19, 0, 0, 7); ctx.stroke(); ctx.fillStyle = '#f2efe6'; ctx.fillText('MIDNIGHT LOOP', w * 0.5, h * 0.71); }
  else if (id === 'bomb') {
    let r = 11; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647, cols = ['#ffd400', '#f2efe6', '#c8202a', '#2f7bff', '#3dff6e', '#ff3dbb', '#111216', '#f07a1a'];
    for (let i = 0; i < 46; i++) { ctx.save(); ctx.translate(w * (0.02 + rnd() * 0.3), h * (0.25 + rnd() * 0.7)); ctx.rotate((rnd() - 0.5) * 1.2); ctx.fillStyle = cols[Math.floor(rnd() * cols.length)]; const sw = w * (0.04 + rnd() * 0.06), sh2 = h * (0.06 + rnd() * 0.08); if (rnd() < 0.3) { ctx.beginPath(); ctx.ellipse(0, 0, sw / 2, sh2 / 2, 0, 0, 7); ctx.fill(); } else ctx.fillRect(-sw / 2, -sh2 / 2, sw, sh2); ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(-sw * 0.3, -sh2 * 0.1, sw * 0.6, sh2 * 0.2); ctx.restore(); }
  }
  ctx.restore();
}

// Side view, facing right. groundY is where the tyres touch.
function drawCarSide(ctx, c, cx, groundY, len) {
  const M = CARS[c.model], v = carVisual(c), sh = carShape(c.model, v.lower), D = sh.D;
  const k = len / sh.L, X = z => cx + z * k, Y = y => groundY - y * k;
  const path = (pts) => { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1]))); ctx.closePath(); };
  const lw = Math.max(1, len * 0.0025);
  // ground shadow
  const g0 = ctx.createRadialGradient(cx, groundY, 2, cx, groundY, len * 0.6);
  g0.addColorStop(0, 'rgba(0,0,0,0.6)'); g0.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g0; ctx.beginPath(); ctx.ellipse(cx, groundY + 2, len * 0.62, len * 0.05, 0, 0, Math.PI * 2); ctx.fill();
  if (v.neon) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const ng = ctx.createRadialGradient(cx, groundY, 2, cx, groundY, len * 0.55); ng.addColorStop(0, hexA(v.neonColor, 0.75)); ng.addColorStop(0.5, hexA(v.neonColor, 0.25)); ng.addColorStop(1, hexA(v.neonColor, 0)); ctx.fillStyle = ng; ctx.beginPath(); ctx.ellipse(cx, groundY + 2, len * 0.6, len * 0.075, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = hexA(v.neonColor, 0.9); ctx.fillRect(X(sh.wheels.zr + sh.wheels.ra), Y(0.13), (sh.wheels.zf - sh.wheels.zr - 2 * sh.wheels.ra) * k, Math.max(2, 0.02 * k)); ctx.restore(); }
  // wheel wells show through the arch cut-outs
  for (const zc of [sh.wheels.zr, sh.wheels.zf]) { ctx.fillStyle = '#060709'; ctx.beginPath(); ctx.arc(X(zc), Y(sh.wheels.r), sh.wheels.ra * k, 0, Math.PI * 2); ctx.fill(); }
  // body
  ctx.save();
  path(sh.outline);
  const top = Y(sh.roofY), bot = Y(0.15);
  const gr = ctx.createLinearGradient(0, top, 0, bot);
  const bodyGrad = (col) => {
    const g2 = ctx.createLinearGradient(0, top, 0, bot);
    if (v.finish === 'matte') { g2.addColorStop(0, shade(col, 0.12)); g2.addColorStop(0.5, shade(col, -0.04)); g2.addColorStop(1, shade(col, -0.4)); }
    else {
      const hi = v.finish === 'pearl' ? 0.32 : v.finish === 'metal' ? 0.3 : 0.22;
      g2.addColorStop(0, shade(col, 0.38)); g2.addColorStop(0.36, shade(col, 0.12)); g2.addColorStop(0.47, shade(col, hi)); g2.addColorStop(0.5, shade(col, -0.08)); g2.addColorStop(0.78, shade(col, -0.25)); g2.addColorStop(1, shade(col, -0.55));
    }
    return g2;
  };
  ctx.fillStyle = bodyGrad(c.paint); ctx.fill();
  ctx.lineWidth = lw; ctx.strokeStyle = 'rgba(0,0,0,0.65)'; ctx.stroke();
  ctx.clip();
  // two-tone lower body
  if (v.livery === 'twotone') { ctx.fillStyle = bodyGrad(v.col2); const sy = Y(sh.beltY - 0.3); ctx.fillRect(X(-sh.L / 2) - 4, sy, len + 8, Y(0) - sy + 4); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(X(-sh.L / 2), sy - 1, len, Math.max(1, 0.008 * k)); }
  if (v.livery === 'side') { ctx.fillStyle = v.col2; ctx.fillRect(X(-sh.L / 2) - 4, Y(sh.beltY - 0.17), len + 8, 0.07 * k); ctx.fillRect(X(-sh.L / 2) - 4, Y(sh.beltY - 0.215), len + 8, 0.018 * k); }
  if (v.livery === 'stripes') { ctx.strokeStyle = v.col2; ctx.lineWidth = Math.max(2, 0.05 * k); ctx.beginPath(); sh.up.forEach((p, i) => { if (p[1] < sh.beltY - 0.15) return; i ? ctx.lineTo(X(p[0]), Y(p[1] - 0.01)) : ctx.moveTo(X(p[0]), Y(p[1] - 0.01)); }); ctx.stroke(); }
  const dz0 = sh.wheels.zr + sh.wheels.ra + 0.05, dz1 = sh.wheels.zf - sh.wheels.ra - 0.05, dy1 = sh.beltY - 0.07, dy0 = 0.3 - sh.drop;
  if (GRAPHIC_LIV.has(v.livery)) drawLiveryGraphic(ctx, v.livery, v.col2, X(dz0), Y(dy1), (dz1 - dz0) * k, (dy1 - dy0) * k);
  if (v.finish === 'metal' || v.finish === 'pearl') { // flake
    let r = 7; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
    ctx.fillStyle = v.finish === 'pearl' ? 'rgba(220,200,255,0.35)' : 'rgba(255,255,255,0.28)';
    for (let i = 0; i < 160; i++) ctx.fillRect(X(-sh.L / 2) + rnd() * len, top + rnd() * (bot - top), 1, 1);
  }
  if (v.finish === 'pearl') { const pg = ctx.createLinearGradient(X(-sh.L / 2), 0, X(sh.L / 2), 0); pg.addColorStop(0, 'rgba(180,140,255,0.12)'); pg.addColorStop(0.5, 'rgba(255,255,255,0)'); pg.addColorStop(1, 'rgba(120,220,255,0.12)'); ctx.fillStyle = pg; ctx.fillRect(X(-sh.L / 2), top, len, bot - top); }
  // vented hood
  if (v.hood === 'vent') { ctx.fillStyle = 'rgba(0,0,0,0.6)'; for (let i = 0; i < 4; i++) { const z = sh.cowlZ + 0.25 + i * 0.09; ctx.fillRect(X(z), Y(shapeTopAt(sh, z) - 0.005), 0.05 * k, Math.max(2, 0.018 * k)); } }
  // carbon hood
  if (v.hood === 'carbon') {
    ctx.fillStyle = '#17181c'; ctx.fillRect(X(sh.cowlZ), top - 2, X(sh.L / 2) - X(sh.cowlZ) + 4, Y(sh.beltY - 0.12) - top);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
    for (let x = X(sh.cowlZ); x < X(sh.L / 2); x += 5) { ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x + 7, Y(sh.beltY - 0.12)); ctx.stroke(); }
  }
  // dark 80s bumpers and side moulding
  if (D.bumpers === 'dark') {
    ctx.fillStyle = '#18191d';
    ctx.fillRect(X(-sh.L / 2) - 2, Y(0.44), X(-sh.L / 2 + 0.3) - X(-sh.L / 2) + 2, Y(0) - Y(0.44));
    ctx.fillRect(X(sh.L / 2 - 0.3), Y(0.42), X(sh.L / 2) - X(sh.L / 2 - 0.3) + 2, Y(0) - Y(0.42));
    ctx.fillRect(X(-sh.L / 2), Y(0.47), len, Math.max(2, 0.03 * k));
  }
  // shoulder highlight and crease
  ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fillRect(X(-sh.L / 2), Y(sh.beltY - 0.06), len, Math.max(1, 0.012 * k));
  ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(X(-sh.L / 2), Y(sh.beltY - 0.075), len, Math.max(1, 0.01 * k));
  // environment reflections: the fluorescent tube along the shoulder, a soft window sweep, and the dark floor in the sills
  if (v.finish !== 'matte') {
    const tube = ctx.createLinearGradient(X(-sh.L / 2), 0, X(sh.L / 2), 0);
    tube.addColorStop(0, 'rgba(255,255,255,0)'); tube.addColorStop(0.18, 'rgba(255,255,255,0.5)'); tube.addColorStop(0.62, 'rgba(255,255,255,0.32)'); tube.addColorStop(0.8, 'rgba(255,255,255,0)');
    ctx.fillStyle = tube; ctx.fillRect(X(-sh.L / 2), Y(sh.beltY - 0.105), len, Math.max(1, 0.009 * k));
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const [zc, wd] of [[-0.25, 0.42], [0.65, 0.18]]) {
      const sw = ctx.createLinearGradient(X(zc - wd), 0, X(zc + wd), 0); sw.addColorStop(0, 'rgba(160,180,220,0)'); sw.addColorStop(0.5, 'rgba(160,180,220,0.09)'); sw.addColorStop(1, 'rgba(160,180,220,0)');
      ctx.fillStyle = sw; ctx.beginPath(); ctx.moveTo(X(zc - wd + 0.25), top); ctx.lineTo(X(zc + wd + 0.25), top); ctx.lineTo(X(zc + wd - 0.2), bot); ctx.lineTo(X(zc - wd - 0.2), bot); ctx.fill();
    }
    ctx.restore();
    const fl = ctx.createLinearGradient(0, Y(0.36), 0, Y(0.12)); fl.addColorStop(0, 'rgba(0,0,0,0)'); fl.addColorStop(1, 'rgba(0,0,0,0.38)');
    ctx.fillStyle = fl; ctx.fillRect(X(-sh.L / 2) - 2, Y(0.36), len + 4, Y(0.1) - Y(0.36));
    ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(X(-sh.L / 2), Y(0.2), len, Math.max(1, 0.006 * k));
  }
  // fender flares
  if (D.flare > 0.02) for (const zc of [sh.wheels.zr, sh.wheels.zf]) { ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = Math.max(1.5, 0.025 * k); ctx.beginPath(); ctx.arc(X(zc), Y(sh.wheels.r), (sh.wheels.ra + 0.06) * k, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke(); }
  // door seams and handle
  const doorF = sh.cowlZ - 0.1, doorR = sh.pillarZ + (['sprint16', 'types'].includes(c.model) ? 0.05 : -0.04);
  ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = Math.max(1, len * 0.0018);
  const seams = D.doors === 4 ? [doorF, sh.pillarZ + 0.03, sh.wheels.zr + sh.wheels.ra + 0.06] : [doorF, doorR];
  for (const z of seams) { ctx.beginPath(); ctx.moveTo(X(z), Y(sh.beltY)); ctx.lineTo(X(z), Y(0.26)); ctx.stroke(); }
  if (D.doors === 4) ctx.fillRect(X(sh.wheels.zr + sh.wheels.ra + 0.16), Y(sh.beltY - 0.1), 0.14 * k, Math.max(2, 0.025 * k));
  if (D.intake) { ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.beginPath(); ctx.moveTo(X(sh.pillarZ - 0.08), Y(sh.beltY - 0.06)); ctx.lineTo(X(sh.wheels.zr + sh.wheels.ra + 0.05), Y(sh.beltY - 0.12)); ctx.lineTo(X(sh.wheels.zr + sh.wheels.ra + 0.1), Y(sh.beltY - 0.24)); ctx.lineTo(X(sh.pillarZ - 0.12), Y(sh.beltY - 0.16)); ctx.fill(); }
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(X(doorR + 0.08), Y(sh.beltY - 0.1), 0.16 * k, Math.max(2, 0.025 * k));
  // decal
  if (v.decal) { ctx.save(); ctx.translate(X(dz0), Y(dy1)); drawDecal(ctx, v.decal, (dz1 - dz0) * k, (dy1 - dy0) * k); ctx.restore(); }
  if (D.bed) { ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = lw; const by = shapeTopAt(sh, -sh.L / 2 + 0.3); for (let i = 0; i < 4; i++) { const z = -sh.L / 2 + 0.25 + i * (sh.pillarZ - 0.4 + sh.L / 2) / 3; ctx.beginPath(); ctx.moveTo(X(z), Y(by - 0.02)); ctx.lineTo(X(z), Y(by - 0.26)); ctx.stroke(); } }
  ctx.restore();
  // glass
  for (const g of sh.glass) {
    path(g);
    const gg = ctx.createLinearGradient(0, top, 0, Y(sh.beltY));
    if (v.tint) { gg.addColorStop(0, '#151a24'); gg.addColorStop(1, '#040507'); } else { gg.addColorStop(0, '#2e3a4e'); gg.addColorStop(1, '#0a0d13'); }
    ctx.fillStyle = gg; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 0.12 * k;
    const gx = Math.min(...g.map(p => p[0])) + 0.25; ctx.beginPath(); ctx.moveTo(X(gx), Y(sh.roofY)); ctx.lineTo(X(gx - 0.25), Y(sh.beltY)); ctx.stroke();
    if (v.cage) { ctx.strokeStyle = '#c9ccd2'; ctx.lineWidth = Math.max(1.5, 0.035 * k); ctx.beginPath(); ctx.moveTo(X(sh.pillarZ + 0.1), Y(sh.beltY)); ctx.lineTo(X(sh.pillarZ + 0.45), Y(sh.roofY - 0.06)); ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = lw; path(g); ctx.stroke();
  }
  // mirror
  const gF = sh.glass.length ? Math.max(...sh.glass[sh.glass.length - 1].map(p => p[0])) : sh.cowlZ;
  const mz = gF - 0.1, my = sh.beltY + 0.05;
  ctx.fillStyle = shade(c.paint, -0.4); ctx.beginPath(); ctx.moveTo(X(mz - 0.05), Y(my)); ctx.lineTo(X(mz + 0.07), Y(my)); ctx.lineTo(X(mz + 0.05), Y(my + 0.07)); ctx.lineTo(X(mz - 0.04), Y(my + 0.06)); ctx.fill();
  // lights
  const fz = sh.L / 2, rz = -sh.L / 2;
  if (D.lights === 'popup') {
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = lw; const hz = fz - 0.45, hy = shapeTopAt(sh, hz);
    ctx.beginPath(); ctx.moveTo(X(hz - 0.2), Y(hy - 0.005)); ctx.lineTo(X(hz + 0.15), Y(shapeTopAt(sh, hz + 0.15) - 0.005)); ctx.stroke();
    ctx.fillStyle = '#ffb35c'; ctx.fillRect(X(fz - 0.05), Y(0.42), 0.05 * k, 0.07 * k);
  } else { const hy = shapeTopAt(sh, fz - 0.06) - 0.05; ctx.fillStyle = v.lights === 'yellow' ? '#ffd34d' : '#e8eefc'; ctx.fillRect(X(fz - 0.06), Y(hy), 0.06 * k, 0.08 * k); ctx.fillStyle = '#ffb35c'; ctx.fillRect(X(fz - 0.05), Y(hy - 0.12), 0.05 * k, 0.04 * k); }
  if (v.fogs) { ctx.fillStyle = '#ffd34d'; ctx.fillRect(X(fz - 0.04), Y(0.3), 0.045 * k, 0.05 * k); }
  // windshield banner along the top of the screen
  if (v.banner) {
    const ws = sh.up.filter(p => p[0] > sh.pillarZ && p[1] > sh.beltY && p[1] < sh.roofY - 0.005).sort((a, b) => b[1] - a[1]);
    if (ws.length) { const a = ws[0], b = ws[Math.min(ws.length - 1, 2)]; ctx.strokeStyle = '#f2efe6'; ctx.lineWidth = Math.max(2, 0.04 * k); ctx.beginPath(); ctx.moveTo(X(a[0]), Y(a[1]) + 2); ctx.lineTo(X(lerp(a[0], b[0], 0.6)), Y(lerp(a[1], b[1], 0.6)) + 2); ctx.stroke(); }
  }
  const ty = shapeTopAt(sh, rz + 0.03) - 0.06;
  ctx.fillStyle = v.tail === 'smoke' ? '#4a0910' : '#b0101c';
  if (D.tail === 'round' || D.tail === 'round4') { ctx.beginPath(); ctx.ellipse(X(rz + 0.02), Y(ty - 0.05), 0.025 * k, 0.06 * k, 0, 0, Math.PI * 2); ctx.fill(); }
  else ctx.fillRect(X(rz - 0.005), Y(ty), 0.04 * k, 0.11 * k);
  // exhaust
  ctx.fillStyle = '#8b8f97'; ctx.fillRect(X(rz - 0.04), Y(0.22), 0.14 * k, 0.05 * k);
  // body kit
  if (v.kit) {
    ctx.fillStyle = '#0d0e12';
    ctx.beginPath(); ctx.moveTo(X(fz - 0.5), Y(sh.up[sh.up.length - 1][1])); ctx.lineTo(X(fz + 0.03), Y(sh.up[sh.up.length - 1][1])); ctx.lineTo(X(fz - 0.04), Y(sh.up[sh.up.length - 1][1] - 0.06)); ctx.lineTo(X(fz - 0.5), Y(sh.up[sh.up.length - 1][1] - 0.04)); ctx.fill();
    ctx.fillRect(X(sh.wheels.zr + sh.wheels.ra), Y(sh.up[0][1]) - 1, (sh.wheels.zf - sh.wheels.zr - 2 * sh.wheels.ra) * k, 0.06 * k);
  }
  if (v.flares) for (const zc of [sh.wheels.zr, sh.wheels.zf]) {
    const rr = (sh.wheels.ra + 0.07) * k;
    ctx.strokeStyle = shade(c.paint, -0.3); ctx.lineWidth = Math.max(3, 0.07 * k); ctx.beginPath(); ctx.arc(X(zc), Y(sh.wheels.r), rr, Math.PI * 1.02, Math.PI * 1.98); ctx.stroke();
    ctx.fillStyle = '#c9ccd2'; for (let i = 0; i < 6; i++) { const a = Math.PI * (1.1 + i * 0.16); ctx.beginPath(); ctx.arc(X(zc) + Math.cos(a) * rr, Y(sh.wheels.r) + Math.sin(a) * rr, Math.max(1, 0.012 * k), 0, 7); ctx.fill(); }
  }
  // spoilers
  const wing = v.wing || (D.spoiler === 'wing' ? 'gt' : D.spoiler === 'trunk' ? 'lip' : null);
  if (D.spoiler === 'roof' && !v.wing) { ctx.fillStyle = shade(c.paint, -0.25); const rzp = sh.up.find(p => p[1] > sh.roofY - 0.05); ctx.beginPath(); ctx.moveTo(X(rzp[0] - 0.12), Y(rzp[1] + 0.02)); ctx.lineTo(X(rzp[0] + 0.2), Y(rzp[1] + 0.005)); ctx.lineTo(X(rzp[0] + 0.15), Y(rzp[1] - 0.03)); ctx.fill(); }
  else if (wing === 'gt') {
    const z0 = -sh.L / 2 + 0.12, z1 = z0 + 0.36, y0 = shapeTopAt(sh, z0 + 0.18);
    ctx.fillStyle = '#111317';
    ctx.fillRect(X(z0 + 0.08), Y(y0 + 0.2), 0.03 * k, 0.2 * k); ctx.fillRect(X(z1 - 0.1), Y(y0 + 0.2), 0.03 * k, 0.2 * k);
    ctx.beginPath(); ctx.moveTo(X(z0 - 0.05), Y(y0 + 0.2)); ctx.lineTo(X(z1 + 0.05), Y(y0 + 0.25)); ctx.lineTo(X(z1 + 0.05), Y(y0 + 0.2)); ctx.lineTo(X(z0 - 0.05), Y(y0 + 0.17)); ctx.fill();
  } else if (wing === 'boso') {
    const z0 = -sh.L / 2 + 0.22, y0 = shapeTopAt(sh, z0);
    ctx.strokeStyle = '#c9ccd2'; ctx.lineWidth = Math.max(1.5, 0.028 * k); ctx.beginPath(); ctx.moveTo(X(z0 + 0.05), Y(y0)); ctx.lineTo(X(z0 - 0.3), Y(y0 + 0.62)); ctx.moveTo(X(z0 - 0.12), Y(y0)); ctx.lineTo(X(z0 - 0.38), Y(y0 + 0.59)); ctx.stroke();
    ctx.fillStyle = shade(c.paint, -0.1); ctx.beginPath(); ctx.moveTo(X(z0 - 0.5), Y(y0 + 0.55)); ctx.lineTo(X(z0 - 0.14), Y(y0 + 0.66)); ctx.lineTo(X(z0 - 0.13), Y(y0 + 0.7)); ctx.lineTo(X(z0 - 0.5), Y(y0 + 0.6)); ctx.fill();
  } else if (wing === 'swan') {
    const z0 = -sh.L / 2 + 0.06, z1 = z0 + 0.4, y0 = shapeTopAt(sh, z0 + 0.2);
    ctx.fillStyle = '#111317'; ctx.fillRect(X(z0 - 0.04), Y(y0 + 0.42), 0.46 * k, 0.2 * k);
    ctx.fillStyle = '#1e2026'; ctx.beginPath(); ctx.moveTo(X(z0 - 0.05), Y(y0 + 0.31)); ctx.lineTo(X(z1 + 0.04), Y(y0 + 0.34)); ctx.lineTo(X(z1 + 0.04), Y(y0 + 0.3)); ctx.lineTo(X(z0 - 0.05), Y(y0 + 0.27)); ctx.fill();
    ctx.strokeStyle = '#3a3c44'; ctx.lineWidth = Math.max(1.5, 0.025 * k); ctx.beginPath(); ctx.moveTo(X(z1 - 0.02), Y(y0)); ctx.lineTo(X(z1 - 0.08), Y(y0 + 0.38)); ctx.lineTo(X(z1 - 0.2), Y(y0 + 0.33)); ctx.stroke();
  } else if (wing === 'duck') {
    const z0 = -sh.L / 2 + 0.02, y0 = shapeTopAt(sh, z0 + 0.15);
    ctx.fillStyle = shade(c.paint, -0.1); ctx.beginPath(); ctx.moveTo(X(z0 + 0.45), Y(y0)); ctx.quadraticCurveTo(X(z0 + 0.1), Y(y0 + 0.01), X(z0 - 0.03), Y(y0 + 0.1)); ctx.lineTo(X(z0 + 0.02), Y(y0 - 0.02)); ctx.fill();
  } else if (wing === 'lip') {
    const z0 = -sh.L / 2 + 0.04, y0 = shapeTopAt(sh, z0 + 0.1);
    ctx.fillStyle = shade(c.paint, -0.2); ctx.beginPath(); ctx.moveTo(X(z0), Y(y0)); ctx.lineTo(X(z0 + 0.35), Y(y0 + 0.01)); ctx.lineTo(X(z0 - 0.02), Y(y0 + 0.07)); ctx.fill();
  }
  // street-style extras
  const yLow = sh.up[sh.up.length - 1][1];
  if (v.bumper === 'deppa') { ctx.fillStyle = shade(c.paint, -0.15); ctx.beginPath(); ctx.moveTo(X(fz - 0.3), Y(yLow + 0.02)); ctx.lineTo(X(fz + 0.3), Y(yLow - 0.07)); ctx.lineTo(X(fz + 0.3), Y(yLow - 0.1)); ctx.lineTo(X(fz - 0.3), Y(yLow - 0.03)); ctx.fill(); ctx.strokeStyle = '#c9ccd2'; ctx.lineWidth = Math.max(1, 0.012 * k); ctx.beginPath(); ctx.moveTo(X(fz + 0.22), Y(yLow - 0.05)); ctx.lineTo(X(fz - 0.02), Y(yLow + 0.13)); ctx.stroke(); }
  if (v.bumper === 'aero') { ctx.fillStyle = shade(c.paint, -0.2); ctx.beginPath(); ctx.moveTo(X(fz - 0.4), Y(yLow + 0.03)); ctx.lineTo(X(fz + 0.03), Y(yLow + 0.1)); ctx.lineTo(X(fz + 0.02), Y(yLow - 0.06)); ctx.lineTo(X(fz - 0.4), Y(yLow - 0.04)); ctx.fill(); ctx.fillStyle = '#0d0e12'; ctx.fillRect(X(fz - 0.42), Y(yLow - 0.05), 0.5 * k, Math.max(2, 0.018 * k)); }
  if (v.canards) { ctx.strokeStyle = '#111317'; ctx.lineWidth = Math.max(2, 0.02 * k); for (const dy of [0.16, 0.26]) { ctx.beginPath(); ctx.moveTo(X(fz - 0.3), Y(yLow + dy + 0.04)); ctx.lineTo(X(fz - 0.12), Y(yLow + dy)); ctx.stroke(); } }
  if (v.diffuser) { ctx.fillStyle = '#111317'; ctx.beginPath(); ctx.moveTo(X(rz + 0.34), Y(sh.up[0][1])); ctx.lineTo(X(rz - 0.02), Y(sh.up[0][1] + 0.08)); ctx.lineTo(X(rz - 0.02), Y(sh.up[0][1] + 0.04)); ctx.lineTo(X(rz + 0.34), Y(sh.up[0][1] - 0.05)); ctx.fill(); }
  if (v.pipes === 'takeyari') { ctx.strokeStyle = '#d6d9de'; ctx.lineWidth = Math.max(2, 0.05 * k); ctx.lineCap = 'butt'; for (const len of [1.25, 1.05]) { ctx.beginPath(); ctx.moveTo(X(rz + 0.1), Y(0.25)); ctx.lineTo(X(rz - 0.04), Y(0.25)); ctx.lineTo(X(rz - 0.04 - len * 0.57), Y(0.25 + len * 0.82)); ctx.stroke(); } }
  if (v.pipes === 'cannon') { ctx.fillStyle = '#6a5fb0'; ctx.fillRect(X(rz - 0.12), Y(0.31), 0.3 * k, 0.13 * k); ctx.fillStyle = '#0a0a0c'; ctx.fillRect(X(rz - 0.12), Y(0.3), 0.03 * k, 0.11 * k); }
  if (v.louver) { const rg = sh.up.filter(p => p[0] < sh.pillarZ - 0.05 && p[1] > sh.beltY + 0.03 && p[1] < sh.roofY - 0.012).sort((a, b) => a[1] - b[1]); if (rg.length >= 2) { const a = rg[0], b = rg[rg.length - 1]; ctx.strokeStyle = '#0c0d10'; ctx.lineWidth = Math.max(2, 0.03 * k); for (let i = 0; i < 6; i++) { const t = (i + 0.5) / 6, z = lerp(a[0], b[0], t), y = lerp(a[1], b[1], t); ctx.beginPath(); ctx.moveTo(X(z + 0.06), Y(y + 0.01)); ctx.lineTo(X(z - 0.05), Y(y + 0.06)); ctx.stroke(); } } }
  if (v.roofscoop) { let top = 0, zt = 0; for (let z = sh.cowlZ; z > sh.pillarZ - 0.3; z -= 0.05) { const t = shapeTopAt(sh, z); if (t > top + 0.002) { top = t; zt = z; } } ctx.fillStyle = shade(c.paint, -0.15); ctx.beginPath(); ctx.moveTo(X(zt + 0.1), Y(top + 0.08)); ctx.lineTo(X(zt - 0.3), Y(top + 0.04)); ctx.lineTo(X(zt - 0.34), Y(top - 0.01)); ctx.lineTo(X(zt + 0.1), Y(top - 0.01)); ctx.fill(); }
  if (v.pod) { const pz = fz - 0.34, py = shapeTopAt(sh, pz) + 0.1; ctx.fillStyle = '#15161a'; ctx.beginPath(); ctx.ellipse(X(pz), Y(py), 0.06 * k, 0.085 * k, 0, 0, 7); ctx.fill(); ctx.fillStyle = v.lights === 'yellow' ? '#ffd34d' : '#e8eefc'; ctx.fillRect(X(pz + 0.03), Y(py + 0.07), 0.03 * k, 0.14 * k); }
  if (v.mirrors === 'fender' || (D.fenderMirror && !v.mirrors)) { const fmz = sh.wheels.zf + 0.05, fmy = shapeTopAt(sh, fmz); ctx.strokeStyle = '#c9ccd2'; ctx.lineWidth = Math.max(1, 0.012 * k); ctx.beginPath(); ctx.moveTo(X(fmz), Y(fmy)); ctx.lineTo(X(fmz), Y(fmy + 0.09)); ctx.stroke(); ctx.fillStyle = '#c9ccd2'; ctx.fillRect(X(fmz - 0.03), Y(fmy + 0.14), 0.06 * k, 0.06 * k); }
  if (v.towhook) { ctx.strokeStyle = '#d0161e'; ctx.lineWidth = Math.max(2, 0.02 * k); ctx.beginPath(); ctx.arc(X(fz + 0.03), Y(yLow + 0.1), 0.03 * k, 0, 7); ctx.stroke(); }
  // wheels
  for (const zc of [sh.wheels.zr, sh.wheels.zf]) drawWheel(ctx, X(zc), Y(sh.wheels.r), sh.wheels.r * k, v.wheel, { bbk: !!(c.parts && c.parts.brakes), front: zc === sh.wheels.zf, white: v.tirelet });
}

function drawWheel(ctx, x, y, r, style, o) {
  o = o || {};
  // tyre with a rounded sidewall and raised lettering
  const tg = ctx.createRadialGradient(x, y, r * 0.66, x, y, r);
  tg.addColorStop(0, '#060607'); tg.addColorStop(0.35, '#1d1e21'); tg.addColorStop(0.8, '#141517'); tg.addColorStop(1, '#09090a');
  ctx.fillStyle = tg; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = Math.max(1, r * 0.03); ctx.beginPath(); ctx.arc(x, y, r * 0.9, Math.PI * 1.1, Math.PI * 1.6); ctx.stroke();
  if (r > 13) {
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = o.white ? '#f2f2ee' : 'rgba(214,214,206,0.55)'; ctx.font = `700 ${Math.max(5, r * 0.13)}px ${cssVar('--f-disp')}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const word = (str, a0) => { const step = 0.115; let a = a0 - (str.length - 1) * step / 2; for (const ch of str) { ctx.save(); ctx.rotate(a); ctx.translate(0, -r * 0.83); ctx.fillText(ch, 0, 0); ctx.restore(); a += step; } };
    word('YORU RS-2', 0); word('205/50R15', Math.PI);
    ctx.restore();
  }
  const rr = r * 0.66;
  // what shows through open spokes: barrel, vented disc, caliper
  const behind = () => {
    ctx.fillStyle = '#0b0b0d'; ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill();
    const dr = rr * (o.bbk ? 0.9 : 0.8), dg = ctx.createRadialGradient(x - dr * 0.3, y - dr * 0.3, dr * 0.1, x, y, dr);
    dg.addColorStop(0, '#a3a6ab'); dg.addColorStop(0.7, '#6d7076'); dg.addColorStop(1, '#4a4c51');
    ctx.fillStyle = dg; ctx.beginPath(); ctx.arc(x, y, dr, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(30,30,34,0.55)'; ctx.lineWidth = Math.max(0.7, rr * 0.025);
    for (let i = 0; i < (o.bbk ? 12 : 0); i++) { const a = i * Math.PI / 6; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * dr * 0.55, y + Math.sin(a) * dr * 0.55); ctx.lineTo(x + Math.cos(a + 0.35) * dr * 0.92, y + Math.sin(a + 0.35) * dr * 0.92); ctx.stroke(); }
    ctx.fillStyle = '#2c2d31'; ctx.beginPath(); ctx.arc(x, y, dr * 0.45, 0, Math.PI * 2); ctx.fill();
    // caliper sits behind the axle, toward the car's centre
    if (o.tex) return;
    const ca = o.front ? Math.PI * 1.15 : Math.PI * 1.85, cw = o.bbk ? 0.62 : 0.42;
    ctx.fillStyle = o.bbk ? '#c3161d' : '#3c3e44'; ctx.beginPath(); ctx.arc(x, y, dr * 1.0, ca - cw / 2, ca + cw / 2); ctx.arc(x, y, dr * 0.6, ca + cw / 2, ca - cw / 2, true); ctx.closePath(); ctx.fill();
    if (o.bbk && rr > 12) { ctx.save(); ctx.translate(x + Math.cos(ca) * dr * 0.8, y + Math.sin(ca) * dr * 0.8); ctx.rotate(ca + Math.PI / 2); ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.max(4, rr * 0.1)}px ${cssVar('--f-disp')}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('4POT', 0, 0); ctx.restore(); }
  };
  if (style === 'mesh') {
    ctx.fillStyle = '#c8c3b4'; ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, rr * 0.92, 0, Math.PI * 2); ctx.clip();
    ctx.strokeStyle = '#6f6a5e'; ctx.lineWidth = Math.max(1, r * 0.035);
    for (let i = -6; i <= 6; i++) { ctx.beginPath(); ctx.moveTo(x + i * rr * 0.22 - rr, y - rr); ctx.lineTo(x + i * rr * 0.22 + rr, y + rr); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + i * rr * 0.22 + rr, y - rr); ctx.lineTo(x + i * rr * 0.22 - rr, y + rr); ctx.stroke(); }
    ctx.restore();
  } else if (style === 'spoke') {
    behind();
    ctx.fillStyle = '#b8823c';
    for (let i = 0; i < 5; i++) { ctx.save(); ctx.translate(x, y); ctx.rotate(i * Math.PI * 2 / 5); ctx.fillRect(-rr * 0.12, -rr * 0.95, rr * 0.24, rr * 0.95); ctx.restore(); }
    ctx.strokeStyle = '#b8823c'; ctx.lineWidth = r * 0.06; ctx.beginPath(); ctx.arc(x, y, rr * 0.95, 0, Math.PI * 2); ctx.stroke();
  } else if (style === 'dish') {
    const lip = ctx.createLinearGradient(x - rr, y - rr, x + rr, y + rr); lip.addColorStop(0, '#f4f4f4'); lip.addColorStop(0.5, '#9aa0a8'); lip.addColorStop(1, '#e8e8e8');
    ctx.fillStyle = lip; ctx.beginPath(); ctx.arc(x, y, rr * 1.02, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, rr * 0.7, 0, Math.PI * 2); ctx.clip(); behind(); ctx.restore();
    ctx.fillStyle = '#c99b3c'; for (let i = 0; i < 8; i++) { ctx.save(); ctx.translate(x, y); ctx.rotate(i * Math.PI / 4); ctx.fillRect(-rr * 0.06, -rr * 0.66, rr * 0.12, rr * 0.66); ctx.restore(); }
    ctx.fillStyle = '#d8d8d8'; for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; ctx.beginPath(); ctx.arc(x + Math.cos(a) * rr * 0.86, y + Math.sin(a) * rr * 0.86, Math.max(0.6, rr * 0.03), 0, 7); ctx.fill(); }
  } else if (style === 'white') {
    ctx.fillStyle = '#f2f2ee'; ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + Math.PI / 6; ctx.moveTo(x + Math.cos(a - 0.22) * rr * 0.34, y + Math.sin(a - 0.22) * rr * 0.34); ctx.lineTo(x + Math.cos(a - 0.3) * rr * 0.86, y + Math.sin(a - 0.3) * rr * 0.86); ctx.lineTo(x + Math.cos(a + 0.3) * rr * 0.86, y + Math.sin(a + 0.3) * rr * 0.86); ctx.lineTo(x + Math.cos(a + 0.22) * rr * 0.34, y + Math.sin(a + 0.22) * rr * 0.34); ctx.closePath(); } ctx.clip(); behind(); ctx.restore();
  } else if (style === 'te' || style === 'wat' || style === 'star') {
    behind();
    const n = style === 'te' ? 6 : style === 'wat' ? 8 : 5, col = style === 'te' ? '#3a3d44' : style === 'wat' ? '#1b1c20' : '#d0d3d8', w0 = style === 'star' ? 0.25 : style === 'te' ? 0.085 : 0.085, w1 = style === 'star' ? 0.05 : style === 'te' ? 0.065 : 0.055, rim = style === 'te' ? 0.95 : 0.84;
    ctx.fillStyle = col;
    for (let i = 0; i < n; i++) { ctx.save(); ctx.translate(x, y); ctx.rotate(i * Math.PI * 2 / n); ctx.beginPath(); ctx.moveTo(-rr * w0, -rr * 0.15); ctx.lineTo(-rr * w1, -rr * rim); ctx.lineTo(rr * w1, -rr * rim); ctx.lineTo(rr * w0, -rr * 0.15); ctx.fill(); ctx.restore(); }
    if (style === 'te') { ctx.strokeStyle = col; ctx.lineWidth = r * 0.06; ctx.beginPath(); ctx.arc(x, y, rr * 0.95, 0, Math.PI * 2); ctx.stroke(); }
    else { const lip = ctx.createLinearGradient(x - rr, y - rr, x + rr, y + rr); lip.addColorStop(0, '#f4f4f4'); lip.addColorStop(0.5, '#9aa0a8'); lip.addColorStop(1, '#e8e8e8'); ctx.strokeStyle = lip; ctx.lineWidth = rr * 0.17; ctx.beginPath(); ctx.arc(x, y, rr * 0.92, 0, Math.PI * 2); ctx.stroke(); }
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, rr * 0.24, 0, 7); ctx.fill();
  } else if (style === 'long') {
    const lg = ctx.createLinearGradient(x - rr, y - rr, x + rr, y + rr); lg.addColorStop(0, '#eceef0'); lg.addColorStop(0.5, '#a8adb5'); lg.addColorStop(1, '#dfe2e6');
    ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.beginPath(); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4, hx = x + Math.cos(a) * rr * 0.56, hy = y + Math.sin(a) * rr * 0.56; ctx.moveTo(hx + rr * 0.19, hy); ctx.arc(hx, hy, rr * 0.19, 0, Math.PI * 2); } ctx.clip(); behind(); ctx.restore();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = Math.max(1, rr * 0.03); ctx.beginPath(); ctx.arc(x, y, rr * 0.82, 0, 7); ctx.stroke();
  } else if (style === 'fan') {
    ctx.fillStyle = '#d9dce0'; ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#6a7078'; ctx.lineWidth = Math.max(1, rr * 0.07);
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * rr * 0.32, y + Math.sin(a) * rr * 0.32); ctx.quadraticCurveTo(x + Math.cos(a + 0.35) * rr * 0.7, y + Math.sin(a + 0.35) * rr * 0.7, x + Math.cos(a + 0.6) * rr * 0.92, y + Math.sin(a + 0.6) * rr * 0.92); ctx.stroke(); }
  } else {
    ctx.fillStyle = '#5b5e66'; ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8c9099'; ctx.beginPath(); ctx.arc(x, y, rr * 0.7, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3, hx = x + Math.cos(a) * rr * 0.48, hy = y + Math.sin(a) * rr * 0.48; ctx.moveTo(hx + rr * 0.11, hy); ctx.arc(hx, hy, rr * 0.11, 0, Math.PI * 2); } ctx.clip(); behind(); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2); ctx.restore();
  }
  ctx.fillStyle = '#1a1b1f'; ctx.beginPath(); ctx.arc(x, y, rr * 0.18, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = Math.max(1, rr * 0.035); ctx.beginPath(); ctx.arc(x, y, rr * 0.99, Math.PI * 1.05, Math.PI * 1.55); ctx.stroke();
  ctx.fillStyle = 'rgba(200,200,205,0.75)'; for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.4; ctx.beginPath(); ctx.arc(x + Math.cos(a) * rr * 0.27, y + Math.sin(a) * rr * 0.27, Math.max(0.6, rr * 0.035), 0, 7); ctx.fill(); }
}

const LIGHTS = { l_cold: '#cfe6ff', l_warm: '#ffd9a0', l_blue: '#5aa8ff', l_violet: '#b77bff' };
const Garage = {
  cv: null, ctx: null, slots: [], decorMode: false, raf: 0, t: 0, dirty: true, visible: true,
  init() {
    this.cv = $('#garageCv'); this.ctx = this.cv.getContext('2d');
    new ResizeObserver(() => { this.dirty = true; }).observe(this.cv);
    this.cv.addEventListener('click', (e) => this.tap(e));
    const loop = (t) => { this.raf = requestAnimationFrame(loop); if (!this.visible) return; if (this.dirty || t - this.t > 90) { this.t = t; this.draw(t); } };
    this.raf = requestAnimationFrame(loop);
  },
  tap(e) {
    if (!this.decorMode) return;
    const r = this.cv.getBoundingClientRect(); const x = e.clientX - r.left, y = e.clientY - r.top;
    const hit = this.slots.find(s => x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h);
    if (hit) UI.decorPicker(hit.key);
  },
  draw(t) {
    this.dirty = false;
    const cv = this.cv, dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = cv.clientWidth, H = cv.clientHeight; if (!W || !H) return;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const ctx = this.ctx; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const u = Math.min(W, H * 1.75) / 1000;
    const portrait = W < H;
    const floorY = H * (portrait ? 0.55 : 0.64);
    const D = S.decor, light = LIGHTS[D.light] || LIGHTS.l_cold;
    const flick = 0.92 + 0.08 * Math.sin(t / 37) * Math.sin(t / 113);

    // back wall: concrete blocks
    ctx.fillStyle = '#23262c'; ctx.fillRect(0, 0, W, floorY);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1;
    const bh = 26 * u + 8, bw = bh * 2.2;
    for (let y = 0, r = 0; y < floorY; y += bh, r++) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      for (let x = (r % 2) * bw / 2; x < W; x += bw) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + bh); ctx.stroke(); }
    }
    // shutter door
    const sx = W * 0.27, sw = W * 0.46, sy = floorY - Math.min(H * 0.48, 330 * u + 60);
    ctx.fillStyle = '#3a3e46'; ctx.fillRect(sx, sy, sw, floorY - sy);
    for (let y = sy; y < floorY; y += 9 * u + 4) { ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(sx, y, sw, 2); ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(sx, y + 2, sw, 1); }
    ctx.fillStyle = '#16181c'; ctx.fillRect(sx - 6, sy - 10, sw + 12, 12); ctx.fillRect(sx - 8, sy, 8, floorY - sy); ctx.fillRect(sx + sw, sy, 8, floorY - sy);
    // yellow-black hazard strip
    ctx.save(); ctx.beginPath(); ctx.rect(sx, floorY - 10, sw, 10); ctx.clip();
    for (let x = sx - 20; x < sx + sw; x += 20) { ctx.fillStyle = '#d9a21b'; ctx.beginPath(); ctx.moveTo(x, floorY); ctx.lineTo(x + 10, floorY - 10); ctx.lineTo(x + 20, floorY - 10); ctx.lineTo(x + 10, floorY); ctx.fill(); }
    ctx.restore();

    // ceiling tubes and light wash
    const wash = ctx.createLinearGradient(0, 0, 0, floorY);
    wash.addColorStop(0, hexA(light, 0.22 * flick)); wash.addColorStop(1, hexA(light, 0.02));
    ctx.fillStyle = wash; ctx.fillRect(0, 0, W, floorY);
    for (const tx of [0.3, 0.7]) {
      ctx.shadowColor = light; ctx.shadowBlur = 24 * flick; ctx.fillStyle = '#f7fbff';
      ctx.fillRect(W * tx - 70 * u, 10, 140 * u, 6); ctx.shadowBlur = 0;
    }

    this.slots = [];
    const slot = (key, x, y, w, h) => { this.slots.push({ key, x, y, w, h }); };
    // posters
    const pw = Math.max(54, 92 * u), ph = pw * 1.38, py = Math.max(62, sy + 6);
    const plx = Math.max(10, sx - pw - W * 0.06), prx = Math.min(W - pw - 10, sx + sw + W * 0.06);
    drawPoster(ctx, D.posterL, plx, py, pw, ph); slot('posterL', plx, py, pw, ph);
    drawPoster(ctx, D.posterR, prx, py, pw, ph); slot('posterR', prx, py, pw, ph);
    // neon over shutter
    const nx = W / 2, ny = Math.max(46, sy - 24 * u - 18);
    drawNeon(ctx, D.neon, nx, ny, u, flick); slot('neon', nx - 110 * u - 20, ny - 34 * u - 14, 220 * u + 40, 48 * u + 22);
    // shelf
    const shx = Math.max(6, plx - 10), shy = py + ph + 16 * u + 6, shw = pw + 20;
    drawShelf(ctx, D.shelf, shx, shy, shw, u); slot('shelf', shx, shy - 46 * u - 10, shw, 56 * u + 14);

    // floor
    drawFloor(ctx, D.floor, W, H, floorY, light, flick);
    // floor corner items
    const fy = floorY + (H - floorY) * (portrait ? 0.3 : 0.55);
    drawFloorItem(ctx, D.floorL, W * 0.02, fy, u, 'L'); slot('floorL', W * 0.01, fy - 190 * u - 20, Math.max(80, 190 * u), 190 * u + 26);
    drawFloorItem(ctx, D.floorR, W * 0.98, fy, u, 'R'); slot('floorR', W * 0.99 - Math.max(80, 190 * u), fy - 190 * u - 20, Math.max(80, 190 * u), 190 * u + 26);
    slot('floor', W * 0.3, H - Math.max(36, (H - floorY) * 0.28), W * 0.4, Math.max(30, (H - floorY) * 0.24));
    slot('light', W * 0.3 - 70 * u, 2, W * 0.4 + 140 * u, 30);

    // car
    const c = car();
    const len = portrait ? W * 0.86 : Math.min(W * 0.62, (H - 40) * 1.3, 760 * u + 120);
    drawCarSide(ctx, c, W / 2, floorY + (H - floorY) * (portrait ? 0.36 : 0.52), len);
    // reflection of tubes on the car roof area
    if (this.decorMode) {
      ctx.save(); ctx.setLineDash([6, 5]); ctx.lineWidth = 2; ctx.strokeStyle = '#4ee6d4';
      for (const s of this.slots) { ctx.strokeRect(s.x, s.y, s.w, s.h); }
      ctx.restore();
    }
    // vignette
    const vg = ctx.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.3, W / 2, H * 0.55, Math.max(W, H) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  }
};
function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }

function drawPoster(ctx, id, x, y, w, h) {
  if (!id) { ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x, y, w, h); return; }
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(3, 4, w, h);
  if (id === 'p_touge') {
    ctx.fillStyle = '#e9e0c8'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#141210'; ctx.font = `${w * 0.62}px ${cssVar('--f-jp')}`; ctx.textAlign = 'center'; ctx.fillText('峠', w / 2, h * 0.58);
    ctx.fillStyle = '#b3261e'; ctx.fillRect(w * 0.72, h * 0.74, w * 0.14, w * 0.14);
  } else if (id === 'p_night') {
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0b1230'); g.addColorStop(1, '#2a1630'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#ff3b4a'; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(w * 0.1, h * (0.75 - i * 0.03)); ctx.bezierCurveTo(w * 0.4, h * 0.5, w * 0.6, h * 0.65, w * 0.95, h * (0.3 - i * 0.03)); ctx.stroke(); }
    ctx.strokeStyle = '#ffd9a0'; ctx.beginPath(); ctx.moveTo(w * 0.1, h * 0.82); ctx.bezierCurveTo(w * 0.4, h * 0.6, w * 0.6, h * 0.72, w * 0.95, h * 0.4); ctx.stroke();
    ctx.fillStyle = '#ffa733'; ctx.font = `800 italic ${w * 0.17}px ${cssVar('--f-disp')}`; ctx.fillText('NIGHT RUN', w * 0.08, h * 0.17); ctx.font = `700 ${w * 0.13}px ${cssVar('--f-disp')}`; ctx.fillText("'97", w * 0.08, h * 0.3);
  } else if (id === 'p_kami') {
    ctx.fillStyle = '#ffd400'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.moveTo(w * 0.58, h * 0.1); ctx.lineTo(w * 0.28, h * 0.52); ctx.lineTo(w * 0.5, h * 0.52); ctx.lineTo(w * 0.38, h * 0.86); ctx.lineTo(w * 0.74, h * 0.4); ctx.lineTo(w * 0.52, h * 0.4); ctx.closePath(); ctx.fill();
    ctx.font = `800 ${w * 0.15}px ${cssVar('--f-disp')}`; ctx.textAlign = 'center'; ctx.fillText('KAMINARI', w / 2, h * 0.96);
  } else if (id === 'p_rotor') {
    ctx.fillStyle = '#d8dfe6'; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = '#1d3d73'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(w / 2, h * 0.45, w * 0.38, w * 0.3, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 3; const px = w / 2 + Math.cos(a) * w * 0.26, py = h * 0.45 + Math.sin(a) * w * 0.26; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.closePath(); ctx.fillStyle = 'rgba(29,61,115,0.25)'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1d3d73'; ctx.font = `700 ${w * 0.12}px ${cssVar('--f-disp')}`; ctx.textAlign = 'center'; ctx.fillText('ROTARY', w / 2, h * 0.9);
  } else if (id === 'p_map') {
    ctx.fillStyle = '#e3dcc4'; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = '#7d6b4a'; ctx.lineWidth = 0.8;
    for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.5, w * 0.08 * i, h * 0.06 * i, 0.3, 0, Math.PI * 2); ctx.stroke(); }
    ctx.strokeStyle = '#b3261e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(w * 0.15, h * 0.9); ctx.lineTo(w * 0.4, h * 0.7); ctx.lineTo(w * 0.25, h * 0.55); ctx.lineTo(w * 0.6, h * 0.4); ctx.lineTo(w * 0.45, h * 0.25); ctx.lineTo(w * 0.8, h * 0.1); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(0, 0, w, h * 0.5);
  ctx.restore();
}
function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n) || 'sans-serif'; }

function drawNeon(ctx, id, x, y, u, f) {
  if (!id) return;
  const map = { n_touge: ['峠', '#ff5fb3', 'jp'], n_yoru: ['夜', '#ff9a2e', 'jp'], n_garage: ['GARAGE', '#4ee6d4', 'disp'] };
  const [txt, col, font] = map[id];
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = font === 'jp' ? `${46 * u + 14}px ${cssVar('--f-jp')}` : `800 italic ${42 * u + 12}px ${cssVar('--f-disp')}`;
  ctx.shadowColor = col; ctx.shadowBlur = 26 * f; ctx.fillStyle = col; ctx.globalAlpha = 0.85 + 0.15 * f;
  ctx.fillText(txt, x, y); ctx.shadowBlur = 8; ctx.fillStyle = '#fff6fb'; ctx.globalAlpha = 0.55; ctx.fillText(txt, x, y);
  ctx.restore();
}
function drawShelf(ctx, id, x, y, w, u) {
  ctx.fillStyle = '#4a3a28'; ctx.fillRect(x, y, w, 6);
  if (!id) return;
  if (id === 's_oil') { const cols = ['#d33', '#e8c21b', '#1c58b8', '#d33', '#2a2a2a']; for (let i = 0; i < 5; i++) { const cw = w / 6; ctx.fillStyle = cols[i]; ctx.fillRect(x + 4 + i * cw * 1.15, y - 34 * u - 6, cw * 0.9, 34 * u + 6); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(x + 4 + i * cw * 1.15, y - 22 * u - 2, cw * 0.9, 5 * u + 2); } }
  if (id === 's_trophy') { const n = Math.max(1, Object.keys(S.wins).length); for (let i = 0; i < Math.min(5, n); i++) { const tx = x + 8 + i * w / 5.2; ctx.fillStyle = '#d4a63a'; ctx.beginPath(); ctx.moveTo(tx, y - 40 * u); ctx.lineTo(tx + 18 * u + 4, y - 40 * u); ctx.lineTo(tx + 10 * u + 2, y - 18 * u); ctx.fill(); ctx.fillRect(tx + 7 * u + 1, y - 18 * u, 6 * u, 14 * u); ctx.fillRect(tx + 2, y - 5 * u, 16 * u, 5 * u); } }
  if (id === 's_parts') { ctx.fillStyle = '#6b6e75'; ctx.beginPath(); ctx.arc(x + w * 0.3, y - 18 * u, 16 * u + 2, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#2d2f33'; ctx.beginPath(); ctx.arc(x + w * 0.3, y - 18 * u, 7 * u, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#8a8478'; ctx.fillRect(x + w * 0.55, y - 26 * u, w * 0.38, 26 * u); }
}
function drawFloor(ctx, id, W, H, fy, light, f) {
  const g = ctx.createLinearGradient(0, fy, 0, H);
  const base = id === 'fl_epoxy' ? ['#4a4e56', '#2c2f35'] : ['#3b3a37', '#1f1e1c'];
  g.addColorStop(0, base[0]); g.addColorStop(1, base[1]); ctx.fillStyle = g; ctx.fillRect(0, fy, W, H - fy);
  if (id === 'fl_checker') {
    const rows = 7; let prevY = fy;
    for (let r = 1; r <= rows; r++) {
      const t = r / rows, yy = fy + (H - fy) * t * t * 0.9 + (H - fy) * t * 0.1;
      const cols = 14, wTop = W * (0.6 + 0.4 * ((r - 1) / rows)), wBot = W * (0.6 + 0.4 * t);
      for (let cIdx = 0; cIdx < cols; cIdx++) {
        if ((cIdx + r) % 2) continue;
        const xt0 = W / 2 - wTop / 2 * 1.6 + cIdx * wTop * 1.6 / cols, xt1 = xt0 + wTop * 1.6 / cols;
        const xb0 = W / 2 - wBot / 2 * 1.6 + cIdx * wBot * 1.6 / cols, xb1 = xb0 + wBot * 1.6 / cols;
        ctx.fillStyle = 'rgba(236,230,214,0.32)'; ctx.beginPath(); ctx.moveTo(xt0, prevY); ctx.lineTo(xt1, prevY); ctx.lineTo(xb1, yy); ctx.lineTo(xb0, yy); ctx.fill();
      }
      prevY = yy;
    }
  } else if (id !== 'fl_epoxy') {
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (let i = 0; i < 40; i++) { const x = (i * 197) % W, y = fy + ((i * 61) % 100) / 100 * (H - fy); ctx.beginPath(); ctx.ellipse(x, y, 20 + (i % 5) * 9, 4 + (i % 3) * 2, 0, 0, Math.PI * 2); ctx.fill(); }
  }
  const pool = ctx.createRadialGradient(W / 2, fy + (H - fy) * 0.45, 10, W / 2, fy + (H - fy) * 0.45, W * 0.45);
  pool.addColorStop(0, hexA(light, (id === 'fl_epoxy' ? 0.22 : 0.12) * f)); pool.addColorStop(1, hexA(light, 0));
  ctx.fillStyle = pool; ctx.fillRect(0, fy, W, H - fy);
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, fy, W, 3);
}
function drawFloorItem(ctx, id, x, y, u, side) {
  if (!id) return;
  const s = side === 'L' ? 1 : -1;
  const X = (v) => x + s * v;
  if (id === 'f_tools') {
    const w = 120 * u + 30, h = 150 * u + 30; ctx.fillStyle = '#b3141e'; ctx.fillRect(Math.min(X(0), X(w)), y - h, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; for (let i = 1; i < 6; i++) ctx.fillRect(Math.min(X(0), X(w)) + 4, y - h + i * h / 6, w - 8, 2);
    ctx.fillStyle = '#ddd'; for (let i = 0; i < 6; i++) ctx.fillRect(Math.min(X(0), X(w)) + w * 0.35, y - h + i * h / 6 + h / 12 - 1, w * 0.3, 3);
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(Math.min(X(0), X(w)) + 10, y + 4, 6, 0, 7); ctx.arc(Math.min(X(0), X(w)) + w - 10, y + 4, 6, 0, 7); ctx.fill();
  } else if (id === 'f_tires') {
    const r = 46 * u + 12;
    for (let i = 0; i < 4; i++) { const cy = y - r * 0.32 - i * r * 0.48; ctx.fillStyle = '#141416'; ctx.beginPath(); ctx.ellipse(X(r + 4), cy, r, r * 0.28, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#26262a'; ctx.fillRect(X(r + 4) - r, cy - r * 0.24, r * 2, r * 0.24); ctx.fillStyle = '#0a0a0b'; ctx.beginPath(); ctx.ellipse(X(r + 4), cy - r * 0.24, r * 0.55, r * 0.14, 0, 0, Math.PI * 2); ctx.fill(); }
  } else if (id === 'f_engine') {
    const w = 110 * u + 30; const bx = Math.min(X(0), X(w)) + 6;
    ctx.fillStyle = '#5a5d64'; ctx.fillRect(bx + w * 0.15, y - 60 * u, 6, 60 * u); ctx.fillRect(bx + w * 0.75, y - 60 * u, 6, 60 * u); ctx.fillRect(bx, y - 4, w, 4);
    ctx.fillStyle = '#7b7f87'; ctx.fillRect(bx + w * 0.05, y - 130 * u - 10, w * 0.9, 72 * u + 10);
    ctx.fillStyle = '#b3141e'; ctx.fillRect(bx + w * 0.05, y - 146 * u - 10, w * 0.9, 18 * u);
    ctx.fillStyle = '#3a3c41'; for (let i = 0; i < 4; i++) ctx.fillRect(bx + w * 0.12 + i * w * 0.2, y - 120 * u - 6, w * 0.12, 28 * u);
  } else if (id === 'f_vend') {
    const w = 110 * u + 26, h = 220 * u + 30, bx = Math.min(X(0), X(w));
    ctx.fillStyle = '#e8e8ec'; ctx.fillRect(bx, y - h, w, h);
    ctx.shadowColor = '#bfe3ff'; ctx.shadowBlur = 18; ctx.fillStyle = '#d9efff'; ctx.fillRect(bx + 8, y - h + 10, w - 16, h * 0.45); ctx.shadowBlur = 0;
    const cols = ['#d33', '#1c58b8', '#e8c21b', '#2b8a3e']; for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) { ctx.fillStyle = cols[(i + r) % 4]; ctx.fillRect(bx + 12 + i * (w - 24) / 4, y - h + 18 + r * h * 0.14, (w - 24) / 5, h * 0.1); }
    ctx.fillStyle = '#26282d'; ctx.fillRect(bx + 10, y - h * 0.28, w - 20, h * 0.12);
  } else if (id === 'f_sofa') {
    const w = 170 * u + 40, bx = Math.min(X(0), X(w));
    ctx.fillStyle = '#4a2f2a'; ctx.fillRect(bx, y - 90 * u - 16, w, 50 * u + 8); ctx.fillStyle = '#5b3a33'; ctx.fillRect(bx + 6, y - 46 * u - 8, w - 12, 34 * u + 8);
    ctx.fillStyle = '#3b2521'; ctx.fillRect(bx - 4, y - 70 * u - 12, 14, 70 * u + 12); ctx.fillRect(bx + w - 10, y - 70 * u - 12, 14, 70 * u + 12);
  } else if (id === 'f_arcade') {
    const w = 96 * u + 26, h = 230 * u + 30, bx = Math.min(X(0), X(w));
    ctx.fillStyle = '#16161c'; ctx.fillRect(bx, y - h, w, h);
    ctx.fillStyle = '#ff5fb3'; ctx.fillRect(bx, y - h, w, h * 0.12);
    ctx.shadowColor = '#4ee6d4'; ctx.shadowBlur = 16; ctx.fillStyle = '#123a3a'; ctx.fillRect(bx + 10, y - h * 0.82, w - 20, h * 0.3); ctx.shadowBlur = 0;
    ctx.fillStyle = '#4ee6d4'; ctx.fillRect(bx + 18, y - h * 0.7, (w - 36) * 0.5, 3); ctx.fillRect(bx + 22, y - h * 0.62, (w - 36) * 0.7, 3);
    ctx.fillStyle = '#2b2b33'; ctx.fillRect(bx - 4, y - h * 0.46, w + 8, h * 0.08);
    ctx.fillStyle = '#d33'; ctx.beginPath(); ctx.arc(bx + w * 0.3, y - h * 0.44, 5, 0, 7); ctx.fill(); ctx.fillStyle = '#e8c21b'; ctx.beginPath(); ctx.arc(bx + w * 0.6, y - h * 0.44, 5, 0, 7); ctx.fill();
  }
}
