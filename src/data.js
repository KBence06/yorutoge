// ===================== DATA =====================
// Every car, brand, team and place here is fictional, built to feel like the era.
const G = 9.81;

const CARS = {
  sprint16: {
    name: 'Kazane Sprint 16', year: 1985, layout: 'FR', body: 'hatch', price: 420000,
    blurb: 'Könnyű, ötvenes súlyelosztású ferdehátú. Kevés erő, sok tanulnivaló.',
    mass: 950, wheelbase: 2.40, frontW: 0.53, cgH: 0.50, length: 4.18, width: 1.63,
    engine: { label: '1.6 DOHC 16V szívó', disp: 1.6, cyl: 4, rotary: false, turbo: null, comp: 9.4,
      idle: 900, peakT: 5200, limiter: 7800, vePeak: 1.0, lowDrop: 0.38, highDrop: 0.44, margin: 3.2, octane: 98, afr: 12.8, inertia: 1.0 },
    gears: [3.587, 2.022, 1.384, 1.0, 0.861], final: 4.30, rw: 0.29, cd: 0.36, area: 1.75,
    mu: 0.98, brake: 0.95, steerLock: 0.58, lambda: 0.54, lugs: 4, lugTorque: 103, paint: '#e9e6dc'
  },
  types: {
    name: 'Koyo Civetta Type-S', year: 1996, layout: 'FF', body: 'ffhatch', price: 1450000,
    blurb: 'Magasfordulatú 1.6, 8400-ig pörög. Elsőkerék-hajtás, éles kanyarbevétel.',
    mass: 1080, wheelbase: 2.62, frontW: 0.62, cgH: 0.52, length: 4.18, width: 1.69,
    engine: { label: '1.6 DOHC változó szelepvezérlés', disp: 1.6, cyl: 4, rotary: false, turbo: null, comp: 10.4,
      idle: 950, peakT: 7400, limiter: 8600, vePeak: 1.11, lowDrop: 0.42, highDrop: 0.2, margin: 2.4, octane: 98, afr: 12.8, inertia: 0.9 },
    gears: [3.230, 2.105, 1.458, 1.107, 0.848], final: 4.40, rw: 0.30, cd: 0.34, area: 1.85,
    mu: 1.0, brake: 1.0, steerLock: 0.56, lambda: 0.56, lugs: 4, lugTorque: 108, paint: '#c8202a'
  },
  s20t: {
    name: 'Rindo S20 Turbo', year: 1989, layout: 'FR', body: 'coupe', price: 1150000,
    blurb: 'Kétliteres turbó, hosszú motorháztető. A touge-sok kedvence driftre.',
    mass: 1220, wheelbase: 2.48, frontW: 0.55, cgH: 0.50, length: 4.52, width: 1.69,
    engine: { label: '2.0 DOHC turbó', disp: 2.0, cyl: 4, rotary: false, turbo: 'stock_s20', comp: 8.5,
      idle: 850, peakT: 4000, limiter: 7200, vePeak: 1.06, lowDrop: 0.40, highDrop: 0.46, margin: 3.0, octane: 98, afr: 11.6, inertia: 1.1,
      stockBoost: 0.6, ic: 0.5 },
    gears: [3.321, 1.902, 1.308, 1.0, 0.759], final: 4.083, rw: 0.30, cd: 0.33, area: 1.86,
    mu: 1.0, brake: 1.0, steerLock: 0.58, lambda: 0.55, lugs: 4, lugTorque: 108, paint: '#2a4f9a'
  },
  twinr: {
    name: 'Sakaki Hiun Twin-R', year: 1992, layout: 'FR', body: 'popup', price: 2600000,
    blurb: 'Kétrotoros, sorosan kapcsolt ikerturbó. Gyönyörű és törékeny.',
    mass: 1270, wheelbase: 2.43, frontW: 0.51, cgH: 0.46, length: 4.28, width: 1.76,
    engine: { label: '1.3 kétrotoros ikerturbó', disp: 2.1, cyl: 2, rotary: true, turbo: 'stock_twinr', comp: 9.0,
      idle: 800, peakT: 5000, limiter: 8000, vePeak: 1.05, lowDrop: 0.36, highDrop: 0.5, margin: 2.6, octane: 98, afr: 11.4, inertia: 0.8,
      stockBoost: 0.7, ic: 0.55 },
    gears: [3.483, 2.015, 1.391, 1.0, 0.719], final: 4.10, rw: 0.31, cd: 0.31, area: 1.80,
    mu: 1.02, brake: 1.05, steerLock: 0.56, lambda: 0.53, lugs: 5, lugTorque: 110, paint: '#141418'
  },
  gt4: {
    name: 'Tsurugi GT-4 2.6TT', year: 1993, layout: 'AWD', body: 'gt', price: 4900000,
    blurb: 'Hatküllős ikerturbó, intelligens összkerék. Nehéz, de mindenhol tapad.',
    mass: 1430, wheelbase: 2.62, frontW: 0.59, cgH: 0.52, length: 4.55, width: 1.76,
    engine: { label: '2.6 soros hat ikerturbó', disp: 2.6, cyl: 6, rotary: false, turbo: 'stock_gt4', comp: 8.5,
      idle: 850, peakT: 4400, limiter: 8000, vePeak: 0.915, lowDrop: 0.38, highDrop: 0.42, margin: 3.4, octane: 98, afr: 11.5, inertia: 1.2,
      stockBoost: 0.75, ic: 0.6 },
    gears: [3.214, 1.925, 1.302, 1.0, 0.752], final: 4.111, rw: 0.31, cd: 0.34, area: 1.95,
    mu: 1.02, brake: 1.08, steerLock: 0.54, lambda: 0.57, lugs: 5, lugTorque: 118, paint: '#5d6066'
  },
  bambina: {
    name: 'Hoshino Bambina 660 Turbo', year: 1991, layout: 'FF', body: 'kei', price: 280000,
    blurb: 'Kei-autó 64 lóerővel. Olcsó, könnyű, és a hajtűben senki nem veszi komolyan. Pedig kéne.',
    mass: 690, wheelbase: 2.36, frontW: 0.62, cgH: 0.55, length: 3.295, width: 1.395,
    engine: { label: '0.66 háromhengeres turbó', disp: 0.66, cyl: 3, rotary: false, turbo: 'stock_kei', comp: 8.3,
      idle: 950, peakT: 4400, limiter: 8500, vePeak: 0.792, lowDrop: 0.4, highDrop: 0.42, margin: 3.0, octane: 98, afr: 11.6, inertia: 0.75,
      stockBoost: 0.8, ic: 0.4 },
    gears: [3.307, 1.944, 1.344, 1.0, 0.786], final: 5.39, rw: 0.27, cd: 0.38, area: 1.72,
    mu: 0.95, brake: 0.92, steerLock: 0.6, lambda: 0.58, lugs: 4, lugTorque: 90, paint: '#d9a21b'
  },
  mizuchi: {
    name: 'Kazane Mizuchi 1.8', year: 1994, layout: 'FR', body: 'roadster', price: 950000,
    blurb: 'Könnyű roadster keménytetővel. Kevés erő, tökéletes egyensúly, bukólámpa.',
    mass: 990, wheelbase: 2.265, frontW: 0.52, cgH: 0.46, length: 3.95, width: 1.675,
    engine: { label: '1.8 DOHC szívó', disp: 1.8, cyl: 4, rotary: false, turbo: null, comp: 9.0,
      idle: 850, peakT: 5000, limiter: 7200, vePeak: 0.978, lowDrop: 0.36, highDrop: 0.42, margin: 3.0, octane: 98, afr: 12.8, inertia: 0.95 },
    gears: [3.136, 1.888, 1.33, 1.0, 0.814], final: 4.3, rw: 0.29, cd: 0.38, area: 1.7,
    mu: 0.99, brake: 0.97, steerLock: 0.6, lambda: 0.53, lugs: 4, lugTorque: 103, paint: '#1f5c3e'
  },
  kamui: {
    name: 'Sakaki Kamui MR 2.0T', year: 1993, layout: 'MR', body: 'mr', price: 2200000,
    blurb: 'Középmotoros turbós ék. Gyorsan fordul, és még gyorsabban pördül, ha elveszed a gázt kanyarban.',
    mass: 1260, wheelbase: 2.4, frontW: 0.43, cgH: 0.46, length: 4.17, width: 1.695,
    engine: { label: '2.0 DOHC turbó, középen', disp: 2.0, cyl: 4, rotary: false, turbo: 'stock_kamui', comp: 8.8,
      idle: 850, peakT: 4600, limiter: 7200, vePeak: 1.142, lowDrop: 0.4, highDrop: 0.44, margin: 3.0, octane: 98, afr: 11.6, inertia: 1.0,
      stockBoost: 0.7, ic: 0.5 },
    gears: [3.23, 1.913, 1.258, 0.918, 0.731], final: 4.285, rw: 0.3, cd: 0.31, area: 1.78,
    mu: 1.03, brake: 1.04, steerLock: 0.56, lambda: 0.5, lugs: 5, lugTorque: 103, paint: '#c8202a'
  },
  cresta: {
    name: 'Tsurugi Cresta 2.5 Tourer', year: 1996, layout: 'FR', body: 'sedan', price: 1900000,
    blurb: 'Négyajtós szedán soros hattal és turbóval. Az apukák kocsija, a driftesek álma.',
    mass: 1480, wheelbase: 2.73, frontW: 0.54, cgH: 0.53, length: 4.75, width: 1.755,
    engine: { label: '2.5 soros hat turbó', disp: 2.5, cyl: 6, rotary: false, turbo: 'stock_cresta', comp: 8.5,
      idle: 750, peakT: 4200, limiter: 7200, vePeak: 1.123, lowDrop: 0.38, highDrop: 0.42, margin: 3.2, octane: 98, afr: 11.5, inertia: 1.15,
      stockBoost: 0.6, ic: 0.55 },
    gears: [3.251, 1.955, 1.31, 1.0, 0.753], final: 3.916, rw: 0.315, cd: 0.33, area: 2.05,
    mu: 1.0, brake: 1.02, steerLock: 0.55, lambda: 0.55, lugs: 5, lugTorque: 103, paint: '#2b2f36'
  },
  arashi: {
    name: 'Rindo Arashi RS Evo', year: 1998, layout: 'AWD', body: 'rally', price: 3100000,
    blurb: 'Rallyból lett utcai fegyver. Összkerék, rövid váltó, nagy szárny, kemény futómű.',
    mass: 1280, wheelbase: 2.51, frontW: 0.6, cgH: 0.52, length: 4.35, width: 1.77,
    engine: { label: '2.0 DOHC turbó, rally', disp: 2.0, cyl: 4, rotary: false, turbo: 'stock_arashi', comp: 8.8,
      idle: 900, peakT: 4000, limiter: 7500, vePeak: 1.18, lowDrop: 0.38, highDrop: 0.44, margin: 3.0, octane: 98, afr: 11.4, inertia: 0.95,
      stockBoost: 0.95, ic: 0.62 },
    gears: [2.785, 1.95, 1.407, 1.031, 0.761], final: 4.529, rw: 0.31, cd: 0.35, area: 2.0,
    mu: 1.04, brake: 1.08, steerLock: 0.56, lambda: 0.56, lugs: 5, lugTorque: 103, paint: '#e9e6dc'
  },
  raijin: {
    name: 'Koyo Raijin 3.0 Twin Turbo', year: 1994, layout: 'FR', body: 'gtcoupe', price: 5600000,
    blurb: 'Háromliteres ikerturbó, hatfokozatú váltó. Gyárilag 280 lóerő, és a blokk ennek a háromszorosát is kibírja.',
    mass: 1510, wheelbase: 2.55, frontW: 0.54, cgH: 0.5, length: 4.52, width: 1.81,
    engine: { label: '3.0 soros hat ikerturbó', disp: 3.0, cyl: 6, rotary: false, turbo: 'stock_raijin', comp: 8.5,
      idle: 750, peakT: 4000, limiter: 6800, vePeak: 0.94, lowDrop: 0.36, highDrop: 0.4, margin: 3.4, octane: 98, afr: 11.5, inertia: 1.2,
      stockBoost: 0.65, ic: 0.65 },
    gears: [3.827, 2.36, 1.685, 1.312, 1.0, 0.793], final: 3.538, rw: 0.325, cd: 0.32, area: 1.98,
    mu: 1.04, brake: 1.1, steerLock: 0.54, lambda: 0.55, lugs: 5, lugTorque: 103, paint: '#d9a21b'
  },
  kagero: {
    name: 'Rindo Kagerō Spec-R', year: 1999, layout: 'FR', body: 'coupe2', price: 2400000,
    blurb: 'Az S20 utódja: merevebb kaszni, hatfokozatú váltó, gyári önzáró. A drift-videók főszereplője.',
    mass: 1240, wheelbase: 2.525, frontW: 0.55, cgH: 0.49, length: 4.445, width: 1.695,
    engine: { label: '2.0 DOHC turbó, golyóscsapágyas', disp: 2.0, cyl: 4, rotary: false, turbo: 'stock_kagero', comp: 8.5,
      idle: 850, peakT: 4800, limiter: 7300, vePeak: 1.1, lowDrop: 0.4, highDrop: 0.42, margin: 3.0, octane: 98, afr: 11.6, inertia: 1.0,
      stockBoost: 0.75, ic: 0.55 },
    gears: [3.626, 2.2, 1.541, 1.213, 1.0, 0.767], final: 3.692, rw: 0.31, cd: 0.33, area: 1.88,
    mu: 1.02, brake: 1.04, steerLock: 0.6, lambda: 0.55, lugs: 5, lugTorque: 108, paint: '#d9a21b'
  },
  hako: {
    name: 'Kazane GT-2000 „Hako”', year: 1971, layout: 'FR', body: 'kyusha', price: 3600000,
    blurb: 'Szögletes legenda a hetvenes évekből: soros hat, három karburátor, króm lökhárító. Nincs ABS, nincs szervó, nincs kegyelem.',
    mass: 1100, wheelbase: 2.57, frontW: 0.56, cgH: 0.53, length: 4.33, width: 1.665,
    engine: { label: '2.0 soros hat DOHC, karburátoros', disp: 2.0, cyl: 6, rotary: false, turbo: null, comp: 9.5,
      idle: 950, peakT: 5600, limiter: 7500, vePeak: 1.0, lowDrop: 0.42, highDrop: 0.4, margin: 3.0, octane: 98, afr: 12.6, inertia: 1.05 },
    gears: [2.957, 1.858, 1.311, 1.0, 0.852], final: 4.444, rw: 0.3, cd: 0.42, area: 1.85,
    mu: 0.94, brake: 0.88, steerLock: 0.6, lambda: 0.54, lugs: 4, lugTorque: 98, paint: '#9aa0a8'
  },
  zetto: {
    name: 'Tsurugi Zetto 300 Twin Turbo', year: 1990, layout: 'FR', body: 'zcoupe', price: 3300000,
    blurb: 'Széles, lapos, nehéz. V6 ikerturbó és négykerék-kormányzás: autópályára született, de a hegyet is megtanulta.',
    mass: 1520, wheelbase: 2.45, frontW: 0.55, cgH: 0.48, length: 4.31, width: 1.79,
    engine: { label: '3.0 V6 DOHC ikerturbó', disp: 3.0, cyl: 6, rotary: false, turbo: 'stock_zetto', comp: 8.5,
      idle: 750, peakT: 3800, limiter: 7000, vePeak: 0.965, lowDrop: 0.36, highDrop: 0.44, margin: 3.2, octane: 98, afr: 11.5, inertia: 1.15,
      stockBoost: 0.65, ic: 0.55 },
    gears: [3.214, 1.925, 1.302, 1.0, 0.752], final: 3.692, rw: 0.32, cd: 0.31, area: 1.92,
    mu: 1.03, brake: 1.08, steerLock: 0.54, lambda: 0.55, lugs: 5, lugTorque: 108, paint: '#8e1420'
  },
  hayate: {
    name: 'Koyo Hayate NS-R', year: 1992, layout: 'MR', body: 'super', price: 7800000,
    blurb: 'Alumínium kaszni, középmotoros V6, 8000-es fordulat. A gyár azt mondta, mindennapos szuperautó. A hegy azt mondja, hibát nem bocsát meg.',
    mass: 1270, wheelbase: 2.53, frontW: 0.42, cgH: 0.44, length: 4.43, width: 1.81,
    engine: { label: '3.0 V6 DOHC változó szelepvezérlés, középen', disp: 3.0, cyl: 6, rotary: false, turbo: null, comp: 10.2,
      idle: 800, peakT: 6400, limiter: 8200, vePeak: 1.005, lowDrop: 0.36, highDrop: 0.3, margin: 2.6, octane: 98, afr: 12.8, inertia: 0.9 },
    gears: [3.071, 1.952, 1.4, 1.033, 0.771], final: 4.235, rw: 0.315, cd: 0.32, area: 1.78,
    mu: 1.06, brake: 1.12, steerLock: 0.54, lambda: 0.5, lugs: 5, lugTorque: 108, paint: '#c8202a'
  },
  stella: {
    name: 'Hoshino Stella GT-B Wagon', year: 1997, layout: 'AWD', body: 'wagon', price: 2300000,
    blurb: 'Kombi boxermotorral és ikerturbóval. Hátul elfér négy gumi és egy emelő, elöl 280 lóerő.',
    mass: 1460, wheelbase: 2.63, frontW: 0.58, cgH: 0.53, length: 4.68, width: 1.695,
    engine: { label: '2.0 boxer ikerturbó', disp: 2.0, cyl: 4, rotary: false, turbo: 'stock_stella', comp: 8.5,
      idle: 800, peakT: 4400, limiter: 7200, vePeak: 1.23, lowDrop: 0.4, highDrop: 0.46, margin: 2.9, octane: 98, afr: 11.4, inertia: 1.0,
      stockBoost: 0.9, ic: 0.55 },
    gears: [3.166, 1.882, 1.296, 0.972, 0.738], final: 4.444, rw: 0.305, cd: 0.34, area: 2.02,
    mu: 1.01, brake: 1.04, steerLock: 0.55, lambda: 0.56, lugs: 5, lugTorque: 98, paint: '#16264f'
  },
  porter: {
    name: 'Hoshino Porter 660', year: 1990, layout: 'MR', body: 'keitruck', price: 180000,
    blurb: 'Kei-kisteherautó, a motor az ülés alatt. Negyvenhat lóerő, hátsókerék-hajtás, üres plató: a parkolóban mindenki röhög, amíg el nem kezd csúszni.',
    mass: 700, wheelbase: 1.87, frontW: 0.5, cgH: 0.62, length: 3.295, width: 1.395,
    engine: { label: '0.66 háromhengeres szívó', disp: 0.66, cyl: 3, rotary: false, turbo: null, comp: 10.0,
      idle: 950, peakT: 4800, limiter: 7800, vePeak: 0.9, lowDrop: 0.36, highDrop: 0.45, margin: 3.2, octane: 98, afr: 12.8, inertia: 0.75 },
    gears: [4.0, 2.31, 1.52, 1.07, 0.87], final: 5.6, rw: 0.255, cd: 0.46, area: 2.05,
    mu: 0.92, brake: 0.88, steerLock: 0.66, lambda: 0.56, lugs: 4, lugTorque: 85, paint: '#e9e6dc'
  },
  sovereign: {
    name: 'Tsurugi Sovereign 4.0 V8', year: 1995, layout: 'FR', body: 'vip', price: 2700000,
    blurb: 'Elnöki limuzin V8-cal. Ültetve, mélytányéros felnin, fekete fóliával: ez a VIP stílus. Kanyarban hajó, egyenesben gőzmozdony.',
    mass: 1750, wheelbase: 2.85, frontW: 0.55, cgH: 0.54, length: 4.995, width: 1.83,
    engine: { label: '4.0 V8 DOHC szívó', disp: 4.0, cyl: 8, rotary: false, turbo: null, comp: 10.4,
      idle: 650, peakT: 4400, limiter: 6500, vePeak: 1.0, lowDrop: 0.3, highDrop: 0.42, margin: 3.2, octane: 98, afr: 12.8, inertia: 1.3 },
    gears: [2.804, 1.531, 1.0, 0.705], final: 3.615, rw: 0.325, cd: 0.3, area: 2.15,
    mu: 0.99, brake: 1.05, steerLock: 0.56, lambda: 0.56, lugs: 5, lugTorque: 103, paint: '#141418'
  },
  hibiki: {
    name: 'Koyo Hibiki 2000 VT', year: 1999, layout: 'FR', body: 'roadster', price: 2900000,
    blurb: 'Nyitott kétüléses, a motor a tengely mögött ül. Kilencezerig forog, és hatezer alatt nem történik semmi: ezt a kocsit váltani kell.',
    mass: 1250, wheelbase: 2.4, frontW: 0.5, cgH: 0.45, length: 4.135, width: 1.75,
    engine: { label: '2.0 DOHC VT szívó', disp: 2.0, cyl: 4, rotary: false, turbo: null, comp: 11.7,
      idle: 900, peakT: 7500, limiter: 9000, vePeak: 1.18, lowDrop: 0.5, highDrop: 0.3, margin: 2.6, octane: 98, afr: 12.8, inertia: 0.85 },
    gears: [3.133, 2.045, 1.481, 1.161, 0.971, 0.811], final: 4.1, rw: 0.305, cd: 0.35, area: 1.75,
    mu: 1.03, brake: 1.03, steerLock: 0.58, lambda: 0.52, lugs: 5, lugTorque: 108, paint: '#d6d3cc'
  },
  savanna: {
    name: 'Sakaki Savanna Turbo II', year: 1987, layout: 'FR', body: 'popup', price: 1350000,
    blurb: 'Ék alakú nyolcvanas évek, kétrotoros turbóval. A Hiun elődje: nyersebb, olcsóbb, és a drifteseknél ma is alapdarab.',
    mass: 1240, wheelbase: 2.43, frontW: 0.51, cgH: 0.47, length: 4.31, width: 1.69,
    engine: { label: '1.3 kétrotoros turbó', disp: 2.1, cyl: 2, rotary: true, turbo: 'stock_savanna', comp: 8.5,
      idle: 800, peakT: 4500, limiter: 7500, vePeak: 0.95, lowDrop: 0.38, highDrop: 0.5, margin: 2.8, octane: 98, afr: 11.4, inertia: 0.8,
      stockBoost: 0.55, ic: 0.45 },
    gears: [3.475, 2.002, 1.366, 1.0, 0.711], final: 4.1, rw: 0.3, cd: 0.31, area: 1.78,
    mu: 0.99, brake: 0.98, steerLock: 0.58, lambda: 0.53, lugs: 5, lugTorque: 108, paint: '#b81d26'
  },
  koma: {
    name: 'Hoshino Koma 660 MR', year: 1992, layout: 'MR', body: 'keisport', price: 780000,
    blurb: 'Kei-sportkocsi középmotorral: hétszázhúsz kiló, hatvannégy lóerő, a feneked tíz centire az aszfalttól. Gokart rendszámmal.',
    mass: 720, wheelbase: 2.235, frontW: 0.44, cgH: 0.44, length: 3.295, width: 1.395,
    engine: { label: '0.66 háromhengeres turbó', disp: 0.66, cyl: 3, rotary: false, turbo: 'stock_kei', comp: 8.3,
      idle: 950, peakT: 4400, limiter: 9000, vePeak: 0.792, lowDrop: 0.4, highDrop: 0.4, margin: 3.0, octane: 98, afr: 11.6, inertia: 0.75,
      stockBoost: 0.8, ic: 0.4 },
    gears: [3.478, 2.021, 1.352, 0.978, 0.769], final: 5.13, rw: 0.275, cd: 0.36, area: 1.5,
    mu: 1.0, brake: 0.96, steerLock: 0.6, lambda: 0.5, lugs: 4, lugTorque: 90, paint: '#2a4f9a'
  },
  hakobune: {
    name: 'Tsurugi Hakobune 2.4 Van', year: 1994, layout: 'FR', body: 'van', price: 520000,
    blurb: 'Egyterű furgon, a motoron ülsz. Ültetve, mélytányéros felnin, hátul hangfalfallal ez a vanning. Kanyarban úgy dől, mint egy komp.',
    mass: 1650, wheelbase: 2.57, frontW: 0.54, cgH: 0.72, length: 4.69, width: 1.69,
    engine: { label: '2.4 soros négyes szívó', disp: 2.4, cyl: 4, rotary: false, turbo: null, comp: 9.0,
      idle: 750, peakT: 3800, limiter: 5800, vePeak: 0.9, lowDrop: 0.25, highDrop: 0.5, margin: 3.2, octane: 98, afr: 12.8, inertia: 1.2 },
    gears: [3.928, 2.333, 1.451, 1.0, 0.851], final: 4.3, rw: 0.33, cd: 0.44, area: 2.9,
    mu: 0.9, brake: 0.9, steerLock: 0.62, lambda: 0.58, lugs: 5, lugTorque: 110, paint: '#e9e6dc'
  },
  celeste: {
    name: 'Kazane Celeste 1600 GT', year: 1975, layout: 'FR', body: 'kyusha', price: 880000,
    blurb: 'Hetvenes évekbeli liftback két karburátorral és krómmal. A kaido racerek kedvenc alapja: olcsó, könnyű, és minden rá van hegesztve, ami nem mozog.',
    mass: 965, wheelbase: 2.425, frontW: 0.55, cgH: 0.5, length: 4.2, width: 1.62,
    engine: { label: '1.6 DOHC, ikerkarburátoros', disp: 1.6, cyl: 4, rotary: false, turbo: null, comp: 9.8,
      idle: 950, peakT: 5200, limiter: 7200, vePeak: 0.93, lowDrop: 0.42, highDrop: 0.42, margin: 3.0, octane: 98, afr: 12.6, inertia: 0.95 },
    gears: [3.587, 2.022, 1.384, 1.0, 0.861], final: 4.3, rw: 0.29, cd: 0.4, area: 1.75,
    mu: 0.93, brake: 0.86, steerLock: 0.6, lambda: 0.54, lugs: 4, lugTorque: 98, paint: '#f07a1a'
  }
};

