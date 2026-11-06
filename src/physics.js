// ===================== TRACK + VEHICLE PHYSICS (no rendering) =====================
const ROAD_HW = 3.5, SHOULDER = 1.0, RAIL = ROAD_HW + SHOULDER, CAR_HW = 0.85;

function buildTrack(tg) {
  // curvature per metre, then smoothed so corners get transition spirals
  const pre = 70, post = 90;
  const kRaw = [];
  for (let i = 0; i < pre; i++) kRaw.push(0);
  for (const sg of tg.segs) {
    if (sg[0] === 's') for (let i = 0; i < sg[1]; i++) kRaw.push(0);
    else { const len = Math.round(Math.abs(sg[2]) * Math.PI / 180 * sg[1]); const k = Math.sign(sg[2]) / sg[1]; for (let i = 0; i < len; i++) kRaw.push(k); }
  }
  for (let i = 0; i < post; i++) kRaw.push(0);
  const N = kRaw.length, win = 9;
  const k = new Float32Array(N);
  for (let i = 0; i < N; i++) { let s = 0, c = 0; for (let j = -win; j <= win; j++) { const q = i + j; if (q >= 0 && q < N) { s += kRaw[q]; c++; } } k[i] = s / c; }
  const x = new Float32Array(N), z = new Float32Array(N), y = new Float32Array(N), h = new Float32Array(N), slope = new Float32Array(N);
  let hx = 0, px = 0, pz = 0, py = 0;
  for (let i = 0; i < N; i++) {
    x[i] = px; z[i] = pz; h[i] = hx; y[i] = py;
    const s = i;
    let gr = 0;
    if (s > pre - 20 && s < N - post + 30) gr = tg.grade * (1 + 0.45 * Math.sin(s / 170) + 0.25 * Math.sin(s / 53 + 1));
    slope[i] = gr;
    hx += k[i]; px += Math.sin(hx); pz += Math.cos(hx); py += gr;
  }
  // wider smoothing for the AI racing line
  const ks = new Float32Array(N), kw = 22;
  for (let i = 0; i < N; i++) { let s = 0, c = 0; for (let j = -kw; j <= kw; j++) { const q = i + j; if (q >= 0 && q < N) { s += k[q]; c++; } } ks[i] = s / c; }
  return { N, x, y, z, h, k, ks, slope, start: pre, finish: N - post + 10, tg };
}

function trackPoint(T, s) {
  const i = clamp(Math.floor(s), 0, T.N - 2), f = clamp(s - i, 0, 1);
  return { x: lerp(T.x[i], T.x[i + 1], f), y: lerp(T.y[i], T.y[i + 1], f), z: lerp(T.z[i], T.z[i + 1], f), h: lerp(T.h[i], T.h[i + 1], f) };
}
// nearest centreline sample near a hint index
function trackLocate(T, x, z, hint) {
  let best = hint, bd = 1e9;
  const a = Math.max(0, hint - 40), b = Math.min(T.N - 1, hint + 40);
  for (let i = a; i <= b; i++) { const dx = x - T.x[i], dz = z - T.z[i], d = dx * dx + dz * dz; if (d < bd) { bd = d; best = i; } }
  const h = T.h[best], dx = x - T.x[best], dz = z - T.z[best];
  const along = dx * Math.sin(h) + dz * Math.cos(h), lat = dx * Math.cos(h) - dz * Math.sin(h);
  return { i: best, s: best + along, lat };
}

const pac = (a, B) => Math.sin(1.4 * Math.atan(B * a));
function angDiff(a, b) { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; }

