const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { DISTRICTS, SUBJECTS, NEIGHBORS, FO_GROUPS, FO_OF } = require('../src/data.js');

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

// R02-R09: ФО-набор — 8 групп
assert.ok(Array.isArray(FO_GROUPS), 'FO_GROUPS экспортируется');
assert.equal(FO_GROUPS.length, 8, 'федеральных округов должно быть 8');

// R02-R09: каждый из 89 ровно в одном ФО
{
  const known = new Set(SUBJECTS.map((s) => s.svgId));
  const keys = Object.keys(FO_OF);
  assert.equal(keys.length, 89, 'FO_OF покрывает 89 субъектов');
  assert.deepEqual(new Set(keys), known, 'FO_OF: все 89 ровно по одному');
}

// R02-R09: счётчики строго из сводки таска
{
  const counts = {};
  for (const fo of Object.values(FO_OF)) counts[fo] = (counts[fo] || 0) + 1;
  const foIds = new Set(FO_GROUPS.map((g) => g.id));
  for (const fo of Object.keys(counts)) assert.ok(foIds.has(fo), 'FO_OF ссылается на округ ' + fo);
  assert.deepEqual(counts, { cfo: 18, szfo: 11, yufo: 12, skfo: 7, pfo: 14, urfo: 6, sfo: 10, dvfo: 11 }, 'счётчики ФО строго по сводке');
  for (const iso of ['RU-DNR', 'RU-LNR', 'RU-ZAP', 'RU-KHE'])
    assert.equal(FO_OF[iso], 'yufo', iso + ' — в ЮФО');
}

// R10: центры непусты, у ДВФО пометка; своя палитра 8 вне 12 экон. цветов
{
  const byId = {};
  for (const g of FO_GROUPS) byId[g.id] = g;
  assert.deepEqual(FO_GROUPS.map((g) => g.abbr), ['ЦФО', 'СЗФО', 'ЮФО', 'СКФО', 'ПФО', 'УрФО', 'СФО', 'ДВФО'], 'аббревиатуры ФО');
  const centers = { cfo: 'Москва', szfo: 'Санкт-Петербург', yufo: 'Ростов-на-Дону', skfo: 'Пятигорск', pfo: 'Нижний Новгород', urfo: 'Екатеринбург', sfo: 'Новосибирск', dvfo: 'Владивосток' };
  for (const [id, center] of Object.entries(centers)) {
    assert.ok(byId[id], 'нет округа ' + id);
    assert.equal(byId[id].center, center, 'центр ' + id);
  }
  assert.ok(String(byId.dvfo.centerNote).includes('2018'), 'у ДВФО пометка про декабрь 2018');
  const foColors = FO_GROUPS.map((g) => String(g.color).toLowerCase());
  assert.equal(new Set(foColors).size, 8, 'палитра ФО: 8 разных цветов');
  const ecoColors = new Set(DISTRICTS.map((d) => String(d.color).toLowerCase()));
  for (const c of foColors) assert.ok(!ecoColors.has(c), 'цвет ФО пересекается с экон: ' + c);
}

// Шов ФО: известные члены каждого округа (из сводки таска) есть в карте сборки
{
  const members = { 'RU-MOW': 'cfo', 'RU-SPE': 'szfo', 'RU-SEV': 'yufo', 'RU-STA': 'skfo', 'RU-NIZ': 'pfo', 'RU-SVE': 'urfo', 'RU-NVS': 'sfo', 'RU-CHU': 'dvfo' };
  for (const [iso, fo] of Object.entries(members)) {
    assert.equal(FO_OF[iso], fo, iso + ' — в ' + fo);
    assert.ok(html.includes('id="' + iso + '"'), 'в index.html нет ' + iso);
  }
}

console.log('data.test.js: OK (89 субъектов, 12 районов, index.html покрыт)');
