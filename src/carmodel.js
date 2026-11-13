// ===================== 3D CAR MODELS =====================
// The body is lofted from cross-sections taken along the car. Each section follows the side silhouette
// (the same one the garage draws), the plan view rounds the corners, the sides bulge slightly, the
// greenhouse leans in, and the wheel arches are real openings with a dark liner behind them.
const CarModel = {
  envMap: null, pmremEnv: null, wheelTex: {}, plateTex: {}, lensTex: {},
  // a small night scene blurred into a reflection map: sky, horizon glow, a row of sodium lamps
  env(track, renderer) {
    if (this.pmremEnv) return this.pmremEnv;
    if (renderer && THREE.PMREMGenerator) {
      try {
        const es = new THREE.Scene(), sg = new THREE.SphereGeometry(50, 32, 16), cols = [], p = sg.attributes.position;
        for (let i = 0; i < p.count; i++) {
          const y = p.getY(i) / 50;
          if (y > 0.02) { const t = Math.pow(y, 0.5); cols.push(lerp(0.32, 0.03, t), lerp(0.22, 0.04, t), lerp(0.24, 0.1, t)); }
          else if (y > -0.04) cols.push(0.45, 0.3, 0.22); else cols.push(0.03, 0.03, 0.035);
        }
        sg.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
        es.add(new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
        const lm = new THREE.MeshBasicMaterial({ color: new THREE.Color(4.5, 2.6, 1.0) }), lg = new THREE.SphereGeometry(1.4, 8, 6);
        for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; const m = new THREE.Mesh(lg, lm); m.position.set(Math.cos(a) * 30, 16 + (i % 3) * 3, Math.sin(a) * 30); es.add(m); }
        const wm = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.4, 2.8) }), panel = new THREE.PlaneGeometry(26, 3);
        const strip = new THREE.Mesh(panel, wm); strip.position.set(0, 40, 0); strip.rotation.x = Math.PI / 2; es.add(strip);
        const pm = new THREE.PMREMGenerator(renderer); const rt = pm.fromScene(es, 0.03);
        pm.dispose(); sg.dispose(); lg.dispose(); panel.dispose(); lm.dispose(); wm.dispose();
        this.pmremEnv = rt.texture; track.push(rt); return rt.texture;
      } catch (e) { /* fall back below */ }
    }
    return this.envCube(track);
  },
  envCube(track) { // plain cube map: works with Phong (the PMREM format does not)
    if (this.envMap) return this.envMap;
    const face = (side) => {
      const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d');
      if (side === 'py') { g.fillStyle = '#121a33'; g.fillRect(0, 0, 64, 64); }
      else if (side === 'ny') { g.fillStyle = '#050506'; g.fillRect(0, 0, 64, 64); }
      else { const gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, '#141c38'); gr.addColorStop(0.48, '#2a2f4a'); gr.addColorStop(0.52, '#0c0d10'); gr.addColorStop(1, '#040405'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
      return cv;
    };
    const t = new THREE.CubeTexture(['px', 'nx', 'py', 'ny', 'pz', 'nz'].map(face)); t.needsUpdate = true;
    track.push(t); this.envMap = t; return t;
  },
  wheelTexture(style, track) {
    if (this.wheelTex[style]) return this.wheelTex[style];
    const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g = cv.getContext('2d');
    g.save(); g.beginPath(); g.arc(128, 128, 127, 0, Math.PI * 2); g.clip();
    drawWheel(g, 128, 128, 127 / 0.66, style, { tex: true }); g.restore();
    const t = new THREE.CanvasTexture(cv); t.anisotropy = 4; track.push(t); this.wheelTex[style] = t; return t;
  },
  plateTexture(top, bottom, track) {
    const key = top + bottom; if (this.plateTex[key]) return this.plateTex[key];
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 64; const g = cv.getContext('2d');
    g.fillStyle = '#f2f0e6'; g.fillRect(0, 0, 128, 64); g.strokeStyle = '#2f6b3a'; g.lineWidth = 3; g.strokeRect(2, 2, 124, 60);
    g.fillStyle = '#2f6b3a'; g.textAlign = 'center'; g.font = `18px ${cssVar('--f-jp')}`; g.fillText(top, 64, 24);
    g.font = `bold 28px ${cssVar('--f-disp')}`; g.fillText(bottom, 70, 56); g.font = `16px ${cssVar('--f-jp')}`; g.fillText('さ', 16, 52);
    const t = new THREE.CanvasTexture(cv); track.push(t); this.plateTex[key] = t; return t;
  },
  // reflector and lens patterns so lamps read as lamps up close
  lensTexture(kind, track) {
    if (this.lensTex[kind]) return this.lensTex[kind];
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 64; const g = cv.getContext('2d');
    if (kind === 'head' || kind === 'yellow') {
      const base = kind === 'yellow' ? ['#fff3b0', '#e0a830'] : ['#ffffff', '#b8c4d4'];
      const gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, base[0]); gr.addColorStop(1, base[1]); g.fillStyle = gr; g.fillRect(0, 0, 128, 64);
      g.strokeStyle = 'rgba(80,90,110,0.35)'; g.lineWidth = 1; for (let x = 4; x < 128; x += 7) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 64); g.stroke(); }
      for (let y = 4; y < 64; y += 7) { g.beginPath(); g.moveTo(0, y); g.lineTo(128, y); g.stroke(); }
      for (const cx of [36, 92]) { const rg = g.createRadialGradient(cx, 32, 2, cx, 32, 26); rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.5, 'rgba(255,255,255,0.4)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.fillRect(cx - 26, 6, 52, 52); }
    } else {
      g.fillStyle = kind === 'smoke' ? '#5a0c14' : '#ff2a38'; g.fillRect(0, 0, 128, 64);
      g.fillStyle = 'rgba(0,0,0,0.28)'; for (let x = 0; x < 128; x += 6) g.fillRect(x, 0, 2, 64);
      g.fillStyle = 'rgba(255,255,255,0.18)'; for (let y = 4; y < 64; y += 10) g.fillRect(0, y, 128, 2);
      g.fillStyle = 'rgba(255,240,240,0.55)'; g.fillRect(84, 18, 28, 14);
    }
    const t = new THREE.CanvasTexture(cv); track.push(t); this.lensTex[kind] = t; return t;
  },
  // what is under the hood: only built for the garage, where the hood can be opened
  engineBay(model, sh, S2, vis, opts, h) {
    const { box, add, tube, V3, mk, std, env, track, trimM, chromeM, darkM } = h, M = CARS[model], E = M.engine, W = sh.W, fz = sh.L / 2;
    const z0 = sh.cowlZ + 0.06, z1 = fz - 0.2, zc = (z0 + z1) / 2, top = shapeTopAt(sh, zc) - 0.06, fy = Math.max(0.3, top - 0.42), bw = W - 0.34;
    const bayM = mk(new THREE.MeshLambertMaterial({ color: 0x101114 })), alu = mk(std({ color: 0xa9adb4, roughness: 0.5, metalness: 0.7, envMap: env, envMapIntensity: 0.6 }));
    box(bw, 0.03, z1 - z0, bayM, 0, fy, zc); box(bw, top - fy, 0.03, bayM, 0, (top + fy) / 2, z0); box(bw, top - fy, 0.03, bayM, 0, (top + fy) / 2, z1);
    for (const sx of [-1, 1]) { box(0.03, top - fy, z1 - z0, bayM, sx * bw / 2, (top + fy) / 2, zc); const tw = new THREE.CylinderGeometry(0.1, 0.12, 0.2, 12); add(tw, bayM, sx * (bw / 2 - 0.12), top - 0.1, z0 + 0.22); add(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 8), chromeM, sx * (bw / 2 - 0.12), top + 0.01, z0 + 0.22); }
    if (opts.strut) tube(V3(-bw / 2 + 0.12, top + 0.02, z0 + 0.22), V3(bw / 2 - 0.12, top + 0.02, z0 + 0.22), 0.018, mk(std({ color: 0xc8202a, roughness: 0.35, metalness: 0.5 })));
    if (M.layout === 'MR') { // front boot: the spare wheel and the brake servo
      const tg = new THREE.TorusGeometry(0.2, 0.085, 8, 18); tg.rotateX(Math.PI / 2); add(tg, mk(new THREE.MeshLambertMaterial({ color: 0x18181a })), 0, fy + 0.11, zc); add(new THREE.CylinderGeometry(0.13, 0.13, 0.08, 14), alu, 0, fy + 0.11, zc);
      box(0.22, 0.14, 0.16, bayM, bw * 0.3, fy + 0.1, z0 + 0.14); return;
    }
    const trans = M.layout === 'FF' || (M.layout === 'AWD' && ['stella', 'arashi'].includes(model)), six = E.cyl >= 6, v = model === 'zetto' || model === 'sovereign' || model === 'stella';
    const el = Math.min(six && !v ? 0.78 : 0.52, (trans ? bw : z1 - z0) - 0.2), ew = v ? 0.56 : 0.24, eh = Math.min(0.34, top - fy - 0.08), ey = fy + 0.05 + eh / 2;
    const cover = mk(std({ color: { types: 0xb81d26, hayate: 0xb81d26, sprint16: 0x2a4f9a, hako: 0x8a8d92, twinr: 0x3a3c42 }[model] || 0x202227, roughness: 0.45, metalness: 0.4, envMap: env, envMapIntensity: 0.5 }));
    const eng = (w, hh, d, mat, dx, dy, dz) => trans ? box(d, hh, w, mat, dz, ey + dy, zc + dx) : box(w, hh, d, mat, dx, ey + dy, zc + dz - 0.04);
    if (E.rotary) { for (const k of [-0.11, 0.11]) { const rg = new THREE.CylinderGeometry(0.17, 0.17, 0.16, 16); rg.rotateX(Math.PI / 2); add(rg, alu, 0, ey - 0.03, zc + k); } eng(0.2, 0.08, 0.5, cover, 0, eh / 2 - 0.02, 0); }
    else if (v) { eng(ew, eh * 0.55, el, alu, 0, -eh * 0.2, 0); for (const sx of [-1, 1]) { const b = eng(0.2, 0.09, el * 0.94, cover, sx * 0.19, eh * 0.2, 0); b.rotation.z = -sx * 0.5; } eng(0.2, 0.1, el * 0.7, bayM, 0, eh * 0.32, 0); }
    else { eng(ew, eh * 0.75, el, alu, 0, -eh * 0.1, 0); eng(ew * 0.9, 0.07, el * 0.96, cover, 0, eh * 0.32, 0); for (let i = 0; i < E.cyl; i++) eng(0.035, 0.03, 0.035, darkM, 0, eh * 0.37, (i - (E.cyl - 1) / 2) * el * 0.86 / E.cyl); }
    // intake side: plenum and runners, or carburettors on the old six
    const side = trans ? 1 : -1, ix = ew / 2 + 0.11;
    if (model === 'hako') for (let i = 0; i < 3; i++) { const cg = new THREE.CylinderGeometry(0.045, 0.055, 0.12, 10); cg.rotateZ(Math.PI / 2); add(cg, chromeM, side * (ix + 0.02), ey + 0.06, zc - 0.04 + (i - 1) * el * 0.3); }
    else if (!E.rotary) eng(0.1, 0.1, el * 0.8, alu, -(ix + 0.02), 0.06, 0);
    // exhaust side: a turbo if there is one
    if (E.turbo || opts.turbo) {
      const tx = trans ? 0 : (ew / 2 + 0.16), tz = trans ? zc + ew / 2 + 0.14 : zc + 0.05, tg = new THREE.TorusGeometry(0.075, 0.045, 8, 14); add(tg, alu, tx, ey, tz, 0, trans ? 0 : Math.PI / 2, 0);
      const rust = mk(std({ color: 0x6a4a36, roughness: 0.8, metalness: 0.4 })); const tg2 = new THREE.TorusGeometry(0.07, 0.042, 8, 14); add(tg2, rust, tx + (trans ? 0.1 : 0), ey, tz + (trans ? 0 : -0.1), 0, trans ? 0 : Math.PI / 2, 0);
      tube(V3(tx, ey + 0.06, tz), V3(tx * 0.4, top - 0.08, z1 - 0.1), 0.03, alu); tube(V3(tx * 0.4, top - 0.08, z1 - 0.1), V3(-bw * 0.3, top - 0.08, z1 - 0.1), 0.03, alu);
    }
    // battery, radiator, airbox or cone filter
    box(0.24, 0.17, 0.16, bayM, -bw * 0.34, fy + 0.11, z0 + 0.42); for (const k of [-0.06, 0.06]) add(new THREE.CylinderGeometry(0.012, 0.012, 0.03, 6), chromeM, -bw * 0.34 + k, fy + 0.21, z0 + 0.42);
    box(bw * 0.72, top - fy - 0.1, 0.04, alu, 0, (top + fy) / 2 - 0.02, z1 - 0.04);
    if (opts.intake) { const cg = new THREE.CylinderGeometry(0.06, 0.1, 0.2, 14); cg.rotateX(Math.PI / 2); add(cg, mk(new THREE.MeshLambertMaterial({ color: 0xc8202a })), bw * 0.32, top - 0.14, z1 - 0.25); }
    else box(0.26, 0.14, 0.24, bayM, bw * 0.3, top - 0.13, z1 - 0.24);
  },
  // spoked wheel centre in the wheel's own frame: axle along x, the outside face at +x
  spokeGeo(WS, rr, xf) {
    const parts = [], rimR = rr * (WS.rim || 0.97), hubR = rr * 0.2, len = rimR - hubR, t = WS.t || 0.028, lean = WS.lean || 0.015;
    const nn = WS.pair ? WS.n * 2 : WS.n;
    for (let i = 0; i < nn; i++) {
      const bg = new THREE.BoxGeometry(t, len, 1).toNonIndexed(), p = bg.attributes.position, skew = WS.pair ? (i % 2 ? 1 : -1) * WS.pair : 0;
      for (let k = 0; k < p.count; k++) { const yy = p.getY(k) / len + 0.5; p.setZ(k, p.getZ(k) * rr * lerp(WS.w0, WS.w1, yy) + skew * rr * (yy - 0.5)); p.setX(k, p.getX(k) + lean * yy); }
      bg.translate(xf - lean - t / 2, hubR + len / 2, 0); bg.rotateX((WS.pair ? Math.floor(i / 2) : i) / WS.n * Math.PI * 2); parts.push(bg);
    }
    const hub = new THREE.CylinderGeometry(hubR * 1.25, hubR * 1.4, t * 1.5, 14).toNonIndexed(); hub.rotateZ(-Math.PI / 2); hub.translate(xf - lean - t * 0.4, 0, 0); parts.push(hub);
    for (let i = 0; i < 5; i++) { const nut = new THREE.CylinderGeometry(0.011, 0.011, 0.02, 6).toNonIndexed(); nut.rotateZ(-Math.PI / 2); nut.translate(xf - lean + t * 0.4, hubR * 0.85, 0); nut.rotateX(i / 5 * Math.PI * 2 + 0.3); parts.push(nut); }
    let n = 0; for (const g of parts) n += g.attributes.position.count;
    const pos = new Float32Array(n * 3); let o = 0; for (const g of parts) { pos.set(g.attributes.position.array, o); o += g.attributes.position.count * 3; g.dispose(); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.computeVertexNormals(); return geo;
  },
  letterTexture(track) {
    if (this.letTex) return this.letTex;
    const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g = cv.getContext('2d');
    g.translate(128, 128); g.fillStyle = '#fff'; g.font = `800 22px ${cssVar('--f-disp')}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    const word = (str, a0) => { const step = 0.2; let a = a0 - (str.length - 1) * step / 2; for (const ch of str) { g.save(); g.rotate(a); g.translate(0, -108); g.fillText(ch, 0, 0); g.restore(); a += step; } };
    word('YORU', 0); word('RS-2', Math.PI);
    const t = new THREE.CanvasTexture(cv); track.push(t); this.letTex = t; return t;
  },
  reset() { this.letTex = null; this.envMap = null; this.pmremEnv = null; this.wheelTex = {}; this.plateTex = {}; this.lensTex = {}; },

  // ------------------------------------------------------------------ body surface
  sampler(sh, flare) {
    const L = sh.L, W = sh.W, P = sh.outline, zr = sh.wheels.zr, zf = sh.wheels.zf, ra = sh.wheels.ra;
    const cross = (z) => {
      let lo = 1e9, hi = -1e9;
      for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; if ((a[0] - z) * (b[0] - z) <= 0 && a[0] !== b[0]) { const y = a[1] + (b[1] - a[1]) * (z - a[0]) / (b[0] - a[0]); lo = Math.min(lo, y); hi = Math.max(hi, y); } }
      return lo > hi ? [0.3, 0.4] : [lo, hi];
    };
    const pf = 14, pr = 12;
    const planInv = (xr, front) => { const p = front ? pf : pr; return Math.pow(Math.max(0, 1 - Math.pow(clamp(xr, 0, 1), p)), 1 / p); };
    const planW = (z) => W / 2 * planInv(Math.abs(z) / (L / 2), z > 0);
    const flareAt = (z) => { let f = 0; for (const zw of [zr, zf]) { const d = Math.abs(z - zw) / (ra + 0.22); if (d < 1) f = Math.max(f, flare * 0.5 * (1 + Math.cos(d * Math.PI))); } return f; };
    const yFloor = cross(0)[0] + 0.01, belt = sh.beltY;
    // one half section (x >= 0), bottom centre to roof centre; duplicated points make crisp creases
    const ring = (z) => {
      const [yb0, yt] = cross(z), w = planW(z), f = flareAt(z);
      const arch = yb0 > yFloor + 0.05, yb = Math.max(yb0, yFloor - 0.005);
      const ys = Math.min(belt, yt - 0.035), g = smooth(0.015, 0.1, yt - belt);
      const xin = arch ? Math.max(0.12, w - 0.3) : Math.max(0, w - 0.05);
      const lipY = yb + (arch ? 0.025 : 0.01);
      const fs = (y) => f * (1 - smooth(belt - 0.14, belt - 0.03, y));
      const side = (t) => { const y = lerp(lipY, ys, t); return [w + fs(y) + w * (0.004 + 0.016 * Math.sin(Math.PI * t)), y]; };
      const ye = yt - 0.04;
      const gh = [[w * 0.95, ys + 0.015], [w * lerp(0.94, 0.75, 0.3), ys + (ye - ys) * 0.35], [w * lerp(0.94, 0.75, 0.72), ys + (ye - ys) * 0.74], [w * 0.75, ye], [w * 0.42, yt - 0.012], [0, yt]];
      const hd = [[w * 0.95, ys + 0.012], [w * 0.86, yt - 0.014], [w * 0.74, yt - 0.008], [w * 0.6, yt - 0.004], [w * 0.32, yt], [0, yt + 0.005]];
      const top = gh.map((p, i) => [lerp(hd[i][0], p[0], g), lerp(hd[i][1], p[1], g)]);
      const pts = [[0, Math.min(yFloor, yb)], [xin, Math.min(yFloor, yb)], [xin, yb], [Math.max(xin, w * 0.96 + f * 0.7), yb], [w + fs(lipY) - 0.004, lipY]];
      pts.push(pts[4].slice()); // crease at the arch lip
      pts.push(side(0.22), side(0.52), side(0.82), [w * 0.985 + fs(ys), ys]);
      pts.push(pts[9].slice()); // crease at the shoulder
      pts.push(...top);
      return { pts, z, yt, yb, ys, g, w, arch };
    };
    const sideX = (y, z) => { const r = ring(z).pts; let best = r[9][0]; for (let i = 4; i < 15; i++) { const a = r[i], b = r[i + 1]; if ((a[1] - y) * (b[1] - y) <= 0 && a[1] !== b[1]) { best = a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]); break; } } return best; };
    return { ring, sideX, planInv, planW, cross, yFloor, flareAt };
  },
  bodyGeometry(sh, vis, flare, S2, splitHood) {
    const L = sh.L, N0 = 76, sections = [], zEndF = sh.wheels.zf + sh.wheels.ra + 0.04, zEndR = sh.wheels.zr - sh.wheels.ra - 0.04;
    const zs = [];
    for (let i = 0; i <= N0; i++) { const s = -1 + 2 * i / N0; zs.push(clamp(Math.sin(s * Math.PI / 2) * L / 2, -L / 2 + 0.002, L / 2 - 0.002)); }
    // a near-vertical step in the silhouette (the back of a truck cab) needs a section on each side of it
    for (let i = 1; i < sh.up.length; i++) { const a = sh.up[i - 1], b = sh.up[i]; if (Math.abs(b[1] - a[1]) > 0.25 && Math.abs(b[0] - a[0]) < 0.06 && Math.abs(a[0]) < L / 2 - 0.3) zs.push(Math.min(a[0], b[0]) - 0.012, Math.max(a[0], b[0]) + 0.012); }
    zs.sort((a, b) => a - b); const N = zs.length - 1;
    for (const z of zs) sections.push(S2.ring(z));
    const H = 17, R = H + 15, pos = new Float32Array((N + 1) * R * 3);
    const ringIdx = (k) => k <= 16 ? k : 32 - k; // full ring index -> half index
    sections.forEach((sec, i) => { for (let k = 0; k < R; k++) { const h = ringIdx(k), p = sec.pts[h], sx = k <= 16 ? 1 : -1, o = (i * R + k) * 3; pos[o] = sx * p[0]; pos[o + 1] = p[1]; pos[o + 2] = sec.z; } });
    const glassPolys = sh.glass, inPoly = (poly, z, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > y) !== (b[1] > y) && z < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
    const gz = glassPolys.map(p => [Math.min(...p.map(q => q[0])), Math.max(...p.map(q => q[0]))]);
    const cls = (j, i) => { // material for half-segment j between sections i and i+1
      const a = sections[i], b = sections[i + 1], z = (a.z + b.z) / 2;
      if (j <= 1) return 2;
      if (j <= 4) return (z > zEndF || z < zEndR) && j >= 2 ? 0 : j >= 3 ? 0 : 2;
      if (j <= 10) return 0;
      const y = (a.pts[j][1] + a.pts[j + 1][1] + b.pts[j][1] + b.pts[j + 1][1]) / 4, gg = (a.g + b.g) / 2;
      if (gg > 0.5) {
        if (j <= 13) {
          if (glassPolys.some(p => inPoly(p, z, y))) return 1;
          if (gz.length >= 2 && z > gz[0][1] && z < gz[gz.length - 1][0] && y > sh.beltY + 0.03) return 4; // blacked-out B-pillar
          return 0;
        }
        const slope = Math.abs(b.yt - a.yt) / Math.max(1e-4, Math.abs(b.z - a.z));
        return slope > 0.42 ? 1 : 0;
      }
      if (z > sh.cowlZ + 0.02 && j >= 11 && !sh.D.bed) return splitHood ? 5 : vis.hood === 'carbon' ? 3 : 0;
      return 0;
    };
    const idx = [[], [], [], [], [], []];
    for (let i = 0; i < N; i++) for (let k = 0; k < R; k++) {
      const k2 = (k + 1) % R, j = k < 16 ? k : 31 - k;
      const a = i * R + k, b = i * R + k2, c = (i + 1) * R + k, d = (i + 1) * R + k2, m = cls(j, i);
      idx[m].push(a, b, c, b, d, c);
    }
    const geo = new THREE.BufferGeometry(), all = [];
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    let start = 0; idx.forEach((list, m) => { if (m < 5 && list.length) { geo.addGroup(start, list.length, m); all.push(...list); start += list.length; } });
    geo.setIndex(all.concat(idx[5])); geo.computeVertexNormals(); geo.setIndex(all);
    if (idx[5].length) { const hg = new THREE.BufferGeometry(); hg.setAttribute('position', geo.attributes.position); hg.setAttribute('normal', geo.attributes.normal); hg.setIndex(idx[5]); geo.userData.hood = hg; }
    return geo;
  },

  // Bake every static single-material mesh under the body into one mesh per material: far fewer draw calls.
  mergeStatic(body, track) {
    body.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(body.matrixWorld).invert(), groups = new Map(), victims = [], m = new THREE.Matrix4();
    body.traverse(o => {
      if (!o.isMesh || Array.isArray(o.material) || o.renderOrder || !o.geometry.attributes.normal || o === body.children[0]) return;
      m.multiplyMatrices(inv, o.matrixWorld);
      let gg = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      gg.applyMatrix4(m);
      if (m.determinant() < 0) { const p = gg.attributes.position.array; for (let i = 0; i < p.length; i += 9) for (let k = 0; k < 3; k++) { const t = p[i + 3 + k]; p[i + 3 + k] = p[i + 6 + k]; p[i + 6 + k] = t; } }
      if (!groups.has(o.material)) groups.set(o.material, []);
      groups.get(o.material).push(gg); victims.push(o);
    });
    for (const o of victims) o.parent.remove(o);
    for (const [mat, list] of groups) {
      let n = 0; for (const gg of list) n += gg.attributes.position.count;
      const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2); let o3 = 0, o2 = 0;
      for (const gg of list) {
        pos.set(gg.attributes.position.array, o3); nor.set(gg.attributes.normal.array, o3);
        if (gg.attributes.uv) uv.set(gg.attributes.uv.array, o2);
        o3 += gg.attributes.position.count * 3; o2 += gg.attributes.position.count * 2;
      }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      track.push(geo); body.add(new THREE.Mesh(geo, mat));
    }
  },
  build(model, paint, vis, opts) {
    const track = opts.track, glow = opts.glow, ghost = !!opts.ghost, cheap = S.settings.gfx === 'low' || ghost;
    vis = vis || {};
    const sh = carShape(model, vis.lower), M = sh.M, D = sh.D, L = sh.L, W = sh.W;
    const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    const env = ghost ? null : cheap ? this.envCube(track) : this.env(track, opts.renderer || (typeof Race !== 'undefined' && Race.renderer));
    const mk = (m) => { if (ghost) { m.transparent = true; m.opacity = 0.32; m.depthWrite = false; } track.push(m); return m; };
    const finish = vis.finish || 'gloss', flare = Math.max(D.flare || 0, vis.flares === 'works' ? 0.115 : vis.flares ? 0.07 : 0);
    // paint: clear-coated PBR on the normal and high settings, cheaper Phong on retro
    const PB = { gloss: [0.05, 0.36, 1], metal: [0.5, 0.32, 1], pearl: [0.3, 0.26, 1], matte: [0.0, 0.72, 0] }[finish];
    const paintMat = () => cheap
      ? new THREE.MeshPhongMaterial({ color: paint, specular: finish === 'matte' ? 0x111111 : 0x777777, shininess: finish === 'matte' ? 6 : 80, envMap: env, combine: THREE.AddOperation, reflectivity: finish === 'matte' ? 0.03 : 0.3 })
      : new THREE.MeshPhysicalMaterial({ color: paint, metalness: PB[0], roughness: PB[1], clearcoat: PB[2], clearcoatRoughness: 0.05, envMap: env, envMapIntensity: 1.25 });
    const paintM = mk(paintMat()), shellM = mk(paintMat());
    if (!cheap && finish === 'pearl' && 'sheen' in shellM) { shellM.sheen = new THREE.Color(0x8f7fff); paintM.sheen = shellM.sheen; }
    const std = (o) => cheap ? new THREE.MeshPhongMaterial({ map: o.map || null, color: o.color, shininess: o.roughness < 0.3 ? 90 : 20, specular: o.roughness < 0.3 ? 0x888888 : 0x222222, envMap: o.envMap || null, combine: THREE.AddOperation, reflectivity: o.envMap ? 0.4 : 0 }) : new THREE.MeshStandardMaterial(o);
    // door shut lines, window trim, darker sills, 80s plastic bumpers and stripe liveries, all from body-space position
    const isFour = D.doors === 4, doorF = sh.cowlZ - 0.1, doorR = sh.pillarZ + (['sprint16', 'types', 'bambina'].includes(model) ? 0.05 : -0.04);
    const seams = isFour ? [doorF, sh.pillarZ + 0.03, sh.wheels.zr + sh.wheels.ra + 0.06, 99] : [doorF, doorR, 99, 99];
    const mode = { twotone: 1, stripes: 2, side: 3 }[vis.livery] || 0, col2 = new THREE.Color(vis.col2 || '#141418'), beltY = sh.beltY;
    const hoodZ = sh.cowlZ + 0.02, bootZ = (() => { const q = sh.up.filter(p => p[0] < sh.pillarZ && p[1] < sh.beltY + 0.03 && p[1] > sh.beltY - 0.12); return q.length ? Math.max(...q.map(p => p[0])) - 0.03 : -99; })();
    const bump = D.bumpers === 'dark' ? new THREE.Vector3(L / 2 - 0.3, 0.44 * sh.H - sh.drop, 0.485 * sh.H - sh.drop) : new THREE.Vector3(99, -9, -9);
    if (!ghost) shellM.onBeforeCompile = (shd) => {
      shd.uniforms.uCol2 = { value: col2 }; shd.uniforms.uMode = { value: mode }; shd.uniforms.uBelt = { value: beltY }; shd.uniforms.uBump = { value: bump };
      shd.uniforms.uSeams = { value: new THREE.Vector4(seams[0], seams[1], seams[2], seams[3]) }; shd.uniforms.uLids = { value: new THREE.Vector3(hoodZ, D.bed ? -99 : bootZ, sh.W * 0.5) };
      shd.vertexShader = 'varying vec3 vLP;\nvarying vec3 vLN;\n' + shd.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vLP = position; vLN = normal;');
      shd.fragmentShader = 'uniform vec3 uLids;\nuniform vec3 uCol2;\nuniform float uMode;\nuniform float uBelt;\nuniform vec3 uBump;\nuniform vec4 uSeams;\nvarying vec3 vLP;\nvarying vec3 vLN;\n' + shd.fragmentShader.replace('#include <color_fragment>', [
        '#include <color_fragment>',
        '{ float ax = abs(vLP.x); float m = 0.0; float side = smoothstep(0.45, 0.7, abs(vLN.x));',
        '  if (uMode > 0.5 && uMode < 1.5) m = step(vLP.y, uBelt - 0.3);',
        '  else if (uMode > 1.5 && uMode < 2.5) m = step(0.07, ax) * step(ax, 0.22) * step(0.3, vLN.y + abs(vLN.z));',
        '  else if (uMode > 2.5) m = (step(uBelt - 0.24, vLP.y) * step(vLP.y, uBelt - 0.17) + step(uBelt - 0.265, vLP.y) * step(vLP.y, uBelt - 0.247)) * side;',
        '  diffuseColor.rgb = mix(diffuseColor.rgb, uCol2, clamp(m, 0.0, 1.0));',
        '  float plastic = max(step(uBump.x, abs(vLP.z)) * step(vLP.y, uBump.y), step(uBump.y + 0.02, vLP.y) * step(vLP.y, uBump.z) * side);',
        '  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.035), plastic);',
        '  float seam = max(max(1.0 - smoothstep(0.003, 0.009, abs(vLP.z - uSeams.x)), 1.0 - smoothstep(0.003, 0.009, abs(vLP.z - uSeams.y))), max(1.0 - smoothstep(0.003, 0.009, abs(vLP.z - uSeams.z)), 1.0 - smoothstep(0.003, 0.009, abs(vLP.z - uSeams.w))));',
        '  seam *= side * step(0.27, vLP.y) * step(vLP.y, uBelt - 0.02);',
        '  float topf = smoothstep(0.55, 0.8, vLN.y) * step(vLP.y, uBelt + 0.06);',
        '  float lid = max(1.0 - smoothstep(0.003, 0.008, abs(vLP.z - uLids.x)), 1.0 - smoothstep(0.003, 0.008, abs(vLP.z - uLids.y))) * step(ax, uLids.z * 0.86);',
        '  lid = max(lid, (1.0 - smoothstep(0.003, 0.008, abs(ax - uLids.z * 0.86))) * max(step(uLids.x, vLP.z), step(vLP.z, uLids.y)) * step(abs(vLP.z), uSeams.x + 5.0));',
        '  seam = max(seam, lid * topf * 0.9);',
        '  float trim = side * step(uBelt - 0.012, vLP.y) * step(vLP.y, uBelt + 0.02);',
        '  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.025), max(seam * 0.85, trim * 0.92));',
        '  diffuseColor.rgb *= mix(0.55, 1.0, smoothstep(0.12, 0.4, vLP.y)); }'].join('\n'));
    };
    const glassM = mk(cheap ? new THREE.MeshPhongMaterial({ color: vis.tint ? 0x030406 : 0x0a0d14, specular: 0xaabbcc, shininess: 140, envMap: env, combine: THREE.AddOperation, reflectivity: 0.55 })
      : new THREE.MeshStandardMaterial({ color: vis.tint ? 0x020304 : 0x0a0f18, roughness: 0.04, metalness: 0.15, envMap: env, envMapIntensity: vis.tint ? 1.4 : 1.7, depthWrite: true }));
    const seeIn = !cheap && !ghost && (opts.cabin || S.settings.gfx === 'high'); if (seeIn) { glassM.transparent = true; glassM.opacity = vis.tint ? 0.86 : 0.5; glassM.depthWrite = false; } if (seeIn) { shellM.side = THREE.DoubleSide; glassM.side = THREE.DoubleSide; }
    const darkM = mk(new THREE.MeshLambertMaterial({ color: 0x0a0a0c }));
    const trimM = mk(std({ color: 0x141518, roughness: 0.45, metalness: 0.1, envMap: env, envMapIntensity: 0.6 }));
    const carbonM = mk(std({ color: 0x1c1d22, roughness: 0.25, metalness: 0.3, envMap: env, envMapIntensity: 1 }));
    const chromeM = mk(std({ color: 0xd4d7dc, roughness: 0.15, metalness: 1, envMap: env, envMapIntensity: 1.3 }));
    const tireM = mk(std({ color: 0x161618, roughness: 0.88, metalness: 0 }));
    const yellow = vis.lights === 'yellow', lightColor = yellow ? 0xffd27a : 0xfff0d0;
    const headM = mk(new THREE.MeshBasicMaterial({ map: this.lensTexture(yellow ? 'yellow' : 'head', track) }));
    const amberM = mk(new THREE.MeshBasicMaterial({ color: 0xffa040 }));
    const tailOff = vis.tail === 'smoke' ? 0x40404a : 0x7a6a6a;
    const tailM = mk(new THREE.MeshBasicMaterial({ map: this.lensTexture(vis.tail === 'smoke' ? 'smoke' : 'tail', track), color: tailOff }));
    const mats = [shellM, glassM, darkM, carbonM, trimM];

    // ---- the body
    const S2 = this.sampler(sh, flare);
    const geo = this.bodyGeometry(sh, vis, flare, S2, !!opts.bay); track.push(geo);
    body.add(new THREE.Mesh(geo, mats));
    let hood = null;
    if (geo.userData.hood) { // a hood that opens: hinged at the cowl
      track.push(geo.userData.hood);
      const hy = shapeTopAt(sh, sh.cowlZ + 0.02), hm = new THREE.Mesh(geo.userData.hood, vis.hood === 'carbon' ? carbonM : shellM); hm.renderOrder = 0.5;
      hood = new THREE.Group(); hood.position.set(0, hy, sh.cowlZ + 0.02); hm.position.set(0, -hy, -(sh.cowlZ + 0.02)); hood.add(hm); body.add(hood);
    }
    const sideX = S2.sideX;
    const zr = sh.wheels.zr, zf = sh.wheels.zf, ra = sh.wheels.ra, belt = sh.beltY, roof = sh.roofY;

    // ---- details
    const add = (geo2, mat, x, y, z, rx, ry, rz) => { track.push(geo2); const me = new THREE.Mesh(geo2, mat); me.position.set(x, y, z); if (rx || ry || rz) me.rotation.set(rx || 0, ry || 0, rz || 0); body.add(me); return me; };
    const box = (w, h, d, mat, x, y, z) => add(new THREE.BoxGeometry(w, h, d), mat, x, y, z);
    const fz = L / 2, rz = -L / 2;
    const frontAt = (y) => { let best = -1e9; for (let i = 0; i < sh.up.length - 1; i++) { const a = sh.up[i], b = sh.up[i + 1]; if ((a[1] - y) * (b[1] - y) <= 0 && a[1] !== b[1]) best = Math.max(best, a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1])); } return best > -1e8 ? best : fz; };
    const rearAt = (y) => { let best = 1e9; for (let i = 0; i < sh.up.length - 1; i++) { const a = sh.up[i], b = sh.up[i + 1]; if ((a[1] - y) * (b[1] - y) <= 0 && a[1] !== b[1]) best = Math.min(best, a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1])); } return best < 1e8 ? best : rz; };
    const frontX = (x, y) => frontAt(y) - (L / 2) * (1 - S2.planInv(Math.abs(x) / (W / 2), true));
    const rearX = (x, y) => rearAt(y) + (L / 2) * (1 - S2.planInv(Math.abs(x) / (W / 2), false));
    // lamp: dark housing with a lens face, set into the body at lateral x
    const lamp = (w, h, mat, x, y, front, round) => { // follows the curve of the nose/tail across its width
      const xi = x - Math.sign(x || 1) * w / 2, xo = x + Math.sign(x || 1) * w / 2;
      const zi = front ? frontX(xi, y) : rearX(xi, y), zo = front ? frontX(xo, y) : rearX(xo, y);
      const zc = (zi + zo) / 2, yaw = Math.atan2(zi - zo, Math.abs(xo - xi)) * Math.sign(x || 1) * (front ? 1 : -1);
      const grp = new THREE.Group(); grp.position.set(x, y, zc); grp.rotation.y = front ? yaw : Math.PI + yaw; body.add(grp);
      let hb, lens;
      if (round) {
        hb = new THREE.Mesh(new THREE.CylinderGeometry(w / 2 + 0.014, w / 2 + 0.014, 0.06, 18), round === 'chrome' ? chromeM : trimM); hb.rotation.x = Math.PI / 2; hb.position.z = -0.022;
        lens = new THREE.Mesh(new THREE.CircleGeometry(w / 2, 18), mat);
      } else {
        hb = new THREE.Mesh(new THREE.BoxGeometry(w + 0.02, h + 0.02, 0.06), trimM); hb.position.z = -0.022;
        lens = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      }
      grp.add(hb); track.push(hb.geometry); lens.position.z = 0.0095; grp.add(lens); track.push(lens.geometry);
      return { lens, z: front ? zc + 0.05 : zc - 0.05 };
    };
    const lightGlows = [];
    if (D.lights === 'popup') {
      const pz = fz - 0.42, py = shapeTopAt(sh, pz);
      for (const s of [-1, 1]) {
        const hx = s * W * 0.3;
        const pod = new THREE.Group(); pod.position.set(hx, py, pz); body.add(pod);
        const shellBox = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 0.24), paintM); shellBox.position.set(0, 0.075, 0); pod.add(shellBox); track.push(shellBox.geometry);
        const face = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.115, 0.02), trimM); face.position.set(0, 0.075, 0.12); pod.add(face); track.push(face.geometry);
        const lens = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.095), headM); lens.position.set(0, 0.075, 0.131); pod.add(lens); track.push(lens.geometry);
        lightGlows.push([hx, py + 0.075, pz + 0.16]);
      }
      const ty = Math.max(0.3, shapeTopAt(sh, fz - 0.05) - 0.12);
      for (const s of [-1, 1]) lamp(0.22, 0.05, amberM, s * W * 0.3, ty, true);
    } else {
      const hy = D.lampY ? D.lampY * sh.H - sh.drop : shapeTopAt(sh, fz - 0.08) - 0.085;
      for (const s of [-1, 1]) {
        if (D.lights === 'round4') {
          for (const fx of [0.385, 0.25]) { const l = lamp(0.15, 0.15, headM, s * W * fx, hy - 0.01, true, 'chrome'); if (fx > 0.3) lightGlows.push([s * W * fx, hy, l.z + 0.02]); }
          lamp(0.09, 0.04, amberM, s * W * 0.4, hy - 0.2, true);
        } else if (D.lights === 'round2') {
          const l = lamp(0.16, 0.16, headM, s * W * 0.33, hy, true, 'chrome'); lightGlows.push([s * W * 0.33, hy, l.z + 0.02]);
          lamp(0.07, 0.07, amberM, s * W * 0.33, hy + 0.14, true, true);
        } else if (D.lights === 'slit') {
          const l = lamp(0.46, 0.06, headM, s * W * 0.27, hy - 0.02, true); lightGlows.push([s * W * 0.27, hy, l.z + 0.02]);
          lamp(0.12, 0.04, amberM, s * W * 0.43, hy - 0.12, true);
        } else {
          const l = lamp(0.38, 0.105, headM, s * W * 0.3, hy, true); lightGlows.push([s * W * 0.3, hy, l.z + 0.02]);
          lamp(0.1, 0.05, amberM, s * W * 0.43, hy - 0.11, true);
        }
      }
    }
    // side markers on the front fenders
    for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.012, 0.03, 0.07), amberM, s * (sideX(0.5, zf + ra + 0.12) + 0.004), 0.5 - sh.drop, zf + ra + 0.12);
    // grille and plates
    const gy = D.lampY ? D.lampY * sh.H - sh.drop - 0.02 : D.lights === 'round4' ? shapeTopAt(sh, fz - 0.08) - 0.095 : Math.max(0.28, shapeTopAt(sh, fz - 0.1) - 0.2);
    const gw = D.lights === 'round4' ? 0.2 : D.grille === 'chrome' ? 0.3 : 0.4, gh = D.lights === 'round4' || D.grille === 'chrome' ? 0.14 : 0.09;
    box(W * gw, gh, 0.04, trimM, 0, gy, frontX(W * gw / 2, gy) - 0.012);
    for (let i = 0; i < (gh > 0.1 ? 5 : 3); i++) box(W * (gw - 0.02), 0.008, 0.042, chromeM, 0, gy - gh / 2 + 0.015 + i * 0.03, frontX(W * gw / 2, gy) - 0.008);
    if (D.grille === 'chrome') { for (const sx of [-1, 1]) box(0.012, gh + 0.02, 0.046, chromeM, sx * W * gw / 2, gy, frontX(W * gw / 2, gy) - 0.008); box(W * gw + 0.02, 0.012, 0.046, chromeM, 0, gy + gh / 2 + 0.006, frontX(W * gw / 2, gy) - 0.008); }
    const yF = S2.yFloor;
    // lower air intake and brake ducts in the front bumper
    if (!D.bed && D.bumpers !== 'chrome' && !vis.bumper) { const iy = Math.max(0.2, yF + 0.105); box(W * 0.42, 0.055, 0.03, darkM, 0, iy, frontX(W * 0.21, iy) + 0.004); for (const sx of [-1, 1]) box(W * 0.13, 0.05, 0.03, darkM, sx * W * 0.36, iy, frontX(W * 0.42, iy) + 0.004); }
    if (D.bumpers === 'chrome') for (const [zz, dir] of [[fz, 1], [rz, -1]]) { const by = 0.47 - sh.drop; box(W * 0.99, 0.075, 0.08, chromeM, 0, by, zz + dir * 0.015); for (const sx of [-1, 1]) { box(0.05, 0.14, 0.09, chromeM, sx * W * 0.25, by, zz + dir * 0.03); box(0.06, 0.075, 0.2, chromeM, sx * (W * 0.495 - 0.02), by, zz - dir * 0.07); } }
    const plate = mk(new THREE.MeshBasicMaterial({ map: this.plateTexture(opts.plate ? opts.plate[0] : '黒沢 330', opts.plate ? opts.plate[1] : '12-34', track), color: 0xbbbbbb }));
    const ply = Math.max(0.26, gy - 0.13);
    add(new THREE.PlaneGeometry(0.33, 0.165), plate, 0, ply, frontX(0.17, ply) + 0.006);
    const rply = Math.max(0.3, shapeTopAt(sh, rz + 0.05) - 0.36);
    add(new THREE.PlaneGeometry(0.33, 0.165), plate, 0, rply, rearX(0.17, rply) - 0.006, 0, Math.PI, 0);
    // taillights
    const tails = [], tailGlows = [];
    const ty = shapeTopAt(sh, rz + 0.04) - 0.11;
    const tailBox = (w, h, x, y, round) => { const l = lamp(w, h, tailM, x, y, false, round); tails.push(l.lens); tailGlows.push([x, y, l.z - 0.02]); };
    if (D.tail === 'band') { const bz = rearX(W * 0.45, ty); box(W * 0.6, 0.1, 0.03, trimM, 0, ty, bz + 0.02); for (const s of [-1, 1]) tailBox(W * 0.28, 0.1, s * W * 0.3, ty); }
    else if (D.tail === 'corner') for (const s of [-1, 1]) tailBox(0.22, 0.16, s * W * 0.36, ty - 0.03);
    else if (D.tail === 'round') { box(W * 0.74, 0.17, 0.03, trimM, 0, ty - 0.02, rearX(W * 0.4, ty) + 0.018); for (const s of [-1, 1]) { tailBox(0.16, 0.16, s * W * 0.33, ty - 0.02, true); tailBox(0.12, 0.12, s * W * 0.19, ty - 0.02, true); } }
    else for (const s of [-1, 1]) { tailBox(0.14, 0.14, s * W * 0.37, ty, true); tailBox(0.14, 0.14, s * W * 0.22, ty, true); }
    // mirrors on a stem, door handles, wipers
    const gF = sh.glass.length ? Math.max(...sh.glass[sh.glass.length - 1].map(p => p[0])) : sh.cowlZ;
    for (const s of [-1, 1]) {
      const mx = sideX(belt + 0.02, gF - 0.06), mk2 = vis.mirrors || (D.fenderMirror ? 'fender' : null);
      if (mk2 === 'fender') {
        const fmz = zf + 0.05, fmy = shapeTopAt(sh, fmz), fmx = S2.planW(fmz) * 0.8;
        const st = box(0.014, 0.1, 0.014, chromeM, s * fmx, fmy + 0.045, fmz); st.rotation.z = -s * 0.25;
        box(0.1, 0.065, 0.05, chromeM, s * (fmx + 0.02), fmy + 0.11, fmz); box(0.085, 0.05, 0.004, darkM, s * (fmx + 0.02), fmy + 0.11, fmz - 0.027);
      } else if (mk2 === 'aero') {
        box(0.1, 0.014, 0.03, carbonM, s * (mx + 0.04), belt + 0.05, gF - 0.07);
        const cap = box(0.045, 0.05, 0.11, carbonM, s * (mx + 0.11), belt + 0.06, gF - 0.08); cap.rotation.y = s * 0.2;
      } else {
        box(0.08, 0.025, 0.05, trimM, s * (mx + 0.03), belt + 0.035, gF - 0.06);
        const cap = box(0.07, 0.085, 0.13, paintM, s * (mx + 0.1), belt + 0.075, gF - 0.08); cap.rotation.y = s * 0.12;
        box(0.004, 0.065, 0.1, darkM, s * (mx + 0.137), belt + 0.075, gF - 0.08);
      }
      const hz = doorR + (isFour ? 0.0 : 0.12), hx = sideX(belt - 0.1, hz);
      box(0.012, 0.022, 0.11, trimM, s * (hx + 0.006), belt - 0.1, hz);
      if (isFour) { const hz2 = zr + ra + 0.24; box(0.012, 0.022, 0.1, trimM, s * (sideX(belt - 0.1, hz2) + 0.006), belt - 0.1, hz2); }
    }
    const ws = sh.up.filter(p => p[0] > sh.pillarZ && p[1] > belt - 0.02 && p[1] < roof - 0.02).sort((a, b) => a[1] - b[1]);
    if (ws.length) { const wb = ws[0]; for (const s of [-1, 0.15]) { const wp = box(0.52, 0.012, 0.018, trimM, s * W * 0.2, wb[1] + 0.02, wb[0] - 0.05); wp.rotation.y = s < 0 ? 0.12 : -0.05; } }
    // exhausts: twin for the big sixes and the rally car
    const big = !!(M.engine.turbo || opts.turbo), twin = ['gt4', 'raijin', 'arashi', 'cresta'].includes(model);
    const er = big ? 0.048 : 0.036, eg = new THREE.CylinderGeometry(er, er * 0.92, 0.16, 14, 1, true); eg.rotateX(Math.PI / 2); track.push(eg);
    const innerM = mk(new THREE.MeshBasicMaterial({ color: 0x050505, side: THREE.DoubleSide }));
    const tip = (x) => { const ez = rearX(Math.abs(x), 0.26) - 0.03, t = new THREE.Mesh(eg, chromeM); t.position.set(x, 0.24 - sh.drop * 0.5, ez); body.add(t); const cap = new THREE.Mesh(new THREE.CircleGeometry(er * 0.85, 14), innerM); cap.position.set(x, 0.24 - sh.drop * 0.5, ez - 0.02); cap.rotation.y = Math.PI; body.add(cap); track.push(cap.geometry); };
    const tube = (a, b, r, mat) => { const d = new THREE.Vector3().subVectors(b, a), len = d.length(), cg = new THREE.CylinderGeometry(r, r, len, 8); track.push(cg); const me = new THREE.Mesh(cg, mat); me.position.copy(a).addScaledVector(d, 0.5); me.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); body.add(me); return me; };
    const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
    const pipeM = vis.pipes === 'takeyari' ? mk(std({ color: 0xe6e8ec, roughness: 0.3, metalness: 0.55, envMap: env, envMapIntensity: 1 })) : null;
    if (vis.pipes === 'takeyari') {
      for (const [sx, len] of [[0.22, 1.25], [0.34, 1.05]]) { const ez = rearX(W * sx, 0.3) - 0.02, y0 = 0.25 - sh.drop * 0.5; tube(V3(W * sx, y0, ez + 0.2), V3(W * sx, y0, ez - 0.04), 0.03, pipeM); tube(V3(W * sx, y0, ez - 0.03), V3(W * sx + 0.05, y0 + len * 0.82, ez - len * 0.57), 0.03, pipeM); }
    } else if (vis.pipes === 'cannon') {
      const ez = rearX(W * 0.28, 0.26) - 0.05, burnt = mk(std({ color: 0x6a5fb0, roughness: 0.2, metalness: 1, envMap: env, envMapIntensity: 1.4 }));
      const cg = new THREE.CylinderGeometry(0.075, 0.062, 0.3, 16, 1, true); cg.rotateX(Math.PI / 2); add(cg, burnt, W * 0.28, 0.25 - sh.drop * 0.5, ez);
      const cap = add(new THREE.CircleGeometry(0.066, 16), innerM, W * 0.28, 0.25 - sh.drop * 0.5, ez + 0.02, 0, Math.PI, 0);
    } else if (twin) { tip(W * 0.3); tip(-W * 0.3); } else tip(W * 0.28);
    // spoilers
    const wing = vis.wing || (D.spoiler === 'wing' ? 'gt' : D.spoiler === 'trunk' ? 'lip' : null);
    if (D.spoiler === 'roof' && !vis.wing) {
      const rp = sh.up.find(p => p[1] > roof - 0.04); box(W * 0.72, 0.035, 0.26, paintM, 0, rp[1] + 0.012, rp[0] - 0.06);
    } else if (wing === 'gt') {
      const wz = rz + 0.28, base = shapeTopAt(sh, wz), wy = base + (vis.wing ? 0.24 : 0.16);
      const blade = box(W * 0.92, 0.03, 0.3, vis.wing ? trimM : paintM, 0, wy, wz); blade.rotation.x = 0.06;
      for (const s of [-1, 1]) { box(0.035, wy - base, 0.09, vis.wing ? trimM : paintM, s * W * 0.32, (wy + base) / 2, wz); box(0.014, 0.12, 0.34, trimM, s * W * 0.465, wy + 0.02, wz); }
    } else if (wing === 'boso') {
      const wz = rz + 0.22, base = shapeTopAt(sh, wz), wy = base + 0.62;
      const blade = box(W * 0.8, 0.028, 0.34, paintM, 0, wy, wz - 0.3); blade.rotation.x = 0.3;
      for (const s of [-1, 1]) { tube(V3(s * W * 0.3, base - 0.02, wz + 0.05), V3(s * W * 0.3, wy, wz - 0.3), 0.016, chromeM); tube(V3(s * W * 0.3, base - 0.02, wz - 0.12), V3(s * W * 0.3, wy - 0.03, wz - 0.38), 0.012, chromeM); box(0.012, 0.16, 0.38, paintM, s * W * 0.405, wy, wz - 0.3).rotation.x = 0.3; }
    } else if (wing === 'swan') {
      const wz = rz + 0.24, base = shapeTopAt(sh, wz), wy = base + 0.3;
      const blade = box(W * 1.0, 0.026, 0.3, carbonM, 0, wy, wz); blade.rotation.x = 0.1;
      const flap = box(W * 1.0, 0.02, 0.09, carbonM, 0, wy + 0.045, wz - 0.17); flap.rotation.x = 0.5;
      for (const s of [-1, 1]) { tube(V3(s * W * 0.27, base - 0.02, wz + 0.16), V3(s * W * 0.27, wy + 0.07, wz + 0.1), 0.012, trimM); tube(V3(s * W * 0.27, wy + 0.07, wz + 0.1), V3(s * W * 0.27, wy + 0.02, wz - 0.02), 0.012, trimM); box(0.012, 0.2, 0.42, carbonM, s * W * 0.505, wy + 0.02, wz - 0.02); }
    } else if (wing === 'duck') {
      const wz = rz + 0.16, wy = shapeTopAt(sh, wz) + 0.04; const dk = box(W * 0.86, 0.035, 0.28, paintM, 0, wy, wz); dk.rotation.x = -0.38;
    } else if (wing === 'lip') {
      const wz = rz + 0.12, wy = shapeTopAt(sh, wz) + 0.025; const lip = box(W * 0.82, 0.03, 0.2, paintM, 0, wy, wz); lip.rotation.x = -0.18;
    }
    if (D.scoop) box(0.36, 0.05, 0.3, paintM, 0, shapeTopAt(sh, sh.cowlZ + 0.45) + 0.02, sh.cowlZ + 0.45);
    if (vis.hood === 'vent') for (let i = 0; i < 4; i++) { const z = sh.cowlZ + 0.25 + i * 0.09; for (const sx of [-1, 1]) box(0.26, 0.014, 0.045, darkM, sx * 0.2, shapeTopAt(sh, z) + 0.004, z); }
    if (vis.fogs) for (const sx of [-1, 1]) { const fy = Math.max(0.27, S2.yFloor + 0.1); const l = lamp(0.14, 0.06, headM, sx * W * 0.3, fy, true); lightGlows.push([sx * W * 0.3, fy, l.z + 0.02]); }
    // tribal / kanji graphics on the doors
    if (!ghost && !cheap && (GRAPHIC_LIV.has(vis.livery) || vis.decal)) {
      const z0 = zr + ra + 0.05, z1 = zf - ra - 0.05, y1 = belt - 0.07, y0 = 0.3 - sh.drop, gw = z1 - z0, gh = y1 - y0;
      const px = Math.max(sideX(y0, (z0 + z1) / 2), sideX((y0 + y1) / 2, (z0 + z1) / 2), sideX(y1, (z0 + z1) / 2), sideX((y0 + y1) / 2, z0), sideX((y0 + y1) / 2, z1)) + 0.006;
      for (const sx of [-1, 1]) {
        const cv = document.createElement('canvas'); cv.width = 512; cv.height = Math.round(512 * gh / gw); const gg = cv.getContext('2d');
        // text always reads left to right; a graphic that points forward is mirrored on the right-hand side
        if (GRAPHIC_LIV.has(vis.livery)) { gg.save(); if (sx > 0 && DIRECTIONAL_LIV.has(vis.livery)) { gg.translate(cv.width, 0); gg.scale(-1, 1); } drawLiveryGraphic(gg, vis.livery, vis.col2 || '#141418', 0, 0, cv.width, cv.height); gg.restore(); }
        if (vis.decal) { gg.save(); if (vis.decal === 'bomb' && sx > 0) { gg.translate(cv.width, 0); gg.scale(-1, 1); } drawDecal(gg, vis.decal, cv.width, cv.height); gg.restore(); }
        const tex = new THREE.CanvasTexture(cv); track.push(tex);
        const lm = mk(new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: PB[1], metalness: 0, envMap: env, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
        const pg = new THREE.PlaneGeometry(gw, gh); track.push(pg);
        const pl = new THREE.Mesh(pg, lm); pl.position.set(sx * px, (y0 + y1) / 2, (z0 + z1) / 2); pl.rotation.y = sx * Math.PI / 2; body.add(pl);
      }
    }
    // windshield banner
    if (!ghost && vis.banner) {
      const wsp = sh.up.filter(p => p[0] > sh.pillarZ && p[1] > belt && p[1] < roof - 0.005).sort((a, b) => b[1] - a[1]);
      if (wsp.length >= 2) {
        const tp = wsp[0], bt = wsp[wsp.length - 1], dz = tp[0] - bt[0], dy = tp[1] - bt[1], nn = Math.hypot(dz, dy), bh = nn * 0.26;
        const cv = document.createElement('canvas'); cv.width = 512; cv.height = 72; const gg = cv.getContext('2d');
        gg.fillStyle = '#111216'; gg.fillRect(0, 0, 512, 72); gg.fillStyle = '#f2efe6'; gg.font = `800 italic 46px ${cssVar('--f-disp')}`; gg.textAlign = 'center'; gg.fillText(vis.bannerText || 'YORU TŌGE', 256, 52);
        const tex = new THREE.CanvasTexture(cv); track.push(tex);
        const bw = 2 * S2.planW(tp[0]) * 0.72, pg = new THREE.PlaneGeometry(bw, bh); track.push(pg);
        const bm = mk(new THREE.MeshBasicMaterial({ map: tex, color: 0x9a968c, polygonOffset: true, polygonOffsetFactor: -2 }));
        const bn = new THREE.Mesh(pg, bm), t = 0.13;
        bn.position.set(0, tp[1] - dy * t + 0.014, tp[0] - dz * t + 0.012 * dy / nn);
        bn.rotation.x = Math.atan2(dz, dy); body.add(bn);
      }
    }
    // patrol car: roof light bar and the prefecture's name on the doors
    let police = null;
    if (opts.police && !ghost) {
      let top = -1, zs = [];
      for (let z = -L / 2 + 0.2; z < L / 2 - 0.2; z += 0.04) { const t = shapeTopAt(sh, z); if (t > top + 0.004) { top = t; zs = [z]; } else if (t > top - 0.006) zs.push(z); }
      const zc = zs.length ? (zs[0] + zs[zs.length - 1]) / 2 : 0;
      box(W * 0.64, 0.05, 0.26, trimM, 0, top + 0.04, zc);
      const mL = mk(new THREE.MeshBasicMaterial({ color: 0x3a0606 })), mR = mk(new THREE.MeshBasicMaterial({ color: 0x3a0606 }));
      box(W * 0.27, 0.075, 0.22, mL, -W * 0.17, top + 0.095, zc); box(W * 0.27, 0.075, 0.22, mR, W * 0.17, top + 0.095, zc);
      box(W * 0.07, 0.06, 0.2, chromeM, 0, top + 0.09, zc);
      const sprites = [];
      if (glow) { const pm = mk(new THREE.SpriteMaterial({ map: glow, color: 0xff1a1a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })), pm2 = mk(pm.clone());
        for (const [sx, m2] of [[-1, pm], [1, pm2]]) { const s = new THREE.Sprite(m2); s.position.set(sx * W * 0.17, top + 0.1, zc); s.scale.set(1.6, 1.6, 1); body.add(s); sprites.push(s); } }
      const z0 = sh.cowlZ - 0.12, z1 = sh.pillarZ + 0.02, y1 = belt - 0.07, y0 = belt - 0.25, gw = Math.abs(z0 - z1), gh = y1 - y0;
      const cv = document.createElement('canvas'); cv.width = 512; cv.height = Math.max(32, Math.round(512 * gh / gw)); const gg = cv.getContext('2d');
      gg.fillStyle = '#121214'; gg.font = `700 ${Math.round(cv.height * 0.78)}px ${cssVar('--f-jp')}`; gg.textAlign = 'center'; gg.textBaseline = 'middle';
      gg.save(); const tw = gg.measureText('峠県警察').width; gg.translate(256, cv.height * 0.54); gg.scale(Math.min(1, 470 / tw), 1); gg.fillText('峠県警察', 0, 0); gg.restore();
      const tex = new THREE.CanvasTexture(cv); track.push(tex);
      const lm = mk(new THREE.MeshBasicMaterial({ map: tex, transparent: true, color: 0x999999, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
      const zm = (z0 + z1) / 2, px = Math.max(sideX(y0, zm), sideX(y1, zm), sideX((y0 + y1) / 2, z0), sideX((y0 + y1) / 2, z1)) + 0.006;
      for (const sx of [-1, 1]) { const pg = new THREE.PlaneGeometry(gw, gh); track.push(pg); const pl = new THREE.Mesh(pg, lm); pl.position.set(sx * px, (y0 + y1) / 2, zm); pl.rotation.y = sx * Math.PI / 2; body.add(pl); }
      police = { mL, mR, sprites, top, zc };
    }
    if (vis.kit) {
      const ly = Math.max(0.12, S2.yFloor - 0.02);
      box(W * 0.86, 0.045, 0.1, trimM, 0, ly + 0.03, frontX(W * 0.43, ly + 0.08) - 0.02);
      for (const s of [-1, 1]) box(0.05, 0.065, zf - zr - 2 * ra - 0.1, trimM, s * (sideX(ly + 0.1, (zf + zr) / 2) + 0.01), ly + 0.04, (zf + zr) / 2);
    }
    if (vis.bumper === 'aero') {
      const by = Math.max(0.16, yF + 0.07), bz = frontX(W * 0.47, by + 0.05);
      box(W * 0.95, 0.15, 0.13, paintM, 0, by + 0.02, bz - 0.035); box(W * 0.56, 0.085, 0.03, darkM, 0, by + 0.03, bz + 0.031);
      for (const sx of [-1, 1]) { box(W * 0.13, 0.07, 0.03, darkM, sx * W * 0.38, by + 0.03, bz + 0.031); box(0.02, 0.11, 0.2, paintM, sx * W * 0.475, by + 0.02, bz - 0.11); }
      box(W * 0.9, 0.014, 0.2, carbonM, 0, by - 0.06, bz - 0.02);
    } else if (vis.bumper === 'deppa') {
      const by = Math.max(0.13, yF + 0.03), bz = frontX(W * 0.45, by + 0.08);
      const chin = box(W * 0.93, 0.03, 0.38, paintM, 0, by, bz + 0.1); chin.rotation.x = 0.1;
      box(W * 0.9, 0.11, 0.05, paintM, 0, by + 0.065, bz - 0.04); box(W * 0.5, 0.06, 0.02, darkM, 0, by + 0.07, bz - 0.012);
      for (const sx of [-1, 1]) tube(V3(sx * W * 0.3, by + 0.02, bz + 0.24), V3(sx * W * 0.3, by + 0.2, bz - 0.01), 0.008, chromeM);
    }
    if (vis.canards) for (const sx of [-1, 1]) for (const k of [0, 1]) { const cz = fz - 0.2 - k * 0.04, cy = Math.max(0.2, yF + 0.1) + 0.06 + k * 0.1, cn = box(0.17, 0.01, 0.15, carbonM, sx * (S2.planW(cz) + 0.05), cy, cz); cn.rotation.z = sx * 0.3; cn.rotation.x = -0.22; }
    if (vis.diffuser) { const dz = rz + 0.14, dy = Math.max(0.13, yF + 0.02), df = box(W * 0.72, 0.02, 0.34, carbonM, 0, dy, dz); df.rotation.x = 0.22; for (let i = -2; i <= 2; i++) box(0.012, 0.085, 0.32, carbonM, i * W * 0.15, dy + 0.035, dz).rotation.x = 0.22; }
    if (vis.roofscoop) { let top = 0, zt = 0; for (let z = sh.cowlZ; z > sh.pillarZ - 0.3; z -= 0.05) { const t = shapeTopAt(sh, z); if (t > top + 0.002) { top = t; zt = z; } } box(0.36, 0.075, 0.42, paintM, 0, top + 0.03, zt - 0.12); box(0.3, 0.05, 0.01, darkM, 0, top + 0.035, zt + 0.092); }
    if (vis.louver) {
      const rg = sh.up.filter(p => p[0] < sh.pillarZ - 0.05 && p[1] > belt + 0.03 && p[1] < roof - 0.012).sort((a, b) => a[1] - b[1]);
      if (rg.length >= 2) { const a = rg[0], b = rg[rg.length - 1], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), n = 6;
        for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, z = lerp(a[0], b[0], t), y = lerp(a[1], b[1], t), sl = box(2 * S2.planW(z) * (0.62 + 0.1 * (1 - t)), 0.012, 0.1, trimM, 0, y + 0.03, z); sl.rotation.x = -ang + 0.55; }
        for (const sx of [-1, 1]) { const rail = box(0.02, 0.02, Math.hypot(b[0] - a[0], b[1] - a[1]), trimM, sx * S2.planW((a[0] + b[0]) / 2) * 0.68, (a[1] + b[1]) / 2 + 0.03, (a[0] + b[0]) / 2); rail.rotation.x = -ang; } }
    }
    if (vis.pod) {
      const pz = fz - 0.34, py = shapeTopAt(sh, pz) + 0.1; box(W * 0.62, 0.02, 0.03, trimM, 0, py - 0.085, pz);
      for (const fx of [-0.24, -0.08, 0.08, 0.24]) { const hg = new THREE.CylinderGeometry(0.08, 0.06, 0.09, 14); hg.rotateX(Math.PI / 2); add(hg, trimM, W * fx, py, pz); add(new THREE.CircleGeometry(0.072, 14), headM, W * fx, py, pz + 0.047); lightGlows.push([W * fx, py, pz + 0.07]); }
    }
    if (vis.towhook) { const ty2 = Math.max(0.2, yF + 0.12), tg2 = new THREE.TorusGeometry(0.035, 0.011, 6, 12), redM = mk(new THREE.MeshLambertMaterial({ color: 0xd0161e })); tg2.rotateY(Math.PI / 2); add(tg2, redM, -W * 0.3, ty2, frontX(W * 0.3, ty2) + 0.04); }
    if (vis.oilcooler) { const oy = 0.36 - sh.drop, oz = frontX(W * 0.3, oy) + 0.04; box(0.24, 0.1, 0.035, chromeM, -W * 0.22, oy, oz); for (let i = 0; i < 5; i++) box(0.22, 0.004, 0.04, darkM, -W * 0.22, oy - 0.035 + i * 0.018, oz); for (const k of [-1, 1]) tube(V3(-W * 0.22 + k * 0.1, oy, oz), V3(-W * 0.08 + k * 0.03, oy - 0.14, oz - 0.12), 0.011, chromeM); }
    if (D.bed) { // kei truck: cab guard frame and the drop sides of the bed
      const bz0 = sh.pillarZ - 0.03, by = shapeTopAt(sh, rz + 0.3);
      for (const sx of [-1, 1]) tube(V3(sx * W * 0.42, by, bz0), V3(sx * W * 0.42, roof - 0.12, bz0), 0.018, trimM);
      tube(V3(-W * 0.42, roof - 0.12, bz0), V3(W * 0.42, roof - 0.12, bz0), 0.018, trimM); tube(V3(-W * 0.42, (by + roof) / 2, bz0), V3(W * 0.42, (by + roof) / 2, bz0), 0.012, trimM);
      for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) box(0.01, 0.2, 0.012, darkM, sx * (sideX(by - 0.12, rz + 0.5) + 0.004), by - 0.13, rz + 0.25 + i * (bz0 - rz - 0.4) / 3);
      box(W * 0.86, 0.006, bz0 - rz - 0.12, darkM, 0, by + 0.004, (bz0 + rz) / 2);
    }
    if (opts.bay && hood) this.engineBay(model, sh, S2, vis, opts, { box, add, tube, V3, mk, std, env, track, trimM, chromeM, darkM });
    // ---- cabin: what you see through the glass
    if (seeIn) {
      const intM = mk(new THREE.MeshLambertMaterial({ color: 0x17181c })), seatM = mk(new THREE.MeshLambertMaterial({ color: vis.seat ? 0xa8201c : 0x2b2d34 }));
      const fy = yF + 0.13, cabR = D.bed ? sh.pillarZ + 0.04 : Math.min(sh.pillarZ - 0.25, zr + 0.25), cabF = D.bed ? fz - 0.12 : sh.cowlZ + 0.05, cw = W - 0.18;
      box(cw, 0.04, cabF - cabR + 0.3, intM, 0, fy, (cabF + cabR) / 2 - 0.1);
      const wsb = sh.up.filter(p => p[0] > sh.pillarZ && p[1] > belt + 0.01).reduce((m, p) => Math.max(m, p[0]), sh.pillarZ + 0.5); const dashZ = (D.bed ? fz - 0.2 : Math.min(sh.cowlZ, wsb)) - 0.34; box(cw, 0.2, 0.3, intM, 0, belt - 0.13, dashZ);
      const swz = dashZ - 0.25, sw = new THREE.TorusGeometry(0.165, 0.016, 6, 18); add(sw, trimM, W * 0.2, belt + 0.03, swz, -0.38, 0, 0); tube(V3(W * 0.2, belt + 0.03, swz), V3(W * 0.2, belt - 0.03, dashZ - 0.05), 0.02, trimM);
      const zs = sh.pillarZ + (D.bed ? 0.16 : 0.12), headTop = Math.min(roof - 0.1, belt + 0.3);
      for (const sx of [-1, 1]) {
        box(0.4, 0.11, 0.44, seatM, sx * W * 0.2, fy + 0.18, zs + 0.26);
        const bk = box(vis.seat ? 0.36 : 0.4, belt + 0.1 - fy - 0.2, 0.09, seatM, sx * W * 0.2, (belt + 0.1 + fy + 0.2) / 2, zs + 0.02); bk.rotation.x = -0.18;
        box(vis.seat ? 0.26 : 0.2, Math.max(0.08, headTop - belt - 0.12), 0.08, seatM, sx * W * 0.2, (headTop + belt + 0.12) / 2, zs - 0.06);
        if (vis.seat) for (const k of [-1, 1]) box(0.04, 0.22, 0.16, seatM, sx * W * 0.2 + k * 0.19, fy + 0.4, zs + 0.08);
      }
      box(0.16, 0.2, cabF - zs - 0.25, intM, 0, fy + 0.12, (cabF + zs) / 2 + 0.05); tube(V3(0, fy + 0.2, zs + 0.5), V3(0, fy + 0.42, zs + 0.52), 0.012, chromeM);
      if (!D.bed && !['mizuchi', 'kamui', 'hayate', 'twinr'].includes(model) && sh.pillarZ - cabR > 0.2 && !vis.strip) { box(cw * 0.84, 0.11, 0.36, seatM, 0, fy + 0.2, zs - 0.5); const rb = box(cw * 0.84, belt - fy - 0.12, 0.09, seatM, 0, (belt + fy) / 2 + 0.08, zs - 0.7); rb.rotation.x = -0.25; }
      if (vis.cage) {
        const cgM = mk(new THREE.MeshLambertMaterial({ color: 0xd4d7dc })), hx = W * 0.5 - 0.17, hz = sh.pillarZ - 0.06, ht = roof - 0.07, az = sh.cowlZ - 0.08;
        const bar = (a, b) => tube(a, b, 0.021, cgM);
        for (const sx of [-1, 1]) { bar(V3(sx * hx, fy, hz), V3(sx * hx * 0.9, ht, hz)); bar(V3(sx * hx * 0.9, ht, hz), V3(sx * hx * 0.86, ht - 0.03, hz + (az - hz) * 0.62)); bar(V3(sx * hx * 0.86, ht - 0.03, hz + (az - hz) * 0.62), V3(sx * hx, belt, az)); bar(V3(sx * hx, belt, az), V3(sx * hx, fy, az)); bar(V3(sx * hx * 0.9, ht, hz), V3(sx * hx * 0.8, belt - 0.05, Math.max(cabR, hz - 0.9))); bar(V3(sx * hx, fy + 0.15, hz), V3(sx * hx, belt - 0.12, az)); }
        bar(V3(-hx * 0.9, ht, hz), V3(hx * 0.9, ht, hz)); bar(V3(-hx, fy + 0.1, hz), V3(hx * 0.9, ht, hz)); bar(V3(-hx * 0.86, ht - 0.03, hz + (az - hz) * 0.62), V3(hx * 0.86, ht - 0.03, hz + (az - hz) * 0.62));
      }
      if (vis.intneon) { const ig = new THREE.PlaneGeometry(cw * 0.9, cabF - cabR - 0.2); ig.rotateX(-Math.PI / 2); const im = mk(new THREE.MeshBasicMaterial({ map: glow, color: vis.neonColor || '#4ee6d4', transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })); const ip = new THREE.Mesh(ig, im); track.push(ig); ip.position.set(0, fy + 0.05, (cabF + cabR) / 2); ip.renderOrder = 1; body.add(ip); const ig2 = ig.clone(); track.push(ig2); const ip2 = new THREE.Mesh(ig2, im); ip2.position.set(0, belt + 0.02, (cabF + cabR) / 2); ip2.renderOrder = 1; body.add(ip2); }
    }
    // ---- wheels: shaped tyre, deep rim with a polished lip, brake disc and caliper behind
    const wr = sh.wheels.r, rr = wr * 0.655, tw = flare > 0.06 ? 0.245 : 0.21, wheels = [];
    const prof = []; // tyre cross-section (radius, x)
    const tp = [[rr * 1.02, -tw / 2 + 0.01], [rr * 1.12, -tw / 2], [wr * 0.9, -tw / 2 - 0.004], [wr * 0.97, -tw / 2 + 0.012], [wr, -tw / 2 + 0.035], [wr, tw / 2 - 0.035], [wr * 0.97, tw / 2 - 0.012], [wr * 0.9, tw / 2 + 0.004], [rr * 1.12, tw / 2], [rr * 1.02, tw / 2 - 0.01]];
    for (const [r, x] of tp) prof.push(new THREE.Vector2(r, x));
    const tireG = new THREE.LatheGeometry(prof, cheap ? 14 : 28); tireG.rotateZ(-Math.PI / 2); track.push(tireG);
    const barrelG = new THREE.CylinderGeometry(rr, rr, tw - 0.03, cheap ? 12 : 24, 1, true); barrelG.rotateZ(Math.PI / 2); track.push(barrelG);
    const lipG = new THREE.TorusGeometry(rr * 0.985, 0.012, 6, cheap ? 14 : 28); lipG.rotateY(Math.PI / 2); track.push(lipG);
    const style = vis.wheel || 'stock', WS = WHEEL_STYLES[style] || WHEEL_STYLES.stock, dish = WS.dish || 0.012;
    const rimInM = mk(std({ color: 0x3a3c42, roughness: 0.5, metalness: 0.7, envMap: env, envMapIntensity: 0.5, side: THREE.DoubleSide }));
    const discG = new THREE.CylinderGeometry(rr * (opts.bbk ? 0.9 : 0.8), rr * (opts.bbk ? 0.9 : 0.8), 0.024, 20); discG.rotateZ(Math.PI / 2); track.push(discG);
    const discM = mk(std({ color: 0x6d7076, roughness: 0.42, metalness: 0.85, envMap: env, envMapIntensity: 0.5 }));
    const bbk = opts.bbk, calM = mk(std({ color: bbk ? 0xc3121f : 0x2b2d32, roughness: 0.45, metalness: 0.2 }));
    const calG = new THREE.BoxGeometry(0.055, rr * (bbk ? 0.62 : 0.5), rr * (bbk ? 0.42 : 0.3)); track.push(calG);
    // the centre: real spokes where the design has them, a painted disc for steel wheels and covers
    let faceG, faceM, ringG = null;
    const xf = tw / 2 - 0.012 - dish;
    if (WS.n && !cheap) {
      faceG = this.spokeGeo(WS, rr, xf); track.push(faceG);
      faceM = mk(std({ color: WS.color, roughness: WS.rough || 0.35, metalness: WS.metal == null ? 0.7 : WS.metal, envMap: env, envMapIntensity: 0.9 }));
      if (WS.rim) { ringG = new THREE.RingGeometry(rr * WS.rim, rr * 0.985, 28); ringG.rotateY(Math.PI / 2); track.push(ringG); }
    } else {
      faceG = new THREE.CircleGeometry(rr * 0.97, cheap ? 14 : 24); faceG.rotateY(Math.PI / 2); faceG.translate(xf, 0, 0); track.push(faceG);
      faceM = mk(std({ map: this.wheelTexture(style, track), color: 0xffffff, roughness: 0.35, metalness: style === 'white' ? 0.1 : 0.6, envMap: env, envMapIntensity: 0.8 }));
    }
    let letG = null, letM = null;
    if (vis.tirelet && !cheap) { letG = new THREE.RingGeometry(rr * 1.1, wr * 0.95, 36); letG.rotateY(Math.PI / 2); track.push(letG); letM = mk(new THREE.MeshBasicMaterial({ map: this.letterTexture(track), transparent: true, color: 0xb8b8b0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })); }
    const wx = W / 2 - 0.1 + flare * 0.8, cb = opts.camber || [0, 0], camb = [clamp(cb[0], -12, 2) * Math.PI / 180, clamp(cb[1], -12, 2) * Math.PI / 180];
    for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
      const wg = new THREE.Group(), out = new THREE.Group(); if (sx < 0) out.rotation.y = Math.PI;
      out.add(new THREE.Mesh(tireG, tireM), new THREE.Mesh(barrelG, rimInM));
      const lip = new THREE.Mesh(lipG, chromeM); lip.position.x = tw / 2 - 0.012;
      const disc = new THREE.Mesh(discG, discM); disc.position.x = tw / 2 - 0.085 - dish;
      out.add(lip, new THREE.Mesh(faceG, faceM), disc);
      if (ringG) { const rg2 = new THREE.Mesh(ringG, chromeM); rg2.position.x = xf + 0.004; out.add(rg2); }
      if (letG) { const lt = new THREE.Mesh(letG, letM); lt.position.x = tw / 2 + 0.003; out.add(lt); }
      wg.add(out);
      const spin = new THREE.Group(), cam = new THREE.Group(); cam.rotation.z = (sz > 0 ? camb[0] : camb[1]) * -sx; cam.add(wg); spin.add(cam);
      const cal = new THREE.Mesh(calG, calM); cal.position.set(sx * (tw / 2 - 0.085 - dish), rr * 0.5, sz > 0 ? -rr * 0.3 : rr * 0.3); cal.rotation.x = sz > 0 ? 0.5 : -0.5; cam.add(cal);
      spin.position.set(sx * wx, wr, sz > 0 ? zf : zr); g.add(spin); wheels.push({ spin, wg, front: sz > 0 });
    }
    // ---- glows (the part you actually see at night)
    const tailSprites = [];
    if (glow && !ghost) {
      const hm = mk(new THREE.SpriteMaterial({ map: glow, color: lightColor, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.85 }));
      const tm = mk(new THREE.SpriteMaterial({ map: glow, color: 0xff2030, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.5 }));
      for (const [x, y, z] of lightGlows) { const s = new THREE.Sprite(hm); s.position.set(x, y, z); s.scale.set(0.85, 0.85, 1); body.add(s); }
      for (const [x, y, z] of tailGlows) { const s = new THREE.Sprite(tm); s.position.set(x, y, z); s.scale.set(0.5, 0.5, 1); body.add(s); tailSprites.push(s); }
      tailSprites.mat = tm;
    }
    if (!ghost && vis.neon) {
      const ng = new THREE.PlaneGeometry(W * 1.35, L * 1.0); ng.rotateX(-Math.PI / 2); track.push(ng);
      const nm = mk(new THREE.MeshBasicMaterial({ map: glow, color: vis.neonColor || '#4ee6d4', transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
      const neon = new THREE.Mesh(ng, nm); neon.position.y = 0.06; neon.renderOrder = 2; g.add(neon);
      const tm2 = mk(new THREE.MeshBasicMaterial({ color: vis.neonColor || '#4ee6d4' }));
      for (const sx of [-1, 1]) { const tg2 = new THREE.BoxGeometry(0.03, 0.03, zf - zr - 2 * ra); track.push(tg2); const tube = new THREE.Mesh(tg2, tm2); tube.position.set(sx * (sideX(0.2, 0) - 0.1), 0.14, (zf + zr) / 2); body.add(tube); }
    }
    // contact shadow
    const shG = new THREE.PlaneGeometry(W * 1.35, L * 1.1); shG.rotateX(-Math.PI / 2); track.push(shG);
    const shM = mk(new THREE.MeshBasicMaterial({ map: glow || null, color: 0x000000, transparent: true, opacity: ghost ? 0 : 0.8, depthWrite: false }));
    const shadow = new THREE.Mesh(shG, shM); shadow.position.y = 0.035; g.add(shadow);
    let light = null;
    if (opts.light) {
      light = new THREE.SpotLight(yellow ? 0xffe08a : 0xfff0d0, 2.4, 95, 0.5, 0.55, 1.1); light.position.set(0, 0.75, fz);
      const tgt = new THREE.Object3D(); tgt.position.set(0, 0, fz + 22); g.add(tgt); light.target = tgt; g.add(light);
    }
    this.mergeStatic(body, track);
    return { hood, sh, shadow, g, body, wheels, tail: tails, tailMat: tailM, tailOff, tailSprites, light, rot: 0, rw: wr, heads: lightGlows, lightColor, police };
  }
};