// Turbochargers. Spool figures are for a 2.0 litre engine and scale with displacement.
const TURBOS = {
  stock_s20:   { name: 'Gyári turbó', spool0: 2400, spool1: 3600, maxBoost: 0.85, flowPS: 250 },
  stock_twinr: { name: 'Gyári sorosan kapcsolt ikerturbó', spool0: 1900, spool1: 3200, maxBoost: 0.95, flowPS: 330 },
  stock_gt4:   { name: 'Gyári ikerturbó', spool0: 2400, spool1: 3700, maxBoost: 1.0, flowPS: 380 },
  stock_kei:   { name: 'Gyári mini turbó', spool0: 1500, spool1: 2300, maxBoost: 1.2, flowPS: 88 },
  stock_kamui: { name: 'Gyári turbó', spool0: 2500, spool1: 3700, maxBoost: 1.05, flowPS: 300 },
  stock_cresta: { name: 'Gyári turbó', spool0: 2400, spool1: 3500, maxBoost: 1.1, flowPS: 400 },
  stock_arashi: { name: 'Gyári twin-scroll turbó', spool0: 2300, spool1: 3300, maxBoost: 1.3, flowPS: 360 },
  stock_raijin: { name: 'Gyári sorosan kapcsolt ikerturbó', spool0: 2000, spool1: 3200, maxBoost: 1.4, flowPS: 600 },
  stock_kagero: { name: 'Gyári golyóscsapágyas turbó', spool0: 2200, spool1: 3300, maxBoost: 1.2, flowPS: 340 },
  stock_zetto: { name: 'Gyári ikerturbó', spool0: 2100, spool1: 3300, maxBoost: 1.1, flowPS: 420 },
  stock_savanna: { name: 'Gyári turbó', spool0: 2600, spool1: 3900, maxBoost: 0.9, flowPS: 260 },
  stock_stella: { name: 'Gyári szekvenciális ikerturbó', spool0: 2000, spool1: 3200, maxBoost: 1.25, flowPS: 370 },
  kt18:        { name: 'KT-18', spool0: 2300, spool1: 3400, maxBoost: 1.0, flowPS: 270 },
  kt22:        { name: 'KT-22', spool0: 2900, spool1: 4200, maxBoost: 1.3, flowPS: 360 },
  kt28:        { name: 'KT-28', spool0: 3600, spool1: 5100, maxBoost: 1.6, flowPS: 500 }
};

