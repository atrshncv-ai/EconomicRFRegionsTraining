const assert = require('node:assert/strict');
const Q = require('../src/quiz.js');
const { DISTRICTS, SUBJECTS } = require('../src/data.js');

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

console.log('quiz.test.js: OK (вопросы, проверка, раунды)');
