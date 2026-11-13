// ===================== NIGHT PASS — the parts catalogue as a 90s tuning monthly =====================
const MAG = {
  sections: {
    motor: { color: '#c8202a', page: 12, lead: 'Szívó vagy turbó, a motor ott kezdődik, ahol a levegő bemegy. Ebben a rovatban mindent lemértünk a Nishida-féle padon.' },
    turbo: { color: '#1d4fa3', page: 24, lead: 'A turbó nem csodaszer. Kell hozzá üzemanyag, hideg levegő és egy ECU, ami tudja, mit csinál. Különszám.' },
    hajtas: { color: '#d99a14', page: 36, lead: 'A lóerő semmit nem ér, ha a kuplung csúszik és a belső kerék pörög a hajtűben.' },
    futomu: { color: '#1f7a4a', page: 44, lead: 'Lejjebb, keményebben, okosabban. A hegyen a futómű nyer, nem a motor.' },
    fek: { color: '#6a2a8a', page: 56, lead: 'Tíz hajtű egy lejtőn: ott derül ki, ki spórolt a fékbetéten. És a gumi az egyetlen, ami a földhöz ér.' },
    karosszeria: { color: '#17151a', page: 66, lead: 'Minden kiló számít. Ami nem kell, az megy. Ami kell, az legyen erős.' },
    kulso: { color: '#c2185b', page: 72, lead: 'Az első kör a hegyen a szemnek szól. Felni, szárny, neon, sárga lámpa. Fényezés és fólia a festőműhelyben.' },
    aero: { color: '#f07a1a', page: 84, lead: 'Deppa, takeyari, works sárvédő: a kaido racerek a nyolcvanas évek versenyautóit vitték az utcára. Mi csak lefényképeztük.' }
  },
  ads: {
    motor: { brand: 'KAMINARI WORKS', jp: 'カミナリワークス', slogan: 'A szikra nálunk kezdődik.', bg: '#111', fg: '#ffd400', mark: 'bolt' },
    turbo: { brand: 'TSUYOSHI RACING', jp: '剛レーシング', slogan: 'Hallani fogod, mielőtt meglátod.', bg: '#c8202a', fg: '#fff', mark: 'snail' },
    hajtas: { brand: 'KUROGANE', jp: '鉄', slogan: 'Vasból. Neked.', bg: '#4a4f57', fg: '#f1efe8', mark: 'kanji' },
    futomu: { brand: 'YAMAKAZE', jp: '山風', slogan: 'Lejjebb. Keményebben. Gyorsabban.', bg: '#1f7a4a', fg: '#f6f3e6', mark: 'wave' },
    fek: { brand: 'MICHIRU TYRE', jp: 'ミチル', slogan: 'Az egyetlen, ami a földhöz ér.', bg: '#ece7da', fg: '#17151a', mark: 'tyre' },
    karosszeria: { brand: 'RONIN GARAGE', jp: '浪人', slogan: 'Gazda nélkül, szabály nélkül.', bg: '#17151a', fg: '#e9e4d6', mark: 'brush' },
    kulso: { brand: 'RAYS OF TSUKI', jp: '月光ホイール', slogan: 'Kovácsolva, holdfénynél.', bg: '#0e1430', fg: '#e8d7a0', mark: 'tyre' },
    aero: { brand: 'BŌSŌ STYLE', jp: '暴走スタイル', slogan: 'Túl hangos? Akkor jó.', bg: '#f07a1a', fg: '#17151a', mark: 'bolt' }
  },
  pick: { exhaust1: 1, inj1: 1, lsd15: 1, coil1: 1, tire1: 1, strip1: 1, wheel3: 1, lights1: 1 },
  fresh: { turbo28: 1, tire2: 1, wheel2: 1, ecu1: 1, neon1: 1, flares1: 1, wheel5: 1, wing5: 1, pipes1: 1, bumper2: 1, wheel7: 1, flares2: 1, intneon1: 1 }
};

