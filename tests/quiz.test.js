const assert = require('node:assert/strict');
const Q = require('../src/quiz.js');
const { DISTRICTS, SUBJECTS, NEIGHBORS } = require('../src/data.js');

const rng = Q.makeRng(42);

// subjectQuestion: вопрос из пула, район ответа совпадает с данными
const q = Q.subjectQuestion(SUBJECTS.slice(0, 5), rng);
assert.equal(q.kind, 'subject-district');
assert.ok(SUBJECTS.slice(0, 5).includes(q.subject));
assert.deepEqual(Q.checkSubjectAnswer(q, q.subject.district), { ok: true, correct: q.subject.district });
assert.equal(Q.checkSubjectAnswer(q, '__nope').ok, false);

// districtQuestion: состав Центрального — 13, включая Москву
const central = DISTRICTS.find((d) => d.id === 'central');
const dq = Q.districtQuestion(SUBJECTS, [central], Q.makeRng(7));
assert.equal(dq.members.length, 13);
assert.ok(dq.members.includes('RU-MOW'));

// checkDistrictAnswer: частичный ответ, лишний, полный
const toy = { members: ['a', 'b', 'c'] };
let r = Q.checkDistrictAnswer(toy, ['a']);
assert.deepEqual([r.found, r.total, r.complete], [1, 3, false]);
assert.deepEqual(r.missing, ['b', 'c']);
r = Q.checkDistrictAnswer(toy, ['a', 'b', 'c', 'zzz']);
assert.equal(r.complete, false);
assert.deepEqual(r.extra, ['zzz']);
r = Q.checkDistrictAnswer(toy, ['c', 'a', 'b']);
assert.equal(r.complete, true);

// buildRound: без повторов, нужные виды, детерминирован при том же сиде
const r1 = Q.buildRound('subject-district', SUBJECTS, DISTRICTS, 10, Q.makeRng(9));
const r2 = Q.buildRound('subject-district', SUBJECTS, DISTRICTS, 10, Q.makeRng(9));
assert.equal(r1.length, 10);
assert.equal(new Set(r1.map((x) => x.subject.svgId)).size, 10);
assert.deepEqual(r1.map((x) => x.subject.svgId), r2.map((x) => x.subject.svgId));
const rd = Q.buildRound('district-subjects', SUBJECTS, DISTRICTS, 6, Q.makeRng(9));
assert.equal(rd.length, 6);
assert.ok(rd.every((x) => x.kind === 'district-subjects' && x.members.length > 0));

// weightFor: вес выше при низком % (формула из спеки: 1 − %/100, пол 0.1)
assert.equal(Q.weightFor(0), 1);
assert.equal(Q.weightFor(50), 0.5);
assert.equal(Q.weightFor(100), 0.1);
assert.ok(Q.weightFor(100) > 0);
assert.ok(Q.weightFor(0) > Q.weightFor(50) && Q.weightFor(50) > Q.weightFor(100));

// bonusFor: +1 только за верный с 1-й попытки быстрее 8 с без подсказки
assert.equal(Q.bonusFor({ attempt: 1, seconds: 5, hinted: false }), 1);
assert.equal(Q.bonusFor({ attempt: 1, seconds: 7.9, hinted: false }), 1);
assert.equal(Q.bonusFor({ attempt: 1, seconds: 8, hinted: false }), 0);
assert.equal(Q.bonusFor({ attempt: 2, seconds: 3, hinted: false }), 0);
assert.equal(Q.bonusFor({ attempt: 1, seconds: 3, hinted: true }), 0);
assert.equal(Q.bonusFor({ attempt: 1, seconds: 20, hinted: false }), 0);

// neighborQuestion: субъект с ≥1 соседом + множество соседей (разобрано вручную)
const toySubjects = [
  { svgId: 'a', name: 'A', district: 'd1' },
  { svgId: 'b', name: 'B', district: 'd1' },
  { svgId: 'lonely', name: 'L', district: 'd2' },
];
const toyNeighbors = { a: ['b'], b: ['a'] };
for (let i = 0; i < 20; i++) {
  const nq = Q.neighborQuestion(toySubjects, toyNeighbors, Q.makeRng(i));
  assert.equal(nq.kind, 'neighbors');
  assert.ok(['a', 'b'].includes(nq.subject.svgId));
  assert.deepEqual(nq.neighbors, toyNeighbors[nq.subject.svgId]);
}
assert.deepEqual(
  Q.neighborQuestion(toySubjects, toyNeighbors, Q.makeRng(5)),
  Q.neighborQuestion(toySubjects, toyNeighbors, Q.makeRng(5))
);
// на реальной матрице таска 01: без соседей не выпадают, множество — из NEIGHBORS
for (let i = 0; i < 50; i++) {
  const nq = Q.neighborQuestion(SUBJECTS, NEIGHBORS, Q.makeRng(i));
  assert.ok(!['RU-KGD', 'RU-SAK'].includes(nq.subject.svgId));
  assert.deepEqual(nq.neighbors, NEIGHBORS[nq.subject.svgId]);
  assert.ok(nq.neighbors.length >= 1);
}

// buildRound с весами: слабые районы выпадают чаще (сид фиксирован)
const wDistricts = [{ id: 'weak', name: 'W' }, { id: 'strong', name: 'S' }];
const wSubjects = [
  { svgId: 'w1', name: 'W1', district: 'weak' },
  { svgId: 'w2', name: 'W2', district: 'weak' },
  { svgId: 's1', name: 'S1', district: 'strong' },
  { svgId: 's2', name: 'S2', district: 'strong' },
];
const wWeights = { weak: 1, strong: 0.1 };
let weakHits = 0;
for (let i = 0; i < 100; i++) {
  const rd = Q.buildRound('subject-district', wSubjects, wDistricts, 2, Q.makeRng(i), wWeights);
  assert.equal(rd.length, 2);
  rd.forEach((x) => { if (x.subject.district === 'weak') weakHits++; });
}
assert.ok(weakHits >= 140, 'слабый район должен выпадать чаще, weakHits=' + weakHits);
assert.deepEqual(
  Q.buildRound('subject-district', wSubjects, wDistricts, 2, Q.makeRng(11), wWeights).map((x) => x.subject.svgId),
  Q.buildRound('subject-district', wSubjects, wDistricts, 2, Q.makeRng(11), wWeights).map((x) => x.subject.svgId)
);

console.log('quiz.test.js: OK (вопросы, проверка, раунды)');
