// ===================== CAR SHAPES (shared by the garage drawing and the 3D models) =====================
// Outline: side silhouette from rear-bottom, over the roof, to front-bottom. x: 0 rear .. 1 front, y: 0 ground .. 1 roof.
const SHAPES = {
  sprint16: { H: 1.335, smooth: 1, belt: 0.63, pillar: 0.385, cowl: 0.77, lights: 'rect', tail: 'band', spoiler: null, flare: 0, bumpers: 'dark',
    outline: [[0,0.17],[0,0.34],[0.012,0.37],[0.016,0.52],[0.03,0.56],[0.075,0.6],[0.2,0.92],[0.26,0.985],[0.56,0.985],[0.6,0.955],[0.735,0.65],[0.77,0.625],[0.95,0.57],[0.985,0.54],[1,0.44],[1,0.3],[0.985,0.17]] },
  types: { H: 1.38, smooth: 2, belt: 0.66, pillar: 0.36, cowl: 0.77, lights: 'rect', tail: 'corner', spoiler: 'roof', flare: 0.01, bumpers: 'body',
    outline: [[0,0.17],[0,0.36],[0.008,0.5],[0.02,0.6],[0.06,0.79],[0.12,0.93],[0.2,0.985],[0.5,0.985],[0.56,0.95],[0.73,0.67],[0.77,0.64],[0.92,0.57],[0.975,0.53],[1,0.44],[1,0.29],[0.98,0.16]] },
  s20t: { H: 1.29, smooth: 2, belt: 0.66, pillar: 0.48, cowl: 0.77, lights: 'popup', tail: 'band', spoiler: 'trunk', flare: 0.01, bumpers: 'body',
    outline: [[0,0.19],[0,0.41],[0.01,0.51],[0.03,0.56],[0.16,0.6],[0.2,0.62],[0.31,0.92],[0.37,0.985],[0.57,0.985],[0.61,0.95],[0.73,0.66],[0.77,0.63],[0.965,0.555],[1,0.47],[1,0.31],[0.98,0.18]] },
  twinr: { H: 1.23, smooth: 3, belt: 0.68, pillar: 0.42, cowl: 0.8, lights: 'popup', tail: 'round', spoiler: 'wing', flare: 0.03, bumpers: 'body',
    outline: [[0,0.22],[0,0.46],[0.02,0.57],[0.08,0.63],[0.18,0.65],[0.24,0.71],[0.35,0.93],[0.43,0.985],[0.55,0.985],[0.6,0.94],[0.72,0.67],[0.8,0.61],[0.92,0.53],[0.98,0.46],[1,0.37],[1,0.27],[0.97,0.18]] },
  bambina: { H: 1.4, smooth: 2, belt: 0.62, pillar: 0.36, cowl: 0.83, lights: 'rect', tail: 'corner', spoiler: null, flare: 0, bumpers: 'dark',
    outline: [[0,0.17],[0,0.36],[0.006,0.62],[0.02,0.86],[0.05,0.97],[0.1,1],[0.57,1],[0.63,0.95],[0.79,0.68],[0.83,0.645],[0.96,0.6],[0.995,0.53],[1,0.3],[0.985,0.16]] },
  mizuchi: { H: 1.23, smooth: 3, belt: 0.67, pillar: 0.2, cowl: 0.66, lights: 'popup', tail: 'corner', spoiler: null, flare: 0.01, bumpers: 'body',
    outline: [[0,0.22],[0,0.45],[0.02,0.55],[0.1,0.6],[0.27,0.64],[0.34,0.9],[0.41,0.985],[0.53,0.985],[0.59,0.9],[0.66,0.67],[0.93,0.58],[1,0.49],[1,0.3],[0.97,0.19]] },
  kamui: { H: 1.24, smooth: 2, belt: 0.68, pillar: 0.42, cowl: 0.71, lights: 'popup', tail: 'band', spoiler: 'trunk', flare: 0.02, bumpers: 'body', intake: true,
    outline: [[0,0.22],[0,0.5],[0.02,0.58],[0.1,0.62],[0.2,0.66],[0.3,0.9],[0.4,0.985],[0.55,0.985],[0.61,0.93],[0.71,0.66],[0.94,0.52],[1,0.43],[1,0.29],[0.97,0.18]] },
  cresta: { H: 1.39, smooth: 2, belt: 0.66, pillar: 0.5, cowl: 0.79, lights: 'rect', tail: 'band', spoiler: 'trunk', flare: 0.01, bumpers: 'body', doors: 4,
    outline: [[0,0.19],[0,0.42],[0.01,0.53],[0.03,0.57],[0.19,0.6],[0.24,0.63],[0.33,0.9],[0.39,0.98],[0.61,0.98],[0.66,0.93],[0.76,0.66],[0.79,0.64],[0.965,0.6],[1,0.52],[1,0.3],[0.98,0.18]] },
  arashi: { H: 1.41, smooth: 2, belt: 0.67, pillar: 0.49, cowl: 0.78, lights: 'rect', tail: 'corner', spoiler: 'wing', flare: 0.035, bumpers: 'body', doors: 4, scoop: true,
    outline: [[0,0.2],[0,0.44],[0.01,0.54],[0.03,0.58],[0.17,0.61],[0.22,0.64],[0.31,0.91],[0.37,0.985],[0.6,0.985],[0.65,0.94],[0.75,0.67],[0.78,0.65],[0.96,0.6],[1,0.52],[1,0.29],[0.98,0.17]] },
  raijin: { H: 1.275, smooth: 3, belt: 0.67, pillar: 0.47, cowl: 0.75, lights: 'rect', tail: 'round', spoiler: 'wing', flare: 0.025, bumpers: 'body',
    outline: [[0,0.2],[0,0.47],[0.015,0.56],[0.06,0.6],[0.16,0.63],[0.3,0.92],[0.37,0.985],[0.55,0.985],[0.6,0.94],[0.71,0.66],[0.75,0.63],[0.95,0.55],[1,0.46],[1,0.3],[0.98,0.19]] },
  gt4: { H: 1.34, smooth: 1, belt: 0.665, pillar: 0.47, cowl: 0.78, lights: 'rect', tail: 'round4', spoiler: 'trunk', flare: 0.04, bumpers: 'body',
    outline: [[0,0.2],[0,0.46],[0.01,0.55],[0.03,0.6],[0.2,0.625],[0.23,0.645],[0.32,0.93],[0.37,0.985],[0.59,0.985],[0.63,0.955],[0.74,0.665],[0.78,0.64],[0.96,0.59],[1,0.51],[1,0.3],[0.98,0.19]] },
  kagero: { H: 1.285, smooth: 3, belt: 0.67, pillar: 0.46, cowl: 0.76, lights: 'rect', tail: 'corner', spoiler: 'trunk', flare: 0.015, bumpers: 'body',
    outline: [[0,0.2],[0,0.46],[0.012,0.56],[0.05,0.61],[0.14,0.64],[0.19,0.67],[0.3,0.92],[0.37,0.985],[0.55,0.985],[0.6,0.94],[0.72,0.665],[0.76,0.635],[0.95,0.55],[1,0.46],[1,0.3],[0.98,0.19]] },
  hako: { H: 1.37, smooth: 1, belt: 0.62, pillar: 0.42, cowl: 0.74, lights: 'round4', tail: 'round4', spoiler: null, flare: 0.012, bumpers: 'chrome', fenderMirror: true,
    outline: [[0,0.21],[0,0.4],[0.006,0.57],[0.02,0.605],[0.17,0.625],[0.21,0.65],[0.3,0.93],[0.35,0.985],[0.56,0.985],[0.6,0.95],[0.71,0.65],[0.74,0.625],[0.975,0.6],[1,0.56],[1,0.38],[0.985,0.21]] },
  zetto: { H: 1.25, smooth: 3, belt: 0.67, pillar: 0.4, cowl: 0.72, lights: 'slit', tail: 'band', spoiler: 'trunk', flare: 0.03, bumpers: 'body',
    outline: [[0,0.21],[0,0.47],[0.02,0.57],[0.07,0.62],[0.13,0.66],[0.27,0.92],[0.36,0.985],[0.5,0.985],[0.56,0.94],[0.69,0.67],[0.72,0.645],[0.93,0.54],[0.985,0.47],[1,0.38],[1,0.28],[0.975,0.18]] },
  hayate: { H: 1.17, smooth: 3, belt: 0.68, pillar: 0.46, cowl: 0.7, lights: 'popup', tail: 'band', spoiler: 'wing', flare: 0.03, bumpers: 'body', intake: true,
    outline: [[0,0.22],[0,0.52],[0.02,0.61],[0.12,0.65],[0.27,0.69],[0.38,0.93],[0.45,0.985],[0.56,0.985],[0.61,0.93],[0.7,0.67],[0.93,0.5],[1,0.41],[1,0.28],[0.97,0.18]] },
  stella: { H: 1.47, smooth: 2, belt: 0.63, pillar: 0.5, cowl: 0.78, lights: 'rect', tail: 'corner', spoiler: 'roof', flare: 0.02, bumpers: 'body', doors: 4, scoop: true,
    outline: [[0,0.19],[0,0.42],[0.008,0.56],[0.02,0.66],[0.05,0.9],[0.09,0.97],[0.15,0.985],[0.6,0.985],[0.65,0.94],[0.75,0.66],[0.78,0.635],[0.96,0.58],[1,0.5],[1,0.3],[0.98,0.18]] },
  porter: { H: 1.76, smooth: 1, belt: 0.56, pillar: 0.6, cowl: 0.97, lights: 'round2', tail: 'corner', spoiler: null, flare: 0, bumpers: 'body', bed: true, lampY: 0.43,
    outline: [[0,0.2],[0,0.46],[0.01,0.475],[0.55,0.475],[0.565,0.5],[0.57,0.96],[0.6,1],[0.86,1],[0.9,0.97],[0.985,0.6],[1,0.52],[1,0.3],[0.985,0.2]] },
  sovereign: { H: 1.42, smooth: 2, belt: 0.65, pillar: 0.5, cowl: 0.78, lights: 'rect', tail: 'band', spoiler: null, flare: 0.01, bumpers: 'body', doors: 4, grille: 'chrome',
    outline: [[0,0.2],[0,0.44],[0.01,0.55],[0.03,0.585],[0.2,0.61],[0.245,0.64],[0.33,0.91],[0.39,0.985],[0.6,0.985],[0.65,0.935],[0.75,0.665],[0.78,0.64],[0.965,0.6],[1,0.53],[1,0.31],[0.98,0.19]] }
};

