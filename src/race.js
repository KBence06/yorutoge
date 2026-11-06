// ===================== RACE (three.js scene, loop, HUD, controls) =====================
const Race = {
  active: false,
  start(tg, rv, mode) {
    const c = car();
    const ready = raceReadiness(c); if (ready) { toast(ready, 'bad'); return; }
    this.tg = tg; this.rv = rv; this.c = c; this.mode = mode || (rv ? 'battle' : 'practice'); this.dawn = this.mode === 'tofu';
    const root = $('#race'); root.hidden = false; root.className = S.settings.gfx === 'low' ? 'lowres' : '';
    root.replaceChildren(el('div', { class: 'intro' }, el('div', { class: 'card' }, el('div', { class: 'jp' }, tg.jp), el('div', { class: 'vs' }, 'A hegy betöltése…'))));
    this.active = true;
    setTimeout(() => { try { this.build(); this.intro(); } catch (e) { console.error(e); this.fail(e); } }, 30);
  },
  fail(e) {
    $('#race').replaceChildren(el('div', { class: 'intro' }, el('div', { class: 'card' }, el('div', { class: 'vs' }, 'Nem indult el a 3D-s nézet.'),
      el('div', { class: 'line' }, 'A böngésződ nem engedi a WebGL-t, vagy kevés a memória. ' + (e && e.message ? e.message : '')),
      el('button', { class: 'btn', onclick: () => this.teardown() }, 'Vissza a garázsba'))));
  },
  intro() {
    const tg = this.tg, rv = this.rv, root = $('#race');
    const card = el('div', { class: 'card' },
      el('div', { class: 'jp' }, tg.jp),
      el('div', { class: 'vs' }, this.dawn ? [el('span', null, 'Tofuszállítás '), el('em', null, '豆腐')] : rv ? [el('span', null, 'Te '), el('em', null, 'vs'), el('span', null, ` ${rv.name}`)] : 'Időmérő edzés'),
      el('div', { class: 'eyebrow' }, `${tg.name} · ${dirName(tg)} · ${((this.T.finish - this.T.start) / 1000).toFixed(2)} km`),
      el('div', { class: 'row', style: 'justify-content:center;gap:8px' }, weatherBadge(this.wk), !this.dawn && policeChance() > 0.05 ? el('span', { class: 'tag ' + (policeChance() > 0.3 ? 'bad' : 'warn') }, `Rendőr: ${heatLabel(S.heat || 0)}`) : null),
      this.wk !== 'clear' ? el('div', { class: 'muted', style: 'font-size:13px;max-width:52ch' }, `${WEATHER[this.wk].desc} Tapadás a gumijaiddal: ${Math.round(wetGrip(this.c, this.wk) * 100)}%.`) : null,
      this.dawn ? el('div', { class: 'line' }, `Hajnali fél öt. A Fujimura tofubolt rendelése a hegy ${tg.dir === 'down' ? 'aljára' : 'tetejére'} megy. Egy pohár víz áll a műszerfalon: ha kiloccsan, kevesebbet fizetnek. Ha a szalagkorlátnak mész, összetörik a tofu.`)
      : rv ? el('div', { class: 'line' }, `„${rv.line}” · ${CARS[rv.car].name}${rv.meet ? ` · tét ${fmtY(rv.prize)}` : ''}`) : el('div', { class: 'line' }, S.best[tg.id] ? `Legjobb időd: ${fmtTime(S.best[tg.id])}` : 'Egyedül a hegyen. Tanuld meg a kanyarokat.'),
      el('div', { class: 'muted', style: 'font-size:13px;max-width:52ch' }, 'Bal hüvelykujj: húzd balra-jobbra a kormányzáshoz. Jobb oldalt gáz, fék, kézifék. Billentyűzeten nyilak, szóköz a kézifék, Q/E váltás.'),
      el('div', { class: 'row', style: 'justify-content:center' },
        el('button', { class: 'btn primary', style: 'min-width:160px;font-size:17px', onclick: () => this.go() }, 'Indulás'),
        el('button', { class: 'btn ghost', onclick: () => this.teardown() }, 'Mégse')));
    this.introEl = el('div', { class: 'intro' }, card);
    root.append(this.introEl);
    this.renderOnce();
  },
  go() {
    Audio2.init();
    try { const d = document.documentElement; if (d.requestFullscreen && matchMedia('(pointer:coarse)').matches) d.requestFullscreen({ navigationUI: 'hide' }).then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {})).catch(() => {}); } catch (e) {}
    this.introEl.remove();
    $('#race').classList.add('running');
    this.buildHud();
    Audio2.startEngine(this.P.sp); Audio2.rain(this.W.rain ? 1 : this.wk === 'damp' ? 0.15 : 0);
    this.phase = 'count'; this.count = 3.6; this.lastBeep = 4; this.time = 0;
    this.last = performance.now(); this.acc = 0;
    const loop = (t) => { if (!this.active) return; this.raf = requestAnimationFrame(loop); this.frame(t); };
    this.raf = requestAnimationFrame(loop);
  },

  // ---------------------------------------------------------------- scene
  build() {
    const tg = this.tg, rv = this.rv, set = S.settings;
    const T = this.T = buildTrack(tg);
    const wk = this.wk = this.forceWeather || weatherNow(), W = this.W = WEATHER[wk];
    const sp = carSpec(this.c), wg = wetGrip(this.c, wk); sp.muF *= wg; sp.muR *= wg;
    this.P = new PlayerCar(sp, T, T.start, rv ? -1.75 : 0, set);
    this.aid = buildAidProfile(T, sp);
    this.R = rv ? new RivalCar(rv, T, T.start, 1.75, rivalWetGrip(wk) * (tg.rev ? 0.985 : 1)) : null;
    const root = $('#race');
    const renderer = this.renderer = new THREE.WebGLRenderer({ antialias: set.gfx === 'high', powerPreference: 'high-performance' });
    const dpr = window.devicePixelRatio || 1;
    renderer.setPixelRatio(set.gfx === 'low' ? 0.55 : set.gfx === 'mid' ? Math.min(1.25, dpr) : Math.min(2, dpr));
    renderer.domElement.className = 'three';
    root.append(renderer.domElement);
    if (set.gfx === 'low') root.append(el('div', { class: 'scan' }));
    const scene = this.scene = new THREE.Scene();
    const murky = W.fog > 1.2, fogCol = this.dawn ? (murky ? 0x7c808e : 0x6a6f8c) : (wk === 'fog' ? 0x161a24 : murky ? 0x0d1119 : 0x080b16);
    scene.background = new THREE.Color(this.dawn ? (murky ? 0x5a5f72 : 0x3a4466) : murky ? 0x0a0d14 : 0x05070e);
    scene.fog = new THREE.FogExp2(fogCol, (this.dawn ? 0.0072 : 0.0095) * W.fog);
    const cam = this.cam = new THREE.PerspectiveCamera(62, 1, 0.3, 3200);
    this.hemi = this.dawn ? new THREE.HemisphereLight(0x9aa6d0, 0x2a2420, murky ? 0.85 : 1.05) : new THREE.HemisphereLight(0x3d4c7c, 0x0b0a08, 0.75);
    this.hemiI = this.hemi.intensity; scene.add(this.hemi);
    scene.add(new THREE.AmbientLight(0x1c2232, 0.6));
    const moon = new THREE.DirectionalLight(0x9fb4e8, 0.28); moon.position.set(-300, 500, 200); scene.add(moon);
    this.disposables = [];
    this.corners = findCorners(T);
    this.buildRoad(); this.buildTerrain(); this.buildRails(); this.buildLamps(); this.buildSky(); this.buildBanners(); this.buildSigns();
    if (murky) { this.stars.material.opacity = 0; this.moon.visible = false; }
    const pv = carVisual(this.c);
    this.pMesh = this.buildCar(this.c.model, this.c.paint, pv, true, { plate: ['黒沢 330', '19-07'], turbo: !!this.c.parts.turbo, bbk: !!this.c.parts.brakes });
    if (this.R) this.rMesh = this.buildCar(rv.car, rv.color, rv.vis || Object.assign({ wing: rv.ps > 250 ? 'gt' : null, wheel: rv.ps > 300 ? 'spoke' : 'mesh', lower: 0.03, kit: rv.ps > 280 }, lookVis(rv.look || {})), true, { plate: [{ kurozawa: '黒沢 500', mikazuki: '三日月 300', okami: '狼坂 330', kasumi: '霞 300' }[tg.id] || '黒沢 500', rv.id === 'okami' ? '-- 99' : '24-11'] });
    // ghost of the best practice run
    this.rec = []; this.recT = 0; this.ghost = null; this.gMesh = null;
    const gk = trackKey(tg);
    if (!rv && S.ghosts && S.ghosts[gk] && CARS[S.ghosts[gk].model]) { this.ghost = S.ghosts[gk]; this.gMesh = this.buildCar(this.ghost.model, '#9fd4ff', {}, false, { ghost: true }); }
    // a patrol car may be waiting in a lay-by
    this.police = null; this.pol = null;
    if (this.mode !== 'tofu' && (this.forcePolice || Math.random() < policeChance())) {
      const L = T.finish - T.start; let ps = T.start + L * (0.25 + Math.random() * 0.3);
      for (let tries = 0; tries < 60; tries++) {
        let ok = true; for (let j = -20; j <= 30; j += 2) if (Math.abs(T.k[clamp(Math.floor(ps + j), 0, T.N - 1)]) > 1 / 150) { ok = false; break; }
        if (ok) break; ps += 9; if (ps > T.start + L * 0.7) ps = T.start + L * 0.2;
      }
      this.police = new PoliceCar(T, ps, ROAD_HW - 1.05, 0.44 + (S.heat || 0) * 0.001, rivalWetGrip(wk));
      this.pol = this.buildCar('cresta', '#f1f1ec', { livery: 'twotone', col2: '#0c0c0e', wheel: 'stock' }, false, { police: true, plate: ['黒沢 800', '・110'] });
      this.polLight = new THREE.PointLight(0xff2020, 0, 24, 2); this.polLight.position.set(0, 2.2, 0); this.pol.g.add(this.polLight);
    }
    this.puddles = []; this.boltT = 14 + Math.random() * 20; this.flash = 0;
    FX.init(this);
    if (this.puddles.length) { const pu = this.puddles; this.P.wetSpot = (s, lat) => { for (const q of pu) { if (q.s - s > 4) break; if (Math.abs(q.s - s) < q.r * 1.5 && Math.abs(q.lat - lat) < q.r) return 0.6; } return 1; }; }
    // nearest street lamp lights the player car
    this.lampLight = new THREE.PointLight(0xff9a40, 0, 26, 1.6); scene.add(this.lampLight);
    this.camH = this.P.h; this.camPos = new THREE.Vector3();
    // rear-view mirror: the scene rendered backwards into a small texture, shown mirrored at the top of the screen
    this.mirror = null;
    if (set.mirror !== false) {
      const rt = new THREE.WebGLRenderTarget(512, 128), mcam = new THREE.PerspectiveCamera(44, 4, 0.4, 320);
      const hs = new THREE.Scene(), hc = new THREE.OrthographicCamera(0, 1, 1, 0, -1, 1);
      const pg = new THREE.PlaneGeometry(1, 1), uv = pg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i));
      const pm = new THREE.MeshBasicMaterial({ map: rt.texture, depthTest: false, depthWrite: false, fog: false });
      const fg = new THREE.PlaneGeometry(1, 1), fm = new THREE.MeshBasicMaterial({ color: 0x08080a, depthTest: false, depthWrite: false, fog: false });
      const frame = new THREE.Mesh(fg, fm), glass = new THREE.Mesh(pg, pm); glass.renderOrder = 1; hs.add(frame, glass);
      this.mirror = { rt, cam: mcam, hs, hc, glass, frame, n: 0, every: set.gfx === 'low' ? 4 : 3, ready: false };
      this.disposables.push(rt, pg, pm, fg, fm); root.classList.add('has-mirror');
    }
    this.resize = () => {
      const w = root.clientWidth, h = root.clientHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
      const m = this.mirror;
      if (m) {
        const mw = Math.round(clamp(w * 0.27, 170, 320)), mh = Math.round(mw / 4), pr = renderer.getPixelRatio();
        m.hc.right = w; m.hc.top = h; m.hc.updateProjectionMatrix();
        m.glass.scale.set(mw, mh, 1); m.glass.position.set(w / 2, h - 10 - mh / 2, 0); m.frame.scale.set(mw + 6, mh + 6, 1); m.frame.position.copy(m.glass.position);
        m.rt.setSize(Math.max(64, Math.round(mw * pr)), Math.max(16, Math.round(mh * pr))); m.cam.aspect = mw / mh; m.cam.updateProjectionMatrix(); m.ready = false;
        root.style.setProperty('--mirw', mw + 'px');
      }
    };
    this.ro = new ResizeObserver(this.resize); this.ro.observe(root); this.resize();
    this.syncMeshes(0);
  },
  track(geo, mat) { this.disposables.push(geo, mat); return new THREE.Mesh(geo, mat); },
  roadTex() {
    const TW = 256, cv = document.createElement('canvas'); cv.width = TW; cv.height = 256; const g = cv.getContext('2d');
    g.fillStyle = '#2b2b2e'; g.fillRect(0, 0, TW, 256);
    for (let i = 0; i < 5200; i++) { const v = 30 + Math.random() * 40; g.fillStyle = `rgb(${v},${v},${v + 3})`; g.fillRect(Math.random() * TW, Math.random() * 256, 1, 1); }
    const W = 2 * RAIL, px = m => (m + RAIL) / W * TW;
    // tyre-polished racing line and patched cracks
    for (const c of [-1.6, 1.6]) { const gr = g.createLinearGradient(px(c - 0.7), 0, px(c + 0.7), 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, 'rgba(10,10,12,0.28)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(px(c - 0.7), 0, px(c + 0.7) - px(c - 0.7), 256); }
    g.strokeStyle = 'rgba(14,14,15,0.7)'; g.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) { let x = px(-ROAD_HW + 0.4) + Math.random() * (px(ROAD_HW - 0.4) - px(-ROAD_HW + 0.4)), y = Math.random() * 256; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (Math.random() - 0.5) * 10; y += 6 + Math.random() * 8; g.lineTo(x, y); } g.stroke(); }
    g.fillStyle = 'rgba(18,18,20,0.55)'; for (let i = 0; i < 1; i++) g.fillRect(px(-2.6 + Math.random() * 4), Math.random() * 220, 18 + Math.random() * 24, 12 + Math.random() * 20);
    g.fillStyle = '#4a463e'; g.fillRect(0, 0, px(-ROAD_HW), 256); g.fillRect(px(ROAD_HW), 0, TW - px(ROAD_HW), 256);
    for (let i = 0; i < 1000; i++) { const v = 60 + Math.random() * 50; g.fillStyle = `rgb(${v},${v - 4},${v - 10})`; const side = Math.random() < 0.5; g.fillRect(side ? Math.random() * px(-ROAD_HW) : px(ROAD_HW) + Math.random() * (TW - px(ROAD_HW)), Math.random() * 256, 1.5, 1.5); }
    // concrete U-gutters along both verges with a cover slab every few metres
    for (const sd of [-1, 1]) {
      const a = px(sd < 0 ? -RAIL + 0.05 : RAIL - 0.5), b = px(sd < 0 ? -RAIL + 0.5 : RAIL - 0.05), w = b - a;
      g.fillStyle = '#7a7770'; g.fillRect(a, 0, w, 256);
      g.fillStyle = '#16161a'; g.fillRect(a + w * 0.22, 0, w * 0.56, 256);
      g.fillStyle = 'rgba(40,56,30,0.55)'; for (let i = 0; i < 40; i++) g.fillRect(a + w * 0.22 + Math.random() * w * 0.5, Math.random() * 256, 2, 3);
      for (let y = 10; y < 256; y += 86) { g.fillStyle = '#6c6962'; g.fillRect(a, y, w, 22); g.fillStyle = '#34322e'; g.fillRect(a, y, w, 1.5); g.fillRect(a, y + 21, w, 1.5); }
      g.fillStyle = 'rgba(0,0,0,0.35)'; for (let y = 0; y < 256; y += 37) g.fillRect(a, y, w, 1);
    }
    g.fillStyle = '#d8d6cf'; g.fillRect(px(-ROAD_HW + 0.1), 0, 4, 256); g.fillRect(px(ROAD_HW - 0.1) - 4, 0, 4, 256);
    g.fillStyle = '#e09a2a'; g.fillRect(px(-0.1), 0, 3.5, 256); g.fillRect(px(0.1) - 3.5, 0, 3.5, 256);
    const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
  },
  buildRoad() {
    const T = this.T, cols = [-RAIL, -ROAD_HW, -ROAD_HW / 2, 0, ROAD_HW / 2, ROAD_HW, RAIL];
    const pos = [], uv = [], idx = [], nc = cols.length;
    for (let i = 0; i < T.N; i++) {
      const ch = Math.cos(T.h[i]), sh = Math.sin(T.h[i]);
      for (let j = 0; j < nc; j++) { pos.push(T.x[i] + ch * cols[j], T.y[i] + 0.02, T.z[i] - sh * cols[j]); uv.push((cols[j] + RAIL) / (2 * RAIL), i / 7); }
      if (i > 0) for (let j = 0; j < nc - 1; j++) { const a = (i - 1) * nc + j, b = a + 1, c = a + nc, d = c + 1; idx.push(a, c, b, b, c, d); }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    const tex = this.roadTex(); this.disposables.push(tex);
    const wet = this.W.wet, mesh = this.track(geo, new THREE.MeshPhongMaterial({ map: tex, color: new THREE.Color().setScalar(1 - wet * 0.3), shininess: 18 + wet * 75, specular: wet > 0.2 ? new THREE.Color().setScalar(0.14 + wet * 0.36) : 0x222428 }));
    this.scene.add(mesh);
    // start and finish lines
    for (const s of [T.start, T.finish]) {
      const p = trackPoint(T, s), g2 = new THREE.PlaneGeometry(ROAD_HW * 2, 0.5);
      const m = this.track(g2, new THREE.MeshBasicMaterial({ color: 0xe8e4d8 }));
      m.rotation.order = 'YXZ'; m.rotation.y = p.h; m.rotation.x = -Math.PI / 2; m.position.set(p.x, p.y + 0.04, p.z); this.scene.add(m);
    }
  },
  buildTerrain() {
    const T = this.T;
    let minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9, minY = 1e9;
    for (let i = 0; i < T.N; i += 4) { minX = Math.min(minX, T.x[i]); maxX = Math.max(maxX, T.x[i]); minZ = Math.min(minZ, T.z[i]); maxZ = Math.max(maxZ, T.z[i]); minY = Math.min(minY, T.y[i]); }
    this.minY = minY;
    const M = 170; minX -= M; maxX += M; minZ -= M; maxZ += M;
    const cell = 7, nx = Math.ceil((maxX - minX) / cell) + 1, nz = Math.ceil((maxZ - minZ) / cell) + 1;
    // spatial hash of road points
    const B = 16, hash = new Map();
    for (let i = 0; i < T.N; i += 2) { const k = Math.floor(T.x[i] / B) + ',' + Math.floor(T.z[i] / B); if (!hash.has(k)) hash.set(k, []); hash.get(k).push(i); }
    const coarse = []; for (let i = 0; i < T.N; i += 20) coarse.push(i);
    const noise = (x, z) => Math.sin(x * 0.021 + Math.sin(z * 0.013) * 2) * 6 + Math.sin(z * 0.037 + x * 0.011) * 3.5 + Math.sin(x * 0.09 + z * 0.07) * 1.2;
    this.nearRoad = (x, z) => {
      const bx = Math.floor(x / B), bz = Math.floor(z / B); let bd = 1e9, bi = -1;
      for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) { const l = hash.get((bx + dx) + ',' + (bz + dz)); if (!l) continue; for (const i of l) { const d = (T.x[i] - x) ** 2 + (T.z[i] - z) ** 2; if (d < bd) { bd = d; bi = i; } } }
      return { d: Math.sqrt(bd), i: bi };
    };
    const pos = new Float32Array(nx * nz * 3), col = new Float32Array(nx * nz * 3), idx = [];
    const hgt = new Float32Array(nx * nz);
    for (let iz = 0; iz < nz; iz++) for (let ix = 0; ix < nx; ix++) {
      const x = minX + ix * cell, z = minZ + iz * cell;
      let sw = 0, sh = 0;
      for (const i of coarse) { const d2 = (T.x[i] - x) ** 2 + (T.z[i] - z) ** 2 + 400; const w = 1 / (d2 * d2); sw += w; sh += w * T.y[i]; }
      let hN = sh / sw + noise(x, z);
      const nr = this.nearRoad(x, z);
      if (nr.i >= 0) {
        // rise away from the road so the pass sits in a cut on the hillside
        hN += Math.max(0, nr.d - 8) * 0.22;
        const yr = T.y[nr.i] - 0.6;
        const t = smooth(RAIL + 1.5, RAIL + 30, nr.d);
        hN = lerp(yr, hN, t);
      } else hN += 14;
      const k = iz * nx + ix; hgt[k] = hN;
      pos[k * 3] = x; pos[k * 3 + 1] = hN; pos[k * 3 + 2] = z;
      const v = 0.5 + 0.5 * Math.sin(x * 0.05) * Math.sin(z * 0.043);
      col[k * 3] = 0.07 + v * 0.03; col[k * 3 + 1] = 0.1 + v * 0.05; col[k * 3 + 2] = 0.075 + v * 0.02;
      if (iz > 0 && ix > 0) { const a = (iz - 1) * nx + ix - 1, b = a + 1, c = a + nx, d = c + 1; idx.push(a, c, b, b, c, d); }
    }
    this.terrH = (x, z) => {
      const fx = (x - minX) / cell, fz = (z - minZ) / cell, ix = clamp(Math.floor(fx), 0, nx - 2), iz = clamp(Math.floor(fz), 0, nz - 2), u = clamp(fx - ix, 0, 1), v = clamp(fz - iz, 0, 1);
      return lerp(lerp(hgt[iz * nx + ix], hgt[iz * nx + ix + 1], u), lerp(hgt[(iz + 1) * nx + ix], hgt[(iz + 1) * nx + ix + 1], u), v);
    };
    // steep faces turn to rock
    for (let iz = 1; iz < nz - 1; iz++) for (let ix = 1; ix < nx - 1; ix++) {
      const k = iz * nx + ix, sl = Math.abs(hgt[k + 1] - hgt[k - 1]) + Math.abs(hgt[k + nx] - hgt[k - nx]);
      if (sl > 9) { col[k * 3] = 0.16; col[k * 3 + 1] = 0.15; col[k * 3 + 2] = 0.14; }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    this.scene.add(this.track(geo, new THREE.MeshLambertMaterial({ vertexColors: true })));
    // trees on the slopes
    const n = S.settings.gfx === 'low' ? 900 : 1800;
    const tg = (() => { // two stacked cones read as a pine at night
      const a = new THREE.ConeGeometry(2.3, 5.5, 7).toNonIndexed(), b = new THREE.ConeGeometry(1.6, 5, 7).toNonIndexed(), t = new THREE.CylinderGeometry(0.18, 0.25, 2, 5).toNonIndexed();
      a.translate(0, 4.4, 0); b.translate(0, 7.4, 0); t.translate(0, 1, 0);
      const pos = [...a.attributes.position.array, ...b.attributes.position.array, ...t.attributes.position.array];
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.computeVertexNormals(); return geo;
    })();
    const tm = new THREE.MeshLambertMaterial({ color: 0x0c1a10 });
    this.disposables.push(tg, tm);
    const trees = new THREE.InstancedMesh(tg, tm, n);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p3 = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), color = new THREE.Color();
    let placed = 0, tries = 0;
    let r = 1234567; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
    while (placed < n && tries < n * 8) {
      tries++;
      const i = Math.floor(rnd() * T.N), side = rnd() < 0.5 ? -1 : 1, off = RAIL + 4 + rnd() * rnd() * 120;
      const x = T.x[i] + Math.cos(T.h[i]) * off * side, z = T.z[i] - Math.sin(T.h[i]) * off * side;
      const nr = this.nearRoad(x, z); if (nr.i >= 0 && nr.d < RAIL + 3.5) continue;
      const ix = Math.round((x - minX) / cell), iz = Math.round((z - minZ) / cell); if (ix < 0 || iz < 0 || ix >= nx || iz >= nz) continue;
      const y = hgt[iz * nx + ix];
      const s = 0.7 + rnd() * 0.9; sc.set(s, s * (0.8 + rnd() * 0.6), s); q.setFromAxisAngle(up, rnd() * 6); p3.set(x, y - 0.5, z);
      m4.compose(p3, q, sc); trees.setMatrixAt(placed, m4);
      color.setRGB(0.05 + rnd() * 0.05, 0.1 + rnd() * 0.07, 0.06 + rnd() * 0.04); trees.setColorAt(placed, color);
      placed++;
    }
    trees.count = placed; this.scene.add(trees); this.disposables.push(trees);
  },
  buildRails() {
    const T = this.T, step = 2;
    for (const side of [-1, 1]) {
      const pos = [], idx = []; let row = 0;
      for (let i = 0; i < T.N; i += step) {
        const ch = Math.cos(T.h[i]), sh = Math.sin(T.h[i]);
        for (const [hh, o] of [[0.42, 0], [0.6, 0.09], [0.78, 0]]) { const off = (RAIL + 0.05 + o) * side; pos.push(T.x[i] + ch * off, T.y[i] + hh, T.z[i] - sh * off); }
        if (row > 0) for (let j = 0; j < 2; j++) { const a = (row - 1) * 3 + j, b = a + 1, c = a + 3, d = c + 1; idx.push(a, c, b, b, c, d); }
        row++;
      }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
      this.scene.add(this.track(geo, new THREE.MeshLambertMaterial({ color: 0xc8ccd2, side: THREE.DoubleSide })));
    }
    const nPost = Math.floor(T.N / 4) * 2;
    const pg = new THREE.BoxGeometry(0.1, 0.85, 0.1); pg.translate(0, 0.42, 0);
    const pm = new THREE.MeshLambertMaterial({ color: 0x9aa0a8 }); this.disposables.push(pg, pm);
    const posts = new THREE.InstancedMesh(pg, pm, nPost); const m4 = new THREE.Matrix4(); let k = 0;
    const refl = [];
    for (let i = 0; i < T.N - 1; i += 4) for (const side of [-1, 1]) {
      const off = (RAIL + 0.2) * side; m4.makeTranslation(T.x[i] + Math.cos(T.h[i]) * off, T.y[i], T.z[i] - Math.sin(T.h[i]) * off);
      if (k < nPost) posts.setMatrixAt(k++, m4);
      if (i % 12 === 0) refl.push(T.x[i] + Math.cos(T.h[i]) * off, T.y[i] + 0.88, T.z[i] - Math.sin(T.h[i]) * off);
    }
    posts.count = k; this.scene.add(posts); this.disposables.push(posts);
    // orange delineators on the posts
    const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(refl, 3));
    const rm = new THREE.PointsMaterial({ color: 0xff8a1a, size: 0.22, sizeAttenuation: true });
    this.disposables.push(rg, rm); this.scene.add(new THREE.Points(rg, rm));
  },
  glowTex() {
    if (this._glow) return this._glow;
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); this._glow = new THREE.CanvasTexture(cv); this.disposables.push(this._glow); return this._glow;
  },
  buildLamps() {
    const T = this.T; this.lamps = [];
    const poleG = new THREE.CylinderGeometry(0.09, 0.12, 7.2, 6); poleG.translate(0, 3.6, 0);
    const poleM = new THREE.MeshLambertMaterial({ color: 0x5a5e66 }); this.disposables.push(poleG, poleM);
    const spots = []; for (let s = T.start - 40; s < T.finish + 40; s += 85) spots.push(s);
    const poles = new THREE.InstancedMesh(poleG, poleM, spots.length); const m4 = new THREE.Matrix4();
    const glowPos = [], poolPos = [], poolUv = [], poolIdx = [];
    spots.forEach((s, n) => {
      const i = Math.floor(s), side = n % 2 ? 1 : -1, ch = Math.cos(T.h[i]), sh = Math.sin(T.h[i]);
      const px = T.x[i] + ch * (RAIL + 1.2) * side, pz = T.z[i] - sh * (RAIL + 1.2) * side, py = T.y[i];
      m4.makeTranslation(px, py, pz); poles.setMatrixAt(n, m4);
      const hx = T.x[i] + ch * (ROAD_HW - 0.6) * side, hz = T.z[i] - sh * (ROAD_HW - 0.6) * side, hy = py + 7.0;
      glowPos.push(hx, hy, hz); this.lamps.push({ s, x: hx, y: hy, z: hz });
      // light pool baked onto a patch that follows the road surface
      const base = poolPos.length / 3, R = 13;
      for (let a = -R; a <= R; a += 2) for (let l = -RAIL; l <= RAIL + 0.01; l += RAIL / 2) {
        const p = trackPoint(T, clamp(s + a, 0, T.N - 1)), c2 = Math.cos(p.h), s2 = Math.sin(p.h);
        poolPos.push(p.x + c2 * l, p.y + 0.06, p.z - s2 * l);
        poolUv.push((a / R) * 0.5 + 0.5, ((l - (ROAD_HW - 0.6) * side) / R) * 0.5 + 0.5);
      }
      const cols = 5, rows = (2 * R) / 2 + 1;
      for (let r = 1; r < rows; r++) for (let c = 0; c < cols - 1; c++) { const a = base + (r - 1) * cols + c, b = a + 1, cc = a + cols, d = cc + 1; poolIdx.push(a, cc, b, b, cc, d); }
      // arm
      const armG = new THREE.BoxGeometry(0.08, 0.08, Math.abs((RAIL + 1.2) - (ROAD_HW - 0.6)));
      const arm = this.track(armG, poleM); arm.position.set((px + hx) / 2, hy + 0.1, (pz + hz) / 2); arm.rotation.y = T.h[i] + Math.PI / 2; this.scene.add(arm);
    });
    this.scene.add(poles); this.disposables.push(poles);
    const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(glowPos, 3));
    const gm = new THREE.PointsMaterial({ color: 0xffb060, size: 7, map: this.glowTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    this.disposables.push(gg, gm); this.scene.add(new THREE.Points(gg, gm));
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(poolPos, 3)); pg.setAttribute('uv', new THREE.Float32BufferAttribute(poolUv, 2)); pg.setIndex(poolIdx);
    const pm = new THREE.MeshBasicMaterial({ map: this.glowTex(), color: 0xff8c2a, transparent: true, opacity: 0.55 + this.W.wet * 0.25, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -2 });
    this.scene.add(this.track(pg, pm));
  },
  buildSky() {
    const sg = new THREE.SphereGeometry(2800, 24, 12), cols = [], p = sg.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i) / 2800, t = clamp(y * 3, 0, 1);
      if (this.dawn) { const a = clamp(y * 6, 0, 1); cols.push(lerp(0.95, 0.24, a), lerp(0.6, 0.3, a), lerp(0.48, 0.52, a)); }
      else cols.push(lerp(0.11, 0.015, t), lerp(0.12, 0.02, t), lerp(0.22, 0.05, t));
    }
    sg.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    const sm = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false });
    this.sky = this.track(sg, sm); this.sky.renderOrder = -1; this.scene.add(this.sky);
    const st = []; for (let i = 0; i < 1400; i++) { const a = Math.random() * Math.PI * 2, e = 0.08 + Math.random() * 1.4; st.push(Math.cos(a) * Math.cos(e) * 2500, Math.sin(e) * 2500, Math.sin(a) * Math.cos(e) * 2500); }
    const stg = new THREE.BufferGeometry(); stg.setAttribute('position', new THREE.Float32BufferAttribute(st, 3));
    const stm = new THREE.PointsMaterial({ color: 0xcfd8ff, size: 1.4, sizeAttenuation: false, fog: false, transparent: true, opacity: this.dawn ? 0.12 : 0.8 });
    this.stars = new THREE.Points(stg, stm); this.disposables.push(stg, stm); this.scene.add(this.stars);
    // city lights down in the valley
    const T = this.T; const cx = T.x[Math.floor(T.N / 2)], cz = T.z[Math.floor(T.N / 2)];
    const cp = [], cc = []; const ccol = [[1, 0.62, 0.25], [1, 0.85, 0.6], [0.7, 0.85, 1], [1, 0.4, 0.3]];
    for (let i = 0; i < 2600; i++) { const a = Math.random() * Math.PI * 2, d = 900 + Math.pow(Math.random(), 0.7) * 1500; cp.push(cx + Math.cos(a) * d, this.minY - 260 - Math.random() * 40, cz + Math.sin(a) * d); const c = ccol[Math.floor(Math.random() * 4)]; cc.push(...c); }
    const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3)); cg.setAttribute('color', new THREE.Float32BufferAttribute(cc, 3));
    const cm = new THREE.PointsMaterial({ size: 2.2, sizeAttenuation: false, vertexColors: true, fog: false });
    this.disposables.push(cg, cm); this.scene.add(new THREE.Points(cg, cm));
    // moon
    const mc = document.createElement('canvas'); mc.width = mc.height = 128; const g = mc.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 10, 64, 64, 64); gr.addColorStop(0, 'rgba(240,236,220,1)'); gr.addColorStop(0.35, 'rgba(230,226,210,1)'); gr.addColorStop(0.42, 'rgba(200,210,255,0.25)'); gr.addColorStop(1, 'rgba(200,210,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    const mt = new THREE.CanvasTexture(mc); const mm = new THREE.SpriteMaterial({ map: mt, fog: false, depthWrite: false });
    this.moon = new THREE.Sprite(mm); this.moon.scale.set(260, 260, 1); this.disposables.push(mt, mm); this.scene.add(this.moon);
  },
  buildBanners() {
    const T = this.T;
    const make = (s, txt, jp) => {
      const cv = document.createElement('canvas'); cv.width = 512; cv.height = 96; const g = cv.getContext('2d');
      g.fillStyle = '#e8e2d0'; g.fillRect(0, 0, 512, 96); g.fillStyle = '#b3261e'; g.fillRect(0, 0, 512, 10); g.fillRect(0, 86, 512, 10);
      g.fillStyle = '#15120e'; g.font = `800 italic 54px ${cssVar('--f-disp')}`; g.textAlign = 'center'; g.fillText(txt, 180, 68);
      g.font = `46px ${cssVar('--f-jp')}`; g.fillStyle = '#b3261e'; g.fillText(jp, 395, 66);
      const tex = new THREE.CanvasTexture(cv);
      const p = trackPoint(T, s);
      const bg = new THREE.PlaneGeometry(RAIL * 2 + 0.6, 1.2), bm = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
      this.disposables.push(tex);
      const b = this.track(bg, bm); b.position.set(p.x, p.y + 4.8, p.z); b.rotation.y = p.h + Math.PI / 2 + Math.PI / 2; this.scene.add(b);
      for (const side of [-1, 1]) { const pgm = new THREE.CylinderGeometry(0.08, 0.08, 5.4, 6); const pm = this.track(pgm, new THREE.MeshLambertMaterial({ color: 0x777b82 })); pm.position.set(p.x + Math.cos(p.h) * (RAIL + 0.3) * side, p.y + 2.7, p.z - Math.sin(p.h) * (RAIL + 0.3) * side); this.scene.add(pm); }
    };
    make(T.start + 2, 'START', 'スタート'); make(T.finish, 'GOAL', 'ゴール');
  },
  buildSigns() {
    const T = this.T, list = [];
    for (const c of this.corners) {
      if (c.sev > 3) continue;
      const n = clamp(Math.round((c.s1 - c.s0) / 9), 2, 6);
      for (let k = 0; k < n; k++) list.push({ s: c.s0 + (c.s1 - c.s0) * (k + 0.5) / n, dir: c.dir });
    }
    if (!list.length) return;
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d');
    g.fillStyle = '#e2b51e'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#111';
    g.beginPath(); g.moveTo(44, 6); g.lineTo(20, 32); g.lineTo(44, 58); g.lineTo(30, 58); g.lineTo(6, 32); g.lineTo(30, 6); g.closePath(); g.fill();
    g.strokeStyle = '#111'; g.lineWidth = 4; g.strokeRect(2, 2, 60, 60);
    const tex = new THREE.CanvasTexture(cv), bg = new THREE.PlaneGeometry(0.8, 0.8), bm = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
    const pg = new THREE.BoxGeometry(0.05, 1.2, 0.05), pm = new THREE.MeshLambertMaterial({ color: 0x8a8e96 });
    this.disposables.push(tex, bg, bm, pg, pm);
    const boards = new THREE.InstancedMesh(bg, bm, list.length), posts = new THREE.InstancedMesh(pg, pm, list.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();
    list.forEach((it, i) => {
      const k = Math.floor(it.s), h = T.h[k], lat = -it.dir * (RAIL + 0.35);
      const x = T.x[k] + Math.cos(h) * lat, z = T.z[k] - Math.sin(h) * lat, y = T.y[k];
      q.setFromEuler(e.set(0, h + Math.PI, 0)); sc.set(it.dir > 0 ? 1 : -1, 1, 1); v.set(x, y + 1.5, z);
      m4.compose(v, q, sc); boards.setMatrixAt(i, m4);
      m4.makeTranslation(x, y + 0.6, z); posts.setMatrixAt(i, m4);
    });
    this.disposables.push(boards, posts); this.scene.add(boards, posts);
  },
  buildCar(model, paint, vis, withLight, extra) {
    const m = CarModel.build(model, paint, vis, Object.assign({ track: this.disposables, glow: this.glowTex(), light: withLight }, extra || {}));
    this.scene.add(m.g); return m;
  },
  syncMeshes(dt) {
    const P = this.P, m = this.pMesh;
    m.g.position.set(P.x, P.y, P.z); m.g.rotation.y = P.h;
    m.body.rotation.z = clamp(-P.ay * 0.012, -0.08, 0.08); m.body.rotation.x = clamp(P.ax * 0.006, -0.05, 0.05);
    m.rot += P.vLong / m.rw * dt;
    for (const w of m.wheels) { w.wg.rotation.x = m.rot; if (w.front) w.spin.rotation.y = P.delta; }
    this.brakeLights(m, P.brk > 0.1);
    if (this.R) {
      const R = this.R, r = this.rMesh;
      r.g.position.set(R.x, R.y, R.z); r.g.rotation.y = R.h + R.yawVis;
      r.rot += R.v / r.rw * dt; for (const w of r.wheels) w.wg.rotation.x = r.rot;
      this.brakeLights(r, R.braking);
    }
    if (this.police) {
      const Q = this.police, q = this.pol;
      q.g.position.set(Q.x, Q.y, Q.z); q.g.rotation.y = Q.h + Q.yawVis;
      q.rot += Q.v / q.rw * dt; for (const w of q.wheels) w.wg.rotation.x = q.rot;
      this.brakeLights(q, Q.braking || Q.state === 'parked');
      const on = Q.state === 'alert' || Q.state === 'chase' || (Q.state === 'lost' && Q.siren > 0.05), ph = (Q.flash * 2.4) % 1, L = on && ph < 0.5, Rr = on && ph >= 0.5;
      if (q.police) {
        q.police.mL.color.setHex(L ? 0xff2a2a : 0x3a0606); q.police.mR.color.setHex(Rr ? 0xff2a2a : 0x3a0606);
        if (q.police.sprites.length) { q.police.sprites[0].material.opacity = L ? 1 : 0; q.police.sprites[1].material.opacity = Rr ? 1 : 0; }
      }
      this.polLight.intensity = on ? 1.6 + Math.sin(Q.flash * 15) * 0.8 : 0;
    }
  },
  ghostAt(t) {
    const a = this.ghost.pts, n = a.length / 5; if (n < 2) return null;
    const f = clamp(t / 0.1, 0, n - 1.001), i = Math.floor(f), u = f - i, o = i * 5;
    return { x: lerp(a[o], a[o + 5], u), y: lerp(a[o + 1], a[o + 6], u), z: lerp(a[o + 2], a[o + 7], u), h: a[o + 3] + angDiff(a[o + 8], a[o + 3]) * u, s: lerp(a[o + 4], a[o + 9], u) };
  },
  brakeLights(m, on) {
    if (m.braking === on) return; m.braking = on;
    m.tailMat.color.setHex(on ? 0xffffff : m.tailOff);
    if (m.tailSprites.mat) { m.tailSprites.mat.opacity = on ? 1 : 0.5; for (const sp of m.tailSprites) sp.scale.setScalar(on ? 1.1 : 0.55); }
  },
  syncGhost() {
    if (!this.gMesh) return;
    const p = this.ghostAt(this.phase === 'count' ? 0 : this.time); if (!p) return;
    this.gMesh.g.position.set(p.x, p.y, p.z); this.gMesh.g.rotation.y = p.h; this.ghostS = p.s;
  },
  renderMirror() {
    const m = this.mirror, P = this.P, r = this.renderer;
    if (++m.n >= m.every || !m.ready) {
      m.n = 0; m.ready = true;
      const sh = Math.sin(P.h), ch = Math.cos(P.h);
      m.cam.position.set(P.x + sh * 0.2, P.y + 1.32, P.z + ch * 0.2);
      m.cam.lookAt(P.x - sh * 30, P.y + 0.7, P.z - ch * 30);
      const body = this.pMesh.body; body.visible = false; for (const w of this.pMesh.wheels) w.spin.visible = false;
      this.sky.position.copy(m.cam.position); this.stars.position.copy(m.cam.position);
      r.setRenderTarget(m.rt); r.render(this.scene, m.cam); r.setRenderTarget(null);
      this.sky.position.copy(this.cam.position); this.stars.position.copy(this.cam.position);
      body.visible = true; for (const w of this.pMesh.wheels) w.spin.visible = true;
    }
    r.autoClear = false; r.render(m.hs, m.hc); r.autoClear = true;
  },
  renderOnce() { this.syncGhost(); this.syncMeshes(0); this.updateCamera(1); this.renderer.render(this.scene, this.cam); },
  updateCamera(dt) {
    const P = this.P, cam = this.cam, mode = S.settings.cam;
    const velH = P.speed > 3 ? Math.atan2(P.vx, P.vz) : P.h;
    const ahead = this.T.h[clamp(Math.floor(P.s + 10 + P.speed * 0.4), 0, this.T.N - 1)];
    let target = P.h + angDiff(velH, P.h) * 0.35 + clamp(angDiff(ahead, P.h), -0.6, 0.6) * 0.22;
    this.camH += angDiff(target, this.camH) * Math.min(1, dt * 5);
    const [dist, hgt, look] = mode === 'near' ? [4.4, 1.6, 2] : mode === 'hood' ? [-0.3, 1.18, 10] : [6.2, 2.35, 4];
    const sh = Math.sin(this.camH), ch = Math.cos(this.camH);
    const want = new THREE.Vector3(P.x - sh * dist, P.y + hgt, P.z - ch * dist);
    if (mode === 'hood') { want.set(P.x + Math.sin(P.h) * 0.3, P.y + hgt, P.z + Math.cos(P.h) * 0.3); this.camPos.copy(want); }
    else { if (!this.camInit) { this.camPos.copy(want); this.camInit = true; } this.camPos.lerp(want, Math.min(1, dt * 9)); }
    cam.position.copy(this.camPos);
    const lh = mode === 'hood' ? P.h : this.camH;
    cam.lookAt(P.x + Math.sin(lh) * look, P.y + (mode === 'hood' ? 0.9 : 0.35), P.z + Math.cos(lh) * look);
    cam.fov = 60 + clamp(P.speed * 0.18, 0, 12); cam.updateProjectionMatrix();
    this.sky.position.copy(cam.position); this.stars.position.copy(cam.position);
    this.moon.position.set(cam.position.x - 900, cam.position.y + 700, cam.position.z + 1400);
  },

  // ---------------------------------------------------------------- HUD + input
  buildHud() {
    const root = $('#race'), rv = this.rv, auto = S.settings.auto;
    this.inp = { steer: 0, gas: 0, brake: 0, hand: false, kSteer: 0, bSteer: 0, bDir: { l: false, r: false }, keys: {} };
    const st = S.settings, sens = st.sens || 1;
    const hud = el('div', { class: 'hud' },
      el('div', { class: 'hud-tl' }, el('div', { class: 'pos', id: 'hPos' }, this.dawn ? 'TOFU' : rv ? '' : 'EDZÉS'), el('div', { class: 'gap', id: 'hGap' }), el('div', { class: 'prog' }, el('i', { class: 'me', id: 'hProgMe' }), rv ? el('i', { class: 'rv', id: 'hProgRv' }) : null),
        this.police ? el('div', { class: 'cop', id: 'hCop', hidden: true }, el('b', null, '警察'), el('span', { id: 'hCopTxt' }, 'RENDŐR'), el('i', null, el('u', { id: 'hCopBar' }))) : null,
        this.wk !== 'clear' ? el('div', { class: 'hud-wx' }, weatherBadge(this.wk, true)) : null),
      this.police ? el('div', { class: 'cop-say', id: 'hCopSay', hidden: true }, el('b', null, '前の車、止まりなさい！'), el('small', null, '„Az előttem haladó autó, álljon meg!”')) : null,
      el('div', { class: 'hud-tr' }, el('div', { class: 'timer', id: 'hTime' }, '0:00.00'), el('div', { class: 'warnings', id: 'hWarn' })),
      el('div', { class: 'note', id: 'hNote', hidden: true }, el('span', { class: 'ico', id: 'hNoteIco' }), el('div', null, el('b', { id: 'hNoteTxt' }), el('small', { id: 'hNoteSub' }))),
      el('div', { class: 'dash' }, el('canvas', { id: 'hTach', width: 460, height: 272 }),
        el('div', { class: 'speedo' }, el('b', { id: 'hSpd' }, '0'), el('small', null, 'KM/H')),
        el('div', { class: 'gear', id: 'hGear' }, '1'), el('div', { class: 'boost', id: 'hBoost' })));
    const ctl = el('div', { class: 'ctl' });
    const steer = el('div', { class: 'steer' });
    const sui = el('div', { class: 'steer-ui' }, el('span', { class: 'lbl' }, 'KORMÁNY'), el('i'));
    const pedal = (cls, label, key) => {
      const p = el('div', { class: 'pedal ' + cls, role: 'button', 'aria-label': label }, label);
      const on = (e) => { e.preventDefault(); p.setPointerCapture && p.setPointerCapture(e.pointerId); p.classList.add('on'); this.inp[key] = key === 'hand' ? true : 1; };
      const off = (e) => { p.classList.remove('on'); this.inp[key] = key === 'hand' ? false : 0; };
      p.addEventListener('pointerdown', on); p.addEventListener('pointerup', off); p.addEventListener('pointercancel', off); p.addEventListener('lostpointercapture', off);
      return p;
    };
    const shiftBtn = (label, d) => { const b = el('div', { class: 'pedal', role: 'button', 'aria-label': d > 0 ? 'Felváltás' : 'Visszaváltás' }, label); b.addEventListener('pointerdown', (e) => { e.preventDefault(); this.P.shift(d); }); return b; };
    const pedals = el('div', { class: 'pedals' },
      !auto ? el('div', { class: 'shift' }, shiftBtn('▲', 1), shiftBtn('▼', -1)) : null,
      el('div', { class: 'shift' }, pedal('hb', 'KÉZI\u00ADFÉK', 'hand'), pedal('brk', 'FÉK', 'brake')),
      pedal('gas', 'GÁZ', 'gas'));
    if (st.steer === 'buttons') {
      const sb = (label, key, aria) => {
        const b = el('div', { class: 'pedal sbtn', role: 'button', 'aria-label': aria }, label);
        const on = (e) => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (er) {} b.classList.add('on'); this.inp.bDir[key] = true; };
        const off = () => { b.classList.remove('on'); this.inp.bDir[key] = false; };
        b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('lostpointercapture', off);
        return b;
      };
      ctl.append(el('div', { class: 'steer-btns' }, sb('◀', 'l', 'Balra'), sb('▶', 'r', 'Jobbra')), pedals);
    } else {
      let sid = null, sx = 0;
      const knob = sui.querySelector('i');
      steer.addEventListener('pointerdown', (e) => { e.preventDefault(); sid = e.pointerId; sx = e.clientX; try { steer.setPointerCapture(e.pointerId); } catch (er) {} sui.classList.add('on'); });
      steer.addEventListener('pointermove', (e) => {
        if (e.pointerId !== sid) return;
        const d = clamp((e.clientX - sx) / (Math.max(56, root.clientWidth * 0.085) / sens), -1, 1);
        this.inp.steer = -Math.sign(d) * Math.pow(Math.abs(d), 1.3); // finer near the centre
        knob.style.transform = `translateX(${d * 70}px)`;
      });
      const sEnd = (e) => { if (e.pointerId !== sid) return; sid = null; this.inp.steer = 0; sui.classList.remove('on'); knob.style.transform = ''; };
      steer.addEventListener('pointerup', sEnd); steer.addEventListener('pointercancel', sEnd);
      ctl.append(steer, sui, pedals);
    }
    const top = el('div', { class: 'race-top' }, el('button', { class: 'btn small', onclick: () => this.pause() }, 'Szünet'));
    this.countEl = el('div', { class: 'countdown' }, '');
    const rot = el('div', { class: 'rotate-hint show' }, el('div', null, 'Fordítsd fekvőbe a telefont.', el('br'), el('button', { class: 'btn small', style: 'margin-top:14px', onclick: (e) => e.target.closest('.rotate-hint').classList.remove('show') }, 'Így is jó')));
    if (this.dawn) { this.cup = new WaterCup(); hud.append(el('div', { class: 'cup' }, el('canvas', { id: 'hCup', width: 180, height: 220 }), el('div', { class: 'cup-l', id: 'hCupL' }, 'VÍZ 100%'))); }
    root.append(hud, ctl, top, this.countEl, rot);
    this.h = { cop: $('#hCop'), copTxt: $('#hCopTxt'), copBar: $('#hCopBar'), copSay: $('#hCopSay'), note: $('#hNote'), noteIco: $('#hNoteIco'), noteTxt: $('#hNoteTxt'), noteSub: $('#hNoteSub'), pos: $('#hPos'), gap: $('#hGap'), time: $('#hTime'), warn: $('#hWarn'), gear: $('#hGear'), spd: $('#hSpd'), me: $('#hProgMe'), rv: $('#hProgRv'), boost: $('#hBoost'), tach: $('#hTach').getContext('2d') };
    this.hudT = 0;
    this.onKey = (e) => {
      const down = e.type === 'keydown', k = e.key;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(k)) e.preventDefault();
      this.inp.keys[k.toLowerCase()] = down;
      if (down && (k === 'q' || k === 'Q')) this.P.shift(-1);
      if (down && (k === 'e' || k === 'E')) this.P.shift(1);
      if (down && k === 'Escape') this.pause();
    };
    window.addEventListener('keydown', this.onKey); window.addEventListener('keyup', this.onKey);
  },
  readInput(dt) {
    const k = this.inp.keys, inp = this.inp;
    const kl = k['arrowleft'] || k['a'], kr = k['arrowright'] || k['d'];
    if (kl || kr) inp.kSteer += clamp((kl ? 1 : 0) - (kr ? 1 : 0) - inp.kSteer, -4 * dt, 4 * dt);
    else inp.kSteer += clamp(-inp.kSteer, -6 * dt, 6 * dt);
    const bt = (inp.bDir.l ? 1 : 0) - (inp.bDir.r ? 1 : 0), sens = S.settings.sens || 1;
    if (bt) inp.bSteer += clamp(bt - inp.bSteer, -(bt * inp.bSteer < 0 ? 7 : 2.6 * sens) * dt, (bt * inp.bSteer < 0 ? 7 : 2.6 * sens) * dt);
    else inp.bSteer += clamp(-inp.bSteer, -5 * dt, 5 * dt);
    return {
      steer: clamp(inp.steer + inp.kSteer + inp.bSteer, -1, 1),
      gas: Math.max(inp.gas, k['arrowup'] || k['w'] ? 1 : 0),
      brake: Math.max(inp.brake, k['arrowdown'] || k['s'] ? 1 : 0),
      hand: inp.hand || !!k[' ']
    };
  },
  pause() {
    if (this.phase === 'done' || this.paused) return;
    this.paused = true; Audio2.setEngine(this.P.rpm, 0, 0, 0, 0);
    const box = el('div', { class: 'intro' }, el('div', { class: 'card' }, el('div', { class: 'vs' }, 'Szünet'),
      el('div', { class: 'row', style: 'justify-content:center' },
        el('button', { class: 'btn primary', onclick: () => { box.remove(); this.paused = false; this.last = performance.now(); } }, 'Folytatás'),
        el('button', { class: 'btn danger', onclick: () => { box.remove(); this.paused = false; this.finish(this.rv ? 'forfeit' : 'quit'); } }, this.rv ? 'Feladom' : 'Kilépek'))));
    $('#race').append(box);
  },

  // ---------------------------------------------------------------- loop
  frame(now) {
    let dt = Math.min(0.05, (now - this.last) / 1000); this.last = now; const wall = this.lastWall; this.lastWall = now;
    if (this.paused) { this.renderer.render(this.scene, this.cam); return; }
    const P = this.P, R = this.R, T = this.T, H = 1 / 120;
    if (this.phase === 'count') {
      this.count -= Math.min(0.25, (now - (wall || now)) / 1000);
      const n = Math.ceil(this.count - 0.6);
      if (n !== this.lastBeep && n >= 0) { this.lastBeep = n; if (n > 0) { this.countEl.textContent = n; Audio2.beep(false); } else { this.countEl.textContent = 'GO!'; Audio2.beep(true); } }
      if (this.count <= 0.6) { this.phase = 'race'; setTimeout(() => { this.countEl.textContent = ''; }, 700); }
    }
    const inp = this.readInput(dt);
    this.acc += dt;
    while (this.acc >= H) {
      this.acc -= H;
      if (this.phase === 'count') { P.step(H, { steer: inp.steer * 0.2, gas: inp.gas, brake: 1, hand: false }); P.vx = P.vz = 0; P.w = 0; continue; }
      if (this.phase === 'done') { P.step(H, { steer: 0, gas: 0, brake: 0.6, hand: false }); if (R) R.step(H, P, 0.7); continue; }
      P.step(H, applyAids(P, T, this.aid, inp, S.settings));
      if (R) {
        const gap = R.s - P.s, band = gap > 80 ? 0.97 : gap < -60 ? 1.03 : 1;
        R.step(H, P, band);
        const hit = carContact(P, R); if (hit > 1.5) Audio2.impact(hit);
      }
      if (this.police) { this.police.update(H, P); const hit = carContact(P, this.police); if (hit > 1.5) Audio2.impact(hit); }
      this.time += H;
    }
    let impact = 0;
    while (P.hits.length) { const hv = P.hits.pop(); impact = Math.max(impact, hv); Audio2.impact(hv); }
    if (this.cup && this.phase === 'race') { this.cup.step(dt, P.ay, P.ax, impact); if (this.cup.lastSpill > 0.0004 && !this.splashT) { this.splashT = 0.5; } }
    if (this.splashT) this.splashT = Math.max(0, this.splashT - dt);
    if (this.phase === 'race') while (this.time >= this.recT) { this.rec.push(+P.x.toFixed(2), +P.y.toFixed(2), +P.z.toFixed(2), +P.h.toFixed(3), +P.s.toFixed(1)); this.recT += 0.1; }
    this.syncGhost();
    // finish conditions
    if (this.phase === 'race') {
      if (P.s >= T.finish) this.finish(R && R.s >= T.finish ? 'lose' : 'win');
      else if (R && R.s >= T.finish) this.finish('lose');
      else if (P.blown || P.dmgEngine >= 1) this.finish('blown');
      else if (this.c.cond.body - P.dmgBody <= 0) this.finish('wreck');
      else if (R && R.s - P.s > 420) this.finish('gone');
      else if (this.police && this.police.bust >= 1) this.finish('busted');
    }
    // storm: distant lightning, thunder a few seconds later
    if (this.W.rain && this.phase !== 'count') {
      this.boltT -= dt;
      if (this.boltT <= 0) { this.boltT = 22 + Math.random() * 30; this.flash = 1; Audio2.thunder(1.2 + Math.random() * 2.5); }
    }
    if (this.flash > 0) { this.flash = Math.max(0, this.flash - dt * 2.6); const f = this.flash > 0.62 || (this.flash > 0.3 && this.flash < 0.42) ? this.flash : 0; this.hemi.intensity = this.hemiI + f * 2.2; }
    if (this.police) { const d = Math.hypot(this.police.x - P.x, this.police.z - P.z); Audio2.siren(this.phase === 'done' ? this.police.siren * 0.4 : this.police.siren, d); }
    // lamp light follows the closest lamp
    let best = null, bd = 1e9; for (const l of this.lamps) { const d = Math.abs(l.s - P.s); if (d < bd) { bd = d; best = l; } }
    if (best) { this.lampLight.position.set(best.x, best.y - 0.6, best.z); this.lampLight.intensity = bd < 30 ? 1.4 : 0; }
    this.syncMeshes(dt); this.updateCamera(dt); FX.update(dt, this);
    this.renderer.render(this.scene, this.cam);
    if (this.mirror) this.renderMirror();
    Audio2.setEngine(P.rpm, this.phase === 'race' ? P.thr : P.thr * 0.6, P.boost, this.phase === 'race' ? clamp(P.slide, 0, 1) : 0, P.speed);
    this.drawTach(); if (this.cup) this.drawCup();
    this.hudT += dt; if (this.hudT > 0.07) { this.hudT = 0; this.updateHud(); }
  },
  updateHud() {
    const P = this.P, R = this.R, T = this.T, h = this.h;
    h.spd.textContent = Math.round(P.speed * 3.6);
    h.gear.textContent = P.gear === -1 ? 'R' : P.gear;
    h.time.textContent = fmtTime(this.time);
    const prog = s => clamp((s - T.start) / (T.finish - T.start), 0, 1) * 100 + '%';
    h.me.style.left = prog(P.s);
    if (R) {
      h.rv.style.left = prog(R.s);
      const gap = P.s - R.s;
      h.pos.textContent = gap >= 0 ? 'VEZETSZ' : 'ÜLDÖZÖL'; h.pos.className = 'pos ' + (gap >= 0 ? 'lead' : 'chase');
      const sec = Math.abs(gap) / Math.max(5, gap >= 0 ? R.v : P.speed), gm = Math.round(gap);
      h.gap.textContent = `${gm > 0 ? '+' : gm < 0 ? '−' : ''}${Math.abs(gm)} m · ${sec.toFixed(1)} s`;
    }
    if (!R && this.gMesh && this.ghostS != null && this.phase !== 'count') { const gm = Math.round(P.s - this.ghostS); h.gap.textContent = `${gm > 0 ? '+' : gm < 0 ? '−' : ''}${Math.abs(gm)} m a szellemhez`; }
    this.updateNote();
    if (this.police && h.cop) {
      const Q = this.police, show = Q.state !== 'parked';
      if (h.cop.hidden === show) h.cop.hidden = !show;
      if (show) {
        h.copBar.style.width = Math.round(Q.bust * 100) + '%';
        const t = Q.state === 'lost' ? 'LERÁZTAD' : Q.state === 'alert' ? 'RENDŐR A PIHENŐBEN' : Q.bust > 0.55 ? 'MINDJÁRT ELKAP' : 'ÜLDÖZ A RENDŐR';
        if (h.copTxt.textContent !== t) h.copTxt.textContent = t;
        h.cop.classList.toggle('hot', Q.bust > 0.55); h.cop.classList.toggle('lost', Q.state === 'lost');
      }
      const say = Q.state === 'chase' && Math.abs(P.s - Q.s) < 45 && (this.time % 5) < 3;
      if (h.copSay.hidden === say) h.copSay.hidden = !say;
    }
    const w = [];
    if (P.knock) w.push('KOPOGÁS');
    if (P.clutchSlip) w.push('KUPLUNG CSÚSZIK');
    if (P.blown) w.push('MOTOR');
    const body = this.c.cond.body - P.dmgBody; if (body < 0.3) w.push('KAROSSZÉRIA');
    const key = w.join('|'); if (key !== this.warnKey) { this.warnKey = key; h.warn.replaceChildren(...w.map(x => el('span', { class: 'warn-pill' }, x))); }
  },
  updateNote() {
    const h = this.h, P = this.P;
    if (!S.settings.notes) { h.note.hidden = true; return; }
    const i = this.corners.findIndex(c => c.s0 > P.s);
    const c = this.corners[i];
    if (!c || c.s0 - P.s > 260) { if (!h.note.hidden) h.note.hidden = true; this.noteKey = ''; return; }
    const nx = this.corners[i + 1], dist = Math.max(0, Math.round((c.s0 - P.s) / 10) * 10);
    const key = i + ':' + dist;
    if (key === this.noteKey) return; this.noteKey = key;
    h.note.hidden = false;
    h.note.classList.toggle('hot', c.sev <= 1 && dist < 130);
    h.noteTxt.textContent = noteText(c);
    h.noteSub.textContent = `${dist} m` + (nx && nx.s0 - c.s1 < 45 ? ` · majd ${noteText(nx).toLowerCase()}` : '');
    const path = c.sev === 0 ? '<path d="M6 21V9q0-5 5-5t5 5v6"/><path d="M13 12l3 4 3-4"/>' : c.sev <= 2 ? '<path d="M7 21V11q0-5 5-5h5"/><path d="M14 3l4 3-4 3"/>' : '<path d="M8 21v-7q0-7 8-8"/><path d="M13 3l4 3-4 3"/>';
    h.noteIco.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><g ${c.dir > 0 ? 'transform="translate(24 0) scale(-1 1)"' : ''}>${path}</g></svg>`;
  },
  drawTach() {
    const g = this.h.tach, P = this.P, sp = P.sp, W = 460, H = 272; g.clearRect(0, 0, W, H);
    const max = Math.ceil((sp.curve.limiter + 1000) / 1000) * 1000, cx = W / 2, cy = 236, r = 200;
    const a0 = Math.PI * 1.04, a1 = Math.PI * 1.96, A = v => a0 + (a1 - a0) * v / max;
    g.lineCap = 'butt';
    g.lineWidth = 22; g.strokeStyle = 'rgba(10,12,18,0.6)'; g.beginPath(); g.arc(cx, cy, r, a0, a1); g.stroke();
    g.strokeStyle = 'rgba(255,61,79,0.8)'; g.beginPath(); g.arc(cx, cy, r, A(sp.curve.limiter - 500), a1); g.stroke();
    g.strokeStyle = P.limiter ? '#ff3d4f' : '#ffa733'; g.beginPath(); g.arc(cx, cy, r, a0, A(clamp(P.rpm, 0, max))); g.stroke();
    g.fillStyle = 'rgba(236,230,214,0.85)'; g.font = '700 24px ' + cssVar('--f-disp'); g.textAlign = 'center';
    for (let v = 0; v <= max; v += 1000) { const a = A(v); g.fillText(v / 1000, cx + Math.cos(a) * (r - 36), cy + Math.sin(a) * (r - 36) + 8); }
    if (P.sp.curve.turbo) this.h.boost.textContent = (P.boost >= 0 ? '+' : '') + P.boost.toFixed(2) + ' bar';
  },
  drawCup() {
    const cv = $('#hCup'); if (!cv) return; const g = cv.getContext('2d'), cu = this.cup, W = 180, H = 220;
    g.clearRect(0, 0, W, H);
    const cx = W / 2, top = 40, bot = 200, rt = 52, rb = 40, ang = clamp(cu.ax, -1.2, 1.2), lv = cu.level;
    g.save(); g.beginPath(); g.moveTo(cx - rt, top); g.lineTo(cx + rt, top); g.lineTo(cx + rb, bot); g.lineTo(cx - rb, bot); g.closePath(); g.clip();
    const wy = bot - (bot - top) * lv, dy = Math.tan(ang) * rt;
    const wg = g.createLinearGradient(0, wy, 0, bot); wg.addColorStop(0, 'rgba(150,200,255,0.85)'); wg.addColorStop(1, 'rgba(60,110,190,0.85)');
    g.fillStyle = wg; g.beginPath(); g.moveTo(cx - rt - 10, wy + dy); g.lineTo(cx + rt + 10, wy - dy); g.lineTo(cx + rt + 10, bot + 5); g.lineTo(cx - rt - 10, bot + 5); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx - rt - 10, wy + dy); g.lineTo(cx + rt + 10, wy - dy); g.stroke();
    g.restore();
    g.strokeStyle = 'rgba(236,230,214,0.85)'; g.lineWidth = 4; g.beginPath(); g.moveTo(cx - rt, top); g.lineTo(cx - rb, bot); g.lineTo(cx + rb, bot); g.lineTo(cx + rt, top); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(cx - rt + 12, top + 10, 8, bot - top - 30);
    if (this.splashT) { g.fillStyle = 'rgba(150,200,255,0.9)'; for (let i = 0; i < 6; i++) { const sd = ang > 0 ? -1 : 1, t = 0.5 - this.splashT; g.beginPath(); g.arc(cx + sd * (rt + 6 + i * 6 + t * 40), top - 6 - i * 5 + t * t * 120, 4, 0, 7); g.fill(); } }
    const pct = Math.round(cu.level / 0.86 * 100), el2 = $('#hCupL');
    const txt = `VÍZ ${pct}%` + (cu.tofu < 0.999 ? ` · TOFU ${Math.round(cu.tofu * 100)}%` : '');
    if (el2.textContent !== txt) { el2.textContent = txt; el2.className = 'cup-l' + (pct < 60 || cu.tofu < 0.6 ? ' bad' : ''); }
  },
  finish(result) {
    if (this.phase === 'done') return;
    this.phase = 'done'; this.result = result;
    if (this.dawn && result === 'win') { this.countEl.textContent = 'LESZÁLLÍTVA'; setTimeout(() => this.results(), 1800); this.phase = 'done'; this.result = result; return; }
    const msg = { win: 'GYŐZELEM', lose: 'VERESÉG', gone: 'ELHÚZOTT', blown: 'MOTORHIBA', wreck: 'TÖRÉS', forfeit: 'FELADTAD', quit: 'KILÉPTÉL', busted: 'LEKAPCSOLTAK' }[result];
    if (result === 'win' && !this.rv) this.countEl.textContent = 'CÉL';
    else this.countEl.textContent = msg;
    setTimeout(() => this.results(), result === 'quit' || result === 'forfeit' ? 50 : 1800);
  },
  results() {
    const P = this.P, c = this.c, rv = this.rv, tg = this.tg, res = this.result;
    const lines = [];
    const before = { ...c.cond };
    c.cond.body = Math.max(0, c.cond.body - P.dmgBody);
    c.cond.engine = Math.max(0, c.cond.engine - P.dmgEngine);
    c.cond.tires = Math.max(0, c.cond.tires - P.wear);
    c.cond.clutch = Math.max(0, c.cond.clutch - P.clutchWear);
    c.races = (c.races || 0) + 1;
    let money = 0, rep = 0;
    if (c.tune.fuel === 'prem') money -= FUEL_PREMIUM_COST;
    let tofuInfo = null;
    if (this.dawn) tofuInfo = Jobs.tofuPay(this, res);
    if (tofuInfo) { money += tofuInfo.pay; lines.push(...tofuInfo.lines); }
    const W = this.W, tk = trackKey(tg), Q = this.police;
    if (W.bonus > 1 && tofuInfo && tofuInfo.pay > 0) { const extra = Math.round(tofuInfo.pay * (W.bonus - 1) / 100) * 100; money += extra; lines.push(`${W.short} miatt pótlék: +${fmtY(extra)}.`); }
    if (!rv && !this.dawn && res === 'win') {
      const t = this.time; const best = S.best[tk];
      if (!best || t < best) { S.best[tk] = t; S.ghosts = S.ghosts || {}; S.ghosts[tk] = { model: c.model, t, pts: this.rec }; lines.push(`Új legjobb idő (${dirName(tg)}${this.wk !== 'clear' ? ', ' + W.short.toLowerCase() : ''}): ${fmtTime(t)}. A következő edzésen ez lesz a szellemautó.`); } else lines.push(`Idő: ${fmtTime(t)} · legjobb ${fmtTime(best)}`);
    }
    if (rv && rv.meet) {
      const ms = Meet.state();
      if (res === 'busted') lines.push('A tét elmaradt: a villogó láttán mindenki szétszéledt.');
      else if (res === 'win') { money += rv.prize; rep += rv.rep; ms.done[rv.id] = 'win'; S.stats.meetWins = (S.stats.meetWins || 0) + 1; lines.push(`${rv.name} kifizette a tétet: ${fmtY(rv.prize)}.`); addNews(`A gyülekezőn megverted ${rv.name}-t. A parkolóban erről beszélnek.`); }
      else { money -= rv.prize; rep -= 1; ms.done[rv.id] = 'lose'; lines.push(`Kifizetted a tétet ${rv.name}-nak: ${fmtY(rv.prize)}.`); }
    } else if (rv && res !== 'busted') {
      const wkey = winKey(rv, tg);
      if (res === 'win') {
        const first = !S.wins[wkey], f = tg.rev ? 0.6 : 1;
        money += first ? Math.round(rv.prize * f * W.bonus / 1000) * 1000 : Math.round(rv.prize * 0.3); rep += first ? Math.round(rv.rep * f * W.bonus) : 2;
        S.wins[wkey] = true;
        if (first && rv.id === 'tengu') { lines.push('Legyőzted a hegy szellemét. A NIGHT PASS jövő havi címlapján a te kocsid lesz.'); S.stats.tengu = true; }
        if (first && W.bonus > 1) lines.push(`${W.name}: a tét és a hírnév ${Math.round((W.bonus - 1) * 100)}%-kal több.`);
        addNews(first ? `Legyőzted ${rv.name}-t a ${tg.name}n (${dirName(tg)}${this.wk === 'rain' ? ', esőben' : this.wk === 'fog' ? ', ködben' : ''}). Beszélnek rólad.` : `Visszavágó ${rv.name} ellen: megint a tiéd.`);
      } else { rep -= 2; addNews(`${rv.name} megvert a ${tg.name}n.`); }
    }
    // the police
    if (res === 'busted') {
      const fine = Math.round((20000 + (S.heat || 0) * 700) / 1000) * 1000;
      money -= fine; rep -= 4; S.heat = 22; S.stats.busted = (S.stats.busted || 0) + 1;
      lines.push(`Igazoltattak, megbírságoltak: ${fmtY(fine)}. A hegyen mindenki látta a villogót.`);
      addNews(`A rendőrség megállított a ${tg.name}n. Az emberek erről beszélnek, nem rólad.`);
    } else {
      S.heat = clamp((S.heat || 0) + heatGain(this.mode, c, res), 0, 100);
      if (Q && Q.state !== 'parked' && Q.state !== 'alert' && ['win', 'lose', 'gone'].includes(res)) {
        rep += 3; S.heat = clamp(S.heat + 6, 0, 100); S.stats.escaped = (S.stats.escaped || 0) + 1;
        lines.push('Leráztad a rendőrt. Holnap mindenki tudni fogja, de ők is.');
      }
    }
    S.money += money; const rep0 = S.rep; S.rep = Math.max(0, S.rep + rep); rep = S.rep - rep0;
    const arrived = advanceDay();
    const d = (k) => { const v = Math.round((before[k] - c.cond[k]) * 100); return v > 0 ? '−' + v : '0'; };
    if (!rv && !this.dawn && res === 'win' && P.hitCount === 0) S.stats.clean = (S.stats.clean || 0) + 1;
    const title = this.dawn ? (res === 'win' ? 'Leszállítva' : 'A szállítás elmaradt') : { win: rv ? 'Győzelem' : 'Célba értél', lose: 'Vereség', gone: 'Elhúzott', blown: 'A motor feladta', wreck: 'Totálkár', forfeit: 'Feladtad', quit: 'Kiszálltál', busted: 'Lekapcsoltak' }[res];
    const why = { gone: 'A hátsó lámpái eltűntek a ködben. Nem értél utol.', blown: 'Kopogott, amíg el nem fáradt. A dynón látszott volna.', wreck: 'A szalagkorlát nyert.', busted: 'A villogó beért, és nem tudtad lerázni.' }[res];
    save();
    this.teardown();
    UI.show(this.dawn ? 'work' : 'touge');
    UI.open([UI.head(title, `${tg.name} · ${dirName(tg)}${rv ? ' · ' + rv.name : ''}`),
      el('div', { class: 'res-big ' + (res === 'win' ? 'win' : 'lose') }, this.dawn ? (tofuInfo && tofuInfo.pay > 0 ? fmtY(tofuInfo.pay) : '—') : res === 'busted' ? '捕' : rv ? (res === 'win' ? '勝' : '負') : fmtTime(this.time)),
      why ? el('p', { style: 'margin:0' }, why) : null,
      ...lines.map(l => el('p', { style: 'margin:0' }, l)),
      el('div', { class: 'specs' },
        specTile('Pénz', (money >= 0 ? '+' : '−') + fmtY(Math.abs(money)).replace('¥ ', ''), '¥'), specTile('Hírnév', (rep >= 0 ? '+' : '') + rep, ''),
        specTile('Karosszéria', d('body'), '%'), specTile('Motor', d('engine'), '%'), specTile('Gumik', d('tires'), '%')),
      arrived.length ? el('p', { class: 'muted', style: 'margin:0' }, `Reggelre megjött: ${arrived.map(o => PART[o.pid].name).join(', ')}.`) : null,
      el('div', { class: 'row' }, el('button', { class: 'btn primary', onclick: () => UI.close() }, 'Vissza'))]);
  },
  teardown() {
    this.active = false; cancelAnimationFrame(this.raf);
    Audio2.stopEngine(); Audio2.rain(0); Audio2.siren(0, 0);
    if (this.onKey) { window.removeEventListener('keydown', this.onKey); window.removeEventListener('keyup', this.onKey); this.onKey = null; }
    if (this.ro) this.ro.disconnect();
    if (this.disposables) for (const d of this.disposables) try { d.dispose(); } catch (e) {}
    if (this.renderer) { this.renderer.dispose(); this.renderer.forceContextLoss && this.renderer.forceContextLoss(); }
    CarModel.reset();
    this.cup = null; this.splashT = 0;
    this.renderer = null; this.scene = null; this.disposables = null; this._glow = null; this.camInit = false; this.paused = false;
    const root = $('#race'); root.replaceChildren(); root.hidden = true; root.className = '';
    try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {}
    UI.render();
  }
};
