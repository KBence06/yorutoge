// ===================== WORK: gas station, tofu run, service jobs, sponsor deals =====================
const NEIGHBOURS = ['Takeda-san', 'Ono-san', 'Iwasaki-san', 'Morita-san', 'Kaneko-san', 'Sugimoto-san', 'Hayashi-san', 'Nomura-san'];
const SVC_JOBS = [
  { pid: 'tire0', title: 'Kerékcsere', ask: 'Lekopott az első gumi, cserélnéd?', pay: 9000 },
  { pid: 'pads1', title: 'Fékbetét', ask: 'Nyikorog a fék, a lányom fél tőle.', pay: 12000 },
  { pid: 'exhaust1', title: 'Kipufogócsere', ask: 'Átrozsdált a dob, úgy szól, mint egy traktor.', pay: 14000 },
  { pid: 'springs1', title: 'Rugócsere', ask: 'Leült a hátulja, a szomszéd szerint törött a rugó.', pay: 16000 },
  { pid: 'intake1', title: 'Sportszűrő', ask: 'A fiam szerint ettől gyorsabb lesz. Tegyük fel.', pay: 7000 }
];
const SPONSORS = [
  { id: 'kami', brand: 'Kaminari Works', task: 'Fuss 1:24 alatt a Kurozawa-tōgén (időmérő).', pay: 40000, test: () => (S.best.kurozawa || 999) < 84, prog: () => S.best.kurozawa ? `legjobb: ${fmtTime(S.best.kurozawa)}` : 'még nincs időd' },
  { id: 'michiru', brand: 'Michiru Tyre', task: 'Tiszta futam: időmérő szalagkorlát érintése nélkül.', pay: 30000, test: () => (S.stats.clean || 0) > 0, prog: () => `${S.stats.clean || 0} tiszta futam` },
  { id: 'hoshi', brand: 'Hoshi Speed', task: 'Szállíts tofut legalább 90% vízzel.', pay: 35000, test: () => (S.stats.tofuBest || 0) >= 0.9, prog: () => S.stats.tofuBest ? `legjobb: ${Math.round(S.stats.tofuBest * 100)}%` : 'még nem szállítottál' },
  { id: 'sora', brand: 'Sora Oil', task: 'Egy műszak a kúton, minden vásárló borravalóval.', pay: 20000, test: () => !!S.stats.gasPerfect, prog: () => S.stats.gasBestTips != null ? `legjobb: ${S.stats.gasBestTips}/5 borravaló` : 'még nem dolgoztál a kúton' },
  { id: 'kuro', brand: 'Kurogane', task: 'Végezz el 3 szervizmunkát legalább 85%-os minőségben.', pay: 45000, test: () => (S.stats.svcGood || 0) >= 3, prog: () => `${S.stats.svcGood || 0} / 3` },
  { id: 'tsuyo', brand: 'Tsuyoshi Racing', task: 'Mérj legalább 200 kerék-LE-t a dynón.', pay: 80000, test: () => (S.stats.dynoBest || 0) >= 200, prog: () => S.stats.dynoBest ? `legjobb: ${Math.round(S.stats.dynoBest)} LE` : 'még nem mértél' },
  { id: 'yama', brand: 'Yamakaze', task: 'Győzz le 3 riválist.', pay: 60000, test: () => Object.keys(S.wins).length >= 3, prog: () => `${Object.keys(S.wins).length} / 3` },
  { id: 'nightpass', brand: 'NIGHT PASS', task: 'Címlapsztori: építs 300 LE fölötti autót.', pay: 100000, test: () => S.cars.some(cc => carSpec(cc).ps >= 300), prog: () => `legerősebb: ${Math.round(Math.max(...S.cars.map(cc => carSpec(cc).ps)))} LE` }
];
const TOFU = { kurozawa: { pay: 12000, target: 88 }, mikazuki: { pay: 16000, target: 100 }, okami: { pay: 22000, target: 106 } };

function seeded(seed) { let r = seed * 9301 + 49297; return () => (r = (r * 9301 + 49297) % 233280) / 233280; }

