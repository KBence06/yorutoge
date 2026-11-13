// ===================== CAR & ENGINE MODEL =====================
// Torque comes from volumetric efficiency, boost pressure, charge density, ignition timing and mixture.
// Knock margin is in degrees of ignition advance before detonation.
const K_TORQUE = 94; // Nm per litre at 100% VE

function partFx(c) {
  const fx = { veHigh: 0, veLow: 0, peakShift: 0, limiter: 0, spool: 0, brake: 0, strut: 0, unsprung: 0, downforce: 0, w: 0, leak: 0, wobble: 0 };
  const q = {};
  for (const [slot, ip] of Object.entries(c.parts)) {
    const p = PART[ip.id]; if (!p) continue;
    const k = 0.7 + 0.3 * ip.q; // poor installs lose part of the gain
    q[slot] = ip.q;
    fx.w += p.w || 0;
    for (const [key, val] of Object.entries(p.fx)) {
      if (typeof val === 'number' && ['veHigh', 'veLow', 'brake', 'strut', 'unsprung', 'downforce'].includes(key)) fx[key] += val * (val > 0 ? k : 1);
      else if (key === 'peakShift' || key === 'limiter' || key === 'spool') fx[key] += val;
      else fx[key] = val;
    }
    if (ip.q < 0.55) {
      if (['intake', 'header', 'exhaust', 'turbo', 'ic'].includes(slot)) fx.leak += 0.04 * (1 - ip.q);
      if (slot === 'tires' || slot === 'wheels') fx.wobble += (0.55 - ip.q);
      if (slot === 'pads' || slot === 'brakes') fx.brake -= 0.1;
      if (slot === 'susp' || slot === 'arb' || slot === 'camber') fx.wobble += (0.55 - ip.q) * 0.6;
    }
  }
  fx.q = q;
  return fx;
}

const _stockCache = {};
function stockPeakPS(model) {
  if (_stockCache[model]) return _stockCache[model];
  const tmp = { model, parts: {}, tune: defaultTune(model), cond: { engine: 1, body: 1, tires: 1, clutch: 1 } };
  const sp = engineCurve(tmp, true);
  _stockCache[model] = { ps: sp.peakPS, t: sp.peakT };
  return _stockCache[model];
}

