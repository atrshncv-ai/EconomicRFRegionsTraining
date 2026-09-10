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
  var bySvg = {}, byDistrict = {};
  SUBJECTS.forEach(function (s) {
    bySvg[s.svgId] = s;
    (byDistrict[s.district] = byDistrict[s.district] || []).push(s);
  });
  function districtName(id) {
    for (var i = 0; i < DISTRICTS.length; i++) if (DISTRICTS[i].id === id) return DISTRICTS[i].name;
    return id;
  }
  function districtColor(id) {
    for (var i = 0; i < DISTRICTS.length; i++) if (DISTRICTS[i].id === id) return DISTRICTS[i].color;
    return '#ccc';
  }

  var STORE_KEY = 'geo-trainer-v1';
  var store = { ok: {}, asked: {}, errors: [], history: [], sound: true };
  var storageOK = true;
  function loadStore() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) store = JSON.parse(raw);
      if (store.sound === undefined) store.sound = true;
      if (!store.history) store.history = [];
      if (!store.ok) store.ok = {};
      if (!store.asked) store.asked = {};
      if (!store.errors) store.errors = [];
    } catch (e) { storageOK = false; }
  }
  function saveStore() {
    if (!storageOK) return;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); }
    catch (e) { storageOK = false; }
  }
  function recordResult(districtId, ok) {
    store.asked[districtId] = (store.asked[districtId] || 0) + 1;
    if (ok) store.ok[districtId] = (store.ok[districtId] || 0) + 1;
    saveStore();
  }
  function pushError(err) { store.errors.push(err); saveStore(); }

  // История игр (R01.3): последние 20 (дата, счёт, всего из 2×N).
  function pushHistory(game) {
    store.history.push(game);
    if (store.history.length > 20) store.history = store.history.slice(-20);
    saveStore();
  }

  // Озвучка событий (R02.1): синтез из sound.js, тумблер — store.sound.
  function sfx(event) {
    if (!SOUND || store.sound === false) return;
    SOUND.play(SOUND.soundFor(event));
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
      paths[id].style.fill = districtColor(bySvg[id].district);
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
  DISTRICTS.forEach(function (d, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'legend-item';
    b.innerHTML = '<span class="chip" style="background:' + d.color + '"></span>' +
      '<span class="num">' + (i + 1) + '</span> ' + d.name;
    b.addEventListener('mouseenter', function () {
      if (!document.getElementById('screen-study').hidden) dimAllExcept(byDistrict[d.id].map(function (s) { return s.svgId; }));
    });
    b.addEventListener('mouseleave', function () {
      if (!document.getElementById('screen-study').hidden) paintStudy();
    });
    b.addEventListener('click', function () {
      if (!document.getElementById('screen-study').hidden) {
        dimAllExcept(byDistrict[d.id].map(function (s) { return s.svgId; }));
      }
    });
    legend.appendChild(b);
  });

  // Кнопки выбора района (12)
  var dBtns = document.getElementById('district-btns');
  DISTRICTS.forEach(function (d, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'district-btn';
    b.dataset.district = d.id;
    b.innerHTML = '<span class="chip" style="background:' + d.color + '"></span>' +
      '<span class="num">' + (i + 1) + '</span> ' + d.name;
    dBtns.appendChild(b);
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
    var pool = mode === 'subject-district' ? SUBJECTS : DISTRICTS;
    var qs = QUIZ.buildRound(mode, SUBJECTS, DISTRICTS, n, Math.random);
    if (!qs.length) return;
    newGame(mode, qs, strict);
  }
  function startErrors() {
    var strict = document.getElementById('strict').checked;
    var qs = [];
    store.errors.slice(-30).forEach(function (e) {
      if (e.mode === 'subject-district' && bySvg[e.svgId]) {
        qs.push({ kind: 'subject-district', subject: bySvg[e.svgId] });
      } else if (e.mode === 'district-subjects') {
        var d = DISTRICTS.filter(function (x) { return x.id === e.district; })[0];
        if (d) qs.push({ kind: 'mixed-district', district: d,
          members: (byDistrict[d.id] || []).map(function (s) { return s.svgId; }) });
      }
    });
    if (!qs.length) return;
    newGame('errors', qs, strict);
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
    btnHint.hidden = G.strict || q.kind === 'district-subjects';
    dBtns.style.display = (q.kind === 'district-subjects') ? 'none' : '';
    progress.textContent = 'Вопрос ' + (G.i + 1) + ' из ' + G.questions.length + ' · Счёт ' + G.score;
    if (q.kind === 'subject-district' || (G.mode === 'errors' && q.kind === 'subject-district')) {
      qTitle.textContent = 'Какой экономический район: ' + q.subject.name + '?';
      qHint.textContent = 'Подсказка: регион подсвечен на карте.';
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
        dimAllExcept(byDistrict[q.subject.district].map(function (s) { return s.svgId; }));
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
    if (q.kind !== 'district-subjects' && q.kind !== 'mixed-district') return;
    if (G.picked.indexOf(id) !== -1) return; // повтор не ошибка
    var r = QUIZ.checkDistrictAnswer(
      { members: q.members }, G.picked.concat([id]));
    if (r.extra.length) {
      paths[id].classList.add('bad');
      setTimeout(function () { paths[id].classList.remove('bad'); }, 600);
      qMsg.textContent = bySvg[id].name + ' — не входит. Ищем дальше.';
      sfx('wrong');
    } else {
      G.picked.push(id);
      paths[id].classList.add('good');
      var left = q.members.length - G.picked.length;
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
    var r = QUIZ.checkDistrictAnswer({ members: q.members }, G.picked);
    var ok = r.complete;
    if (ok) G.score += 2;
    q.members.forEach(function (id) {
      if (paths[id]) paths[id].classList.add(r.missing.indexOf(id) === -1 ? 'good' : 'bad');
    });
    recordResult(q.district.id, ok);
    if (!ok) pushError({ mode: 'district-subjects', district: q.district.id });
    sfx(ok ? 'correct' : 'wrong');
    qMsg.textContent = ok
      ? 'Верно! Все ' + r.total + ' найдены.'
      : 'Найдено ' + r.found + ' из ' + r.total + '. Пропущены: ' +
        r.missing.map(function (id) { return bySvg[id].name; }).join(', ') + '.';
    if (!G.strict) dimAllExcept(q.members);
    setTimeout(next, 2200);
  });

  btnHint.addEventListener('click', function () {
    if (!G) return;
    var q = curQ();
    if (q.kind !== 'subject-district') return;
    G.hinted = true;
    dimAllExcept(byDistrict[q.subject.district].map(function (s) { return s.svgId; }));
    qMsg.textContent = 'Район подсвечен на карте. Балл за вопрос уже не получишь, но запомнишь!';
  });
  btnGiveup.addEventListener('click', function () {
    if (!G) return;
    var q = curQ();
    var d = q.kind === 'subject-district' ? q.subject.district : q.district.id;
    recordResult(d, false);
    pushError(q.kind === 'subject-district'
      ? { mode: 'subject-district', svgId: q.subject.svgId }
      : { mode: 'district-subjects', district: q.district.id });
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
    store.history.slice(-5).reverse().forEach(function (g) {
      var li = document.createElement('li');
      var when = g.date ? g.date.slice(0, 10) : '';
      li.textContent = (when ? when + ' — ' : '') + g.score + ' из ' + g.total;
      rh.appendChild(li);
    });
    var per = DISTRICTS.map(function (d) {
      var a = store.asked[d.id] || 0, o = store.ok[d.id] || 0;
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
    document.getElementById('btn-retry-errors').hidden = !store.errors.length;
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
  document.getElementById('btn-errors').addEventListener('click', startErrors);
  document.getElementById('btn-retry-errors').addEventListener('click', function () {
    show('home'); startErrors();
  });
  document.getElementById('btn-reset').addEventListener('click', function () {
    var sound = store.sound;
    store = { ok: {}, asked: {}, errors: [], history: [], sound: sound };
    saveStore();
    refreshHome();
  });
  document.getElementById('btn-again').addEventListener('click', function () { show('home'); });
  Array.prototype.forEach.call(document.querySelectorAll('[data-home]'), function (b) {
    b.addEventListener('click', function () { show('home'); });
  });

  function refreshHome() {
    var n = store.errors.length;
    var be = document.getElementById('btn-errors');
    be.hidden = !n;
    be.textContent = 'Повторить ошибки (' + n + ')';
  }

  loadStore();
  paintStudy();
  refreshHome();
  var soundBox = document.getElementById('sound');
  soundBox.checked = store.sound !== false;
  soundBox.addEventListener('change', function () {
    store.sound = soundBox.checked;
    saveStore();
    if (soundBox.checked) sfx('click');
  });
  show('home');
})();