// ---------------- driving aids for touch screens
// Safe speed per metre along a racing line, sized to this car's grip.
function buildAidProfile(T, sp) {
  const N = T.N, mu = Math.min(sp.muF, sp.muR) * 0.88, v = new Float32Array(N), line = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    line[i] = clamp(T.ks[Math.min(N - 1, i + 6)] * 60, -1, 1) * (ROAD_HW - 1.5);
    let km = 1e-4; for (let j = Math.max(0, i - 6); j <= Math.min(N - 1, i + 6); j++) km = Math.max(km, Math.abs(T.k[j]));
    v[i] = Math.min(70, Math.sqrt(mu * G / km));
  }
  for (let i = N - 2; i >= 0; i--) v[i] = Math.min(v[i], Math.sqrt(v[i + 1] * v[i + 1] + 2 * Math.max(2, mu * G * 0.78 + G * T.slope[i])));
  return { v, line };
}
function applyAids(P, T, prof, inp, set) {
  let { steer, gas, brake, hand } = inp;
  const N = T.N, s = clamp(P.s, 0, N - 1);
  if (set.steerAid === 'weak' || set.steerAid === 'strong') {
    const sa = Math.min(N - 1, s + 5 + P.speed * 0.45), tp = trackPoint(T, sa), lat = prof.line[Math.floor(sa)];
    const tx = tp.x + Math.cos(tp.h) * lat, tz = tp.z - Math.sin(tp.h) * lat;
    const auto = clamp(angDiff(Math.atan2(tx - P.x, tz - P.z), P.h) * 2.4 - P.w * 0.12, -1, 1);
    const w = set.steerAid === 'strong' ? 0.9 : 0.5;
    steer = clamp(steer + auto * w * (1 - 0.6 * Math.abs(steer)), -1, 1); // the player's own input always wins
  }
  if ((set.brakeAid || set.autoGas) && P.gear !== -1) {
    const tgt = prof.v[Math.min(N - 1, Math.floor(s + 2 + P.speed * 0.25))];
    if (set.autoGas && brake < 0.1) gas = Math.max(gas, P.speed < tgt - 0.6 ? 1 : P.speed < tgt + 0.4 ? 0.35 : 0);
    if (set.brakeAid && P.speed > tgt + 1.2) { brake = Math.max(brake, clamp((P.speed - tgt) / 5, 0.25, 1)); gas = 0; P.aidBrake = true; } else P.aidBrake = false;
  }
  return { steer, gas, brake, hand };
}

