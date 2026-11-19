// ===================== PEOPLE: low-poly humans with clothes, hair, faces and simple animated poses =====================
// Every body part is a lathe (a turned profile) or a sphere, painted with vertex colours, and merged per bone, so a person
// is about a dozen meshes that all share two materials (matte cloth and glossy satin/vinyl/lenses). Bones are plain groups:
// hips → legs (thigh, shin+shoe), spine → neck → head, shoulders → upper arm → forearm+hand.
const Human = {
  SKIN: ['#f0d3bd', '#e7c2a5', '#dcae8b', '#c99572', '#a87355', '#7d5139'],
  HAIR: ['#0b0908', '#120d0b', '#1c1410', '#2c1d14', '#4a2e1c', '#8a5a2c', '#c79a52', '#d9c08a', '#6a1e1a'],
  TOPS: ['tee', 'tee', 'longsleeve', 'hoodie', 'hoodie', 'jacket', 'jacket', 'sukajan', 'track', 'coverall', 'longcoat'],
  CLOTH: ['#16171c', '#1c1d22', '#24262c', '#2e3138', '#3a3d44', '#d8d2c2', '#ece8de', '#8a2a22', '#a8201c', '#2a4f9a', '#1d2e5a', '#2f6b3a', '#1f3a2a', '#7a3a6a', '#b89a3a', '#c86a1e', '#5a4a3a', '#6b6f78'],
  PANTS: ['#1d2a44', '#25324d', '#2c3a58', '#141418', '#1c1c20', '#4a4636', '#3a3a3e', '#5a5040'],
  mats: null,
  // shared materials (vertex coloured); built once per renderer scene graph and tracked by the caller
  materials(track) {
    if (this.mats && !this.mats.matte.__dead) return this.mats;
    const lv = gfxLv();
    const mk = (o) => { const m = lv === 0 ? new THREE.MeshLambertMaterial({ vertexColors: true }) : new THREE.MeshStandardMaterial(Object.assign({ vertexColors: true, metalness: 0 }, o)); return m; };
    const shadowTex = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'); const gr = g.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, 'rgba(0,0,0,0.75)'); gr.addColorStop(0.55, 'rgba(0,0,0,0.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(cv); })();
    // skinned copies for the animated people (one draw call per person and material), plain ones for frozen crowds
    const sk = (m) => { m.skinning = true; return m; };
    this.mats = {
      matte: mk({ roughness: 0.86 }), gloss: mk({ roughness: 0.32 }),
      glow: new THREE.MeshBasicMaterial({ vertexColors: true }),
      sMatte: sk(mk({ roughness: 0.86 })), sGloss: sk(mk({ roughness: 0.32 })), sGlow: sk(new THREE.MeshBasicMaterial({ vertexColors: true })),
      shadow: new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
      shadowGeo: new THREE.PlaneGeometry(1, 1), shadowTex
    };
    const M = this.mats; M.shadowGeo.rotateX(-Math.PI / 2);
    // when the scene is torn down the caller disposes these; mark them so the next scene builds fresh ones
    for (const k of ['matte', 'gloss', 'glow', 'sMatte', 'sGloss', 'sGlow', 'shadow']) { const m = M[k], d = m.dispose.bind(m); m.dispose = () => { m.__dead = true; M.matte.__dead = true; d(); }; track.push(m); }
    track.push(M.shadowGeo, M.shadowTex); const gd = M.shadowGeo.dispose.bind(M.shadowGeo); M.shadowGeo.dispose = () => { M.matte.__dead = true; gd(); };
    return M;
  },
  // ---- a random but repeatable person
  random(seed, o) {
    let s = (seed | 0) * 9301 + 49297; const r = () => (s = (s * 16807) % 2147483647) / 2147483647, pick = (a) => a[Math.floor(r() * a.length)];
    const top = (o && o.top) || pick(this.TOPS), coverall = top === 'coverall';
    const sp = {
      h: 0.93 + r() * 0.13, w: 0.92 + r() * 0.2, skin: pick(this.SKIN), hairCol: r() < 0.18 ? pick(this.HAIR.slice(5)) : pick(this.HAIR.slice(0, 5)),
      hair: pick(['short', 'short', 'pomp', 'long', 'buzz', 'spiky', 'bun', 'bald']), hat: r() < 0.38 ? pick(['cap', 'cap', 'capback', 'beanie', 'band']) : null,
      top, topCol: pick(this.CLOTH), inner: pick(['#ece8de', '#16171c', '#8a2a22', '#d8d2c2']), trim: pick(['#c8202a', '#ece8de', '#16171c', '#d9b74a', '#2a4f9a']),
      pants: coverall ? null : pick(['jeans', 'jeans', 'black', 'cargo', 'track', 'baggy']), pantsCol: pick(this.PANTS),
      shoes: pick(['sneaker', 'sneaker', 'black', 'boot']), glasses: r() < 0.16, mask: r() < 0.1, beard: r() < 0.14, towel: r() < 0.08,
      female: r() < 0.22
    };
    if (sp.female) { sp.w *= 0.9; sp.h *= 0.95; sp.beard = false; if (r() < 0.6) sp.hair = pick(['long', 'long', 'bun', 'short']); }
    if (coverall) sp.pantsCol = sp.topCol;
    if (sp.top === 'track') sp.pants = 'track', sp.pantsCol = sp.topCol;
    return Object.assign(sp, o || {});
  },
  // ---- geometry helpers: every part is non-indexed, with position, normal and colour
  _c: null,
  paint(geo, fn) {
    if (geo.index) geo = geo.toNonIndexed();
    const p = geo.attributes.position, c = new Float32Array(p.count * 3), col = this._c || (this._c = new THREE.Color());
    for (let i = 0; i < p.count; i++) { col.set(fn(p.getX(i), p.getY(i), p.getZ(i))); c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b; }
    geo.setAttribute('color', new THREE.BufferAttribute(c, 3)); if (geo.attributes.uv) geo.deleteAttribute('uv'); return geo;
  },
  lathe(prof, seg) { const g = new THREE.LatheGeometry(prof.map(([rr, y]) => new THREE.Vector2(Math.max(0.0005, rr), y)), seg || 12); g.computeVertexNormals(); return g; },
  // a limb hanging down from its joint: round top of radius r0 at y=0, round bottom of radius r1 at y=-len
  limb(r0, r1, len, seg) {
    const pts = [];
    for (let i = 0; i <= 4; i++) { const a = -Math.PI / 2 + i / 4 * Math.PI / 2; pts.push([r1 * Math.cos(a), -len + r1 * Math.sin(a)]); }
    for (let i = 0; i <= 4; i++) { const a = i / 4 * Math.PI / 2; pts.push([r0 * Math.cos(a), r0 * Math.sin(a) * 0.7]); }
    return this.lathe(pts, seg || 10);
  },
  xf(geo, x, y, z, rx, ry, rz, sx, sy, sz) {
    const m = new THREE.Matrix4().compose(new THREE.Vector3(x || 0, y || 0, z || 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, ry || 0, rz || 0)), new THREE.Vector3(sx || 1, sy == null ? (sx || 1) : sy, sz == null ? (sx || 1) : sz));
    geo.applyMatrix4(m); return geo;
  },
  // concatenate parts; with `groups` (vertex counts) each run becomes its own material group
  merge(list, groups) {
    let n = 0; for (const g of list) n += g.attributes.position.count;
    const skin = !!(list[0] && list[0].attributes.skinIndex);
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), si = skin ? new Float32Array(n * 4) : null, sw = skin ? new Float32Array(n * 4) : null; let o = 0, o4 = 0;
    for (const g of list) { pos.set(g.attributes.position.array, o); nor.set(g.attributes.normal.array, o); col.set(g.attributes.color.array, o); if (skin) { si.set(g.attributes.skinIndex.array, o4); sw.set(g.attributes.skinWeight.array, o4); o4 += g.attributes.position.count * 4; } o += g.attributes.position.count * 3; g.dispose(); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    if (skin) { geo.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4)); geo.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4)); }
    if (groups && groups.length > 1) { let st = 0; groups.forEach((c, k) => { geo.addGroup(st, c, k); st += c; }); }
    geo.computeBoundingSphere(); return geo;
  },
  // ---- the person
  build(sp, opts) {
    opts = opts || {}; const track = opts.track, M = this.materials(track), lv = gfxLv(), seg = lv >= 3 ? 16 : lv === 0 ? 8 : 12;
    const H = this, S1 = sp.h, Wd = sp.w, skin = sp.skin, dk = (hex, k) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return c.getHex(); };
    const top = sp.top, topCol = sp.topCol, pantsCol = sp.pantsCol, coverall = top === 'coverall', longSleeve = top !== 'tee';
    const shiny = top === 'sukajan' || (top === 'jacket' && sp.topCol === '#16171c');
    const stripe = (x, z, s) => top === 'track' && Math.abs(Math.atan2(x * s, -z) - Math.PI / 2) < 0.28; // outer side of an arm or leg
    const parts = {}; // bone name → { matte: [], gloss: [], glow: [] }
    const put = (bone, geo, kind) => { (parts[bone] || (parts[bone] = { matte: [], gloss: [], glow: [] }))[kind || 'matte'].push(geo); };
    const fem = sp.female ? 1 : 0;
    // legs: thigh and shin+shoe, per side (s = +1 is the left side, +x; the person faces +z)
    const legCol = (y, x, z, s) => sp.pants === 'track' && stripe(x, z, s) ? '#ece8de' : sp.pants === 'cargo' && y < -0.2 && y > -0.3 && Math.abs(Math.atan2(x * s, -z) - Math.PI / 2) < 0.5 ? dk(pantsCol, 0.8) : pantsCol;
    const baggy = sp.pants === 'baggy' ? 1.18 : 1;
    for (const s of [1, -1]) {
      const side = s > 0 ? 'L' : 'R';
      put('th' + side, this.paint(this.limb(0.086 * Wd * baggy, 0.062 * baggy, 0.44, seg), (x, y, z) => legCol(y, x, z, s)));
      put('kn' + side, this.paint(this.limb(0.06 * baggy, 0.05 * baggy, 0.4, seg), (x, y, z) => legCol(y, x, z, s)));
      // shoe: a rounded wedge with a lighter sole
      const shoe = sp.shoes === 'sneaker' ? '#e8e6e0' : sp.shoes === 'boot' ? '#4a3220' : '#141416', sole = sp.shoes === 'sneaker' ? '#b8b4aa' : '#0c0c0d';
      const sg = this.xf(new THREE.SphereGeometry(0.06, seg, 8), 0, -0.405, 0.045, 0, 0, 0, 0.95, sp.shoes === 'boot' ? 0.9 : 0.62, 2.0);
      put('kn' + side, this.paint(sg, (x, y) => y < -0.425 ? sole : shoe));
      if (sp.shoes === 'boot') put('kn' + side, this.paint(this.xf(new THREE.CylinderGeometry(0.055, 0.06, 0.12, seg), 0, -0.35, 0), () => shoe));
    }
    // hips and torso
    const hipsR = 0.155 * Wd * (1 + fem * 0.08);
    put('hips', this.paint(this.xf(this.lathe([[0.001, -0.1], [hipsR * 0.8, -0.1], [hipsR, -0.04], [hipsR * 1.0, 0.04], [hipsR * 0.93, 0.1]], seg), 0, 0, 0, 0, 0, 0, 1, 1, 0.72), (x, y) => coverall || top === 'longcoat' ? topCol : y > 0.07 ? '#141416' : pantsCol));
    if (top === 'longcoat') put('hips', this.paint(this.xf(this.lathe([[hipsR * 1.02, 0.05], [hipsR * 1.12, -0.2], [hipsR * 1.25, -0.42], [hipsR * 1.3, -0.5]], seg), 0, 0, 0, 0, 0, 0, 1, 1, 0.8), (x, y, z) => Math.abs(x) < 0.03 && z > 0 ? sp.inner : topCol));
    const chest = 0.165 * Wd, waist = 0.135 * Wd * (1 - fem * 0.08), front = (x, z) => z > 0 && Math.abs(Math.atan2(x, z)) < 0.32;
    const torsoCol = (x, y, z) => {
      if (top === 'jacket' || top === 'sukajan' || top === 'longcoat') { if (front(x, z) && y < 0.46) return sp.inner; if (top === 'sukajan' && (y < 0.035 || y > 0.47)) return sp.trim; }
      if (top === 'hoodie' && z > 0 && y > 0.06 && y < 0.2 && Math.abs(x) < 0.09) return dk(topCol, 0.82);
      if (coverall && z > 0 && y > 0.3 && y < 0.38 && x > 0.03 && x < 0.1) return dk(topCol, 0.75);
      if (top === 'track' && Math.abs(x) < 0.008 && z > 0) return '#c8c8c8';
      return topCol;
    };
    const torsoProf = [[waist * 1.04, 0], [waist, 0.08], [waist * 1.03, 0.16], [chest * (1 + fem * 0.06), 0.28], [chest * 1.05, 0.37], [chest * 1.02, 0.43], [chest * 0.8, 0.475], [0.075, 0.498], [0.001, 0.505]];
    put('spine', this.paint(this.xf(this.lathe(torsoProf, seg + 2), 0, 0, 0, 0, 0, 0, 1.12, 1, 0.66), torsoCol), shiny ? 'gloss' : 'matte');
    if (top === 'hoodie') put('spine', this.paint(this.xf(new THREE.TorusGeometry(0.09, 0.035, 6, seg, Math.PI * 1.25), 0, 0.47, -0.035, Math.PI / 2 + 0.3, 0, -Math.PI / 2 - Math.PI * 0.625, 1, 1, 1), () => dk(topCol, 0.9)));
    if (top === 'jacket' || top === 'longcoat') put('spine', this.paint(this.xf(new THREE.TorusGeometry(0.075, 0.022, 5, seg, Math.PI * 1.4), 0, 0.475, -0.01, Math.PI / 2 + 0.25, 0, -Math.PI / 2 - Math.PI * 0.7, 1.15, 1, 1), () => dk(topCol, 0.85)));
    if (sp.towel) put('spine', this.paint(this.xf(new THREE.TorusGeometry(0.085, 0.025, 5, seg, Math.PI * 1.6), 0, 0.47, 0.0, Math.PI / 2 + 0.15, 0, -Math.PI / 2 - Math.PI * 0.8, 1.2, 1, 1), () => '#e8e6e0'));
    // neck and head
    put('neck', this.paint(this.xf(new THREE.CylinderGeometry(0.05, 0.056, 0.13, seg), 0, 0.045, 0), () => skin));
    const hr = 0.109, hy = 0.06;
    // the skull: a sphere with a narrower jaw and flatter back; hair is a second, slightly larger copy cut to a hairline
    const deform = (geo, k) => { const hp = geo.attributes.position; for (let i = 0; i < hp.count; i++) {
      let x = hp.getX(i), y = hp.getY(i), z = hp.getZ(i); const t = clamp(-y / (hr * k), 0, 1);
      x *= (0.9 - t * 0.22 * (1 - fem * 0.3)); z *= (z > 0 ? 1 - t * 0.12 : 0.94); y *= 1.13; const yc = -0.06 * k; if (y < yc) y = yc + (y - yc) * 0.8;
      hp.setXYZ(i, x, y, z); } geo.computeVertexNormals(); return geo; };
    // where hair grows, on the unit sphere: high on the forehead, above the ears at the sides, down to the nape at the back
    const longH = sp.hair === 'long', hairline = (u, v, w) => (w > 0 ? lerp(0.18, 0.52, w) : lerp(0.18, longH ? -0.75 : -0.62, -w)) - (longH && Math.abs(u) > 0.6 && w < 0.5 ? 0.45 : 0);
    const inHair = (x, y, z, r) => { const l = Math.hypot(x, y, z) || 1; return y / l > hairline(x / l, y / l, z / l); };
    const hc = sp.hairCol, hasHair = sp.hair !== 'bald' && sp.hat !== 'beanie';
    const head = deform(new THREE.SphereGeometry(hr, seg + 6, seg + 2), 1);
    // paint the scalp under the hair edge too, so the cut edge of the hair shell never shows skin
    const raw = new THREE.SphereGeometry(hr, seg + 6, seg + 2), rp = raw.attributes.position, sk = new THREE.Color(skin), hcC = new THREE.Color(hc);
    const headC = this.paint(head, () => skin), hcol = headC.attributes.color, rawN = raw.index ? raw.toNonIndexed() : raw, rnp = rawN.attributes.position;
    if (hasHair) for (let i = 0; i < rnp.count; i++) { const x = rnp.getX(i), y = rnp.getY(i), z = rnp.getZ(i), l = Math.hypot(x, y, z) || 1; if (y / l > hairline(x / l, y / l, z / l) - 0.06) hcol.setXYZ(i, hcC.r, hcC.g, hcC.b); }
    raw.dispose(); rawN.dispose();
    put('head', this.xf(headC, 0, hy, 0));
    // a shell of hair (or a hat) following the skull, kept only where keep(x,y,z) says
    const shell = (k, keep, col, gloss) => {
      const g0 = new THREE.SphereGeometry(hr * k, seg + 6, seg + 2), gn = g0.toNonIndexed(); g0.dispose();
      const p = gn.attributes.position, out = [];
      for (let i = 0; i < p.count; i += 3) { const cx = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3, cy = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3, cz = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3; if (keep(cx, cy, cz)) for (let q = 0; q < 3; q++) out.push(p.getX(i + q), p.getY(i + q), p.getZ(i + q)); }
      gn.dispose(); if (!out.length) return;
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(out, 3)); deform(g, k);
      put('head', this.paint(this.xf(g, 0, hy, 0), typeof col === 'function' ? col : () => col), gloss ? 'gloss' : 'matte');
    };
    // face: nose, ears, eyes, brows, mouth
    put('head', this.paint(this.xf(new THREE.ConeGeometry(0.017, 0.042, 6), 0, hy - 0.004, hr * 0.9, Math.PI / 2 + 0.3, 0, 0, 1, 1, 0.8), () => dk(skin, 0.94)));
    for (const s of [1, -1]) {
      put('head', this.paint(this.xf(new THREE.SphereGeometry(0.022, 6, 5), s * hr * 0.88, hy + 0.0, -0.005, 0, 0, 0, 0.45, 1.25, 0.9), () => dk(skin, 0.9)));
      if (!sp.glasses) {
        put('head', this.paint(this.xf(new THREE.SphereGeometry(0.0135, 8, 6), s * 0.035, hy + 0.022, hr * 0.9, 0, 0, 0, 1.25, 0.8, 0.6), () => '#e6e2da'));
        put('head', this.paint(this.xf(new THREE.SphereGeometry(0.0078, 6, 5), s * 0.035, hy + 0.022, hr * 0.94, 0, 0, 0, 1, 1, 0.6), () => '#16110e'));
      }
      put('head', this.paint(this.xf(new THREE.BoxGeometry(0.03, 0.006, 0.01), s * 0.035, hy + 0.045, hr * 0.885, 0, 0, s * -0.12), () => sp.hairCol));
    }
    put('head', this.paint(this.xf(new THREE.BoxGeometry(0.034, 0.005, 0.01), 0, hy - 0.052, hr * 0.86), () => dk(skin, 0.62)));
    if (sp.beard) put('head', this.paint(this.xf(new THREE.SphereGeometry(0.06, seg, 6, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.45), 0, hy - 0.02, 0.025, 0, 0, 0, 1.15, 1.2, 1.1), () => sp.hairCol));
    if (sp.glasses) put('head', this.paint(this.xf(new THREE.SphereGeometry(hr * 1.02, seg + 2, 4, Math.PI / 2 - 0.85, 1.7, Math.PI * 0.41, Math.PI * 0.11), 0, hy + 0.012, 0.002, 0, 0, 0, 0.93, 1.13, 1.0), () => '#060608'), 'gloss');
    if (sp.mask) put('head', this.paint(this.xf(new THREE.SphereGeometry(hr * 1.02, seg, 5, Math.PI / 2 - 0.95, 1.9, Math.PI * 0.5, Math.PI * 0.3), 0, hy - 0.004, 0.0, 0, 0, 0, 0.82, 1.08, 0.97), () => '#eef0f2'));
    // hair and hats
    const cap = (r, th, rx, sx, sy, sz, dy, dz) => this.xf(new THREE.SphereGeometry(r, seg + 2, 8, 0, Math.PI * 2, 0, th), 0, hy + (dy || 0), dz || 0, rx || 0, 0, 0, sx || 1, sy || 1, sz || 1);
    const capped = sp.hat === 'cap' || sp.hat === 'capback';
    if (hasHair) {
      shell(sp.hair === 'buzz' ? 1.018 : capped ? 1.04 : 1.065, (x, y, z) => inHair(x, y, z) && (!capped || y < hr * 0.3), hc);
      if (!capped && sp.hair === 'pomp') put('head', this.paint(this.xf(new THREE.SphereGeometry(0.07, seg, 8), 0, hy + 0.1, 0.06, 0.45, 0, 0, 1.05, 0.62, 1.25), () => hc));
      if (longH) put('head', this.paint(this.xf(new THREE.SphereGeometry(0.1, seg, 8, 0, Math.PI * 2, 0, Math.PI * 0.62), 0, hy - 0.035, -0.04, Math.PI, 0, 0, 1.0, 1.75, 0.6), () => hc));
      if (!capped && sp.hair === 'bun') put('head', this.paint(this.xf(new THREE.SphereGeometry(0.045, seg, 8), 0, hy + 0.1, -0.085), () => hc));
      if (!capped && sp.hair === 'spiky') for (let i = 0; i < 7; i++) { const a2 = (i / 6 - 0.5) * 2.2; put('head', this.paint(this.xf(new THREE.ConeGeometry(0.028, 0.09, 5), Math.sin(a2) * 0.06, hy + 0.1 + Math.cos(a2) * 0.02, -0.01 + (i % 2) * 0.03, -0.6, 0, -a2 * 0.6), () => hc)); }
    }
    if (capped) {
      const cc = sp.trim, back = sp.hat === 'capback';
      shell(1.1, (x, y, z) => y > hr * (z > 0 ? 0.36 : 0.12), (x, y) => Math.abs(x) < 0.006 && y > hy + 0.08 ? '#ece8de' : cc);
      put('head', this.paint(this.xf(new THREE.CylinderGeometry(0.088, 0.088, 0.008, seg, 1, false, -Math.PI / 2, Math.PI), 0, hy + 0.06, (back ? -1 : 1) * 0.07, back ? -0.15 : 0.15, back ? Math.PI : 0, 0, 0.95, 1, 1.1), () => dk(cc, 0.8)));
    }
    if (sp.hat === 'beanie') shell(1.12, (x, y, z) => y > hr * (z > 0 ? 0.3 : 0.0), (x, y) => y < hy + 0.045 ? dk(sp.trim, 0.82) : sp.trim);
    if (sp.hat === 'band') put('head', this.paint(this.xf(new THREE.TorusGeometry(hr * 0.98, 0.013, 5, seg + 4), 0, hy + 0.055, -0.004, Math.PI / 2 - 0.2, 0, 0, 0.93, 1.07, 1), () => '#f2f2ee'));
    // arms
    const sleeve = longSleeve ? topCol : skin, cuff = top === 'sukajan' || top === 'track' ? sp.trim : sleeve;
    for (const s of [1, -1]) {
      const side = s > 0 ? 'L' : 'R';
      put('sh' + side, this.paint(this.limb(0.064 * Wd, 0.05, 0.29, seg), (x, y, z) => top === 'track' && stripe(x, z, s) ? '#ece8de' : !longSleeve ? (y > -0.13 ? topCol : skin) : sleeve), shiny ? 'gloss' : 'matte');
      put('el' + side, this.paint(this.limb(0.049, 0.039, 0.25, seg), (x, y, z) => top === 'track' && stripe(x, z, s) ? '#ece8de' : longSleeve ? (y < -0.21 ? cuff : sleeve) : skin), shiny && longSleeve ? 'gloss' : 'matte');
      // hand: a mitten with a thumb
      put('el' + side, this.paint(this.xf(new THREE.SphereGeometry(0.04, 8, 6), 0, -0.3, 0.004, 0, 0, 0, 0.6, 1.35, 1.0), () => skin));
      put('el' + side, this.paint(this.xf(new THREE.SphereGeometry(0.016, 6, 4), -s * 0.012, -0.282, 0.035, 0.4, 0, 0, 1, 1.9, 1), () => skin));
    }
    // ---- bones
    // the whole body is one skinned mesh: every vertex follows exactly one bone (rigid parts, no bending)
    const g = new THREE.Group(), j = {}, bones = [], bone = (name, parent, x, y, z) => { const b = new THREE.Bone(); b.position.set(x, y, z); if (parent) parent.add(b); j[name] = b; b.userData.i = bones.length; bones.push(b); return b; };
    const scaleRoot = bone('root', null, 0, 0, 0); scaleRoot.scale.set(1, S1, 1);
    bone('hips', scaleRoot, 0, 0.93, 0);
    bone('thL', j.hips, 0.088 * Wd, -0.04, 0); bone('knL', j.thL, 0, -0.44, 0); bone('thR', j.hips, -0.088 * Wd, -0.04, 0); bone('knR', j.thR, 0, -0.44, 0);
    bone('spine', j.hips, 0, 0.09, 0); bone('neck', j.spine, 0, 0.465, -0.012); bone('head', j.neck, 0, 0.075, 0.01);
    bone('shL', j.spine, 0.185 * Wd, 0.43, -0.01); bone('elL', j.shL, 0, -0.29, 0); bone('shR', j.spine, -0.185 * Wd, 0.43, -0.01); bone('elR', j.shR, 0, -0.29, 0);
    j.elL.rotation.order = j.elR.rotation.order = 'YXZ';
    scaleRoot.updateMatrixWorld(true);
    const lists = [], mats = [];
    for (const kind of ['matte', 'gloss', 'glow']) {
      const list = [];
      for (const [name, p] of Object.entries(parts)) for (const geo of p[kind]) {
        geo.applyMatrix4(j[name].matrixWorld); const n = geo.attributes.position.count, si = new Float32Array(n * 4), sw = new Float32Array(n * 4);
        for (let i = 0; i < n; i++) { si[i * 4] = j[name].userData.i; sw[i * 4] = 1; }
        geo.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4)); geo.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4)); list.push(geo);
      }
      if (list.length) { lists.push(list); mats.push(M[{ matte: 'sMatte', gloss: 'sGloss', glow: 'sGlow' }[kind]]); }
    }
    const body = this.merge(lists.flat(), lists.map(l => l.reduce((a, gg) => a + gg.attributes.position.count, 0))); if (track) track.push(body);
    body.boundingSphere.radius += 0.6;
    const mesh = new THREE.SkinnedMesh(body, mats.length > 1 ? mats : mats[0]); mesh.add(scaleRoot); g.add(mesh);
    mesh.updateMatrixWorld(true); mesh.bind(new THREE.Skeleton(bones)); j.mesh = mesh;
    // a soft contact shadow
    const sh = new THREE.Mesh(M.shadowGeo, M.shadow); sh.scale.set(0.9 * Wd, 1, 0.75); sh.position.y = 0.012; g.add(sh); j.shadow = sh;
    const P = { g, j, sp, pose: opts.pose || 'stand', ph: opts.phase == null ? Math.random() * 100 : opts.phase, t: 0, look: 0, lookT: 0, prop: null, glow: null, glowCol: 0 };
    if (opts.prop) this.prop(P, opts.prop, track);
    this.apply(P, 0);
    return P;
  },
  // ---- things in hand
  prop(P, kind, track) {
    const M = this.materials(track), hand = P.j.elR, add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(this.paint(geo, () => '#ffffff'), mat); m.position.set(x, y, z); hand.add(m); if (track) track.push(m.geometry); return m; };
    if (kind === 'phone') { const ph = new THREE.Mesh(this.paint(new THREE.BoxGeometry(0.075, 0.14, 0.01), () => '#101114'), M.gloss); ph.position.set(0, -0.31, 0.04); ph.rotation.x = -0.3; hand.add(ph); if (track) track.push(ph.geometry); const sc = new THREE.Mesh(this.paint(new THREE.PlaneGeometry(0.066, 0.124), () => '#a8d4ff'), M.glow); sc.position.set(0, 0, 0.0055); ph.add(sc); if (track) track.push(sc.geometry); P.glow = sc; P.prop = ph; }
    if (kind === 'cig') { const cg = add(new THREE.CylinderGeometry(0.004, 0.004, 0.06, 5), M.matte, 0.0, -0.33, 0.05); cg.rotation.x = 1.3; const e = new THREE.Mesh(this.paint(new THREE.SphereGeometry(0.006, 5, 4), () => '#ff6a20'), M.glow); e.position.y = 0.03; cg.add(e); if (track) track.push(e.geometry); P.glow = e; P.prop = cg; }
    if (kind === 'can') { P.prop = add(new THREE.CylinderGeometry(0.026, 0.026, 0.11, 10), M.gloss, 0, -0.32, 0.03); this.paint(P.prop.geometry, (x, y) => y > 0.035 ? '#c8c8c8' : '#b8442a'); }
    if (kind === 'flag') {
      const pole = add(new THREE.CylinderGeometry(0.008, 0.008, 0.62, 6), M.matte, 0, -0.3, 0.05); pole.rotation.x = Math.PI / 2; pole.position.z = 0.3;
      const cv = new THREE.PlaneGeometry(0.42, 0.3, 6, 4); const f = new THREE.Mesh(this.paint(cv, (x, y) => (Math.floor((x + 0.21) / 0.07) + Math.floor((y + 0.15) / 0.075)) % 2 ? '#f2f2ee' : '#101012'), new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.9 }));
      f.position.set(0, -0.12, 0.2); f.rotation.y = Math.PI / 2; pole.add(f); if (track) track.push(f.geometry, f.material); P.flag = f; P.prop = pole;
    }
    if (kind === 'camera') { P.prop = add(new THREE.BoxGeometry(0.13, 0.085, 0.07), M.matte, 0.02, -0.29, 0.06); this.paint(P.prop.geometry, () => '#141416'); const ln = new THREE.Mesh(this.paint(new THREE.CylinderGeometry(0.03, 0.03, 0.06, 10), () => '#0c0c0e'), M.gloss); ln.rotation.x = Math.PI / 2; ln.position.z = 0.06; P.prop.add(ln); if (track) track.push(ln.geometry); }
  },
  // ---- poses: angles in radians, x = forward bend (negative lifts an arm or leg forward), z = sideways (×side for the left arm)
  POSES: {
    stand: () => ({}),
    pockets: () => ({ shL: [0.18, 0, 0.16], shR: [0.18, 0, -0.16], elL: -0.55, elR: -0.55, elLy: 0.5, elRy: -0.5 }),
    crossed: () => ({ shL: [-0.55, 0.15, -0.28], shR: [-0.5, -0.15, 0.28], elL: -1.9, elR: -1.85, elLy: -0.9, elRy: 0.9 }),
    akimbo: () => ({ shL: [0.12, 0, 0.55], shR: [0.12, 0, -0.55], elL: -1.35, elR: -1.35, elLy: -1.35, elRy: 1.35 }),
    talk: (t) => ({ shR: [-0.45 - 0.12 * Math.sin(t * 2.1), 0, -0.12], elR: -1.25 - 0.35 * Math.max(0, Math.sin(t * 3.3)), shL: [0.18, 0, 0.16], elL: -0.55, elLy: 0.5, head: [0.05 * Math.sin(t * 2.6), 0, 0] }),
    smoke: (t) => { const k = smooth(0.15, 0.3, (t / 7) % 1) * (1 - smooth(0.42, 0.58, (t / 7) % 1)); return { shR: [lerp(-0.05, -0.45, k), 0, lerp(-0.12, 0.42, k)], elR: lerp(-0.85, -2.45, k), elRy: lerp(0, 0.4, k), shL: [0.18, 0, 0.16], elL: -0.55, elLy: 0.5, head: [lerp(0, -0.12, k), 0, 0], puff: k }; },
    phone: () => ({ shR: [-0.42, 0, 0.12], elR: -1.45, elRy: 0.25, shL: [-0.3, 0, -0.14], elL: -1.3, elLy: -0.35, head: [0.42, 0, 0], spine: [0.06, 0, 0] }),
    squat: (t) => ({ hipsY: 0.47, thL: [-1.62, 0, 0.14], knL: 2.05, thR: [-1.45, 0, -0.18], knR: 1.95, spine: [0.38, 0, 0], shL: [-0.7, 0, 0.1], elL: -0.9, shR: [-0.95 - 0.08 * Math.sin(t * 2), 0, -0.1], elR: -0.6, head: [0.18, 0, 0] }),
    lean: (t) => ({ spine: [0.62, 0, 0], hipsZ: -0.04, thL: [0.12, 0, 0.04], thR: [0.1, 0, -0.04], shL: [-1.15, 0, 0.18], elL: -0.35, shR: [-1.05 + 0.1 * Math.sin(t * 1.3), 0, -0.2], elR: -0.5, head: [0.25, 0, 0] }),
    sit: () => ({ hipsY: 0.5, thL: [-1.5, 0, 0.08], knL: 1.5, thR: [-1.5, 0, -0.08], knR: 1.5, spine: [-0.08, 0, 0], shL: [-0.5, 0, 0.12], elL: -0.9, shR: [-0.5, 0, -0.12], elR: -0.9 }),
    count: (t) => ({ shR: [-2.8, 0, -0.18], elR: -0.25, shL: [0.05, 0, 0.12], elL: -0.2 }), // starter: arm up for the countdown
    drop: () => ({ shR: [-1.45, 0, -0.95], elR: -0.1, shL: [0.05, 0, 0.12], elL: -0.2 }),
    flag: (t) => ({ shR: [-2.5, 0.2, -0.35], elR: -0.35, shL: [-2.5, -0.2, 0.35], elL: -0.35 }),
    wave: (t) => ({ shR: [-2.6, 0, -0.5 - 0.3 * Math.sin(t * 6)], elR: -0.5, shL: [0.05, 0, 0.12], elL: -0.2 }),
    cheer: (t) => ({ shR: [-2.75, 0, -0.35 - 0.12 * Math.sin(t * 7)], elR: -0.4, shL: [-2.75, 0, 0.35 + 0.12 * Math.sin(t * 7 + 1)], elL: -0.4 }),
    photo: (t) => ({ shR: [-1.1, 0, 0.32], elR: -1.95, elRy: 0.6, shL: [-1.0, 0, -0.32], elL: -2.0, elLy: -0.6, head: [0.0, 0, 0] })
  },
  // ---- animation
  apply(P, dt) {
    P.t += dt; const t = P.t + P.ph, j = P.j, po = (this.POSES[P.pose] || this.POSES.stand)(t), lv = gfxLv();
    const arm = (side, s) => { const a = po['sh' + side] || [0.02, 0, s * 0.08]; j['sh' + side].rotation.set(a[0], a[1], a[2]); j['el' + side].rotation.set(po['el' + side] == null ? -0.12 : po['el' + side], po['el' + side + 'y'] || 0, 0); };
    arm('L', 1); arm('R', -1);
    const sway = Math.sin(t * 0.55) * 0.02, breathe = Math.sin(t * 1.7);
    j.hips.position.y = po.hipsY == null ? 0.93 - Math.abs(sway) * 0.15 : po.hipsY; j.hips.rotation.set(0, 0, (po.hipsZ || 0) + (po.hipsY == null ? sway : 0));
    const leg = (side, s) => { const a = po['th' + side] || [0, 0, -sway * 0.9 + s * 0.035]; j['th' + side].rotation.set(a[0], a[1], a[2]); j['kn' + side].rotation.set(po['kn' + side] || 0.03, 0, 0); };
    leg('L', 1); leg('R', -1);
    const sp = po.spine || [0, 0, 0]; j.spine.rotation.set(sp[0] - breathe * 0.008, sp[1], sp[2] - sway * 0.8); j.spine.scale.set(1, 1, 1 + breathe * 0.012);
    // the head wanders: a new place to look every few seconds
    P.lookT -= dt; if (P.lookT <= 0) { P.lookT = 2.5 + Math.random() * 4; P.lookTo = (Math.random() - 0.5) * 1.1; }
    P.look += ((P.lookTo || 0) - P.look) * Math.min(1, dt * 1.6);
    const hd = po.head || [0, 0, 0]; j.head.rotation.set(hd[0] + Math.sin(t * 0.9) * 0.02, hd[1] + P.look * (P.pose === 'phone' || P.pose === 'lean' ? 0.25 : 1), hd[2]);
    if (P.glow && P.prop && P.pose === 'smoke') { const k = po.puff || 0; P.glow.scale.setScalar(1 + k * 0.8); }
    if (P.flag) P.flag.rotation.x = Math.sin(t * 5) * 0.25;
  },
  // put a person into a walk-around scene: animated when there is budget for it, frozen otherwise
  place(W, spec, x, z, ry, pose, o) {
    o = o || {}; const P = this.build(spec, { track: W.track, pose, prop: o.prop, phase: o.phase });
    P.g.position.set(x, o.y || 0, z); P.g.rotation.y = ry;
    if (o.still) { this.apply(P, 0); W.scene.add(this.bake(P, W.track)); }
    else { W.scene.add(P.g); W.tickers.push((dt) => this.apply(P, dt)); }
    if (o.collide !== false) W.collide(x - 0.25, x + 0.25, z - 0.25, z + 0.25);
    return P;
  },
  // freeze a person into one mesh per material: for crowds that only need to stand there
  bake(P, track) {
    const g = P.g, M = this.materials(track); g.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(g.matrixWorld).invert(), byMat = new Map(), m = new THREE.Matrix4();
    // the skinned body: move each vertex by its bone, the same sum the GPU would do
    const mesh = P.j.mesh, sk = mesh.skeleton, geo0 = mesh.geometry, bm = sk.bones.map((b, i) => new THREE.Matrix4().multiplyMatrices(inv, b.matrixWorld).multiply(sk.boneInverses[i]));
    const plain = { [M.sMatte.uuid]: M.matte, [M.sGloss.uuid]: M.gloss, [M.sGlow.uuid]: M.glow }, mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const groups = geo0.groups.length ? geo0.groups : [{ start: 0, count: geo0.attributes.position.count, materialIndex: 0 }];
    const p0 = geo0.attributes.position, n0 = geo0.attributes.normal, c0 = geo0.attributes.color, si = geo0.attributes.skinIndex, v = new THREE.Vector3(), nm = new THREE.Matrix3();
    for (const gr of groups) {
      const pos = new Float32Array(gr.count * 3), nor = new Float32Array(gr.count * 3), col = new Float32Array(gr.count * 3);
      for (let k = 0; k < gr.count; k++) { const i = gr.start + k, b = bm[si.getX(i)]; v.fromBufferAttribute(p0, i).applyMatrix4(b); pos.set([v.x, v.y, v.z], k * 3); nm.getNormalMatrix(b); v.fromBufferAttribute(n0, i).applyMatrix3(nm).normalize(); nor.set([v.x, v.y, v.z], k * 3); col.set([c0.getX(i), c0.getY(i), c0.getZ(i)], k * 3); }
      const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); gg.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); gg.setAttribute('color', new THREE.BufferAttribute(col, 3));
      const mat = plain[mats[gr.materialIndex].uuid] || M.matte; if (!byMat.has(mat)) byMat.set(mat, []); byMat.get(mat).push(gg);
    }
    // props held in a hand are ordinary meshes
    g.traverse(o => { if (!o.isMesh || o.isSkinnedMesh || o === P.j.shadow) return; m.multiplyMatrices(inv, o.matrixWorld); const gg = o.geometry.clone().applyMatrix4(m); if (!byMat.has(o.material)) byMat.set(o.material, []); byMat.get(o.material).push(gg); });
    const out = new THREE.Group(); out.position.copy(g.position); out.rotation.copy(g.rotation);
    for (const [mat, list] of byMat) { const geo = this.merge(list); if (track) track.push(geo); out.add(new THREE.Mesh(geo, mat)); }
    const sh = new THREE.Mesh(P.j.shadow.geometry, P.j.shadow.material); sh.scale.copy(P.j.shadow.scale); sh.position.copy(P.j.shadow.position); out.add(sh);
    return out;
  }
};