function engineCurve(c, isStock) {
  const M = CARS[c.model], E = M.engine, t = c.tune;
  const fx = isStock ? { veHigh: 0, veLow: 0, peakShift: 0, limiter: 0, spool: 0, leak: 0 } : partFx(c);
  const hasECU = !!fx.ecu;
  const turboId = fx.turbo || E.turbo;
  const T = turboId ? TURBOS[turboId] : null;
  const stockRef = isStock ? null : stockPeakPS(c.model);
  const peak = E.peakT + fx.peakShift;
  const limiter = hasECU ? t.limiter : E.limiter + 0;
  const shapeLim = E.limiter + 400 + fx.limiter;
  const timing = hasECU ? t.timing : 0;
  const afrT = hasECU ? t.afr : E.afr;
  const octAdj = t.fuel === 'prem' ? 0 : -3;
  let boostT = 0;
  if (T) {
    const stockB = E.stockBoost != null ? E.stockBoost : (fx.boostDefault || 0.45);
    boostT = (hasECU || fx.boostCtrl) ? t.boost : stockB;
    boostT = clamp(boostT, 0, T.maxBoost);
  }
  const icEff = fx.ic || E.ic || (T ? 0.15 : 0);
  const stockBoost = E.stockBoost || 0;
  const stockRise = stockBoost ? 70 * Math.pow(stockBoost, 0.9) * (1 - (E.ic || 0)) : 0;
  const dispScale = Math.sqrt(2.0 / E.disp);
  const s0 = T ? T.spool0 * dispScale + fx.spool : 0, s1 = T ? T.spool1 * dispScale + fx.spool : 1;
  const health = c.cond.engine;
  const healthF = health > 0.6 ? 1 : 0.72 + 0.47 * health;
  const cyl = E.rotary ? 4 : E.cyl;
  const injCap = isStock ? 1e9 : (fx.injPS ? fx.injPS * cyl : stockRef.ps * 1.22);
  const pumpCap = isStock ? 1e9 : (fx.pumpPS || stockRef.ps * 1.4);
  const fuelCap = Math.min(injCap, pumpCap);
  const camNoEcu = fx.veHigh > 0.05 && !hasECU ? 0.96 : 1;

  const pts = [];
  let peakPS = 0, peakPSr = 0, peakT = 0, peakTr = 0, minMargin = 99, maxDuty = 0, knockAny = false, retardAny = false;
  for (let rpm = 1000; rpm <= limiter + 1; rpm += 100) {
    let ve = rpm < peak
      ? E.vePeak * (1 - E.lowDrop * Math.pow((peak - rpm) / (peak - E.idle), 2))
      : E.vePeak * (1 - E.highDrop * Math.pow((rpm - peak) / (shapeLim - peak), 2));
    const x = smooth(peak - 2500, peak + 800, rpm);
    ve += fx.veLow * (1 - x) + fx.veHigh * x;
    if (rpm > shapeLim) ve *= Math.max(0.3, 1 - (rpm - shapeLim) / 1800); // valves float past the design limit
    let boost = T ? boostT * smooth(s0, s1, rpm) : 0;
    const rise = boost > 0 ? 70 * Math.pow(boost, 0.9) * (1 - icEff) : 0;
    const dens = 291 / (291 + rise);
    const pr = 1 + boost * 0.95;
    const tf = timing >= 0 ? 1 + 0.011 * Math.min(timing, 5) - 0.02 * Math.max(0, timing - 5) : 1 + 0.025 * timing;
    let torque = K_TORQUE * E.disp * ve * pr * dens * tf * healthF * (1 - fx.leak) * camNoEcu;
    let ps = torque * rpm / 7023.5;
    if (T && ps > T.flowPS) { // the compressor runs out of breath
      const over = ps - T.flowPS; const f = (T.flowPS + over * 0.25) / ps;
      torque *= f; ps *= f; boost *= f;
    }
    // fuel delivery
    // a naturally aspirated factory ECU has no idea the engine is boosted: it fuels for atmospheric air
    const afrBase = (!E.turbo && T && !hasECU) ? E.afr * pr * dens : afrT;
    const duty = (ps * 12.0 / afrBase) / fuelCap;
    const afr = duty > 1 ? afrBase * duty : afrBase;
    const af = 1 - 0.03 * Math.pow(afr - 12.7, 2);
    torque *= af * (duty > 1 ? 1 / duty : 1); ps = torque * rpm / 7023.5;
    // knock margin
    let m = E.margin + octAdj - timing
      - (E.turbo ? (boost - stockBoost * smooth(s0, s1, rpm)) * 9 : boost * 8.5)
      - (E.turbo ? 0 : (E.comp - 8.5) * 1.6 * boost)
      - Math.max(0, rise - stockRise) * 0.08
      + (E.afr - afr) * 1.6 - Math.max(0, afr - 13.0) * (boost > 0.2 ? 3.5 : 1.2)
      - 1.2 * Math.exp(-Math.pow((rpm - E.peakT) / 1600, 2)) + 1.2;
    let retard = 0;
    if (!hasECU && m < 0.5) { // the factory ECU listens for knock and pulls timing
      retard = Math.min(6, 0.5 - m); m += retard; torque *= 1 - 0.025 * retard; ps = torque * rpm / 7023.5;
      if (retard > 0.3) retardAny = true;
    }
    if (m < 0) knockAny = true;
    minMargin = Math.min(minMargin, m); maxDuty = Math.max(maxDuty, duty);
    if (ps > peakPS) { peakPS = ps; peakPSr = rpm; }
    if (torque > peakT) { peakT = torque; peakTr = rpm; }
    pts.push({ rpm, torque, ps, boost, afr, margin: m, duty, retard, baseT: torque / (pr * dens) });
  }
  return { pts, peakPS, peakPSr, peakT, peakTr, minMargin, maxDuty, knockAny, retardAny, limiter, boostTarget: boostT, turbo: T, s0, s1, icEff, hasECU, fx };
}

function sampleCurve(curve, rpm) {
  const p = curve.pts; const i = clamp(Number.isFinite(rpm) ? (rpm - 1000) / 100 : 0, 0, p.length - 1.001);
  const i0 = Math.floor(i), f = i - i0, a = p[i0], b = p[Math.min(i0 + 1, p.length - 1)];
  return { torque: lerp(a.torque, b.torque, f), boost: lerp(a.boost, b.boost, f), margin: lerp(a.margin, b.margin, f), baseT: lerp(a.baseT, b.baseT, f), afr: lerp(a.afr, b.afr, f) };
}