const Jobs = {
  today() {
    if (!S.jobs || S.jobs.day !== S.day) {
      const rnd = seeded(S.day * 7 + 3), models = Object.keys(CARS);
      const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
      const a = Math.floor(rnd() * SVC_JOBS.length); let b = Math.floor(rnd() * SVC_JOBS.length); if (b === a) b = (a + 1) % SVC_JOBS.length;
      S.jobs = { day: S.day, done: {}, svc: [a, b].map((j, i) => ({ id: 'svc' + i, job: j, model: pick(models.filter(m => m !== 'raijin')), paint: pick(PAINTS)[0], who: pick(NEIGHBOURS) })) };
    }
    return S.jobs;
  },
  render(wrap) {
    const J = this.today(); wrap.replaceChildren();
    wrap.append(el('div', { class: 'h' }, el('h2', null, 'Munka'), el('span', { class: 'jp' }, '仕事'), el('p', null, 'A tuning pénzbe kerül. Minden munka naponta egyszer vállalható; alvás után új nap, új munkák.')));
    const g = el('div', { class: 'jobs' });
    const card = (id, kanji, title, desc, pay, done, btn, extra) => el('article', { class: 'job' + (done ? ' done' : '') },
      el('div', { class: 'job-k' }, kanji), el('div', { class: 'job-b' }, el('h3', null, title), el('p', null, desc), extra || null,
        el('div', { class: 'job-f' }, el('span', { class: 'job-pay' }, pay), done ? el('span', { class: 'tag ok' }, 'Mára kész') : btn)));
    g.append(card('gas', '給油', 'Benzinkút · Sora Oil', 'Teljes kiszolgálás, ahogy Japánban szokás. Öt vásárló: jó pisztoly, pontos mennyiség, tiszta szélvédő. A borravaló a gyorsaságon és a pontosságon múlik.', '¥ 10–16 ezer', J.done.gas,
      el('button', { class: 'btn primary small', onclick: () => GasStation.open() }, 'Műszak kezdése')));
    const tg = TOUGES.filter(t => S.rep >= t.reqRep);
    const ready = raceReadiness(car());
    g.append(card('tofu', '豆腐', 'Hajnali tofuszállítás', `A Fujimura tofubolt rendelése a hegyen át. Saját autóval, egy pohár vízzel a műszerfalon. Kiloccsan a víz: levonás. Szalagkorlát: összetört tofu.${ready ? ' ' + ready : ''}`, '¥ 12–30 ezer', J.done.tofu,
      el('div', { class: 'row' }, ...tg.map(t => el('button', { class: 'btn small primary', disabled: !!ready, onclick: () => { J.done.tofu = true; save(); Race.start(t, null, 'tofu'); } }, t.name.replace('-tōge', '').replace('-zaka', '')))), null));
    for (const sj of J.svc) {
      const job = SVC_JOBS[sj.job], p = PART[job.pid];
      const cv = el('canvas', { class: 'car-thumb', 'data-svc': sj.id });
      g.append(card(sj.id, '整備', `Szervizmunka · ${job.title}`, `${sj.who}: „${job.ask}” Hozza a saját alkatrészét, te csak szerelsz. A fizetség a munka minőségén múlik.`, `¥ ${Math.round(job.pay * 0.4 / 1000)}–${Math.round(job.pay * 1.15 / 1000)} ezer`, J.done[sj.id],
        el('button', { class: 'btn primary small', onclick: () => this.service(sj) }, 'Elvállalom'), el('div', { class: 'thumb-wrap' }, cv)));
    }
    wrap.append(g);
    // sponsors
    const sp = el('div', { class: 'panel' }, el('h3', null, 'Szponzori ajánlatok'), el('p', { class: 'muted', style: 'margin:0 0 10px' }, 'Egyszeri jutalom, ha teljesíted. A cégek figyelik a hegyet.'));
    const list = el('div', { class: 'items' });
    for (const o of SPONSORS) {
      const claimed = S.sponsors[o.id], ok = o.test();
      list.append(el('div', { class: 'item' },
        el('div', null, el('div', { class: 'b' }, o.brand), el('div', { class: 't' }, o.task)),
        el('div', { class: 'price' }, fmtY(o.pay)),
        el('div', { class: 'meta' }, el('span', { class: 'tag' + (ok ? ' ok' : '') }, o.prog()),
          claimed ? el('span', { class: 'tag ok', style: 'margin-left:auto' }, 'Kifizetve') : el('button', { class: 'btn small ' + (ok ? 'primary' : ''), style: 'margin-left:auto', disabled: !ok, onclick: () => { S.sponsors[o.id] = true; S.money += o.pay; addNews(`${o.brand} szponzori díj: ${fmtY(o.pay)}.`); toast(`${o.brand}: +${fmtY(o.pay)}`, 'good'); save(); UI.render(); } }, ok ? 'Beváltom' : 'Még nem'))));
    }
    sp.append(list); wrap.append(sp);
    requestAnimationFrame(() => {
      for (const cv of $$('canvas[data-svc]', wrap)) {
        const sj = J.svc.find(x => x.id === cv.dataset.svc); const r = cv.getBoundingClientRect(); if (!r.width) continue;
        const d = Math.min(2, devicePixelRatio || 1); cv.width = r.width * d; cv.height = r.height * d; const gg = cv.getContext('2d'); gg.scale(d, d);
        const bg = gg.createLinearGradient(0, 0, 0, r.height); bg.addColorStop(0, '#1b1f2a'); bg.addColorStop(0.72, '#262a35'); bg.addColorStop(0.73, '#34332f'); bg.addColorStop(1, '#1d1c1a'); gg.fillStyle = bg; gg.fillRect(0, 0, r.width, r.height);
        const cc = newCar(sj.model, sj.paint); drawCarSide(gg, cc, r.width / 2, r.height * 0.86, Math.min(r.width * 0.86, r.height * 2.3) * (CARS[cc.model].length / 4.6));
      }
    });
  },
  service(sj) {
    const job = SVC_JOBS[sj.job], c = newCar(sj.model, sj.paint);
    Install.start(null, null, { c, p: PART[job.pid], title: job.title, who: sj.who, onDone: (q) => {
      const J = this.today(); J.done[sj.id] = true;
      const pay = Math.round(job.pay * (0.4 + 0.6 * q) / 100) * 100, tip = q >= 0.95 ? Math.round(job.pay * 0.15 / 100) * 100 : 0;
      S.money += pay + tip; if (q >= 0.85) S.stats.svcGood = (S.stats.svcGood || 0) + 1;
      S.rep += q >= 0.9 ? 1 : 0;
      addNews(`${sj.who} elvitte a kocsit. ${q >= 0.85 ? 'Elégedett.' : q >= 0.6 ? 'Morgott valamit.' : 'Panaszkodni fog a szomszédoknak.'}`);
      toast(`${job.title}: +${fmtY(pay)}${tip ? ` és ${fmtY(tip)} borravaló` : ''}`, q >= 0.6 ? 'good' : 'bad');
      save(); UI.render();
    } });
  },
  tofuPay(R, res) {
    const cfg = TOFU[R.tg.id], cu = R.cup, lines = [];
    if (res !== 'win' || !cu) { lines.push('A tofu nem ért célba. Fujimura-san nem fizet, de holnap újra számít rád.'); return { pay: 0, lines }; }
    const water = cu.level / 0.86, broken = cu.tofu < 0.5;
    let pay = cfg.pay * (0.35 + 0.65 * Math.pow(water, 1.5));
    if (broken) pay *= 0.3;
    const fast = R.time <= cfg.target;
    if (fast) pay += cfg.pay * 0.25;
    if (water >= 0.95 && !broken) pay += cfg.pay * 0.2;
    pay = Math.round(pay / 100) * 100;
    S.stats.tofuBest = Math.max(S.stats.tofuBest || 0, broken ? 0 : water);
    lines.push(`Víz a pohárban: ${Math.round(water * 100)}%${water >= 0.95 ? ', szinte egy csepp sem ment mellé' : water < 0.6 ? ', a műszerfal csupa víz' : ''}.`);
    lines.push(broken ? 'A tofu összetört a dobozban. Csak a töredékét fizetik ki.' : cu.tofu < 0.95 ? `A tofu megsérült (${Math.round(cu.tofu * 100)}%).` : 'A tofu épen érkezett.');
    lines.push(fast ? `Időben: ${fmtTime(R.time)} (cél ${fmtTime(cfg.target)}) · gyorsasági pótlék.` : `Idő: ${fmtTime(R.time)} · a ${fmtTime(cfg.target)} alatti szállításért pótlék jár.`);
    return { pay, lines };
  }
};

