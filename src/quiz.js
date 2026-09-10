/* Чистая логика викторины — шов для тестов. Без DOM, без Math.random
 * внутри проверяемых путей: генератор передаётся снаружи.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.GEO_QUIZ = api;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function makeRng(seed) {
    var s = (seed >>> 0) || 1;
    return function () {
      s ^= s << 13; s >>>= 0;
      s ^= s >> 17;
      s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  }

  function shuffle(arr, rng) {
    var a = arr.slice(), r = rng || Math.random, i, j, t;
    for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(r() * (i + 1));
      t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function pick(arr, rng) {
    return arr[Math.floor((rng || Math.random)() * arr.length)];
  }

  // Вес района из % верных (R01.1): 1 − pct/100, пол 0.1,
  // чтобы район со 100% всё равно иногда выпадал. pct: 0..100.
  function weightFor(pct) {
    if (typeof pct !== 'number' || isNaN(pct)) return 1;
    if (pct <= 0) return 1;
    if (pct >= 100) return 0.1;
    var w = 1 - pct / 100;
    return w < 0.1 ? 0.1 : w;
  }

  // Вопрос «субъект → район»: какой район у этого субъекта.
  // Варианты не фиксируем — приложение показывает все 12 районов.
  function subjectQuestion(subjects, rng) {
    return { kind: 'subject-district', subject: pick(subjects, rng) };
  }

  // Вопрос «район → субъекты»: district + множество svgId.
  function districtQuestion(subjects, districts, rng) {
    var district = pick(districts, rng);
    var members = subjects
      .filter(function (s) { return s.district === district.id; })
      .map(function (s) { return s.svgId; });
    return { kind: 'district-subjects', district: district, members: members };
  }

  function checkSubjectAnswer(question, districtId) {
    return { ok: question.subject.district === districtId, correct: question.subject.district };
  }

  // picked: массив svgId, кликнутых пользователем.
  function checkDistrictAnswer(question, picked) {
    var need = {}, got = {}, i;
    question.members.forEach(function (id) { need[id] = true; });
    picked.forEach(function (id) { got[id] = true; });
    var missing = [], extra = [], found = 0;
    question.members.forEach(function (id) {
      if (got[id]) found++; else missing.push(id);
    });
    picked.forEach(function (id) {
      if (!need[id]) extra.push(id);
    });
    return { found: found, total: question.members.length, missing: missing, extra: extra,
      complete: missing.length === 0 && extra.length === 0 };
  }

  // Бонус за скорость (R04.1): +1 только за верный с 1-й попытки
  // быстрее 8 с без подсказки, иначе 0.
  function bonusFor(a) {
    a = a || {};
    if (a.attempt !== 1) return 0;
    if (a.hinted) return 0;
    if (typeof a.seconds !== 'number' || isNaN(a.seconds)) return 0;
    return a.seconds < 8 ? 1 : 0;
  }

  // Вопрос «соседи» (R01.5): субъект с ≥1 соседом + множество соседей.
  // neighbors — матрица таска 01 {svgId: [svgId...]}; регионы без соседей
  // (нет ключа или пустой список) в вопрос не попадают.
  function neighborQuestion(subjects, neighbors, rng) {
    var eligible = subjects.filter(function (s) {
      return neighbors && neighbors[s.svgId] && neighbors[s.svgId].length > 0;
    });
    if (eligible.length === 0) return null;
    var subject = pick(eligible, rng);
    return { kind: 'neighbors', subject: subject, neighbors: neighbors[subject.svgId].slice() };
  }

  // Взвешенная выборка без повторов: вероятность взять элемент
  // пропорциональна его весу. Детерминирована при том же rng.
  function weightedSample(items, weightOf, rng) {
    var rest = items.slice(), out = [], total, x, acc, k, idx;
    while (rest.length > 0) {
      total = 0;
      for (k = 0; k < rest.length; k++) total += weightOf(rest[k]);
      x = rng() * total;
      acc = 0; idx = rest.length - 1;
      for (k = 0; k < rest.length; k++) {
        acc += weightOf(rest[k]);
        if (x < acc) { idx = k; break; }
      }
      out.push(rest[idx]);
      rest.splice(idx, 1);
    }
    return out;
  }

  function weightOfKey(weights, key) {
    var w = weights ? weights[key] : undefined;
    return (typeof w === 'number' && !isNaN(w) && w > 0) ? w : 1;
  }

  // Набор вопросов на игру: n случайных, без повторов субъекта/района.
  // weights (опционально): {districtId: weight} — слабые районы выпадают чаще.
  // В режиме subject-district вес субъекта = вес его района.
  function buildRound(mode, subjects, districts, n, rng, weights) {
    var r = rng || Math.random, pool;
    if (weights && typeof weights === 'object') {
      if (mode === 'subject-district') {
        pool = weightedSample(subjects, function (s) {
          return weightOfKey(weights, s.district);
        }, r);
      } else {
        pool = weightedSample(districts, function (d) {
          return weightOfKey(weights, d.id);
        }, r);
      }
    } else {
      pool = shuffle(mode === 'subject-district' ? subjects : districts, r);
    }
    var out = [], i;
    for (i = 0; i < Math.min(n, pool.length); i++) {
      out.push(mode === 'subject-district'
        ? subjectQuestion([pool[i]], r)
        : districtQuestion(subjects, [pool[i]], r));
    }
    return out;
  }

  return {
    makeRng: makeRng,
    shuffle: shuffle,
    weightFor: weightFor,
    subjectQuestion: subjectQuestion,
    districtQuestion: districtQuestion,
    checkSubjectAnswer: checkSubjectAnswer,
    checkDistrictAnswer: checkDistrictAnswer,
    bonusFor: bonusFor,
    neighborQuestion: neighborQuestion,
    buildRound: buildRound
  };
}));