const SLOTS = {
  intake: 'Szívórendszer', header: 'Leömlő', exhaust: 'Kipufogó', cam: 'Vezérműtengely', ecu: 'ECU',
  boost: 'Töltőnyomás-szabályzó', turbo: 'Turbó', ic: 'Intercooler', inj: 'Injektorok', pump: 'Üzemanyag-szivattyú',
  flywheel: 'Lendkerék', clutch: 'Kuplung', lsd: 'Önzáró differenciálmű', final: 'Végáttétel', susp: 'Rugózás',
  arb: 'Stabilizátorok', camber: 'Dőlésállítás', strut: 'Toronymerevítő', pads: 'Fékbetét', brakes: 'Fékrendszer',
  hbrake: 'Kézifék', tires: 'Gumik', wheels: 'Felnik', cage: 'Bukócső', seat: 'Ülés', interior: 'Belső tér',
  hood: 'Motorháztető', wing: 'Hátsó szárny', kit: 'Karosszéria-kit', decal: 'Matrica',
  flares: 'Sárvédő-szélesítés', lights: 'Fényszóró', tail: 'Hátsó lámpa', tint: 'Ablakfólia', banner: 'Szélvédőcsík', neon: 'Neon underglow',
  bumper: 'Első lökhárító', canards: 'Kanárdok', diffuser: 'Diffúzor', roof: 'Tető', louver: 'Hátsóablak-zsalu', mirrors: 'Tükrök', pipes: 'Kipufogóvég',
  pod: 'Lámpasor', towhook: 'Vonószem', oilcooler: 'Olajhűtő', tirelet: 'Gumifelirat', intneon: 'Belső fény', nos: 'Nitro', charm: 'Lógó dísz'
};