// Full handling + drivetrain spec used by the race physics and the UI.
function carSpec(c) {
  const M = CARS[c.model], E = M.engine, t = c.tune;
  const curve = engineCurve(c);
  const fx = curve.fx;
  const mass = M.mass + fx.w + 75;
  const susp = c.parts.susp ? PART[c.parts.susp.id].fx : {};
  const coil = !!susp.coilover;
  let lower = susp.lower || 0;
  if (coil) lower = -(t.rideF + t.rideR) / 2000;
  const cgH = M.cgH - lower * 0.8;
  const springF = coil ? t.springF : (susp.springs || 1), springR = coil ? t.springR : (susp.springs || 1);
  const damp = coil ? t.damp : 8;
  const camberF = fx.camber ? t.camberF : -0.8, camberR = fx.camber ? t.camberR : -0.6;
  const toeF = fx.camber ? t.toeF : 0, toeR = fx.camber ? t.toeR : 0.1;
  const arbF = fx.arb ? t.arbF : 3, arbR = fx.arb ? t.arbR : 3;
  let lambda = M.lambda + 0.16 * (springF - springR) / (springF + springR) + 0.035 * (arbF - arbR);
  lambda = clamp(lambda, 0.32, 0.78);
  const tireMu = c.parts.tires ? PART[c.parts.tires.id].fx.tireMu : 1;
  const tireWear = c.parts.tires ? PART[c.parts.tires.id].fx.wear : 1;
  let mu = M.mu * tireMu * (0.84 + 0.16 * c.cond.tires) * (1 + fx.unsprung * 0.5) * (fx.cage ? 1.015 : 1) * (fx.flares ? 1.03 : 1);
  const press = (p) => 1 - 0.12 * Math.pow(p - 2.1, 2);
  const springAvg = (springF + springR) / 2;
  let bump = 1 - 0.0035 * Math.pow(damp - 9, 2) - 0.035 * Math.max(0, springAvg - 1.7);
  if (lower > 0.045) bump -= (lower - 0.045) * 2.2; // bottoming on mountain bumps
  mu *= bump * (1 - 0.04 * fx.wobble);
  const muF = mu * (1 - 0.018 * Math.pow(camberF + 2.6, 2)) * press(t.pressF) * (1 - 0.05 * Math.abs(toeF));
  const muR = mu * (1 - 0.018 * Math.pow(camberR + 1.8, 2)) * press(t.pressR) * (1 - 0.05 * Math.abs(toeR - 0.1));
  const longMuF = 1 - 0.012 * Math.pow(Math.abs(camberF), 1.4);
  const longMuR = 1 - 0.012 * Math.pow(Math.abs(camberR), 1.4);
  const sens = 0.2 * (cgH / 0.5) * (1.12 - 0.08 * springAvg);
  const L = M.wheelbase, a = L * (1 - M.frontW), b = L * M.frontW;
  const stockLsd = { sprint16: 'open', types: 'open', s20t: 'visc', twinr: 'visc', gt4: 'visc', bambina: 'open', mizuchi: 'visc', kamui: 'visc', cresta: 'visc', arashi: 'visc', raijin: 'visc', kagero: '1way', zetto: 'visc', hayate: '1.5way', stella: 'visc', sovereign: 'open' }[c.model] || 'open';
  const lsd = fx.lsd || stockLsd;
  const final = fx.finalKit ? t.final : M.final;
  const sp = stockPeakPS(c.model);
  return {
    c, M, E, curve, mass, L, a, b, cgH, I: mass * a * b * 1.05,
    muF, muR, longMuF, longMuR, lambda, sens,
    Bf: 17 * (1 - toeF * 0.8) * (1 + fx.strut) * (1 + 0.012 * (damp - 8)),
    Br: 20 * (1 + (toeR - 0.1) * 0.8),
    brake: M.brake * (1 + fx.brake), bias: t.bias, hbrake: fx.hbrake || 1,
    gears: M.gears, final, rw: M.rw, cd: M.cd, area: M.area, downforce: fx.downforce,
    layout: M.layout, lsd, steerLock: M.steerLock * (1 + 0.2 * Math.max(0, -toeF)),
    inertia: E.inertia * (fx.inertia || 1), clutchCap: sp.t * 1.3 * (fx.clutch || 1) * (0.7 + 0.3 * c.cond.clutch),
    tireWear, damageMult: fx.cage ? 0.6 : 1, wobble: fx.wobble, lower,
    ps: curve.peakPS, nm: curve.peakT
  };
}

// A dyno pull: 4th gear sweep. Returns the measured curve with a bit of noise.
function dynoRun(c) {
  const curve = engineCurve(c);
  const pts = curve.pts.filter(p => p.rpm >= 2000).map(p => ({
    rpm: p.rpm, ps: p.ps * 0.86 * (1 + (Math.random() - 0.5) * 0.008), nm: p.torque * 0.86 * (1 + (Math.random() - 0.5) * 0.008),
    afr: p.afr + (Math.random() - 0.5) * 0.12, boost: p.boost, knock: p.margin < 0 ? -p.margin : 0, retard: p.retard, duty: p.duty
  }));
  let dmg = 0;
  for (const p of pts) if (p.knock > 0) dmg += 0.0035 * Math.pow(p.knock, 1.6) * 0.12;
  return { pts, dmg, peakPS: Math.max(...pts.map(p => p.ps)), peakNm: Math.max(...pts.map(p => p.nm)), knock: pts.some(p => p.knock > 0), retard: pts.some(p => p.retard > 0.3), maxDuty: curve.maxDuty, t: S.day };
}