class PlayerCar {
  constructor(spec, T, s0, lat0, settings) {
    this.sp = spec; this.T = T; this.set = settings;
    const p = trackPoint(T, s0);
    this.h = p.h; this.x = p.x + Math.cos(p.h) * lat0; this.z = p.z - Math.sin(p.h) * lat0; this.y = p.y;
    this.vx = 0; this.vz = 0; this.w = 0; this.delta = 0;
    this.rpm = spec.E.idle; this.gear = 1; this.shiftT = 0; this.thr = 0; this.brk = 0; this.boost = 0; this.spin = 0;
    this.ax = 0; this.ay = 0; this.idx = Math.floor(s0); this.s = s0; this.lat = lat0;
    this.knock = false; this.clutchSlip = false; this.limiter = false; this.blown = false; this.revT = 0;
    this.slipF = 0; this.slipR = 0; this.slide = 0; this.wheelspin = false; this.locked = false;
    this.dmgBody = 0; this.dmgEngine = 0; this.wear = 0; this.clutchWear = 0; this.hits = []; this.hitCount = 0;
    this.speed = 0; this.vLong = 0; this.vLat = 0; this.t = 0;
    this.icEff = spec.curve.icEff; this.tau = spec.curve.turbo ? 0.22 + Math.max(0, spec.curve.s1 - 3200) / 7000 : 0.1;
  }
  gearRatio() { return this.gear === -1 ? -3.4 : this.sp.gears[this.gear - 1]; }
  engineTorque(rpm, thr) {
    const sp = this.sp, cu = sp.curve, smp = sampleCurve(cu, rpm);
    const ss = cu.turbo ? smp.boost : 0;
    const tgt = ss * clamp((thr - 0.2) / 0.8, 0, 1);
    this.boost += (tgt - this.boost) * Math.min(1, this.dt / this.tau);
    const b = this.boost, rise = b > 0 ? 70 * Math.pow(b, 0.9) * (1 - this.icEff) : 0;
    let T = smp.baseT * (1 + 0.95 * b) * (291 / (291 + rise));
    // knock: steady-state margin plus what we gain from not being fully spooled
    const m = smp.margin + Math.max(0, ss - b) * 9;
    this.knock = false;
    if (thr > 0.75 && m < 0 && !this.blown) {
      this.knock = true;
      this.dmgEngine += 0.0035 * Math.pow(-m, 1.6) * this.dt;
    }
    if (this.blown) T *= 0.08;
    return T * thr;
  }
  step(dt, inp) {
    this.dt = dt; this.t += dt;
    const sp = this.sp, T = this.T, m = sp.mass, set = this.set;
    const sh = Math.sin(this.h), ch = Math.cos(this.h);
    let vLong = this.vx * sh + this.vz * ch, vLat = this.vx * ch - this.vz * sh;
    const speed = Math.hypot(this.vx, this.vz);
    // reverse handling: hold brake at standstill
    let gas = inp.gas, brake = inp.brake;
    if (this.gear === -1) { const g2 = gas; gas = brake; brake = g2; if (inp.gas > 0.5 && speed < 1) this.gear = 1; }
    else if (inp.brake > 0.5 && inp.gas < 0.1 && speed < 0.6) { this.revT += dt; if (this.revT > 0.7) { this.gear = -1; this.revT = 0; } } else this.revT = 0;
    // pedals ramp like a foot, not a switch
    const easy = set.aid === 'kezdo' || set.aid === 'konnyu';
    this.thr += clamp(gas - this.thr, -8 * dt, (easy ? 2.4 : 4.2) * dt);
    this.brk += clamp(brake - this.brk, -10 * dt, 6 * dt);
    // steering: speed-sensitive lock, optional countersteer help
    let dT = inp.steer * sp.steerLock / (1 + speed / 20);
    const beta = speed > 3 ? Math.atan2(vLat, Math.abs(vLong)) : 0;
    if (set.assist && speed > 4) dT += clamp((easy ? 0.95 : 0.65) * beta, -0.45, 0.45);
    if (set.driftAid && speed > 4) dT += clamp(0.55 * beta, -0.4, 0.4); // holds a slide without touching the throttle
    dT += Math.sin(this.t * 13) * 0.012 * sp.wobble;
    this.delta += clamp(dT - this.delta, -2.8 * dt, 2.8 * dt);
    const delta = this.delta, sd = Math.sin(delta), cd = Math.cos(delta);
    const dir = vLong >= 0 ? 1 : -1;

    // ---------------- engine + gearbox
    const ratio = this.gearRatio(), fd = sp.final;
    const wheelRpm = Math.abs(vLong) / sp.rw * 9.5493 * Math.abs(ratio) * fd;
    let thr = this.thr;
    if (set.tcs && this.wheelspin) thr *= 0.35;
    // assist also feathers the throttle once the rear is sliding past a drift angle
    const fth = easy ? 0.1 : 0.14;
    if (set.assist && sp.layout !== 'FF' && this.slipR > fth && speed > 6) thr *= clamp(1 - (this.slipR - fth) * 3.2, 0.3, 1);
    if (set.esc && Math.abs(beta) > 0.12 && speed > 5) thr *= 0.55;
    let Te = 0;
    if (this.shiftT > 0) {
      this.shiftT -= dt;
      this.rpm += (Math.max(sp.E.idle, wheelRpm) - this.rpm) * Math.min(1, dt * 14 / sp.inertia);
      this.engineTorque(this.rpm, 0);
    } else {
      const launch = this.gear === 1 && speed < 7 ? (sp.E.idle + thr * 2900) * (1 - speed / 7) : 0;
      const tgt = Math.max(wheelRpm * (1 + this.spin), launch, sp.E.idle);
      this.rpm += (tgt - this.rpm) * Math.min(1, dt * 30 / sp.inertia);
      this.limiter = this.rpm >= sp.curve.limiter;
      if (this.limiter) { this.rpm = sp.curve.limiter; Te = -20; this.engineTorque(this.rpm, 0); }
      else {
        Te = this.engineTorque(this.rpm, thr);
        if (thr < 0.05) Te = -0.12 * sp.nm * (this.rpm / sp.curve.limiter) - 8;
      }
      this.clutchSlip = false;
      if (Te > sp.clutchCap) { Te = sp.clutchCap; this.clutchSlip = true; this.clutchWear += dt * 0.004 * (Te / sp.clutchCap); this.rpm = Math.min(sp.curve.limiter, this.rpm + 600 * dt); }
    }
    if (this.dmgEngine >= 1 && !this.blown) this.blown = true;
    // automatic gearbox
    if (set.auto && this.shiftT <= 0 && this.gear > 0) {
      const n = sp.gears.length;
      if (this.rpm > sp.curve.limiter - 180 && this.gear < n && this.spin < 0.08) this.shift(1);
      else if (this.gear > 1) {
        const down = wheelRpm * sp.gears[this.gear - 2] / sp.gears[this.gear - 1];
        if ((down < sp.curve.limiter * 0.84 && this.rpm < sp.E.peakT * 0.9) || (this.brk > 0.3 && down < sp.curve.limiter * 0.78)) this.shift(-1);
      }
    }
    const Fdrive = this.shiftT > 0 ? 0 : Te * ratio * fd * 0.88 / sp.rw;

    // ---------------- tyre loads
    const v2 = speed * speed;
    const Fdown = 0.5 * 1.2 * v2 * sp.downforce;
    const WfS = m * G * sp.b / sp.L, WrS = m * G * sp.a / sp.L + Fdown;
    const dW = m * this.ax * sp.cgH / sp.L;
    const Wf = Math.max(0.15 * WfS, WfS - dW), Wr = Math.max(0.15 * WrS, WrS + dW);
    const latG = Math.min(1.4, Math.abs(this.ay) / G);
    const surf = (Math.abs(this.lat) > ROAD_HW + 0.2 ? 0.72 : 1) * (this.wetSpot ? this.wetSpot(this.s, this.lat) : 1);
    const muF = sp.muF * (1 - sp.sens * sp.lambda * latG * 1.2) * surf;
    const muR = sp.muR * (1 - sp.sens * (1 - sp.lambda) * latG * 1.2) * surf;
    const lsdTf = { open: 1 - 0.42 * Math.min(1, latG / 0.9), visc: 1 - 0.18 * Math.min(1, latG / 0.9) }[sp.lsd] || 1;

    // drive split
    let FdF = 0, FdR = 0;
    if (sp.layout === 'FF') FdF = Fdrive; else if (sp.layout === 'AWD') { FdF = Fdrive * 0.35; FdR = Fdrive * 0.65; } else FdR = Fdrive;
    // braking (opposes motion)
    const Bt = this.brk * m * G * 1.08 * sp.brake;
    let BF = Bt * sp.bias, BR = Bt * (1 - sp.bias);
    const hb = inp.hand && speed > 1;
    const moving = Math.abs(vLong) > 0.4;
    const axle = (Fd, B, mu, W, longMu, driven, isRear) => {
      const cap = mu * W;
      const maxLong = cap * longMu * (driven && Fd > 0 ? lsdTf : 1);
      let Fx = Fd - (moving ? B * dir : 0);
      let lat, state = 0;
      if (isRear && hb) { Fx = -dir * cap * 0.78 * Math.min(1.3, sp.hbrake); lat = cap * 0.22 / sp.hbrake; state = 2; }
      else if (Fx > maxLong && Fx <= cap * longMu && driven) { // open diff: the unloaded inside wheel spins, the outside one still grips
        Fx = maxLong; lat = Math.sqrt(Math.max(0, cap * cap - Fx * Fx)) * 0.92; state = 1; this._over = Math.max(this._over || 0, 0.15);
      }
      else if (Math.abs(Fx) > maxLong) {
        if (B > Math.abs(Fd)) { // braking beyond grip
          if (set.abs) { Fx = Math.sign(Fx) * maxLong * 0.96; lat = cap * 0.5; state = 3; }
          else { Fx = Math.sign(Fx) * maxLong * 0.82; lat = cap * 0.12; state = 2; }
        } else { // wheelspin: the more torque over the limit, the less side grip is left
          const over = Math.abs(Fx) / maxLong - 1;
          Fx = Math.sign(Fx) * maxLong * (0.97 - Math.min(0.12, over * 0.25));
          lat = cap * clamp(0.62 - over * 0.8, 0.22, 0.62); state = 1; this._over = Math.max(this._over || 0, over);
        }
      } else lat = Math.sqrt(Math.max(0, cap * cap - Fx * Fx));
      return { Fx, lat, state };
    };
    const fA = axle(FdF, BF, muF, Wf, sp.longMuF, sp.layout !== 'FR', false);
    const rA = axle(FdR, BR, muR, Wr, sp.longMuR, sp.layout !== 'FF', true);
    this.wheelspin = fA.state === 1 || rA.state === 1;
    this.locked = fA.state === 2 || rA.state === 2;
    const spinT = this.wheelspin ? Math.min(0.45, 0.05 + (this._over || 0) * 0.6) : 0;
    this._over = 0;
    this.spin += (spinT - this.spin) * Math.min(1, dt * 6);

    // slip angles
    const vxs = Math.abs(vLong) + 0.6;
    const aF = Math.atan2(vLat + this.w * sp.a, vxs) - delta * dir;
    const aR = Math.atan2(vLat - this.w * sp.b, vxs);
    const FyF = -fA.lat * pac(aF, sp.Bf), FyR = -rA.lat * pac(aR, sp.Br);
    this.slipF = Math.abs(aF); this.slipR = Math.abs(aR);
    this.slide = Math.max(0, Math.abs(aR) - 0.1) * 2 + (this.wheelspin ? 0.4 : 0) + (this.locked ? 0.5 : 0) + Math.max(0, Math.abs(aF) - 0.14) * 1.5;

    const drag = 0.5 * 1.2 * sp.cd * sp.area * vLong * Math.abs(vLong) + 0.015 * m * G * Math.sign(vLong) * Math.min(1, Math.abs(vLong) / 0.5);
    const gIdx = clamp(this.idx, 0, T.N - 1);
    const dh = this.h - T.h[gIdx];
    const Fgrav = -m * G * T.slope[gIdx] * Math.cos(dh);
    let FL = fA.Fx * cd - FyF * sd + rA.Fx - drag + Fgrav;
    const FLat = fA.Fx * sd + FyF * cd + FyR;
    let Tz = sp.a * (fA.Fx * sd + FyF * cd) - sp.b * FyR;
    // locking diffs resist yaw: 1.5/2-way off throttle, any LSD lightly on throttle
    if (sp.lsd === '2way' || sp.lsd === '1.5way') if (thr < 0.1 && speed > 5) Tz -= this.w * sp.I * (sp.lsd === '2way' ? 1.4 : 0.7);
    // stability control: a corrective yaw moment once the car slides past a small angle
    if (set.esc && speed > 5 && Math.abs(beta) > 0.07) Tz += Math.sign(beta) * Math.min(1, (Math.abs(beta) - 0.07) * 5) * sp.I * 7;
    // drift helper: lets the car slide, only catches it past about 35 degrees so it does not spin
    if (set.driftAid && speed > 5 && Math.abs(beta) > 0.62) Tz += Math.sign(beta) * Math.min(1, (Math.abs(beta) - 0.62) * 3) * sp.I * 5;
    const fx = FL * sh + FLat * ch, fz = FL * ch - FLat * sh;
    this.vx += fx / m * dt; this.vz += fz / m * dt; this.w += Tz / sp.I * dt;
    if (speed < 2) this.w *= 1 - Math.min(1, dt * 4);
    if (!moving && this.brk > 0.15 && Math.abs(Fdrive) < 1) { this.vx *= 0.85; this.vz *= 0.85; }
    this.h += this.w * dt; this.x += this.vx * dt; this.z += this.vz * dt;
    this.ax = FL / m; this.ay = FLat / m;

    // ---------------- track + guardrails
    this.rail = 0;
    const loc = trackLocate(T, this.x, this.z, this.idx);
    this.idx = loc.i; this.s = loc.s; this.lat = loc.lat;
    const lim = RAIL - CAR_HW - 0.05;
    if (Math.abs(loc.lat) > lim) {
      const th = T.h[loc.i], sgn = Math.sign(loc.lat);
      const nx = Math.cos(th) * sgn, nz = -Math.sin(th) * sgn;
      const pen = Math.abs(loc.lat) - lim;
      this.rail = 1; this.railSide = sgn;
      this.x -= nx * pen; this.z -= nz * pen;
      const vn = this.vx * nx + this.vz * nz;
      if (vn > 0) {
        this.vx -= 1.25 * vn * nx; this.vz -= 1.25 * vn * nz;
        const f = 1 - Math.min(0.45, vn * 0.05); this.vx *= f; this.vz *= f;
        this.w *= 0.55; this.w -= sgn * vn * 0.06;
        if (vn > 1.2) { this.dmgBody += vn * 0.011 * sp.damageMult; this.hits.push(vn); this.hitCount = (this.hitCount || 0) + 1; }
      }
    }
    const tp = trackPoint(T, clamp(this.s, 0, T.N - 1));
    this.y = tp.y;
    this.speed = speed; this.vLong = vLong; this.vLat = vLat;
    this.wear += dt * (0.00035 + this.slide * 0.0022) * sp.tireWear;
  }
  shift(d) {
    const n = this.sp.gears.length;
    if (this.gear === -1) { if (d > 0) this.gear = 1; return; }
    const g = clamp(this.gear + d, 1, n); if (g === this.gear) return;
    this.gear = g; this.shiftT = 0.16 + 0.08 * this.sp.inertia;
  }
}

