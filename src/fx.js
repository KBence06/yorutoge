// ===================== RACE EFFECTS: smoke, skid marks, sparks, light beams, roadside dressing =====================
const FX = {
  init(R) {
    this.R = R; const T = R.T, scene = R.scene, track = R.disposables, gfx = S.settings.gfx;
    this.low = gfx === 'low';
    // ---- particles (one draw call each)
    const shader = (additive) => new THREE.ShaderMaterial({
      uniforms: { map: { value: R.glowTex() }, scale: { value: 400 } },
      vertexShader: 'attribute float size; attribute vec4 col; varying vec4 vC; uniform float scale; void main(){ vC = col; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = min(size * scale / -mv.z, 220.0); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform sampler2D map; varying vec4 vC; void main(){ vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(vC.rgb, vC.a * t.a); }',
      transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending
    });
    const pool = (n, additive) => {
      const geo = new THREE.BufferGeometry();
      const p = { n, pos: new Float32Array(n * 3), size: new Float32Array(n), col: new Float32Array(n * 4), vel: new Float32Array(n * 3), life: new Float32Array(n), max: new Float32Array(n), kind: new Uint8Array(n), next: 0 };
      geo.setAttribute('position', new THREE.BufferAttribute(p.pos, 3)); geo.setAttribute('size', new THREE.BufferAttribute(p.size, 1)); geo.setAttribute('col', new THREE.BufferAttribute(p.col, 4));
      const mat = shader(additive), pts = new THREE.Points(geo, mat); pts.frustumCulled = false; scene.add(pts); track.push(geo, mat);
      p.geo = geo; p.mat = mat; return p;
    };
    this.smoke = pool((this.low ? 70 : 150) + (R.W.wet > 0.3 ? (this.low ? 60 : 120) : 0), false);
    this.sparks = pool(120, true);
    // ---- skid marks: a ring buffer of quads
    const MAXQ = this.low ? 600 : 1400;
    const sg = new THREE.BufferGeometry(), spos = new Float32Array(MAXQ * 4 * 3), sidx = new Uint32Array(MAXQ * 6);
    for (let q = 0; q < MAXQ; q++) { const v = q * 4, o = q * 6; sidx.set([v, v + 1, v + 2, v + 2, v + 1, v + 3], o); }
    sg.setAttribute('position', new THREE.BufferAttribute(spos, 3)); sg.setIndex(new THREE.BufferAttribute(sidx, 1)); sg.setDrawRange(0, 0);
    const sm = new THREE.MeshBasicMaterial({ color: 0x050505, transparent: true, opacity: 0.42, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
    const skid = new THREE.Mesh(sg, sm); skid.frustumCulled = false; scene.add(skid); track.push(sg, sm);
    this.skid = { geo: sg, pos: spos, MAXQ, q: 0, count: 0, last: [null, null, null, null] };
    this.buildBeams(); this.buildWalls(); this.buildSigns(); this.buildVending();
    this.buildMirrors(); this.buildPoles(); this.buildGrass(); this.buildMarkings();
    this.rain = null; if (R.W.rain) this.buildRain();
    if (R.wk === 'rain') this.buildPuddles();
  },
  // falling streaks kept in a box around the camera
  buildRain() {
    const R = this.R, n = this.low ? 700 : 1600, pos = new Float32Array(n * 6), d = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { d[i * 3] = (Math.random() - 0.5) * 60; d[i * 3 + 1] = Math.random() * 26 - 6; d[i * 3 + 2] = (Math.random() - 0.5) * 60; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.LineBasicMaterial({ color: R.dawn ? 0xb8c0d0 : 0x7a869e, transparent: true, opacity: R.dawn ? 0.45 : 0.55, depthWrite: false });
    const lines = new THREE.LineSegments(geo, mat); lines.frustumCulled = false; R.scene.add(lines); R.disposables.push(geo, mat);
    this.rain = { n, pos, d, geo, ox: null, oz: 0 };
  },
  updateRain(dt, R) {
    const r = this.rain, cam = R.cam.position, P = R.P;
    // drops live in world space; the box is re-centred a little ahead of the camera
    const cx = cam.x + Math.sin(R.camH) * 14, cz = cam.z + Math.cos(R.camH) * 14;
    const fall = 13 * dt, vx = P.vx * 0.045, vz = P.vz * 0.045;
    for (let i = 0; i < r.n; i++) {
      let x = r.d[i * 3], y = r.d[i * 3 + 1], z = r.d[i * 3 + 2];
      y -= fall;
      if (y < cam.y - 7 || Math.abs(x - cx) > 30 || Math.abs(z - cz) > 30) { x = cx + (Math.random() - 0.5) * 60; z = cz + (Math.random() - 0.5) * 60; y = cam.y + 8 + Math.random() * 12; }
      r.d[i * 3] = x; r.d[i * 3 + 1] = y; r.d[i * 3 + 2] = z;
      const o = i * 6; r.pos[o] = x; r.pos[o + 1] = y; r.pos[o + 2] = z; r.pos[o + 3] = x - vx; r.pos[o + 4] = y + 0.55; r.pos[o + 5] = z - vz;
    }
    r.geo.attributes.position.needsUpdate = true;
  },
  // standing water in dips and on the outside of bends: dark, mirror-like, and slippery
  buildPuddles() {
    const R = this.R, T = R.T, rnd = this.rng(31 + T.N), list = [];
    for (let s = T.start + 40 + rnd() * 60; s < T.finish - 20; s += 70 + rnd() * 90) {
      const i = Math.floor(s), k = T.k[i], lat = clamp((k ? -Math.sign(k) : (rnd() < 0.5 ? -1 : 1)) * (0.6 + rnd() * 2.2), -(ROAD_HW - 0.7), ROAD_HW - 0.7);
      list.push({ s, lat, r: 0.9 + rnd() * 1.1 });
    }
    R.puddles = list;
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 4, 32, 32, 31); gr.addColorStop(0, 'rgba(6,7,10,0.95)'); gr.addColorStop(0.7, 'rgba(6,7,10,0.8)'); gr.addColorStop(1, 'rgba(6,7,10,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(cv), parts = [];
    for (const q of list) {
      const pos = [], uv = [], idx = [], n = 6, len = q.r * 3;
      for (let rr = 0; rr <= n; rr++) {
        const p = trackPoint(T, q.s - len / 2 + len * rr / n), c = Math.cos(p.h), sn = Math.sin(p.h);
        for (const [l, u] of [[q.lat + q.r, 0], [q.lat - q.r, 1]]) { pos.push(p.x + c * l, p.y + 0.045, p.z - sn * l); uv.push(u, rr / n); }
        if (rr) { const a = (rr - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
      R.disposables.push(geo); parts.push([geo]);
    }
    if (!parts.length) return;
    const mat = new THREE.MeshPhongMaterial({ map: tex, transparent: true, specular: 0xb0b8c8, shininess: 160, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
    R.disposables.push(tex, mat);
    const m = new THREE.Mesh(this.merge(parts), mat); m.renderOrder = 1; R.scene.add(m);
  },
  // merge plain geometries into one non-indexed buffer with per-part vertex colours
  merge(parts) {
    const pos = [], nor = [], uv = [], col = [];
    for (const [geo, color] of parts) {
      const g = geo.index ? geo.toNonIndexed() : geo, c = new THREE.Color(color || 0xffffff), n = g.attributes.position.count;
      pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array);
      if (g.attributes.uv) uv.push(...g.attributes.uv.array); else for (let i = 0; i < n; i++) uv.push(0, 0);
      for (let i = 0; i < n; i++) col.push(c.r, c.g, c.b);
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); out.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    this.R.disposables.push(out); return out;
  },
  rng(seed) { let r = seed; return () => (r = (r * 16807) % 2147483647) / 2147483647; },
  // orange-poled convex mirrors on the outside of blind hairpins, angled back at the approaching car
  buildMirrors() {
    const R = this.R, T = R.T, D = R.disposables, list = R.corners.filter(c => c.sev <= 2 && c.s0 > T.start + 15 && c.s0 < T.finish - 10);
    if (!list.length) return;
    const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d');
    const sky = g.createLinearGradient(0, 0, 0, 128); sky.addColorStop(0, R.dawn ? '#e7b49c' : '#4a5a82'); sky.addColorStop(0.48, R.dawn ? '#8d8aa2' : '#28304a'); sky.addColorStop(0.5, '#0d0f12'); sky.addColorStop(1, '#1d1d20');
    g.fillStyle = sky; g.fillRect(0, 0, 128, 128);
    g.fillStyle = '#2a2a2d'; g.beginPath(); g.moveTo(20, 128); g.quadraticCurveTo(64, 50, 112, 64); g.lineTo(118, 72); g.quadraticCurveTo(80, 70, 108, 128); g.fill();
    g.strokeStyle = '#c98a2a'; g.lineWidth = 2; g.beginPath(); g.moveTo(64, 128); g.quadraticCurveTo(76, 76, 115, 68); g.stroke();
    g.fillStyle = 'rgba(255,170,90,0.85)'; g.beginPath(); g.arc(30, 40, 5, 0, 7); g.fill();
    const vg = g.createRadialGradient(64, 64, 30, 64, 64, 66); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.75)'); g.fillStyle = vg; g.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(cv);
    const faceM = new THREE.MeshPhongMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.85, specular: 0xffffff, shininess: 140 });
    const orange = new THREE.MeshLambertMaterial({ color: 0xf0640e, emissive: 0x401400 });
    const poleG = new THREE.CylinderGeometry(0.045, 0.05, 2.95, 8); poleG.translate(0, 1.47, 0);
    const backG = new THREE.CylinderGeometry(0.47, 0.42, 0.08, 22); backG.rotateX(Math.PI / 2); backG.translate(0, 0, -0.04);
    const rimG = new THREE.TorusGeometry(0.46, 0.035, 6, 26);
    const faceG = new THREE.SphereGeometry(1.25, 22, 6, 0, Math.PI * 2, 0, 0.38); faceG.rotateX(Math.PI / 2); faceG.translate(0, 0, -1.25 * Math.cos(0.38));
    const hoodG = new THREE.CylinderGeometry(0.5, 0.5, 0.16, 18, 1, true, -Math.PI / 2, Math.PI); hoodG.rotateX(Math.PI / 2); hoodG.translate(0, 0, 0.06);
    const armG = new THREE.BoxGeometry(0.06, 0.06, 0.32); armG.translate(0, 0, 0.16);
    D.push(tex, faceM, orange, poleG, backG, rimG, faceG, hoodG, armG);
    const faces = [], body = [];
    for (const c of list) {
      const s = c.s0 + (c.s1 - c.s0) * 0.3, i = Math.floor(s), h = T.h[i], lat = -c.dir * (RAIL + 0.8);
      const grp = new THREE.Group(); grp.position.set(T.x[i] + Math.cos(h) * lat, T.y[i], T.z[i] - Math.sin(h) * lat);
      grp.rotation.y = h + Math.PI - c.dir * 0.45;
      grp.add(new THREE.Mesh(poleG, orange));
      const heads = c.sev === 0 ? [-0.5, 0.5] : [0];
      if (heads.length > 1) { const bar = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.06, 0.06), orange); D.push(bar.geometry); bar.position.set(0, 2.85, 0.02); grp.add(bar); }
      for (const hx of heads) {
        const hd = new THREE.Group(); hd.position.set(hx, 2.85, 0.32); hd.rotation.x = 0.1;
        hd.add(new THREE.Mesh(backG, orange), new THREE.Mesh(rimG, orange), new THREE.Mesh(faceG, faceM), new THREE.Mesh(hoodG, orange));
        grp.add(hd);
        const arm = new THREE.Mesh(armG, orange); arm.position.set(hx, 2.85, 0); grp.add(arm);
      }
      grp.updateMatrixWorld(true);
      grp.traverse(o => { if (!o.isMesh) return; const gg = o.geometry.clone().applyMatrix4(o.matrixWorld); (o.material === faceM ? faces : body).push([gg]); });
    }
    const fm = new THREE.Mesh(this.merge(faces), faceM), bm = new THREE.Mesh(this.merge(body), orange);
    R.scene.add(fm, bm);
    this.mirrors = list.length;
  },
  // concrete utility poles with crossarms, transformers, striped base guards and sagging wires
  buildPoles() {
    const R = this.R, T = R.T, D = R.disposables, side = R.tg && R.tg.id === 'mikazuki' ? -1 : 1, lat = side * (RAIL + 1.25);
    const spots = []; let s = T.start - 20;
    while (s < T.finish + 25) {
      const i = Math.floor(s);
      if (!R.lamps.some(l => Math.abs(l.s - s) < 7)) spots.push(i);
      s += clamp(40 / Math.sqrt(1 + Math.abs(T.k[i]) * 70), 15, 40);
    }
    if (spots.length < 2) return;
    const pole = new THREE.CylinderGeometry(0.12, 0.17, 10, 8); pole.translate(0, 5, 0);
    const arm1 = new THREE.BoxGeometry(1.6, 0.09, 0.09); arm1.translate(0, 9.2, 0);
    const arm2 = new THREE.BoxGeometry(1.1, 0.08, 0.08); arm2.translate(0, 8.55, 0);
    const ins = []; for (const x of [-0.7, 0, 0.7]) { const q = new THREE.CylinderGeometry(0.04, 0.05, 0.14, 6); q.translate(x, 9.32, 0); ins.push([q, 0xd9d6cc]); }
    const brace = new THREE.BoxGeometry(0.04, 0.6, 0.04); brace.rotateZ(0.7); brace.translate(-0.28, 8.9, 0);
    const box = new THREE.BoxGeometry(0.2, 0.34, 0.08); box.translate(0, 3.1, -0.17);
    const geo = this.merge([[pole, 0x8d8b84], [arm1, 0x45474c], [arm2, 0x45474c], [brace, 0x45474c], [box, 0x9b9a92], ...ins]);
    const trafo = new THREE.CylinderGeometry(0.24, 0.24, 0.75, 10); trafo.translate(0.02, 7.25, 0.33);
    const trafoG = this.merge([[trafo, 0x777b80]]);
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
    // yellow/black guard sleeve at the base
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d');
    g.fillStyle = '#e8b81a'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#141414';
    for (let k = -2; k < 4; k++) { g.beginPath(); g.moveTo(k * 24, 64); g.lineTo(k * 24 + 12, 64); g.lineTo(k * 24 + 12 + 64, 0); g.lineTo(k * 24 + 64, 0); g.fill(); }
    const st = new THREE.CanvasTexture(cv); st.wrapS = st.wrapT = THREE.RepeatWrapping; st.repeat.set(2, 3);
    const sleeve = new THREE.CylinderGeometry(0.2, 0.2, 1.8, 12, 1, true); sleeve.translate(0, 0.9, 0);
    const sm = new THREE.MeshLambertMaterial({ map: st });
    D.push(pole, arm1, arm2, brace, box, trafo, mat, st, sleeve, sm);
    const n = spots.length, poles = new THREE.InstancedMesh(geo, mat, n), sleeves = new THREE.InstancedMesh(sleeve, sm, n);
    const nT = Math.ceil(n / 3), trafos = new THREE.InstancedMesh(trafoG, mat, nT);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), one = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
    const tops = []; let kt = 0;
    spots.forEach((i, k) => {
      const h = T.h[i], x = T.x[i] + Math.cos(h) * lat, z = T.z[i] - Math.sin(h) * lat, y = T.y[i] - 0.3;
      q.setFromAxisAngle(up, h); p.set(x, y, z); m4.compose(p, q, one);
      poles.setMatrixAt(k, m4); sleeves.setMatrixAt(k, m4); if (k % 3 === 1 && kt < nT) trafos.setMatrixAt(kt++, m4);
      const ax = Math.cos(h), az = -Math.sin(h);
      tops.push([[-0.7, 9.4], [0, 9.4], [0.7, 9.4], [-0.45, 8.62], [0.45, 8.62], [0, 6.4]].map(([o, hh]) => [x + ax * o, y + hh, z + az * o]));
    });
    trafos.count = kt;
    D.push(poles, sleeves, trafos); R.scene.add(poles, sleeves, trafos);
    // wires: parabolic sag between neighbouring poles
    const wp = [], seg = this.low ? 4 : 7;
    for (let k = 1; k < tops.length; k++) {
      const A = tops[k - 1], B = tops[k];
      const L = Math.hypot(B[0][0] - A[0][0], B[0][2] - A[0][2]); if (L > 60) continue;
      A.forEach((a, w) => {
        const b = B[w], sag = (w === 5 ? 0.0009 : 0.0005) * L * L;
        for (let j = 0; j < seg; j++) {
          const t0 = j / seg, t1 = (j + 1) / seg;
          wp.push(lerp(a[0], b[0], t0), lerp(a[1], b[1], t0) - sag * 4 * t0 * (1 - t0), lerp(a[2], b[2], t0), lerp(a[0], b[0], t1), lerp(a[1], b[1], t1) - sag * 4 * t1 * (1 - t1), lerp(a[2], b[2], t1));
        }
      });
    }
    const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3));
    const wm = new THREE.LineBasicMaterial({ color: R.dawn ? 0x16171b : 0x2a2d35 });
    D.push(wg, wm); R.scene.add(new THREE.LineSegments(wg, wm));
    this.poles = n;
  },
  // grass tufts with silver-grass plumes along the verge, plus low bushes
  buildGrass() {
    const R = this.R, T = R.T, D = R.disposables, th = R.terrH; if (!th) return;
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 128; const g = cv.getContext('2d'), rnd = this.rng(4242);
    for (let b = 0; b < 46; b++) {
      const x0 = 14 + rnd() * 100, hgt = 50 + rnd() * 70, lean = (rnd() - 0.5) * 50, v = 0.6 + rnd() * 0.4;
      g.strokeStyle = `rgb(${Math.round(70 * v)},${Math.round(98 * v)},${Math.round(52 * v)})`; g.lineWidth = 1.5 + rnd() * 2;
      g.beginPath(); g.moveTo(x0, 128); g.quadraticCurveTo(x0 + lean * 0.3, 128 - hgt * 0.6, x0 + lean, 128 - hgt); g.stroke();
    }
    for (let p = 0; p < 5; p++) { // susuki plumes
      const x0 = 20 + rnd() * 88, top = 6 + rnd() * 20, lean = (rnd() - 0.5) * 30;
      g.strokeStyle = '#6b6a4c'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x0, 128); g.quadraticCurveTo(x0, 70, x0 + lean, top + 22); g.stroke();
      g.strokeStyle = 'rgba(226,214,184,0.95)'; g.lineWidth = 1.2;
      for (let f = 0; f < 12; f++) { const yy = top + f * 2; g.beginPath(); g.moveTo(x0 + lean, yy + 6); g.lineTo(x0 + lean + (rnd() - 0.5) * 16 + lean * 0.3, yy); g.stroke(); }
    }
    const tex = new THREE.CanvasTexture(cv);
    const a = new THREE.PlaneGeometry(1.5, 1.1), b = new THREE.PlaneGeometry(1.5, 1.1); a.translate(0, 0.52, 0); b.translate(0, 0.52, 0); b.rotateY(Math.PI / 2);
    const geo = this.merge([[a], [b]]); geo.deleteAttribute('color');
    const mat = new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.45, side: THREE.DoubleSide });
    D.push(tex, a, b, mat);
    const n = this.low ? 650 : 1500, inst = new THREE.InstancedMesh(geo, mat, n);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), sc = new THREE.Vector3(), p = new THREE.Vector3(), col = new THREE.Color();
    const r2 = this.rng(777), s0 = Math.max(0, T.start - 40), span = Math.min(T.N - 2, T.finish + 40) - s0;
    let k = 0;
    for (let t = 0; t < n * 3 && k < n; t++) {
      const i = Math.floor(s0 + r2() * span), side = r2() < 0.5 ? -1 : 1, near = r2() < 0.45;
      const off = near ? RAIL + 0.3 + r2() * 1.0 : RAIL + 2.9 + r2() * r2() * 9;
      const h = T.h[i], x = T.x[i] + Math.cos(h) * off * side, z = T.z[i] - Math.sin(h) * off * side;
      if (R.nearRoad && R.nearRoad(x, z).d < RAIL + 0.2) continue;
      const y = near ? Math.max(th(x, z), T.y[i] - 0.45) : th(x, z);
      const s = 0.7 + r2() * 0.8; sc.set(s, s * (0.8 + r2() * 0.5), s); q.setFromAxisAngle(up, r2() * 3.1); p.set(x, y - 0.05, z);
      m4.compose(p, q, sc); inst.setMatrixAt(k, m4);
      const v = R.dawn ? 0.75 + r2() * 0.3 : 0.45 + r2() * 0.35; col.setRGB(v, v * (0.95 + r2() * 0.1), v * 0.85); inst.setColorAt(k, col);
      k++;
    }
    inst.count = k; D.push(inst); R.scene.add(inst);
    // low round bushes on the slopes
    const bg = new THREE.IcosahedronGeometry(1, 1), bm = new THREE.MeshLambertMaterial({ color: 0x14241a });
    const nb = this.low ? 120 : 300, bush = new THREE.InstancedMesh(bg, bm, nb); D.push(bg, bm);
    let kb = 0;
    for (let t = 0; t < nb * 3 && kb < nb; t++) {
      const i = Math.floor(s0 + r2() * span), side = r2() < 0.5 ? -1 : 1, off = RAIL + 3 + r2() * 14;
      const h = T.h[i], x = T.x[i] + Math.cos(h) * off * side, z = T.z[i] - Math.sin(h) * off * side;
      if (R.nearRoad && R.nearRoad(x, z).d < RAIL + 2.5) continue;
      const s = 0.6 + r2() * 0.9; sc.set(s * 1.3, s * 0.75, s * 1.2); q.setFromAxisAngle(up, r2() * 6); p.set(x, th(x, z) + s * 0.25, z);
      m4.compose(p, q, sc); bush.setMatrixAt(kb, m4); const v = 0.7 + r2() * 0.6; col.setRGB(v, v, v); bush.setColorAt(kb, col); kb++;
    }
    bush.count = kb; D.push(bush); R.scene.add(bush);
    this.grass = k;
  },
  // painted road text and deceleration bars, laid on a strip that follows the road surface
  markTex(kind) {
    const tall = kind === 'bars' ? [64, 512] : kind === 'slow' ? [256, 1024] : [256, 512];
    const cv = document.createElement('canvas'); cv.width = tall[0]; cv.height = tall[1]; const g = cv.getContext('2d'), W = tall[0], H = tall[1];
    g.fillStyle = '#fff';
    const text = (str, y0, y1, font) => {
      g.save(); g.font = font; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      const m = g.measureText(str), w = m.width || 1, sx = Math.min(1, (W * 0.92) / w), sy = (y1 - y0) / (parseFloat(font.match(/(\d+)px/)[1]) * 0.86);
      g.translate(W / 2, y1); g.scale(sx, sy); g.fillText(str, 0, 0); g.restore();
    };
    if (kind === 'bars') { for (let b = 0, y = H - 10; b < 9 && y > 0; b++) { g.fillRect(0, y - 14, W, 14); y -= 70 - b * 6; } }
    else if (kind === 'slow') { text('落とせ', 40, 470, `100px ${cssVar('--f-jp')}`); text('スピード', 560, 990, `100px ${cssVar('--f-jp')}`); }
    else if (kind === 'stop') text('止まれ', 30, 490, `110px ${cssVar('--f-jp')}`);
    else text('40', 30, 490, `800 200px ${cssVar('--f-disp')}`);
    // worn paint
    g.globalCompositeOperation = 'destination-out'; const rnd = this.rng(99 + W);
    for (let i = 0; i < W * H / 90; i++) { g.fillStyle = `rgba(0,0,0,${0.3 + rnd() * 0.7})`; g.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 3, 1 + rnd() * 3); }
    const t = new THREE.CanvasTexture(cv); t.anisotropy = 8; this.R.disposables.push(t); return t;
  },
  buildMarkings() {
    const R = this.R, T = R.T, D = R.disposables, mats = {};
    const mat = (kind) => mats[kind] || (mats[kind] = (() => { const m = new THREE.MeshLambertMaterial({ map: this.markTex(kind), color: 0xe6e2d6, transparent: true, opacity: 0.88, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); D.push(m); return m; })());
    const decal = (sA, len, lo, hi, kind) => {
      if (sA < 2 || sA + len > T.N - 3) return;
      const pos = [], uv = [], idx = [], n = Math.max(2, Math.ceil(len));
      for (let r = 0; r <= n; r++) {
        const p = trackPoint(T, sA + len * r / n), c = Math.cos(p.h), s = Math.sin(p.h);
        pos.push(p.x + c * hi, p.y + 0.04, p.z - s * hi, p.x + c * lo, p.y + 0.04, p.z - s * lo); uv.push(0, r / n, 1, r / n);
        if (r) { const a = (r - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
      D.push(geo); (byKind[kind] = byKind[kind] || []).push([geo]); used.push([sA, sA + len]);
    };
    const byKind = {};
    const used = [], free = (a, b) => !used.some(([u0, u1]) => a < u1 + 6 && b > u0 - 6);
    const lane = [0.35, ROAD_HW - 0.35];
    let prevEnd = T.start;
    for (const c of R.corners) {
      if (c.sev <= 1 && c.s0 - prevEnd > 40) {
        decal(c.s0 - 30, 22, lane[0], lane[1], 'bars');
        if (c.s0 - prevEnd > 62 && free(c.s0 - 46, c.s0 - 36)) decal(c.s0 - 46, 11, lane[0] + 0.15, lane[1] - 0.15, 'slow');
      }
      prevEnd = c.s1;
    }
    // speed limit on the longer straights
    let last = -1e9;
    for (let s = T.start + 30; s < T.finish - 40; s += 4) {
      const i = Math.floor(s); let straight = true;
      for (let j = i - 10; j < i + 30; j += 3) if (Math.abs(T.k[clamp(j, 0, T.N - 1)]) > 1 / 120) { straight = false; break; }
      if (straight && s - last > 380 && free(s, s + 5)) { decal(s, 5, 0.9, ROAD_HW - 0.9, '40'); last = s; }
    }
    if (T.finish + 20 < T.N - 3) decal(T.finish + 8, 5, lane[0] + 0.3, lane[1] - 0.3, 'stop');
    for (const k in byKind) { const m = new THREE.Mesh(this.merge(byKind[k]), mat(k)); m.renderOrder = 1; R.scene.add(m); }
    this.markings = used.length;
  },
  gradTex(nearBottom) {
    const cv = document.createElement('canvas'); cv.width = 4; cv.height = 128; const g = cv.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 128);
    if (nearBottom) { gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.7, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,1)'); }
    else { gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.4)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); }
    g.fillStyle = gr; g.fillRect(0, 0, 4, 128);
    const t = new THREE.CanvasTexture(cv); this.R.disposables.push(t); return t;
  },
  buildBeams() {
    if (this.low) return;
    const R = this.R, track = R.disposables;
    // headlight shafts in the mist
    const cone = new THREE.CylinderGeometry(2.4, 0.12, 20, 16, 1, true); cone.rotateX(Math.PI / 2); cone.translate(0, 0, 10); cone.rotateX(0.05);
    const mat = new THREE.MeshBasicMaterial({ map: this.gradTex(true), color: (R.pMesh && R.pMesh.lightColor) || 0xfff0d0, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    track.push(cone, mat);
    for (const m of [R.pMesh, R.rMesh]) if (m && m.heads) for (const [x, y, z] of m.heads) { const b = new THREE.Mesh(cone, mat); b.position.set(x, y, z - 0.1); m.body.add(b); }
    // sodium lamps pour a visible cone of light onto the road
    const lc = new THREE.CylinderGeometry(0.25, 4.2, 7, 14, 1, true); lc.translate(0, -3.5, 0);
    const lm = new THREE.MeshBasicMaterial({ map: this.gradTex(false), color: 0xff9a3a, transparent: true, opacity: 0.09, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    track.push(lc, lm);
    const inst = new THREE.InstancedMesh(lc, lm, R.lamps.length), m4 = new THREE.Matrix4();
    R.lamps.forEach((l, i) => { m4.makeTranslation(l.x, l.y - 0.1, l.z); inst.setMatrixAt(i, m4); });
    track.push(inst); R.scene.add(inst);
  },
  buildWalls() {
    const R = this.R, T = R.T, th = R.terrH; if (!th) return;
    const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d');
    g.fillStyle = '#5f5d57'; g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 900; i++) { const v = 70 + Math.random() * 40; g.fillStyle = `rgb(${v},${v - 2},${v - 6})`; g.fillRect(Math.random() * 128, Math.random() * 128, 2, 2); }
    g.fillStyle = 'rgba(40,58,34,0.55)'; for (let x = 0; x < 2; x++) for (let y = 0; y < 2; y++) g.fillRect(8 + x * 64, 8 + y * 64, 48, 48);
    g.fillStyle = '#8e8b83'; for (let i = 0; i <= 2; i++) { g.fillRect(i * 64 - 4, 0, 8, 128); g.fillRect(0, i * 64 - 4, 128, 8); }
    const tex = new THREE.CanvasTexture(cv); tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    const mat = new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide });
    R.disposables.push(tex, mat);
    for (const side of [-1, 1]) {
      const pos = [], uv = [], idx = []; let prev = -1, run = 0;
      for (let i = Math.max(0, T.start - 40); i < Math.min(T.N - 1, T.finish + 40); i += 3) {
        const ch = Math.cos(T.h[i]), sh = Math.sin(T.h[i]);
        const off = (RAIL + 1.6) * side, far = 14 * side;
        const diff = th(T.x[i] + ch * far, T.z[i] - sh * far) - T.y[i];
        const near = Math.abs(T.k[i]) < 1 / 16;
        if (diff > 3.5 && near) {
          const h = clamp(diff * 0.75, 2.2, 6.5), x = T.x[i] + ch * off, z = T.z[i] - sh * off, base = pos.length / 3;
          pos.push(x, T.y[i] - 0.4, z, x + ch * side * 0.8, T.y[i] + h, z - sh * side * 0.8);
          run += 3; uv.push(run / 4, 0, run / 4, h / 4);
          if (prev >= 0) idx.push(prev, base, prev + 1, prev + 1, base, base + 1);
          prev = base;
        } else prev = -1;
      }
      if (idx.length) {
        const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
        R.disposables.push(geo); R.scene.add(new THREE.Mesh(geo, mat)); this.walls = (this.walls || 0) + idx.length / 6;
      }
    }
  },
  signTex(kind) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d');
    if (kind === 'speed') {
      g.fillStyle = '#fff'; g.beginPath(); g.arc(64, 64, 60, 0, 7); g.fill(); g.strokeStyle = '#d0121e'; g.lineWidth = 14; g.beginPath(); g.arc(64, 64, 52, 0, 7); g.stroke();
      g.fillStyle = '#1d3f9a'; g.font = `800 58px ${cssVar('--f-disp')}`; g.textAlign = 'center'; g.fillText('40', 64, 84);
    } else if (kind === 'rock' || kind === 'slip') {
      g.save(); g.translate(64, 64); g.rotate(Math.PI / 4); g.fillStyle = '#f2c21b'; g.fillRect(-42, -42, 84, 84); g.strokeStyle = '#111'; g.lineWidth = 5; g.strokeRect(-38, -38, 76, 76); g.restore();
      g.fillStyle = '#111';
      if (kind === 'rock') { g.beginPath(); g.moveTo(36, 88); g.lineTo(64, 36); g.lineTo(92, 88); g.fill(); g.fillStyle = '#f2c21b'; g.beginPath(); g.arc(66, 66, 8, 0, 7); g.arc(76, 80, 6, 0, 7); g.fill(); }
      else { g.fillRect(50, 46, 28, 16); g.fillRect(46, 58, 36, 10); g.lineWidth = 3; g.strokeStyle = '#111'; g.beginPath(); g.moveTo(44, 80); g.bezierCurveTo(54, 70, 60, 92, 70, 80); g.bezierCurveTo(80, 70, 84, 92, 90, 82); g.stroke(); }
    } else {
      g.fillStyle = '#1d4fa3'; g.fillRect(4, 24, 120, 80); g.strokeStyle = '#fff'; g.lineWidth = 3; g.strokeRect(9, 29, 110, 70);
      g.fillStyle = '#fff'; g.font = `26px ${cssVar('--f-jp')}`; g.textAlign = 'center'; g.fillText(this.R.tg.jp, 64, 62); g.font = `700 20px ${cssVar('--f-disp')}`; g.fillText('↑ ' + ((this.R.T.finish - this.R.T.start) / 1000).toFixed(1) + ' km', 64, 90);
    }
    const t = new THREE.CanvasTexture(cv); this.R.disposables.push(t); return t;
  },
  buildSigns() {
    const R = this.R, T = R.T, kinds = ['dir', 'speed', 'rock', 'slip'];
    const post = new THREE.CylinderGeometry(0.04, 0.04, 2.4, 6); post.translate(0, 1.2, 0);
    const pm = new THREE.MeshLambertMaterial({ color: 0x8a8e96 }), pl = new THREE.PlaneGeometry(0.9, 0.9);
    R.disposables.push(post, pm, pl);
    const mats = kinds.map(k => { const m = new THREE.MeshBasicMaterial({ map: this.signTex(k), transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, color: 0xbcb6a8 }); R.disposables.push(m); return m; });
    let n = 0;
    for (let s = T.start + 25; s < T.finish - 60; s += 210) {
      const i = Math.floor(s); if (Math.abs(T.k[i]) > 1 / 60) continue;
      const kind = n === 0 ? 0 : 1 + (n % 3); n++;
      const off = RAIL + 0.9, x = T.x[i] + Math.cos(T.h[i]) * off, z = T.z[i] - Math.sin(T.h[i]) * off;
      const p = new THREE.Mesh(post, pm); p.position.set(x, T.y[i], z); R.scene.add(p);
      const b = new THREE.Mesh(pl, mats[kind]); b.position.set(x, T.y[i] + 2.2, z); b.rotation.y = T.h[i] + Math.PI; R.scene.add(b);
    }
  },
  buildVending() {
    const R = this.R, T = R.T, i = T.start + 22, h = T.h[i], off = RAIL + 1.9;
    const x = T.x[i] + Math.cos(h) * off, z = T.z[i] - Math.sin(h) * off, y = T.y[i];
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 256; const g = cv.getContext('2d');
    g.fillStyle = '#e9edf2'; g.fillRect(0, 0, 128, 256); g.fillStyle = '#d9f1ff'; g.fillRect(8, 10, 112, 120);
    const cols = ['#d33', '#1c58b8', '#e8c21b', '#2b8a3e', '#f07a1a'];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) { g.fillStyle = cols[(c + r * 2) % 5]; g.fillRect(14 + c * 21, 18 + r * 38, 14, 26); g.fillStyle = r === 0 ? '#1c58b8' : '#d33'; g.fillRect(14 + c * 21, 46 + r * 38, 14, 5); }
    g.fillStyle = '#1c58b8'; g.font = `18px ${cssVar('--f-jp')}`; g.textAlign = 'center'; g.fillText('つめた〜い', 64, 152);
    g.fillStyle = '#2a2c33'; g.fillRect(14, 196, 100, 34); g.fillStyle = '#111'; g.fillRect(90, 160, 24, 26);
    const tex = new THREE.CanvasTexture(cv); const face = new THREE.MeshBasicMaterial({ map: tex }), side = new THREE.MeshLambertMaterial({ color: 0xdfe3e8 });
    const geo = new THREE.BoxGeometry(1.0, 1.85, 0.75); R.disposables.push(tex, face, side, geo);
    const vm = new THREE.Mesh(geo, [side, side, side, side, face, side]);
    vm.position.set(x, y + 0.93, z); vm.rotation.y = h - Math.PI / 2; R.scene.add(vm);
    const glow = new THREE.PointLight(0xcfe8ff, 1.4, 16, 1.6); glow.position.set(x - Math.cos(h) * 1.2, y + 1.4, z + Math.sin(h) * 1.2); R.scene.add(glow);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: R.glowTex(), color: 0xcfe8ff, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
    sp.scale.set(3.2, 3.2, 1); sp.position.copy(glow.position); R.disposables.push(sp.material); R.scene.add(sp);
  },

  // ---------------------------------------------------------------- per frame
  emit(p, x, y, z, vx, vy, vz, life, size, r, g, b, a, kind) {
    const i = p.next; p.next = (p.next + 1) % p.n;
    p.pos[i * 3] = x; p.pos[i * 3 + 1] = y; p.pos[i * 3 + 2] = z; p.vel[i * 3] = vx; p.vel[i * 3 + 1] = vy; p.vel[i * 3 + 2] = vz;
    p.life[i] = life; p.max[i] = life; p.size[i] = size; p.col[i * 4] = r; p.col[i * 4 + 1] = g; p.col[i * 4 + 2] = b; p.col[i * 4 + 3] = a; p.kind[i] = kind;
  },
  wheelWorld(car, h, lx, lz) { return [car.x + lx * Math.cos(h) + lz * Math.sin(h), car.z - lx * Math.sin(h) + lz * Math.cos(h)]; },
  update(dt, R) {
    const P = R.P, M = CARS[R.c.model], sh = carShape(R.c.model, 0), hw = M.width / 2 - 0.12;
    const wheels = [[hw, sh.wheels.zr, 'r'], [-hw, sh.wheels.zr, 'r'], [hw, sh.wheels.zf, 'f'], [-hw, sh.wheels.zf, 'f']];
    const racing = R.phase === 'race' || R.phase === 'done';
    // skid marks + smoke from the player's tyres
    wheels.forEach(([lx, lz, axle], wi) => {
      const [wx, wz] = this.wheelWorld(P, P.h, lx, lz);
      const mark = racing && P.speed > 2.5 && (axle === 'r' ? (P.slipR > 0.11 || P.wheelspin || P.locked) : (P.slipF > 0.17 || (P.locked && P.brk > 0.5)));
      const last = this.skid.last[wi];
      if (mark) {
        if (last) {
          const dx = wx - last[0], dz = wz - last[1], d = Math.hypot(dx, dz);
          if (d > 0.35) { this.addSkid(last[0], last[1], wx, wz, P.y + 0.035); this.skid.last[wi] = [wx, wz]; }
        } else this.skid.last[wi] = [wx, wz];
        if (axle === 'r' && (P.slide > 0.3 || P.wheelspin) && Math.random() < (this.low ? 0.25 : 0.6)) {
          const k = Math.min(1, P.slide);
          this.emit(this.smoke, wx + (Math.random() - 0.5) * 0.4, P.y + 0.25, wz + (Math.random() - 0.5) * 0.4, P.vx * 0.25 + (Math.random() - 0.5) * 0.8, 0.5 + Math.random() * 0.6, P.vz * 0.25 + (Math.random() - 0.5) * 0.8, 1.2 + Math.random() * 0.8, 1.1 + k, 0.72, 0.7, 0.68, 0.22 + 0.2 * k, 0);
        }
      } else this.skid.last[wi] = null;
    });
    // sparks where steel meets steel
    if (racing && P.rail && P.speed > 4) {
      const n = Math.min(8, 2 + Math.floor(P.speed / 6));
      for (let k = 0; k < n; k++) {
        const along = (Math.random() - 0.3) * 3;
        const [cx, cz] = this.wheelWorld(P, P.h, P.railSide * (M.width / 2), along);
        this.emit(this.sparks, cx, P.y + 0.5 + Math.random() * 0.2, cz, P.vx * 0.7 + (Math.random() - 0.5) * 3, 1 + Math.random() * 2.5, P.vz * 0.7 + (Math.random() - 0.5) * 3, 0.25 + Math.random() * 0.3, 0.18 + Math.random() * 0.12, 1, 0.65 + Math.random() * 0.3, 0.25, 1, 1);
      }
    }
    if (R.R && R.rMesh && Math.abs(R.R.yawVis) > 0.18 && R.R.v > 8 && Math.random() < 0.35) {
      const Rv = R.R, rh = Rv.h + Rv.yawVis, [wx, wz] = this.wheelWorld(Rv, rh, 0, -1.2);
      this.emit(this.smoke, wx, Rv.y + 0.25, wz, Math.sin(Rv.h) * Rv.v * 0.25, 0.6, Math.cos(Rv.h) * Rv.v * 0.25, 1.4, 1.4, 0.72, 0.7, 0.68, 0.28, 0);
    }
    // wet road: tyre spray behind every car, a splash through standing water
    const wet = R.W.wet;
    if (wet > 0.3 && racing) {
      const spray = (car, h, v) => {
        if (v < 6 || Math.random() > Math.min(1, v / 28) * wet * (this.low ? 0.5 : 1)) return;
        for (const sx of [-1, 1]) { const [wx, wz] = this.wheelWorld(car, h, sx * hw, sh.wheels.zr - 0.3); this.emit(this.smoke, wx, car.y + 0.25, wz, Math.sin(h) * v * 0.35 + (Math.random() - 0.5), 0.7 + Math.random() * 0.5, Math.cos(h) * v * 0.35 + (Math.random() - 0.5), 0.6 + Math.random() * 0.4, 0.8 + v * 0.03, 0.78, 0.8, 0.84, 0.07 + 0.08 * wet, 0); }
      };
      spray(P, P.h, P.speed);
      if (R.R) spray(R.R, R.R.h, R.R.v);
      if (R.police && R.police.v > 0) spray(R.police, R.police.h, R.police.v);
      if (P.wetSpot && P.speed > 7 && P.wetSpot(P.s, P.lat) < 1) for (let k = 0; k < 3; k++) this.emit(this.smoke, P.x + (Math.random() - 0.5) * 1.6, P.y + 0.3, P.z + (Math.random() - 0.5) * 1.6, P.vx * 0.2 + (Math.random() - 0.5) * 4, 1.5 + Math.random() * 2, P.vz * 0.2 + (Math.random() - 0.5) * 4, 0.7, 1.2, 0.85, 0.88, 0.92, 0.25, 0);
    }
    if (this.rain) this.updateRain(dt, R);
    this.step(this.smoke, dt, 0.4); this.step(this.sparks, dt, -9.8);
    const sc = R.renderer.domElement.height / (2 * Math.tan(R.cam.fov * Math.PI / 360));
    this.smoke.mat.uniforms.scale.value = sc; this.sparks.mat.uniforms.scale.value = sc;
  },
  step(p, dt, gy) {
    for (let i = 0; i < p.n; i++) {
      if (p.life[i] <= 0) { p.col[i * 4 + 3] = 0; continue; }
      p.life[i] -= dt; const t = 1 - p.life[i] / p.max[i];
      p.vel[i * 3 + 1] += gy * dt;
      const drag = p.kind[i] === 0 ? 1 - dt * 1.2 : 1;
      p.vel[i * 3] *= drag; p.vel[i * 3 + 2] *= drag;
      p.pos[i * 3] += p.vel[i * 3] * dt; p.pos[i * 3 + 1] += p.vel[i * 3 + 1] * dt; p.pos[i * 3 + 2] += p.vel[i * 3 + 2] * dt;
      if (p.kind[i] === 0) { p.size[i] += dt * 2.6; p.col[i * 4 + 3] = Math.max(0, p.col[i * 4 + 3] - dt * 0.18); if (p.life[i] <= 0) p.col[i * 4 + 3] = 0; }
      else { p.col[i * 4 + 1] = Math.max(0.2, p.col[i * 4 + 1] - dt * 1.5); p.col[i * 4 + 3] = 1 - t; }
    }
    p.geo.attributes.position.needsUpdate = true; p.geo.attributes.size.needsUpdate = true; p.geo.attributes.col.needsUpdate = true;
  },
  addSkid(x0, z0, x1, z1, y) {
    const s = this.skid, q = s.q, dx = x1 - x0, dz = z1 - z0, l = Math.hypot(dx, dz) || 1, nx = dz / l * 0.11, nz = -dx / l * 0.11, o = q * 12;
    s.pos.set([x0 + nx, y, z0 + nz, x0 - nx, y, z0 - nz, x1 + nx, y, z1 + nz, x1 - nx, y, z1 - nz], o);
    s.q = (q + 1) % s.MAXQ; s.count = Math.min(s.MAXQ, s.count + 1);
    s.geo.attributes.position.needsUpdate = true; s.geo.setDrawRange(0, s.count * 6);
  }
};