// ---------------------------------------------------------------- the gas station
const FUELS = { reg: { name: 'Normál', jp: 'レギュラー', col: '#d0121e', price: 103 }, prem: { name: 'Prémium', jp: 'ハイオク', col: '#f2c21b', price: 114 }, dsl: { name: 'Dízel', jp: '軽油', col: '#2b8a3e', price: 82 } };
const GasStation = {
  open() {
    const rnd = Math.random, models = Object.keys(CARS);
    this.queue = Array.from({ length: 5 }, (_, i) => {
      const model = models[Math.floor(rnd() * models.length)], E = CARS[model].engine;
      const fuel = rnd() < 0.15 ? 'dsl' : (E.turbo || rnd() < 0.3) ? 'prem' : 'reg';
      const kind = rnd() < 0.4 ? 'full' : rnd() < 0.6 ? 'yen' : 'liter';
      const tank = Math.round(40 + rnd() * 25), have = Math.round(tank * (0.08 + rnd() * 0.25));
      const amt = kind === 'yen' ? [2000, 3000, 4000, 5000][Math.floor(rnd() * 4)] : kind === 'liter' ? [15, 20, 25, 30][Math.floor(rnd() * 4)] : 0;
      return { model, paint: PAINTS[Math.floor(rnd() * PAINTS.length)][0], fuel, kind, amt, tank, have, who: NEIGHBOURS[Math.floor(rnd() * NEIGHBOURS.length)].replace('-san', '') };
    });
    this.i = 0; this.wage = 0; this.tips = 0; this.tipCount = 0; this.log = [];
    const cv = el('canvas', { id: 'gasCv', width: 960, height: 560 });
    this.ui = el('div', { class: 'gas-ui' });
    this.cv = cv; this.ctx = cv.getContext('2d');
    UI.open([UI.head('Sora Oil · teljes kiszolgálás', 'いらっしゃいませ! · Műszak: 5 vásárló'), el('div', { class: 'gasst' }, cv, this.ui)], true);
    const pos = (e) => { const r = cv.getBoundingClientRect(), s = cv.width / r.width; return [(e.clientX - r.left) * s, (e.clientY - r.top) * s]; };
    cv.addEventListener('pointerdown', (e) => { e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (er) {} if (this.st === 'wipe') { this.wp = pos(e); } });
    cv.addEventListener('pointermove', (e) => { if (this.st === 'wipe' && this.wp) { const p2 = pos(e); this.wipe(this.wp, p2); this.wp = p2; } });
    const end = () => { this.wp = null; };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    this.next();
    let last = performance.now();
    const loop = (t) => { if ($('#modal').hidden || this.cv !== cv) return; const dt = Math.min(0.1, (t - last) / 1000); last = t; this.tick(dt); this.draw(); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  },
  next() {
    if (this.i >= this.queue.length) return this.finish();
    this.cu = this.queue[this.i]; this.car = newCar(this.cu.model, this.cu.paint);
    this.st = 'arrive'; this.t = 0; this.x = -0.6; this.lit = 0; this.nozzle = null; this.custT = 0; this.flowHold = false; this.clicked = false; this.spots = null; this.result = null;
    this.controls();
  },
  orderText(cu) {
    const f = FUELS[cu.fuel];
    if (cu.kind === 'full') return [`${f.name}, tele!`, `${f.jp}、満タンで！`];
    if (cu.kind === 'yen') return [`${f.name}, ${cu.amt} jenért.`, `${f.jp}、${cu.amt}円分`];
    return [`${f.name}, ${cu.amt} litert.`, `${f.jp}、${cu.amt}リッター`];
  },
  target(cu) { return cu.kind === 'full' ? cu.tank - cu.have : cu.kind === 'yen' ? cu.amt / FUELS[cu.fuel].price : cu.amt; },
  controls() {
    const u = this.ui; u.replaceChildren();
    const cu = this.cu, head = el('div', { class: 'gas-head' }, el('b', null, `${this.i + 1}. vásárló`), el('span', { class: 'muted' }, ` · bér eddig ${fmtY(this.wage)} · borravaló ${fmtY(this.tips)}`));
    u.append(head);
    if (this.st === 'arrive') { u.append(el('div', { class: 'muted' }, 'Érkezik egy autó…')); return; }
    if (this.st === 'order') {
      u.append(el('div', { class: 'gas-say' }, 'Melyik pisztolyt veszed le?'),
        el('div', { class: 'nozzles' }, ...Object.entries(FUELS).map(([k, f]) => el('button', { class: 'nozzle', style: `--nc:${f.col}`, onclick: () => this.pick(k) }, el('i'), el('b', null, f.jp), el('span', null, f.name)))));
      return;
    }
    if (this.st === 'fill') {
      const hold = el('button', { class: 'btn primary hold' }, 'TANKOLÁS · tartsd nyomva');
      const on = (e) => { e.preventDefault(); this.flowHold = true; hold.classList.add('on'); }, off = () => { this.flowHold = false; hold.classList.remove('on'); };
      hold.addEventListener('pointerdown', on); hold.addEventListener('pointerup', off); hold.addEventListener('pointercancel', off); hold.addEventListener('pointerleave', off);
      u.append(el('div', { class: 'gas-say' }, cu.kind === 'full' ? 'Tartsd, amíg a pisztoly magától le nem kattan.' : 'Nyomva tartva gyorsan folyik. A végén pöccintésekkel töltsd ki pontosra.'),
        el('div', { class: 'row' }, hold, cu.kind !== 'full' ? el('button', { class: 'btn', onclick: () => { this.liters += 0.12; Audio2.burst(900, 2, 0.08, 0.05); } }, '+ pöcc') : null,
          el('button', { class: 'btn ghost', onclick: () => this.doneFill() }, 'Kész')));
      return;
    }
    if (this.st === 'wipe') {
      u.append(el('div', { class: 'gas-say' }, 'Szélvédőmosás: húzd az ujjad a foltokon. A vásárló figyel.'),
        el('div', { class: 'row' }, el('button', { class: 'btn ghost', onclick: () => this.doneWipe(true) }, 'Kihagyom')));
      return;
    }
    if (this.st === 'pay') {
      const r = this.result;
      u.append(el('div', { class: 'gas-res' }, ...r.lines.map(l => el('div', null, l))),
        el('div', { class: 'row' }, el('button', { class: 'btn primary', onclick: () => { this.st = 'leave'; this.t = 0; Audio2.beep(true); this.controls(); } }, 'ありがとうございました! · Köszönjük!')));
      return;
    }
    if (this.st === 'leave') u.append(el('div', { class: 'muted' }, 'Viszlát!'));
  },
  pick(k) {
    const cu = this.cu; this.nozzle = k; Audio2.click();
    if (k !== cu.fuel) {
      this.result = { tip: 0, pay: 0, lines: [`„Állj! Ez nem ${FUELS[k].name.toLowerCase()}!” ${cu.who}-san dühösen elhajt.`, k === 'dsl' || cu.fuel === 'dsl' ? 'Dízel benzines kocsiba? A főnök levonja a béredből: −¥3 000.' : 'Ezért nem jár bér.'] };
      if (k === 'dsl' || cu.fuel === 'dsl') { this.wage -= 3000; }
      this.st = 'pay'; this.controls(); return;
    }
    this.st = 'fill'; this.liters = 0; this.controls();
  },
  doneFill() {
    const cu = this.cu, f = FUELS[cu.fuel], tgt = this.target(cu), L = this.liters;
    const yen = Math.round(L * f.price), tYen = Math.round(tgt * f.price);
    let acc;
    if (cu.kind === 'full') acc = this.clicked ? 1 : clamp(L / tgt, 0, 1) * 0.6;
    else acc = clamp(1 - Math.abs(yen - tYen) / Math.max(150, tYen * 0.06), 0, 1);
    const over = cu.kind !== 'full' && yen > tYen + 20 ? yen - tYen : 0;
    this.fill = { L, yen, tYen, acc, over };
    this.st = 'wipe'; this.spots = Array.from({ length: 9 }, () => ({ x: 170 + Math.random() * 620, y: 140 + Math.random() * 260, r: 10 + Math.random() * 16, a: 1, c: Math.random() < 0.5 ? '#2a2216' : '#6b5a2a' }));
    this.controls();
  },
  wipe(a, b) {
    if (!this.spots) return;
    for (const s of this.spots) { const d = distSeg(s.x, s.y, a[0], a[1], b[0], b[1]); if (d < s.r + 38) s.a = Math.max(0, s.a - 0.12); }
    if (this.spots.every(s => s.a <= 0.05)) this.doneWipe(false);
  },
  doneWipe(skipped) {
    const cu = this.cu, fl = this.fill, lines = [];
    const clean = this.spots ? this.spots.filter(s => s.a <= 0.05).length / this.spots.length : 0;
    let tip = 0;
    const fuelLine = cu.kind === 'full' ? (this.clicked ? `Tele: ${fl.L.toFixed(1)} liter, ${fmtY(fl.yen)}.` : `Nem lett tele (${fl.L.toFixed(1)} l). „Azt mondtam, tele!”`) : `${fl.L.toFixed(2)} liter, ${fmtY(fl.yen)} (kért: ${fmtY(fl.tYen)}).`;
    lines.push(fuelLine);
    if (fl.acc >= 0.9) tip += 300; else if (fl.acc >= 0.6) tip += 120;
    if (fl.over) { lines.push(`Túltöltötted, a különbözetet (${fmtY(fl.over)}) neked kell kifizetni.`); this.wage -= fl.over; }
    if (!skipped && clean >= 0.99) { tip += 250; lines.push('Ragyog a szélvédő.'); } else if (skipped) lines.push('Szélvédő kimaradt.');
    if (this.custT > 45) { tip = Math.round(tip / 2); lines.push('Sokáig tartott, a vásárló az óráját nézte.'); }
    tip = Math.round(tip / 10) * 10;
    if (tip >= 400) tip += 200;
    const pay = 2000;
    this.wage += pay; this.tips += tip; if (tip > 0) this.tipCount++;
    lines.push(tip ? `Borravaló: ${fmtY(tip)} · „${tip >= 500 ? 'Ilyen kiszolgálás már nincs sehol!' : 'Köszönöm.'}”` : 'Borravaló nem volt.');
    this.result = { pay, tip, lines };
    this.st = 'pay'; this.controls();
  },
  finish() {
    const total = Math.max(0, this.wage + this.tips);
    S.money += total; Jobs.today().done.gas = true;
    S.stats.gasBestTips = Math.max(S.stats.gasBestTips || 0, this.tipCount);
    if (this.tipCount >= 5) S.stats.gasPerfect = true;
    addNews(`Műszak a Sora Oilnál: ${fmtY(total)}, ebből ${fmtY(this.tips)} borravaló.`);
    save();
    this.ui.replaceChildren(el('div', { class: 'gas-res' }, el('div', { class: 'inst-q' }, fmtY(total)), el('div', null, `Bér: ${fmtY(this.wage)} · Borravaló: ${fmtY(this.tips)} (${this.tipCount}/5 vásárló)`)),
      el('div', { class: 'row' }, el('button', { class: 'btn primary', onclick: () => { UI.close(); UI.render(); } }, 'Műszak vége')));
    this.st = 'end';
  },
  tick(dt) {
    this.t += dt; if (this.st !== 'arrive' && this.st !== 'leave' && this.st !== 'end' && this.st !== 'pay') this.custT += dt;
    if (this.st === 'arrive') { this.x = Math.min(0, -0.6 + this.t / 1.4 * 0.6); if (this.t >= 1.4) { this.st = 'order'; this.controls(); Audio2.beep(false); } }
    if (this.st === 'leave') { this.x = this.t / 1.2 * 0.8; if (this.t >= 1.2) { this.i++; this.next(); } }
    if (this.st === 'fill' && this.flowHold) {
      const room = this.cu.tank - this.cu.have - this.liters;
      if (room <= 0) { if (!this.clicked) { this.clicked = true; this.flowHold = false; Audio2.clunk(); if (this.cu.kind === 'full') setTimeout(() => this.st === 'fill' && this.doneFill(), 500); } }
      else { this.liters = Math.min(this.cu.tank - this.cu.have, this.liters + dt * 4.2); if (Math.random() < 0.3) Audio2.burst(700 + Math.random() * 300, 1.5, 0.05, 0.02); }
    }
  },
  draw() {
    const g = this.ctx, W = 960, H = 560; if (!g || this.st === 'end' && !this.cu) return;
    if (this.st === 'wipe') return this.drawWipe(g, W, H);
    const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#0a0d1a'); sky.addColorStop(0.55, '#1a1d2e'); sky.addColorStop(0.56, '#3a3a40'); sky.addColorStop(1, '#202024');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    // canopy
    g.fillStyle = '#f1efe8'; g.fillRect(0, 0, W, 70); g.fillStyle = '#1d4fa3'; g.fillRect(0, 70, W, 14); g.fillStyle = '#d0121e'; g.fillRect(0, 84, W, 6);
    g.fillStyle = '#1d4fa3'; g.font = `800 italic 44px ${cssVar('--f-disp')}`; g.textAlign = 'left'; g.fillText('SORA OIL', 30, 52); g.font = `26px ${cssVar('--f-jp')}`; g.fillText('空石油', 250, 50);
    g.fillStyle = '#d0121e'; g.font = `800 26px ${cssVar('--f-disp')}`; g.textAlign = 'right'; g.fillText('FULL SERVICE · フルサービス', W - 30, 48);
    for (let x = 80; x < W; x += 220) { const lg = g.createRadialGradient(x, 95, 2, x, 95, 260); lg.addColorStop(0, 'rgba(255,250,235,0.35)'); lg.addColorStop(1, 'rgba(255,250,235,0)'); g.fillStyle = lg; g.fillRect(x - 260, 90, 520, 400); g.fillStyle = '#fffbea'; g.fillRect(x - 50, 88, 100, 6); }
    // price board
    g.fillStyle = '#111'; g.fillRect(24, 110, 220, 150); g.font = `22px ${cssVar('--f-jp')}`; g.textAlign = 'left';
    Object.values(FUELS).forEach((f, i) => { g.fillStyle = f.col; g.fillRect(34, 122 + i * 46, 10, 32); g.fillStyle = '#eee'; g.font = `22px ${cssVar('--f-jp')}`; g.fillText(f.jp, 50, 146 + i * 46); g.fillStyle = '#ffb000'; g.font = `32px ${cssVar('--f-crt')}`; g.textAlign = 'right'; g.fillText(String(f.price), 234, 148 + i * 46); g.textAlign = 'left'; });
    // overhead hoses
    const hx = 300;
    Object.values(FUELS).forEach((f, i) => { const x = hx - 60 + i * 60; g.strokeStyle = '#2a2b30'; g.lineWidth = 8; g.beginPath(); g.moveTo(x, 90); g.quadraticCurveTo(x + 10, 200, x, this.nozzle && FUELS[this.nozzle] === f && (this.st === 'fill') ? 250 : 190); g.stroke(); g.fillStyle = f.col; g.fillRect(x - 12, this.nozzle && FUELS[this.nozzle] === f && this.st === 'fill' ? 250 : 190, 24, 40); });
    // island + pump display
    g.fillStyle = '#c9c4b6'; g.fillRect(150, H * 0.56 + 40, 300, 16);
    g.fillStyle = '#1c1d22'; g.fillRect(180, 280, 240, 130); g.fillStyle = '#0d0f0c'; g.fillRect(192, 292, 216, 106);
    const L = this.st === 'fill' || this.fill ? (this.liters || 0) : 0, f = FUELS[this.nozzle || this.cu.fuel];
    g.fillStyle = '#ff5a2a'; g.font = `44px ${cssVar('--f-crt')}`; g.textAlign = 'right'; g.fillText(L.toFixed(2) + ' L', 396, 336); g.fillStyle = '#ffd34d'; g.fillText('¥' + Math.round(L * f.price), 396, 384);
    if (this.cu.kind !== 'full' && (this.st === 'fill')) { g.fillStyle = '#9a968c'; g.font = `600 18px ${cssVar('--f-body')}`; g.textAlign = 'left'; g.fillText(this.cu.kind === 'yen' ? `cél: ¥${this.cu.amt}` : `cél: ${this.cu.amt}.00 L`, 196, 424); }
    // car
    const carX = W * 0.66 + this.x * W;
    drawCarSide(g, this.car, carX, H * 0.88, 480 * CARS[this.cu.model].length / 4.6);
    if (this.st === 'fill' && this.flowHold) { g.strokeStyle = 'rgba(200,180,120,0.6)'; g.lineWidth = 3; g.setLineDash([6, 6]); g.beginPath(); g.moveTo(hx - 60 + Object.keys(FUELS).indexOf(this.nozzle) * 60, 290); g.lineTo(carX - 170, H * 0.66); g.stroke(); g.setLineDash([]); }
    // speech bubble
    if (this.st === 'order' || this.st === 'fill') {
      const [hu, jp] = this.orderText(this.cu), bx = Math.min(W - 345, carX - 40), by = 112;
      g.fillStyle = '#f7f3ea'; g.beginPath(); g.roundRect ? g.roundRect(bx, by, 330, 92, 14) : g.rect(bx, by, 330, 92); g.fill();
      g.beginPath(); g.moveTo(bx + 40, by + 92); g.lineTo(bx + 30, by + 128); g.lineTo(bx + 80, by + 92); g.fill();
      g.fillStyle = '#c3121f'; g.font = `22px ${cssVar('--f-jp')}`; g.textAlign = 'left'; g.fillText(jp, bx + 18, by + 36);
      g.fillStyle = '#17140f'; g.font = `700 26px ${cssVar('--f-body')}`; g.fillText(hu, bx + 18, by + 72);
    }
    // patience
    if (this.st !== 'arrive' && this.st !== 'leave') { const p = clamp(1 - this.custT / 60, 0, 1); g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(30, H - 34, 200, 12); g.fillStyle = p > 0.4 ? '#8fe36b' : '#ffa733'; g.fillRect(30, H - 34, 200 * p, 12); g.fillStyle = '#ddd'; g.font = `600 16px ${cssVar('--f-body')}`; g.textAlign = 'left'; g.fillText('Türelem', 30, H - 42); }
  },
  drawWipe(g, W, H) {
    g.fillStyle = shade(this.car.paint, -0.2); g.fillRect(0, 0, W, H);
    const gl = g.createLinearGradient(0, 80, 0, H - 60); gl.addColorStop(0, '#5a7096'); gl.addColorStop(1, '#1d2638');
    g.fillStyle = gl; g.beginPath(); g.moveTo(140, 90); g.lineTo(W - 140, 90); g.lineTo(W - 70, H - 70); g.lineTo(70, H - 70); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.moveTo(260, 100); g.lineTo(340, 100); g.lineTo(220, H - 80); g.lineTo(140, H - 80); g.fill();
    for (const s of this.spots) { if (s.a <= 0.02) continue; g.fillStyle = hexA(s.c, 0.85 * s.a); g.beginPath(); g.arc(s.x, s.y, s.r, 0, 7); g.fill(); g.fillStyle = hexA('#d8c88a', 0.6 * s.a); g.beginPath(); g.arc(s.x + s.r * 0.6, s.y - s.r * 0.3, s.r * 0.4, 0, 7); g.fill(); }
    if (this.wp) { g.save(); g.translate(this.wp[0], this.wp[1]); g.fillStyle = '#ffd400'; g.fillRect(-70, -12, 140, 24); g.fillStyle = '#1b1c20'; g.fillRect(-70, 8, 140, 6); g.restore(); }
    const left = this.spots.filter(s => s.a > 0.05).length;
    g.fillStyle = '#fff'; g.font = `700 24px ${cssVar('--f-body')}`; g.textAlign = 'left'; g.fillText(`Foltok: ${left}`, 30, 40);
    if (!this.wp && left) { const s = this.spots.find(x => x.a > 0.05); tapHint(g, s.x, s.y, performance.now() / 1000, ''); }
  }
};
function distSeg(px, py, ax, ay, bx, by) { const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy || 1, t = clamp(((px - ax) * dx + (py - ay) * dy) / l, 0, 1); return Math.hypot(px - ax - t * dx, py - ay - t * dy); }
