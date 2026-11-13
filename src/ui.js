// ===================== UI =====================
const UI = {
  scr: 'garage', shopCat: 'motor', tuneTab: 'ecu', lastDyno: null,
  init() {
    $$('#nav button').forEach(b => b.addEventListener('click', () => this.show(b.dataset.scr)));
    $('#btnSleep').addEventListener('click', () => this.sleep());
    $('#btnDecor').addEventListener('click', () => this.toggleDecor());
    $('#btnWalk').addEventListener('click', () => { Audio2.init(); GarageWalk.open(); });
    $('#btnSettings').addEventListener('click', () => this.settings());
    $('#btnPrevCar').addEventListener('click', () => this.switchCar(-1));
    $('#btnNextCar').addEventListener('click', () => this.switchCar(1));
    $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal' && !this.modalLocked) this.close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#modal').hidden && !this.modalLocked) this.close(); });
  },
  show(scr) {
    this.scr = scr;
    $$('#nav button').forEach(b => b.setAttribute('aria-current', b.dataset.scr === scr ? 'true' : 'false'));
    $$('.screen').forEach(s => { s.hidden = s.id !== 'scr-' + scr; });
    Garage.visible = scr === 'garage';
    if (scr !== 'garage' && Garage.decorMode) this.toggleDecor();
    this.render();
  },
  render() {
    $('#stMoney').textContent = fmtY(S.money);
    $('#stRep').textContent = S.rep;
    $('#stDay').textContent = S.day;
    const inv = S.inv.length; $('#badgeInv').hidden = !inv; $('#badgeInv').textContent = inv;
    const c = car(), sp = carSpec(c);
    $('#gCarName').textContent = CARS[c.model].name;
    $('#gCarSpec').textContent = `${Math.round(sp.ps)} LE · ${Math.round(sp.nm)} Nm · ${Math.round(sp.mass)} kg · ${CARS[c.model].layout}`;
    $('#gNews').textContent = S.news[0] || ''; const gw = $('#gWx'); if (gw) gw.replaceChildren(el('span', { class: 'muted' }, 'Ma éjjel '), weatherBadge(weatherNow(), true)); $('#tNews').textContent = S.news[0] || '';
    $('#btnPrevCar').hidden = $('#btnNextCar').hidden = S.cars.length < 2;
    Garage.dirty = true;
    if (this.scr === 'car') this.renderCar();
    if (this.scr === 'shop') this.renderShop();
    if (this.scr === 'tune') this.renderTune();
    if (this.scr === 'dyno') this.renderDyno();
    if (this.scr === 'touge') this.renderTouge();
    if (this.scr === 'work') Jobs.render($('#workWrap'));
  },
  open(nodes, locked) {
    const sh = $('#sheet'); sh.replaceChildren(...[].concat(nodes).filter(Boolean)); $('#modal').hidden = false; this.modalLocked = !!locked;
  },
  close() { $('#modal').hidden = true; this.modalLocked = false; if (this.onClose) { const f = this.onClose; this.onClose = null; f(); } },
  head(title, sub) {
    return el('div', { class: 'sheet-head' }, el('div', null, el('h3', null, title), sub ? el('div', { class: 'muted' }, sub) : null),
      el('button', { class: 'iconbtn', 'aria-label': 'Bezárás', onclick: () => this.close() }, '✕'));
  },
  spend(n) { if (S.money < n) { toast('Nincs rá elég pénzed.', 'bad'); return false; } S.money -= n; return true; },

  // ---------------- garage actions
  sleep() {
    const arrived = advanceDay();
    const wxs = ` Ma éjjel: ${WEATHER[weatherNow()].short.toLowerCase()}.`;
    toast(arrived.length ? `${S.day}. nap. Megjött: ${arrived.map(o => PART[o.pid].name).join(', ')}.${wxs}` : `${S.day}. nap. Csend a garázsban.${wxs}`, arrived.length ? 'good' : '');
    save(); this.render();
  },
  toggleDecor() {
    Garage.decorMode = !Garage.decorMode; Garage.dirty = true;
    $('#decorHint').hidden = !Garage.decorMode;
    $('#btnDecor').textContent = Garage.decorMode ? 'Kész' : 'Berendezés';
  },
  switchCar(d) { S.active = (S.active + d + S.cars.length) % S.cars.length; save(); this.render(); },
  decorPicker(key) {
    const def = DECOR[key];
    const list = el('div', { class: 'items' });
    const cur = S.decor[key];
    const canEmpty = !['floor', 'light'].includes(key);
    if (canEmpty) list.append(el('div', { class: 'item' }, el('div', { class: 't' }, 'Üresen hagyom'), el('button', { class: 'btn small', disabled: !cur, onclick: () => { S.decor[key] = null; save(); this.close(); this.render(); } }, cur ? 'Leszed' : 'Üres')));
    for (const it of def.items) {
      const owned = S.ownedDecor.includes(it.id), on = cur === it.id;
      list.append(el('div', { class: 'item' },
        el('div', null, el('div', { class: 't' }, it.name), el('div', { class: 'muted' }, owned ? 'Megvan' : fmtY(it.price))),
        el('button', { class: 'btn small ' + (owned ? '' : 'primary'), disabled: on, onclick: () => {
          if (!owned) { if (!this.spend(it.price)) return; S.ownedDecor.push(it.id); toast(`Megvetted: ${it.name}`); }
          S.decor[key] = it.id; save(); this.close(); this.render();
        } }, on ? 'Kint van' : owned ? 'Felrak' : 'Megvesz')));
    }
    this.open([this.head(def.name, 'Barkácsbolt · a garázsod a te dolgod'), list]);
  },
  settings() {
    const st = S.settings, keep = !$('#modal').hidden ? $('#sheet').scrollTop : 0;
    const tog = (key, label, hint) => el('label', { class: 'item', style: 'cursor:pointer' },
      el('div', null, el('div', { class: 't' }, label), el('div', { class: 'muted', style: 'font-size:12.5px' }, hint)),
      el('input', { type: 'checkbox', id: 'set-' + key, checked: st[key], style: 'width:22px;height:22px;accent-color:var(--sodium)', onchange: (e) => { st[key] = e.target.checked; st.aid = 'egyeni'; save(); this.settings(); } }));
    const sel = (key, label, opts, hint, after) => el('div', { class: 'item' }, el('div', null, el('div', { class: 't' }, label), hint ? el('div', { class: 'muted', style: 'font-size:12.5px' }, hint) : null),
      el('div', { class: 'row', style: 'grid-column:1/-1' }, ...opts.map(([v, n]) => el('button', { class: 'chip', 'aria-pressed': st[key] === v ? 'true' : 'false', onclick: () => { st[key] = v; if (after) after(v); save(); this.settings(); } }, n))));
    const presets = {
      konnyu: { abs: true, assist: true, tcs: true, esc: true, brakeAid: true, steerAid: 'strong', autoGas: true },
      kezdo: { abs: true, assist: true, tcs: true, esc: true, brakeAid: false, steerAid: 'weak', autoGas: false },
      halado: { abs: true, assist: true, tcs: false, esc: false, brakeAid: false, steerAid: 'off', autoGas: false },
      profi: { abs: false, assist: false, tcs: false, esc: false, brakeAid: false, steerAid: 'off', autoGas: false } };
    const aidHint = { konnyu: 'Gázt ad, fékez a kanyar előtt és tartja az ívet. Te csak terelgetsz, és bármikor felülbírálhatod.', kezdo: 'Segít az íven, és a kocsi nem pördül ki magától. A gáz és a fék a tiéd: magától nem fékez.', halado: 'Blokkolásgátló és enyhe ellenkormány. Driftelni már lehet, de figyelni kell.', profi: 'Semmi segítség. Ahogy a 90-es évek elején.', egyeni: 'Saját beállítás az alábbi kapcsolókkal.' }[st.aid] || '';
    const sensBox = el('div', { class: 'slider', style: 'margin:0' },
      el('label', { for: 'set-sens' }, 'Kormány érzékenysége'), el('output', null, Math.round((st.sens || 1) * 100) + '%'),
      el('input', { type: 'range', id: 'set-sens', min: 0.5, max: 1.6, step: 0.05, value: st.sens || 1, oninput: (e) => { st.sens = parseFloat(e.target.value); e.target.previousSibling.textContent = Math.round(st.sens * 100) + '%'; save(); } }),
      el('div', { class: 'hint' }, st.steer === 'buttons' ? 'Milyen gyorsan fordul be a kormány, amíg nyomod a gombot.' : 'Mennyit kell húznod a teljes kormányszöghöz. Kisebb érték = nyugodtabb kormány.'));
    this.open([this.head('Beállítások'),
      el('div', { class: 'items' },
        sel('aid', 'Vezetési segítség', [['konnyu', 'Könnyű'], ['kezdo', 'Kezdő'], ['halado', 'Haladó'], ['profi', 'Profi']], aidHint, (v) => Object.assign(st, presets[v])),
        sel('steer', 'Kormányzás', [['drag', 'Csúszka'], ['buttons', 'Gombok']], st.steer === 'buttons' ? 'Két nagy gomb bal oldalt. Minél tovább nyomod, annál jobban fordul.' : 'Bal oldalt bárhol tedd le az ujjad és húzd. Középen finomabb.'),
        el('div', { class: 'item' }, sensBox),
        sel('auto', 'Váltó', [[true, 'Automata'], [false, 'Manuális']]),
        sel('notes', 'Itiner', [[true, 'Be'], [false, 'Ki']], 'A következő kanyar iránya, élessége (1 = leglassabb) és távolsága.'),
        sel('steerAid', 'Kormányasszisztens', [['off', 'Ki'], ['weak', 'Gyenge'], ['strong', 'Erős']], 'Az ideális ív felé húzza a kormányt. A te kormányzásod mindig erősebb nála.', () => { st.aid = 'egyeni'; }),
        tog('brakeAid', 'Fékasszisztens', 'Csak akkor fékez helyetted, ha jóval túl gyorsan érkezel a kanyarba. Kikapcsolva soha nem fékez magától.'),
        tog('autoGas', 'Automata gáz', 'Magától gyorsít, ha nem fékezel. Jobb hüvelykujj csak a féké.'),
        tog('esc', 'Menetstabilizáló', 'Visszatereli az autót, ha a far elkezd kitörni.'),
        tog('abs', 'Blokkolásgátló', 'Fékezéskor nem állnak le a kerekek, kormányozható marad az autó.'),
        tog('assist', 'Ellenkormány-segéd', 'Csúszásnál visszakormányoz helyetted, és visszaveszi a gázt.'),
        tog('tcs', 'Kipörgésgátló', 'Elveszi a gázt, ha a hajtott kerék kipörög. A korabeli autókban nem volt.'),
        el('div', { class: 'item' }, el('div', null, el('div', { class: 't' }, 'Rádió'), el('div', { class: 'muted', style: 'font-size:12.5px' }, 'Négy adó, mind a böngészőben szól. A garázsban a magnóra koppintva is válthatsz.')),
          el('div', { class: 'row', style: 'grid-column:1/-1' }, ...Music.STATIONS.map(m => el('button', { class: 'chip', 'aria-pressed': String(Music.station().id === m.id), onclick: () => { Audio2.init(); Music.set(m.id); this.settings(); } }, m.id === 'off' ? 'Ki' : m.name.split(' · ')[1])))),
        el('div', { class: 'item' }, el('div', { class: 'slider', style: 'margin:0' }, el('label', { for: 'set-mvol' }, 'Zene hangereje'), el('output', null, Math.round(Music.vol() * 100) + '%'),
          el('input', { type: 'range', id: 'set-mvol', min: 0, max: 1, step: 0.05, value: Music.vol(), oninput: (e) => { Audio2.init(); Music.setVol(parseFloat(e.target.value)); e.target.previousSibling.textContent = Math.round(Music.vol() * 100) + '%'; save(); } }))),
        sel('instAnim', 'Beszerelés filmje', [[true, 'Be'], [false, 'Ki']], 'Szerelés után a garázsban megnézed, ahogy az alkatrész a helyére kerül.'),
        sel('gfx', 'Grafika', [['low', 'Retró'], ['mid', 'Közepes'], ['high', 'Éles']]),
        sel('cam', 'Kamera', [['chase', 'Követő'], ['near', 'Közeli'], ['hood', 'Motorháztető']]),
        sel('mirror', 'Visszapillantó tükör', [[true, 'Be'], [false, 'Ki']], 'A képernyő tetején mutatja, ki jön mögötted. Gyengébb telefonon kikapcsolva folyékonyabb.')),
      el('div', { class: 'panel', style: 'margin:12px 0' }, el('h3', { style: 'margin:0 0 4px' }, 'Mentés átvitele'),
        el('p', { class: 'muted', style: 'margin:0 0 10px;font-size:12.5px' }, 'A Claude-ban futó és a telefonra telepített játék külön menti az állást. Kóddal vagy fájllal átviheted a garázsodat egyikből a másikba.'),
        el('div', { class: 'row' }, el('button', { class: 'btn small', onclick: () => SaveXfer.exportUI() }, 'Mentés kimentése'), el('button', { class: 'btn small', onclick: () => SaveXfer.importUI() }, 'Mentés betöltése'))),
      el('div', { class: 'row' }, el('button', { class: 'btn danger small', onclick: () => this.confirmReset() }, 'Új játék'))]);
    $('#sheet').scrollTop = keep;
  },
  confirmReset() {
    this.open([this.head('Új játék?', 'Minden autó, alkatrész és pénz elvész.'),
      el('div', { class: 'row' }, el('button', { class: 'btn danger', onclick: () => { S = defaultState(); save(); this.close(); this.show('garage'); } }, 'Igen, újrakezdem'), el('button', { class: 'btn', onclick: () => this.close() }, 'Mégse'))]);
  },

  // ---------------- car / workshop
  renderCar() {
    const c = car(), M = CARS[c.model], sp = carSpec(c);
    const wrap = $('#carWrap'); wrap.replaceChildren();
    wrap.append(el('div', { class: 'h' }, el('h2', null, 'Szerelőakna'), el('span', { class: 'jp' }, '整備'), el('p', null, 'Minden alkatrészt te húzol meg. A szervizkönyv megmondja a nyomatékot és a sorrendet; a többi a kezeden múlik.')));
    // pending installs
    const inv = el('div', { class: 'panel' }, el('h3', null, `Beszerelésre vár (${S.inv.length})`));
    if (!S.inv.length) inv.append(el('p', { class: 'muted', style: 'margin:0' }, 'A polc üres. Rendelj a boltban; a csomag reggelre vagy pár nap múlva érkezik.'));
    const items = el('div', { class: 'items' });
    S.inv.forEach((pid, idx) => {
      const p = PART[pid], bad = partAllowed(p, c), cur = c.parts[p.slot];
      items.append(el('div', { class: 'item' },
        el('div', null, el('div', { class: 'b' }, p.brand), el('div', { class: 't' }, p.name)),
        el('div', { class: 'row' },
          el('button', { class: 'btn small primary', disabled: !!bad, onclick: () => Install.start(idx) }, 'Beszerelés'),
          el('button', { class: 'btn small ghost', onclick: () => { S.inv.splice(idx, 1); S.money += Math.round(p.price * 0.5); toast(`Eladva: ${fmtY(p.price * 0.5)}`); save(); this.render(); } }, 'Elad')),
        el('div', { class: 'meta' }, el('span', { class: 'tag' }, SLOTS[p.slot]),
          bad ? el('span', { class: 'tag bad' }, bad) : null,
          cur ? el('span', { class: 'tag warn' }, `Lecseréli: ${PART[cur.id].name}`) : null)));
    });
    inv.append(items);
    // car sheet
    const pw = sp.ps / (sp.mass / 1000);
    const sheet = el('div', { class: 'panel' }, el('div', { class: 'eyebrow' }, `${M.year} · ${M.layout} · ${M.engine.label}`), el('h3', { style: 'margin-top:4px' }, M.name),
      el('div', { class: 'specs' },
        specTile('Teljesítmény', Math.round(sp.ps), 'LE'), specTile('Nyomaték', Math.round(sp.nm), 'Nm'),
        specTile('Tömeg', Math.round(sp.mass), 'kg'), specTile('LE / tonna', Math.round(pw), ''),
        specTile('Tapadás e/h', `${sp.muF.toFixed(2)}/${sp.muR.toFixed(2)}`, ''), specTile('Diffi', lsdName(sp.lsd), '')));
    const cond = el('div', { class: 'panel' }, el('h3', null, 'Állapot'));
    const repairs = [
      ['engine', 'Motor', (1 - c.cond.engine) * 240000 * priceF(c), 'Felújítás'],
      ['body', 'Karosszéria', (1 - c.cond.body) * 140000 * priceF(c), 'Lakatos'],
      ['clutch', 'Kuplung', (1 - c.cond.clutch) * 52000, 'Kuplungcsere'],
      ['tires', 'Gumik', 0, null]];
    for (const [k, n, cost, act] of repairs) {
      const v = c.cond[k];
      cond.append(el('div', { class: 'cond' }, el('span', null, n), el('div', { class: 'bar ' + (v < 0.35 ? 'bad' : v < 0.7 ? 'warn' : '') }, el('i', { style: `width:${Math.round(v * 100)}%` })), el('span', { class: 'num', style: 'text-align:right' }, Math.round(v * 100) + '%')));
      if (act && v < 0.995) cond.append(el('div', { class: 'row', style: 'margin:-2px 0 10px 102px' }, el('button', { class: 'btn small', onclick: () => { if (!this.spend(cost)) return; c.cond[k] = 1; toast(`${act} kész.`, 'good'); save(); this.render(); } }, `${act} · ${fmtY(cost)}`)));
    }
    if (c.cond.tires < 0.999) cond.append(el('p', { class: 'muted', style: 'margin:4px 0 0;font-size:12.5px' }, 'Új gumit a boltban rendelhetsz, a Fék és gumi alatt.'));
    if (c.cond.engine <= 0) cond.prepend(el('p', { style: 'color:#ff8b97;margin:0 0 10px;font-weight:600' }, 'A motor kész. Felújítás nélkül nem indul.'));
    // installed parts
    const inst = el('div', { class: 'panel' }, el('h3', null, 'Beszerelt alkatrészek'));
    const il = el('div', { class: 'items' });
    const slots = Object.keys(c.parts);
    if (!slots.length) inst.append(el('p', { class: 'muted', style: 'margin:0' }, 'Gyári állapot. Minden csavar ott van, ahová a gyár tette.'));
    for (const slot of slots) {
      const ip = c.parts[slot], p = PART[ip.id];
      il.append(el('div', { class: 'item' },
        el('div', null, el('div', { class: 'b' }, SLOTS[slot]), el('div', { class: 't' }, p.name)),
        el('div', { class: 'row' }, p.bolts !== 0 ? el('button', { class: 'btn small', onclick: () => Install.start(null, slot) }, 'Újraszerel') : null,
          slot !== 'tires' ? el('button', { class: 'btn small ghost', onclick: () => { delete c.parts[slot]; S.inv.push(p.id); toast(`${p.name} kiszerelve, a polcon van.`); save(); this.render(); } }, 'Kiszerel') : null),
        el('div', { class: 'meta' }, qualityTag(ip.q))));
    }
    inst.append(il);
    // paint
    const L = c.look || {};
    const paint = el('div', { class: 'panel' }, el('h3', null, 'Fényezőműhely'),
      el('div', { class: 'thumb-wrap' }, el('canvas', { class: 'car-thumb', 'data-own': S.active })),
      el('p', { class: 'muted', style: 'margin:8px 0 10px' }, `${PAINTS.find(x => x[0] === c.paint) ? PAINTS.find(x => x[0] === c.paint)[1] : 'Egyedi szín'} · ${FINISHES[L.finish || 'gloss'].name}${L.livery ? ' · ' + LIVERIES[L.livery].name : ''}`),
      el('button', { class: 'btn primary', onclick: () => PaintShop.open() }, 'Festőműhely megnyitása'));
    // own cars
    const cars = el('div', { class: 'panel' }, el('h3', null, 'Autóim'));
    const cl = el('div', { class: 'owned' });
    S.cars.forEach((cc, i) => {
      const val = carValue(cc);
      cl.append(el('div', { class: 'own' + (i === S.active ? ' on' : '') },
        el('canvas', { class: 'car-thumb', 'data-own': i }),
        el('div', { class: 'own-t' }, el('b', null, CARS[cc.model].name), el('small', null, i === S.active ? 'Ezzel versenyzel' : `Értéke kb. ${fmtY(val)}`)),
        el('div', { class: 'row' }, i !== S.active ? el('button', { class: 'btn small', onclick: () => { S.active = i; save(); this.render(); } }, 'Ezt viszem') : null,
          S.cars.length > 1 ? el('button', { class: 'btn small ghost', onclick: () => this.sellCar(i) }, 'Elad') : null)));
    });
    cars.append(cl);
    // dealer
    const owned = new Set(S.cars.map(x => x.model));
    const dealer = el('div', { class: 'panel dealer-panel' }, el('div', { class: 'h', style: 'margin-bottom:10px' }, el('h3', { style: 'margin:0' }, 'Ōta használtautó'), el('span', { class: 'jp', style: 'font-size:13px' }, '中古車'), el('p', null, 'Minden kocsi átnézve, papírokkal. Az árban benne van a rendszám is.')));
    const dl = el('div', { class: 'dealer' });
    for (const [id, M2] of Object.entries(CARS).sort((a, b) => a[1].price - b[1].price)) {
      const have = owned.has(id), sp0 = stockPeakPS(id);
      dl.append(el('article', { class: 'deal' + (have ? ' have' : '') },
        el('div', { class: 'deal-art' }, el('canvas', { class: 'car-thumb', 'data-model': id }), el('span', { class: 'deal-year' }, M2.year), have ? el('span', { class: 'stamp' }, 'MEGVAN') : null),
        el('div', { class: 'deal-body' },
          el('div', { class: 'b' }, `${M2.layout} · ${M2.engine.label}`),
          el('div', { class: 't' }, M2.name),
          el('div', { class: 'd' }, M2.blurb),
          el('div', { class: 'meta' }, el('span', { class: 'tag' }, `${sp0.ps.toFixed(0)} LE`), el('span', { class: 'tag' }, `${Math.round(sp0.t)} Nm`), el('span', { class: 'tag' }, `${M2.mass} kg`), el('span', { class: 'tag' }, `${M2.gears.length} fokozat`)),
          el('div', { class: 'deal-buy' }, el('span', { class: 'price' }, fmtY(M2.price)),
            el('button', { class: 'btn small primary', disabled: have, onclick: () => { if (!this.spend(M2.price)) return; S.cars.push(newCar(id)); S.active = S.cars.length - 1; addNews(`Új autó a garázsban: ${M2.name}.`); toast('Megvetted. A garázsban áll.', 'good'); save(); this.render(); } }, have ? 'Megvan' : 'Megveszem')))));
    }
    dealer.append(dl);
    wrap.append(el('div', { class: 'grid2' }, el('div', { style: 'display:flex;flex-direction:column;gap:16px;min-width:0' }, inv, inst, cars), el('div', { style: 'display:flex;flex-direction:column;gap:16px;min-width:0' }, sheet, cond, paint)), dealer);
    requestAnimationFrame(() => paintThumbs(wrap));
  },
  sellCar(i) {
    const cc = S.cars[i], val = carValue(cc);
    this.open([this.head(`Eladod: ${CARS[cc.model].name}?`, `A felkínált ár ${fmtY(val)}. A beszerelt alkatrészek vele mennek.`),
      el('div', { class: 'row' }, el('button', { class: 'btn primary', onclick: () => { S.money += val; S.cars.splice(i, 1); S.active = 0; save(); this.close(); this.render(); toast(`Eladva: ${fmtY(val)}`); } }, 'Eladom'), el('button', { class: 'btn', onclick: () => this.close() }, 'Mégse'))]);
  },

  // ---------------- shop
  renderShop() { Magazine.render($('#shopWrap')); },
  order(p) {
    if (!this.spend(p.price)) return;
    if (p.days === 0) { S.inv.push(p.id); toast(`${p.name}: a polcon, szerelhető.`, 'good'); }
    else { S.orders.push({ pid: p.id, arrive: S.day + p.days }); toast(`Megrendelve. ${p.days === 1 ? 'Holnap reggel' : p.days + ' nap múlva'} jön.`); }
    save(); this.render();
  },

  // ---------------- tuning
  renderTune() {
    const c = car(), wrap = $('#tuneWrap'); wrap.replaceChildren();
    wrap.append(el('div', { class: 'h' }, el('h2', null, 'Hangolás'), el('span', { class: 'jp' }, '調整'), el('p', null, 'Ami nincs beszerelve, az nem állítható. A változás azonnal él, a dyno és a hegy megmondja, jó-e.')));
    wrap.append(el('div', { class: 'chips' }, ...[['ecu', 'ECU'], ['susp', 'Futómű'], ['drive', 'Hajtás és fék']].map(([id, n]) =>
      el('button', { class: 'chip', 'aria-pressed': this.tuneTab === id ? 'true' : 'false', onclick: () => { this.tuneTab = id; this.renderTune(); } }, n))));
    if (this.tuneTab === 'ecu') wrap.append(this.ecuPanel(c));
    if (this.tuneTab === 'susp') wrap.append(this.suspPanel(c));
    if (this.tuneTab === 'drive') wrap.append(this.drivePanel(c));
  },
  slider(c, key, label, min, max, step, fmt, hint, onAfter) {
    const out = el('output', null, fmt(c.tune[key]));
    const inp = el('input', { type: 'range', id: 'tune-' + key, min, max, step, value: c.tune[key] });
    inp.addEventListener('input', () => { c.tune[key] = parseFloat(inp.value); out.textContent = fmt(c.tune[key]); if (onAfter) onAfter(); save(); });
    return el('div', { class: 'slider' }, el('label', { for: 'tune-' + key }, label), out, inp, hint ? el('div', { class: 'hint' }, hint) : null);
  },
  ecuPanel(c) {
    const E = CARS[c.model].engine, fx = partFx(c);
    const hasECU = !!fx.ecu, turboId = fx.turbo || E.turbo, T = turboId && TURBOS[turboId];
    const box = el('div', { class: 'crt' });
    const read = el('div', { style: 'margin-bottom:12px;line-height:1.25' });
    const update = () => {
      const cu = engineCurve(c);
      const cap = fuelBottleneck(c);
      read.replaceChildren(
        el('div', null, el('span', { class: 'lbl' }, 'BECSÜLT CSÚCS  '), `${Math.round(cu.peakPS)} LE @ ${cu.peakPSr}  /  ${Math.round(cu.peakT)} Nm @ ${cu.peakTr}`),
        el('div', { class: cu.maxDuty > 1 ? 'bad' : cu.maxDuty > 0.9 ? 'warn' : '' }, el('span', { class: 'lbl' }, 'ÜZEMANYAG-RENDSZER  '), `${Math.round(cu.maxDuty * 100)}%`, cu.maxDuty > 0.9 ? `  szűk: ${cap}` : ''),
        el('div', null, el('span', { class: 'lbl' }, 'KOPOGÁS  '), hasECU ? 'nincs érzékelő a térképen, mérd dynón' : 'gyári ECU: kopogásnál visszaveszi a gyújtást'));
    };
    box.append(el('div', { style: 'font-size:22px;margin-bottom:8px' }, `F-MAP v2.1  //  ${CARS[c.model].name.toUpperCase()}`));
    box.append(read);
    if (!hasECU) box.append(el('div', { class: 'locked', style: 'border-color:#1c3a24;color:#47b862;font-family:var(--f-crt);font-size:17px;margin-bottom:12px' }, 'GYÁRI ECU. A gyújtás, a keverék és a határoló nem állítható. Kell hozzá: Programozható ECU (Motor kategória).'));
    if (hasECU) {
      box.append(this.slider(c, 'timing', 'GYÚJTÁS ELŐRE (°)', -8, 8, 0.5, v => (v > 0 ? '+' : '') + v.toFixed(1) + '°', 'Több előgyújtás = több nyomaték, amíg nem kezd kopogni. Rossz benzinnel és nagy töltőnyomással vegyél vissza.', update));
      box.append(this.slider(c, 'afr', 'KEVERÉK TELJES GÁZON (AFR)', 10.5, 14.5, 0.1, v => v.toFixed(1) + ':1', 'Szívómotor 12,5–13 körül adja a legtöbbet. Turbóval maradj 11,5–12 között: a dús keverék hűt.', update));
      box.append(this.slider(c, 'limiter', 'FORDULATSZÁM-HATÁROLÓ', E.limiter - 600, E.limiter + 1200, 100, v => v + ' f/p', 'A gyári határoló fölött a szelepek elkezdenek lebegni, a teljesítmény esik.', update));
    }
    if (T && (hasECU || fx.boostCtrl)) box.append(this.slider(c, 'boost', 'TÖLTŐNYOMÁS (bar)', 0.2, T.maxBoost, 0.05, v => v.toFixed(2) + ' bar', `${T.name}: legfeljebb ${T.maxBoost.toFixed(2)} bar. Minden tized bar több hő és kevesebb kopogási tartalék.`, update));
    // fuel selector always available
    const fuelRow = el('div', { class: 'slider' }, el('label', null, 'ÜZEMANYAG'), el('output', null, c.tune.fuel === 'prem' ? '100 RON' : '91 RON'),
      el('div', { class: 'row', style: 'grid-column:1/-1' }, ...[['prem', `Prémium 100 (${fmtY(FUEL_PREMIUM_COST)}/éjszaka)`], ['reg', 'Normál 91 (ingyen)']].map(([v, n]) =>
        el('button', { class: 'chip', style: 'border-color:#2b6a3a;color:var(--phos)' + (c.tune.fuel === v ? ';background:#1a4a28' : ''), onclick: () => { c.tune.fuel = v; save(); this.renderTune(); } }, n))),
      el('div', { class: 'hint' }, 'A normál benzin kb. 3°-kal kevesebb kopogási tartalékot ad.'));
    box.append(fuelRow);
    if (hasECU) box.append(el('button', { class: 'btn small', style: 'margin-top:4px;border-color:#2b6a3a;color:var(--phos);background:transparent', onclick: () => { const d = defaultTune(c.model); Object.assign(c.tune, { timing: d.timing, afr: d.afr, boost: d.boost, limiter: d.limiter }); save(); this.renderTune(); } }, 'GYÁRI TÉRKÉP VISSZAÁLLÍTÁSA'));
    update();
    return box;
  },
  suspPanel(c) {
    const fx = partFx(c), susp = c.parts.susp && PART[c.parts.susp.id].fx || {};
    const coil = !!susp.coilover;
    const p = el('div', { class: 'grid2' });
    const bal = el('div', { class: 'panel' });
    const updateBal = () => {
      const sp = carSpec(c);
      // understeer gradient proxy: front grip loss vs rear grip loss under lateral load
      const fr = sp.muF * (1 - sp.sens * sp.lambda), rr = sp.muR * (1 - sp.sens * (1 - sp.lambda));
      const us = clamp((rr - fr) * 6 + (sp.layout === 'FF' ? 0.15 : 0), -1, 1);
      bal.replaceChildren(el('h3', null, 'Egyensúly'),
        el('div', { style: 'position:relative;height:10px;border-radius:5px;background:linear-gradient(90deg,#4ee6d4,#2a3040 50%,#ffa733)' },
          el('i', { style: `position:absolute;top:-4px;width:4px;height:18px;background:#fff;border-radius:2px;left:calc(${50 + us * 50}% - 2px)` })),
        el('div', { class: 'row', style: 'justify-content:space-between;font-size:12px;margin-top:6px' }, el('span', { class: 'muted' }, 'Túlkormányzott'), el('span', { class: 'muted' }, 'Alulkormányzott')),
        el('div', { class: 'specs', style: 'margin-top:12px' }, specTile('Tapadás elöl', sp.muF.toFixed(3), ''), specTile('Tapadás hátul', sp.muR.toFixed(3), ''), specTile('Súlypont', Math.round(sp.cgH * 1000), 'mm')));
    };
    const L = el('div', { class: 'panel' }, el('h3', null, 'Rugózás'));
    if (coil) {
      L.append(this.slider(c, 'rideF', 'Hasmagasság elöl', -60, 10, 5, v => v + ' mm', 'Lejjebb = kisebb súlyáthelyeződés. 45 mm alatt felül a hegyi bukkanókon.', updateBal));
      L.append(this.slider(c, 'rideR', 'Hasmagasság hátul', -60, 10, 5, v => v + ' mm', null, updateBal));
      L.append(this.slider(c, 'springF', 'Rugókeménység elöl', 0.8, 2.6, 0.1, v => (v * 4).toFixed(1) + ' kg/mm', 'Keményebb elöl = alulkormányzás felé tol.', updateBal));
      L.append(this.slider(c, 'springR', 'Rugókeménység hátul', 0.8, 2.6, 0.1, v => (v * 4).toFixed(1) + ' kg/mm', 'Keményebb hátul = mozgékonyabb far.', updateBal));
      L.append(this.slider(c, 'damp', 'Csillapítás', 1, 16, 1, v => v + '/16', 'Puhán lassú, keményen pattog. A touge-on 8–10 körül a jó.', updateBal));
    } else L.append(el('div', { class: 'locked' }, susp.lower ? 'Sportrugók: −30 mm, fix keménység. Állítani menetes futóművel lehet.' : 'Gyári rugózás. Kell hozzá: Menetes futómű.'));
    const R = el('div', { class: 'panel' }, el('h3', null, 'Geometria és gumi'));
    if (fx.camber) {
      R.append(this.slider(c, 'camberF', 'Kerékdőlés elöl', -4.5, -0.5, 0.1, v => v.toFixed(1) + '°', 'Kanyarban több tapadás. Túl sok: hosszabb fékút.', updateBal));
      R.append(this.slider(c, 'camberR', 'Kerékdőlés hátul', -3.5, -0.5, 0.1, v => v.toFixed(1) + '°', null, updateBal));
      R.append(this.slider(c, 'toeF', 'Összetartás elöl', -0.4, 0.4, 0.05, v => (v > 0 ? '+' : '') + v.toFixed(2) + '°', 'Negatív = széttartás: élesebb kanyarbevétel, idegesebb egyenesben.', updateBal));
      R.append(this.slider(c, 'toeR', 'Összetartás hátul', -0.2, 0.5, 0.05, v => (v > 0 ? '+' : '') + v.toFixed(2) + '°', 'Pozitív = összetartás: stabil far.', updateBal));
    } else R.append(el('div', { class: 'locked', style: 'margin-bottom:12px' }, 'Gyári geometria. Kell hozzá: Dőléstányérok.'));
    if (fx.arb) {
      R.append(this.slider(c, 'arbF', 'Stabilizátor elöl', 1, 5, 1, v => v + '/5', 'Keményebb elöl = alulkormányzás.', updateBal));
      R.append(this.slider(c, 'arbR', 'Stabilizátor hátul', 1, 5, 1, v => v + '/5', 'Keményebb hátul = túlkormányzás.', updateBal));
    }
    R.append(this.slider(c, 'pressF', 'Guminyomás elöl', 1.6, 2.8, 0.05, v => v.toFixed(2) + ' bar', '2,1 bar körül a legjobb.', updateBal));
    R.append(this.slider(c, 'pressR', 'Guminyomás hátul', 1.6, 2.8, 0.05, v => v.toFixed(2) + ' bar', 'Hátul feljebb = könnyebben csúszó far.', updateBal));
    updateBal();
    p.append(el('div', { style: 'display:flex;flex-direction:column;gap:16px;min-width:0' }, bal, L), R);
    return p;
  },
  drivePanel(c) {
    const fx = partFx(c), M = CARS[c.model], sp = carSpec(c);
    const p = el('div', { class: 'grid2' });
    const gearsBox = el('div', { class: 'specs', style: 'margin-top:8px' });
    const updG = () => {
      const s2 = carSpec(c); gearsBox.replaceChildren();
      s2.gears.forEach((g, i) => { const v = s2.curve.limiter / 60 * 2 * Math.PI * s2.rw / (g * s2.final) * 3.6; gearsBox.append(specTile(`${i + 1}. fokozat`, Math.round(v), 'km/h')); });
    };
    const A = el('div', { class: 'panel' }, el('h3', null, 'Váltó és diffi'), el('p', { class: 'muted', style: 'margin:0 0 10px' }, `Önzáró: ${lsdName(sp.lsd)}. A határolóig elérhető sebesség fokozatonként:`));
    if (fx.finalKit) A.append(this.slider(c, 'final', 'Végáttétel', 3.7, 5.1, 0.05, v => v.toFixed(2) + ':1', 'Rövidebb (nagyobb szám) = erősebb gyorsulás, kisebb végsebesség. A touge-on a 2. és 3. fokozat a lényeg.', updG));
    else A.append(el('div', { class: 'locked', style: 'margin-bottom:10px' }, `Gyári végáttétel: ${M.final.toFixed(3)}. Kell hozzá: Végáttétel-készlet.`));
    A.append(gearsBox); updG();
    const B = el('div', { class: 'panel' }, el('h3', null, 'Fék'));
    B.append(this.slider(c, 'bias', 'Fékerő-elosztás (elöl)', 0.5, 0.8, 0.01, v => Math.round(v * 100) + '%', 'Hátrébb tolva hamarabb blokkol a hátsó tengely és befordul az autó. Ez lehet fegyver is.'));
    B.append(el('div', { class: 'specs' }, specTile('Fékerő', (sp.brake * 100).toFixed(0), '%'), specTile('Kézifék', sp.hbrake.toFixed(1), '×')));
    p.append(A, B);
    return p;
  },

  // ---------------- dyno
  renderDyno() {
    const c = car(), wrap = $('#dynoWrap'); wrap.replaceChildren();
    wrap.append(el('div', { class: 'h' }, el('h2', null, 'Teljesítménymérő'), el('span', { class: 'jp' }, '測定'), el('p', null, `Görgős pad Nishida-sannál, a város szélén. Negyedik fokozat, padlógáz a határolóig. A kerékre jutó teljesítményt méri, ez a hajtáslánc vesztesége miatt kb. 14%-kal kevesebb, mint a motoré.`)));
    const box = el('div', { class: 'crt' });
    const cv = el('canvas', { id: 'dynoCv' });
    const res = el('div', { style: 'margin-bottom:10px;line-height:1.3;min-height:4.6em' });
    const runs = S.dyno[c.uid] || [];
    box.append(el('div', { style: 'font-size:21px;margin-bottom:6px' }, `DYNOJET-7  //  ${CARS[c.model].name.toUpperCase()}`), res, cv);
    const btn = el('button', { class: 'btn primary', disabled: c.cond.engine <= 0, onclick: () => this.runDyno(cv, res, btn) }, `Mérés indítása · ${fmtY(DYNO_COST)}`);
    wrap.append(el('div', { class: 'row' }, btn, runs.length > 1 ? el('span', { class: 'muted' }, 'Szaggatott vonal: az előző mérés') : null), box);
    requestAnimationFrame(() => { drawDyno(cv, runs[runs.length - 1] || null, runs[runs.length - 2] || null, 1); if (runs.length) dynoResult(res, runs[runs.length - 1], c); else res.textContent = 'MÉG NINCS MÉRÉS ERRŐL AZ AUTÓRÓL.'; });
  },
  runDyno(cv, res, btn) {
    const c = car();
    if (!this.spend(DYNO_COST)) return;
    btn.disabled = true;
    const run = dynoRun(c);
    const prev = (S.dyno[c.uid] || []).slice(-1)[0] || null;
    Audio2.init(); Audio2.dynoPull(run);
    const t0 = performance.now(), dur = 4200;
    const step = (t) => {
      const k = clamp((t - t0) / dur, 0, 1);
      drawDyno(cv, run, prev, k);
      res.textContent = `MÉRÉS... ${Math.round(2000 + k * (run.pts[run.pts.length - 1].rpm - 2000))} f/p`;
      if (k < 1) requestAnimationFrame(step);
      else {
        c.cond.engine = Math.max(0, c.cond.engine - run.dmg);
        S.dyno[c.uid] = (S.dyno[c.uid] || []).concat([run]).slice(-3); S.stats.dynoBest = Math.max(S.stats.dynoBest || 0, run.peakPS);
        dynoResult(res, run, c);
        if (run.dmg > 0.001) toast(`Kopogott a motor a mérés alatt. Állapot: ${Math.round(c.cond.engine * 100)}%`, 'bad');
        save(); this.render(); btn.disabled = false;
      }
    };
    requestAnimationFrame(step);
  },

  // ---------------- touge
  renderTouge() {
    const c = car(), wrap = $('#tougeWrap'); wrap.replaceChildren();
    wrap.append(el('div', { class: 'h' }, el('h2', null, 'A hegy'), el('span', { class: 'jp' }, '峠'), el('p', null, 'Éjfél után lezárják a forgalmat a helyiek. Egy futam egy éjszaka. A győzelem pénz és hírnév; a hírnév új hegyeket nyit.')));
    const ready = raceReadiness(c);
    if (ready) wrap.append(el('div', { class: 'panel', style: 'border-color:#6b2630' }, ready));
    // tonight's conditions and how much attention you are drawing
    const wk = weatherNow(), W = WEATHER[wk], heat = S.heat || 0, pc = policeChance(), gp = Math.round(wetGrip(c, wk) * 100);
    wrap.append(el('div', { class: 'panel conds' },
      el('div', { class: 'cond' }, el('div', { class: 'eyebrow' }, 'Ma éjjel'), weatherBadge(wk),
        el('p', { class: 'muted' }, W.desc + (wk !== 'clear' ? ` A gumijaiddal a tapadás ${gp}%.` : '') + (W.bonus > 1 ? ` Tét és hírnév +${Math.round((W.bonus - 1) * 100)}%.` : '')),
        el('div', { class: 'muted', style: 'font-size:12.5px' }, 'Holnap: ', weatherBadge(weatherFor(S.day + 1), true))),
      el('div', { class: 'cond' }, el('div', { class: 'eyebrow' }, 'Rendőri figyelem'),
        el('div', { class: 'heat', role: 'meter', 'aria-valuenow': Math.round(heat), 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': 'Rendőri figyelem' }, el('i', { style: `left:${Math.round(heat)}%` })),
        el('p', { class: 'muted' }, `${heatLabel(heat)[0].toUpperCase() + heatLabel(heat).slice(1)} · ${pc > 0 ? `kb. ${Math.round(pc * 100)}% eséllyel áll rendőr a pihenőben.` : 'ma éjjel nem várható rendőr.'} Minden futam emeli, a hangos kipufogó és a neon még jobban. A kihagyott éjszaka és a tofuszállítás lehűti.`))));
    const ms = Meet.state(), left = Meet.roster().racers.filter(r => !ms.done[r.mid]).length;
    wrap.append(el('div', { class: 'panel meet-cta' },
      el('div', null, el('div', { class: 'eyebrow' }, 'Gyülekező · 夜の集会'), el('h3', { style: 'margin:2px 0 4px' }, 'A felső parkoló'),
        el('p', { class: 'muted', style: 'margin:0' }, left ? `Ma éjjel ${left} autó áll a pihenőben, mind keres valakit egy körre, tétre. Gorō bácsi is ott van a használt alkatrészekkel.` : 'Ma éjjel már mindenkivel mentél egy kört. Holnap újak jönnek.')),
      el('button', { class: 'btn primary', onclick: () => { Audio2.init(); if (!PA.open()) Meet.open(); } }, 'Kimegyek a pihenőbe')));
    // the harbour straight
    const dz = el('div', { class: 'panel touge dragcard' }), dart = el('div', { class: 'art' }, el('canvas'), el('div', { class: 'kanji' }, DRAG.jp));
    const dbody = el('div', { class: 'body' },
      el('div', null, el('div', { class: 'eyebrow' }, 'Zero-yon · 402 m állórajt'), el('h3', { style: 'margin:2px 0 0' }, DRAG.name)),
      el('div', { class: 'muted' }, 'A konténerkikötő mögötti egyenes: két sáv, négyszáz méter. Itt nem a kanyar dönt, hanem a rajt, a váltás és a lóerő. A Midnight Loop tagjai minden éjjel itt állnak.'),
      el('div', { class: 'row' }, el('button', { class: 'btn small', disabled: !!ready, onclick: () => Race.start(DRAG, null) }, 'Próbafutam'), el('span', { class: 'muted num' }, S.best.wangan ? `Legjobb: ${S.best.wangan.toFixed(2)} s` : 'Még nincs mért időd')));
    for (const rv of DRAG.rivals) {
      const beat = S.wins[rv.id], rl = S.rep < rv.reqRep;
      dbody.append(el('div', { class: 'rival' },
        el('div', null, el('div', { class: 't', style: 'font-weight:700' }, `${rv.name} `, el('span', { class: 'muted', style: 'font-weight:400' }, `· ${rv.team}`)),
          el('div', { class: 'muted', style: 'font-size:12.5px' }, `${CARS[rv.car].name} · kb. ${rv.ps} LE · ${beat ? 'legyőzve, visszavágó ' + fmtY(Math.round(rv.prize * 0.3)) : 'tét ' + fmtY(rv.prize)}`)),
        beat ? el('button', { class: 'btn small', disabled: !!ready, onclick: () => Race.start(DRAG, rv) }, 'Visszavágó') : rl ? el('span', { class: 'tag' }, `${rv.reqRep} rep`) : el('button', { class: 'btn small primary', disabled: !!ready, onclick: () => Race.start(DRAG, rv) }, 'Kihívás'),
        el('div', { class: 'q' }, `„${rv.line}”`)));
    }
    dz.append(dart, dbody);
    requestAnimationFrame(() => drawDragArt(dart.querySelector('canvas')));
    // online
    wrap.append(el('div', { class: 'panel meet-cta' },
      el('div', null, el('div', { class: 'eyebrow' }, 'Online · 対戦'), el('h3', { style: 'margin:2px 0 4px' }, 'Verseny egy haverral'),
        el('p', { class: 'muted', style: 'margin:0' }, Net.available() ? 'Nyiss egy szobát, küldd át a négyjegyű kódot, és mehettek egymás ellen a hegyen vagy az egyenesen, mindenki a saját autójával.' : 'Az online verseny a webes változatban érhető el (a Netlify-oldalon). Itt, a Claude-on belül a böngésző nem enged közvetlen kapcsolatot két játékos között.')),
      el('button', { class: 'btn primary', disabled: !Net.available() || !!ready, onclick: () => Net.lobby() }, 'Szoba')));
    const g = el('div', { class: 'grid2' });
    g.append(dz);
    TOUGES.forEach((tg0, ti) => {
      const locked = S.rep < tg0.reqRep;
      const rev = !!(S.dirPref && S.dirPref[tg0.id]), tg = tougeDir(tg0, rev);
      const best = S.best[trackKey(tg)];
      const card = el('div', { class: 'panel touge' });
      const art = el('div', { class: 'art' }, el('canvas'), el('div', { class: 'kanji' }, tg.jp));
      const setDir = (r) => { S.dirPref = S.dirPref || {}; S.dirPref[tg0.id] = r; save(); this.renderTouge(); };
      const dirSeg = el('div', { class: 'seg dirseg', role: 'group', 'aria-label': 'Irány' },
        el('button', { class: 'chip', 'aria-pressed': String(!rev), onclick: () => setDir(false) }, `${tg0.dir === 'down' ? '↓ Downhill' : '↑ Hillclimb'}`),
        el('button', { class: 'chip', 'aria-pressed': String(rev), onclick: () => setDir(true) }, `${tg0.dir === 'down' ? '↑ Hillclimb' : '↓ Downhill'}`));
      const body = el('div', { class: 'body' },
        el('div', null, el('div', { class: 'eyebrow' }, `${dirName(tg)[0].toUpperCase() + dirName(tg).slice(1)} · ${(trackLength(tg) / 1000).toFixed(1)} km`), el('h3', { style: 'margin:2px 0 0' }, tg.name)),
        el('div', { class: 'muted' }, locked ? `Zárva. ${tg.reqRep} hírnév kell hozzá (most ${S.rep}).` : rev ? 'Fordítva: a kanyarok ugyanazok, de minden fékpont máshol van. A helyiek nem ezt az irányt ismerik.' : tg.desc));
      if (!locked) {
        body.append(dirSeg);
        body.append(el('div', { class: 'row' }, el('button', { class: 'btn small', disabled: !!ready, onclick: () => Race.start(tg, null) }, 'Time attack'), el('span', { class: 'muted num' }, best ? `Legjobb: ${fmtTime(best)}` : 'Még nincs mért köröd'), (S.medals || {})[trackKey(tg)] ? el('span', { class: 'medal sm m-' + S.medals[trackKey(tg)] + ' got' }, el('b', null, TA_NAME[S.medals[trackKey(tg)]])) : null));
        const dbest = (S.driftBest || {})[trackKey(tg)];
        body.append(el('div', { class: 'row' }, el('button', { class: 'btn small', disabled: !!ready, onclick: () => Race.start(tg, null, 'drift') }, 'Drift edzés'), el('span', { class: 'muted num' }, dbest ? `Legjobb: ${fmtPts(dbest)} pont` : 'Még nincs driftpontod')));
        for (const rv of tg.rivals) {
          const beat = S.wins[winKey(rv, tg)], rl = S.rep < rv.reqRep, f = rev ? 0.6 : 1, prize = Math.round(rv.prize * f * W.bonus / 1000) * 1000;
          body.append(el('div', { class: 'rival' },
            el('div', null, el('div', { class: 't', style: 'font-weight:700' }, `${rv.name} `, el('span', { class: 'muted', style: 'font-weight:400' }, `· ${rv.team}`)),
              el('div', { class: 'muted', style: 'font-size:12.5px' }, `${CARS[rv.car].name} · kb. ${rv.ps} LE · ${beat ? 'legyőzve, visszavágó ' + fmtY(Math.round(rv.prize * 0.3)) : 'tét ' + fmtY(prize)}`)),
            beat ? el('button', { class: 'btn small', disabled: !!ready, title: `Visszavágó: ${fmtY(Math.round(rv.prize * 0.3))}`, onclick: () => Race.start(tg, rv) }, 'Visszavágó') : rl ? el('span', { class: 'tag' }, `${rv.reqRep} rep`) : el('button', { class: 'btn small primary', disabled: !!ready, onclick: () => Race.start(tg, rv) }, 'Kihívás'),
            el('div', { class: 'q' }, `„${rv.line}”`)));
        }
      }
      card.append(art, body); g.append(card);
      requestAnimationFrame(() => drawTougeArt(art.querySelector('canvas'), ti, locked));
    });
    wrap.append(g);
  }
};

function specTile(label, val, unit) { return el('div', { class: 'spec' }, el('small', null, label), el('b', null, String(val), unit ? el('i', null, unit) : null)); }
function lsdName(l) { return { open: 'nyitott', visc: 'viszkó', '1way': '1-utas', '1.5way': '1,5-utas', '2way': '2-utas' }[l] || l; }
function qualityTag(q) { const p = Math.round(q * 100); return el('span', { class: 'tag ' + (q >= 0.85 ? 'ok' : q >= 0.6 ? 'warn' : 'bad') }, q >= 0.85 ? `Precíz · ${p}%` : q >= 0.6 ? `Rendben · ${p}%` : `Hanyag · ${p}%`); }
function priceF(c) { return 0.6 + CARS[c.model].price / 3000000; }
function carValue(cc) {
  const avg = (cc.cond.engine + cc.cond.body + cc.cond.tires) / 3;
  let v = CARS[cc.model].price * 0.55 * (0.4 + 0.6 * avg);
  for (const ip of Object.values(cc.parts)) v += PART[ip.id].price * 0.35;
  return Math.round(v / 1000) * 1000;
}
function fuelBottleneck(c) {
  const fx = partFx(c), ref = stockPeakPS(c.model), E = CARS[c.model].engine;
  const inj = fx.injPS ? fx.injPS * (E.rotary ? 4 : E.cyl) : ref.ps * 1.22, pump = fx.pumpPS || ref.ps * 1.4;
  return inj < pump ? 'injektorok' : 'szivattyú';
}
function raceReadiness(c) {
  if (c.cond.engine <= 0) return 'A motor tönkrement. Felújítás nélkül nem indulhatsz.';
  if (c.cond.body <= 0.05) return 'A karosszéria roncs. Előbb a lakatos.';
  if (c.cond.tires <= 0.08) return 'A gumik a vásznon vannak. Rendelj újat.';
  return null;
}
function fmtTime(t) { const m = Math.floor(t / 60), s = t - m * 60; return `${m}:${s.toFixed(2).padStart(5, '0')}`; }
function trackLength(tg) { let L = 0; for (const s of tg.segs) L += s[0] === 's' ? s[1] : Math.abs(s[2]) * Math.PI / 180 * s[1]; return L; }

function drawTougeArt(cv, seed, locked) {
  const W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
  cv.width = W * dpr; cv.height = H * dpr; const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
  let r = seed * 9301 + 49297; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < 40; i++) { ctx.fillStyle = `rgba(255,255,255,${0.2 + rnd() * 0.5})`; ctx.fillRect(rnd() * W, rnd() * H * 0.5, 1, 1); }
  for (let layer = 0; layer < 3; layer++) {
    ctx.fillStyle = ['#141a2c', '#0e1220', '#080a12'][layer];
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) ctx.lineTo(x, H * (0.35 + layer * 0.15) + Math.sin(x / (60 - layer * 10) + seed * 2 + layer) * 14 + Math.sin(x / 23 + layer) * 5);
    ctx.lineTo(W, H); ctx.fill();
  }
  if (!locked) {
    ctx.fillStyle = '#ffa733'; ctx.shadowColor = '#ffa733'; ctx.shadowBlur = 6;
    for (let i = 0; i < 9; i++) { const x = W * 0.08 + i * W * 0.07, y = H * 0.55 + Math.sin(i * 1.3 + seed) * H * 0.18; ctx.beginPath(); ctx.arc(x, y, 1.6, 0, 7); ctx.fill(); }
    ctx.shadowBlur = 0;
  } else { ctx.fillStyle = 'rgba(5,6,10,0.55)'; ctx.fillRect(0, 0, W, H); }
}