const CATS = [
  { id: 'motor', name: 'Motor', jp: 'エンジン', slots: ['intake', 'header', 'exhaust', 'cam', 'ecu', 'flywheel'] },
  { id: 'turbo', name: 'Turbó és üzemanyag', jp: 'ターボ', slots: ['turbo', 'boost', 'ic', 'inj', 'pump', 'nos'] },
  { id: 'hajtas', name: 'Erőátvitel', jp: 'ドライブ', slots: ['clutch', 'lsd', 'final'] },
  { id: 'futomu', name: 'Futómű', jp: 'サス', slots: ['susp', 'arb', 'camber', 'strut'] },
  { id: 'fek', name: 'Fék és gumi', jp: 'ブレーキ', slots: ['pads', 'brakes', 'hbrake', 'tires'] },
  { id: 'karosszeria', name: 'Súlycsökkentés', jp: 'ボディ', slots: ['cage', 'seat', 'interior'] },
  { id: 'kulso', name: 'Külső', jp: '外装', slots: ['wheels', 'tirelet', 'hood', 'lights', 'tail', 'tint', 'banner', 'neon', 'intneon', 'decal'] },
  { id: 'aero', name: 'Body kit', jp: 'エアロ', slots: ['wing', 'kit', 'bumper', 'canards', 'diffuser', 'flares', 'roof', 'louver', 'mirrors', 'pipes', 'pod', 'oilcooler', 'towhook', 'charm'] }
];