function chaikin(pts, it) {
  let p = pts;
  for (let k = 0; k < it; k++) {
    const q = [p[0]];
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i], b = p[i + 1];
      q.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    q.push(p[p.length - 1]); p = q;
  }
  return p;
}
function polyArea(p) { let a = 0; for (let i = 0; i < p.length; i++) { const u = p[i], v = p[(i + 1) % p.length]; a += u[0] * v[1] - v[0] * u[1]; } return a / 2; }
function polyInset(p, d) { // miter offset toward the inside of a (roughly convex) polygon
  const s = polyArea(p) > 0 ? 1 : -1, n = p.length, out = [];
  const nrm = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [-dy / l * s, dx / l * s]; };
  for (let i = 0; i < n; i++) {
    const a = p[(i - 1 + n) % n], b = p[i], c = p[(i + 1) % n];
    const n1 = nrm(a, b), n2 = nrm(b, c), k = 1 + n1[0] * n2[0] + n1[1] * n2[1];
    if (k < 0.2) continue;
    out.push([b[0] + d * (n1[0] + n2[0]) / k, b[1] + d * (n1[1] + n2[1]) / k]);
  }
  return out;
}
function polyClip(p, keep) { // Sutherland-Hodgman against a half-plane given as signed distance fn
  const out = [];
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length], da = keep(a), db = keep(b);
    if (da >= 0) out.push(a);
    if ((da >= 0) !== (db >= 0)) { const t = da / (da - db); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
  }
  return out;
}