function drawDyno(cv, run, prev, k) {
  const W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
  if (cv.width !== W * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
  const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
  const pad = { l: 44, r: 44, t: 12, b: 26 };
  const all = [run, prev].filter(Boolean);
  const maxRpm = all.length ? Math.max(...all.map(r => r.pts[r.pts.length - 1].rpm)) : 8000;
  const maxP = all.length ? Math.max(...all.map(r => Math.max(r.peakPS, r.peakNm))) * 1.12 : 300;
  const X = rpm => pad.l + (rpm - 2000) / (maxRpm - 2000) * (W - pad.l - pad.r);
  const Y = v => H - pad.b - v / maxP * (H - pad.t - pad.b);
  ctx.strokeStyle = 'rgba(125,255,154,0.12)'; ctx.lineWidth = 1; ctx.font = '15px ' + cssVar('--f-crt'); ctx.fillStyle = '#3f9a57';
  for (let r = 2000; r <= maxRpm; r += 1000) { ctx.beginPath(); ctx.moveTo(X(r), pad.t); ctx.lineTo(X(r), H - pad.b); ctx.stroke(); ctx.textAlign = 'center'; ctx.fillText(r / 1000 + 'k', X(r), H - 8); }
  const stepV = maxP > 400 ? 100 : 50;
  for (let v = 0; v <= maxP; v += stepV) { ctx.beginPath(); ctx.moveTo(pad.l, Y(v)); ctx.lineTo(W - pad.r, Y(v)); ctx.stroke(); ctx.textAlign = 'right'; ctx.fillText(v, pad.l - 6, Y(v) + 4); }
  // AFR axis on right: 10..16
  const YA = a => H - pad.b - (a - 10) / 6 * (H - pad.t - pad.b);
  ctx.textAlign = 'left'; ctx.fillStyle = '#9a8a3a'; for (let a = 10; a <= 16; a += 2) ctx.fillText(a, W - pad.r + 6, YA(a) + 4);
  const line = (r, key, col, dash, upto, y = Y) => {
    ctx.setLineDash(dash || []); ctx.strokeStyle = col; ctx.lineWidth = dash ? 1.5 : 2.2; ctx.beginPath();
    const n = Math.max(2, Math.floor(r.pts.length * upto));
    r.pts.slice(0, n).forEach((p, i) => i ? ctx.lineTo(X(p.rpm), y(p[key])) : ctx.moveTo(X(p.rpm), y(p[key]))); ctx.stroke(); ctx.setLineDash([]);
  };
  if (prev) { line(prev, 'ps', 'rgba(125,255,154,0.45)', [5, 4], 1); line(prev, 'nm', 'rgba(78,230,212,0.45)', [5, 4], 1); }
  if (run) {
    const n = Math.max(2, Math.floor(run.pts.length * k));
    for (const p of run.pts.slice(0, n)) if (p.knock > 0) { ctx.fillStyle = `rgba(255,80,80,${Math.min(0.5, 0.15 + p.knock * 0.1)})`; ctx.fillRect(X(p.rpm) - 3, pad.t, 6, H - pad.t - pad.b); }
    else if (p.retard > 0.3) { ctx.fillStyle = 'rgba(255,209,102,0.16)'; ctx.fillRect(X(p.rpm) - 3, pad.t, 6, H - pad.t - pad.b); }
    line(run, 'afr', '#c9b24a', null, k, YA);
    line(run, 'nm', '#4ee6d4', null, k); line(run, 'ps', '#7dff9a', null, k);
    const last = run.pts[n - 1]; ctx.fillStyle = '#d7ffe2'; ctx.beginPath(); ctx.arc(X(last.rpm), Y(last.ps), 3, 0, 7); ctx.fill();
  }
  ctx.fillStyle = '#7dff9a'; ctx.textAlign = 'left'; ctx.fillText('LE', pad.l + 6, pad.t + 14); ctx.fillStyle = '#4ee6d4'; ctx.fillText('Nm', pad.l + 30, pad.t + 14); ctx.fillStyle = '#c9b24a'; ctx.fillText('AFR', pad.l + 60, pad.t + 14);
}
function dynoResult(res, run, c) {
  const pk = run.pts.reduce((a, b) => b.ps > a.ps ? b : a), tq = run.pts.reduce((a, b) => b.nm > a.nm ? b : a);
  const knockR = run.pts.filter(p => p.knock > 0).map(p => p.rpm);
  const afrs = run.pts.map(p => p.afr);
  res.replaceChildren(
    el('div', null, el('span', { class: 'lbl' }, 'KERÉK-LE  '), `${pk.ps.toFixed(1)} LE @ ${pk.rpm}   `, el('span', { class: 'lbl' }, 'NYOMATÉK  '), `${tq.nm.toFixed(0)} Nm @ ${tq.rpm}`),
    el('div', null, el('span', { class: 'lbl' }, 'KEVERÉK  '), `${Math.min(...afrs).toFixed(1)} – ${Math.max(...afrs).toFixed(1)} : 1`),
    el('div', { class: run.maxDuty > 1 ? 'bad' : run.maxDuty > 0.9 ? 'warn' : '' }, el('span', { class: 'lbl' }, 'ÜZEMANYAG  '), `${Math.round(run.maxDuty * 100)}%`, run.maxDuty > 1 ? `  KEVÉS! (${fuelBottleneck(c)}) — elsoványodik` : ''),
    knockR.length ? el('div', { class: 'bad' }, `KOPOGÁS ${knockR[0]}–${knockR[knockR.length - 1]} f/p között. Vegyél vissza a gyújtásból vagy a töltőnyomásból, dúsíts.`)
      : run.retard ? el('div', { class: 'warn' }, 'A gyári ECU kopogás miatt visszavette a gyújtást (sárga sáv). Elveszett teljesítmény.')
      : el('div', null, 'KOPOGÁS NEM VOLT.'));
}

// side-view thumbnails of cars, drawn once the layout has a size
function paintThumbs(root) {
  for (const cv of $$('canvas.car-thumb', root)) {
    const r = cv.getBoundingClientRect(); if (!r.width) continue;
    const d = Math.min(2, devicePixelRatio || 1); cv.width = r.width * d; cv.height = r.height * d;
    const g = cv.getContext('2d'); g.scale(d, d);
    const bg = g.createLinearGradient(0, 0, 0, r.height); bg.addColorStop(0, '#1b1f2a'); bg.addColorStop(0.72, '#262a35'); bg.addColorStop(0.73, '#34332f'); bg.addColorStop(1, '#1d1c1a');
    g.fillStyle = bg; g.fillRect(0, 0, r.width, r.height);
    const lg = g.createRadialGradient(r.width / 2, r.height * 0.2, 4, r.width / 2, r.height * 0.4, r.width * 0.6); lg.addColorStop(0, 'rgba(255,214,160,0.2)'); lg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = lg; g.fillRect(0, 0, r.width, r.height);
    const cc = cv.dataset.model ? newCar(cv.dataset.model) : S.cars[+cv.dataset.own];
    if (!cc) continue;
    const len = Math.min(r.width * 0.86, r.height * 2.3) * (CARS[cc.model].length / 4.6);
    drawCarSide(g, cc, r.width / 2, r.height * 0.86, len);
  }
}

// ---------------------------------------------------------------- moving a save between the Claude page and the installed app
const b64enc = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
const b64dec = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const SaveXfer = {
  async encode(ghosts) {
    const data = Object.assign({}, S); if (!ghosts) data.ghosts = {};
    const json = JSON.stringify(data);
    try {
      if (window.CompressionStream) {
        const buf = await new Response(new Blob([json]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer();
        return 'YT1:' + b64enc(new Uint8Array(buf));
      }
    } catch (e) {}
    return 'YT0:' + b64enc(new TextEncoder().encode(json));
  },
  async decode(text) {
    const t = (text || '').trim();
    let json;
    if (t.startsWith('{')) json = t;
    else {
      const m = /^YT([01]):([\s\S]+)$/.exec(t); if (!m) throw new Error('Ez nem Yoru Tōge mentéskód.');
      const bytes = b64dec(m[2].replace(/\s+/g, ''));
      json = m[1] === '1' ? await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text() : new TextDecoder().decode(bytes);
    }
    const o = JSON.parse(json);
    if (!o || !Array.isArray(o.cars) || !o.cars.length || typeof o.money !== 'number' || o.cars.some(c => !CARS[c.model])) throw new Error('A kód sérült vagy hiányos.');
    return o;
  },
  summary(o) { return `${o.day}. nap · ${fmtY(o.money)} · ${o.rep} hírnév · ${o.cars.length} autó`; },
  exportUI() {
    let ghosts = false;
    const ta = el('textarea', { class: 'xfer-code', readonly: true, rows: 5, 'aria-label': 'Mentéskód', spellcheck: 'false' });
    const info = el('div', { class: 'muted', style: 'font-size:12.5px' });
    const fill = async () => { ta.value = 'Készül…'; const c = await this.encode(ghosts); ta.value = c; info.textContent = `${Math.round(c.length / 1024)} kB${ghosts ? ', szellemautókkal' : ''}`; };
    const copy = async () => {
      try { await navigator.clipboard.writeText(ta.value); toast('Kód kimásolva.', 'good'); return; } catch (e) {}
      try { ta.removeAttribute('readonly'); ta.select(); const ok = document.execCommand('copy'); ta.setAttribute('readonly', ''); if (ok) { toast('Kód kimásolva.', 'good'); return; } } catch (e) {}
      ta.select(); toast('Jelöld ki és másold ki kézzel.', 'bad');
    };
    const file = async () => { const r = await offerFile(`yoru-toge-mentes-${S.day}-nap.txt`, new Blob([ta.value], { type: 'text/plain' })); if (r === 'saved' || r === 'downloaded' || r === 'shared') toast('Mentésfájl elkészült.', 'good'); else if (r === 'failed') toast('Ebben a nézetben nem tudok fájlt menteni. Másold ki a kódot.', 'bad'); };
    UI.open([UI.head('Mentés kimentése', this.summary(S)),
      el('p', { style: 'margin:0' }, 'Másold ki a kódot, és a másik változatban a Beállítások → Mentés betöltése alatt illeszd be. Ha egyszerűbb, mentsd fájlba, és azt töltsd be.'),
      el('label', { class: 'row', style: 'gap:8px;cursor:pointer' }, el('input', { type: 'checkbox', style: 'width:20px;height:20px;accent-color:var(--sodium)', onchange: (e) => { ghosts = e.target.checked; fill(); } }), 'Szellemautók is (hosszabb kód)'),
      ta, info,
      el('div', { class: 'row' }, el('button', { class: 'btn primary', onclick: copy }, 'Kód másolása'), el('button', { class: 'btn', onclick: file }, 'Fájlba mentem'), el('button', { class: 'btn ghost', onclick: () => UI.settings() }, 'Vissza'))]);
    fill();
  },
  importUI() {
    const ta = el('textarea', { class: 'xfer-code', rows: 5, placeholder: 'Illeszd be ide a mentéskódot (YT1:…)', 'aria-label': 'Mentéskód beillesztése', spellcheck: 'false' });
    const err = el('p', { class: 'xfer-err', role: 'alert' });
    const fileIn = el('input', { type: 'file', accept: '.txt,.json,text/plain,application/json', style: 'display:none', onchange: async (e) => { const f = e.target.files && e.target.files[0]; if (f) { ta.value = await f.text(); go(); } } });
    const go = async () => {
      err.textContent = '';
      try { const o = await this.decode(ta.value); this.confirm(o); } catch (e) { err.textContent = e && e.message && !/JSON|atob|decod|base64/i.test(e.message) ? e.message : 'Nem sikerült beolvasni. Biztos, hogy az egész kódot bemásoltad?'; }
    };
    UI.open([UI.head('Mentés betöltése', 'Kód vagy mentésfájl a másik változatból'),
      ta, err, fileIn,
      el('div', { class: 'row' }, el('button', { class: 'btn primary', onclick: go }, 'Betöltöm'), el('button', { class: 'btn', onclick: () => fileIn.click() }, 'Fájlból'), el('button', { class: 'btn ghost', onclick: () => UI.settings() }, 'Vissza'))]);
  },
  confirm(o) {
    UI.open([UI.head('Felülírod a mostani állást?', `Most: ${this.summary(S)}`),
      el('p', { style: 'margin:0' }, `A betöltendő mentés: ${this.summary(o)}.`),
      el('p', { class: 'muted', style: 'margin:0' }, 'A mostani garázsod ezzel elvész ebben a változatban.'),
      el('div', { class: 'row' }, el('button', { class: 'btn primary', onclick: () => {
        const keepGhosts = S.ghosts; S = sanitize(o);
        if (!Object.keys(S.ghosts || {}).length && keepGhosts) S.ghosts = keepGhosts;
        Save.queue(true); UI.close(); UI.show('garage'); toast(`Mentés betöltve: ${S.day}. nap.`, 'good');
      } }, 'Igen, betöltöm'), el('button', { class: 'btn', onclick: () => this.importUI() }, 'Mégse'))]);
  }
};

function drawDragArt(cv) {
  if (!cv) return; const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); if (!r.width) return;
  cv.width = r.width * d; cv.height = r.height * d; const g = cv.getContext('2d'); g.scale(d, d); const W = r.width, H = r.height;
  const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#0a0d1c'); sky.addColorStop(0.55, '#2a1f33'); sky.addColorStop(0.56, '#17181c'); sky.addColorStop(1, '#0b0b0d'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
  g.fillStyle = '#0b0d14'; for (let i = 0; i < 4; i++) { const x = W * (0.08 + i * 0.27), h = H * (0.3 + (i % 2) * 0.08); g.fillRect(x, H * 0.55 - h, 4, h); g.fillRect(x + 26, H * 0.55 - h, 4, h); g.fillRect(x - 30, H * 0.55 - h, 90, 6); }
  const cols = ['#6a2019', '#173c69', '#23512c', '#7c5613']; for (let i = 0; i < 14; i++) { g.fillStyle = cols[i % 4]; const side = i % 2, k = Math.floor(i / 2), w = 34 - k * 3; g.fillRect(side ? W * 0.5 + 40 + k * 26 : W * 0.5 - 40 - k * 26 - w, H * 0.56 - 12 - (i % 3) * 3, w, 14 + (i % 3) * 3); }
  g.fillStyle = '#2a2a2d'; g.beginPath(); g.moveTo(W * 0.5 - 6, H * 0.56); g.lineTo(W * 0.5 + 6, H * 0.56); g.lineTo(W * 0.86, H); g.lineTo(W * 0.14, H); g.fill();
  g.strokeStyle = '#e09a2a'; g.lineWidth = 2; g.setLineDash([10, 8]); g.beginPath(); g.moveTo(W * 0.5, H * 0.58); g.lineTo(W * 0.5, H); g.stroke(); g.setLineDash([]);
  for (let i = 0; i < 5; i++) { const t = i / 5, y = H * (0.58 + t * t * 0.4), x = 20 + t * W * 0.3; for (const s of [-1, 1]) { const gr = g.createRadialGradient(W / 2 + s * x, y - 20 - t * 30, 0, W / 2 + s * x, y - 20 - t * 30, 12 + t * 16); gr.addColorStop(0, 'rgba(255,170,80,0.9)'); gr.addColorStop(1, 'rgba(255,170,80,0)'); g.fillStyle = gr; g.fillRect(W / 2 + s * x - 30, y - 60 - t * 30, 60, 60); } }
}