// fx keys are read by the car model in engine.js
const PARTS = [
  // --- engine
  { id: 'intake1', slot: 'intake', name: 'Kúpos sportszűrő', brand: 'Kaminari Works', price: 18000, days: 1, bolts: 4, torque: 9, fx: { veHigh: 0.02 }, desc: 'Szabadabban lélegzik felső fordulaton. Hangosabb szívás.' },
  { id: 'intake2', slot: 'intake', name: 'Hideglevegős szívócső', brand: 'Kaminari Works', price: 46000, days: 2, bolts: 6, torque: 9, fx: { veHigh: 0.035, veLow: 0.01 }, desc: 'A lökhárító mögül veszi a hideg levegőt.' },
  { id: 'header1', slot: 'header', name: '4-2-1 rozsdamentes leömlő', brand: 'Tsuyoshi Racing', price: 88000, days: 2, bolts: 8, torque: 30, passes: 2, w: -3, fx: { veHigh: 0.04, peakShift: 250 }, na: true, desc: 'Szívó motorra. Két menetben húzd meg, különben vetemedik a karima.' },
  { id: 'header2', slot: 'header', name: 'Öntött turbóleömlő', brand: 'Tsuyoshi Racing', price: 98000, days: 3, bolts: 8, torque: 34, passes: 2, w: -2, fx: { spool: -250, veHigh: 0.02 }, turboOnly: true, desc: 'Gyorsabb turbófelpörgés. Két menetes meghúzás kötelező.' },
  { id: 'exhaust1', slot: 'exhaust', name: '60 mm-es cat-back kipufogó', brand: 'Ronin Garage', price: 64000, days: 2, bolts: 6, torque: 40, w: -6, fx: { veHigh: 0.025, veLow: 0.005 }, desc: 'Mély dörmögés, szabadabb kiáramlás.' },
  { id: 'exhaust2', slot: 'exhaust', name: '76 mm-es egyenes kipufogó', brand: 'Ronin Garage', price: 92000, days: 2, bolts: 6, torque: 40, w: -9, fx: { veHigh: 0.04, veLow: -0.01 }, desc: 'Turbóhoz ideális. Szívómotoron kicsit üres alul.' },
  { id: 'cam1', slot: 'cam', name: '264°-os vezérműtengely', brand: 'Kurogane', price: 96000, days: 3, bolts: 10, torque: 13, passes: 2, fx: { veHigh: 0.06, veLow: -0.04, peakShift: 600, limiter: 400 }, notRotary: true, desc: 'Felül erősebb, alul gyengébb, rángatós alapjárat. Programozható ECU ajánlott.' },
  { id: 'ecu1', slot: 'ecu', name: 'Programozható ECU (F-MAP)', brand: 'Kaminari Works', price: 178000, days: 3, bolts: 4, torque: 6, fx: { ecu: true }, desc: 'Állíthatod a gyújtást, a keveréket, a töltőnyomást és a határolót. Nincs kopogásvédelem: a hangolás a te felelősséged.' },
  { id: 'fly1', slot: 'flywheel', name: 'Könnyített krómoly lendkerék', brand: 'Kurogane', price: 52000, days: 2, bolts: 6, torque: 85, passes: 2, w: -4, fx: { inertia: 0.55 }, desc: 'Gyorsabban pörög fel és le. Váltáskor oda kell figyelni.' },
  // --- turbo & fuel
  { id: 'turbokit', slot: 'turbo', name: 'KT-18 turbókit', brand: 'Tsuyoshi Racing', price: 380000, days: 4, bolts: 8, torque: 34, passes: 2, w: 14, fx: { turbo: 'kt18', boostDefault: 0.45 }, naOnly: true, desc: 'Turbó, leömlő, csövek. Szívómotoron a gyári ECU és injektorok nem bírják: ECU és injektor nélkül a motor elsoványodik és kopog.' },
  { id: 'turbo22', slot: 'turbo', name: 'KT-22 turbó', brand: 'Tsuyoshi Racing', price: 210000, days: 3, bolts: 8, torque: 34, passes: 2, fx: { turbo: 'kt22' }, turboOnly: true, desc: 'Nagyobb ház, több levegő felül. Később ébred.' },
  { id: 'turbo28', slot: 'turbo', name: 'KT-28 turbó', brand: 'Tsuyoshi Racing', price: 320000, days: 4, bolts: 8, torque: 34, passes: 2, fx: { turbo: 'kt28' }, turboOnly: true, desc: 'Nagy turbó, nagy turbólyuk. Touge-ra merész választás.' },
  { id: 'boost1', slot: 'boost', name: 'Elektronikus töltőnyomás-szabályzó', brand: 'Hoshi Speed', price: 42000, days: 1, bolts: 4, torque: 6, fx: { boostCtrl: true }, turboOnly: true, desc: 'ECU nélkül is állíthatod a töltőnyomást. A keveréket viszont nem.' },
  { id: 'ic1', slot: 'ic', name: 'Frontális intercooler', brand: 'Hoshi Speed', price: 118000, days: 3, bolts: 6, torque: 10, w: 6, fx: { ic: 0.8 }, turboOnly: true, desc: 'Hidegebb szívólevegő, nagyobb kopogási tartalék.' },
  { id: 'inj1', slot: 'inj', name: '550 cc-s injektorok', brand: 'Kurogane', price: 92000, days: 2, bolts: 4, torque: 10, fx: { injPS: 105 }, desc: 'Hengerenként kb. 105 LE-hez elég üzemanyag. Programozható ECU kell hozzá.' },
  { id: 'pump1', slot: 'pump', name: 'Nagy szállítású üzemanyag-szivattyú', brand: 'Kurogane', price: 32000, days: 1, bolts: 5, torque: 6, fx: { pumpPS: 480 }, desc: 'A szivattyú is lehet szűk keresztmetszet.' },
  // --- driveline
  { id: 'clutch1', slot: 'clutch', name: 'Megerősített kerámia kuplung', brand: 'Kurogane', price: 76000, days: 2, bolts: 6, torque: 25, passes: 2, fx: { clutch: 1.7 }, desc: 'Kb. 70%-kal több nyomatékot visz át csúszás nélkül.' },
  { id: 'lsd1', slot: 'lsd', name: '1-utas önzáró', brand: 'Kaminari Works', price: 92000, days: 3, bolts: 8, torque: 45, fx: { lsd: '1way' }, desc: 'Gázon zár. Kigyorsításnál a belső kerék nem pörög el.' },
  { id: 'lsd15', slot: 'lsd', name: '1,5-utas önzáró', brand: 'Kaminari Works', price: 104000, days: 3, bolts: 8, torque: 45, fx: { lsd: '1.5way' }, desc: 'Gázon erősen, lassításnál részben zár. Stabil fékezés kanyar előtt.' },
  { id: 'lsd2', slot: 'lsd', name: '2-utas önzáró', brand: 'Kaminari Works', price: 118000, days: 3, bolts: 8, torque: 45, fx: { lsd: '2way' }, desc: 'Gázon és lassításnál is zár. Driftre való, kanyarbevételnél tolja az orrot.' },
  { id: 'final1', slot: 'final', name: 'Végáttétel-készlet', brand: 'Kurogane', price: 64000, days: 2, bolts: 8, torque: 45, fx: { finalKit: true }, desc: 'A tuning fülön 3,7 és 5,1 között választhatsz végáttételt.' },
  // --- suspension
  { id: 'springs1', slot: 'susp', name: 'Ültető sportrugók (-30 mm)', brand: 'Yamakaze', price: 38000, days: 1, bolts: 6, torque: 50, fx: { lower: 0.03, springs: 1.35 }, desc: 'Alacsonyabb súlypont, keményebb rugózás. Nem állítható.' },
  { id: 'coil1', slot: 'susp', name: 'Menetes futómű, 16 fokozatú', brand: 'Yamakaze', price: 162000, days: 3, bolts: 6, torque: 50, fx: { coilover: true }, desc: 'Állítható hasmagasság, rugókeménység és csillapítás.' },
  { id: 'arb1', slot: 'arb', name: 'Állítható stabilizátorok', brand: 'Yamakaze', price: 44000, days: 2, bolts: 4, torque: 40, w: 2, fx: { arb: true }, desc: 'Első és hátsó keménység külön. Ezzel tolod alul- vagy túlkormányzás felé.' },
  { id: 'camber1', slot: 'camber', name: 'Dőléstányérok', brand: 'Yamakaze', price: 36000, days: 2, bolts: 3, torque: 30, fx: { camber: true }, desc: 'Állítható kerékdőlés és összetartás.' },
  { id: 'strut1', slot: 'strut', name: 'Első toronymerevítő', brand: 'Ronin Garage', price: 18000, days: 1, bolts: 6, torque: 25, w: 2, fx: { strut: 0.04 }, desc: 'Kevésbé csavarodik a kaszni, élesebb kormányválasz.' },
  // --- brakes & tyres
  { id: 'pads1', slot: 'pads', name: 'Sport fékbetétek', brand: 'Hoshi Speed', price: 22000, days: 1, bolts: 4, torque: 35, fx: { brake: 0.10 }, desc: 'Nagyobb súrlódás, jobban bírja a hőt.' },
  { id: 'bbk1', slot: 'brakes', name: '4 dugattyús féknyereg + nagy tárcsa', brand: 'Hoshi Speed', price: 148000, days: 3, bolts: 4, torque: 90, w: 4, fx: { brake: 0.25 }, desc: 'Lejtőn is visszafogja az autót a tizedik hajtűnél.' },
  { id: 'hb1', slot: 'hbrake', name: 'Hidraulikus kézifék', brand: 'Ronin Garage', price: 34000, days: 2, bolts: 4, torque: 22, fx: { hbrake: 1.6 }, desc: 'Erősebben zárja a hátsó kerekeket. Drifthez.' },
  { id: 'tire0', slot: 'tires', name: 'Utcai gumi (gyári méret)', brand: 'Michiru', price: 34000, days: 1, bolts: 'lugs', torque: 'lugs', fx: { tireMu: 1.0, wear: 1.0, wet: 0.84 }, desc: 'Olcsó, tartós, mély mintázat: esőben ez tart a legjobban. Csere esetén új gumit kapsz.' },
  { id: 'tire1', slot: 'tires', name: 'Sport utcai gumi', brand: 'Michiru', price: 62000, days: 1, bolts: 'lugs', torque: 'lugs', fx: { tireMu: 1.07, wear: 1.3, wet: 0.79 }, desc: 'Jobb tapadás, gyorsabban kopik. Vizes úton még elmegy.' },
  { id: 'tire2', slot: 'tires', name: 'Félslick versenygumi', brand: 'Michiru', price: 118000, days: 2, bolts: 'lugs', torque: 'lugs', fx: { tireMu: 1.16, wear: 2.0, wet: 0.6 }, desc: 'Szárazon nagyon tapad, de két-három futam után kész. Esőben szinte nincs mintázata: úszik.' },
  { id: 'wheel1', slot: 'wheels', name: 'Könnyű 15"-es hálós felni', brand: 'Rays of Tsuki', price: 88000, days: 2, bolts: 'lugs', torque: 'lugs', w: -8, fx: { unsprung: 0.02, wheel: 'mesh' }, desc: 'Kevesebb rugózatlan tömeg. A 90-es évek legszebb felnije.' },
  { id: 'wheel2', slot: 'wheels', name: 'Kovácsolt 5-küllős bronz felni', brand: 'Rays of Tsuki', price: 132000, days: 3, bolts: 'lugs', torque: 'lugs', w: -11, fx: { unsprung: 0.03, wheel: 'spoke' }, desc: 'Kovácsolt, könnyű, bronz.' },
  // --- body & weight
  { id: 'cage1', slot: 'cage', name: '6 pontos bukócső', brand: 'Ronin Garage', price: 118000, days: 3, bolts: 6, torque: 45, w: 18, fx: { cage: true }, desc: 'Merevebb kaszni, kisebb sérülés ütközésnél. +18 kg.' },
  { id: 'seat1', slot: 'seat', name: 'Kagylóülés', brand: 'Hoshi Speed', price: 58000, days: 2, bolts: 4, torque: 40, w: -12, fx: { seat: true }, desc: 'Megtart oldalirányban. −12 kg.' },
  { id: 'strip1', slot: 'interior', name: 'Hátsó ülés és kárpit kiszerelése', brand: 'Saját munka', price: 0, days: 0, bolts: 6, torque: 20, w: -28, fx: { strip: true }, desc: 'Ingyen van, csak a csavarhúzón múlik. −28 kg.' },
  { id: 'hood1', slot: 'hood', name: 'Karbon motorháztető', brand: 'Kaminari Works', price: 96000, days: 3, bolts: 4, torque: 10, w: -9, fx: { hood: 'carbon' }, desc: 'Könnyű és fekete. −9 kg.' },
  { id: 'wing1', slot: 'wing', name: 'GT szárny', brand: 'Tsuyoshi Racing', price: 72000, days: 2, bolts: 4, torque: 12, w: 4, fx: { wing: 'gt', downforce: 0.18 }, desc: 'Kevés, de érezhető leszorítóerő a hátsó tengelyen nagy sebességnél.' },
  { id: 'wing2', slot: 'wing', name: 'Csomagtartó-ajak spoiler', brand: 'Tsuyoshi Racing', price: 28000, days: 1, bolts: 4, torque: 8, w: 1, fx: { wing: 'lip', downforce: 0.05 }, desc: 'Visszafogott, korhű.' },
  { id: 'kit1', slot: 'kit', name: 'Első ajak és küszöbök', brand: 'Kaminari Works', price: 84000, days: 3, bolts: 6, torque: 8, w: 3, fx: { kit: true }, desc: 'Alacsonyabbnak látszik, mint amilyen.' },
  { id: 'wheel3', slot: 'wheels', name: '3 részes mélytányéros felni', brand: 'Rays of Tsuki', price: 154000, days: 3, bolts: 'lugs', torque: 'lugs', w: -2, fx: { wheel: 'dish' }, desc: 'Polírozott perem, arany közép. Minél mélyebb, annál jobb.' },
  { id: 'wheel4', slot: 'wheels', name: 'Fehér 6 küllős rally felni', brand: 'Rays of Tsuki', price: 96000, days: 2, bolts: 'lugs', torque: 'lugs', w: -6, fx: { unsprung: 0.015, wheel: 'white' }, desc: 'Könnyű, strapabíró, fehér. A rallypályáról jött.' },
  { id: 'wheel5', slot: 'wheels', name: 'Turbofan felni', brand: 'Rays of Tsuki', price: 118000, days: 3, bolts: 'lugs', torque: 'lugs', w: -4, fx: { unsprung: 0.01, wheel: 'fan' }, desc: 'A 80-as évek versenyautóiról. Hűti a féket, és jól néz ki.' },
  { id: 'hood2', slot: 'hood', name: 'Szellőzős FRP motorháztető', brand: 'Tsuyoshi Racing', price: 82000, days: 3, bolts: 4, torque: 10, w: -6, fx: { hood: 'vent' }, desc: 'Kiengedi a forró levegőt a motortérből. −6 kg.' },
  { id: 'wing3', slot: 'wing', name: 'Ducktail csomagtartó-fedél', brand: 'Kaminari Works', price: 46000, days: 2, bolts: 4, torque: 10, w: 2, fx: { wing: 'duck', downforce: 0.07 }, desc: 'Felkunkorodó hátsó él. Visszafogottabb, mint a GT szárny.' },
  { id: 'flares1', slot: 'flares', name: 'Csavarozott szélesítő sárvédők', brand: 'Ronin Garage', price: 128000, days: 4, bolts: 8, torque: 10, w: 6, fx: { flares: true }, desc: 'Négy sárvédő szegecselve. Szélesebb gumi fér alá: több tapadás.' },
  { id: 'lights1', slot: 'lights', name: 'Sárga izzók és ködlámpák', brand: 'Hoshi Speed', price: 26000, days: 1, bolts: 4, torque: 4, fx: { lights: 'yellow', fogs: true }, desc: 'Sárga fény a ködben, ahogy a 90-es években illett.' },
  { id: 'tail1', slot: 'tail', name: 'Füstölt hátsó lámpák', brand: 'Kaminari Works', price: 34000, days: 2, bolts: 6, torque: 5, fx: { tail: 'smoke' }, desc: 'Sötét búra. Fékezéskor annál nagyobb a kontraszt.' },
  { id: 'tint1', slot: 'tint', name: 'Sötétített ablakfólia', brand: 'Saját munka', price: 12000, days: 1, bolts: 0, fx: { tint: true }, desc: 'Felragasztod és kisimítod. Ne maradjon buborék.' },
  { id: 'banner1', slot: 'banner', name: 'Szélvédőcsík felirattal', brand: 'Helyi nyomda', price: 8000, days: 1, bolts: 0, fx: { banner: true }, desc: 'A felirat a festőműhelyben választható.' },
  { id: 'neon1', slot: 'neon', name: 'Neon underglow készlet', brand: 'Hoshi Speed', price: 58000, days: 2, bolts: 4, torque: 6, w: 3, fx: { neon: true }, desc: 'Hideg katódcsövek az alváz alatt. A színe a festőműhelyben állítható.' },
  { id: 'decal1', slot: 'decal', name: 'Csapatmatrica: Kurozawa Wolves', brand: 'Helyi csapat', price: 6000, days: 0, bolts: 0, fx: { decal: 'wolves' }, desc: 'Ha már ide tartozol.' },
  { id: 'decal2', slot: 'decal', name: 'Szponzormatrica: Kaminari Works', brand: 'Kaminari Works', price: 6000, days: 0, bolts: 0, fx: { decal: 'kaminari' }, desc: 'Villám az ajtón.' },
  { id: 'decal3', slot: 'decal', name: 'Csapatmatrica: Midnight Loop', brand: 'Helyi csapat', price: 9000, days: 0, bolts: 0, fx: { decal: 'loop' }, desc: 'A kikötői körgyűrű éjszakai klubja. Aki ezt hordja, annak villognak a parkolóban.' },
  { id: 'decal4', slot: 'decal', name: 'Matricabomba', brand: 'Saját munka', price: 14000, days: 1, bolts: 0, fx: { decal: 'bomb' }, desc: 'Száz kis matrica egymáson a hátsó sárvédőn. Egy horpadást is eltakar.' },
  // --- v10: wheels, aero and street style
  { id: 'wheel6', slot: 'wheels', name: 'Kovácsolt hatküllős, fegyverszürke', brand: 'Rays of Tsuki', price: 148000, days: 3, bolts: 'lugs', torque: 'lugs', w: -12, fx: { unsprung: 0.03, wheel: 'te' }, desc: 'Hat vékony küllő, egy darabból kovácsolva. A time attack mezőny fele ezen áll.' },
  { id: 'wheel7', slot: 'wheels', name: 'Nyolcküllős klasszikus, fekete', brand: 'Rays of Tsuki', price: 110000, days: 2, bolts: 'lugs', torque: 'lugs', w: -5, fx: { unsprung: 0.01, wheel: 'wat' }, desc: 'A hetvenes évek versenyfelnije polírozott peremmel. Régi vasra kötelező.' },
  { id: 'wheel8', slot: 'wheels', name: 'Polírozott csillagfelni', brand: 'Rays of Tsuki', price: 126000, days: 3, bolts: 'lugs', torque: 'lugs', w: -3, fx: { wheel: 'star' }, desc: 'Öt széles ág, tükörfényes. Az utcai lámpák alatt forog a legszebben.' },
  { id: 'wheel9', slot: 'wheels', name: 'Lapos négylyukú felni', brand: 'Rays of Tsuki', price: 72000, days: 2, bolts: 'lugs', torque: 'lugs', w: -1, fx: { wheel: 'long' }, desc: 'Sima tárcsa négy kerek lyukkal. A kaido racerek kedvence.' },
  { id: 'tirelet1', slot: 'tirelet', name: 'Fehér gumifelirat', brand: 'Saját munka', price: 9000, days: 1, bolts: 0, fx: { tirelet: true }, desc: 'Gumifestő filccel kihúzod a betűket az oldalfalon. Egy este munka.' },
  { id: 'wing4', slot: 'wing', name: 'Takeyari toronyszárny', brand: 'Bōsō Style', price: 64000, days: 2, bolts: 4, torque: 12, w: 5, fx: { wing: 'boso', downforce: 0.05 }, desc: 'Fél méter magas csöveken ül. Leszorítóerőt alig ad, tekintetet annál többet.' },
  { id: 'wing5', slot: 'wing', name: 'Hattyúnyakú karbon szárny', brand: 'Tsuyoshi Racing', price: 168000, days: 3, bolts: 6, torque: 12, w: 5, fx: { wing: 'swan', downforce: 0.26 }, desc: 'Felülről függesztett lap, kétrészes profil. Gyors íveken érezni, hogy leül a hátulja.' },
  { id: 'bumper1', slot: 'bumper', name: 'Aero első lökhárító', brand: 'Kaminari Works', price: 88000, days: 3, bolts: 6, torque: 10, w: 2, fx: { bumper: 'aero', downforce: 0.04 }, desc: 'Nagy hűtőnyílás, fékhűtő csatornák, karbon splitter.' },
  { id: 'bumper2', slot: 'bumper', name: 'Deppa állspoiler', brand: 'Bōsō Style', price: 54000, days: 2, bolts: 6, torque: 10, w: 4, fx: { bumper: 'deppa' }, desc: 'Előrenyúló „kiálló fog”, ahogy a nyolcvanas évek sziluettversenyautóin. Fekvőrendőrnél imádkozz.' },
  { id: 'canard1', slot: 'canards', name: 'Karbon kanárdok', brand: 'Tsuyoshi Racing', price: 32000, days: 1, bolts: 4, torque: 6, fx: { canards: true, downforce: 0.03 }, desc: 'Két-két kis szárny az első sarkokon. Az orrot nyomja le.' },
  { id: 'diff1', slot: 'diffuser', name: 'Hátsó diffúzor', brand: 'Tsuyoshi Racing', price: 58000, days: 2, bolts: 6, torque: 10, w: 3, fx: { diffuser: true, downforce: 0.05 }, desc: 'Terelőlapok a hátsó lökhárító alatt.' },
  { id: 'flares2', slot: 'flares', name: 'Works túlsárvédők', brand: 'Bōsō Style', price: 198000, days: 5, bolts: 8, torque: 10, w: 9, fx: { flares: 'works' }, desc: 'Gyári versenyautók mintájára: tíz centi oldalanként, széles gumival. Ki kell vágni hozzá a sárvédőt.' },
  { id: 'roof1', slot: 'roof', name: 'Tetőlégbeömlő', brand: 'Kaminari Works', price: 38000, days: 2, bolts: 4, torque: 6, w: 1, fx: { roofscoop: true }, desc: 'Rallyautókról. Friss levegő a kabinba, ha már a klímát kidobtad.' },
  { id: 'louver1', slot: 'louver', name: 'Hátsóablak-zsalu', brand: 'Ronin Garage', price: 42000, days: 2, bolts: 4, torque: 6, w: 3, fx: { louver: true }, desc: 'Fekete lamellák a hátsó szélvédőn. Árnyékol, és nagyon nyolcvanas évek.' },
  { id: 'mirror1', slot: 'mirrors', name: 'Sárvédőtükrök', brand: 'Bōsō Style', price: 24000, days: 1, bolts: 4, torque: 5, fx: { mirrors: 'fender' }, desc: 'Króm tükrök az első sárvédőn, ahogy régen minden japán autón.' },
  { id: 'mirror2', slot: 'mirrors', name: 'Karbon aero tükrök', brand: 'Tsuyoshi Racing', price: 36000, days: 1, bolts: 4, torque: 5, w: -1, fx: { mirrors: 'aero' }, desc: 'Kicsi, könnyű, alig látsz benne. Versenyautóra való.' },
  { id: 'pipes1', slot: 'pipes', name: 'Takeyari kipufogócsövek', brand: 'Bōsō Style', price: 46000, days: 2, bolts: 4, torque: 20, w: 4, fx: { pipes: 'takeyari' }, desc: 'Bambuszlándzsa: két króm cső az ég felé. A rendőr két utcával arrébb is látja.' },
  { id: 'pipes2', slot: 'pipes', name: 'Titán ágyúcső-vég', brand: 'Ronin Garage', price: 52000, days: 1, bolts: 2, torque: 20, w: -2, fx: { pipes: 'cannon' }, desc: 'Százötven milliméteres vég, kékre égett titán.' },
  { id: 'pod1', slot: 'pod', name: 'Rally lámpasor', brand: 'Hoshi Speed', price: 68000, days: 2, bolts: 4, torque: 8, w: 4, fx: { pod: true }, desc: 'Négy kerek fényszóró a motorháztetőn. Ködben és esőben messzebb látsz.' },
  { id: 'oil1', slot: 'oilcooler', name: 'Külső olajhűtő', brand: 'Kurogane', price: 74000, days: 2, bolts: 4, torque: 12, w: 3, fx: { oilcooler: true }, desc: 'Az első lökhárítóra szerelve, fonott csövekkel. A motor lassabban fárad a hosszú lejtőn.' },
  { id: 'tow1', slot: 'towhook', name: 'Piros vonószem', brand: 'Ronin Garage', price: 6000, days: 0, bolts: 1, torque: 40, fx: { towhook: true }, desc: 'Ha egyszer az árokból kell kihúzni. Addig csak jól néz ki.' },
  { id: 'intneon1', slot: 'intneon', name: 'Belső hangulatfény', brand: 'Hoshi Speed', price: 22000, days: 1, bolts: 2, torque: 4, fx: { intneon: true }, desc: 'Neoncső a lábtérben és a kalaptartón. A színe az underglow színével együtt állítható.' },
  // --- v11: nitrous, more wheels, street charms
  { id: 'nos1', slot: 'nos', name: 'Nitro készlet, 50 lóerős fúvóka', brand: 'Wangan N₂O', price: 160000, days: 3, bolts: 4, torque: 10, w: 11, fx: { nos: 50 }, desc: 'Kék palack a csomagtartóban, gomb a kormányon. Padlógáznál, 3000 fölött nyomd: nagyjából tíz másodpercre elég egy futamon. A motort koptatja.' },
  { id: 'nos2', slot: 'nos', name: 'Nitro készlet, 100 lóerős direkt befúvás', brand: 'Wangan N₂O', price: 340000, days: 5, bolts: 6, torque: 10, w: 15, fx: { nos: 100 }, desc: 'Hengerenként külön fúvóka. Száz lóerő egy gombnyomásra, és egy tönkrement főtengelycsapágy, ha túl sokszor nyomod.' },
  { id: 'wheel10', slot: 'wheels', name: 'Háromküllős, fehér', brand: 'Rays of Tsuki', price: 84000, days: 2, bolts: 'lugs', torque: 'lugs', w: -2, fx: { wheel: 'tri' }, desc: 'A kilencvenes évek eleje három vastag küllőben. Vagy imádod, vagy nem érted.' },
  { id: 'wheel11', slot: 'wheels', name: 'Aranyozott hálós, mély ágyas', brand: 'Rays of Tsuki', price: 172000, days: 4, bolts: 'lugs', torque: 'lugs', w: 2, fx: { wheel: 'gmesh' }, desc: 'Arany háló, polírozott, tenyérnyi mély perem. VIP limuzinra és furgonra való.' },
  { id: 'charm1', slot: 'charm', name: 'Tsurikawa kapaszkodó', brand: 'Bōsō Style', price: 5000, days: 0, bolts: 1, torque: 8, fx: { tsuri: true }, desc: 'Vonatról „kölcsönvett” kapaszkodó a hátsó lökhárítón. Ha a földet súrolja, elég alacsonyan vagy.' }
];
const PART = Object.fromEntries(PARTS.map(p => [p.id, p]));

