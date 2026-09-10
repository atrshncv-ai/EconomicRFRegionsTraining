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

  // Набор вопросов на игру: n случайных, без повторов субъекта/района.
  function buildRound(mode, subjects, districts, n, rng) {
    var pool = shuffle(mode === 'subject-district' ? subjects : districts, rng);
    var out = [], i;
    for (i = 0; i < Math.min(n, pool.length); i++) {
      out.push(mode === 'subject-district'
        ? subjectQuestion([pool[i]], rng)
        : districtQuestion(subjects, [pool[i]], rng));
    }
    return out;
  }

  return {
    makeRng: makeRng,
    shuffle: shuffle,
    subjectQuestion: subjectQuestion,
    districtQuestion: districtQuestion,
    checkSubjectAnswer: checkSubjectAnswer,
    checkDistrictAnswer: checkDistrictAnswer,
    buildRound: buildRound
  };
}));
