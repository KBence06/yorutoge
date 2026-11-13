// ===================== MUSIC: a car radio with four stations, all synthesized in the browser =====================
// A sixteenth-note sequencer scheduled slightly ahead of the audio clock. Patterns are built from a scale and a
// chord loop, with a seeded variation every four bars so a station does not repeat itself bar for bar.
const Music = {
  STATIONS: [
    { id: 'off', name: 'kikapcsolva' },
    { id: 'euro', name: 'Tōge Beat FM · eurobeat', bpm: 154, root: 45, scale: [0, 2, 3, 5, 7, 8, 10], chords: [0, 5, 3, 4], kind: 'euro' },
    { id: 'city', name: 'Bay City 76.1 · city pop', bpm: 104, root: 41, scale: [0, 2, 4, 5, 7, 9, 11], chords: [3, 4, 2, 5], kind: 'city' },
    { id: 'tech', name: 'Midnight Loop · techno', bpm: 132, root: 43, scale: [0, 2, 3, 5, 7, 8, 10], chords: [0, 0, 5, 3], kind: 'tech' },
    { id: 'lofi', name: 'Garage Tapes · lo-fi', bpm: 78, root: 48, scale: [0, 2, 3, 5, 7, 9, 10], chords: [0, 3, 5, 4], kind: 'lofi' }
  ],
  gain: null, timer: null, nextT: 0, step: 0, cur: null, duckV: 1,
  station() { return this.STATIONS.find(s => s.id === (S.settings.radio || 'city')) || this.STATIONS[0]; },
  label() { return this.station().name; },
  next() { const i = this.STATIONS.indexOf(this.station()); this.set(this.STATIONS[(i + 1) % this.STATIONS.length].id); },
  set(id) { S.settings.radio = id; save(); this.stop(); this.resume(); },
  vol() { return S.settings.mvol == null ? 0.5 : S.settings.mvol; },
  setVol(v) { S.settings.mvol = v; if (this.gain) this.gain.gain.setTargetAtTime(v * 0.5 * this.duckV, Audio2.ctx.currentTime, 0.05); },
  duck(v) { this.duckV = v; if (this.gain) this.gain.gain.setTargetAtTime(this.vol() * 0.5 * v, Audio2.ctx.currentTime, 0.3); },
  // called whenever the audio context is (re)started by a tap
  resume() {
    const C = Audio2.ctx, st = this.station(); if (!C || st.id === 'off' || this.timer) return;
    if (!this.gain) { this.gain = C.createGain(); this.gain.connect(Audio2.master); }
    this.gain.gain.value = this.vol() * 0.5 * this.duckV;
    this.cur = st; this.step = 0; this.nextT = C.currentTime + 0.08; this.seed = 7 + this.STATIONS.indexOf(st) * 131;
    this.timer = setInterval(() => this.pump(), 50);
  },
  stop() { if (this.timer) { clearInterval(this.timer); this.timer = null; } },
  rnd(k) { let x = Math.sin(this.seed * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); },
  hz(m) { return 440 * Math.pow(2, (m - 69) / 12); },
  deg(st, d, oct) { const n = st.scale.length, o = Math.floor(d / n); return st.root + st.scale[((d % n) + n) % n] + 12 * (o + (oct || 0)); },
  pump() {
    const C = Audio2.ctx; if (!C || C.state !== 'running') return;
    const st = this.cur, six = 60 / st.bpm / 4;
    if (this.nextT < C.currentTime - 0.3) this.nextT = C.currentTime + 0.05; // the tab was asleep: do not replay the backlog
    while (this.nextT < C.currentTime + 0.18) { this.play(st, this.step, this.nextT, six); this.nextT += six; this.step++; }
  },
  // ---- voices
  tone(t, f, dur, type, vol, o) {
    const C = Audio2.ctx; o = o || {}; const os = C.createOscillator(), g = C.createGain(); os.type = type; os.frequency.setValueAtTime(f, t); if (o.slide) os.frequency.exponentialRampToValueAtTime(o.slide, t + dur);
    if (o.det) os.detune.value = o.det;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + (o.att || 0.005)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let last = os;
    if (o.cut) { const fl = C.createBiquadFilter(); fl.type = 'lowpass'; fl.Q.value = o.q || 1; fl.frequency.setValueAtTime(o.cut, t); if (o.cutTo) fl.frequency.exponentialRampToValueAtTime(o.cutTo, t + dur); os.connect(fl); last = fl; }
    last.connect(g); g.connect(this.gain); os.start(t); os.stop(t + dur + 0.03);
  },
  hit(t, freq, q, dur, vol, type) {
    const C = Audio2.ctx, n = Audio2.noise(), f = C.createBiquadFilter(), g = C.createGain(); f.type = type || 'highpass'; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); n.connect(f); f.connect(g); g.connect(this.gain); n.start(t, Math.random()); n.stop(t + dur + 0.03);
  },
  kick(t, v) { this.tone(t, 150, 0.2, 'sine', v, { slide: 42 }); },
  play(st, step, t, six) {
    const s16 = step % 16, bar = Math.floor(step / 16), ch = st.chords[bar % 4], phrase = Math.floor(bar / 4), k = st.kind;
    const R = (i) => this.rnd(i + (phrase % 3) * 100 + (bar % 4) * 16);
    if (k === 'euro') {
      if (s16 % 4 === 0) this.kick(t, 0.5);
      if (s16 % 8 === 4) this.hit(t, 1800, 0.8, 0.13, 0.22, 'bandpass');
      if (s16 % 4 === 2) this.hit(t, 8000, 0.7, 0.06, 0.08);
      if (s16 % 2 === 1 || s16 % 4 === 2) this.tone(t, this.hz(this.deg(st, ch, s16 % 4 === 2 ? 0 : -1)), six * 0.9, 'sawtooth', 0.16, { cut: 900, cutTo: 240 });
      // the lead: a run through the chord, different each phrase
      if (bar % 8 < 6 || s16 % 2 === 0) { const arp = [0, 2, 4, 7, 4, 2, 4, 9][(s16 + Math.floor(R(s16 >> 2) * 3)) % 8]; if (R(s16) > 0.22) for (const det of [-9, 9]) this.tone(t, this.hz(this.deg(st, ch + arp, 2)), six * 1.7, 'sawtooth', 0.05, { det, cut: 4200, cutTo: 1400 }); }
      if (s16 === 0) for (const d of [0, 2, 4]) this.tone(t, this.hz(this.deg(st, ch + d, 1)), six * 15, 'sawtooth', 0.028, { att: 0.05, cut: 1500 });
    } else if (k === 'city') {
      if (s16 === 0 || s16 === 10 || (s16 === 7 && bar % 2)) this.kick(t, 0.42);
      if (s16 === 4 || s16 === 12) this.hit(t, 1500, 0.7, 0.16, 0.16, 'bandpass');
      if (s16 % 2 === 0) this.hit(t, 9000, 0.6, s16 % 4 === 2 ? 0.09 : 0.04, 0.045);
      const bl = [0, null, 0, null, 4, null, 7, 4, null, 0, null, 7, 9, null, 7, 4][s16]; if (bl != null && R(s16) > 0.12) this.tone(t, this.hz(this.deg(st, ch + bl, -1)), six * 1.6, 'triangle', 0.26, { cut: 700 });
      if (s16 === 0 || s16 === 6 || s16 === 11) for (const d of [0, 2, 4, 6]) this.tone(t, this.hz(this.deg(st, ch + d, 1)), six * 4.5, 'triangle', 0.05, { att: 0.01, cut: 2200 });
      if (bar % 4 >= 2 && s16 % 2 === 0 && R(s16 + 40) > 0.45) this.tone(t, this.hz(this.deg(st, ch + [4, 6, 7, 9, 11][Math.floor(R(s16 + 9) * 5)], 2)), six * 2.6, 'sine', 0.07, { att: 0.01 });
    } else if (k === 'tech') {
      if (s16 % 4 === 0) this.kick(t, 0.55);
      if (s16 % 4 === 2) this.hit(t, 9500, 0.6, 0.05, 0.07);
      if (s16 === 4 || s16 === 12) this.hit(t, 2400, 1.5, 0.09, 0.09, 'bandpass');
      const on = R(s16) > 0.3, acc = R(s16 + 50) > 0.7, nt = [0, 0, 7, 0, 3, 0, 10, 12][Math.floor(R(s16 + 20) * 8)];
      if (on) this.tone(t, this.hz(st.root + nt - 12 + st.scale[ch % 7]), six * (acc ? 1.6 : 0.8), 'sawtooth', 0.13, { cut: acc ? 2600 : 1100 + 700 * Math.sin(step * 0.05), cutTo: 180, q: 9 });
      if (bar % 8 >= 4 && s16 % 8 === 6) this.tone(t, this.hz(this.deg(st, ch + 4, 2)), six * 3, 'square', 0.03, { cut: 1800 });
    } else {
      if (s16 === 0 || s16 === 9) this.kick(t, 0.36);
      if (s16 === 4 || s16 === 12) this.hit(t, 1100, 0.6, 0.2, 0.11, 'bandpass');
      if (s16 % 2 === 0) this.hit(t + (s16 % 4 === 2 ? six * 0.25 : 0), 7000, 0.5, 0.05, 0.035);
      if (s16 === 0) { for (const d of [0, 2, 4, 6]) this.tone(t + d * 0.012, this.hz(this.deg(st, ch + d, 0)), six * 14, 'triangle', 0.07, { att: 0.02, cut: 1300 }); this.tone(t, this.hz(this.deg(st, ch, -1)), six * 10, 'sine', 0.2); }
      if (s16 % 4 === 2 && R(s16 + 70) > 0.5) this.tone(t, this.hz(this.deg(st, ch + [2, 4, 6, 7][Math.floor(R(s16 + 3) * 4)], 1)), six * 5, 'sine', 0.06, { att: 0.02 });
    }
  }
};
