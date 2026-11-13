// ===================== THE GARAGE FROM THE INSIDE: walk around the car, open the hood, sit in it, watch a part go on =====================
const GarageWalk = {
  open() { return Walk.open(this.def(null)); },
  // after an install: the part is already on the car `c`; show it going on
  install(c, p, q, reSlot) {
    if (S.settings.instAnim === false || S.settings.gfx === 'low' && !window.WebGLRenderingContext) return false;
    return Walk.open(this.def({ c, p, q, reSlot }));
  },
  def(inst) {
    const X = 4.6, Z0 = -5.2, Z1 = 5.6;
    return {
      title: inst ? 'Beszerelés' : 'Garázs', sub: inst ? inst.p.name : CARS[car().model].name,
      spawn: { x: 2.7, z: 3.3, yaw: Math.atan2(-2.7, -3.0), pitch: -0.12 }, bounds: { x0: -X, x1: X, z0: Z0, z1: Z1 },
      build: (W) => this.build(W, inst, X, Z0, Z1),
      buttons: (W) => this.buttons(W),
      cleanup: () => { Audio2.ratchet(false); if (this.revving) { Audio2.stopEngine(); this.revving = false; } this.m = this.mOld = null; },
      onClose: () => {}
    };
  },
  buttons(W) {
    const st = this.state;
    if (W.seat) return [
      { label: this.revving ? 'Motor leállítása' : 'Motor indítása', cls: this.revving ? '' : 'primary', act: () => this.toggleEngine(W) },
      this.revving ? { label: 'Gázfröccs', act: () => { st.blip = 1; } } : null];
    return [{ label: st.hood > 0.5 ? 'Motorháztető le' : 'Motorháztető fel', act: () => this.toggleHood(W) }, { label: 'Beülök', act: () => this.sit(W) }];
  },
  build(W, inst, X, Z0, Z1) {
    const D = S.decor, lightHex = LIGHTS[D.light] || LIGHTS.l_cold, lc = new THREE.Color(lightHex), sc = W.scene, H = 3.3;
    const st = this.state = { hood: 0, hoodT: 0, lift: 0, wheelOff: 0, rpm: 0, blip: 0 };
    sc.background = new THREE.Color(0x06070a); sc.fog = new THREE.Fog(0x06070a, 16, 44);
    sc.add(new THREE.HemisphereLight(lc.clone().lerp(new THREE.Color(0xffffff), 0.45), 0x241d16, 0.42)); sc.add(new THREE.AmbientLight(0x30343c, 0.3));
    const tubeM = new THREE.MeshBasicMaterial({ color: lc.clone().lerp(new THREE.Color(0xffffff), 0.6) });
    for (const z of [-1.9, 2.1]) { const pl = new THREE.PointLight(lightHex, 0.8, 17, 1.5); pl.position.set(0, 2.85, z); sc.add(pl); W.mesh(new THREE.BoxGeometry(1.9, 0.05, 0.13), tubeM, 0, H - 0.12, z); W.mesh(new THREE.BoxGeometry(2.05, 0.04, 0.22), new THREE.MeshLambertMaterial({ color: 0x2a2c30 }), 0, H - 0.07, z); }
    // ---- the room: block walls, the floor you picked, the shutter
    const wallT = (rx, ry) => W.canvasTex(256, 256, (g) => {
      g.fillStyle = '#3a3d44'; g.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 2600; i++) { const v = 40 + Math.random() * 40; g.fillStyle = `rgba(${v},${v},${v + 4},0.5)`; g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2); }
      g.strokeStyle = 'rgba(0,0,0,0.55)'; g.lineWidth = 2;
      for (let r = 0; r < 4; r++) { g.beginPath(); g.moveTo(0, r * 64); g.lineTo(256, r * 64); g.stroke(); for (let x = (r % 2) * 64; x <= 256; x += 128) { g.beginPath(); g.moveTo(x, r * 64); g.lineTo(x, r * 64 + 64); g.stroke(); } }
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 232, 256, 24);
    }, [rx, ry]);
    const wm = (rx) => new THREE.MeshLambertMaterial({ map: wallT(rx, 2) });
    const back = W.mesh(new THREE.PlaneGeometry(2 * X, H), wm(5), 0, H / 2, Z0);
    const front = W.mesh(new THREE.PlaneGeometry(2 * X, H), wm(5), 0, H / 2, Z1); front.rotation.y = Math.PI;
    const left = W.mesh(new THREE.PlaneGeometry(Z1 - Z0, H), wm(6), -X, H / 2, (Z0 + Z1) / 2); left.rotation.y = Math.PI / 2;
    const right = W.mesh(new THREE.PlaneGeometry(Z1 - Z0, H), wm(6), X, H / 2, (Z0 + Z1) / 2); right.rotation.y = -Math.PI / 2;
    const ceil = W.mesh(new THREE.PlaneGeometry(2 * X, Z1 - Z0), new THREE.MeshLambertMaterial({ color: 0x1b1c20 }), 0, H, (Z0 + Z1) / 2); ceil.rotation.x = Math.PI / 2;
    for (let x = -3; x <= 3; x += 3) W.mesh(new THREE.BoxGeometry(0.14, 0.2, Z1 - Z0), new THREE.MeshLambertMaterial({ color: 0x2b2118 }), x, H - 0.1, (Z0 + Z1) / 2);
    const floorT = W.canvasTex(512, 512, (g) => {
      if (D.floor === 'fl_checker') { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#d8d2c2' : '#1c1c20'; g.fillRect(x * 64, y * 64, 64, 64); } g.fillStyle = 'rgba(0,0,0,0.18)'; for (let i = 0; i < 500; i++) g.fillRect(Math.random() * 512, Math.random() * 512, 3, 3); }
      else {
        g.fillStyle = D.floor === 'fl_epoxy' ? '#565b64' : '#4a4844'; g.fillRect(0, 0, 512, 512);
        for (let i = 0; i < (D.floor === 'fl_epoxy' ? 1500 : 6000); i++) { const v = 50 + Math.random() * 50; g.fillStyle = `rgba(${v},${v},${v},0.35)`; g.fillRect(Math.random() * 512, Math.random() * 512, 2, 2); }
        if (D.floor !== 'fl_epoxy') { g.fillStyle = 'rgba(10,10,10,0.1)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(Math.random() * 512, Math.random() * 512, 8 + Math.random() * 18, 6 + Math.random() * 12, Math.random() * 3, 0, 7); g.fill(); } g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 2; g.strokeRect(0, 0, 512, 512); }
      }
    }, D.floor === 'fl_checker' ? [3, 3.5] : [2, 2.4]);
    const fl = W.mesh(new THREE.PlaneGeometry(2 * X, Z1 - Z0), D.floor === 'fl_epoxy' ? new THREE.MeshPhongMaterial({ map: floorT, shininess: 70, specular: 0x555555 }) : new THREE.MeshLambertMaterial({ map: floorT }), 0, 0, (Z0 + Z1) / 2); fl.rotation.x = -Math.PI / 2;
    const shutT = W.canvasTex(256, 256, (g) => { g.fillStyle = '#4a4f58'; g.fillRect(0, 0, 256, 256); for (let y = 0; y < 256; y += 14) { g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, y, 256, 3); g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(0, y + 3, 256, 2); } for (let x = 0; x < 256; x += 32) { g.fillStyle = '#d9a21b'; g.beginPath(); g.moveTo(x, 256); g.lineTo(x + 16, 238); g.lineTo(x + 32, 238); g.lineTo(x + 16, 256); g.fill(); } });
    W.board(shutT, 5.4, 2.75, 0, 1.375, Z1 - 0.02, Math.PI); for (const sx of [-1, 1]) W.mesh(new THREE.BoxGeometry(0.16, 2.9, 0.12), new THREE.MeshLambertMaterial({ color: 0x15171b }), sx * 2.78, 1.45, Z1 - 0.06); W.mesh(new THREE.BoxGeometry(5.7, 0.22, 0.2), new THREE.MeshLambertMaterial({ color: 0x15171b }), 0, 2.86, Z1 - 0.1);
    // ---- what you bought for it: posters, the neon, the shelf, the corners
    const poster = (id, x) => { if (id) W.board(W.canvasTex(256, 354, (g) => drawPoster(g, id, 0, 0, 252, 348)), 0.92, 1.27, x, 1.95, Z0 + 0.02, 0); };
    poster(D.posterL, -2.7); poster(D.posterR, 2.7);
    if (D.neon) {
      const col = { n_touge: 0xff5fb3, n_yoru: 0xff9a2e, n_garage: 0x4ee6d4 }[D.neon];
      const nb = W.board(W.canvasTex(512, 192, (g) => drawNeon(g, D.neon, 256, 100, 2.1, 1)), 2.5, 0.94, 0, 2.62, Z0 + 0.03, 0, { add: true, alpha: true });
      const nl = new THREE.PointLight(col, 0.9, 9, 1.6); nl.position.set(0, 2.5, Z0 + 0.7); sc.add(nl);
      W.tickers.push((dt, t) => { const f = 0.9 + 0.1 * Math.sin(t * 27) * Math.sin(t * 7.3); nl.intensity = 0.9 * f; nb.material.opacity = f; });
    }
    W.board(W.canvasTex(512, 256, (g) => { drawShelf(g, D.shelf, 20, 200, 472, 2.6); g.fillStyle = '#3a2d1e'; g.fillRect(40, 206, 10, 40); g.fillRect(462, 206, 10, 40); }), 1.9, 0.95, -X + 0.03, 2.05, -2.6, Math.PI / 2, { alpha: true });
    const prop = (id, x, z, ry) => { if (!id) return; W.board(W.canvasTex(512, 512, (g) => drawFloorItem(g, id, 16, 496, 1.6, 'L')), 2.46, 2.46, x, 1.19, z, ry, { alpha: true, both: true }); };
    prop(D.floorL, -X + 1.3, Z0 + 0.25, 0); if (D.floorL) W.collide(-X, -X + 2.1, Z0, Z0 + 0.7);
    prop(D.floorR, X - 1.15, Z0 + 0.25, 0); if (D.floorR) W.collide(X - 2.3, X, Z0, Z0 + 0.7);
    // ---- the workbench: always there
    const wood = new THREE.MeshLambertMaterial({ color: 0x5a4630 }), steel = new THREE.MeshLambertMaterial({ color: 0x3a3d44 }), red = new THREE.MeshLambertMaterial({ color: 0xa8201c });
    const bz = 1.9; W.mesh(new THREE.BoxGeometry(0.75, 0.06, 2.3), wood, -X + 0.42, 0.92, bz);
    for (const dz of [-1.05, 1.05]) for (const dx of [0.1, 0.72]) W.mesh(new THREE.BoxGeometry(0.06, 0.9, 0.06), steel, -X + dx, 0.45, bz + dz);
    W.mesh(new THREE.BoxGeometry(0.7, 0.04, 2.2), steel, -X + 0.42, 0.3, bz); W.collide(-X, -X + 0.85, bz - 1.2, bz + 1.2);
    W.mesh(new THREE.BoxGeometry(0.42, 0.26, 0.3), red, -X + 0.4, 1.08, bz + 0.75); W.mesh(new THREE.BoxGeometry(0.16, 0.14, 0.12), steel, -X + 0.5, 1.02, bz - 0.8);
    W.board(W.canvasTex(512, 256, (g) => { // pegboard with tool outlines
      g.fillStyle = '#7a6444'; g.fillRect(0, 0, 512, 256); g.fillStyle = 'rgba(0,0,0,0.3)'; for (let y = 10; y < 256; y += 16) for (let x = 10; x < 512; x += 16) g.fillRect(x, y, 2, 2);
      g.strokeStyle = '#c9ccd2'; g.lineCap = 'round';
      for (let i = 0; i < 9; i++) { const x = 40 + i * 38, len = 150 - i * 9; g.lineWidth = 9 - i * 0.5; g.beginPath(); g.moveTo(x, 40); g.lineTo(x, 40 + len); g.stroke(); g.lineWidth = 3; g.beginPath(); g.arc(x, 34, 9 - i * 0.4, 0, 7); g.stroke(); }
      g.fillStyle = '#b3141e'; g.fillRect(400, 60, 22, 120); g.fillStyle = '#c9ccd2'; g.fillRect(396, 40, 30, 24); g.fillStyle = '#e8c21b'; g.fillRect(450, 50, 14, 150); g.fillStyle = '#222'; g.fillRect(446, 196, 22, 26);
    }), 2.2, 1.1, -X + 0.03, 1.75, bz, Math.PI / 2);
    // the boombox: tap it to change the station
    const bb = W.mesh(new THREE.BoxGeometry(0.2, 0.26, 0.6), new THREE.MeshLambertMaterial({ color: 0x1b1c20 }), -X + 0.34, 1.08, bz - 0.25);
    W.board(W.canvasTex(256, 112, (g) => { g.fillStyle = '#23252b'; g.fillRect(0, 0, 256, 112); for (const x of [56, 200]) { g.fillStyle = '#0c0c0e'; g.beginPath(); g.arc(x, 62, 40, 0, 7); g.fill(); g.strokeStyle = '#6d7076'; g.lineWidth = 3; g.beginPath(); g.arc(x, 62, 30, 0, 7); g.stroke(); } g.fillStyle = '#ff9f45'; g.fillRect(100, 34, 56, 18); g.fillStyle = '#c9ccd2'; g.fillRect(96, 66, 64, 26); }), 0.6, 0.26, -X + 0.445, 1.08, bz - 0.25, Math.PI / 2);
    W.hotspot(-X + 0.6, 1.1, bz - 0.25, 2.4, () => typeof Music !== 'undefined' ? `Rádió: ${Music.label()}` : 'Rádió', (s) => { if (typeof Music !== 'undefined') { Audio2.init(); Music.next(); toast(`♪ ${Music.label()}`); } }).dyn = true;
    W.hotspot(-X + 0.6, 1.0, bz + 0.6, 2.2, 'Szerelés a kocsin', () => { W.close(); UI.show('car'); });
    W.hotspot(0, 1.2, Z1 - 0.3, 2.6, 'Ki a hegyre', () => { W.close(); UI.show('touge'); });
    if (D.floorR === 'f_vend') W.hotspot(X - 1.3, 1.2, Z0 + 0.6, 2.2, 'Kávé az automatából (¥ 120)', () => { if (S.money >= 120) { S.money -= 120; save(); Audio2.init(); Audio2.burst(140, 1.2, 0.3, 0.2, 'lowpass'); toast('Koppan a doboz. Forró, édes, pont jó.'); } });
    if (D.floorR === 'f_arcade') W.hotspot(X - 1.3, 1.2, Z0 + 0.6, 2.2, 'Árkádgép', () => toast('INSERT COIN. A rekord még mindig a tiéd: ' + (120000 + S.day * 731) + ' pont.'));
    if (D.floorR === 'f_sofa') W.hotspot(X - 1.3, 0.8, Z0 + 0.6, 2.2, 'Leülök a kanapéra', () => toast('Öt perc csend. Csak a fénycső zúg.'));
    // ---- lifting gear, hidden until a job needs it
    const liftM = new THREE.MeshLambertMaterial({ color: 0xc8a020 }), gear = this.gear = new THREE.Group(); sc.add(gear); gear.visible = false;
    for (const sx of [-1, 1]) { const col2 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.3, 0.22), liftM); col2.position.set(sx * 1.25, 1.15, 0); gear.add(col2); W.track.push(col2.geometry); }
    W.track.push(liftM);
    this.arms = []; for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const a = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.05, 0.09), steel); a.position.set(sx * 0.92, 0.12, sz * 0.75); a.rotation.y = -sx * sz * 0.6; gear.add(a); this.arms.push(a); W.track.push(a.geometry); }
    // ---- the car (and, during an install, the car as it was a minute ago)
    const c = inst ? inst.c : car(), opt = (cc) => ({ bay: true, plate: ['黒沢 330', '19-07'], turbo: !!cc.parts.turbo, bbk: !!cc.parts.brakes, strut: !!cc.parts.strut, intake: !!cc.parts.intake });
    this.c = c; this.m = W.car(c, 0, 0, 0, opt(c)); this.mOld = null;
    if (inst && !inst.reSlot) { const old = Object.assign({}, c, { parts: Object.assign({}, c.parts) }); delete old.parts[inst.p.slot]; this.mOld = W.car(old, 0, 0, 0, opt(old)); this.m.g.visible = false; }
    const sh = this.m.sh, cw = sh.W / 2, cl = sh.L / 2; W.collide(-cw - 0.05, cw + 0.05, -cl - 0.05, cl + 0.05);
    W.hotspot(0, 0.9, cl + 0.2, 2.3, () => st.hoodT > 0.5 ? 'Motorháztető le' : 'Motorháztető fel', () => this.toggleHood(W), () => !W.seat).dyn = true;
    for (const sx of [-1, 1]) W.hotspot(sx * (cw + 0.2), 1.0, sh.pillarZ + 0.5, 1.9, 'Beülök', () => this.sit(W), () => !W.seat);
    W.tickers.push((dt, t) => this.tick(W, dt, t));
    if (inst) setTimeout(() => { if (Walk.active && Walk.def && Walk.scene === sc) this.playInstall(W, inst); }, 60);
  },
  models() { return [this.m, this.mOld].filter(Boolean); },
  tick(W, dt, t) {
    const st = this.state;
    if (!W.cine) { st.hood += clamp(st.hoodT - st.hood, -dt * 1.6, dt * 1.6); }
    for (const m of this.models()) {
      if (m.hood) m.hood.rotation.x = -0.98 * (st.hood < 0.5 ? 2 * st.hood * st.hood : 1 - Math.pow(-2 * st.hood + 2, 2) / 2);
      m.g.position.y = st.lift; m.shadow.position.y = 0.035 - st.lift; const w = m.wheels[0]; if (w.bx === undefined) w.bx = w.spin.position.x; w.spin.position.x = w.bx - st.wheelOff * 0.75; w.spin.rotation.z = st.wheelOff * 0.25;
    }
    this.gear.visible = st.lift > 0.6; if (this.gear.visible) for (const a of this.arms) a.position.y = st.lift + 0.1;
    if (this.revving) {
      const sp = this.sp, idle = sp.E.idle, lim = sp.curve.limiter;
      st.blip = Math.max(0, st.blip - dt * 1.6); const tgt = idle + (lim * 0.86 - idle) * Math.min(1, st.blip * 1.4);
      st.rpm += (tgt - st.rpm) * Math.min(1, dt * (tgt > st.rpm ? 7 : 2.6)); const jit = st.rpm < idle * 1.2 ? Math.sin(t * 31) * 18 : 0;
      Audio2.setEngine(st.rpm + jit, st.blip > 0.2 ? 0.9 : 0.05, 0, 0, 0);
      for (const m of this.models()) m.body.rotation.z = Math.sin(t * (st.rpm / 60) * 0.9) * 0.0016 + (tgt > st.rpm + 300 ? 0.006 : 0);
      const sub = $('#wSub'); if (sub) sub.textContent = `${Math.round(st.rpm / 50) * 50} / perc`;
    }
  },
  toggleHood(W) { const st = this.state; st.hoodT = st.hoodT > 0.5 ? 0 : 1; Audio2.init(); Audio2.burst(st.hoodT ? 320 : 110, 1, 0.16, 0.22, 'lowpass'); W.setButtons(this.buttons(W)); },
  sit(W) {
    const m = this.m, sh = m.sh, st = this.state, belt = sh.beltY, yF = sh.wheels.r * 0 + (sh.up[0][1]);
    const p = new THREE.Vector3(sh.W * 0.2, Math.min(sh.roofY - 0.14, belt + 0.31), sh.pillarZ + 0.36 + (sh.D.bed ? 0.06 : 0));
    st.hoodT = 0;
    W.seat = { p, yaw: 0, leave: () => { W.seat = null; if (this.revving) this.toggleEngine(W); W.pos.set(sh.W / 2 + 0.9, 1.62, sh.pillarZ + 0.5); W.yaw = -Math.PI / 2; W.pitch = -0.1; W.setButtons(this.buttons(W)); const sub = $('#wSub'); if (sub) sub.textContent = CARS[this.c.model].name; W.cam.near = 0.06; W.cam.updateProjectionMatrix(); } };
    W.yaw = 0; W.pitch = -0.05; W.cam.near = 0.03; W.cam.updateProjectionMatrix(); Audio2.init(); Audio2.burst(140, 0.8, 0.18, 0.25, 'lowpass');
    W.setButtons(this.buttons(W));
  },
  toggleEngine(W) {
    Audio2.init();
    if (this.revving) { Audio2.stopEngine(); this.revving = false; for (const m of this.models()) m.body.rotation.z = 0; }
    else { this.sp = carSpec(this.c); Audio2.startEngine(this.sp); this.state.rpm = 300; this.state.blip = 0.5; this.revving = true; }
    W.setButtons(this.buttons(W));
  },
  // ---- the install film: get the car ready, the part flies over from the bench, it is torqued down, everything goes back
  playInstall(W, inst) {
    const p = inst.p, m = this.m, sh = m.sh, st = this.state, loc = LOC[p.slot] || 'out', V = (x, y, z) => new THREE.Vector3(x, y, z), cl = sh.L / 2, cw = sh.W / 2;
    const rear = ['wing', 'tail', 'diffuser', 'pipes', 'louver', 'exhaust'].includes(p.slot), sideJob = ['flares', 'decal', 'mirrors', 'roof', 'tirelet', 'tint', 'neon', 'wheels', 'tires'].includes(p.slot);
    let T, camP, prep = () => {};
    if (loc === 'bay') { T = V(0, shapeTopAt(sh, sh.cowlZ + 0.5) - 0.1, sh.cowlZ + 0.5); camP = V(1.5, 1.85, cl + 1.2); prep = (k) => { st.hood = k; }; }
    else if (loc === 'wheel') { T = V(-cw + 0.05, sh.wheels.r + 0.22, sh.wheels.zf); camP = V(-cw - 2.0, 0.85, sh.wheels.zf + 1.3); prep = (k) => { st.lift = 0.22 * Math.min(1, k * 2); st.wheelOff = clamp(k * 2 - 1, 0, 1); }; }
    else if (loc === 'under') { T = V(0, 1.42, rear ? -cl + 0.9 : 0.2); camP = V(-2.5, 0.75, rear ? -cl - 1.2 : 1.9); prep = (k) => { st.lift = 1.2 * k; }; }
    else if (loc === 'cabin') { T = V(sh.W * 0.1, sh.beltY, sh.cowlZ - 0.5); camP = V(cw + 1.5, 1.4, sh.pillarZ + 1.0); }
    else if (rear) { T = V(0, shapeTopAt(sh, -cl + 0.3), -cl + 0.2); camP = V(1.9, 1.45, -cl - 2.0); }
    else if (sideJob) { T = V(-cw, 0.75, 0); camP = V(-cw - 2.6, 1.35, 0.9); }
    else { T = V(0, 0.55, cl - 0.1); camP = V(-1.8, 1.15, cl + 2.1); }
    const tex = new THREE.CanvasTexture(ArtCache.get(p)); W.track.push(tex);
    const sm = new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }); W.track.push(sm);
    const spr = new THREE.Sprite(sm); spr.renderOrder = 9; spr.visible = false; W.scene.add(spr);
    const bench = V(-3.9, 1.3, 1.9), fl = new THREE.PointLight(0xfff0c0, 0, 6, 2); fl.position.copy(T); W.scene.add(fl);
    const pc = Math.round(inst.q * 100), nm = torqueFor(p, inst.c), swap = () => { if (this.mOld) { this.mOld.g.visible = false; this.m.g.visible = true; } };
    Audio2.init();
    W.play([
      { dur: 1.7, to: [camP, T], run: (k) => prep(k), cap: loc === 'under' ? 'Emelőre vele' : loc === 'wheel' ? 'Emelő alá, kerék le' : loc === 'bay' ? 'Motorháztető fel' : 'Előkészítés', start: () => { if (loc === 'under' || loc === 'wheel') Audio2.ratchet(true); }, end: () => Audio2.ratchet(false) },
      { dur: 1.5, cap: p.name, start: () => { spr.visible = true; }, run: (k) => { const e = k * k * (3 - 2 * k); spr.position.lerpVectors(bench, T, e); spr.position.y += Math.sin(e * Math.PI) * 0.7; const s2 = lerp(0.75, 0.42, e); spr.scale.set(s2, s2, 1); sm.rotation = (1 - e) * 0.5; } },
      { dur: 1.25, cap: nm ? `Meghúzás: ${nm} Nm` : 'A helyére kerül', start: () => { swap(); Audio2.ratchet(true); Audio2.burst(900, 2, 0.12, 0.25); }, run: (k) => { sm.opacity = 1 - k; fl.intensity = Math.sin(k * Math.PI) * 1.6; W.cam.position.x += Math.sin(k * 60) * 0.0025; }, end: () => { Audio2.ratchet(false); spr.visible = false; fl.intensity = 0; } },
      { dur: 1.5, cap: 'Vissza a földre', run: (k) => prep(1 - k), start: () => { if (loc === 'under' || loc === 'wheel') Audio2.ratchet(true); }, end: () => { Audio2.ratchet(false); prep(0); if (loc === 'bay') Audio2.burst(110, 1, 0.16, 0.25, 'lowpass'); } },
      { dur: 2.4, to: [V(3.1, 1.45, 3.7), V(0, 0.62, 0)], cap: `${p.name} · ${pc}%` }
    ], () => { swap(); st.hoodT = 0; toast(`${p.name} beszerelve · ${pc}%`, inst.q >= 0.6 ? 'good' : 'bad'); });
  }
};