// ---------------- AI rival: follows a racing line with a speed profile
class RivalCar {
  constructor(rv, T, s0, lat0, grip) {
    this.rv = rv; this.T = T; this.s = s0; this.lat = lat0; this.v = 0; this.t = 0; this.idx = Math.floor(s0);
    const M = CARS[rv.car];
    this.mass = M.mass + 75; this.mu = M.mu * 1.04 * rv.skill * (grip || 1); this.P = rv.ps * 735.5 * 0.84;
    this.cd = M.cd * M.area; this.layout = M.layout;
    const N = T.N; this.line = new Float32Array(N); this.vmax = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      // look slightly ahead so the apex is hit late, like a real driver
      const kA = T.ks[Math.min(N - 1, i + 6)];
      this.line[i] = clamp(kA * 95, -1, 1) * (ROAD_HW - 1.15);
      const r = 1 / Math.max(1e-4, Math.abs(T.ks[i]) * 0.86);
      this.vmax[i] = Math.min(75, Math.sqrt(this.mu * G * r));
    }
    // braking pass from the end backwards
    for (let i = N - 2; i >= 0; i--) {
      const dec = this.mu * G * 0.9 + G * T.slope[i];
      this.vmax[i] = Math.min(this.vmax[i], Math.sqrt(this.vmax[i + 1] * this.vmax[i + 1] + 2 * Math.max(2, dec)));
    }
    this.x = 0; this.z = 0; this.y = 0; this.h = 0; this.yawVis = 0; this.braking = false;
    this.place();
  }
  place() {
    const p = trackPoint(this.T, this.s);
    this.x = p.x + Math.cos(p.h) * this.lat; this.z = p.z - Math.sin(p.h) * this.lat; this.y = p.y; this.h = p.h;
  }
  step(dt, player, band) {
    const T = this.T; this.t += dt;
    const i = clamp(Math.floor(this.s), 0, T.N - 2);
    let target = this.vmax[i] * band;
    // player directly ahead: follow or go around
    const ds = player.s - this.s, dl = player.lat - this.lat;
    let latT = this.line[i];
    if (ds > -2 && ds < 12 && Math.abs(dl) < 2.1) {
      const room = (ROAD_HW - 1.0) - Math.abs(player.lat);
      if (room > 1.6) latT = player.lat > 0 ? player.lat - 2.3 : player.lat + 2.3;
      else target = Math.min(target, player.speed - 0.5 + ds * 0.3);
    }
    latT = clamp(latT, -(ROAD_HW - 0.95), ROAD_HW - 0.95);
    this.lat += clamp(latT - this.lat, -2.4 * dt, 2.4 * dt);
    const acc = Math.min(this.mu * G * (this.layout === 'AWD' ? 0.95 : 0.8), this.P / (this.mass * Math.max(this.v, 4)))
      - (0.5 * 1.2 * this.cd * this.v * this.v) / this.mass - G * T.slope[i];
    const dec = this.mu * G * 0.9 + G * T.slope[i];
    this.braking = false;
    if (this.v < target) this.v = Math.min(target, this.v + Math.max(0, acc) * dt);
    else { this.v = Math.max(target, this.v - dec * dt); this.braking = true; }
    this.v = Math.max(0, this.v);
    this.s += this.v * dt;
    this.place();
    // FR rivals swing the tail in hairpins, purely visual
    const yawT = this.layout === 'FF' ? 0 : clamp(T.ks[i] * this.v * 0.22, -0.38, 0.38);
    this.yawVis += (yawT - this.yawVis) * Math.min(1, dt * 3);
  }
}