// Garage decorations. Each slot holds one item.
const DECOR = {
  posterL: { name: 'Poszter (bal)', items: [
    { id: 'p_touge', name: '峠 kalligráfia', price: 3000 },
    { id: 'p_night', name: 'Éjszakai futam \'97', price: 4000 },
    { id: 'p_kami', name: 'Kaminari Works reklám', price: 3500 },
    { id: 'p_rotor', name: 'Wankel-rotor ábra', price: 4500 }] },
  posterR: { name: 'Poszter (jobb)', items: [
    { id: 'p_touge', name: '峠 kalligráfia', price: 3000 },
    { id: 'p_night', name: 'Éjszakai futam \'97', price: 4000 },
    { id: 'p_kami', name: 'Kaminari Works reklám', price: 3500 },
    { id: 'p_map', name: 'Hegyi útvonaltérkép', price: 5000 }] },
  neon: { name: 'Neonfelirat', items: [
    { id: 'n_touge', name: '峠 rózsaszín neon', price: 32000 },
    { id: 'n_yoru', name: '夜 narancs neon', price: 28000 },
    { id: 'n_garage', name: 'GARAGE kék neon', price: 26000 }] },
  shelf: { name: 'Polc', items: [
    { id: 's_oil', name: 'Olajos dobozok', price: 6000 },
    { id: 's_trophy', name: 'Trófeapolc', price: 12000 },
    { id: 's_parts', name: 'Használt alkatrészek', price: 4000 }] },
  floorL: { name: 'Bal sarok', items: [
    { id: 'f_tools', name: 'Piros szerszámkocsi', price: 38000 },
    { id: 'f_tires', name: 'Gumistack', price: 8000 },
    { id: 'f_engine', name: 'Motor a bakon', price: 45000 }] },
  floorR: { name: 'Jobb sarok', items: [
    { id: 'f_vend', name: 'Italautomata', price: 60000 },
    { id: 'f_sofa', name: 'Kopott kanapé', price: 15000 },
    { id: 'f_arcade', name: 'Árkádgép', price: 52000 }] },
  floor: { name: 'Padló', items: [
    { id: 'fl_concrete', name: 'Nyers beton', price: 0 },
    { id: 'fl_epoxy', name: 'Szürke epoxi', price: 24000 },
    { id: 'fl_checker', name: 'Sakktábla csempe', price: 36000 }] },
  light: { name: 'Világítás', items: [
    { id: 'l_cold', name: 'Hideg fénycső', price: 0 },
    { id: 'l_warm', name: 'Meleg fénycső', price: 8000 },
    { id: 'l_blue', name: 'Kék hangulatfény', price: 14000 },
    { id: 'l_violet', name: 'Lila hangulatfény', price: 14000 }] }
};

