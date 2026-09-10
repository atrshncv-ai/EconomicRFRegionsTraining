/* Геотренажёр экономических районов РФ — приложение.
 * Режимы: study (изучение), subject-district, district-subjects, errors, result.
 * Прогресс — localStorage, без него игра работает в памяти.
 */
(function () {
  'use strict';
  var DATA = window.GEO_DATA;
  var QUIZ = window.GEO_QUIZ;
  var SOUND = window.GEO_SOUND || null;
  var DISTRICTS = DATA.DISTRICTS;
  var SUBJECTS = DATA.SUBJECTS;
  var FO_GROUPS = DATA.FO_GROUPS || [];
  var FO_OF = DATA.FO_OF || {};
  var bySvg = {}, byDistrict = {};
  SUBJECTS.forEach(function (s) {
    bySvg[s.svgId] = s;
    (byDistrict[s.district] = byDistrict[s.district] || []).push(s);
  });
  var byFo = {};
  SUBJECTS.forEach(function (s) {
    var f = FO_OF[s.svgId];
    if (f) (byFo[f] = byFo[f] || []).push(s);
  });
  // Активный набор: 'eco' (12 районов) или 'fo' (8 округов).
  var dataset = 'eco';
  function curGroups() { return dataset === 'fo' ? FO_GROUPS : DISTRICTS; }
  function groupOf(svgId) {
    if (dataset === 'fo') return FO_OF[svgId];
    return bySvg[svgId] ? bySvg[svgId].district : undefined;
  }
  function membersOf(groupId) {
    var arr = dataset === 'fo' ? (byFo[groupId] || []) : (byDistrict[groupId] || []);
    return arr.map(function (s) { return s.svgId; });
  }
  function memberSubjects(groupId) {
    return dataset === 'fo' ? (byFo[groupId] || []) : (byDistrict[groupId] || []);
  }
  // Представление субъектов под активный набор: поле district = id группы
  // активного набора, чтобы обобщённое ядро quiz работало без изменений.
  function activeSubjects() {
    if (dataset === 'eco') return SUBJECTS;
    return SUBJECTS.map(function (s) {
      return { svgId: s.svgId, name: s.name, district: FO_OF[s.svgId], schematic: s.schematic };
    });
  }
  function groupById(id) {
    var gs = curGroups();
    for (var i = 0; i < gs.length; i++) if (gs[i].id === id) return gs[i];
    return null;
  }
  function districtName(id) {
    var g = groupById(id);
    if (g) return g.name;
    for (var i = 0; i < DISTRICTS.length; i++) if (DISTRICTS[i].id === id) return DISTRICTS[i].name;
    for (var j = 0; j < FO_GROUPS.length; j++) if (FO_GROUPS[j].id === id) return FO_GROUPS[j].name;
    return id;
  }
  function districtColor(id) {
    var g = groupById(id);
    if (g) return g.color;
    for (var i = 0; i < DISTRICTS.length; i++) if (DISTRICTS[i].id === id) return DISTRICTS[i].color;
    for (var j = 0; j < FO_GROUPS.length; j++) if (FO_GROUPS[j].id === id) return FO_GROUPS[j].color;
    return '#ccc';
  }
  // Разбивка счёта ФО по типам — выводится из названий субъектов.
  function typeOf(name) {
    if (name.indexOf('область') !== -1) return 'obl';
    if (name.indexOf('край') !== -1) return 'krai';
    if (/республик/i.test(name)) return 'rep';
    if (name.indexOf('округ') !== -1) return 'okr';
    return 'city';
  }
  function plural(n, one, few, many) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  }
  function breakdownFor(ds, groupId) {
    var arr = ds === 'fo' ? (byFo[groupId] || []) : (byDistrict[groupId] || []);
    var c = { obl: 0, krai: 0, rep: 0, okr: 0, city: 0 };
    arr.forEach(function (s) { c[typeOf(s.name)]++; });
    var parts = [];
    if (c.obl) parts.push(c.obl + ' ' + plural(c.obl, 'область', 'области', 'областей'));
    if (c.krai) parts.push(c.krai + ' ' + plural(c.krai, 'край', 'края', 'краёв'));
    if (c.rep) parts.push(c.rep + ' ' + plural(c.rep, 'республика', 'республики', 'республик'));
    if (c.okr) parts.push(c.okr + ' ' + plural(c.okr, 'округ', 'округа', 'округов'));
    if (c.city) parts.push(c.city + ' ' + plural(c.city, 'город', 'города', 'городов'));
    if (!parts.length) return arr.length + '';
    if (parts.length === 1) return arr.length + ': ' + parts[0];
    return arr.length + ': ' + parts.slice(0, -1).join(', ') + ' и ' + parts[parts.length - 1];
  }
  function breakdownText(groupId) { return breakdownFor(dataset, groupId); }
  function centerText(g) {
    if (!g || !g.center) return '';
    return g.centerNote ? g.center + ' (' + g.centerNote + ')' : g.center;
  }

  var STORE_KEY = 'geo-trainer-v1';
  var store = { dataset: 'eco', ok: { eco: {}, fo: {} }, asked: { eco: {}, fo: {} }, errors: [], history: [], sound: true };
  var storageOK = true;
  function ensureNs() {
    if (!store.ok || typeof store.ok !== 'object') store.ok = { eco: {}, fo: {} };
    if (!store.asked || typeof store.asked !== 'object') store.asked = { eco: {}, fo: {} };
    // Миграция плоского хранилища экон. набора: {ok:{central:..}} → {ok:{eco:{..},fo:{}}}.
    if (store.ok.eco === undefined && store.ok.fo === undefined) {
      store.ok = { eco: store.ok, fo: {} };
    }
    if (store.asked.eco === undefined && store.asked.fo === undefined) {
      store.asked = { eco: store.asked, fo: {} };
    }
    if (!store.ok.eco || typeof store.ok.eco !== 'object') store.ok.eco = {};
    if (!store.ok.fo || typeof store.ok.fo !== 'object') store.ok.fo = {};
    if (!store.asked.eco || typeof store.asked.eco !== 'object') store.asked.eco = {};
    if (!store.asked.fo || typeof store.asked.fo !== 'object') store.asked.fo = {};
    if (!Array.isArray(store.errors)) store.errors = [];
    if (!Array.isArray(store.history)) store.history = [];
    store.errors.forEach(function (e) { if (e && !e.ds) e.ds = 'eco'; });
    store.history.forEach(function (h) { if (h && !h.ds) h.ds = 'eco'; });
    if (store.dataset !== 'eco' && store.dataset !== 'fo') store.dataset = 'eco';
  }
  function loadStore() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) store = JSON.parse(raw);
      if (store.sound === undefined) store.sound = true;
      if (!store.history) store.history = [];
      if (!store.ok) store.ok = { eco: {}, fo: {} };
      if (!store.asked) store.asked = { eco: {}, fo: {} };
      if (!store.errors) store.errors = [];
      ensureNs();
      dataset = store.dataset;
    } catch (e) { storageOK = false; ensureNs(); }
  }
  function saveStore() {
    if (!storageOK) return;
    try { store.dataset = dataset; localStorage.setItem(STORE_KEY, JSON.stringify(store)); }
    catch (e) { storageOK = false; }
  }
  function askedSlice() { return store.asked[dataset] || {}; }
  function okSlice() { return store.ok[dataset] || {}; }
  function errorsOf() { return store.errors.filter(function (e) { return (e.ds || 'eco') === dataset; }); }
  function historyOf() { return store.history.filter(function (h) { return (h.ds || 'eco') === dataset; }); }
  function recordResult(districtId, ok) {
    var A = store.asked[dataset] || (store.asked[dataset] = {});
    var O = store.ok[dataset] || (store.ok[dataset] = {});
    A[districtId] = (A[districtId] || 0) + 1;
    if (ok) O[districtId] = (O[districtId] || 0) + 1;
    saveStore();
  }
  function pushError(err) { err = err || {}; err.ds = dataset; store.errors.push(err); saveStore(); }

  // История игр (R01.3): последние 20 на набор (дата, счёт, всего из 2×N).
  function pushHistory(game) {
    game = game || {}; game.ds = dataset;
    // Кап 20 — на активный набор, чтобы один набор не вытеснял другой.
    var other = store.history.filter(function (h) { return (h.ds || 'eco') !== dataset; });
    var mine = store.history.filter(function (h) { return (h.ds || 'eco') === dataset; });
    mine.push(game);
    if (mine.length > 20) mine = mine.slice(-20);
    store.history = other.concat(mine);
    saveStore();
  }

  // Озвучка событий (R02.1): синтез из sound.js, тумблер — store.sound.
  function sfx(event) {
    if (!SOUND || store.sound === false) return;
    SOUND.play(SOUND.soundFor(event));
  }

  // Контрастная тема (R01.6): переключатель, выбор — в store.theme.
  // Ключ создаётся только явным переключением, чтобы молчаливое состояние
  // совпадало со старым хранилищем. Заливки ставит paint*, тема их не трогает.
  function applyTheme() {
    var t = store.theme || 'light';
    var box = document.getElementById('theme');
    if (box && typeof box.checked === 'boolean') box.checked = (t === 'contrast');
    try {
      if (document.body && document.body.classList) {
        if (t === 'contrast') document.body.classList.add('contrast');
        else document.body.classList.remove('contrast');
      }
    } catch (e) {
      // Сбой применения темы не глотаем: откат на светлую по умолчанию,
      // это же состояние — в хранилище и в чекбокс.
      store.theme = 'light';
      saveStore();
      if (box && typeof box.checked === 'boolean') box.checked = false;
    }
  }
  function setTheme(name) {
    store.theme = (name === 'contrast') ? 'contrast' : 'light';
    saveStore();
    applyTheme();
  }

  var svg = document.getElementById('map');
  var tip = document.getElementById('tip');
  var NEUTRAL = '#cfd8e3';
  var paths = {};
  Array.prototype.forEach.call(svg.querySelectorAll('path[id]'), function (p) {
    if (bySvg[p.id]) {
      paths[p.id] = p;
      p.setAttribute('tabindex', '0');
      p.setAttribute('role', 'button');
      p.setAttribute('aria-label', bySvg[p.id].name);
    }
  });

  function paintStudy() {
    Object.keys(paths).forEach(function (id) {
      paths[id].style.fill = districtColor(groupOf(id));
      paths[id].classList.remove('dim', 'good', 'bad', 'hinted', 'active-q');
    });
  }
  function paintNeutral() {
    Object.keys(paths).forEach(function (id) {
      paths[id].style.fill = NEUTRAL;
      paths[id].classList.remove('dim', 'good', 'bad', 'hinted', 'active-q');
    });
  }
  function dimAllExcept(ids) {
    var keep = {};
    ids.forEach(function (id) { keep[id] = true; });
    Object.keys(paths).forEach(function (id) {
      paths[id].classList.toggle('dim', !keep[id]);
    });
  }

  // Подсказка с русским названием
  svg.addEventListener('mousemove', function (e) {
    var t = e.target;
    if (t && t.id && bySvg[t.id]) {
      tip.textContent = bySvg[t.id].name;
      tip.hidden = false;
      tip.style.left = (e.clientX + 14) + 'px';
      tip.style.top = (e.clientY + 12) + 'px';
    } else tip.hidden = true;
  });
  svg.addEventListener('mouseleave', function () { tip.hidden = true; });

  // Зум: кнопки, колесо, щипок
  var vb = { x: 0, y: 0, w: 1090, h: 620 };
  var VB0 = { x: 0, y: 0, w: 1090, h: 620 };
  function applyVb() { svg.setAttribute('viewBox', vb.x + ' ' + vb.y + ' ' + vb.w + ' ' + vb.h); }
  function zoom(f, cx, cy) {
    cx = (cx === undefined) ? vb.x + vb.w / 2 : cx;
    cy = (cy === undefined) ? vb.y + vb.h / 2 : cy;
    var nw = Math.min(1090, Math.max(80, vb.w * f));
    var k = nw / vb.w;
    vb.x = cx - (cx - vb.x) * k; vb.y = cy - (cy - vb.y) * k;
    vb.w = nw; vb.h = vb.h * k;
    applyVb();
  }
  document.getElementById('zoom-in').addEventListener('click', function () { zoom(0.75); });
  document.getElementById('zoom-out').addEventListener('click', function () { zoom(1.33); });
  document.getElementById('zoom-reset').addEventListener('click', function () {
    vb = { x: VB0.x, y: VB0.y, w: VB0.w, h: VB0.h }; applyVb();
  });
  svg.addEventListener('wheel', function (e) {
    e.preventDefault();
    var pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    var loc = pt.matrixTransform(svg.getScreenCTM().inverse());
    zoom(e.deltaY > 0 ? 1.2 : 0.83, loc.x, loc.y);
  }, { passive: false });
  var pinchD = 0;
  svg.addEventListener('touchmove', function (e) {
    if (e.touches.length === 2) {
      e.preventDefault();
      var d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY);
      if (pinchD) zoom(pinchD / d > 1 ? 1.08 : 0.92);
      pinchD = d;
    }
  }, { passive: false });
  svg.addEventListener('touchend', function () { pinchD = 0; });

  // Экраны
  var screens = ['home', 'study', 'game', 'result'];
  function show(name) {
    if (name !== 'game') stopTimer();
    screens.forEach(function (s) {
      document.getElementById('screen-' + s).hidden = (s !== name);
    });
    window.scrollTo(0, 0);
  }

  // Легенда
  var legend = document.getElementById('legend');
  var legendList = document.getElementById('legend-list');
  function legendLabel(d) {
    if (dataset === 'fo') {
      var c = d.center ? ' — центр: ' + centerText(d) : '';
      return d.name + ' (' + d.abbr + ')' + c + ' — ' + breakdownText(d.id);
    }
    return d.name;
  }
  function renderLegendList(districtId) {
    legendList.innerHTML = '';
    memberSubjects(districtId).forEach(function (s) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'legend-subject';
      b.dataset.svgId = s.svgId;
      b.textContent = s.name;
      b.addEventListener('click', function () {
        if (!document.getElementById('screen-study').hidden && paths[s.svgId]) {
          dimAllExcept([s.svgId]);
          paths[s.svgId].classList.add('active-q');
        }
      });
      legendList.appendChild(b);
    });
  }
  function renderLegend() {
    legend.innerHTML = '';
    legendList.innerHTML = '';
    curGroups().forEach(function (d, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'legend-item';
      b.dataset.group = d.id;
      b.innerHTML = '<span class="chip" style="background:' + d.color + '"></span>' +
        '<span class="num">' + (i + 1) + '</span> ' + legendLabel(d);
      b.addEventListener('mouseenter', function () {
        if (!document.getElementById('screen-study').hidden) dimAllExcept(membersOf(d.id));
      });
      b.addEventListener('mouseleave', function () {
        if (!document.getElementById('screen-study').hidden) paintStudy();
      });
      b.addEventListener('click', function () {
        if (!document.getElementById('screen-study').hidden) {
          dimAllExcept(membersOf(d.id));
          renderLegendList(d.id);
        }
      });
      legend.appendChild(b);
    });
  }

  // Кнопки выбора группы (12 районов / 8 округов)
  var dBtns = document.getElementById('district-btns');
  function renderDistrictBtns() {
    dBtns.innerHTML = '';
    curGroups().forEach(function (d, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'district-btn';
      b.dataset.district = d.id;
      b.innerHTML = '<span class="chip" style="background:' + d.color + '"></span>' +
        '<span class="num">' + (i + 1) + '</span> ' + (dataset === 'fo' ? d.abbr + ' — ' + d.name : d.name);
      dBtns.appendChild(b);
    });
  }

  // Печать составов: оба набора, сначала активный (Р01/Р10 ФО-03).
  function groupsOfDs(ds) { return ds === 'fo' ? FO_GROUPS : DISTRICTS; }
  function headerForDs(ds, g) {
    if (ds === 'fo') return g.name + ' (' + g.abbr + ') — центр: ' + centerText(g) + ' — ' + breakdownFor(ds, g.id);
    return g.name;
  }
  function appendPrintSet(pl, ds) {
    var h2 = document.createElement('h2');
    h2.textContent = ds === 'fo' ? 'Состав федеральных округов' : 'Состав экономических районов';
    pl.appendChild(h2);
    groupsOfDs(ds).forEach(function (d) {
      var sec = document.createElement('div');
      sec.className = 'print-district';
      var h = document.createElement('h3');
      h.textContent = headerForDs(ds, d);
      sec.appendChild(h);
      var ul = document.createElement('ul');
      (ds === 'fo' ? (byFo[d.id] || []) : (byDistrict[d.id] || [])).forEach(function (s) {
        var li = document.createElement('li');
        li.textContent = s.name;
        ul.appendChild(li);
      });
      sec.appendChild(ul);
      pl.appendChild(sec);
    });
  }
  function buildPrint() {
    var pl = document.getElementById('print-list');
    pl.innerHTML = '';
    appendPrintSet(pl, dataset);
    appendPrintSet(pl, dataset === 'fo' ? 'eco' : 'fo');
  }
  document.getElementById('btn-print').addEventListener('click', function () {
    sfx('click');
    if (typeof window !== 'undefined' && typeof window.print === 'function') window.print();
  });

  var G = null; // состояние игры
  var qTimer = document.getElementById('q-timer');
  // Секундомер (R04.1): время вопроса и раунда; скрытая вкладка — пауза.
  function visibleSeconds(t0, hiddenMs) {
    var hide = hiddenMs + (G.hiddenSince ? Date.now() - G.hiddenSince : 0);
    return (Date.now() - t0 - hide) / 1000;
  }
  function qSeconds() { return visibleSeconds(G.t0, G.hiddenMs); }
  function roundSeconds() { return visibleSeconds(G.roundT0, G.roundHiddenMs); }
  function tickTimer() {
    if (!G) return;
    qTimer.textContent = 'Время вопроса: ' + Math.max(0, qSeconds()).toFixed(0) +
      ' с · Раунд: ' + Math.max(0, roundSeconds()).toFixed(0) + ' с';
  }
  function stopTimer() {
    if (G && G.timerId) { clearInterval(G.timerId); G.timerId = 0; }
  }
  function onVis() {
    if (!G) return;
    if (document.hidden) { if (!G.hiddenSince) G.hiddenSince = Date.now(); }
    else if (G.hiddenSince) {
      var d = Date.now() - G.hiddenSince;
      G.hiddenMs += d; G.roundHiddenMs += d; G.hiddenSince = 0;
      tickTimer();
    }
  }
  if (document.addEventListener) document.addEventListener('visibilitychange', onVis);
  function newGame(mode, questions, strict) {
    stopTimer();
    var now = Date.now();
    G = { mode: mode, questions: questions, i: 0, score: 0, attempts: 0,
      picked: [], hinted: false, strict: !!strict, wrong: [],
      t0: now, roundT0: now, hiddenMs: 0, roundHiddenMs: 0, hiddenSince: 0, timerId: 0 };
    G.timerId = setInterval(tickTimer, 500);
    show('game');
    renderQuestion();
  }
  function startMode(mode) {
    var strict = document.getElementById('strict').checked;
    var n = mode === 'district-subjects' ? 6 : 10;
    // R01.1: слабые группы спрашивают чаще — веса из статистики активного набора.
    var qs = QUIZ.buildRound(mode, activeSubjects(), curGroups(), n, Math.random,
      QUIZ.weightsFromStats(askedSlice(), okSlice()));
    if (!qs.length) return;
    newGame(mode, qs, strict);
  }
  function subjectFor(ds, svgId) {
    if (ds === 'fo') {
      var s = bySvg[svgId];
      if (!s) return null;
      return { svgId: s.svgId, name: s.name, district: FO_OF[svgId], schematic: s.schematic };
    }
    return bySvg[svgId] || null;
  }
  function startErrors() {
    var strict = document.getElementById('strict').checked;
    var qs = [];
    errorsOf().slice(-30).forEach(function (e) {
      if (e.mode === 'subject-district' && bySvg[e.svgId]) {
        qs.push({ kind: 'subject-district', subject: subjectFor(dataset, e.svgId) });
      } else if (e.mode === 'district-subjects') {
        var d = groupById(e.district);
        if (d) qs.push({ kind: 'mixed-district', district: d, members: membersOf(d.id) });
      } else if (e.mode === 'neighbors' && bySvg[e.svgId] &&
          DATA.NEIGHBORS[e.svgId] && DATA.NEIGHBORS[e.svgId].length) {
        qs.push({ kind: 'neighbors', subject: subjectFor(dataset, e.svgId),
          neighbors: DATA.NEIGHBORS[e.svgId].slice() });
      }
    });
    if (!qs.length) return;
    newGame('errors', qs, strict);
  }

  // Режим «соседи» (R01.5): вопросы — только QUIZ.neighborQuestion,
  // регионы без соседей отсекает само ядро. 6 вопросов, без повторов субъекта.
  function startNeighbors() {
    var strict = document.getElementById('strict').checked;
    var qs = [], guard = 0;
    while (qs.length < 6 && guard++ < 200) {
      var q = QUIZ.neighborQuestion(activeSubjects(), DATA.NEIGHBORS, Math.random);
      if (q && qs.every(function (x) { return x.subject.svgId !== q.subject.svgId; })) qs.push(q);
    }
    if (!qs.length) return;
    newGame('neighbors', qs, strict);
  }
  // Цели вопроса для кликов по карте: район — members, соседи — neighbors.
  function qMembers(q) { return q.kind === 'neighbors' ? q.neighbors : q.members; }
  function qDistrictId(q) {
    return q.kind === 'neighbors' ? q.subject.district : q.district.id;
  }

  var qTitle = document.getElementById('q-title');
  var qHint = document.getElementById('q-hint');
  var qMsg = document.getElementById('q-msg');
  var btnHint = document.getElementById('btn-hint');
  var btnGiveup = document.getElementById('btn-giveup');
  var btnFinish = document.getElementById('btn-finish');
  var btnDone = document.getElementById('btn-done');
  var progress = document.getElementById('q-progress');

  function curQ() { return G.questions[G.i]; }
  function renderQuestion() {
    var q = curQ();
    G.attempts = 0; G.picked = []; G.hinted = false;
    G.t0 = Date.now(); G.hiddenMs = 0; G.hiddenSince = document.hidden ? Date.now() : 0;
    tickTimer();
    qMsg.textContent = '';
    paintNeutral();
    btnDone.hidden = true;
    btnHint.hidden = G.strict || q.kind !== 'subject-district';
    dBtns.style.display = (q.kind === 'subject-district') ? '' : 'none';
    progress.textContent = 'Вопрос ' + (G.i + 1) + ' из ' + G.questions.length + ' · Счёт ' + G.score;
    if (q.kind === 'subject-district' || (G.mode === 'errors' && q.kind === 'subject-district')) {
      qTitle.textContent = dataset === 'fo'
        ? 'Какой федеральный округ: ' + q.subject.name + '?'
        : 'Какой экономический район: ' + q.subject.name + '?';
      qHint.textContent = 'Подсказка: регион подсвечен на карте.';
      dimAllExcept([q.subject.svgId]);
      paths[q.subject.svgId].classList.add('active-q');
    } else if (q.kind === 'neighbors') {
      qTitle.textContent = 'Кто соседи: кликни регионы, граничащие с «' + q.subject.name +
        '» (' + q.neighbors.length + ')';
      qHint.textContent = 'Кликай соседей на карте, затем «Готово».';
      btnDone.hidden = false;
      dimAllExcept([q.subject.svgId]);
      paths[q.subject.svgId].classList.add('active-q');
    } else {
      var d = q.district;
      qTitle.textContent = 'Покажи на карте: ' + d.name + ' (' + q.members.length + ' субъектов)';
      qHint.textContent = 'Кликай субъекты на карте, затем «Готово».';
      btnDone.hidden = false;
    }
  }

  dBtns.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-district]');
    if (!b || !G) return;
    var q = curQ();
    if (q.kind !== 'subject-district') return;
    var r = QUIZ.checkSubjectAnswer(q, b.dataset.district);
    G.attempts++;
    if (r.ok) {
      var bonus = QUIZ.bonusFor({ attempt: G.attempts, seconds: qSeconds(), hinted: G.hinted });
      G.score += (G.hinted ? 0 : (G.attempts === 1 ? 2 : 1)) + bonus;
      paths[q.subject.svgId].classList.add('good');
      recordResult(q.subject.district, true);
      sfx('correct');
      qMsg.textContent = 'Верно! ' + q.subject.name + ' — ' + districtName(q.subject.district) + '.' +
        (bonus ? ' Бонус за скорость +1!' : '');
      setTimeout(next, 900);
    } else if (G.attempts >= 3) {
      if (!G.strict) {
        dimAllExcept(membersOf(q.subject.district));
        qMsg.textContent = 'Правильно: ' + districtName(q.subject.district) + '. Запомним!';
      } else {
        qMsg.textContent = 'Неверно. Идём дальше.';
      }
      paths[q.subject.svgId].classList.add('bad');
      recordResult(q.subject.district, false);
      pushError({ mode: 'subject-district', svgId: q.subject.svgId });
      sfx('wrong');
      setTimeout(next, 1600);
    } else {
      b.classList.add('tried');
      setTimeout(function () { b.classList.remove('tried'); }, 600);
      qMsg.textContent = 'Мимо. Осталось попыток: ' + (3 - G.attempts) + '.';
      recordResult(q.subject.district, false);
      sfx('wrong');
    }
  });

  function onPickSvg(id) {
    if (!G) return;
    var q = curQ();
    if (q.kind !== 'district-subjects' && q.kind !== 'mixed-district' && q.kind !== 'neighbors') return;
    if (G.picked.indexOf(id) !== -1) return; // повтор не ошибка
    var r = QUIZ.checkDistrictAnswer(
      { members: qMembers(q) }, G.picked.concat([id]));
    if (r.extra.length) {
      paths[id].classList.add('bad');
      setTimeout(function () { paths[id].classList.remove('bad'); }, 600);
      qMsg.textContent = bySvg[id].name + ' — не входит. Ищем дальше.';
      sfx('wrong');
    } else {
      G.picked.push(id);
      paths[id].classList.add('good');
      var left = qMembers(q).length - G.picked.length;
      qMsg.textContent = left ? 'Осталось найти: ' + left + '.' : 'Всё найдено! Жми «Готово».';
    }
  }
  svg.addEventListener('click', function (e) {
    var t = e.target;
    if (t && t.id && bySvg[t.id]) {
      if (!document.getElementById('screen-game').hidden) onPickSvg(t.id);
      else { tip.textContent = bySvg[t.id].name; tip.hidden = false; }
    }
  });
  svg.addEventListener('keydown', function (e) {
    var t = e.target;
    if ((e.key === 'Enter' || e.key === ' ') && t && t.id && bySvg[t.id]) {
      e.preventDefault();
      if (!document.getElementById('screen-game').hidden) onPickSvg(t.id);
    }
  });

  btnDone.addEventListener('click', function () {
    if (!G) return;
    var q = curQ();
    var members = qMembers(q);
    var r = QUIZ.checkDistrictAnswer({ members: members }, G.picked);
    var ok = r.complete;
    if (ok) G.score += 2;
    members.forEach(function (id) {
      if (paths[id]) paths[id].classList.add(r.missing.indexOf(id) === -1 ? 'good' : 'bad');
    });
    recordResult(qDistrictId(q), ok);
    if (!ok) pushError(q.kind === 'neighbors'
      ? { mode: 'neighbors', svgId: q.subject.svgId }
      : { mode: 'district-subjects', district: q.district.id });
    sfx(ok ? 'correct' : 'wrong');
    qMsg.textContent = ok
      ? 'Верно! Все ' + r.total + ' найдены.'
      : 'Найдено ' + r.found + ' из ' + r.total + '. Пропущены: ' +
        r.missing.map(function (id) { return bySvg[id].name; }).join(', ') + '.';
    if (!G.strict) dimAllExcept(members);
    setTimeout(next, 2200);
  });

  btnHint.addEventListener('click', function () {
    if (!G) return;
    var q = curQ();
    if (q.kind !== 'subject-district') return;
    G.hinted = true;
    dimAllExcept(membersOf(q.subject.district));
    qMsg.textContent = dataset === 'fo'
      ? 'Округ подсвечен на карте. Балл за вопрос уже не получишь, но запомнишь!'
      : 'Район подсвечен на карте. Балл за вопрос уже не получишь, но запомнишь!';
  });
  btnGiveup.addEventListener('click', function () {
    if (!G) return;
    var q = curQ();
    var d = q.kind === 'subject-district' ? q.subject.district : qDistrictId(q);
    recordResult(d, false);
    pushError(q.kind === 'subject-district'
      ? { mode: 'subject-district', svgId: q.subject.svgId }
      : (q.kind === 'neighbors'
        ? { mode: 'neighbors', svgId: q.subject.svgId }
        : { mode: 'district-subjects', district: q.district.id }));
    next();
  });
  btnFinish.addEventListener('click', function () { finish(); });

  function next() {
    if (!G) return; // партию уже завершили («Мне хватит») до срабатывания таймера
    G.i++;
    if (G.i >= G.questions.length) finish();
    else renderQuestion();
  }
  function finish() {
    var total = G.questions.length;
    var secs = Math.max(0, roundSeconds());
    stopTimer();
    var pct = total ? Math.round(100 * G.score / (2 * total)) : 0;
    document.getElementById('res-score').textContent = G.score + ' из ' + (2 * total) + ' (' + pct + '%)';
    document.getElementById('res-time').textContent = 'Время раунда: ' + secs.toFixed(0) +
      ' с · среднее на вопрос: ' + (total ? (secs / total).toFixed(0) : 0) + ' с';
    pushHistory({ date: new Date().toISOString(), score: G.score, total: 2 * total });
    var rh = document.getElementById('res-history');
    rh.innerHTML = '';
    historyOf().slice(-5).reverse().forEach(function (g) {
      var li = document.createElement('li');
      var when = g.date ? g.date.slice(0, 10) : '';
      li.textContent = (when ? when + ' — ' : '') + g.score + ' из ' + g.total;
      rh.appendChild(li);
    });
    var A = askedSlice(), O = okSlice();
    var per = curGroups().map(function (d) {
      var a = A[d.id] || 0, o = O[d.id] || 0;
      return { d: d, pct: a ? Math.round(100 * o / a) : null };
    });
    var ul = document.getElementById('res-districts');
    ul.innerHTML = '';
    per.forEach(function (r) {
      var li = document.createElement('li');
      li.innerHTML = '<span class="chip" style="background:' + r.d.color + '"></span>' +
        r.d.name + ' — ' + (r.pct === null ? 'пока нет' : r.pct + '%');
      ul.appendChild(li);
    });
    document.getElementById('btn-retry-errors').hidden = !errorsOf().length;
    G = null;
    paintStudy();
    sfx('finish');
    show('result');
  }

  document.getElementById('btn-study').addEventListener('click', function () {
    paintStudy(); show('study');
  });
  document.getElementById('btn-mode-sd').addEventListener('click', function () { startMode('subject-district'); });
  document.getElementById('btn-mode-ds').addEventListener('click', function () { startMode('district-subjects'); });
  document.getElementById('btn-mode-nb').addEventListener('click', startNeighbors);
  document.getElementById('btn-errors').addEventListener('click', startErrors);
  document.getElementById('btn-retry-errors').addEventListener('click', function () {
    show('home'); startErrors();
  });
  document.getElementById('btn-reset').addEventListener('click', function () {
    var sound = store.sound, th = store.theme, ds = dataset;
    store = { dataset: ds, ok: { eco: {}, fo: {} }, asked: { eco: {}, fo: {} }, errors: [], history: [], sound: sound };
    if (th) store.theme = th;
    saveStore();
    refreshHome();
  });
  document.getElementById('btn-again').addEventListener('click', function () { show('home'); });
  Array.prototype.forEach.call(document.querySelectorAll('[data-home]'), function (b) {
    b.addEventListener('click', function () { show('home'); });
  });

  function refreshHome() {
    var n = errorsOf().length;
    var be = document.getElementById('btn-errors');
    be.hidden = !n;
    be.textContent = 'Повторить ошибки (' + n + ')';
  }

  // Переключатель набора (шов таска ФО-02): легенда/кнопки/печать/изучение
  // перестраиваются, статистика берётся из своего неймспейса.
  function paintDatasetButtons() {
    var eco = document.getElementById('ds-eco');
    var fo = document.getElementById('ds-fo');
    // Как в applyTheme: сбой DOM не глотаем молча — состояние фиксируем
    // запасным путём (dataset.pressed), чтобы рассинхрон был виден.
    if (eco && eco.setAttribute) {
      try { eco.setAttribute('aria-pressed', dataset === 'eco' ? 'true' : 'false'); }
      catch (e) { eco.dataset.pressed = (dataset === 'eco') ? 'true' : 'false'; }
    }
    if (fo && fo.setAttribute) {
      try { fo.setAttribute('aria-pressed', dataset === 'fo' ? 'true' : 'false'); }
      catch (e) { fo.dataset.pressed = (dataset === 'fo') ? 'true' : 'false'; }
    }
  }
  function setDataset(name) {
    if (name !== 'eco' && name !== 'fo') return dataset;
    dataset = name;
    saveStore();
    paintDatasetButtons();
    renderLegend();
    renderDistrictBtns();
    buildPrint();
    paintStudy();
    refreshHome();
    return dataset;
  }
  function getDataset() { return dataset; }

  loadStore();
  dataset = store.dataset || 'eco';
  renderLegend();
  renderDistrictBtns();
  buildPrint();
  paintDatasetButtons();
  paintStudy();
  refreshHome();
  var soundBox = document.getElementById('sound');
  soundBox.checked = store.sound !== false;
  soundBox.addEventListener('change', function () {
    store.sound = soundBox.checked;
    saveStore();
    if (soundBox.checked) sfx('click');
  });
  var themeBox = document.getElementById('theme');
  themeBox.addEventListener('change', function () {
    setTheme(themeBox.checked ? 'contrast' : 'light');
    if (store.sound !== false) sfx('click');
  });
  document.getElementById('ds-eco').addEventListener('click', function () { setDataset('eco'); sfx('click'); });
  document.getElementById('ds-fo').addEventListener('click', function () { setDataset('fo'); sfx('click'); });
  applyTheme();
  show('home');
  if (typeof window !== 'undefined') window.GEO_APP = { setDataset: setDataset, getDataset: getDataset };
})();
