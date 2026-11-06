// ===================== AUDIO (all synthesized) =====================
const Audio2 = {
  ctx: null, master: null, eng: null, noiseBuf: null, ratchetT: 0,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      this.ctx = new AC();
      const comp = this.ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
      this.master = this.ctx.createGain(); this.master.gain.value = S.settings.vol;
      this.master.connect(comp); comp.connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 2, buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noiseBuf = buf;
    } catch (e) { this.ctx = null; }
  },
  noise() { const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true; return s; },
  startEngine(spec) {
    if (!this.ctx) return; this.stopEngine();
    const C = this.ctx, E = spec.E;
    const g = C.createGain(); g.gain.value = 0; g.connect(this.master);
    const lp = C.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 2.5; lp.connect(g);
    const shaper = C.createWaveShaper(); const cur = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; cur[i] = Math.tanh(x * 2.6); } shaper.curve = cur; shaper.connect(lp);
    const mk = (type, gain) => { const o = C.createOscillator(); o.type = type; const og = C.createGain(); og.gain.value = gain; o.connect(og); og.connect(shaper); o.start(); return o; };
    const o1 = mk('sawtooth', 0.55), o2 = mk('square', E.rotary ? 0.35 : 0.22), o3 = mk('sawtooth', E.cyl === 6 ? 0.28 : 0.14);
    o3.detune.value = 9;
    const n = this.noise(); const bp = C.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2; const ng = C.createGain(); ng.gain.value = 0;
    n.connect(bp); bp.connect(ng); ng.connect(this.master); n.start();
    const wh = C.createOscillator(); wh.type = 'sine'; const whg = C.createGain(); whg.gain.value = 0; wh.connect(whg); whg.connect(this.master); wh.start();
    const tn = this.noise(); const tbp = C.createBiquadFilter(); tbp.type = 'bandpass'; tbp.frequency.value = 950; tbp.Q.value = 4; const tg = C.createGain(); tg.gain.value = 0;
    tn.connect(tbp); tbp.connect(tg); tg.connect(this.master); tn.start();
    const wn = this.noise(); const wlp = C.createBiquadFilter(); wlp.type = 'lowpass'; wlp.frequency.value = 420; const wg = C.createGain(); wg.gain.value = 0;
    wn.connect(wlp); wlp.connect(wg); wg.connect(this.master); wn.start();
    this.eng = { g, lp, o1, o2, o3, ng, bp, wh, whg, tg, wg, nodes: [o1, o2, o3, n, wh, tn, wn], fire: E.rotary ? 2 : E.cyl / 2, lastBoost: 0, rotary: E.rotary };
  },
  setEngine(rpm, thr, boost, slip, speed) {
    const e = this.eng; if (!e) return; const t = this.ctx.currentTime;
    const f = Math.max(20, rpm / 60 * e.fire);
    e.o1.frequency.setTargetAtTime(f, t, 0.02); e.o2.frequency.setTargetAtTime(f * 0.5, t, 0.02); e.o3.frequency.setTargetAtTime(f * 2, t, 0.02);
    e.lp.frequency.setTargetAtTime(280 + thr * 1900 + rpm * 0.16, t, 0.04);
    e.g.gain.setTargetAtTime(0.05 + thr * 0.13, t, 0.05);
    e.bp.frequency.setTargetAtTime(f * 4, t, 0.05); e.ng.gain.setTargetAtTime(thr * 0.035 * (rpm / 7000), t, 0.05);
    e.wh.frequency.setTargetAtTime(1900 + boost * 3600, t, 0.08); e.whg.gain.setTargetAtTime(Math.max(0, boost) * 0.02, t, 0.08);
    e.tg.gain.setTargetAtTime(Math.min(0.12, slip * 0.16), t, 0.05);
    e.wg.gain.setTargetAtTime(Math.min(0.08, speed * speed * 0.000025), t, 0.1);
    if (e.lastBoost > 0.3 && thr < 0.1) this.blowoff(e.lastBoost);
    e.lastBoost = thr < 0.1 ? 0 : boost;
  },
  stopEngine() {
    if (!this.eng) return;
    const e = this.eng; e.g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    setTimeout(() => { for (const n of e.nodes) try { n.stop(); } catch (er) {} }, 300);
    this.eng = null;
  },
  burst(freq, q, dur, gain, type) {
    if (!this.ctx) return; const C = this.ctx, t = C.currentTime;
    const n = this.noise(); const f = C.createBiquadFilter(); f.type = type || 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = C.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(f); f.connect(g); g.connect(this.master); n.start(); n.stop(t + dur + 0.05);
  },
  blowoff(b) { this.burst(2200, 0.9, 0.35, 0.06 * Math.min(1.5, b + 0.4)); },
  impact(s) { this.burst(180, 0.7, 0.25, Math.min(0.5, 0.08 + s * 0.03), 'lowpass'); },
  beep(hi) {
    if (!this.ctx) return; const C = this.ctx, t = C.currentTime, o = C.createOscillator(), g = C.createGain();
    o.type = 'square'; o.frequency.value = hi ? 1320 : 660; g.gain.setValueAtTime(0.06, t); g.gain.exponentialRampToValueAtTime(0.0001, t + (hi ? 0.5 : 0.18));
    o.connect(g); g.connect(this.master); o.start(); o.stop(t + 0.6);
  },
  click() { this.burst(3200, 2, 0.05, 0.12); },
  // steady rain hiss on the roof and road
  rain(level) {
    if (!this.ctx) return; const C = this.ctx, t = C.currentTime;
    if (!this.rainN && level > 0) {
      const n = this.noise(), hp = C.createBiquadFilter(), lp = C.createBiquadFilter(), g = C.createGain();
      hp.type = 'highpass'; hp.frequency.value = 500; lp.type = 'lowpass'; lp.frequency.value = 5200; g.gain.value = 0;
      n.connect(hp); hp.connect(lp); lp.connect(g); g.connect(this.master); n.start(); this.rainN = { n, g };
    }
    if (this.rainN) {
      this.rainN.g.gain.setTargetAtTime(level * 0.07, t, 0.6);
      if (level <= 0) { const r = this.rainN; this.rainN = null; setTimeout(() => { try { r.n.stop(); } catch (e) {} }, 1500); }
    }
  },
  thunder(delay) {
    if (!this.ctx) return; const C = this.ctx, t = C.currentTime + delay;
    const n = this.noise(), f = C.createBiquadFilter(), g = C.createGain();
    f.type = 'lowpass'; f.frequency.value = 160; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.15); g.gain.exponentialRampToValueAtTime(0.12, t + 0.9); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
    n.connect(f); f.connect(g); g.connect(this.master); n.start(t); n.stop(t + 3.4);
  },
  // Japanese patrol siren: a slow rising and falling wail, louder as it closes in
  siren(level, dist) {
    if (!this.ctx) return; const C = this.ctx, t = C.currentTime;
    if (!this.sir && level > 0.01) {
      const o = C.createOscillator(), o2 = C.createOscillator(), lfo = C.createOscillator(), lg = C.createGain(), lp = C.createBiquadFilter(), g = C.createGain();
      o.type = 'sawtooth'; o2.type = 'square'; o.frequency.value = 640; o2.frequency.value = 640; o2.detune.value = 8;
      lfo.type = 'triangle'; lfo.frequency.value = 0.42; lg.gain.value = 260; lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
      lp.type = 'lowpass'; lp.frequency.value = 1800; const m = C.createGain(); m.gain.value = 0.5;
      o.connect(lp); o2.connect(m); m.connect(lp); lp.connect(g); g.gain.value = 0; g.connect(this.master);
      o.start(); o2.start(); lfo.start(); this.sir = { o, o2, lfo, g, lp };
    }
    if (!this.sir) return;
    const k = level * clamp(1 - dist / 260, 0.04, 1);
    this.sir.g.gain.setTargetAtTime(k * 0.05, t, 0.15); this.sir.lp.frequency.setTargetAtTime(700 + k * 1600, t, 0.2);
    if (level <= 0.01) { const s2 = this.sir; this.sir = null; s2.g.gain.setTargetAtTime(0, t, 0.1); setTimeout(() => { for (const x of [s2.o, s2.o2, s2.lfo]) try { x.stop(); } catch (e) {} }, 600); }
  },
  clunk() { this.burst(260, 1, 0.4, 0.3, 'lowpass'); this.burst(1800, 3, 0.15, 0.1); },
  ratchet(on) {
    clearInterval(this.ratchetT);
    if (on && this.ctx) this.ratchetT = setInterval(() => this.burst(4200, 6, 0.025, 0.05), 85);
  },
  dynoPull(run) {
    if (!this.ctx) return;
    const spec = carSpec(car()); this.startEngine(spec);
    const t0 = performance.now(), last = run.pts[run.pts.length - 1].rpm;
    const step = () => {
      const k = (performance.now() - t0) / 4200;
      if (k >= 1) { this.setEngine(1000, 0, 0, 0, 0); setTimeout(() => this.stopEngine(), 600); return; }
      const rpm = 2000 + k * (last - 2000), p = sampleCurve(spec.curve, rpm);
      this.setEngine(rpm, 1, p.boost, 0, 0); requestAnimationFrame(step);
    };
    step();
  }
};
