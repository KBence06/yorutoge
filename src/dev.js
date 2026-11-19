// ===================== DEV MENU: cheats and debug tools for testing (Settings → Fejlesztői menü, or the ` key) =====================
const Dev = {
  defaults() { return { money: false, god: false, nos: false, pow: 1, rivals: 1, wx: '', fps: false, instant: false, cops: '' }; },
  ch() { if (!S.cheats) S.cheats = this.defaults(); return Object.assign(S.cheats, Object.assign(this.defaults(), S.cheats)); },
  // gameplay cheats stay out of online races, so nobody gets an unfair car in someone else's room
  live(R) { return !(R && R.net); },
  init() {
    this.ch();
    // endless money: purchases always go through and the balance stays topped up
    const spend = UI.spend.bind(UI);
    UI.spend = (n) => { if (this.ch().money) { this.topUp(); return true; } return spend(n); };
    const render = UI.render.bind(UI);
    UI.render = () => { this.topUp(); render(); const m = $('#stMoney'); if (m && this.ch().money) m.textContent = '¥ ∞'; };
    const order = UI.order.bind(UI);
    UI.order = (p) => { if (!this.ch().instant) return order(p); if (!UI.spend(p.price)) return; S.inv.push(p.id); toast(`${p.name}: azonnal a polcon (dev).`, 'good'); save(); UI.render(); };
    document.addEventListener('keydown', (e) => {
      if (e.key !== '`' && e.key !== '§' && e.key !== '0') return;
      if (e.key === '0' && !e.ctrlKey) return;
      if (/INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '')) return;
      e.preventDefault(); if (typeof Race !== 'undefined' && Race.active) return; this.open();
    });
    if (this.ch().fps) this.fpsOn(true);
  },
  topUp() { if (this.ch().money && S.money < 999999999) S.money = 999999999; },
  set(k, v) { this.ch()[k] = v; save(); UI.render(); this.open(); },
  // ---- the panel
  open() {
    const c = this.ch(), cur = car(), keep = !$('#modal').hidden && $('#sheet').querySelector('.devwrap') ? $('#sheet').scrollTop : 0;
    const sw = (key, label, hint) => el('label', { class: 'item', style: 'cursor:pointer' },
      el('div', null, el('div', { class: 't' }, label), hint ? el('div', { class: 'muted', style: 'font-size:12.5px' }, hint) : null),
      el('input', { type: 'checkbox', checked: !!c[key], style: 'width:22px;height:22px;accent-color:var(--neon)', onchange: (e) => { if (key === 'fps') this.fpsOn(e.target.checked); this.set(key, e.target.checked); } }));
    const chips = (key, label, opts, hint) => el('div', { class: 'item' }, el('div', null, el('div', { class: 't' }, label), hint ? el('div', { class: 'muted', style: 'font-size:12.5px' }, hint) : null),
      el('div', { class: 'row', style: 'grid-column:1/-1' }, ...opts.map(([v, n]) => el('button', { class: 'chip', 'aria-pressed': String(c[key] === v), onclick: () => this.set(key, v) }, n))));
    const btn = (label, fn, kind) => el('button', { class: 'btn small' + (kind ? ' ' + kind : ''), onclick: () => { fn(); save(); UI.render(); this.open(); } }, label);
    const sec = (t) => el('div', { class: 'eyebrow devsec' }, t);
    const owned = new Set(S.cars.map(x => x.model));
    UI.open([UI.head('Fejlesztői menü', 'Csalások és tesztelés · csak a saját mentésedre hatnak, online futamon a vezetési csalások nem élnek'),
      el('div', { class: 'devwrap' },
        sec('Pénz és hírnév'),
        el('div', { class: 'items' },
          sw('money', 'Végtelen pénz', 'Bármit megvehetsz, a számla nem fogy el.'),
          el('div', { class: 'item' }, el('div', null, el('div', { class: 't' }, `Pénz: ${c.money ? '∞' : fmtY(S.money)} · Hírnév: ${S.rep}`)),
            el('div', { class: 'row', style: 'grid-column:1/-1' },
              btn('+1 M ¥', () => { S.money += 1000000; }), btn('+10 M ¥', () => { S.money += 10000000; }), btn('Pénz nullázása', () => { c.money = false; S.money = 0; }, 'ghost'),
              btn('+50 hírnév', () => { S.rep += 50; }), btn('Max hírnév', () => { S.rep = 999; }), btn('Hírnév 0', () => { S.rep = 0; }, 'ghost')))),
        sec('Garázs'),
        el('div', { class: 'items' },
          sw('instant', 'Azonnali szállítás', 'A boltban rendelt alkatrész rögtön a polcra kerül, nem kell napokat várni.'),
          el('div', { class: 'item' }, el('div', null, el('div', { class: 't' }, 'Gyors gombok')),
            el('div', { class: 'row', style: 'grid-column:1/-1' },
              btn('Rendelések megérkeznek', () => { for (const o of S.orders) S.inv.push(o.pid); S.orders = []; }),
              btn('Autó javítása', () => { for (const k of Object.keys(cur.cond)) cur.cond[k] = 1; toast('Mint az új.', 'good'); }),
              btn('Minden autó javítása', () => { for (const x of S.cars) for (const k of Object.keys(x.cond)) x.cond[k] = 1; }),
              btn('Minden dekor', () => { for (const k of Object.keys(DECOR)) for (const it of DECOR[k].items) if (!S.ownedDecor.includes(it.id)) S.ownedDecor.push(it.id); toast('A garázs összes dísze a tiéd.', 'good'); }),
              btn('Minden autóból egy', () => { for (const m of Object.keys(CARS)) if (!owned.has(m)) S.cars.push(newCar(m)); toast('Tele a garázs.', 'good'); }))),
          el('div', { class: 'item' }, el('div', null, el('div', { class: 't' }, 'Autó hozzáadása'), el('div', { class: 'muted', style: 'font-size:12.5px' }, 'Ingyen, gyári állapotban. Koppints rá, és rögtön a garázsban áll.')),
            el('div', { class: 'row devcars', style: 'grid-column:1/-1' }, ...Object.entries(CARS).map(([id, M]) => el('button', { class: 'chip', onclick: () => { S.cars.push(newCar(id)); S.active = S.cars.length - 1; save(); UI.render(); toast(`${M.name} a garázsban.`, 'good'); this.open(); } }, M.name.replace(/^\S+ /, ''))))),
          el('div', { class: 'item' }, el('div', null, el('div', { class: 't' }, `Alkatrész felszerelése: ${CARS[cur.model].name}`), el('div', { class: 'muted', style: 'font-size:12.5px' }, 'Szerelés nélkül, tökéletes minőségben kerül fel. Jobb, ha a boltban veszed és kézzel szereled, de így gyorsan kipróbálhatsz egy összeállítást.')),
            el('div', { class: 'row', style: 'grid-column:1/-1' }, el('button', { class: 'btn small primary', onclick: () => this.partsUI() }, 'Kategóriák')))),
        sec('Futam'),
        el('div', { class: 'items' },
          sw('god', 'Sérthetetlen autó', 'Nem kopik a motor, a gumi és a kuplung, nem törik a karosszéria, és nem kapsz motorhibát.'),
          sw('nos', 'Végtelen nitro', 'Nitro készlet nélkül is kapsz 100 lóerős nitrót (N gomb), és nem fogy el.'),
          chips('pow', 'Motorerő szorzó', [[1, '×1'], [1.25, '×1,25'], [1.5, '×1,5'], [2, '×2'], [3, '×3']], 'Csak futamon hat, a dynón és a menükben a valódi érték látszik.'),
          chips('rivals', 'Ellenfelek tempója', [[0.7, 'Lassú'], [0.85, 'Kicsit lassabb'], [1, 'Normál'], [1.15, 'Gyorsabb'], [1.35, 'Nagyon gyors']]),
          chips('cops', 'Rendőrség', [['', 'Normál'], ['off', 'Soha'], ['on', 'Mindig']]),
          el('div', { class: 'item' }, el('div', null, el('div', { class: 't' }, 'Győzelmek')),
            el('div', { class: 'row', style: 'grid-column:1/-1' },
              btn('Minden ellenfél legyőzve', () => { for (const tg of TOUGES) for (const rv of tg.rivals) { S.wins[rv.id] = true; S.wins[rv.id + '_r'] = true; } for (const rv of DRAG.rivals) S.wins[rv.id] = true; toast('Minden ellenfél legyőzve.', 'good'); }),
              btn('Győzelmek törlése', () => { S.wins = {}; }, 'ghost')))),
        sec('Világ'),
        el('div', { class: 'items' },
          chips('wx', 'Időjárás', [['', 'Naptár szerint'], ...Object.entries(WEATHER).map(([k, w]) => [k, w.short])], 'Felülírja az aznapi időjárást a futamokon és a garázsban.'),
          el('div', { class: 'item' }, el('div', null, el('div', { class: 't' }, `${S.day}. nap · rendőri figyelem: ${Math.round(S.heat || 0)}`)),
            el('div', { class: 'row', style: 'grid-column:1/-1' },
              btn('Következő nap', () => { const a = advanceDay(); if (a.length) toast(`Megjött: ${a.length} csomag.`); }),
              btn('+7 nap', () => { for (let i = 0; i < 7; i++) advanceDay(); }),
              btn('Rendőri figyelem 0', () => { S.heat = 0; })))),
        sec('Hibakeresés'),
        el('div', { class: 'items' },
          sw('fps', 'FPS és rajzolási adatok', 'Kis kijelző a sarokban: képkocka per másodperc, és futamon a rajzolási hívások és háromszögek száma.'),
          el('div', { class: 'item' }, el('div', null, el('div', { class: 't' }, 'Visszaállítás')),
            el('div', { class: 'row', style: 'grid-column:1/-1' }, btn('Minden csalás ki', () => { S.cheats = this.defaults(); this.fpsOn(false); }, 'ghost'))))),
      el('div', { class: 'row' }, el('button', { class: 'btn', onclick: () => UI.settings() }, 'Vissza a beállításokhoz'), el('button', { class: 'btn ghost', onclick: () => UI.close() }, 'Bezárás'))]);
    $('#sheet').scrollTop = keep;
  },
  partsUI(slot) {
    const cur = car(), cats = typeof CATS !== 'undefined' ? CATS : [];
    if (!slot) {
      UI.open([UI.head('Alkatrész felszerelése', CARS[cur.model].name),
        ...cats.map(ct => el('div', { class: 'item devcat' }, el('div', { class: 't' }, ct.name),
          el('div', { class: 'row', style: 'grid-column:1/-1' }, ...ct.slots.filter(s => PARTS.some(p => p.slot === s)).map(s => el('button', { class: 'chip', 'aria-pressed': String(!!cur.parts[s]), onclick: () => this.partsUI(s) }, SLOTS[s] || s))))),
        el('div', { class: 'row' }, el('button', { class: 'btn', onclick: () => this.open() }, 'Vissza'))]);
      return;
    }
    const list = PARTS.filter(p => p.slot === slot), on = cur.parts[slot] && cur.parts[slot].id;
    UI.open([UI.head(SLOTS[slot] || slot, CARS[cur.model].name),
      el('div', { class: 'items' }, ...list.map(p => {
        const why = partAllowed(p, cur);
        return el('div', { class: 'item' }, el('div', null, el('div', { class: 't' }, p.name), el('div', { class: 'muted', style: 'font-size:12.5px' }, `${p.brand || ''} · ${fmtY(p.price)}${why ? ' · ' + why : ''}`)),
          el('button', { class: 'btn small' + (on === p.id ? ' primary' : ''), disabled: !!why, onclick: () => { cur.parts[slot] = { id: p.id, q: 1 }; save(); UI.render(); toast(`Felszerelve: ${p.name}`, 'good'); this.partsUI(slot); } }, on === p.id ? 'Fent van' : 'Felszerel'));
      })),
      el('div', { class: 'row' }, on ? el('button', { class: 'btn ghost', onclick: () => { delete cur.parts[slot]; save(); UI.render(); this.partsUI(slot); } }, 'Leszerelem') : null, el('button', { class: 'btn', onclick: () => this.partsUI() }, 'Vissza'))]);
  },
  // ---- race hooks (called from Race.build)
  race(R) {
    const c = this.ch(); if (!this.live(R)) return;
    const P = R.P;
    if (c.pow && c.pow !== 1) P.powK = c.pow;
    if (c.god) P.god = true;
    if (c.nos) { if (!P.sp.nos) P.sp.nos = 100; P.infNos = true; P.nosLeft = 1; }
    if (c.rivals && c.rivals !== 1 && R.R && R.R.P) { R.R.P *= c.rivals; R.R.mu *= 1 + (c.rivals - 1) * 0.6; }
  },
  // ---- the corner counter
  fpsOn(on) {
    if (this.fpsEl) { this.fpsEl.remove(); this.fpsEl = null; cancelAnimationFrame(this.fpsRaf); }
    if (!on) return;
    const box = this.fpsEl = el('div', { class: 'devfps', 'aria-hidden': 'true' }); document.body.append(box);
    let n = 0, t0 = performance.now(), worst = 0, last = t0;
    const tick = (t) => {
      n++; worst = Math.max(worst, t - last); last = t;
      if (t - t0 >= 500) {
        const fps = n * 1000 / (t - t0); let extra = '';
        const r = (typeof Race !== 'undefined' && Race.active && Race.renderer) || (typeof Walk !== 'undefined' && Walk.active && Walk.renderer);
        if (r) { const i = r.info.render; extra = ` · ${i.calls} hívás · ${(i.triangles / 1000).toFixed(0)}k △ · ${r.getPixelRatio().toFixed(2)}×`; }
        box.textContent = `${fps.toFixed(0)} FPS · max ${worst.toFixed(0)} ms${extra}`; n = 0; t0 = t; worst = 0;
      }
      this.fpsRaf = requestAnimationFrame(tick);
    };
    this.fpsRaf = requestAnimationFrame(tick);
  }
};