const PAINTS = [
  ['#e9e6dc', 'Fehér'], ['#f4f4f0', 'Hófehér'], ['#c8202a', 'Piros'], ['#8e1420', 'Bordó'], ['#141418', 'Fekete'], ['#2a2c33', 'Grafit'],
  ['#5d6066', 'Ezüstszürke'], ['#9aa0a8', 'Platina'], ['#2a4f9a', 'Királykék'], ['#16264f', 'Éjkék'], ['#3fa7d6', 'Égkék'], ['#1f5c3e', 'Versenyzöld'],
  ['#6aa84f', 'Lime'], ['#d9a21b', 'Sárga'], ['#f07a1a', 'Narancs'], ['#5a2a7a', 'Lila'], ['#c2185b', 'Magenta'], ['#7a5c3e', 'Bronz'],
  ['#ff3dbb', 'Neonpink'], ['#4ee6d4', 'Menta'], ['#0e3b3a', 'Mélytürkiz'], ['#c7ff3d', 'Savzöld'], ['#e8d9a8', 'Pezsgő'], ['#3a1014', 'Vörösfekete']
];
const FINISHES = {
  gloss: { name: 'Fényes', mult: 1 }, metal: { name: 'Metál', mult: 1.3 }, pearl: { name: 'Gyöngyház', mult: 1.6 }, matte: { name: 'Matt', mult: 1.4 }
};
const LIVERIES = {
  twotone: { name: 'Kéttónusú' }, stripes: { name: 'Versenycsíkok' }, side: { name: 'Oldalcsík' }, tribal: { name: 'Tribal' }, kanji: { name: '峠 kanji' }, flames: { name: 'Lángok' }, bolt: { name: 'Villám' }, checker: { name: 'Kockás zászló' }, retro: { name: 'Retró csíkok' }, kata: { name: 'ドリフト felirat' }
};
const NEONS = [['#4ee6d4', 'Türkiz'], ['#2f7bff', 'Kék'], ['#b77bff', 'Lila'], ['#ff3dbb', 'Pink'], ['#3dff6e', 'Zöld'], ['#ff3d4f', 'Piros'], ['#ff8a1f', 'Narancs'], ['#ffe14a', 'Sárga'], ['#f2f4ff', 'Jégfehér']];
const BANNERS = [['yoru', 'YORU TŌGE'], ['wolves', 'KUROZAWA WOLVES'], ['kaminari', 'KAMINARI WORKS'], ['touge', '峠 最速'], ['loop', 'MIDNIGHT LOOP'], ['zero', 'ゼロヨン 命'], ['grip', 'NO GRIP NO LIFE'], ['yonaka', '夜中 CLUB']];
const LIVERY_COST = 18000;

// Mountain passes. Segments: ['s', length] or ['c', radius, degrees(+left)]
const TOUGES = [
  { id: 'kurozawa', name: 'Kurozawa-tōge', jp: '黒沢峠', dir: 'down', reqRep: 0, grade: -0.065,
    desc: 'Széles, sima aszfalt, két hajtű. Itt kezd mindenki.',
    segs: [['s',80],['c',120,25],['s',60],['c',60,-45],['s',40],['c',45,70],['s',90],['c',25,-120],['s',50],['c',70,40],['s',30],['c',70,-40],['s',120],['c',15,172],['s',70],['c',40,-60],['c',40,60],['s',80],['c',30,-95],['s',60],['c',16,170],['s',100],['c',55,-50],['s',40],['c',90,30],['s',140]],
    rivals: [
      { id: 'sota', name: 'Sota', team: 'Kurozawa Wolves', car: 'sprint16', color: '#e4e2da', look: { livery: 'side', col2: '#1d4fa3' }, ps: 128, skill: 0.47, prize: 30000, rep: 10, reqRep: 0, line: 'Új vagy itt? Mutasd, mit tud a dobozod.' },
      { id: 'mio', name: 'Mio', team: 'Kurozawa Wolves', car: 'mizuchi', color: '#f4f4f0', look: { livery: 'stripes', col2: '#c8202a' }, ps: 150, skill: 0.5, prize: 90000, rep: 15, reqRep: 20, line: 'A roadster nem játékszer. Kérdezd meg a szalagkorlátot.' },
      { id: 'haruto', name: 'Haruto', team: 'Kurozawa Wolves', car: 'types', color: '#b81d26', look: { livery: 'stripes', col2: '#f4f4f0' }, ps: 190, skill: 0.53, prize: 65000, rep: 20, reqRep: 10, line: 'A hajtűkben fogsz lemaradni. Mindenki ott marad le.' }
    ] },
  { id: 'mikazuki', name: 'Mikazuki-tōge', jp: '三日月峠', dir: 'up', reqRep: 30, grade: 0.06,
    desc: 'Emelkedő, gyors ívek. Itt a lóerő is számít.',
    segs: [['s',100],['c',90,-35],['s',80],['c',50,60],['s',50],['c',35,-80],['s',70],['c',120,25],['c',120,-25],['s',100],['c',20,150],['s',60],['c',45,-70],['s',50],['c',45,70],['s',80],['c',28,-110],['s',90],['c',60,45],['s',60],['c',18,-165],['s',110],['c',80,40],['s',70],['c',40,-75],['s',120]],
    rivals: [
      { id: 'rin', name: 'Rin', team: 'Mikazuki Night Owls', car: 's20t', color: '#2b54a8', look: { livery: 'twotone', col2: '#2a2c33', finish: 'metal' }, ps: 235, skill: 0.49, prize: 120000, rep: 25, reqRep: 30, line: 'Felfelé nem lehet csalni. Itt a gép beszél.' },
      { id: 'kenji', name: 'Kenji', team: 'Mikazuki Night Owls', car: 'kamui', color: '#c8202a', look: { livery: 'side', col2: '#141418', finish: 'metal' }, ps: 300, skill: 0.49, prize: 160000, rep: 30, reqRep: 45, line: 'A motor mögöttem van. A többiek is.' },
      { id: 'jun', name: 'Jun „Kaze”', team: 'Mikazuki Night Owls', car: 's20t', color: '#d6d3cc', look: { livery: 'kanji', col2: '#c8202a', finish: 'pearl' }, ps: 290, skill: 0.55, prize: 200000, rep: 35, reqRep: 55, line: 'Három éve senki nem ért fel előttem.' }
    ] },
  { id: 'okami', name: 'Ōkami-zaka', jp: '狼坂', dir: 'down', reqRep: 80, grade: -0.075,
    desc: 'Szűk, technikás lejtő, hajtű hajtű után. A farkasok hegye.',
    segs: [['s',90],['c',40,60],['s',40],['c',13,-176],['s',60],['c',13,176],['s',70],['c',30,-90],['s',50],['c',50,50],['s',30],['c',50,-50],['s',100],['c',12,178],['s',50],['c',25,-100],['s',40],['c',25,100],['s',80],['c',14,-174],['s',60],['c',70,35],['s',90],['c',12,178],['s',70],['c',35,-80],['s',110],['c',60,40],['s',150]],
    rivals: [
      { id: 'yamato', name: 'Yamato', team: 'Ōkami-kai', car: 'twinr', color: '#101014', look: { livery: 'tribal', col2: '#7a3fb0', finish: 'metal', neon: '#b77bff' }, ps: 340, skill: 0.57, prize: 350000, rep: 50, reqRep: 80, line: 'A rotor nem fárad el. Te igen.' },
      { id: 'shiro', name: 'Shirō', team: 'Ōkami-kai', car: 'raijin', color: '#f4f4f0', look: { livery: 'twotone', col2: '#5d6066', finish: 'pearl', neon: '#2f7bff' }, ps: 470, skill: 0.62, prize: 450000, rep: 60, reqRep: 105, line: 'Háromliteres. Ikerturbó. Nem kell magyaráznom.' },
      { id: 'okami', name: 'Ōkami', team: 'Ōkami-kai', car: 'gt4', color: '#2a2c33', look: { livery: 'kanji', col2: '#d9a21b', finish: 'matte' }, ps: 420, skill: 0.64, prize: 600000, rep: 100, reqRep: 130, line: 'Éjfél után ez az én utam.' }
    ] },
  { id: 'kasumi', name: 'Kasumi-tōge', jp: '霞峠', dir: 'down', reqRep: 170, grade: -0.07,
    desc: 'A legmagasabb hágó: hosszú, gyors ívek a gerincen, aztán hajtűk a fenyvesben. Aki itt nyer, arról a magazinok is írnak.',
    segs: [['s',100],['c',150,30],['s',120],['c',90,-40],['s',60],['c',14,175],['s',80],['c',60,-70],['c',60,70],['s',140],['c',200,-25],['s',90],['c',13,-178],['s',60],['c',35,95],['s',70],['c',35,-95],['s',160],['c',110,45],['s',50],['c',16,170],['s',90],['c',45,-60],['s',40],['c',20,-150],['s',120],['c',80,50],['s',180]],
    rivals: [
      { id: 'kaede', name: 'Kaede', team: 'Kasumi Seven', car: 'arashi', color: '#e9e6dc', look: { livery: 'stripes', col2: '#2a4f9a', finish: 'pearl' }, ps: 380, skill: 0.63, prize: 520000, rep: 60, reqRep: 170, line: 'Négy kerék, négy évszak. A hegyen mindig én vagyok otthon.' },
      { id: 'genji', name: 'Genji', team: 'Kasumi Seven', car: 'kamui', color: '#d9a21b', look: { livery: 'side', col2: '#141418', finish: 'metal' }, ps: 360, skill: 0.65, prize: 680000, rep: 70, reqRep: 195, line: 'Középmotor. Ha a farom elmegy, te már rég a korláton vagy.' },
      { id: 'tengu', name: '„Tengu”', team: 'nincs csapata', car: 'raijin', color: '#141418', look: { livery: 'kanji', col2: '#b3261e', finish: 'matte', neon: '#ff3d4f' }, ps: 520, skill: 0.67, prize: 1000000, rep: 150, reqRep: 230, line: 'Senki nem látta az arcomat. A hátsó lámpáimat annál többen.' }
    ] },
  { id: 'shiraito', name: 'Shiraito-dōro', jp: '白糸道路', dir: 'down', reqRep: 120, grade: -0.085,
    desc: 'Régi fizetős út a vízesés mellett: hosszú, gyors lejtő kevés hajtűvel. Itt a fék és a bátorság fogy el előbb.',
    segs: [['s',120],['c',180,-25],['s',90],['c',110,40],['s',70],['c',75,-55],['s',110],['c',140,30],['c',140,-30],['s',130],['c',22,150],['s',90],['c',90,-45],['s',60],['c',60,65],['s',150],['c',160,-28],['s',100],['c',48,85],['s',70],['c',26,-140],['s',120],['c',120,35],['s',80],['c',70,-50],['s',170]],
    rivals: [
      { id: 'ayane', name: 'Ayane', team: 'Shiraito Downhill Club', car: 'kagero', color: '#3fa7d6', look: { livery: 'flames', col2: '#f4f4f0', finish: 'pearl' }, vis: { wing: 'gt', wheel: 'te', lower: 0.04, bumper: 'aero', finish: 'pearl', livery: 'flames', col2: '#f4f4f0' }, ps: 330, skill: 0.6, prize: 400000, rep: 50, reqRep: 120, line: 'Lefelé nem a motor visz. Engedd el a féket, ha mered.' },
      { id: 'daisuke', name: 'Daisuke', team: 'Shiraito Downhill Club', car: 'hako', color: '#9aa0a8', look: { livery: 'side', col2: '#141418' }, vis: { wheel: 'wat', lower: 0.05, flares: 'works', bumper: 'deppa', pipes: 'takeyari', oilcooler: true, finish: 'gloss', livery: 'side', col2: '#141418' }, ps: 260, skill: 0.64, prize: 520000, rep: 60, reqRep: 145, line: 'Ez a kocsi idősebb nálad. És még mindig gyorsabb.' },
      { id: 'doc', name: '„Doki”', team: 'Shiraito Downhill Club', car: 'hayate', color: '#f4f4f0', look: { livery: 'stripes', col2: '#c8202a', finish: 'pearl' }, ps: 340, skill: 0.66, prize: 760000, rep: 80, reqRep: 175, line: 'Nappal sebész vagyok. Éjjel is pontosan vágok.' }
    ] },
  { id: 'akatsuki', name: 'Akatsuki-tōge', jp: '暁峠', dir: 'up', reqRep: 60, grade: 0.07,
    desc: 'Szerpentin a teaültetvények között, felfelé. Rövid egyenesek, sok váltás: itt a könnyű autó többet ér a lóerőnél.',
    segs: [['s',90],['c',70,40],['s',50],['c',35,-85],['s',60],['c',22,140],['s',70],['c',100,-30],['c',100,30],['s',80],['c',17,-168],['s',50],['c',40,75],['s',40],['c',40,-75],['s',90],['c',26,120],['s',60],['c',65,-45],['s',50],['c',15,172],['s',80],['c',55,-55],['s',40],['c',30,-90],['s',70],['c',85,40],['s',130]],
    rivals: [
      { id: 'nao', name: 'Nao', team: 'Akatsuki Tea Runners', car: 'koma', color: '#2a4f9a', look: { livery: 'side', col2: '#f4f4f0' }, vis: { wheel: 'white', lower: 0.03, finish: 'gloss', livery: 'side', col2: '#f4f4f0' }, ps: 98, skill: 0.5, prize: 70000, rep: 18, reqRep: 60, line: 'Kicsi? Az. A hajtűben majd te érzed magad nagynak.' },
      { id: 'ryo', name: 'Ryō', team: 'Akatsuki Tea Runners', car: 'savanna', color: '#b81d26', look: { livery: 'retro', col2: '#f4f4f0' }, ps: 245, skill: 0.53, prize: 150000, rep: 28, reqRep: 75, line: 'Apámé volt. Ő is itt hagyta ott a kuplungját.' },
      { id: 'sena', name: 'Sena', team: 'Akatsuki Tea Runners', car: 'hibiki', color: '#d6d3cc', look: { livery: 'kata', col2: '#c8202a', finish: 'metal' }, vis: { wheel: 'te', lower: 0.04, wing: 'swan', finish: 'metal', livery: 'kata', col2: '#c8202a' }, ps: 268, skill: 0.6, prize: 240000, rep: 40, reqRep: 95, line: 'Kilencezernél váltok. Addig számolj, ha tudsz.' }
    ] }
];

