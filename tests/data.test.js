const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { DISTRICTS, SUBJECTS, NEIGHBORS } = require('../src/data.js');

const EXPECTED = {
  central: 13, black: 7, northwest: 4, northern: 6, kaliningrad: 1,
  vyatka: 5, volga: 8, caucasus: 14, ural: 7, wsib: 9, esib: 6, fareast: 9
};

assert.equal(DISTRICTS.length, 12, 'районов должно быть 12');
assert.equal(SUBJECTS.length, 89, 'субъектов должно быть 89');

const ids = SUBJECTS.map((s) => s.svgId);
assert.equal(new Set(ids).size, 89, 'svgId уникальны');

const dids = new Set(DISTRICTS.map((d) => d.id));
for (const s of SUBJECTS) assert.ok(dids.has(s.district), s.svgId + ' ссылается на район ' + s.district);

const counts = {};
for (const s of SUBJECTS) counts[s.district] = (counts[s.district] || 0) + 1;
assert.deepEqual(counts, EXPECTED, 'состав районов строго по списку + 4 новых');

const schematic = SUBJECTS.filter((s) => s.schematic).map((s) => s.svgId).sort();
assert.deepEqual(schematic, ['RU-DNR', 'RU-KHE', 'RU-LNR', 'RU-ZAP'], 'схематичных ровно 4');

// Собранная страница содержит все 89 контуров
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
for (const s of SUBJECTS) assert.ok(html.includes('id="' + s.svgId + '"'), 'в index.html нет ' + s.svgId);
assert.ok(!html.includes('http://') || html.includes('http://www.w3.org'), 'нет внешних запросов');
assert.ok(html.includes('alexTitakoff'), 'атрибуция карты в подвале');
assert.ok(html.includes('Новые регионы'), 'врезка новых регионов на месте');
assert.ok(html.includes('<title>Москва</title>'), 'русские title в контурах');
assert.ok(html.includes('Что такое экономические районы'), 'экран теории на месте');

// R01.5: NEIGHBORS симметрично (a–b значит b–a)
assert.ok(NEIGHBORS && typeof NEIGHBORS === 'object', 'NEIGHBORS экспортируется');
for (const [a, bs] of Object.entries(NEIGHBORS))
  for (const b of bs)
    assert.ok(NEIGHBORS[b] && NEIGHBORS[b].includes(a), 'асимметрия: ' + a + '-' + b);

// R01.5: только известные svgId из SUBJECTS
{
  const known = new Set(SUBJECTS.map((s) => s.svgId));
  for (const [a, bs] of Object.entries(NEIGHBORS)) {
    assert.ok(known.has(a), 'неизвестный id в NEIGHBORS: ' + a);
    for (const b of bs) assert.ok(known.has(b), 'неизвестный сосед ' + b + ' у ' + a);
    assert.ok(!bs.includes(a), 'петля: ' + a);
  }
}

// R01.5: у каждого региона из матрицы ≥1 сосед
for (const [a, bs] of Object.entries(NEIGHBORS))
  assert.ok(Array.isArray(bs) && bs.length >= 1, 'без соседей в матрице: ' + a);

// R01.5: Калининград и Сахалин — без соседей, в режиме не участвуют
for (const iso of ['RU-KGD', 'RU-SAK'])
  assert.ok(!(iso in NEIGHBORS) || NEIGHBORS[iso].length === 0, iso + ' должен быть без соседей');

console.log('data.test.js: OK (89 субъектов, 12 районов, index.html покрыт)');
