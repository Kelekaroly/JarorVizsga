// Járőrvizsga gyakorló – gyakorló mód.
// A kérdések a data/*.js fájlokból érkeznek a window.KERDESEK tömbbe; minden kérdésnél o[0] a helyes válasz.
(function () {
  'use strict';

  var TEMAK = [
    { id: 'terkep', nev: 'Térképészet', ikon: '🧭' },
    { id: 'radio', nev: 'Rádiózás', ikon: '📻' },
    { id: 'elsosegely', nev: 'Elsősegély', ikon: '⛑️' },
    { id: 'fegyver', nev: 'Fegyverismeret', ikon: '🎯' },
    { id: 'abv', nev: 'ABV-védelem', ikon: '☢️' },
    { id: 'alaki', nev: 'Alaki ismeretek', ikon: '🎖️' },
    { id: 'hadijog', nev: 'Hadijog', ikon: '⚖️' },
  ];
  var VEGYES = { id: 'vegyes', nev: 'Vegyes (mind a 7 téma)', ikon: '🔀' };
  // Kezdőn csak az alap (n: 1) kérdések jönnek, és egy rossz válasz kimarad; Haladón minden kérdés.
  var SZINTEK = [
    { id: 1, nev: 'Kezdő', opciok: 3 },
    { id: 2, nev: 'Középhaladó', opciok: 4 },
    { id: 3, nev: 'Haladó', opciok: 4 },
  ];
  var BETUK = ['A', 'B', 'C', 'D'];

  var kerdesek = (window.KERDESEK || []).map(function (k, i) {
    return { id: k.t + '-' + i, t: k.t, n: k.n || 2, q: k.q, o: k.o, m: k.m, p: k.p };
  });

  var $app = document.getElementById('app');
  var $title = document.getElementById('title');
  var $counter = document.getElementById('counter');
  var $home = document.getElementById('btn-home');
  var $progress = document.getElementById('progress');
  var $bar = document.getElementById('progress-bar');

  // --- Tárolás (csak kényelmi célra; hiba esetén csendben kihagyjuk) ---
  function tarolt(kulcs, alap) {
    try { var v = localStorage.getItem('jv.' + kulcs); return v === null ? alap : JSON.parse(v); } catch (e) { return alap; }
  }
  function tarol(kulcs, ertek) {
    try { localStorage.setItem('jv.' + kulcs, JSON.stringify(ertek)); } catch (e) { /* nincs tárhely */ }
  }

  // --- Segédfüggvények ---
  function kever(tomb) {
    var a = tomb.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var x = a[i]; a[i] = a[j]; a[j] = x;
    }
    return a;
  }
  function el(tag, attrs, gyerekek) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    });
    (gyerekek || []).forEach(function (g) { if (g) e.appendChild(typeof g === 'string' ? document.createTextNode(g) : g); });
    return e;
  }
  // A null/üres elemeket kihagyja (a replaceChildren különben „null” szöveget írna ki).
  function megjelenit() {
    var elemek = Array.prototype.filter.call(arguments, Boolean);
    $app.replaceChildren.apply($app, elemek);
  }
  function tema(id) { return id === VEGYES.id ? VEGYES : TEMAK.filter(function (t) { return t.id === id; })[0]; }
  // Érvénytelen tárolt érték esetén Középhaladó.
  function aktSzint() {
    var id = tarolt('szint', 2);
    return SZINTEK.filter(function (s) { return s.id === id; })[0] || SZINTEK[1];
  }
  function temaKerdesei(id, szint) {
    return kerdesek.filter(function (k) { return (id === VEGYES.id || k.t === id) && k.n <= szint.id; });
  }
  function fejlec(cim, szamlalo, vissza) {
    $title.textContent = cim;
    $counter.textContent = szamlalo || '';
    $home.hidden = !vissza;
  }
  function haladas(arany) {
    $progress.hidden = arany === null;
    $bar.style.width = arany === null ? '0' : Math.round(arany * 100) + '%';
  }

  // --- Állapot ---
  var kor = null; // { temaId, lista, index, jo, hibak: [{k, valasz}] }

  // --- Főoldal ---
  function fooldal() {
    kor = null;
    fejlec('Járőrvizsga gyakorló', '', false);
    haladas(null);
    var hossz = tarolt('hossz', 20);
    var szint = aktSzint();

    var kartya = function (t, extraClass) {
      var db = temaKerdesei(t.id, szint).length;
      var utolso = tarolt('utolso.' + szint.id + '.' + t.id, null);
      return el('button', { class: 'card' + (extraClass || ''), onclick: function () { indit(t.id); } }, [
        el('span', { class: 'ico', 'aria-hidden': 'true', text: t.ikon }),
        el('span', { class: 'body' }, [
          el('div', { class: 'name', text: t.nev }),
          el('div', { class: 'meta', text: db + ' kérdés' }),
        ]),
        utolso ? el('span', { class: 'last', title: 'Legutóbbi eredmény', text: utolso.jo + '/' + utolso.ossz }) : null,
      ]);
    };

    var chipek = [10, 20, 0].map(function (n) {
      return el('button', {
        class: 'chip', 'aria-pressed': String(hossz === n),
        onclick: function () { tarol('hossz', n); fooldal(); },
        text: n === 0 ? 'Mind' : String(n),
      });
    });

    var szintChipek = SZINTEK.map(function (s) {
      return el('button', {
        class: 'chip', 'aria-pressed': String(szint.id === s.id),
        onclick: function () { tarol('szint', s.id); fooldal(); },
        text: s.nev,
      });
    });

    megjelenit(
      el('p', { class: 'intro', text: 'Válassz szintet és témát! Minden válasz után azonnal látod a helyes megoldást és a magyarázatot, a kör végén pedig újra gyakorolhatod a hibásakat.' }),
      el('div', { class: 'length level' }, [el('span', { text: 'Szint:' })].concat(szintChipek)),
      el('p', { class: 'level-hint', text: szint.id === 1 ? 'Alapkérdések, 3 válaszlehetőséggel.' : szint.id === 2 ? 'Alap és közepes kérdések, 4 válaszlehetőséggel.' : 'Minden kérdés, a nehéz részletekkel együtt.' }),
      el('div', { class: 'cards' }, TEMAK.map(function (t) { return kartya(t); }).concat([kartya(VEGYES, ' mixed')])),
      el('div', { class: 'length' }, [el('span', { text: 'Kérdések egy körben:' })].concat(chipek)),
      el('p', { class: 'foot', text: 'Forrás: Honvédelmi ismeretek tankönyv – a kérdések saját megfogalmazásúak, oldalhivatkozással. Összesen ' + kerdesek.length + ' kérdés. Az oldal offline is működik.' })
    );
    window.scrollTo(0, 0);
  }

  // --- Kör indítása ---
  function indit(temaId, lista, szint) {
    szint = szint || aktSzint();
    var hossz = tarolt('hossz', 20);
    var kevert = lista ? kever(lista) : kever(temaKerdesei(temaId, szint));
    if (!lista && hossz > 0) kevert = kevert.slice(0, hossz);
    kor = { temaId: temaId, szint: szint, lista: kevert, index: 0, jo: 0, hibak: [], ismetles: !!lista };
    if (location.hash !== '#gyakorlas') history.pushState({ gyakorlas: true }, '', '#gyakorlas');
    kerdes();
  }

  // --- Egy kérdés ---
  function kerdes() {
    var k = kor.lista[kor.index];
    var t = tema(kor.temaId);
    fejlec(t.nev + (kor.ismetles ? ' – hibásak' : ''), kor.szint.nev + ' · ' + (kor.index + 1) + ' / ' + kor.lista.length, true);
    haladas(kor.index / kor.lista.length);

    // A helyes válasz mindig bekerül; a rosszakból annyi, amennyit a szint enged.
    var rosszak = kever(k.o.slice(1)).slice(0, kor.szint.opciok - 1);
    var sorrend = kever([{ szoveg: k.o[0], helyes: true }].concat(rosszak.map(function (szoveg) { return { szoveg: szoveg, helyes: false }; })));
    var gombok = [];
    var visszajelzes = el('div');
    var tovabb = el('div', { class: 'actions' });

    function valaszt(i) {
      var jo = sorrend[i].helyes;
      gombok.forEach(function (g, j) {
        g.disabled = true;
        if (sorrend[j].helyes) g.classList.add('correct');
        else if (j === i) g.classList.add('wrong');
        else g.classList.add('dim');
      });
      if (jo) kor.jo++;
      else kor.hibak.push({ k: k, valasz: sorrend[i].szoveg });

      visszajelzes.replaceChildren(el('div', { class: 'feedback ' + (jo ? 'good' : 'bad'), role: 'status' }, [
        el('p', { class: 'verdict', text: jo ? '✓ Helyes!' : '✗ Nem jó. Helyes válasz: ' + k.o[0] }),
        el('p', { text: k.m }),
        el('p', { class: 'src', text: 'Tankönyv, ' + k.p + '. oldal' }),
      ]));
      var utolso = kor.index === kor.lista.length - 1;
      var gomb = el('button', { class: 'btn', text: utolso ? 'Eredmény' : 'Következő kérdés →', onclick: kovetkezo });
      tovabb.replaceChildren(gomb);
      gomb.focus({ preventScroll: true });
      visszajelzes.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    sorrend.forEach(function (v, i) {
      gombok.push(el('button', { class: 'opt', onclick: function () { valaszt(i); } }, [
        el('span', { class: 'key', 'aria-hidden': 'true', text: BETUK[i] }),
        el('span', { text: v.szoveg }),
      ]));
    });

    megjelenit(
      kor.temaId === VEGYES.id ? el('p', { class: 'topic-tag', text: tema(k.t).ikon + ' ' + tema(k.t).nev }) : null,
      el('h2', { class: 'question', text: k.q }),
      el('div', { class: 'options' }, gombok),
      visszajelzes,
      tovabb
    );
    window.scrollTo(0, 0);
  }

  function kovetkezo() {
    kor.index++;
    if (kor.index < kor.lista.length) kerdes();
    else eredmeny();
  }

  // --- Eredmény ---
  function eredmeny() {
    var ossz = kor.lista.length;
    var szazalek = Math.round(kor.jo / ossz * 100);
    if (!kor.ismetles) tarol('utolso.' + kor.szint.id + '.' + kor.temaId, { jo: kor.jo, ossz: ossz });
    fejlec(tema(kor.temaId).nev + ' – eredmény', kor.szint.nev, true);
    haladas(1);

    var uzenet = szazalek === 100 ? 'Hibátlan! 💪' : szazalek >= 80 ? 'Szép munka, már majdnem minden megy.' : szazalek >= 60 ? 'Jó alap – gyakorold a hibásakat!' : 'Érdemes újra átvenni ezt a témát.';
    var temaId = kor.temaId;
    var szint = kor.szint;
    var hibak = kor.hibak;

    var gombok = [];
    if (hibak.length) gombok.push(el('button', { class: 'btn', text: 'Hibásak újra (' + hibak.length + ')', onclick: function () { indit(temaId, hibak.map(function (h) { return h.k; }), szint); } }));
    gombok.push(el('button', { class: hibak.length ? 'btn secondary' : 'btn', text: 'Új kör ebből a témából', onclick: function () { indit(temaId, null, szint); } }));
    gombok.push(el('button', { class: 'btn secondary', text: 'Főoldal', onclick: haza }));

    megjelenit(
      el('div', { class: 'score' }, [
        el('div', { class: 'big', text: kor.jo + ' / ' + ossz }),
        el('div', { class: 'sub', text: szazalek + '% · ' + uzenet }),
      ]),
      el('div', { class: 'actions' }, gombok),
      hibak.length ? el('div', { class: 'review' }, [
        el('h2', { text: 'Ezeket rontottad el' }),
        el('ol', null, hibak.map(function (h) {
          return el('li', null, [
            el('div', { class: 'q', text: h.k.q }),
            el('div', { class: 'a', text: '✓ ' + h.k.o[0] }),
            el('div', { class: 'your', text: 'A te válaszod: ' + h.valasz + ' · ' + h.k.p + '. o.' }),
          ]);
        })),
      ]) : null
    );
    window.scrollTo(0, 0);
  }

  // --- Navigáció (a telefon „vissza” gombja a főoldalra visz) ---
  function haza() {
    if (location.hash === '#gyakorlas') history.back();
    else fooldal();
  }
  $home.addEventListener('click', haza);
  window.addEventListener('popstate', function () { if (location.hash !== '#gyakorlas') fooldal(); });

  if (location.hash === '#gyakorlas') history.replaceState(null, '', location.pathname);
  fooldal();

  // --- Offline mód ---
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})();