const _shapeCache = {};
// Returns the silhouette in metres: z along the car (rear -, front +), y up from the ground.
function carShape(model, lower) {
  const key = model + ':' + (lower || 0).toFixed(3);
  if (_shapeCache[key]) return _shapeCache[key];
  const M = CARS[model], D = SHAPES[model], L = M.length, H = D.H;
  const drop = clamp(lower || 0, -0.02, 0.07) * 0.9;
  let up = chaikin(D.outline, D.smooth).map(([x, y]) => [(x - 0.5) * L, y * H - drop]);
  const r = M.rw, ra = r + 0.045;
  const zr = -M.wheelbase / 2 + 0.012 * L, zf = zr + M.wheelbase;
  const yb = Math.min(up[0][1], up[up.length - 1][1]);
  const arch = (zc) => {
    const t0 = Math.asin(clamp((yb - r) / ra, -0.95, 0.95)), pts = [];
    for (let k = 0; k <= 12; k++) { const t = t0 + (Math.PI - 2 * t0) * k / 12; pts.push([zc + ra * Math.cos(t), r + ra * Math.sin(t)]); }
    return pts;
  };
  const bottom = [...arch(zf), ...arch(zr)];
  const outline = up.concat(bottom);
  const underFrom = up.length - 1; // edges from here to the end (wrapping to 0) are underbody
  // side glass: the greenhouse above the belt, inset for the window frame, split at the B-pillar
  const beltY = D.belt * H - drop, gh = [];
  for (let i = 0; i < up.length - 1; i++) {
    const a = up[i], b = up[i + 1];
    if (a[1] >= beltY) gh.push(a);
    if ((a[1] >= beltY) !== (b[1] >= beltY)) { const t = (beltY - a[1]) / (b[1] - a[1]); gh.push([a[0] + (b[0] - a[0]) * t, beltY]); }
  }
  let glassAll = polyInset(gh, 0.065);
  const pz = (D.pillar - 0.5) * L, pw = 0.075;
  const glass = [polyClip(glassAll, p => (pz - pw / 2) - p[0]), polyClip(glassAll, p => p[0] - (pz + pw / 2))].filter(g => g.length >= 3);
  const res = { M, D, L, W: M.width, H, drop, outline, up, underFrom, glass, wheels: { zr, zf, r, ra }, beltY, cowlZ: (D.cowl - 0.5) * L, pillarZ: pz, roofY: Math.max(...up.map(p => p[1])) };
  _shapeCache[key] = res;
  return res;
}
// height of the upper silhouette at a given z (top surface)
function shapeTopAt(sh, z) {
  let best = 0;
  for (let i = 0; i < sh.up.length - 1; i++) {
    const a = sh.up[i], b = sh.up[i + 1];
    if ((a[0] - z) * (b[0] - z) <= 0 && a[0] !== b[0]) { const t = (z - a[0]) / (b[0] - a[0]); best = Math.max(best, a[1] + (b[1] - a[1]) * t); }
  }
  return best;
}