// circle-pair contact between player and rival
function carContact(P, R) {
  const pts = (c, h) => [[c.x + Math.sin(h) * 1.15, c.z + Math.cos(h) * 1.15], [c.x - Math.sin(h) * 1.15, c.z - Math.cos(h) * 1.15]];
  const a = pts(P, P.h), b = pts(R, R.h + R.yawVis);
  let hit = null;
  for (const p of a) for (const q of b) {
    const dx = p[0] - q[0], dz = p[1] - q[1], d = Math.hypot(dx, dz);
    if (d < 1.9 && (!hit || d < hit.d)) hit = { d, nx: dx / (d || 1), nz: dz / (d || 1) };
  }
  if (!hit) return 0;
  const pen = 1.9 - hit.d;
  P.x += hit.nx * pen * 0.7; P.z += hit.nz * pen * 0.7;
  const th = R.h; R.lat -= (hit.nx * Math.cos(th) - hit.nz * Math.sin(th)) * pen * 0.3;
  const rvx = Math.sin(R.h) * R.v, rvz = Math.cos(R.h) * R.v;
  const vn = (P.vx - rvx) * hit.nx + (P.vz - rvz) * hit.nz;
  if (vn < 0) { P.vx -= 1.3 * vn * hit.nx; P.vz -= 1.3 * vn * hit.nz; R.v = Math.max(0, R.v * 0.97); P.w *= 0.8; if (-vn > 1.5) { P.dmgBody += -vn * 0.006 * P.sp.damageMult; return -vn; } }
  return 0;
}