// The harbour straight: zero-yon, four hundred metres from a standing start.
const DRAG = { id: 'wangan', name: 'Kikötői egyenes', jp: '湾岸ゼロヨン', dir: 'flat', grade: 0, drag: true, segs: [['s', 1000]], rivals: [
  { id: 'd_jiro', launch: 0.86, name: 'Jirō', team: 'Midnight Loop', car: 'bambina', color: '#d9a21b', look: {}, ps: 92, skill: 0.5, prize: 15000, rep: 4, reqRep: 0, line: 'Hatszázhatvan köbcenti. Ne nevess, amíg nem láttad a hátulját.' },
  { id: 'd_emi', name: 'Emi', team: 'Midnight Loop', car: 'types', color: '#f4f4f0', look: { livery: 'checker', col2: '#141418' }, ps: 205, skill: 0.5, prize: 30000, rep: 6, reqRep: 15, line: 'Nyolcezer-négyszáznál váltok. Te hol?' },
  { id: 'd_taku', launch: 1.2, name: 'Taku', team: 'Midnight Loop', car: 'kagero', color: '#6aa84f', look: { livery: 'bolt', col2: '#141418', neon: '#3dff6e' }, ps: 340, skill: 0.5, prize: 60000, rep: 9, reqRep: 50, line: 'A zöld lámpa nekem szól. Te csak nézed.' },
  { id: 'd_ken', launch: 1.3, name: 'Vanning Ken', team: 'Midnight Loop', car: 'hakobune', color: '#5a2a7a', look: { finish: 'pearl', neon: '#ff3dbb' }, vis: { wheel: 'gmesh', lower: 0.07, tint: true, finish: 'pearl', neon: true, neonColor: '#ff3dbb', pipes: 'takeyari', camber: [-4, -5] }, ps: 380, skill: 0.5, prize: 80000, rep: 10, reqRep: 75, line: 'V8 van a dobozban. Hátul a hangfalak is elférnek, te meg a tükrömben.' },
  { id: 'd_baron', launch: 1.45, name: 'A Báró', team: 'Midnight Loop', car: 'sovereign', color: '#141418', look: { finish: 'pearl', neon: '#b77bff' }, vis: { wheel: 'dish', lower: 0.07, tint: true, finish: 'pearl', neon: true, neonColor: '#b77bff', camber: [-5, -6] }, ps: 450, skill: 0.5, prize: 110000, rep: 12, reqRep: 100, line: 'Kompresszor a V8-on. A hátsó ülésen pezsgő. Szállj be, ha vesztettél.' },
  { id: 'd_akuma', launch: 1.85, name: '„Wangan no Akuma”', team: 'nincs csapata', car: 'zetto', color: '#16264f', look: { finish: 'metal' }, vis: { wheel: 'te', lower: 0.05, wing: 'swan', bumper: 'aero', finish: 'metal', pipes: 'cannon' }, ps: 640, skill: 0.5, prize: 220000, rep: 25, reqRep: 180, line: 'Háromszázzal megyek haza minden éjjel. Négyszáz méter nekem bemelegítés.' }
] };
const TA_TIMES = {"kurozawa":[82,77.3,73.8,69.6],"kurozawa_r":[90.6,82.6,80,73.8],"mikazuki":[95,86.7,83.6,77.2],"mikazuki_r":[86.8,81.8,77.9,73.6],"okami":[101.3,95.9,91.8,86.3],"okami_r":[115.6,104.1,102.5,93],"kasumi":[108.7,102.3,98,92.5],"kasumi_r":[121.2,111.1,106.9,98],"shiraito":[93.4,87.5,83.7,80.3],"shiraito_r":[105,94.4,90.8,84.4],"akatsuki":[101.5,92.1,89.7,81.8],"akatsuki_r":[91.4,86,82.5,77.9]};
const TA_PRIZE = { bronze: 10000, silver: 25000, gold: 60000, plat: 150000 }, TA_NAME = { bronze: 'Bronz', silver: 'Ezüst', gold: 'Arany', plat: 'Platina' }, TA_ORDER = ['bronze', 'silver', 'gold', 'plat'];

// economy: income scale. Rival prizes, jobs and sponsors are all multiplied by this.
const PAY = 1.5;
for (const tg of TOUGES.concat([DRAG])) for (const rv of tg.rivals) rv.prize = Math.round(rv.prize * PAY / 1000) * 1000;
for (const k of Object.keys(TA_PRIZE)) TA_PRIZE[k] = Math.round(TA_PRIZE[k] * PAY / 1000) * 1000;

const DYNO_COST = 3000;
const FUEL_PREMIUM_COST = 2500; // per race night
