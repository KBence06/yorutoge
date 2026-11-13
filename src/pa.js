// ===================== THE UPPER PARKING AREA IN 3D: walk between the cars, talk to their owners =====================
const PA = {
  open() {
    const R = Meet.roster();
    return Walk.open({
      title: 'A felső parkoló', sub: '夜の集会 · éjfél után', spawn: { x: 10.5, z: 6.5, yaw: Math.atan2(-10.5, -9), pitch: -0.05 }, bounds: { x0: -17, x1: 17, z0: -9.2, z1: 10.2 },
      buttons: (W) => [{ label: 'Lista', act: () => { W.close(); Meet.open(); } }],
      build: (W) => this.build(W, R)
    });
  },
  person(W, x, z, ry, shirt, smoke) {
    const g = new THREE.Group(), dark = new THREE.MeshLambertMaterial({ color: 0x16171c }), top = new THREE.MeshLambertMaterial({ color: shirt }), skin = new THREE.MeshLambertMaterial({ color: 0xc9a183 });
    const add = (geo, m, px, py, pz) => { const me = new THREE.Mesh(geo, m); me.position.set(px, py, pz); g.add(me); W.track.push(geo); return me; };
    W.track.push(dark, top, skin);
    for (const s of [-1, 1]) add(new THREE.CylinderGeometry(0.075, 0.065, 0.86, 8), dark, s * 0.1, 0.43, 0);
    add(new THREE.CylinderGeometry(0.2, 0.17, 0.62, 10), top, 0, 1.17, 0); add(new THREE.SphereGeometry(0.115, 12, 10), skin, 0, 1.63, 0); add(new THREE.SphereGeometry(0.122, 12, 8, 0, 7, 0, 1.5), dark, 0, 1.65, -0.01);
    for (const s of [-1, 1]) { const a = add(new THREE.CylinderGeometry(0.05, 0.045, 0.58, 8), top, s * 0.25, 1.17, 0.02); a.rotation.z = s * 0.12; }
    if (smoke) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: W.glowTex(), color: 0xff7a30, blending: THREE.AdditiveBlending, depthWrite: false })); sp.scale.set(0.09, 0.09, 1); sp.position.set(0.27, 0.92, 0.1); g.add(sp); W.track.push(sp.material); W.tickers.push((dt, t) => { sp.material.opacity = 0.55 + 0.45 * Math.max(0, Math.sin(t * 0.9 + x)); }); }
    g.position.set(x, 0, z); g.rotation.y = ry; W.scene.add(g); W.collide(x - 0.25, x + 0.25, z - 0.25, z + 0.25); return g;
  },
  build(W, R) {
    const sc = W.scene, st = Meet.state(); sc.background = new THREE.Color(0x05060c); sc.fog = new THREE.Fog(0x05060c, 30, 120);
    sc.add(new THREE.HemisphereLight(0x2a3350, 0x15120e, 0.75)); sc.add(new THREE.AmbientLight(0x20222a, 0.6));
    // asphalt with painted bays
    const gt = W.canvasTex(1024, 640, (g) => {
      g.fillStyle = '#1b1c20'; g.fillRect(0, 0, 1024, 640);
      for (let i = 0; i < 9000; i++) { const v = 22 + Math.random() * 40; g.fillStyle = `rgba(${v},${v},${v + 3},0.5)`; g.fillRect(Math.random() * 1024, Math.random() * 640, 2, 2); }
      g.fillStyle = 'rgba(8,8,10,0.4)'; for (let i = 0; i < 14; i++) { g.beginPath(); g.ellipse(Math.random() * 1024, Math.random() * 640, 20 + Math.random() * 60, 10 + Math.random() * 30, Math.random() * 3, 0, 7); g.fill(); }
      g.strokeStyle = 'rgba(214,210,196,0.75)'; g.lineWidth = 4;
      for (let x = 112; x <= 912; x += 80) { g.beginPath(); g.moveTo(x, 20); g.lineTo(x, 190); g.stroke(); }
      g.beginPath(); g.moveTo(112, 20); g.lineTo(912, 20); g.stroke();
      g.strokeStyle = 'rgba(224,154,42,0.6)'; g.setLineDash([26, 20]); g.beginPath(); g.moveTo(20, 430); g.lineTo(1004, 430); g.stroke();
    });
    const fl = W.mesh(new THREE.PlaneGeometry(36, 22.5), new THREE.MeshLambertMaterial({ map: gt }), 0, 0, 0.3); fl.rotation.x = -Math.PI / 2;
    const far = W.mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshLambertMaterial({ color: 0x0a0c0f }), 0, -0.4, 0); far.rotation.x = -Math.PI / 2;
    // guard rail on the valley side, and the town far below
    const railM = new THREE.MeshLambertMaterial({ color: 0x8a8f96 }); W.mesh(new THREE.BoxGeometry(36, 0.3, 0.06), railM, 0, 0.62, -9.8);
    for (let x = -17; x <= 17; x += 2) W.mesh(new THREE.BoxGeometry(0.1, 0.8, 0.1), railM, x, 0.4, -9.86);
    const cp = [], cc = [], col = new THREE.Color(); let r = 99; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 1500; i++) { const a = rnd() * 2.4 - 1.2, d = 160 + Math.pow(rnd(), 0.6) * 520; cp.push(Math.sin(a) * d, -55 - rnd() * 30 - d * 0.03, -Math.cos(a) * d); col.setHSL(rnd() < 0.75 ? 0.09 : 0.55, 0.8, 0.45 + rnd() * 0.3); cc.push(col.r, col.g, col.b); }
    const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3)); cg.setAttribute('color', new THREE.Float32BufferAttribute(cc, 3));
    const cm = new THREE.PointsMaterial({ size: 2.2, sizeAttenuation: false, vertexColors: true, fog: false }); W.track.push(cg, cm); sc.add(new THREE.Points(cg, cm));
    const sp = []; for (let i = 0; i < 500; i++) { const a = rnd() * Math.PI * 2, e = 0.12 + rnd() * 1.3; sp.push(Math.cos(a) * Math.cos(e) * 380, Math.sin(e) * 380, Math.sin(a) * Math.cos(e) * 380); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); const sm = new THREE.PointsMaterial({ size: 1.4, sizeAttenuation: false, color: 0xcfd6ff, fog: false }); W.track.push(sg, sm); sc.add(new THREE.Points(sg, sm));
    // the mountain behind: a dark wall of trees
    const tt = W.canvasTex(512, 128, (g) => { g.clearRect(0, 0, 512, 128); g.fillStyle = '#07090c'; for (let x = 0; x < 512; x += 9) { const h = 50 + Math.random() * 70; g.beginPath(); g.moveTo(x - 10, 128); g.lineTo(x + 5, 128 - h); g.lineTo(x + 20, 128); g.fill(); } }, [5, 1]);
    W.board(tt, 120, 14, 0, 7, 12.5, Math.PI, { alpha: true }); const hill = W.mesh(new THREE.PlaneGeometry(160, 40), new THREE.MeshBasicMaterial({ color: 0x06080a }), 0, 0, 16); hill.rotation.x = -0.9; hill.rotation.y = Math.PI;
    // sodium lamps
    const poleM = new THREE.MeshLambertMaterial({ color: 0x3a3d44 }), headM = new THREE.MeshBasicMaterial({ color: 0xffb060 });
    for (const [x, z] of [[-9, 9.6], [3, 9.6], [13, 9.6]]) {
      W.mesh(new THREE.CylinderGeometry(0.07, 0.09, 6.2, 8), poleM, x, 3.1, z); W.mesh(new THREE.BoxGeometry(0.22, 0.1, 1.5), poleM, x, 6.2, z - 0.7); W.mesh(new THREE.BoxGeometry(0.3, 0.06, 0.7), headM, x, 6.12, z - 1.2);
      const pl = new THREE.PointLight(0xff9a40, 1.5, 30, 1.5); pl.position.set(x, 5.9, z - 1.3); sc.add(pl);
      const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: W.glowTex(), color: 0xffa860, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.8 })); gl.scale.set(2.6, 2.6, 1); gl.position.set(x, 6.05, z - 1.2); sc.add(gl); W.track.push(gl.material);
      const pool = W.board(W.glowTex(), 11, 11, x, 0.02, z - 2.2, 0, { add: true, color: 0x8a5a26 }); pool.rotation.x = -Math.PI / 2;
    }
    // vending machines: the only cold light up here
    for (const [x, hue] of [[-14.6, 0], [-13.3, 1]]) { W.board(W.canvasTex(512, 512, (g) => { drawFloorItem(g, 'f_vend', 16, 496, 1.6, 'L'); if (hue) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(40,90,220,0.35)'; g.fillRect(0, 0, 512, 512); } }), 2.46, 2.46, x + 0.55, 1.19, 9.9, Math.PI, { alpha: true }); }
    const vl = new THREE.PointLight(0x9fd8ff, 1.0, 9, 1.6); vl.position.set(-13.6, 1.5, 8.8); sc.add(vl); W.collide(-15.4, -12, 9.4, 10.4);
    W.hotspot(-13.6, 1.2, 9.2, 2.6, 'Kávé az automatából (¥ 120)', () => { if (S.money >= 120) { S.money -= 120; save(); Audio2.burst(140, 1.2, 0.3, 0.2, 'lowpass'); toast('Forró dobozos kávé. A hegyen ez a vacsora.'); UI.render(); } });
    // ---- tonight's cars, nose out, owners next to them
    const shirts = [0x8a2a22, 0x2a4f9a, 0xd8d2c2, 0x2f6b3a, 0x7a3a6a];
    R.racers.forEach((rc, i) => {
      const x = -6.3 + i * 4.2, z = -5.6, done = st.done[rc.mid];
      const m = W.car({ model: rc.c.model, paint: rc.c.paint, vis: carVisual(rc.c) }, x, z, 0, { bay: i % 2 === 0, turbo: !!rc.c.parts.turbo || !!CARS[rc.c.model].engine.turbo, plate: ['群馬 5' + (10 + i * 7), `${30 + i * 13}-${10 + i * 21}`] });
      if (m.hood) m.hood.rotation.x = -0.95;
      const L = m.sh.L / 2, Wd = m.sh.W / 2; W.collide(x - Wd, x + Wd, z - L, z + L);
      this.person(W, x + Wd + 0.55, z + L - 0.6, -0.6 - i * 0.3, shirts[i % shirts.length], i % 2 === 1);
      W.hotspot(x, 1, z + L + 0.5, 3.0, () => `${rc.name} · ${CARS[rc.c.model].name}`, () => Meet.card(rc, W), null).dyn = true;
    });
    // your own car, parked across two bays like you own the place
    const mine = W.car(car(), 11.5, 2.2, -2.2, { plate: ['黒沢 330', '19-07'], turbo: !!car().parts.turbo, bbk: !!car().parts.brakes }); W.collide(9.3, 13.7, 0.4, 4.0);
    W.hotspot(11.5, 1, 2.2, 3.4, 'Hazamegyek', () => W.close());
    // Gorō and his kei truck
    const van = W.car({ model: 'porter', paint: '#e9e6dc', vis: { wheel: 'stock' } }, -12.2, -4.8, 0.5, { plate: ['群馬 480', '55-01'] }); W.collide(-13.4, -11, -6.6, -3);
    const crateM = new THREE.MeshLambertMaterial({ color: 0x6a5234 }); for (const [dx, dz, s] of [[1.5, 0.6, 0.5], [2.1, 0.2, 0.42], [1.7, 1.3, 0.36]]) W.mesh(new THREE.BoxGeometry(s * 1.3, s, s), crateM, -12.2 + dx, s / 2, -4.8 + dz);
    this.person(W, -10.1, -3.0, 0.9, 0x4a4f58, true);
    const lamp = new THREE.PointLight(0xffe2b0, 0.9, 7, 1.8); lamp.position.set(-10.6, 1.4, -4); sc.add(lamp);
    W.hotspot(-10.6, 1, -3.9, 3.2, 'Gorō bácsi: használt alkatrészek', () => Meet.saleCard(W));
    // the style judge with a folding table
    const tblM = new THREE.MeshLambertMaterial({ color: 0xd8d2c2 }); W.mesh(new THREE.BoxGeometry(1.4, 0.05, 0.7), tblM, 0.5, 0.75, 6.4); for (const [dx, dz] of [[-0.6, -0.3], [0.6, -0.3], [-0.6, 0.3], [0.6, 0.3]]) W.mesh(new THREE.BoxGeometry(0.04, 0.75, 0.04), poleM, 0.5 + dx, 0.375, 6.4 + dz);
    W.mesh(new THREE.BoxGeometry(0.16, 0.24, 0.16), new THREE.MeshBasicMaterial({ color: 0xffd9a0 }), 0.9, 0.9, 6.4); const tl = new THREE.PointLight(0xffd9a0, 0.8, 6, 1.8); tl.position.set(0.9, 1.2, 6.2); sc.add(tl);
    this.person(W, 0.3, 7.2, Math.PI, 0xb89a3a, false); W.collide(-0.3, 1.3, 6, 6.8);
    W.hotspot(0.5, 1, 6.3, 3.0, () => st.done.style ? 'Szépségverseny: ma már pontoztak' : 'Szépségverseny: nevezek', () => Meet.styleShow(W)).dyn = true;
  }
};

// ---- cards used by the 3D parking area
Meet.card = function (r, W) {
  const st = this.state(), c = car(), ready = raceReadiness(c), tg = tougeDir(TOUGES.find(t => t.id === r.tg), r.rev), done = st.done[r.mid], doneD = st.done[r.mid + '_d'], M2 = CARS[r.c.model];
  const mods = Object.values(r.c.parts).map(p => PART[p.id]).filter(Boolean).map(p => p.name), dw = Math.max(5000, Math.round(r.wager * 0.4 / 1000) * 1000);
  const go = (fn) => { UI.close(); if (W && Walk.active) Walk.close(true); fn(); };
  UI.open([UI.head(`${r.name} · ${r.team}`, M2.name),
    el('p', { style: 'margin:0;font-style:italic' }, `„${r.line}”`),
    el('div', { class: 'meta' }, el('span', { class: 'tag' }, `kb. ${r.ps} LE`), el('span', { class: 'tag' }, M2.layout), el('span', { class: 'tag' }, `${M2.mass} kg`)),
    mods.length ? el('p', { class: 'muted', style: 'margin:0;font-size:13px' }, 'Amit látsz rajta: ' + mods.join(', ') + '.') : el('p', { class: 'muted', style: 'margin:0;font-size:13px' }, 'Gyárinak tűnik. Az ilyenekkel kell vigyázni.'),
    ready ? el('div', { class: 'panel', style: 'border-color:#6b2630' }, ready) : null,
    el('div', { class: 'items' },
      el('div', { class: 'item' }, el('div', null, el('div', { class: 't' }, `Egy kör a hegyen · ${tg.name}`), el('div', { class: 'muted', style: 'font-size:12.5px' }, `${dirName(tg)} · tét ${fmtY(r.wager)}${done ? done === 'win' ? ' · ma megverted' : ' · ma kifizetted' : ''}`)),
        el('button', { class: 'btn small primary', disabled: !!done || !!ready || S.money < r.wager, onclick: () => go(() => Race.start(tg, this.rivalOf(r), 'meet')) }, done ? 'Ma már volt' : S.money < r.wager ? 'Nincs rá pénzed' : 'Kihívom')),
      el('div', { class: 'item' }, el('div', null, el('div', { class: 't' }, 'Gyorsulás a kikötőben · 402 m'), el('div', { class: 'muted', style: 'font-size:12.5px' }, `Lemegyünk az egyenesre · tét ${fmtY(dw)}${doneD ? doneD === 'win' ? ' · ma megverted' : ' · ma kifizetted' : ''}`)),
        el('button', { class: 'btn small primary', disabled: !!doneD || !!ready || S.money < dw, onclick: () => go(() => Race.start(DRAG, Object.assign(this.rivalOf(r), { prize: dw, dragRun: true, launch: 0.85 + r.skill * 0.5, rep: 3 }), 'meet')) }, doneD ? 'Ma már volt' : S.money < dw ? 'Nincs rá pénzed' : 'Kihívom'))),
    el('div', { class: 'row' }, el('button', { class: 'btn ghost', onclick: () => UI.close() }, 'Vissza'))]);
};
Meet.saleCard = function (W) {
  const R = this.roster(), st = this.state(), items = el('div', { class: 'items' });
  for (const it of R.sale) {
    const p = PART[it.pid], sold = st.sold[it.pid];
    items.append(el('div', { class: 'item' }, el('div', null, el('div', { class: 't' }, p.name), el('div', { class: 'muted', style: 'font-size:12.5px' }, `${SLOTS[p.slot]} · újonnan ${fmtY(p.price)} · használt, azonnal viheted`)),
      el('button', { class: 'btn small', disabled: !!sold || S.money < it.price, onclick: () => { if (!UI.spend(it.price)) return; S.inv.push(it.pid); st.sold[it.pid] = true; S.stats.bootsale = (S.stats.bootsale || 0) + 1; toast(`${p.name} a csomagtartóban. Irány a szerelés.`, 'good'); save(); UI.render(); this.saleCard(W); } }, sold ? 'Elvitted' : fmtY(it.price))));
  }
  UI.open([UI.head('Gorō bácsi platója', '中古部品 · használt alkatrész'), el('p', { class: 'muted', style: 'margin:0' }, '„Mind jó, fiam. Ami nem jó, azt megmondom. Ezekről nem mondok semmit.”'), items, el('div', { class: 'row' }, el('button', { class: 'btn ghost', onclick: () => UI.close() }, 'Vissza'))]);
};
// how much a car turns heads: what is bolted on, how it sits, how clean it is
function styleScore(c) {
  const v = carVisual(c); let s = 20 + 22 * (c.cond ? c.cond.body : 0.9);
  const pts = { wing: 6, kit: 7, bumper: 7, canards: 3, diffuser: 4, flares: 8, roofscoop: 3, louver: 4, mirrors: 3, pipes: 6, pod: 3, towhook: 1, tsuri: 2, oilcooler: 3, tirelet: 2, intneon: 3, neon: 6, tint: 3, banner: 2, decal: 2, cage: 3, seat: 2, tail: 3, fogs: 1 };
  for (const k of Object.keys(pts)) if (v[k]) s += pts[k];
  if (v.hood) s += 4; if (v.lights) s += 2; if (v.wheel && v.wheel !== 'stock') s += 9; s += Math.min(8, (v.lower || 0) * 110);
  if (v.finish && v.finish !== 'gloss') s += 5; if (v.livery) s += 6; if (v.camber && (v.camber[0] < -2 || v.camber[1] < -2)) s += 3;
  return s;
}
Meet.styleShow = function (W) {
  const st = this.state(), R = this.roster();
  if (st.done.style) { toast('Ma éjjel már pontoztak. Holnap új zsűri, új autók.'); return; }
  let r = S.day * 7919 + 13; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
  const rows = R.racers.map(rc => ({ name: rc.name, car: CARS[rc.c.model].name, s: styleScore(rc.c) + rnd() * 10 }));
  const me = { name: 'Te', car: CARS[car().model].name, s: styleScore(car()) + rnd() * 6, me: true }; rows.push(me); rows.sort((a, b) => b.s - a.s);
  const place = rows.indexOf(me), prize = [45000, 20000, 8000][place] ? Math.round([45000, 20000, 8000][place] * PAY / 1000) * 1000 : 0, rep = [5, 3, 1][place] || 0;
  st.done.style = true; S.money += prize; S.rep += rep; S.stats.styleShows = (S.stats.styleShows || 0) + 1; if (place === 0) { S.stats.styleWins = (S.stats.styleWins || 0) + 1; addNews(`A te autód lett a legszebb a felső parkolóban (${CARS[car().model].name}).`); } save(); UI.render();
  UI.open([UI.head('Szépségverseny', 'A parkoló szavaz: ki áll a legjobban'),
    el('div', { class: 'res-big ' + (place === 0 ? 'win' : 'lose') }, `${place + 1}.`),
    el('div', { class: 'items' }, ...rows.map((x, i) => el('div', { class: 'item', style: x.me ? 'border-color:var(--sodium)' : '' }, el('div', null, el('div', { class: 't' }, `${i + 1}. ${x.name}`), el('div', { class: 'muted', style: 'font-size:12.5px' }, x.car)), el('b', { class: 'num' }, Math.round(x.s) + ' pont')))),
    el('p', { class: 'muted', style: 'margin:0' }, prize ? `Nyeremény: ${fmtY(prize)} és +${rep} hírnév.` : 'Dobogó nélkül nincs pénz. Felni, ültetés, body kit, fényezés, neon: mind számít, és a horpadás is.'),
    el('div', { class: 'row' }, el('button', { class: 'btn primary', onclick: () => UI.close() }, 'Rendben'))]);
};