// ---------------- pace notes: find corners and grade them like a rally co-driver (1 = slowest)
function findCorners(T) {
  const th = 1 / 260, out = [];
  let i = T.start;
  while (i < T.finish) {
    if (Math.abs(T.k[i]) < th) { i++; continue; }
    const dir = Math.sign(T.k[i]); let j = i, maxk = 0, ang = 0, gap = 0;
    while (j < T.N - 1) {
      const k = T.k[j];
      if (Math.sign(k) === dir && Math.abs(k) >= th) { gap = 0; maxk = Math.max(maxk, Math.abs(k)); ang += Math.abs(k); }
      else if (++gap > 8) break;
      j++;
    }
    const end = j - gap;
    if (ang > 0.2) {
      const R = 1 / maxk, deg = ang * 180 / Math.PI;
      const sev = R < 20 && deg > 110 ? 0 : R < 30 ? 1 : R < 45 ? 2 : R < 65 ? 3 : R < 95 ? 4 : R < 140 ? 5 : 6;
      out.push({ s0: i, s1: end, dir, R, deg, sev, long: deg > 100 && sev > 0 });
    }
    i = Math.max(end, i + 1);
  }
  return out;
}
function noteText(c) { return (c.dir > 0 ? 'BAL ' : 'JOBB ') + (c.sev === 0 ? 'HAJTŰ' : c.sev) + (c.long ? ' HOSSZÚ' : ''); }

