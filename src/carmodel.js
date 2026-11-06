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
  reset() { this.envMap = null; this.pmremEnv = null; this.wheelTex = {}; this.plateTex = {}; this.lensTex = {}; },

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
  bodyGeometry(sh, vis, flare, S2) {
    const L = sh.L, N = 76, sections = [];
    for (let i = 0; i <= N; i++) { const s = -1 + 2 * i / N; const z = clamp(Math.sin(s * Math.PI / 2) * L / 2, -L / 2 + 0.002, L / 2 - 0.002); sections.push(S2.ring(z)); }
    const H = 17, R = H + 15, pos = new Float32Array((N + 1) * R * 3);
    const ringIdx = (k) => k <= 16 ? k : 32 - k; // full ring index -> half index
    sections.forEach((sec, i) => { for (let k = 0; k < R; k++) { const h = ringIdx(k), p = sec.pts[h], sx = k <= 16 ? 1 : -1, o = (i * R + k) * 3; pos[o] = sx * p[0]; pos[o + 1] = p[1]; pos[o + 2] = sec.z; } });
    const glassPolys = sh.glass, inPoly = (poly, z, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > y) !== (b[1] > y) && z < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
    const gz = glassPolys.map(p => [Math.min(...p.map(q => q[0])), Math.max(...p.map(q => q[0]))]);
    const cls = (j, i) => { // material for half-segment j between sections i and i+1
      if (j <= 4) return 2;
      if (j <= 10) return 0;
      const a = sections[i], b = sections[i + 1], z = (a.z + b.z) / 2, y = (a.pts[j][1] + a.pts[j + 1][1] + b.pts[j][1] + b.pts[j + 1][1]) / 4, gg = (a.g + b.g) / 2;
      if (gg > 0.5) {
        if (j <= 13) {
          if (glassPolys.some(p => inPoly(p, z, y))) return 1;
          if (gz.length >= 2 && z > gz[0][1] && z < gz[gz.length - 1][0] && y > sh.beltY + 0.03) return 4; // blacked-out B-pillar
          return 0;
        }
        const slope = Math.abs(b.yt - a.yt) / Math.max(1e-4, Math.abs(b.z - a.z));
        return slope > 0.42 ? 1 : 0;
      }
      if (vis.hood === 'carbon' && z > sh.cowlZ - 0.02 && j >= 11) return 3;
      return 0;
    };
    const idx = [[], [], [], [], []];
    for (let i = 0; i < N; i++) for (let k = 0; k < R; k++) {
      const k2 = (k + 1) % R, j = k < 16 ? k : 31 - k;
      const a = i * R + k, b = i * R + k2, c = (i + 1) * R + k, d = (i + 1) * R + k2, m = cls(j, i);
      idx[m].push(a, b, c, b, d, c);
    }
    const geo = new THREE.BufferGeometry(), all = [];
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    let start = 0; idx.forEach((list, m) => { if (list.length) { geo.addGroup(start, list.length, m); all.push(...list); start += list.length; } });
    geo.setIndex(all); geo.computeVertexNormals();
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
    const finish = vis.finish || 'gloss', flare = Math.max(D.flare || 0, vis.flares ? 0.07 : 0);
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
    const bump = D.bumpers === 'dark' ? new THREE.Vector3(L / 2 - 0.3, 0.44 * sh.H - sh.drop, 0.485 * sh.H - sh.drop) : new THREE.Vector3(99, -9, -9);
    if (!ghost) shellM.onBeforeCompile = (shd) => {
      shd.uniforms.uCol2 = { value: col2 }; shd.uniforms.uMode = { value: mode }; shd.uniforms.uBelt = { value: beltY }; shd.uniforms.uBump = { value: bump };
      shd.uniforms.uSeams = { value: new THREE.Vector4(seams[0], seams[1], seams[2], seams[3]) };
      shd.vertexShader = 'varying vec3 vLP;\nvarying vec3 vLN;\n' + shd.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vLP = position; vLN = normal;');
      shd.fragmentShader = 'uniform vec3 uCol2;\nuniform float uMode;\nuniform float uBelt;\nuniform vec3 uBump;\nuniform vec4 uSeams;\nvarying vec3 vLP;\nvarying vec3 vLN;\n' + shd.fragmentShader.replace('#include <color_fragment>', [
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
        '  float trim = side * step(uBelt - 0.012, vLP.y) * step(vLP.y, uBelt + 0.02);',
        '  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.025), max(seam * 0.85, trim * 0.92));',
        '  diffuseColor.rgb *= mix(0.55, 1.0, smoothstep(0.12, 0.4, vLP.y)); }'].join('\n'));
    };
    const glassM = mk(cheap ? new THREE.MeshPhongMaterial({ color: vis.tint ? 0x030406 : 0x0a0d14, specular: 0xaabbcc, shininess: 140, envMap: env, combine: THREE.AddOperation, reflectivity: 0.55 })
      : new THREE.MeshStandardMaterial({ color: vis.tint ? 0x020304 : 0x080b12, roughness: 0.04, metalness: 0.15, envMap: env, envMapIntensity: vis.tint ? 1.4 : 1.8 }));
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
    const geo = this.bodyGeometry(sh, vis, flare, S2); track.push(geo);
    body.add(new THREE.Mesh(geo, mats));
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
    const lamp = (w, h, mat, x, y, front) => { // follows the curve of the nose/tail across its width
      const xi = x - Math.sign(x || 1) * w / 2, xo = x + Math.sign(x || 1) * w / 2;
      const zi = front ? frontX(xi, y) : rearX(xi, y), zo = front ? frontX(xo, y) : rearX(xo, y);
      const zc = (zi + zo) / 2, yaw = Math.atan2(zi - zo, Math.abs(xo - xi)) * Math.sign(x || 1) * (front ? 1 : -1);
      const grp = new THREE.Group(); grp.position.set(x, y, zc); grp.rotation.y = front ? yaw : Math.PI + yaw; body.add(grp);
      const hb = new THREE.Mesh(new THREE.BoxGeometry(w + 0.02, h + 0.02, 0.06), trimM); hb.position.z = -0.022; grp.add(hb); track.push(hb.geometry);
      const lens = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); lens.position.z = 0.009; grp.add(lens); track.push(lens.geometry);
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
      const hy = shapeTopAt(sh, fz - 0.08) - 0.085;
      for (const s of [-1, 1]) {
        const l = lamp(0.38, 0.105, headM, s * W * 0.3, hy, true); lightGlows.push([s * W * 0.3, hy, l.z + 0.02]);
        lamp(0.1, 0.05, amberM, s * W * 0.43, hy - 0.11, true);
      }
    }
    // side markers on the front fenders
    for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.012, 0.03, 0.07), amberM, s * (sideX(0.5, zf + ra + 0.12) + 0.004), 0.5 - sh.drop, zf + ra + 0.12);
    // grille and plates
    const gy = Math.max(0.28, shapeTopAt(sh, fz - 0.1) - 0.2);
    box(W * 0.4, 0.09, 0.04, trimM, 0, gy, frontX(W * 0.2, gy) - 0.012);
    for (let i = 0; i < 3; i++) box(W * 0.38, 0.008, 0.042, chromeM, 0, gy - 0.03 + i * 0.03, frontX(W * 0.2, gy) - 0.008);
    const plate = mk(new THREE.MeshBasicMaterial({ map: this.plateTexture(opts.plate ? opts.plate[0] : '黒沢 330', opts.plate ? opts.plate[1] : '12-34', track), color: 0xbbbbbb }));
    const ply = Math.max(0.26, gy - 0.13);
    add(new THREE.PlaneGeometry(0.33, 0.165), plate, 0, ply, frontX(0.17, ply) + 0.006);
    const rply = Math.max(0.3, shapeTopAt(sh, rz + 0.05) - 0.36);
    add(new THREE.PlaneGeometry(0.33, 0.165), plate, 0, rply, rearX(0.17, rply) - 0.006, 0, Math.PI, 0);
    // taillights
    const tails = [], tailGlows = [];
    const ty = shapeTopAt(sh, rz + 0.04) - 0.11;
    const tailBox = (w, h, x, y) => { const l = lamp(w, h, tailM, x, y, false); tails.push(l.lens); tailGlows.push([x, y, l.z - 0.02]); };
    if (D.tail === 'band') { const bz = rearX(W * 0.45, ty); box(W * 0.6, 0.1, 0.03, trimM, 0, ty, bz + 0.02); for (const s of [-1, 1]) tailBox(W * 0.28, 0.1, s * W * 0.3, ty); }
    else if (D.tail === 'corner') for (const s of [-1, 1]) tailBox(0.22, 0.16, s * W * 0.36, ty - 0.03);
    else if (D.tail === 'round') for (const s of [-1, 1]) { tailBox(0.19, 0.15, s * W * 0.33, ty - 0.02); tailBox(0.13, 0.12, s * W * 0.19, ty - 0.02); }
    else for (const s of [-1, 1]) { tailBox(0.13, 0.13, s * W * 0.37, ty); tailBox(0.13, 0.13, s * W * 0.22, ty); }
    // mirrors on a stem, door handles, wipers
    const gF = sh.glass.length ? Math.max(...sh.glass[sh.glass.length - 1].map(p => p[0])) : sh.cowlZ;
    for (const s of [-1, 1]) {
      const mx = sideX(belt + 0.02, gF - 0.06);
      box(0.08, 0.025, 0.05, trimM, s * (mx + 0.03), belt + 0.035, gF - 0.06);
      const cap = box(0.07, 0.085, 0.13, paintM, s * (mx + 0.1), belt + 0.075, gF - 0.08); cap.rotation.y = s * 0.12;
      box(0.004, 0.065, 0.1, glassM, s * (mx + 0.137), belt + 0.075, gF - 0.08);
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
    if (twin) { tip(W * 0.3); tip(-W * 0.3); } else tip(W * 0.28);
    // spoilers
    const wing = vis.wing || (D.spoiler === 'wing' ? 'gt' : D.spoiler === 'trunk' ? 'lip' : null);
    if (D.spoiler === 'roof' && !vis.wing) {
      const rp = sh.up.find(p => p[1] > roof - 0.04); box(W * 0.72, 0.035, 0.26, paintM, 0, rp[1] + 0.012, rp[0] - 0.06);
    } else if (wing === 'gt') {
      const wz = rz + 0.28, base = shapeTopAt(sh, wz), wy = base + (vis.wing ? 0.24 : 0.16);
      const blade = box(W * 0.92, 0.03, 0.3, vis.wing ? trimM : paintM, 0, wy, wz); blade.rotation.x = 0.06;
      for (const s of [-1, 1]) { box(0.035, wy - base, 0.09, vis.wing ? trimM : paintM, s * W * 0.32, (wy + base) / 2, wz); box(0.014, 0.12, 0.34, trimM, s * W * 0.465, wy + 0.02, wz); }
    } else if (wing === 'duck') {
      const wz = rz + 0.16, wy = shapeTopAt(sh, wz) + 0.04; const dk = box(W * 0.86, 0.035, 0.28, paintM, 0, wy, wz); dk.rotation.x = -0.38;
    } else if (wing === 'lip') {
      const wz = rz + 0.12, wy = shapeTopAt(sh, wz) + 0.025; const lip = box(W * 0.82, 0.03, 0.2, paintM, 0, wy, wz); lip.rotation.x = -0.18;
    }
    if (D.scoop) box(0.36, 0.05, 0.3, paintM, 0, shapeTopAt(sh, sh.cowlZ + 0.45) + 0.02, sh.cowlZ + 0.45);
    if (vis.hood === 'vent') for (let i = 0; i < 4; i++) { const z = sh.cowlZ + 0.25 + i * 0.09; for (const sx of [-1, 1]) box(0.26, 0.014, 0.045, darkM, sx * 0.2, shapeTopAt(sh, z) + 0.004, z); }
    if (vis.fogs) for (const sx of [-1, 1]) { const fy = Math.max(0.27, S2.yFloor + 0.1); const l = lamp(0.14, 0.06, headM, sx * W * 0.3, fy, true); lightGlows.push([sx * W * 0.3, fy, l.z + 0.02]); }
    // tribal / kanji graphics on the doors
    if (!ghost && (vis.livery === 'tribal' || vis.livery === 'kanji')) {
      const z0 = zr + ra + 0.05, z1 = zf - ra - 0.05, y1 = belt - 0.07, y0 = 0.3 - sh.drop, gw = z1 - z0, gh = y1 - y0;
      const cv = document.createElement('canvas'); cv.width = 512; cv.height = Math.round(512 * gh / gw); const gg = cv.getContext('2d');
      drawLiveryGraphic(gg, vis.livery, vis.col2 || '#141418', 0, 0, cv.width, cv.height);
      const tex = new THREE.CanvasTexture(cv); track.push(tex);
      const lm = mk(new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: PB[1], metalness: 0, envMap: env, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
      const px = Math.max(sideX(y0, (z0 + z1) / 2), sideX((y0 + y1) / 2, (z0 + z1) / 2), sideX(y1, (z0 + z1) / 2), sideX((y0 + y1) / 2, z0), sideX((y0 + y1) / 2, z1)) + 0.006;
      for (const sx of [-1, 1]) {
        const pg = new THREE.PlaneGeometry(gw, gh); track.push(pg);
        if (sx > 0 && vis.livery === 'tribal') { const uv = pg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i)); }
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
    // ---- wheels: shaped tyre, deep rim with a polished lip, brake disc and caliper behind
    const wr = sh.wheels.r, rr = wr * 0.655, tw = 0.21, wheels = [];
    const prof = []; // tyre cross-section (radius, x)
    const tp = [[rr * 1.02, -tw / 2 + 0.01], [rr * 1.12, -tw / 2], [wr * 0.9, -tw / 2 - 0.004], [wr * 0.97, -tw / 2 + 0.012], [wr, -tw / 2 + 0.035], [wr, tw / 2 - 0.035], [wr * 0.97, tw / 2 - 0.012], [wr * 0.9, tw / 2 + 0.004], [rr * 1.12, tw / 2], [rr * 1.02, tw / 2 - 0.01]];
    for (const [r, x] of tp) prof.push(new THREE.Vector2(r, x));
    const tireG = new THREE.LatheGeometry(prof, cheap ? 14 : 24); tireG.rotateZ(-Math.PI / 2); track.push(tireG);
    const barrelG = new THREE.CylinderGeometry(rr, rr, tw - 0.03, cheap ? 12 : 20, 1, true); barrelG.rotateZ(Math.PI / 2); track.push(barrelG);
    const lipG = new THREE.TorusGeometry(rr * 0.985, 0.012, 6, cheap ? 14 : 24); lipG.rotateY(Math.PI / 2); track.push(lipG);
    const faceG = new THREE.CircleGeometry(rr * 0.97, cheap ? 14 : 24); track.push(faceG);
    const style = vis.wheel || 'stock', dish = style === 'dish' ? 0.045 : style === 'mesh' ? 0.02 : 0.012;
    const faceM = mk(std({ map: this.wheelTexture(style, track), color: 0xffffff, roughness: 0.35, metalness: style === 'white' ? 0.1 : 0.6, envMap: env, envMapIntensity: 0.8 }));
    const rimInM = mk(std({ color: 0x3a3c42, roughness: 0.5, metalness: 0.7, envMap: env, envMapIntensity: 0.5 }));
    const discG = new THREE.CylinderGeometry(rr * 0.82, rr * 0.82, 0.024, 20); discG.rotateZ(Math.PI / 2); track.push(discG);
    const discM = mk(std({ color: 0x6d7076, roughness: 0.42, metalness: 0.85, envMap: env, envMapIntensity: 0.5 }));
    const bbk = opts.bbk, calM = mk(std({ color: bbk ? 0xc3121f : 0x2b2d32, roughness: 0.45, metalness: 0.2 }));
    const calG = new THREE.BoxGeometry(0.05, rr * 0.55, rr * 0.3); track.push(calG);
    const wx = W / 2 - 0.1 + flare * 0.8;
    for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
      const wg = new THREE.Group();
      const tire = new THREE.Mesh(tireG, tireM); if (sx < 0) tire.rotation.y = Math.PI;
      const barrel = new THREE.Mesh(barrelG, rimInM);
      const lip = new THREE.Mesh(lipG, chromeM); lip.position.x = sx * (tw / 2 - 0.012);
      const face = new THREE.Mesh(faceG, faceM); face.rotation.y = sx > 0 ? Math.PI / 2 : -Math.PI / 2; face.position.x = sx * (tw / 2 - 0.012 - dish);
      const disc = new THREE.Mesh(discG, discM); disc.position.x = sx * (tw / 2 - 0.06 - dish);
      wg.add(tire, barrel, lip, face, disc);
      const spin = new THREE.Group(); spin.add(wg);
      const cal = new THREE.Mesh(calG, calM); cal.position.set(sx * (tw / 2 - 0.05 - dish), rr * 0.52, sz > 0 ? -rr * 0.25 : rr * 0.25); cal.rotation.x = sz > 0 ? 0.45 : -0.45; spin.add(cal);
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
    return { g, body, wheels, tail: tails, tailMat: tailM, tailOff, tailSprites, light, rot: 0, rw: wr, heads: lightGlows, lightColor, police };
  }
};
