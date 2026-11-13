// ===================== NIGHT MEET: the upper parking area, street racers, wager runs, a boot-sale =====================
const MEET_PEOPLE = [
  ['Kōhei', 'Garage Hayate'], ['Masaru', 'Midnight Ramen Club'], ['Yūta', 'Shimizu Speed'], ['Haruka', 'Team Sakura'], ['Ren', 'Lantern Boys'],
  ['Satoshi', 'Ginga Racing'], ['Miyu', 'Team Sakura'], ['Yoshi', 'egyedül jár'], ['Tsubasa', 'Tōge Ghosts'], ['Akira', 'Garage Hayate'],
  ['Kaito', 'Lantern Boys'], ['Rika', 'Ginga Racing'], ['Sho', 'Tōge Ghosts'], ['Daigo', 'Midnight Ramen Club'], ['Nao', 'egyedül jár'], ['Tomoya', 'Shimizu Speed']
];
const MEET_LINES = [
  'Láttam a kocsidat lent a benzinkútnál. Kíváncsi vagyok, mennyit ér.', 'Egy kör, tét a motorháztetőn. Vagy félsz?', 'Ma este nem hazamenni jöttem.',
  'Ezt a felnit három hónapig kerestem. Most megmutatom, mire jó.', 'Mondják, gyors vagy. Mondanak sok mindent.', 'A gumijaim még melegek. Siess.',
  'Apám kocsija. Ha összetöröd, mindkettőnket megöl.', 'A kávé a tiéd, ha előttem érsz fel.', 'Nem a lóerő a lényeg. Csak nekem több van.',
  'Bal hajtűnél mindig elkések a fékkel. Ma nem.', 'Egy kör. Utána mehetünk ramenezni.', 'Ha nyersz, megmondom, ki hangolta.'
];
const Meet = {
  // deterministic per save and day: the same faces all evening
  roster() {
    const st = this.state(), rep = st.rep;
    if (this._day === S.day && this._seed === S.wseed && this._rep === rep) return this._roster;
    const rnd = seeded(S.day * 13 + 5 + (S.wseed || 7) * 3), pick = a => a[Math.floor(rnd() * a.length)];
    const open = TOUGES.filter(t => rep >= t.reqRep), budget = 900000 + rep * 26000;
    const models = Object.keys(CARS).filter(m => CARS[m].price <= budget);
    const bySlot = s => PARTS.filter(p => p.slot === s).map(p => p.id);
    const used = new Set(), usedM = new Set(), out = [];
    for (let i = 0; i < 4; i++) {
      let who; do { who = pick(MEET_PEOPLE); } while (used.has(who[0])); used.add(who[0]);
      let model; for (let k = 0; k < 8; k++) { model = pick(models); if (!usedM.has(model)) break; } usedM.add(model);
      const c = newCar(model, pick(PAINTS)[0]);
      const lvl = clamp(0.25 + rnd() * 0.5 + rep * 0.003, 0, 1);
      // visible mods first: they tell you what the car is about
      const parts = {};
      if (rnd() < 0.85) parts.wheels = pick(bySlot('wheels'));
      if (rnd() < 0.3 + lvl * 0.5) parts.wing = pick(bySlot('wing'));
      if (rnd() < 0.25 + lvl * 0.3) parts.kit = pick(bySlot('kit'));
      if (rnd() < lvl * 0.4) parts.flares = pick(bySlot('flares'));
      if (rnd() < 0.3) parts.hood = pick(bySlot('hood'));
      if (rnd() < 0.25) parts.lights = pick(bySlot('lights'));
      if (rnd() < 0.3) parts.tint = pick(bySlot('tint'));
      if (rnd() < 0.15) parts.neon = pick(bySlot('neon'));
      if (rnd() < 0.2) parts.banner = pick(bySlot('banner'));
      if (rnd() < 0.7) parts.susp = pick(bySlot('susp'));
      if (rnd() < 0.6) parts.exhaust = pick(bySlot('exhaust'));
      if (rnd() < 0.4 + lvl * 0.3) parts.intake = pick(bySlot('intake'));
      if (rnd() < lvl * 0.7) parts.ecu = pick(bySlot('ecu'));
      if (rnd() < lvl * 0.6) parts.lsd = pick(bySlot('lsd'));
      if (rnd() < 0.5) parts.tires = pick(bySlot('tires'));
      for (const [slot, ch] of [['bumper', 0.3], ['pipes', 0.22], ['canards', 0.2], ['diffuser', 0.2], ['mirrors', 0.25], ['louver', 0.15], ['tirelet', 0.3], ['intneon', 0.2], ['towhook', 0.3], ['charm', 0.25], ['decal', 0.3]]) if (rnd() < ch * (0.5 + lvl)) parts[slot] = pick(bySlot(slot));
      for (const [slot, id] of Object.entries(parts)) if (id && !partAllowed(PART[id], c)) c.parts[slot] = { id, q: 1 };
      c.look = { finish: pick(['gloss', 'gloss', 'metal', 'metal', 'pearl', 'matte']), livery: rnd() < 0.45 ? pick(Object.keys(LIVERIES)) : null, col2: pick(PAINTS)[0], neon: pick(NEONS)[0] };
      const stock = stockPeakPS(model).ps, boosted = !!CARS[model].engine.turbo, ps = Math.round(stock * (1.02 + lvl * (boosted ? 0.7 : 0.3) + rnd() * 0.08));
      const skill = clamp(0.42 + rnd() * 0.1 + lvl * 0.05, 0.4, 0.62);
      const tg = pick(open), rev = rnd() < 0.4;
      const wager = Math.max(10000, Math.round((ps * 140 + skill * 60000) / 5000) * 5000);
      out.push({ mid: `m${S.day}_${i}`, name: who[0], team: who[1], c, ps, skill, tg: tg.id, rev, wager, line: pick(MEET_LINES) });
    }
    // the boot sale: three used parts at a discount, no shipping
    const pool = PARTS.filter(p => !['tires', 'decal', 'banner', 'tint', 'interior', 'seat'].includes(p.slot) && p.price >= 20000);
    const sale = []; const seen = new Set();
    for (let k = 0; k < 3 && pool.length; k++) { let p; do { p = pick(pool); } while (seen.has(p.id) && seen.size < pool.length); seen.add(p.id); sale.push({ pid: p.id, price: Math.round(p.price * (0.48 + rnd() * 0.17) / 1000) * 1000 }); }
    this._day = S.day; this._seed = S.wseed; this._rep = rep; this._roster = { racers: out, sale };
    return this._roster;
  },
  state() { if (!S.meet || S.meet.day !== S.day) S.meet = { day: S.day, done: {}, sold: {}, rep: S.rep }; if (S.meet.rep == null) S.meet.rep = S.rep; return S.meet; },
  rivalOf(r) {
    return { id: r.mid, name: r.name, team: r.team, car: r.c.model, color: r.c.paint, look: r.c.look, vis: carVisual(r.c), ps: r.ps, skill: r.skill, prize: r.wager, rep: Math.round(3 + r.skill * 10), line: r.line, meet: true };
  },
  open() {
    const R = this.roster(), st = this.state(), c = car(), ready = raceReadiness(c);
    const wrap = el('div', { class: 'meet' });
    wrap.append(el('div', { class: 'meet-art' }, el('canvas', { id: 'meetArt' }), el('div', { class: 'jp' }, '夜の集会')));
    wrap.append(el('p', { class: 'muted', style: 'margin:0' }, 'Éjfél után a felső parkolóban gyűlnek. Automata, kávé, cigaretta, nyitott motorháztetők. Itt nincs bajnokság: egy kör, egy tét, és reggelre mindenki tudja, ki fizetett.'));
    if (ready) wrap.append(el('div', { class: 'panel', style: 'border-color:#6b2630' }, ready));
    const list = el('div', { class: 'meet-list' });
    R.racers.forEach((r, i) => {
      const tg = tougeDir(TOUGES.find(t => t.id === r.tg), r.rev), done = st.done[r.mid], M2 = CARS[r.c.model];
      const mods = Object.values(r.c.parts).map(p => PART[p.id]).filter(Boolean);
      const vis = mods.filter(p => ['wheels', 'wing', 'kit', 'flares', 'hood', 'lights', 'tint', 'neon', 'banner'].includes(p.slot)).map(p => p.name);
      const hid = mods.filter(p => ['susp', 'exhaust', 'intake', 'ecu', 'lsd', 'tires'].includes(p.slot)).map(p => p.name);
      list.append(el('article', { class: 'meet-car' + (done ? ' done' : '') },
        el('div', { class: 'deal-art' }, el('canvas', { class: 'meet-thumb', 'data-i': i }), done ? el('span', { class: 'stamp' }, done === 'win' ? 'MEGVERTED' : 'KIFIZETVE') : null),
        el('div', { class: 'deal-body' },
          el('div', { class: 'b' }, `${r.name} · ${r.team}`),
          el('div', { class: 't' }, M2.name),
          el('div', { class: 'd' }, `„${r.line}”`),
          el('div', { class: 'meta' }, el('span', { class: 'tag' }, `kb. ${r.ps} LE`), el('span', { class: 'tag' }, M2.layout), el('span', { class: 'tag' }, `${tg.name.replace('-tōge', '').replace('-zaka', '')} · ${dirName(tg)}`)),
          vis.length || hid.length ? el('details', { class: 'meet-mods' }, el('summary', null, 'Mit látsz a motorháztető alatt'),
            el('ul', null, ...vis.map(n => el('li', null, n)), ...hid.map(n => el('li', { class: 'muted' }, n)))) : null,
          el('div', { class: 'deal-buy' }, el('span', { class: 'price' }, fmtY(r.wager)),
            el('button', { class: 'btn small primary', disabled: !!done || !!ready || S.money < r.wager, title: S.money < r.wager ? 'Nincs ennyi pénzed a tétre.' : '', onclick: () => { UI.close(); Race.start(tg, this.rivalOf(r), 'meet'); } }, done ? 'Ma már volt' : S.money < r.wager ? 'Nincs rá pénzed' : 'Kihívom')))));
    });
    wrap.append(list);
    // boot sale
    const sale = el('div', { class: 'panel meet-sale' }, el('div', { class: 'h', style: 'margin-bottom:6px' }, el('h3', { style: 'margin:0' }, 'Csomagtartóból'), el('span', { class: 'jp', style: 'font-size:13px' }, '中古部品'),
      el('p', null, 'Gorō bácsi minden éjjel itt áll a kisbuszával. Használt, de átnézett alkatrészek, számla nélkül. Azonnal viheted.')));
    for (const it of R.sale) {
      const p = PART[it.pid], sold = st.sold[it.pid];
      sale.append(el('div', { class: 'item' },
        el('div', null, el('div', { class: 't' }, p.name), el('div', { class: 'muted', style: 'font-size:12.5px' }, `${p.brand} · újonnan ${fmtY(p.price)} · ${SLOTS[p.slot] || p.slot}`),
          partAllowed(p, car()) ? el('span', { class: 'tag warn', style: 'margin-top:4px;display:inline-block' }, `A mostani kocsidra nem jó: ${partAllowed(p, car()).toLowerCase()}`) : null),
        el('button', { class: 'btn small', disabled: !!sold || S.money < it.price, onclick: () => { if (!UI.spend(it.price)) return; S.inv.push(it.pid); st.sold[it.pid] = true; S.stats.bootsale = (S.stats.bootsale || 0) + 1; toast(`${p.name} a csomagtartóban. Irány a szerelés.`, 'good'); save(); UI.render(); this.open(); } }, sold ? 'Elvitted' : fmtY(it.price))));
    }
    wrap.append(sale);
    UI.open([UI.head('Gyülekező a pihenőben', `${S.day}. nap éjjel · ${WEATHER[weatherNow()].short.toLowerCase()} · rendőri figyelem: ${heatLabel(S.heat || 0)}`), wrap]);
    requestAnimationFrame(() => this.paint());
  },
  paint() {
    const R = this.roster(), d = Math.min(2, devicePixelRatio || 1);
    const art = $('#meetArt');
    if (art) {
      const r = art.getBoundingClientRect(); if (r.width) { art.width = r.width * d; art.height = r.height * d; const g = art.getContext('2d'); g.scale(d, d); this.scene(g, r.width, r.height, R.racers); }
    }
    for (const cv of $$('canvas.meet-thumb')) {
      const r = cv.getBoundingClientRect(); if (!r.width) continue;
      cv.width = r.width * d; cv.height = r.height * d; const g = cv.getContext('2d'); g.scale(d, d);
      const bg = g.createLinearGradient(0, 0, 0, r.height); bg.addColorStop(0, '#141826'); bg.addColorStop(0.72, '#20232d'); bg.addColorStop(0.73, '#2a2a29'); bg.addColorStop(1, '#161615');
      g.fillStyle = bg; g.fillRect(0, 0, r.width, r.height);
      const lg = g.createRadialGradient(r.width * 0.5, 0, 4, r.width * 0.5, r.height * 0.3, r.width * 0.7); lg.addColorStop(0, 'rgba(255,190,120,0.22)'); lg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = lg; g.fillRect(0, 0, r.width, r.height);
      g.strokeStyle = 'rgba(230,226,214,0.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(r.width * 0.04, r.height * 0.96); g.lineTo(r.width * 0.1, r.height * 0.74); g.moveTo(r.width * 0.96, r.height * 0.96); g.lineTo(r.width * 0.9, r.height * 0.74); g.stroke();
      const rc = R.racers[+cv.dataset.i]; if (!rc) continue;
      drawCarSide(g, rc.c, r.width / 2, r.height * 0.86, Math.min(r.width * 0.84, r.height * 2.3) * (CARS[rc.c.model].length / 4.6));
    }
  },
  // the parking area at night: city glow below, vending machines, a sodium lamp, cars in their bays
  scene(g, W, H, racers) {
    const sky = g.createLinearGradient(0, 0, 0, H * 0.6); sky.addColorStop(0, '#05070e'); sky.addColorStop(1, '#141a2c'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
    let r = 77; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < 50; i++) { g.fillStyle = `rgba(255,255,255,${0.2 + rnd() * 0.5})`; g.fillRect(rnd() * W, rnd() * H * 0.35, 1, 1); }
    g.fillStyle = '#0b0e18'; g.beginPath(); g.moveTo(0, H * 0.5); for (let x = 0; x <= W; x += 10) g.lineTo(x, H * 0.44 + Math.sin(x / 70) * 10 + Math.sin(x / 23) * 4); g.lineTo(W, H * 0.62); g.lineTo(0, H * 0.62); g.fill();
    for (let i = 0; i < 160; i++) { const c = ['255,170,90', '255,230,190', '170,210,255'][Math.floor(rnd() * 3)]; g.fillStyle = `rgba(${c},${0.4 + rnd() * 0.5})`; g.fillRect(rnd() * W, H * 0.5 + rnd() * H * 0.1, 1.5, 1.5); }
    const ground = g.createLinearGradient(0, H * 0.6, 0, H); ground.addColorStop(0, '#1d1e22'); ground.addColorStop(1, '#2a2a2b'); g.fillStyle = ground; g.fillRect(0, H * 0.6, W, H * 0.4);
    // sodium lamp pool
    const lx = W * 0.32, lp = g.createRadialGradient(lx, H * 0.78, 6, lx, H * 0.78, W * 0.45); lp.addColorStop(0, 'rgba(255,160,70,0.32)'); lp.addColorStop(1, 'rgba(255,160,70,0)'); g.fillStyle = lp; g.fillRect(0, H * 0.6, W, H * 0.4);
    g.fillStyle = '#3a3d44'; g.fillRect(lx - 2, H * 0.12, 4, H * 0.5); g.fillRect(lx - 2, H * 0.12, 26, 3);
    const lh = g.createRadialGradient(lx + 24, H * 0.13, 1, lx + 24, H * 0.13, 30); lh.addColorStop(0, 'rgba(255,190,110,1)'); lh.addColorStop(1, 'rgba(255,160,60,0)'); g.fillStyle = lh; g.fillRect(lx - 10, H * 0.02, 70, 60);
    // vending machines
    const vx = W * 0.86;
    for (let k = 0; k < 2; k++) {
      const x = vx + k * Math.min(34, W * 0.05), w = Math.min(30, W * 0.045), h = H * 0.3, y = H * 0.66 - h;
      const vg = g.createRadialGradient(x + w / 2, y + h / 2, 4, x + w / 2, y + h / 2, h); vg.addColorStop(0, 'rgba(190,220,255,0.35)'); vg.addColorStop(1, 'rgba(190,220,255,0)'); g.fillStyle = vg; g.fillRect(x - h, y - h / 2, w + 2 * h, h * 2);
      g.fillStyle = k ? '#c8202a' : '#e9e6dc'; g.fillRect(x, y, w, h); g.fillStyle = '#dff0ff'; g.fillRect(x + 3, y + 4, w - 6, h * 0.42);
      g.fillStyle = 'rgba(30,60,120,0.6)'; for (let j = 0; j < 3; j++) for (let q = 0; q < 3; q++) g.fillRect(x + 5 + q * (w - 10) / 3, y + 7 + j * h * 0.13, (w - 14) / 3, h * 0.09);
    }
    // bays
    g.strokeStyle = 'rgba(230,226,214,0.45)'; g.lineWidth = 2;
    const n = racers.length, bay = W * 0.78 / n;
    for (let i = 0; i <= n; i++) { const x = W * 0.04 + i * bay; g.beginPath(); g.moveTo(x - 14, H * 0.98); g.lineTo(x, H * 0.7); g.stroke(); }
    racers.forEach((rc, i) => { const len = Math.min(bay * 0.95, H * 0.7) * (CARS[rc.c.model].length / 4.6); drawCarSide(g, rc.c, W * 0.04 + (i + 0.5) * bay, H * 0.93, len); });
    const vg2 = g.createLinearGradient(0, 0, 0, H); vg2.addColorStop(0, 'rgba(5,6,10,0.2)'); vg2.addColorStop(1, 'rgba(5,6,10,0.25)'); g.fillStyle = vg2; g.fillRect(0, 0, W, H);
  }
};
