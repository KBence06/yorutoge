// ===================== BOOT =====================
function boot(hotData) {
  if (hotData && hotData.S) S = sanitize(hotData.S);
  else { const local = Save.loadLocal(); if (local) S = sanitize(local); }
  UI.init(); Garage.init(); UI.show('garage');
  Save.connect((remote) => { S = sanitize(remote); Save.writeLocal(); UI.render(); toast('Mentés betöltve.'); });
  if (window.claude && window.claude.hot && window.claude.hot.snapshot) window.claude.hot.snapshot(() => ({ S }));
  document.addEventListener('visibilitychange', () => { if (document.hidden) { Save.writeLocal(); Save.flush(); } });
}
if (window.claude && window.claude.hot && window.claude.hot.ready) window.claude.hot.ready(boot);
else boot(window.claude && window.claude.hot && window.claude.hot.data || null);

// the radio starts with the first tap anywhere (browsers do not allow sound before that)
addEventListener('pointerdown', () => Audio2.init(), { passive: true });
