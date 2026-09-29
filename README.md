# Járőrvizsga gyakorló

Telepítés nélkül, böngészőből használható gyakorló oldal a járőrvizsga elméleti részéhez:
**Térképészet, Rádiózás, Elsősegély, Fegyverismeret, ABV-védelem, Alaki ismeretek**.

- Gyakorló mód: minden válasz után azonnali visszajelzés, magyarázat és tankönyvi oldalszám.
- Három szint: **Kezdő** (csak alapkérdések, 3 válaszlehetőség), **Középhaladó** (alap + közepes, 4 lehetőség), **Haladó** (minden kérdés).
- A kör végén „Hibásak újra” – addig ismételhető, amíg minden jó nem lesz.
- Offline is működik (első megnyitás után), és kitehető a telefon kezdőképernyőjére.
- Nincs regisztráció, nincs szerver, nem gyűjt adatot (csak a legutóbbi eredményt tárolja a saját telefonon).

Forrás: *Honvédelmi ismeretek tankönyv*. A kérdések saját megfogalmazásúak, oldalhivatkozással.

## Közzététel (GitHub Pages)

1. GitHub Desktop → *Add local repository* → `~/JarorVizsga` → *Publish repository*
   (a „Keep this code private” jelölést vedd ki – a Pages ingyenes fióknál csak nyilvános repóval működik).
2. github.com → a repó → *Settings* → *Pages* → *Source: Deploy from a branch* → `main` / `/ (root)` → *Save*.
3. Pár perc múlva elérhető: **https://kelekaroly.github.io/JarorVizsga/**
4. A `qr.png` erre a címre mutat – kinyomtatható vagy elküldhető a szakasznak.

## Frissítés

1. Kérdés javítása/bővítése a `data/*.js` fájlokban (minden kérdésnél az `o` tömb **első** eleme a helyes válasz; a program keveri a sorrendet).
   Minden kérdésnek legyen szintje: `n: 1` alap, `n: 2` közepes, `n: 3` nehéz. Ha egy kérdés rossz szinten van, elég az `n` értékét átírni.
2. `node scripts/check-data.mjs` – ellenőrzi a kérdésbankot.
3. `sw.js`-ben növeld a `VERZIO` értékét (pl. `jv-v3` → `jv-v4`), hogy a telefonok frissítsenek.
4. Commit + push GitHub Desktopból – pár perc múlva élesben van.

## Helyi futtatás

```bash
python3 -m http.server 8090
```

Utána: http://localhost:8090
