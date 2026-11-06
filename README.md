# Yoru Tōge 夜峠

Böngészős autós játék a 90-es évek japán touge-világából. Saját garázs, alkatrészrendelés,
saját kezű szerelés és tuning, dyno, éjszakai versenyek a hegyen, rendőrök, gyülekező és munkák.
Telefonra készült (fekvő módban a verseny), de asztali böngészőben is fut.

## Hogyan kerül ki a netre

A Netlify minden `main` ágra érkező feltöltés után magától lefuttatja a `bash build.sh netlify`
parancsot, és kiteszi a `dist/` mappát. A `dist/` nincs a repóban, mindig a forrásból épül.

A Netlify-os változat telepíthető alkalmazás is: Chrome-ban a menüben válaszd a
**Hozzáadás a kezdőképernyőhöz** vagy **Alkalmazás telepítése** lehetőséget. Így teljes képernyőn
indul, és egyszeri megnyitás után internet nélkül is működik.

## Fájlok

| Hely | Mi van benne |
| --- | --- |
| `src/` | A játék forráskódja (JavaScript, CSS, HTML-darabok) |
| `web/` | Csak a Netlify-os változathoz: alkalmazás-manifest, service worker, ikonok |
| `vendor/three.min.js` | A 3D-motor (three.js r128) |
| `build.sh` | Összerakja a játékot egy oldallá |
| `netlify.toml` | Megmondja a Netlify-nak, mit építsen és mit tegyen ki |

## Saját gépen

```bash
bash build.sh offline     # yoru-toge-offline.html, internet nélkül is fut (a vendor mappa kell mellé)
bash build.sh standalone  # yoru-toge.html, egyetlen fájl, a three.js-t netről tölti
bash build.sh netlify     # dist/, pontosan az, ami a Netlify-ra kerül
```

## Mentések

Minden változat a saját helyére ment: a Claude-ban futó játék a Claude-os fiókodba,
a Netlify-os és a helyi fájl a böngésző tárolójába. A Beállítások → **Mentés átvitele**
résznél kóddal vagy fájllal átviheted az állást egyikből a másikba.