// ---------------- the cup of water on the dashboard (tofu runs)
// The water surface follows the felt acceleration through a lightly damped spring, so smooth inputs
// barely move it while sudden steering, braking or a guardrail hit makes it slosh over the rim.
class WaterCup {
  constructor() { this.level = 0.86; this.ax = 0; this.az = 0; this.vx = 0; this.vz = 0; this.spilled = 0; this.lastSpill = 0; this.tofu = 1; }
  step(dt, latA, lonA, impact) {
    const k = 34, c = 3.2, sc = 0.75;
    const tx = Math.atan(latA * sc / G), tz = Math.atan(lonA * sc / G);
    this.vx += (k * (tx - this.ax) - c * this.vx) * dt; this.vz += (k * (tz - this.az) - c * this.vz) * dt;
    if (impact) { this.vx += (Math.random() - 0.5) * impact * 0.5; this.vz += impact * 0.25; this.tofu = Math.max(0, this.tofu - impact * 0.035); }
    this.ax += this.vx * dt; this.az += this.vz * dt;
    const tilt = Math.hypot(this.ax, this.az), clear = Math.atan((1 - this.level) * 2.0);
    this.lastSpill = 0;
    if (tilt > clear && this.level > 0) { const d = Math.min(this.level, (tilt - clear) * 2.0 * dt); this.level -= d; this.spilled += d; this.lastSpill = d; }
    if (Math.abs(lonA) > G * 0.95) this.tofu = Math.max(0, this.tofu - (Math.abs(lonA) / G - 0.95) * dt * 0.4);
  }
}
