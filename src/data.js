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
  flares: 'Sárvédő-szélesítés', lights: 'Fényszóró', tail: 'Hátsó lámpa', tint: 'Ablakfólia', banner: 'Szélvédőcsík', neon: 'Neon underglow'
};

const CATS = [
  { id: 'motor', name: 'Motor', jp: 'エンジン', slots: ['intake', 'header', 'exhaust', 'cam', 'ecu', 'flywheel'] },
  { id: 'turbo', name: 'Turbó és üzemanyag', jp: 'ターボ', slots: ['turbo', 'boost', 'ic', 'inj', 'pump'] },
  { id: 'hajtas', name: 'Erőátvitel', jp: 'ドライブ', slots: ['clutch', 'lsd', 'final'] },
  { id: 'futomu', name: 'Futómű', jp: 'サス', slots: ['susp', 'arb', 'camber', 'strut'] },
  { id: 'fek', name: 'Fék és gumi', jp: 'ブレーキ', slots: ['pads', 'brakes', 'hbrake', 'tires'] },
  { id: 'karosszeria', name: 'Súlycsökkentés', jp: 'ボディ', slots: ['cage', 'seat', 'interior'] },
  { id: 'kulso', name: 'Külső', jp: '外装', slots: ['wheels', 'hood', 'wing', 'kit', 'flares', 'lights', 'tail', 'tint', 'banner', 'neon', 'decal'] }
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
  { id: 'seat1', slot: 'seat', name: 'Kagylóülés', brand: 'Hoshi Speed', price: 58000, days: 2, bolts: 4, torque: 40, w: -12, fx: {}, desc: 'Megtart oldalirányban. −12 kg.' },
  { id: 'strip1', slot: 'interior', name: 'Hátsó ülés és kárpit kiszerelése', brand: 'Saját munka', price: 0, days: 0, bolts: 6, torque: 20, w: -28, fx: {}, desc: 'Ingyen van, csak a csavarhúzón múlik. −28 kg.' },
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
  { id: 'decal2', slot: 'decal', name: 'Szponzormatrica: Kaminari Works', brand: 'Kaminari Works', price: 6000, days: 0, bolts: 0, fx: { decal: 'kaminari' }, desc: 'Villám az ajtón.' }
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
  ['#6aa84f', 'Lime'], ['#d9a21b', 'Sárga'], ['#f07a1a', 'Narancs'], ['#5a2a7a', 'Lila'], ['#c2185b', 'Magenta'], ['#7a5c3e', 'Bronz']
];
const FINISHES = {
  gloss: { name: 'Fényes', mult: 1 }, metal: { name: 'Metál', mult: 1.3 }, pearl: { name: 'Gyöngyház', mult: 1.6 }, matte: { name: 'Matt', mult: 1.4 }
};
const LIVERIES = {
  twotone: { name: 'Kéttónusú' }, stripes: { name: 'Versenycsíkok' }, side: { name: 'Oldalcsík' }, tribal: { name: 'Tribal' }, kanji: { name: '峠 kanji' }
};
const NEONS = [['#4ee6d4', 'Türkiz'], ['#2f7bff', 'Kék'], ['#b77bff', 'Lila'], ['#ff3dbb', 'Pink'], ['#3dff6e', 'Zöld'], ['#ff3d4f', 'Piros']];
const BANNERS = [['yoru', 'YORU TŌGE'], ['wolves', 'KUROZAWA WOLVES'], ['kaminari', 'KAMINARI WORKS'], ['touge', '峠 最速']];
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
    ] }
];

// economy: income scale. Rival prizes, jobs and sponsors are all multiplied by this.
const PAY = 1.5;
for (const tg of TOUGES) for (const rv of tg.rivals) rv.prize = Math.round(rv.prize * PAY / 1000) * 1000;

const DYNO_COST = 3000;
const FUEL_PREMIUM_COST = 2500; // per race night
