// ===================== PART ILLUSTRATIONS (studio "product shots" for the magazine and the workshop) =====================
function partArt(ctx, p, W, H, opts) {
  opts = opts || {};
  const cx = W / 2, cy = H / 2, s = Math.min(W, H) / 200; // design on a 200-unit square
  ctx.save();
  if (!opts.bare) {
    const bg = ctx.createRadialGradient(cx, cy * 0.8, 10, cx, cy, Math.max(W, H) * 0.75);
    bg.addColorStop(0, '#f7f3ea'); bg.addColorStop(1, '#cfc8b8'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(cx, cy + 70 * s, 70 * s, 10 * s, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.translate(cx, cy); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const steel = (x0, y0, x1, y1, a = '#e9ecf0', b = '#7c838d') => { const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, b); g.addColorStop(0.45, a); g.addColorStop(1, b); return g; };
  const rect = (x, y, w, h, f, r = 3) => { ctx.fillStyle = f; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); ctx.fill(); };
  const circ = (x, y, r, f) => { ctx.fillStyle = f; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); };
  const line = (pts, w, c) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.stroke(); };
  const coil = (x, y0, y1, r, n, col) => { ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.beginPath(); for (let i = 0; i <= n * 16; i++) { const t = i / (n * 16), y = y0 + (y1 - y0) * t, xx = x + Math.sin(t * n * Math.PI * 2) * r; i ? ctx.lineTo(xx, y) : ctx.moveTo(xx, y); } ctx.stroke(); };
  const label = (txt, x, y, size, col) => { ctx.fillStyle = col; ctx.font = `800 italic ${size}px ${cssVar('--f-disp')}`; ctx.textAlign = 'center'; ctx.fillText(txt, x, y); };
  const id = p.id, slot = p.slot;
  switch (slot) {
    case 'intake': {
      if (id === 'intake2') { line([[-80, 20], [-30, 20], [10, -10], [40, -10]], 22, steel(0, 0, 0, 30, '#f2f2f2', '#9aa0a8')); }
      ctx.save(); ctx.rotate(-0.15);
      const g = ctx.createLinearGradient(0, -40, 0, 40); g.addColorStop(0, '#e23b3b'); g.addColorStop(0.5, '#ff7a6a'); g.addColorStop(1, '#8e1414');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(30, -42); ctx.lineTo(90, -28); ctx.lineTo(90, 28); ctx.lineTo(30, 42); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1.5; for (let x = 36; x < 90; x += 6) { ctx.beginPath(); ctx.moveTo(x, -40 + (x - 30) * 0.22); ctx.lineTo(x, 40 - (x - 30) * 0.22); ctx.stroke(); }
      rect(18, -44, 14, 88, steel(0, -44, 0, 44)); rect(84, -30, 12, 60, '#2a2a2e'); ctx.restore();
      label('KAMINARI', 60, 70, 13, '#b3141e'); break;
    }
    case 'header': {
      const turbo = id === 'header2';
      for (let i = 0; i < 4; i++) { const x = -70 + i * 24; line([[x, -60], [x, -10], [x + (turbo ? 40 - i * 8 : 20 - i * 6), 30], [turbo ? 20 : 10, 60]], 12, steel(x - 6, 0, x + 6, 0, '#f1f1f1', '#8a7a62')); }
      rect(-82, -72, 96, 14, steel(-82, 0, 14, 0)); if (turbo) circ(30, 55, 22, steel(10, 40, 50, 70, '#c9c9c9', '#6b5d4b'));
      break;
    }
    case 'exhaust': {
      line([[-95, 30], [-40, 30], [-20, 10]], 12, steel(0, 22, 0, 38));
      const g = steel(0, -30, 0, 30, '#ffffff', '#8d939c'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(10, 0, 50, 30, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = steel(0, -18, 0, 18, '#f6f6f6', '#6f757e'); ctx.beginPath(); ctx.ellipse(70, 0, 14, id === 'exhaust2' ? 22 : 17, 0, 0, Math.PI * 2); ctx.fill(); circ(72, 0, id === 'exhaust2' ? 15 : 11, '#1c1c20');
      label('RONIN', 8, 6, 14, '#333'); break;
    }
    case 'cam': {
      rect(-90, -6, 180, 12, steel(0, -6, 0, 6));
      for (let i = 0; i < 8; i++) { ctx.save(); ctx.translate(-75 + i * 21, 0); ctx.rotate(i * 0.8); ctx.fillStyle = steel(-8, -14, 8, 14); ctx.beginPath(); ctx.ellipse(0, -3, 8, 14, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
      circ(-95, 0, 18, steel(-110, -18, -80, 18)); circ(-95, 0, 5, '#333'); break;
    }
    case 'ecu': {
      rect(-80, -55, 160, 110, '#2b2d33', 6); rect(-72, -47, 144, 94, '#36393f', 4);
      rect(-60, -30, 90, 30, '#e8e4d8', 2); label('F-MAP', -15, -9, 18, '#1b1b1f');
      for (let i = 0; i < 14; i++) rect(-66 + i * 9, 40, 5, 14, '#c9a43a', 1);
      rect(40, -36, 26, 26, '#111', 2); rect(40, 2, 26, 18, '#111', 2); circ(-56, 22, 4, '#7dff9a'); break;
    }
    case 'flywheel': case 'clutch': {
      circ(0, 0, 75, steel(-75, -75, 75, 75, '#e8e8ea', '#6a7078'));
      if (slot === 'flywheel') { ctx.strokeStyle = '#555'; ctx.lineWidth = 4; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.arc(0, 0, 72, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; circ(Math.cos(a) * 45, Math.sin(a) * 45, 9, '#d8d4c8'); } }
      else { circ(0, 0, 60, '#3a2c26'); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; ctx.save(); ctx.rotate(a); rect(28, -7, 22, 14, '#d0a060', 3); ctx.restore(); } coil(0, -20, 20, 4, 3, '#c9cdd4'); }
      circ(0, 0, 18, '#2a2a2e'); circ(0, 0, 8, '#666'); break;
    }
    case 'turbo': {
      const big = id === 'turbo28' ? 1.15 : id === 'turbo22' ? 1.05 : 0.95;
      ctx.scale(big, big);
      ctx.fillStyle = steel(-80, -60, 0, 40, '#e9eaec', '#80868f'); ctx.beginPath();
      for (let a = 0; a < Math.PI * 2.2; a += 0.1) { const r = 25 + a * 7.5; ctx.lineTo(-25 + Math.cos(a) * r, -5 + Math.sin(a) * r); } ctx.closePath(); ctx.fill();
      circ(-25, -5, 22, '#1c1c20'); for (let i = 0; i < 10; i++) { ctx.save(); ctx.translate(-25, -5); ctx.rotate(i * 0.63); rect(4, -2, 16, 4, '#9aa0a8', 1); ctx.restore(); }
      ctx.fillStyle = steel(20, -40, 90, 40, '#c8b9a2', '#5a4a38'); ctx.beginPath(); ctx.arc(45, 5, 42, 0, Math.PI * 2); ctx.fill(); circ(45, 5, 18, '#2a2420');
      rect(-15, -78, 26, 30, steel(-15, 0, 11, 0)); if (id === 'turbokit') { line([[60, 40], [90, 70], [95, 85]], 10, steel(0, 0, 10, 10)); line([[-60, 50], [-90, 80]], 14, '#2d2d30'); }
      label(TURBOS[p.fx.turbo].name, 0, 92, 16, '#b3141e'); break;
    }
    case 'boost': {
      rect(-60, -40, 120, 80, '#1c1d22', 8); rect(-48, -26, 96, 34, '#0c1a10', 3);
      ctx.fillStyle = '#7dff9a'; ctx.font = `28px ${cssVar('--f-crt')}`; ctx.textAlign = 'center'; ctx.fillText('0.85', 0, 0);
      circ(-30, 24, 7, '#ffa733'); circ(0, 24, 7, '#444'); circ(30, 24, 7, '#444'); line([[60, 0], [95, 20], [100, 60]], 4, '#222'); break;
    }
    case 'ic': {
      rect(-90, -40, 180, 80, '#8b9099', 4); ctx.strokeStyle = '#5c616a'; ctx.lineWidth = 1.5;
      for (let x = -84; x < 86; x += 5) { ctx.beginPath(); ctx.moveTo(x, -36); ctx.lineTo(x, 36); ctx.stroke(); }
      rect(-100, -46, 14, 92, steel(-100, 0, -86, 0)); rect(86, -46, 14, 92, steel(86, 0, 100, 0)); break;
    }
    case 'inj': {
      for (let i = 0; i < 4; i++) { const x = -60 + i * 40; rect(x - 8, -50, 16, 70, steel(x - 8, 0, x + 8, 0, '#f0f0f0', '#5f6670'), 4); rect(x - 10, -64, 20, 16, '#1d1d22', 3); rect(x - 3, 20, 6, 22, '#9aa0a8', 1); rect(x - 9, -30, 18, 6, '#c3121f', 2); }
      break;
    }
    case 'pump': { rect(-30, -70, 60, 130, steel(-30, 0, 30, 0, '#f2f2f2', '#6b717a'), 12); rect(-18, -84, 36, 16, '#1d1d22', 3); rect(-6, 60, 12, 20, '#9aa0a8'); label('255', 0, 8, 22, '#1d4fa3'); break; }
    case 'lsd': case 'final': {
      circ(0, 0, 66, steel(-66, -66, 66, 66, '#d9dade', '#4f555e'));
      ctx.strokeStyle = '#3c4048'; ctx.lineWidth = 6; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.arc(0, 0, 62, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      circ(0, 0, 34, '#2b2e34'); circ(0, 0, 14, '#9aa0a8');
      if (slot === 'lsd') label(p.fx.lsd.replace('way', '-WAY').toUpperCase(), 0, 95, 18, '#b3141e'); else label('4.3 / 4.8', 0, 95, 18, '#333'); break;
    }
    case 'susp': {
      const co = !!p.fx.coilover;
      if (co) { rect(-10, -90, 20, 150, steel(-10, 0, 10, 0, '#f4f4f4', '#7a808a')); rect(-16, 20, 32, 70, '#c3121f', 4); coil(0, -70, 30, 22, 6, '#ffd400'); rect(-28, -92, 56, 10, '#333', 2); rect(-26, 26, 52, 8, '#555', 2); }
      else { coil(-35, -70, 70, 26, 6, '#c3121f'); coil(40, -70, 70, 26, 6, '#c3121f'); }
      break;
    }
    case 'arb': { line([[-80, 60], [-70, -30], [70, -30], [80, 60]], 12, '#1d4fa3'); for (const x of [-40, 40]) rect(x - 10, -40, 20, 20, '#222', 3); break; }
    case 'camber': { circ(0, 0, 60, steel(-60, -60, 60, 60)); circ(0, 0, 22, '#2b2e34'); ctx.strokeStyle = '#2b2e34'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0, 0, 40, -0.6, 0.6); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 40, Math.PI - 0.6, Math.PI + 0.6); ctx.stroke(); for (let i = 0; i < 3; i++) { const a = i * 2.09 + 1.57; circ(Math.cos(a) * 48, Math.sin(a) * 48, 6, '#9aa0a8'); } break; }
    case 'strut': { line([[-90, 20], [-60, -20], [60, -20], [90, 20]], 10, steel(0, -30, 0, -10, '#f5f5f5', '#6f757e')); for (const x of [-90, 90]) circ(x, 22, 18, '#2b2e34'); rect(-14, -28, 28, 16, '#c3121f', 3); break; }
    case 'pads': { for (const x of [-38, 38]) { rect(x - 30, -40, 60, 80, '#5d5a55', 10); rect(x - 26, -36, 52, 60, '#2b2a28', 8); } label('HOSHI', 0, 70, 16, '#1d4fa3'); break; }
    case 'brakes': { circ(-10, 0, 72, steel(-80, -70, 60, 70, '#e3e5e8', '#808690')); for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12; line([[-10 + Math.cos(a) * 30, Math.sin(a) * 30], [-10 + Math.cos(a) * 66, Math.sin(a) * 66]], 1.5, 'rgba(0,0,0,0.25)'); } circ(-10, 0, 26, '#4d525a'); ctx.save(); ctx.translate(-10, 0); ctx.rotate(-0.5); rect(40, -42, 34, 84, '#c3121f', 12); label('4POT', 57, 4, 11, '#fff'); ctx.restore(); break; }
    case 'hbrake': { rect(-14, -10, 28, 90, '#1f1f24', 4); line([[0, -10], [40, -85]], 14, '#2b2d33'); rect(28, -96, 26, 22, '#c3121f', 6); break; }
    case 'tires': {
      circ(0, 0, 80, '#151517'); circ(0, 0, 50, '#7c828a'); circ(0, 0, 44, '#a3a8af'); circ(0, 0, 10, '#222');
      ctx.fillStyle = id === 'tire2' ? '#ffd400' : '#e8e8e8'; ctx.font = `800 13px ${cssVar('--f-disp')}`; ctx.textAlign = 'center';
      for (let i = 0; i < 2; i++) { ctx.save(); ctx.rotate(-1.2 + i * Math.PI); ctx.fillText('MICHIRU', 0, -60); ctx.restore(); }
      break;
    }
    case 'wheels': { ctx.scale(1 / s, 1 / s); drawWheel(ctx, 0, 0, 80 * s, p.fx.wheel); break; }
    case 'cage': { ctx.strokeStyle = '#d6d9de'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-80, 70); ctx.lineTo(-60, -60); ctx.lineTo(60, -60); ctx.lineTo(80, 70); ctx.moveTo(-60, -60); ctx.lineTo(70, 40); ctx.moveTo(-70, 10); ctx.lineTo(74, 10); ctx.stroke(); break; }
    case 'seat': { ctx.fillStyle = '#1c1d22'; ctx.beginPath(); ctx.moveTo(-40, 80); ctx.lineTo(-50, -60); ctx.quadraticCurveTo(-40, -95, 0, -95); ctx.quadraticCurveTo(40, -95, 50, -60); ctx.lineTo(40, 80); ctx.closePath(); ctx.fill(); rect(-14, -80, 28, 18, '#3a3c42', 4); rect(-30, -40, 60, 90, '#c3121f', 10); rect(-22, -32, 44, 74, '#1c1d22', 8); break; }
    case 'interior': { ctx.fillStyle = '#5b4a3e'; ctx.beginPath(); ctx.moveTo(-80, 60); ctx.lineTo(-70, -20); ctx.lineTo(70, -20); ctx.lineTo(80, 60); ctx.closePath(); ctx.fill(); line([[-90, -60], [90, 60]], 10, '#c3121f'); line([[-90, 60], [90, -60]], 10, '#c3121f'); label('−28 kg', 0, 95, 18, '#1b1b1f'); break; }
    case 'hood': if (p.fx.hood === 'vent') { ctx.fillStyle = '#e9e6dc'; ctx.beginPath(); ctx.moveTo(-90, 40); ctx.lineTo(-70, -50); ctx.lineTo(70, -50); ctx.lineTo(90, 40); ctx.closePath(); ctx.fill(); for (let i = 0; i < 4; i++) { rect(-50, -30 + i * 14, 34, 8, '#1a1b1f', 2); rect(16, -30 + i * 14, 34, 8, '#1a1b1f', 2); } label('FRP', 0, 80, 18, '#b3141e'); break; }
    { ctx.fillStyle = '#1a1b1f'; ctx.beginPath(); ctx.moveTo(-90, 40); ctx.lineTo(-70, -50); ctx.lineTo(70, -50); ctx.lineTo(90, 40); ctx.closePath(); ctx.fill(); ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 3; for (let x = -120; x < 120; x += 8) { ctx.beginPath(); ctx.moveTo(x, -60); ctx.lineTo(x + 60, 60); ctx.stroke(); } ctx.restore(); rect(-30, -30, 60, 12, '#0b0b0d', 4); break; }
    case 'wing': {
      if (p.fx.wing === 'duck') { ctx.fillStyle = '#c8202a'; ctx.beginPath(); ctx.moveTo(-90, 30); ctx.lineTo(90, 30); ctx.lineTo(95, 10); ctx.quadraticCurveTo(0, -20, -95, 10); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(-80, 14, 160, 4); }
      else if (p.fx.wing === 'boso') { rect(-80, -60, 160, 14, '#e9e6dc', 4); line([[-50, -46], [-40, 60]], 6, '#c9ccd2'); line([[50, -46], [40, 60]], 6, '#c9ccd2'); line([[-62, -46], [-56, 60]], 4, '#c9ccd2'); line([[62, -46], [56, 60]], 4, '#c9ccd2'); }
      else if (p.fx.wing === 'swan') { rect(-98, -30, 196, 16, '#1a1b1f', 6); rect(-98, -52, 196, 9, '#1a1b1f', 4); rect(-104, -60, 9, 56, '#1a1b1f', 2); rect(95, -60, 9, 56, '#1a1b1f', 2); line([[-46, 50], [-40, -40], [-52, -22]], 6, '#2a2b30'); line([[46, 50], [40, -40], [52, -22]], 6, '#2a2b30'); }
      else if (p.fx.wing === 'gt') { rect(-95, -40, 190, 18, '#1a1b1f', 6); rect(-100, -54, 10, 40, '#1a1b1f', 2); rect(90, -54, 10, 40, '#1a1b1f', 2); rect(-55, -22, 10, 70, '#2a2b30'); rect(45, -22, 10, 70, '#2a2b30'); }
      else { ctx.fillStyle = '#2a4f9a'; ctx.beginPath(); ctx.moveTo(-90, 20); ctx.lineTo(90, 20); ctx.lineTo(80, -12); ctx.lineTo(-80, -12); ctx.closePath(); ctx.fill(); }
      break;
    }
    case 'kit': { ctx.fillStyle = '#1a1b1f'; ctx.beginPath(); ctx.moveTo(-95, -10); ctx.quadraticCurveTo(0, -30, 95, -10); ctx.lineTo(80, 30); ctx.quadraticCurveTo(0, 18, -80, 30); ctx.closePath(); ctx.fill(); rect(-60, 50, 120, 12, '#1a1b1f', 3); break; }
    case 'decal': {
      if (id === 'decal3' || id === 'decal4') { rect(-90, -40, 180, 80, '#17181c', 6); ctx.save(); ctx.translate(-90, id === 'decal4' ? -60 : -78); if (id === 'decal4') ctx.scale(2.6, 1); drawDecal(ctx, p.fx.decal, 180, 110); ctx.restore(); break; }
      rect(-90, -40, 180, 80, id === 'decal1' ? '#f2efe6' : '#ffd400', 6);
      if (id === 'decal1') { label('KUROZAWA', 0, -2, 30, '#111'); label('WOLVES', 0, 28, 26, '#b3141e'); }
      else { ctx.fillStyle = '#111'; ctx.beginPath(); ctx.moveTo(-60, -30); ctx.lineTo(-78, 4); ctx.lineTo(-66, 4); ctx.lineTo(-74, 30); ctx.lineTo(-52, -6); ctx.lineTo(-64, -6); ctx.closePath(); ctx.fill(); label('KAMINARI', 18, 12, 32, '#111'); }
      break;
    }
    case 'flares': {
      for (const x of [-48, 48]) { ctx.save(); ctx.translate(x, 10); ctx.fillStyle = '#26272c'; ctx.beginPath(); ctx.arc(0, 30, 52, Math.PI, 0); ctx.arc(0, 30, 36, 0, Math.PI, true); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#c9ccd2'; for (let i = 0; i < 6; i++) { const a = Math.PI * (1.08 + i * 0.17); circ(Math.cos(a) * 44, 30 + Math.sin(a) * 44, 2.5, '#c9ccd2'); } ctx.restore(); }
      label('+40 mm', 0, 82, 18, '#b3141e'); break;
    }
    case 'lights': { for (const x of [-45, 45]) { circ(x, -18, 30, '#2a2b30'); const g = ctx.createRadialGradient(x, -18, 2, x, -18, 26); g.addColorStop(0, '#fff6c0'); g.addColorStop(1, '#f2b71b'); circ(x, -18, 25, g); } for (const x of [-40, 40]) { rect(x - 22, 34, 44, 22, '#2a2b30', 4); rect(x - 18, 38, 36, 14, '#ffd34d', 3); } break; }
    case 'tail': { for (const x of [-48, 48]) { rect(x - 40, -24, 80, 48, '#1b1c20', 8); rect(x - 34, -18, 68, 36, '#3a0710', 6); rect(x - 30, -14, 26, 28, '#5a0b14', 4); } break; }
    case 'tint': { circ(0, 0, 70, '#1b1d22'); circ(0, 0, 58, '#2a2f38'); circ(0, 0, 18, '#c9ccd2'); ctx.fillStyle = 'rgba(20,24,32,0.85)'; ctx.beginPath(); ctx.moveTo(40, -50); ctx.lineTo(100, -30); ctx.lineTo(100, 60); ctx.lineTo(40, 50); ctx.closePath(); ctx.fill(); break; }
    case 'banner': { ctx.fillStyle = '#17181c'; ctx.beginPath(); ctx.moveTo(-95, -30); ctx.quadraticCurveTo(0, -48, 95, -30); ctx.lineTo(95, 6); ctx.quadraticCurveTo(0, -12, -95, 6); ctx.closePath(); ctx.fill(); label('YORU TŌGE', 0, -12, 22, '#f2efe6'); break; }
    case 'neon': { for (const [y, col] of [[-30, '#4ee6d4'], [0, '#b77bff'], [30, '#ff3dbb']]) { ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 16; rect(-85, y - 6, 170, 12, col, 6); ctx.restore(); rect(-92, y - 8, 10, 16, '#2a2b30', 2); rect(82, y - 8, 10, 16, '#2a2b30', 2); } break; }
    case 'bumper': { ctx.fillStyle = id === 'bumper2' ? '#e9e6dc' : '#c8202a'; ctx.beginPath(); ctx.moveTo(-95, -30); ctx.quadraticCurveTo(0, -46, 95, -30); ctx.lineTo(90, 26); ctx.quadraticCurveTo(0, 12, -90, 26); ctx.closePath(); ctx.fill(); rect(-48, -14, 96, 22, '#0d0e12', 5); rect(-84, -10, 26, 16, '#0d0e12', 4); rect(58, -10, 26, 16, '#0d0e12', 4); if (id === 'bumper2') { ctx.fillStyle = '#d8d4c8'; ctx.beginPath(); ctx.moveTo(-92, 28); ctx.lineTo(92, 28); ctx.lineTo(104, 62); ctx.lineTo(-104, 62); ctx.closePath(); ctx.fill(); } else rect(-88, 30, 176, 8, '#1a1b1f', 2); break; }
    case 'canards': { for (const [x, y, r2] of [[-50, -20, -0.25], [-50, 25, -0.25], [50, -20, 0.25], [50, 25, 0.25]]) { ctx.save(); ctx.translate(x, y); ctx.rotate(r2); ctx.fillStyle = '#1a1b1f'; ctx.beginPath(); ctx.moveTo(-34, 8); ctx.lineTo(34, 8); ctx.lineTo(20, -10); ctx.lineTo(-34, -4); ctx.closePath(); ctx.fill(); ctx.restore(); } break; }
    case 'diffuser': { ctx.fillStyle = '#1a1b1f'; ctx.beginPath(); ctx.moveTo(-90, -30); ctx.lineTo(90, -30); ctx.lineTo(70, 34); ctx.lineTo(-70, 34); ctx.closePath(); ctx.fill(); for (let x = -54; x <= 54; x += 27) rect(x - 3, -34, 6, 74, '#34363c', 2); break; }
    case 'roof': { ctx.fillStyle = '#e9e6dc'; ctx.beginPath(); ctx.moveTo(-70, 30); ctx.lineTo(-60, -22); ctx.lineTo(60, -22); ctx.lineTo(70, 30); ctx.closePath(); ctx.fill(); rect(-50, -14, 100, 22, '#0d0e12', 4); break; }
    case 'louver': { for (let i = 0; i < 6; i++) rect(-80 + i * 3, -52 + i * 18, 160 - i * 6, 11, '#17181c', 2); rect(-88, -56, 8, 116, '#26272c', 2); rect(80, -56, 8, 116, '#26272c', 2); break; }
    case 'mirrors': { for (const x of [-46, 46]) { if (id === 'mirror1') { rect(x - 3, 0, 6, 46, steel(x - 3, 0, x + 3, 0)); rect(x - 28, -34, 56, 38, steel(x - 28, -34, x + 28, 4), 8); rect(x - 22, -28, 44, 26, '#5a6a80', 5); } else { rect(x - 30, 6, 60, 8, '#1a1b1f', 3); rect(x - 24, -26, 48, 30, '#1a1b1f', 10); } } break; }
    case 'pipes': { if (id === 'pipes1') { line([[-70, 56], [-40, 56], [30, -60]], 14, steel(0, -60, 20, 60)); line([[-40, 62], [-10, 62], [70, -50]], 14, steel(0, -60, 20, 60)); } else { const g = ctx.createLinearGradient(-60, 0, 80, 0); g.addColorStop(0, '#c9ccd2'); g.addColorStop(0.5, '#b08a3a'); g.addColorStop(0.8, '#6a5fb0'); g.addColorStop(1, '#3f6ad0'); rect(-80, -32, 160, 64, g, 30); circ(62, 0, 24, '#0b0b0d'); } break; }
    case 'pod': { rect(-92, 18, 184, 10, '#1a1b1f', 3); for (const x of [-66, -22, 22, 66]) { circ(x, -8, 22, '#1a1b1f'); const g = ctx.createRadialGradient(x - 5, -13, 2, x, -8, 18); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#b8c4d4'); circ(x, -8, 17, g); } break; }
    case 'towhook': { ctx.strokeStyle = '#d0161e'; ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(10, 0, 34, 0, Math.PI * 2); ctx.stroke(); rect(-80, -10, 60, 20, '#d0161e', 4); break; }
    case 'oilcooler': { rect(-70, -34, 140, 68, steel(-70, 0, 70, 0), 4); ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 2; for (let y = -28; y < 34; y += 7) { ctx.beginPath(); ctx.moveTo(-64, y); ctx.lineTo(64, y); ctx.stroke(); } line([[-50, 34], [-60, 70]], 8, '#8b8f97'); line([[50, 34], [60, 70]], 8, '#8b8f97'); circ(-50, 34, 7, '#3f6ad0'); circ(50, 34, 7, '#c8202a'); break; }
    case 'tirelet': { circ(0, 0, 80, '#141517'); circ(0, 0, 46, '#3a3c42'); ctx.save(); ctx.fillStyle = '#f2f2ee'; ctx.font = `800 17px ${cssVar('--f-disp')}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const w2 = (str, a0) => { let a = a0 - (str.length - 1) * 0.11; for (const ch of str) { ctx.save(); ctx.rotate(a); ctx.translate(0, -63); ctx.fillText(ch, 0, 0); ctx.restore(); a += 0.22; } }; w2('YORU', 0); w2('RS-2', Math.PI); ctx.restore(); break; }
    case 'intneon': { rect(-80, -40, 160, 80, '#15161a', 10); ctx.save(); ctx.shadowColor = '#b77bff'; ctx.shadowBlur = 22; rect(-64, 14, 128, 9, '#b77bff', 4); rect(-64, -22, 128, 9, '#4ee6d4', 4); ctx.restore(); break; }
    default: rect(-50, -50, 100, 100, '#888');
  }
  ctx.restore();
}