// What the part would do to *your* car, measured like the editors would.
function partEffect(c, p) {
  const bad = partAllowed(p, c); if (bad) return { lines: [], warn: bad, bad: true };
  if (p.fx.decal) return { lines: ['csak a szemnek'], warn: null };
  const base = carSpec(c);
  const t = JSON.parse(JSON.stringify(c)); t.parts[p.slot] = { id: p.id, q: 1 };
  if (p.fx.boostDefault && !CARS[c.model].engine.turbo) t.tune.boost = p.fx.boostDefault;
  if (p.slot === 'tires') t.cond.tires = 1;
  const sp = carSpec(t), lines = [];
  const sg = v => (v > 0 ? '+' : '−') + Math.abs(v);
  const dPS = Math.round(sp.ps - base.ps); if (dPS) lines.push(`${sg(dPS)} LE`);
  const dNm = Math.round(sp.nm - base.nm); if (dNm && Math.abs(dNm) >= 3 && Math.abs(dPS) < 3) lines.push(`${sg(dNm)} Nm`);
  const dm = Math.round(sp.mass - base.mass); if (dm) lines.push(`${sg(dm)} kg`);
  const dg = Math.round(((sp.muF + sp.muR) / (base.muF + base.muR) - 1) * 1000) / 10; if (Math.abs(dg) >= 0.5) lines.push(`tapadás ${dg > 0 ? '+' : '−'}${Math.abs(dg)}%`);
  const db = Math.round((sp.brake / base.brake - 1) * 100); if (db) lines.push(`fékerő ${sg(db)}%`);
  if (p.fx.clutch) lines.push(`kuplung +${Math.round((p.fx.clutch - 1) * 100)}%`);
  if (p.fx.ecu) lines.push('hangolható térkép');
  if (p.fx.finalKit) lines.push('állítható végáttétel');
  if (p.fx.coilover) lines.push('állítható magasság');
  if (p.fx.arb || p.fx.camber) lines.push('állítható egyensúly');
  if (p.fx.lsd) lines.push('belső kerék nem pörög');
  if (p.fx.hbrake) lines.push(`kézifék ×${p.fx.hbrake}`);
  let warn = null;
  if (sp.curve.minMargin < -3) warn = 'Gyári ECU-val tönkreteszi a motort!';
  else if (sp.curve.knockAny && !base.curve.knockAny) warn = 'Kopogni fog. ECU-val vissza kell hangolni.';
  else if (sp.curve.maxDuty > 1 && base.curve.maxDuty <= 1) warn = `Kevés lesz az üzemanyag (${fuelBottleneck(t)}).`;
  if (!lines.length) lines.push((CATS.find(c => c.id === 'kulso').slots.concat(CATS.find(c => c.id === 'aero').slots)).includes(p.slot) ? 'stílus, nem idő' : 'nincs mérhető változás');
  return { lines, warn };
}

