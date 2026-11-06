// ===================== PAINT SHOP: colour, finish, livery, neon and banner with a live preview =====================
const PaintShop = {
  draft: null,
  cost(c, d) {
    const L = c.look || {}, out = [];
    const colourChanged = d.paint !== c.paint || (d.look.finish || 'gloss') !== (L.finish || 'gloss');
    if (colourChanged) out.push(['Fényezés · ' + FINISHES[d.look.finish || 'gloss'].name, Math.round(40000 * FINISHES[d.look.finish || 'gloss'].mult)]);
    const livChanged = (d.look.livery || null) !== (L.livery || null) || (d.look.livery && d.look.col2 !== L.col2);
    if (livChanged) out.push(d.look.livery ? ['Fólia · ' + LIVERIES[d.look.livery].name, LIVERY_COST] : ['Fólia eltávolítása', 8000]);
    if ((d.look.neon || NEONS[0][0]) !== (L.neon || NEONS[0][0])) out.push(['Neon csőcsere', 6000]);
    if ((d.look.banner || 'yoru') !== (L.banner || 'yoru')) out.push(['Új szélvédőcsík', 4000]);
    return out;
  },
  open() {
    const c = car();
    this.draft = { paint: c.paint, look: Object.assign({ finish: 'gloss', livery: null, col2: '#141418', neon: NEONS[0][0], banner: 'yoru' }, c.look || {}) };
    this.render();
  },
  render() {
    const c = car(), d = this.draft, v = carVisual(c), keep = $('#modal').hidden ? 0 : $('#sheet').scrollTop;
    const preview = el('canvas', { class: 'ps-preview', 'aria-label': 'Előnézet' });
    const sw = (list, cur, onPick, small) => el('div', { class: 'swatches' }, ...list.map(([hex, n]) => el('button', { class: 'sw' + (small ? ' s' : ''), title: n, 'aria-label': n, 'aria-pressed': cur === hex ? 'true' : 'false', style: `background:${hex}`, onclick: () => { onPick(hex); this.render(); } })));
    const chips = (list, cur, onPick) => el('div', { class: 'row' }, ...list.map(([val, n]) => el('button', { class: 'chip', 'aria-pressed': cur === val ? 'true' : 'false', onclick: () => { onPick(val); this.render(); } }, n)));
    const lines = this.cost(c, d), total = lines.reduce((a, b) => a + b[1], 0);
    const sec = (title, body, note) => el('div', { class: 'ps-sec' }, el('div', { class: 'eyebrow' }, title), note ? el('div', { class: 'muted', style: 'font-size:12.5px' }, note) : null, body);
    UI.open([UI.head('Fényezőműhely', `Watanabe-san műhelye · ${CARS[c.model].name}`),
      el('div', { class: 'ps' },
        el('div', { class: 'ps-left' }, preview,
          el('div', { class: 'ps-bill' },
            ...(lines.length ? lines.map(([n, p]) => el('div', { class: 'bill-row' }, el('span', null, n), el('b', null, fmtY(p)))) : [el('div', { class: 'muted' }, 'Válassz színt, fényezést vagy fóliát. Az előnézet azonnal mutatja.')]),
            lines.length ? el('div', { class: 'bill-row tot' }, el('span', null, 'Összesen · egy éjszaka'), el('b', null, fmtY(total))) : null,
            el('div', { class: 'row' },
              el('button', { class: 'btn primary', disabled: !lines.length, onclick: () => this.commit() }, lines.length ? `Megrendelem · ${fmtY(total)}` : 'Nincs változás'),
              lines.length ? el('button', { class: 'btn ghost', onclick: () => this.open() }, 'Visszaállítás') : null))),
        el('div', { class: 'ps-right' },
          sec('Alapszín', sw(PAINTS, d.paint, (h) => { d.paint = h; })),
          sec('Fényezés', chips(Object.entries(FINISHES).map(([k, f]) => [k, `${f.name}${f.mult > 1 ? ' ×' + f.mult : ''}`]), d.look.finish || 'gloss', (k) => { d.look.finish = k; }), 'A metál és a gyöngyház csillog a lámpák alatt, a matt elnyeli a fényt.'),
          sec('Fólia', chips([[null, 'Nincs'], ...Object.entries(LIVERIES).map(([k, l]) => [k, l.name])], d.look.livery || null, (k) => { d.look.livery = k; }), `Egy fólia ${fmtY(LIVERY_COST)}, a hegyen is látszik.`),
          d.look.livery ? sec('A fólia színe', sw(PAINTS, d.look.col2, (h) => { d.look.col2 = h; }, true)) : null,
          v.neon ? sec('Neon színe', sw(NEONS, d.look.neon, (h) => { d.look.neon = h; })) : sec('Neon színe', el('div', { class: 'locked' }, 'Nincs beszerelve. Neon underglow a NIGHT PASS Külső rovatában.')),
          v.banner ? sec('Szélvédőcsík felirata', chips(BANNERS, d.look.banner || 'yoru', (k) => { d.look.banner = k; })) : null))]);
    requestAnimationFrame(() => {
      const r = preview.getBoundingClientRect(); if (!r.width) return;
      const dpr = Math.min(2, devicePixelRatio || 1); preview.width = r.width * dpr; preview.height = r.height * dpr;
      const g = preview.getContext('2d'); g.scale(dpr, dpr);
      const bg = g.createLinearGradient(0, 0, 0, r.height); bg.addColorStop(0, '#20232c'); bg.addColorStop(0.74, '#2b2e38'); bg.addColorStop(0.75, '#3a3936'); bg.addColorStop(1, '#1b1a18');
      g.fillStyle = bg; g.fillRect(0, 0, r.width, r.height);
      const lg = g.createRadialGradient(r.width / 2, 0, 10, r.width / 2, r.height * 0.3, r.width * 0.7); lg.addColorStop(0, 'rgba(255,240,215,0.32)'); lg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = lg; g.fillRect(0, 0, r.width, r.height);
      g.fillStyle = 'rgba(255,255,255,0.05)'; for (let x = 0; x < r.width; x += 26) g.fillRect(x, r.height * 0.75, 1, r.height * 0.25);
      const tmp = Object.assign({}, c, { paint: d.paint, look: d.look });
      drawCarSide(g, tmp, r.width / 2, r.height * 0.88, Math.min(r.width * 0.88, r.height * 2.2) * (CARS[c.model].length / 4.6));
      $('#sheet').scrollTop = keep;
    });
  },
  commit() {
    const c = car(), d = this.draft, total = this.cost(c, d).reduce((a, b) => a + b[1], 0);
    if (!UI.spend(total)) return;
    c.paint = d.paint; c.look = Object.assign({}, d.look);
    toast('Kész a fényezés. Reggelre megszáradt.', 'good');
    save(); UI.close(); UI.render();
  }
};
