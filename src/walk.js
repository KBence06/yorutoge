// ===================== WALK: first-person 3D scenes (the garage from the inside, the parking-area meet) =====================
// One small engine for both: a camera you walk around with, box colliders, hotspots you can use, and scripted camera moves.
const Walk = {
  active: false,
  open(def) {
    if (this.active) this.close(true);
    if (typeof Race !== 'undefined' && Race.active) return false;
    const root = $('#walk'); root.hidden = false; root.replaceChildren(); root.className = S.settings.gfx === 'low' ? 'lowres' : '';
    const set = S.settings; let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: set.gfx !== 'low', powerPreference: 'high-performance' }); }
    catch (e) { root.hidden = true; toast('Nem indult el a 3D-s nézet ezen az eszközön.', 'bad'); return false; }
    this.def = def; this.active = true; this.renderer = renderer;
    renderer.setPixelRatio(set.gfx === 'low' ? 0.6 : Math.min(set.gfx === 'mid' ? 1.5 : 2, window.devicePixelRatio || 1));
    renderer.domElement.className = 'three'; root.append(renderer.domElement);
    renderer.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); toast('Elfogyott a grafikus memória, visszaléptem.', 'bad'); this.close(); }, false);
    this.scene = new THREE.Scene(); this.cam = new THREE.PerspectiveCamera(68, 1, 0.06, 600); this.cam.rotation.order = 'YXZ';
    this.track = []; this.cols = []; this.spots = []; this.tickers = []; this.cine = null; this.seat = null; this.t = 0; this.spot = null;
    this.pos = new THREE.Vector3(def.spawn.x, 1.62, def.spawn.z); this.yaw = def.spawn.yaw || 0; this.pitch = def.spawn.pitch || 0; this.bounds = def.bounds;
    this.inp = { mx: 0, my: 0, keys: {} };
    try { def.build(this); } catch (e) { console.error(e); this.close(); toast('Nem sikerült felépíteni a 3D-s nézetet.', 'bad'); return false; }
    this.buildHud();
    this.resize = () => { const w = root.clientWidth, h = root.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); this.cam.aspect = w / h; this.cam.fov = w < h ? 82 : 68; this.cam.updateProjectionMatrix(); };
    this.ro = new ResizeObserver(this.resize); this.ro.observe(root); this.resize();
    this.last = performance.now(); this.pf = { ema: 16, cool: 0, pr: renderer.getPixelRatio() };
    const loop = (t) => { if (!this.active) return; this.raf = requestAnimationFrame(loop); try { this.frame(t); } catch (e) { console.error(e); if (++this.errN > 30) { this.close(); toast('Hiba történt a 3D-s nézetben.', 'bad'); } } };
    this.errN = 0; this.raf = requestAnimationFrame(loop);
    if (typeof Garage !== 'undefined') Garage.visible = false;
    return true;
  },
  glowTex() {
    if (this._glow) return this._glow;
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); this._glow = new THREE.CanvasTexture(cv); this.track.push(this._glow); return this._glow;
  },
  // ---- scene helpers
  mesh(geo, mat, x, y, z) { this.track.push(geo); if (!this.track.includes(mat)) this.track.push(mat); const m = new THREE.Mesh(geo, mat); if (x !== undefined) m.position.set(x, y, z); this.scene.add(m); return m; },
  canvasTex(w, h, draw, repeat) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.anisotropy = 4; if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); } this.track.push(t); return t; },
  // a flat picture standing in the world (a poster, a cut-out prop). ry: which way it faces
  board(tex, w, h, x, y, z, ry, o) { o = o || {}; const m = new THREE.MeshBasicMaterial({ map: tex, transparent: !!o.alpha, alphaTest: o.alpha ? 0.05 : 0, color: o.color || 0xffffff, blending: o.add ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: !o.add, side: o.both ? THREE.DoubleSide : THREE.FrontSide }); const me = this.mesh(new THREE.PlaneGeometry(w, h), m, x, y, z); me.rotation.y = ry || 0; return me; },
  collide(x0, x1, z0, z1) { this.cols.push({ x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1) }); },
  hotspot(x, y, z, r, label, act, show) { const s = { p: new THREE.Vector3(x, y, z), r, label, act, show }; this.spots.push(s); return s; },
  car(c, x, z, ry, opts) {
    const o = Object.assign({ track: this.track, glow: this.glowTex(), renderer: this.renderer, cabin: S.settings.gfx !== 'low', calm: true }, opts || {});
    const m = CarModel.build(c.model, c.paint, c.vis || carVisual(c), o); m.g.position.set(x, 0, z); m.g.rotation.y = ry || 0; this.scene.add(m.g); return m;
  },
  // ---- HUD and input
  buildHud() {
    const root = $('#walk'), def = this.def;
    this.hTitle = el('div', { class: 'w-title' }, el('b', null, def.title || ''), el('span', { id: 'wSub' }, def.sub || ''));
    this.hBtns = el('div', { class: 'w-btns' });
    this.hAct = el('button', { class: 'btn primary w-act', hidden: true, onclick: () => { if (this.spot && !this.cine) this.spot.act(this.spot); } });
    this.hStick = el('div', { class: 'w-stick', hidden: true }, el('i'));
    this.hHint = el('div', { class: 'w-hint' }, matchMedia('(pointer:coarse)').matches ? 'Bal oldalon húzva sétálsz, jobb oldalon húzva körülnézel.' : 'WASD vagy nyilak: séta · egérrel húzva: körülnézés · E: használat');
    this.hSkip = el('button', { class: 'btn ghost small w-skip', hidden: true, onclick: () => this.skipCine() }, 'Kihagyás');
    this.hCap = el('div', { class: 'w-cap', hidden: true });
    root.append(el('div', { class: 'w-top' }, this.hTitle, this.hBtns), this.hAct, this.hStick, this.hHint, this.hSkip, this.hCap);
    this.setButtons(def.buttons ? def.buttons(this) : []);
    setTimeout(() => this.hHint && this.hHint.classList.add('out'), 5200);
    let mid = null, lid = null, m0 = null, l0 = null;
    const cv = this.renderer.domElement, knob = this.hStick.querySelector('i');
    cv.addEventListener('pointerdown', (e) => {
      e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (er) {}
      const touch = e.pointerType === 'touch';
      if (touch && e.clientX < root.clientWidth * 0.42 && mid === null) { mid = e.pointerId; m0 = [e.clientX, e.clientY]; this.hStick.hidden = false; this.hStick.style.left = e.clientX + 'px'; this.hStick.style.top = e.clientY + 'px'; }
      else if (lid === null) { lid = e.pointerId; l0 = [e.clientX, e.clientY]; }
    });
    cv.addEventListener('pointermove', (e) => {
      if (e.pointerId === mid) { const dx = clamp((e.clientX - m0[0]) / 56, -1, 1), dy = clamp((e.clientY - m0[1]) / 56, -1, 1); this.inp.mx = dx; this.inp.my = -dy; knob.style.transform = `translate(${dx * 30}px,${dy * 30}px)`; }
      else if (e.pointerId === lid) { const k = 0.0052 * (S.settings.sens || 1); this.yaw -= (e.clientX - l0[0]) * k; this.pitch = clamp(this.pitch - (e.clientY - l0[1]) * k, -1.2, 1.2); l0 = [e.clientX, e.clientY]; }
    });
    const up = (e) => { if (e.pointerId === mid) { mid = null; this.inp.mx = this.inp.my = 0; this.hStick.hidden = true; knob.style.transform = ''; } if (e.pointerId === lid) lid = null; };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    this.onKey = (e) => {
      if (!$('#modal').hidden) return;
      const down = e.type === 'keydown', k = e.key.toLowerCase(); this.inp.keys[k] = down;
      if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' '].includes(k)) e.preventDefault();
      if (down && (k === 'e' || k === 'enter') && this.spot && !this.cine) this.spot.act(this.spot);
      if (down && k === 'escape') { if (this.cine) this.skipCine(); else if (this.seat && this.seat.leave) this.seat.leave(); else this.close(); }
    };
    window.addEventListener('keydown', this.onKey); window.addEventListener('keyup', this.onKey);
  },
  setButtons(list) { this.hBtns.replaceChildren(...list.filter(Boolean).map(b => el('button', { class: 'btn small ' + (b.cls || ''), onclick: b.act }, b.label)), el('button', { class: 'btn small ghost', onclick: () => { if (this.seat && this.seat.leave) this.seat.leave(); else this.close(); } }, 'Vissza')); },
  caption(txt) { this.hCap.hidden = !txt; this.hCap.textContent = txt || ''; },
  // ---- scripted camera: steps is a list of { dur, from: [pos, look], to: [pos, look], run(k, dt), start(), end(), cap }
  play(steps, done) {
    this.cine = { steps, i: -1, t: 0, done, fromP: this.cam.position.clone(), look: new THREE.Vector3() };
    this.hSkip.hidden = false; this.hAct.hidden = true; this.hBtns.hidden = true; $('#walk').classList.add('cine');
    this.nextStep();
  },
  nextStep() {
    const C = this.cine; if (!C) return;
    if (C.i >= 0 && C.steps[C.i].end) C.steps[C.i].end();
    C.i++; C.t = 0;
    if (C.i >= C.steps.length) { this.endCine(); return; }
    const st = C.steps[C.i]; C.p0 = this.cam.position.clone(); C.l0 = C.look.clone();
    if (st.start) st.start(); this.caption(st.cap || '');
  },
  endCine() { const C = this.cine; this.cine = null; this.hSkip.hidden = true; this.hBtns.hidden = false; $('#walk').classList.remove('cine'); this.caption(''); if (C && C.done) C.done(); },
  skipCine() { const C = this.cine; if (!C) return; for (let i = Math.max(0, C.i); i < C.steps.length; i++) { const st = C.steps[i]; if (i > C.i && st.start) st.start(); if (st.run) st.run(1, 0); if (st.end) st.end(); } C.i = C.steps.length; this.endCine(); },
  frame(now) {
    const dt = clamp((now - this.last) / 1000, 0, 0.05); this.last = now; this.t += dt;
    // keep it smooth on a slow phone by lowering the resolution
    const pf = this.pf; pf.ema += (dt * 1000 - pf.ema) * 0.08; pf.cool -= dt;
    const pr = this.renderer.getPixelRatio(), lo = Math.max(0.6, pf.pr * 0.6); // the first seconds are spent compiling shaders: do not judge by them
    if (this.t > 3 && pf.cool <= 0 && pf.ema > 45 && pr > lo) { this.renderer.setPixelRatio(Math.max(lo, pr * 0.85)); this.resize(); pf.cool = 2; }
    else if (this.t > 3 && pf.cool <= 0 && pf.ema < 22 && pr < pf.pr) { this.renderer.setPixelRatio(Math.min(pf.pr, pr * 1.1)); this.resize(); pf.cool = 2; }
    const cam = this.cam, C = this.cine;
    if (C) {
      const st = C.steps[C.i]; C.t += dt; const k = clamp(C.t / st.dur, 0, 1), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      if (st.to) { cam.position.lerpVectors(st.from ? st.from[0] : C.p0, st.to[0], e); C.look.lerpVectors(st.from ? st.from[1] : C.l0, st.to[1], e); cam.lookAt(C.look); }
      if (st.run) st.run(k, dt);
      if (k >= 1) this.nextStep();
      if (!this.cine) { // hand the camera back where the scripted move left it
        const d = new THREE.Vector3(); cam.getWorldDirection(d); this.yaw = Math.atan2(d.x, d.z); this.pitch = Math.asin(clamp(d.y, -1, 1));
        if (!this.seat) { this.pos.x = clamp(cam.position.x, this.bounds.x0, this.bounds.x1); this.pos.z = clamp(cam.position.z, this.bounds.z0, this.bounds.z1); this.pushOut(); }
      }
    } else {
      const k = this.inp.keys, f = (k['w'] || k['arrowup'] ? 1 : 0) - (k['s'] || k['arrowdown'] ? 1 : 0) + this.inp.my, sd = (k['d'] ? 1 : 0) - (k['a'] ? 1 : 0) + this.inp.mx;
      const turn = (k['arrowleft'] ? 1 : 0) - (k['arrowright'] ? 1 : 0); this.yaw += turn * dt * 1.9;
      if (this.seat) { cam.position.copy(this.seat.p); this.yaw = clamp(this.yaw, this.seat.yaw - 1.9, this.seat.yaw + 1.9); }
      else {
        const sp = (k['shift'] ? 4.6 : 2.7) * dt, sy = Math.sin(this.yaw), cy = Math.cos(this.yaw), n = Math.hypot(f, sd), q = n > 1 ? 1 / n : 1;
        this.pos.x += (sy * f - cy * sd) * sp * q; this.pos.z += (cy * f + sy * sd) * sp * q;
        this.pushOut();
        const bob = n > 0.1 ? Math.sin(this.t * 9) * 0.018 : 0; cam.position.set(this.pos.x, this.pos.y + bob, this.pos.z);
      }
      cam.rotation.set(this.pitch, this.yaw + Math.PI, 0);
      // which hotspot are we looking at
      let best = null, bs = 0.5; const sy = Math.sin(this.yaw), cy = Math.cos(this.yaw);
      for (const s of this.spots) {
        if (s.show && !s.show()) continue;
        const dx = s.p.x - cam.position.x, dz = s.p.z - cam.position.z, d = Math.hypot(dx, dz); if (d > s.r) continue;
        const dot = d < 0.5 ? 1 : (dx * sy + dz * cy) / d; if (dot < 0.45) continue;
        const score = dot - d * 0.08; if (score > bs) { bs = score; best = s; }
      }
      if (best !== this.spot || (best && best.dyn)) { this.spot = best; this.hAct.hidden = !best; if (best) this.hAct.textContent = typeof best.label === 'function' ? best.label() : best.label; }
    }
    for (const fn of this.tickers) fn(dt, this.t);
    this.renderer.render(this.scene, cam);
  },
  pushOut() {
    const p = this.pos, r = 0.32, b = this.bounds;
    for (const c of this.cols) {
      if (p.x > c.x0 - r && p.x < c.x1 + r && p.z > c.z0 - r && p.z < c.z1 + r) {
        const dl = p.x - (c.x0 - r), dr = (c.x1 + r) - p.x, df = p.z - (c.z0 - r), db = (c.z1 + r) - p.z, m = Math.min(dl, dr, df, db);
        if (m === dl) p.x = c.x0 - r; else if (m === dr) p.x = c.x1 + r; else if (m === df) p.z = c.z0 - r; else p.z = c.z1 + r;
      }
    }
    p.x = clamp(p.x, b.x0 + r, b.x1 - r); p.z = clamp(p.z, b.z0 + r, b.z1 - r);
  },
  close(silent) {
    if (!this.active) return;
    this.active = false; cancelAnimationFrame(this.raf);
    const def = this.def;
    if (this.onKey) { window.removeEventListener('keydown', this.onKey); window.removeEventListener('keyup', this.onKey); this.onKey = null; }
    if (this.ro) this.ro.disconnect();
    if (def && def.cleanup) try { def.cleanup(this); } catch (e) {}
    for (const d of this.track || []) try { d.dispose(); } catch (e) {}
    if (this.renderer) { this.renderer.dispose(); this.renderer.forceContextLoss && this.renderer.forceContextLoss(); }
    CarModel.reset();
    this.renderer = null; this.scene = null; this.track = null; this._glow = null; this.cine = null; this.seat = null; this.spots = []; this.tickers = []; this.hHint = null;
    const root = $('#walk'); root.replaceChildren(); root.hidden = true;
    if (typeof Garage !== 'undefined') { Garage.visible = UI.scr === 'garage'; Garage.dirty = true; }
    if (!silent) { UI.render(); if (def && def.onClose) def.onClose(); }
  }
};