const Magazine = {
  page: 0,
  render(wrap) {
    const c = car();
    const keepY = this.mag ? Array.from(this.mag.children).map(pg => pg.scrollTop) : null;
    wrap.replaceChildren();
    const mag = el('div', { class: 'mag', id: 'magPages' });
    const pages = [this.cover(c), this.toc(c), ...CATS.map(ct => this.section(ct, c))];
    pages.forEach((pg, i) => { pg.dataset.idx = i; mag.append(pg); });
    const label = el('span', { class: 'mb-label' });
    const prev = el('button', { class: 'mb-btn', 'aria-label': 'Előző oldal', onclick: () => this.go(this.page - 1) }, '◀');
    const next = el('button', { class: 'mb-btn', 'aria-label': 'Következő oldal', onclick: () => this.go(this.page + 1) }, '▶');
    const bar = el('div', { class: 'magbar' }, prev, label, next);
    wrap.append(mag, bar);
    this.mag = mag; this.label = label; this.count = pages.length;
    const names = ['Címlap', 'Tartalom', ...CATS.map(ct => ct.name)];
    const upd = () => { const i = Math.round(mag.scrollLeft / Math.max(1, mag.clientWidth)); if (i !== this.labelIdx) { this.labelIdx = i; this.page = i; label.textContent = `${i + 1} / ${pages.length} · ${names[i]}`; prev.disabled = i === 0; next.disabled = i === pages.length - 1; this.paint(); } };
    mag.addEventListener('scroll', () => requestAnimationFrame(upd), { passive: true });
    this.labelIdx = -1;
    requestAnimationFrame(() => { mag.scrollLeft = this.page * mag.clientWidth; if (keepY) Array.from(mag.children).forEach((pg, i) => { pg.scrollTop = keepY[i] || 0; }); upd(); this.paint(); });
  },
  go(i) { i = clamp(i, 0, this.count - 1); this.page = i; this.mag.scrollTo({ left: i * this.mag.clientWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); },
  paint() { // draw every illustration once the layout has a size
    for (const cv of $$('canvas[data-part]', this.mag)) { if (cv.dataset.done) continue; const r = cv.getBoundingClientRect(); if (!r.width) continue; const d = Math.min(2, devicePixelRatio || 1); cv.width = r.width * d; cv.height = r.height * d; const g = cv.getContext('2d'); g.scale(d, d); partArt(g, PART[cv.dataset.part], r.width, r.height); cv.dataset.done = 1; }
    const cov = $('canvas.cover-art', this.mag); if (cov && !cov.dataset.done) { this.coverArt(cov); cov.dataset.done = 1; }
  },
  cover(c) {
    const M = CARS[c.model], sp = carSpec(c);
    const lines = [
      ['turbo', 'KÜLÖNSZÁM', 'Turbó a hegyen: mennyi bar fér bele?'],
      ['motor', 'PADON MÉRVE', 'Mennyit ér egy leömlő? Számok, nem ígéretek.'],
      ['futomu', '12 OLDAL', 'Futómű: így tapad a hajtűben'],
      ['kulso', 'STÍLUS', 'Neon, sárga lámpa, mélytányér: így néz ki 1997']];
    return el('section', { class: 'pg cover' },
      el('canvas', { class: 'cover-art', 'aria-hidden': 'true' }),
      el('div', { class: 'cover-in' },
        el('div', { class: 'cv-top' }, el('span', null, '月刊ナイトパス'), el('span', null, '1997年11月号 · ¥680')),
        el('div', { class: 'cv-mast' }, 'NIGHT PASS'),
        el('div', { class: 'cv-sub' }, 'A hegyi utak magazinja · 峠と走り屋のための専門誌'),
        el('div', { class: 'cv-lines' }, ...lines.map(([cat, kick, txt]) => el('button', { class: 'cv-line', onclick: () => this.go(2 + CATS.findIndex(x => x.id === cat)) }, el('b', { style: `background:${MAG.sections[cat].color}` }, kick), el('span', null, txt)))),
        el('div', { class: 'cv-reader' }, el('small', null, 'OLVASÓI AUTÓ'), el('b', null, M.name), el('span', null, `${Math.round(sp.ps)} LE · ${Math.round(sp.mass)} kg · ${M.layout}`)),
        el('div', { class: 'cv-barcode', 'aria-hidden': 'true' })));
  },
  coverArt(cv) {
    const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); cv.width = r.width * d; cv.height = r.height * d;
    const g = cv.getContext('2d'); g.scale(d, d); const W = r.width, H = r.height;
    const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#070912'); sky.addColorStop(0.55, '#1a1a33'); sky.addColorStop(0.75, '#3a2230'); sky.addColorStop(1, '#0b0b10');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(255,255,255,${0.2 + Math.random() * 0.5})`; g.fillRect(Math.random() * W, Math.random() * H * 0.5, 1.2, 1.2); }
    for (let l = 0; l < 3; l++) { g.fillStyle = ['#151629', '#0e0f1c', '#07080e'][l]; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 10) g.lineTo(x, H * (0.5 + l * 0.08) + Math.sin(x / (90 - l * 20) + l * 2) * 26 + Math.sin(x / 31) * 6); g.lineTo(W, H); g.fill(); }
    // city glow far below
    for (let i = 0; i < 140; i++) { const x = Math.random() * W, y = H * (0.66 + Math.random() * 0.05); g.fillStyle = Math.random() < 0.7 ? 'rgba(255,170,80,0.8)' : 'rgba(200,220,255,0.7)'; g.fillRect(x, y, 1.5, 1.5); }
    // road and lamps
    const gy = H * 0.86;
    g.fillStyle = '#121216'; g.fillRect(0, gy - 6, W, H - gy + 6);
    for (let i = 0; i < 4; i++) { const x = W * (0.1 + i * 0.28); const lg = g.createRadialGradient(x, gy - H * 0.32, 2, x, gy - H * 0.32, H * 0.3); lg.addColorStop(0, 'rgba(255,170,70,0.55)'); lg.addColorStop(1, 'rgba(255,140,40,0)'); g.fillStyle = lg; g.fillRect(x - H * 0.3, gy - H * 0.62, H * 0.6, H * 0.6); g.fillStyle = '#555'; g.fillRect(x - 1.5, gy - H * 0.32, 3, H * 0.32); g.fillStyle = '#ffd9a0'; g.fillRect(x - 8, gy - H * 0.33, 16, 4); }
    g.fillStyle = 'rgba(255,170,70,0.12)'; g.fillRect(0, gy - 6, W, 4);
    drawCarSide(g, car(), W * 0.6, gy, Math.min(W * 0.62, H * 1.05));
  },
  toc(c) {
    const o = el('div', { class: 'order-form' }, el('h4', null, 'MEGRENDELŐLAP · 注文書'),
      S.orders.length ? el('ul', null, ...S.orders.map(x => el('li', null, el('span', null, PART[x.pid].name), el('i', null, x.arrive - S.day <= 1 ? 'holnap reggel' : `${x.arrive - S.day} nap múlva`))))
        : el('p', null, 'Jelenleg nincs úton csomag. Válassz a rovatokból, a futár reggel hozza.'));
    const tip = this.editorTip(c);
    return el('section', { class: 'pg paper' }, el('div', { class: 'pg-in' },
      el('div', { class: 'runhead' }, el('span', null, 'NIGHT PASS · 1997.11'), el('span', null, '3')),
      el('h2', { class: 'toc-h' }, 'TARTALOM ', el('span', null, '目次')),
      el('div', { class: 'toc' }, ...CATS.map((ct, i) => el('button', { class: 'toc-row', onclick: () => this.go(2 + i) },
        el('b', { style: `background:${MAG.sections[ct.id].color}` }, String(MAG.sections[ct.id].page)),
        el('span', null, el('strong', null, ct.name), el('em', null, ct.jp)), el('small', null, MAG.sections[ct.id].lead)))),
      el('div', { class: 'toc-foot' }, o,
        el('div', { class: 'editor' }, el('h4', null, 'A SZERKESZTŐ AJÁNLJA'), el('p', null, tip)))));
  },
  editorTip(c) {
    const E = CARS[c.model].engine, has = s => !!c.parts[s];
    if (c.cond.tires < 0.4) return 'Előbb gumi. Ennyire kopott gumival a legjobb motor is csak csúszkál. Fék és gumi rovat, 56. oldal.';
    if (!E.turbo && !has('turbo') && !has('exhaust')) return `Egy ${CARS[c.model].name}-nál a kipufogó és a szívócső az első lépés: olcsó, és a padon is látszik. Motor rovat, 12. oldal.`;
    if (has('turbo') && !has('ecu')) return 'Turbó van, ECU nincs? Ez így nem fog sokáig tartani. Programozható ECU a Motor rovatban, injektor a Turbó különszámban.';
    if (!has('lsd')) return 'Ha a hajtűből kifelé pörög a belső kerék, önzáró kell. Erőátvitel rovat, 36. oldal.';
    if (!has('susp')) return 'A futómű nyeri meg a hegyet. Menetes futómű nélkül nem tudod beállítani az egyensúlyt. 44. oldal.';
    return 'Jó úton jársz. Most a súlyon spórolj: kagylóülés, kárpit ki, karbon motorháztető. Karosszéria rovat, 66. oldal.';
  },
  section(ct, c) {
    const meta = MAG.sections[ct.id], ad = MAG.ads[ct.id];
    const parts = PARTS.filter(p => ct.slots.includes(p.slot));
    const cards = parts.map((p, i) => this.card(p, c, meta.color, i));
    const adEl = el('div', { class: 'ad', style: `background:${ad.bg};color:${ad.fg}` },
      el('div', { class: 'ad-mark ad-' + ad.mark, 'aria-hidden': 'true' }),
      el('div', null, el('div', { class: 'ad-jp' }, ad.jp), el('div', { class: 'ad-brand' }, ad.brand), el('div', { class: 'ad-slogan' }, ad.slogan)),
      el('div', { class: 'ad-foot' }, 'Kapható a NIGHT PASS megrendelőlapján'));
    const mid = Math.min(cards.length, 3);
    return el('section', { class: 'pg paper' }, el('div', { class: 'pg-in' },
      el('div', { class: 'runhead' }, el('span', null, 'NIGHT PASS · 1997.11'), el('span', null, String(meta.page))),
      el('div', { class: 'sec-head', style: `background:${meta.color}` }, el('div', { class: 'sec-jp' }, ct.jp), el('h2', null, ct.name.toUpperCase()), el('p', null, meta.lead)),
      el('div', { class: 'cards' }, ...cards.slice(0, mid), adEl, ...cards.slice(mid))));
  },
  card(p, c, color, i) {
    const eff = partEffect(c, p), inst = c.parts[p.slot] && c.parts[p.slot].id === p.id;
    const onShelf = S.inv.includes(p.id), ordered = S.orders.some(o => o.pid === p.id);
    const bolts = boltsFor(p, c), tq = torqueFor(p, c);
    const stamp = inst ? 'BESZERELVE' : onShelf ? 'A POLCON' : ordered ? 'ÚTON' : null;
    return el('article', { class: 'card' + (eff.bad ? ' nope' : '') },
      el('div', { class: 'card-art' }, el('canvas', { 'data-part': p.id, 'aria-hidden': 'true' }),
        MAG.fresh[p.id] ? el('span', { class: 'badge new' }, 'ÚJ!') : MAG.pick[p.id] ? el('span', { class: 'badge pick' }, 'SZERK. VÁLASZTÁSA') : null,
        el('div', { class: 'burst' }, el('span', null, p.price ? '¥' + Math.round(p.price).toLocaleString('hu-HU').replace(/,/g, ' ') : 'INGYEN')),
        stamp ? el('span', { class: 'stamp' }, stamp) : null),
      el('div', { class: 'card-body' },
        el('div', { class: 'brand', style: `color:${color}` }, p.brand),
        el('h3', null, p.name),
        el('p', null, p.desc),
        el('div', { class: 'measure' }, el('small', null, eff.bad ? 'NEM ILLIK' : 'MÉRÉS A TE AUTÓDON'), el('b', null, eff.bad ? eff.warn : eff.lines.join(' · '))),
        !eff.bad && eff.warn ? el('div', { class: 'warnline' }, '⚠ ' + eff.warn) : null,
        el('dl', null,
          el('dt', null, 'Szállítás'), el('dd', null, p.days === 0 ? 'azonnal' : p.days === 1 ? 'holnap reggel' : `${p.days} nap`),
          el('dt', null, 'Szerelés'), el('dd', null, bolts ? `${bolts} csavar · ${tq} Nm${p.passes === 2 ? ' · 2 menet' : ''}` : 'ragasztás'),
          p.w ? el('dt', null, 'Súly') : null, p.w ? el('dd', null, (p.w > 0 ? '+' : '−') + Math.abs(p.w) + ' kg') : null),
        el('button', { class: 'coupon', disabled: eff.bad, onclick: () => UI.order(p) }, el('span', null, p.days === 0 ? 'ELKEZDEM' : 'MEGRENDELEM'), el('small', null, p.price ? fmtY(p.price) : 'ingyen'))));
  }
};