// 3D wheel centres. n spokes, widths as a fraction of the rim radius at the hub (w0) and at the rim (w1).
const WHEEL_STYLES = {
  stock: { dish: 0.012 }, fan: { dish: 0.006 }, long: { dish: 0.02 },
  mesh: { n: 10, pair: 0.36, w0: 0.045, w1: 0.04, t: 0.02, lean: 0.012, color: 0xc8c3b4, dish: 0.03, rim: 0.86, metal: 0.8 },
  spoke: { n: 5, w0: 0.26, w1: 0.2, t: 0.032, lean: 0.03, color: 0xb8823c, dish: 0.014, metal: 0.75 },
  te: { n: 6, w0: 0.17, w1: 0.13, t: 0.03, lean: 0.035, color: 0x33363c, dish: 0.012, metal: 0.6 },
  dish: { n: 8, w0: 0.1, w1: 0.08, t: 0.022, lean: 0.004, color: 0xc99b3c, dish: 0.06, rim: 0.7, metal: 0.85 },
  white: { n: 6, w0: 0.26, w1: 0.24, t: 0.03, lean: 0.012, color: 0xf2f2ee, dish: 0.012, metal: 0.05, rough: 0.5 },
  wat: { n: 8, w0: 0.17, w1: 0.11, t: 0.03, lean: 0.03, color: 0x1b1c20, dish: 0.035, rim: 0.88, metal: 0.4 },
  star: { n: 5, w0: 0.5, w1: 0.1, t: 0.026, lean: 0.016, color: 0xd0d3d8, dish: 0.03, rim: 0.86, metal: 0.9 }
};
