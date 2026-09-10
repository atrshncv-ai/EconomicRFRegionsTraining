// Сквозная проверка связки template ↔ app.js на поддельном DOM:
// несуществующий id падает, клики идут через те же слушатели, что в браузере.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { SUBJECTS } = require('../src/data.js');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
// Все id, к которым обращается app.js, есть в шаблоне
const used = [...html.matchAll(/getElementById\('([^']+)'\)/g)].map((m) => m[1]);
const inTpl = new Set([...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
for (const id of new Set(used)) assert.ok(inTpl.has(id), 'app.js требует #' + id + ', а в template его нет');

function makeEl(id) {
  const listeners = {};
  const el = {
    id, listeners, children: [],
    dataset: {}, style: {}, hidden: false,
    textContent: '', _innerHTML: '',
    classList: {
      _s: new Set(),
      add: (...c) => c.forEach((x) => el.classList._s.add(x)),
      remove: (...c) => c.forEach((x) => el.classList._s.delete(x)),
      toggle: (c, f) => (f ? el.classList._s.add(c) : el.classList._s.delete(c)),
      contains: (c) => el.classList._s.has(c),
    },
    setAttribute: () => {},
    addEventListener: (t, fn) => ((listeners[t] = listeners[t] || []).push(fn)),
    appendChild: (c) => el.children.push(c),
    closest: () => null,
    querySelectorAll: () => [],
    click: () => {},
  };
  Object.defineProperty(el, 'innerHTML', {
    get: () => el._innerHTML,
    set: (v) => { el._innerHTML = v; if (v === '') el.children = []; },
  });
  return el;
}

const els = {};
['home', 'study', 'game', 'result'].forEach((s) => { els['screen-' + s] = makeEl('screen-' + s); });
['tip', 'legend', 'legend-list', 'district-btns', 'q-title', 'q-hint', 'q-msg', 'btn-hint', 'btn-giveup',
  'btn-finish', 'btn-done', 'q-progress', 'q-timer', 'sound', 'zoom-in', 'zoom-out', 'zoom-reset', 'res-score',
  'res-time', 'res-districts', 'res-history', 'btn-retry-errors', 'btn-study', 'btn-mode-sd', 'btn-mode-ds',
  'btn-errors', 'btn-reset', 'btn-again', 'strict', 'theme', 'btn-print', 'print-list', 'btn-mode-nb',
  'ds-eco', 'ds-fo'].forEach((id) => { els[id] = makeEl(id); });
els.strict.checked = false;
els.theme.checked = false;
els.sound.checked = true;

const svgPaths = SUBJECTS.map((s) => {
  const p = makeEl(s.svgId);
  p.id = s.svgId;
  return p;
});
const svg = makeEl('map');
svg.querySelectorAll = () => svgPaths;
svg.getScreenCTM = () => ({ inverse: () => ({}) });
svg.createSVGPoint = () => ({});
els.map = svg;

const store = {};
global.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
};
global.window = { scrollTo: () => {}, GEO_DATA: require('../src/data.js'), GEO_QUIZ: require('../src/quiz.js'),
  GEO_SOUND: require('../src/sound.js') };
global.document = {
  getElementById: (id) => {
    assert.ok(els[id], 'document.getElementById(' + id + ') — нет такого элемента');
    return els[id];
  },
  createElement: (tag) => makeEl(tag + Math.random()),
  querySelectorAll: () => [],
};
global.self = global.window;

const docListeners = {};
global.document.addEventListener = (t, fn) => ((docListeners[t] = docListeners[t] || []).push(fn));
global.document.hidden = false;
function fireDoc(type) {
  (docListeners[type] || []).forEach((fn) => fn({}));
}

require('../src/app.js');

function fire(el, type, ev) {
  (el.listeners[type] || []).forEach((fn) => fn(Object.assign({ target: el, preventDefault: () => {} }, ev)));
}

// Старт: виден только home
assert.equal(els['screen-home'].hidden, false);
assert.equal(els['screen-game'].hidden, true);

// Режим «Субъект → район»: вопрос отрисован, отвечаем верно
fire(els['btn-mode-sd'], 'click');
assert.equal(els['screen-game'].hidden, false);
assert.ok(els['q-title'].textContent.length > 5);
// Кнопки районов созданы (12)
assert.equal(els['district-btns'].children.length, 12);
assert.equal(els.legend.children.length, 12, 'легенда: 12 районов');
// Находим кнопку правильного района и кликаем через делегированный слушатель
const want = SUBJECTS.find((s) => els['q-title'].textContent.includes(s.name));
assert.ok(want, 'вопрос про известный субъект');
const btn = els['district-btns'].children.find((b) => b.dataset.district === want.district);
assert.ok(btn, 'кнопка правильного района существует');
btn.closest = () => btn;
fire(els['district-btns'], 'click', { target: btn });
assert.ok(els['q-msg'].textContent.includes('Верно'), 'верный ответ засчитан: ' + els['q-msg'].textContent);

console.log('smoke.test.js: OK (экраны, вопрос, верный ответ, 12 кнопок)');

// В игре карта нейтральная: ни вопрос, ни мышь по легенде не красят районы
const NEUTRAL = '#cfd8e3';
assert.ok(svgPaths.every((p) => p.style.fill === NEUTRAL), 'карта в игре нейтральная');
fire(els.legend.children[0], 'mouseleave');
assert.ok(svgPaths.every((p) => p.style.fill === NEUTRAL), 'легенда в игре карту не перекрашивает');
fire(els['btn-mode-ds'], 'click');
assert.ok(els['q-title'].textContent.includes('Покажи на карте'));
const GEO = require('../src/data.js');
const dWant = GEO.DISTRICTS.find((d) => els['q-title'].textContent.includes(d.name));
assert.ok(dWant, 'район вопроса известен');
const member = GEO.SUBJECTS.find((s) => s.district === dWant.id);
const pathEl = svgPaths[GEO.SUBJECTS.indexOf(member)];
fire(svg, 'click', { target: pathEl });
fire(els['btn-done'], 'click');
assert.ok(/Найдено|Верно/.test(els['q-msg'].textContent), 'подсчёт найден/пропущен: ' + els['q-msg'].textContent);

console.log('smoke.test.js: OK (район→субъекты: клик по карте + Готово)');

// --- Ветки, не покрытые раньше ---
// Чистим ошибки прошлых шагов, чтобы раунд ошибок был детерминирован
fire(els['btn-reset'], 'click');
function sdQuestion() {
  fire(els['btn-mode-sd'], 'click');
  const w = GEO.SUBJECTS.find((s) => els['q-title'].textContent.includes(s.name));
  assert.ok(w, 'вопрос про известный субъект');
  return w;
}
function wrongBtnFor(w) {
  return els['district-btns'].children.find((b) => b.dataset.district !== w.district);
}

// Строгий режим прячет подсказку
els.strict.checked = true;
sdQuestion();
assert.equal(els['btn-hint'].hidden, true, 'в строгом режиме подсказки нет');
els.strict.checked = false;

// Неверный ответ: «Мимо», метка tried, с 3-й — показ правильного
sdQuestion();
const w1 = GEO.SUBJECTS.find((s) => els['q-title'].textContent.includes(s.name));
const wb = wrongBtnFor(w1);
wb.closest = () => wb;
fire(els['district-btns'], 'click', { target: wb });
assert.ok(els['q-msg'].textContent.includes('Мимо'), 'промах комментируется');
assert.ok(wb.classList.contains('tried'), 'кнопка промаха помечена');
fire(els['district-btns'], 'click', { target: wb });
fire(els['district-btns'], 'click', { target: wb });
assert.ok(els['q-msg'].textContent.includes('Правильно:'), 'с 3-й попытки ответ раскрыт');

// Подсказка обнуляет балл, но игра идёт
sdQuestion();
fire(els['btn-hint'], 'click');
assert.ok(els['q-msg'].textContent.includes('подсвечен'), 'подсказка дана');

// «Не знаю» ведёт к следующему вопросу
fire(els['btn-giveup'], 'click');
assert.ok(els['q-progress'].textContent.includes('Вопрос 2'), 'после «Не знаю» — вопрос 2');

// «Мне хватит» — досрочный результат
fire(els['btn-finish'], 'click');
assert.equal(els['screen-result'].hidden, false, 'результат показан');
assert.ok(els['res-score'].textContent.includes('из 20'), 'счёт вида «X из 20»');

// Ошибки копятся и переигрываются
assert.equal(els['btn-retry-errors'].hidden, false, 'кнопка работы над ошибками видна');
fire(els['btn-retry-errors'], 'click');
assert.equal(els['screen-game'].hidden, false, 'раунд ошибок стартовал');
assert.ok(els['q-title'].textContent.includes('Какой экономический район'), 'ошибка по субъекту переиграна');
fire(els['btn-finish'], 'click');

// Сброс чистит прогресс
fire(els['btn-again'], 'click');
fire(els['btn-reset'], 'click');
assert.equal(els['btn-errors'].hidden, true, 'после сброса ошибок нет');
assert.equal(store['geo-trainer-v1'], '{"dataset":"eco","ok":{"eco":{},"fo":{}},"asked":{"eco":{},"fo":{}},"errors":[],"history":[],"sound":true}', 'хранилище сброшено (неймспейсы eco/fo)');

// Район→субъекты: Enter с клавиатуры, промах, «Готово» с пропусками.
// Калининград из 1 субъекта для этого сценария не годится — перевыбираем.
let d2 = null;
for (let t = 0; t < 20 && !(d2 && GEO.SUBJECTS.filter((s) => s.district === d2.id).length > 1); t++) {
  fire(els['btn-mode-ds'], 'click');
  d2 = GEO.DISTRICTS.find((d) => els['q-title'].textContent.includes(d.name));
}
const mem = GEO.SUBJECTS.find((s) => s.district === d2.id);
const memPath = svgPaths[GEO.SUBJECTS.indexOf(mem)];
fire(svg, 'keydown', { target: memPath, key: 'Enter' });
assert.ok(memPath.classList.contains('good'), 'выбор с клавиатуры работает');
const alien = GEO.SUBJECTS.find((s) => s.district !== d2.id);
const alienPath = svgPaths[GEO.SUBJECTS.indexOf(alien)];
fire(svg, 'click', { target: alienPath });
assert.ok(els['q-msg'].textContent.includes('не входит'), 'чужой регион отклонён');
fire(els['btn-done'], 'click');
assert.ok(els['q-msg'].textContent.includes('Пропущены'), 'пропуски перечислены');
fire(els['btn-finish'], 'click');
assert.equal(els['screen-result'].hidden, false, 'финал после второго режима');

console.log('smoke.test.js: OK (ветки: мимо/подсказка/сдача/финиш/ошибки/сброс/клавиатура)');

// --- Таск 03, шов soundFor (спека: звук — синтез, без файлов) ---
// Свойства из спеки без кода: 4 события дают 4 различимые спеки,
// correct выше wrong по тону, все длительности > 0.
const SOUND = require('../src/sound.js');
{
  const specs = ['correct', 'wrong', 'finish', 'click'].map((e) => SOUND.soundFor(e));
  specs.forEach((s) => {
    assert.equal(typeof s.freq, 'number', 'частота — число');
    assert.equal(typeof s.dur, 'number', 'длительность — число');
    assert.ok(s.dur > 0, 'длительность положительна');
  });
  assert.equal(new Set(specs.map((s) => s.freq + '/' + s.dur)).size, 4, '4 события различимы');
  assert.ok(SOUND.soundFor('correct').freq > SOUND.soundFor('wrong').freq, 'верно выше неверного по тону');
}
assert.equal(typeof SOUND.play, 'function', 'play(spec) выставлен');

console.log('smoke.test.js: OK (шов soundFor: 4 события различимы)');

// --- Таск 03, smoke: звук вызван на верном/неверном (стаб play) ---
const soundCalls = [];
window.GEO_SOUND.play = (spec) => { soundCalls.push(spec); return true; };
fire(els['btn-mode-sd'], 'click');
{
  const w = GEO.SUBJECTS.find((s) => els['q-title'].textContent.includes(s.name));
  const okb = els['district-btns'].children.find((b) => b.dataset.district === w.district);
  okb.closest = () => okb;
  fire(els['district-btns'], 'click', { target: okb });
  assert.deepEqual(soundCalls[soundCalls.length - 1], { freq: 660, dur: 0.12 }, 'верный ответ озвучен');
}
fire(els['btn-mode-sd'], 'click');
{
  const w = GEO.SUBJECTS.find((s) => els['q-title'].textContent.includes(s.name));
  const wb2 = els['district-btns'].children.find((b) => b.dataset.district !== w.district);
  wb2.closest = () => wb2;
  fire(els['district-btns'], 'click', { target: wb2 });
  assert.deepEqual(soundCalls[soundCalls.length - 1], { freq: 180, dur: 0.25 }, 'промах озвучен');
}
fire(els['btn-finish'], 'click');

console.log('smoke.test.js: OK (звук на верном/неверном через стаб play)');

// --- Таск 03, smoke: тумблер глушит звук, выбор запоминается ---
{
  const n0 = soundCalls.length;
  els.sound.checked = false;
  fire(els.sound, 'change');
  fire(els['btn-mode-sd'], 'click');
  const w = GEO.SUBJECTS.find((s) => els['q-title'].textContent.includes(s.name));
  const okb = els['district-btns'].children.find((b) => b.dataset.district === w.district);
  okb.closest = () => okb;
  fire(els['district-btns'], 'click', { target: okb });
  assert.equal(soundCalls.length, n0, 'выключенный звук молчит на верном ответе');
  assert.equal(JSON.parse(store['geo-trainer-v1']).sound, false, 'выбор «без звука» запомнен');
  els.sound.checked = true;
  fire(els.sound, 'change');
  assert.equal(JSON.parse(store['geo-trainer-v1']).sound, true, 'включение запомнено');
}
fire(els['btn-finish'], 'click');

console.log('smoke.test.js: OK (тумблер глушит и запоминается)');

// --- Таск 03, smoke: секундомер виден, быстрый верный ответ даёт +1 ---
// Арифметика вручную из спеки: +2 с первой попытки и +1 бонус (<8 с,
// без подсказки) = 3; итог одного вопроса из раунда на 10 — «3 из 20».
fire(els['btn-mode-sd'], 'click');
assert.match(els['q-timer'].textContent, /Время/, 'секундомер виден в игре');
{
  const w = GEO.SUBJECTS.find((s) => els['q-title'].textContent.includes(s.name));
  const okb = els['district-btns'].children.find((b) => b.dataset.district === w.district);
  okb.closest = () => okb;
  fire(els['district-btns'], 'click', { target: okb });
  fire(els['btn-finish'], 'click');
  assert.ok(els['res-score'].textContent.indexOf('3 из 20') === 0,
    'быстрый верный: 2+1 бонус, итог: ' + els['res-score'].textContent);
  assert.match(els['res-time'].textContent, /Время раунда/, 'время (итог) на экране результата');
}

console.log('smoke.test.js: OK (секундомер и бонус за скорость)');

// --- Таск 03, smoke: история пишется (дата/счёт/всего), кап — 20, на результате — 5 ---
// Числа 20/5 и поля записи — дословно из спецификации (Решения: история).
function fastWin() {
  fire(els['btn-mode-sd'], 'click');
  const w = GEO.SUBJECTS.find((s) => els['q-title'].textContent.includes(s.name));
  const okb = els['district-btns'].children.find((b) => b.dataset.district === w.district);
  okb.closest = () => okb;
  fire(els['district-btns'], 'click', { target: okb });
  fire(els['btn-finish'], 'click');
}
fire(els['btn-again'], 'click');
fire(els['btn-reset'], 'click');
fastWin();
{
  const st = JSON.parse(store['geo-trainer-v1']);
  assert.equal(st.history.length, 1, 'игра записана в историю');
  assert.equal(st.history[0].score, 3, 'счёт с бонусом за скорость');
  assert.equal(st.history[0].total, 20, 'всего = 2 × 10 вопросов');
  assert.ok(Date.parse(st.history[0].date) > 0, 'дата игры валидна');
  assert.equal(els['res-history'].children.length, 1, 'последняя игра видна в результате');
}
for (let k = 0; k < 20; k++) fastWin();
{
  const st = JSON.parse(store['geo-trainer-v1']);
  assert.equal(st.history.length, 20, 'хранятся последние 20 игр');
  assert.equal(els['res-history'].children.length, 5, 'на результате — последние 5');
}

console.log('smoke.test.js: OK (история: запись, кап 20, последние 5)');

// --- Таск 03, smoke: скрытая вкладка — пауза, бонус за скорость не сгорает ---
// Вручную: 3 с вопрос + 60 с скрыта + 2 с = 5 с видимых (<8 с) → «3 из 20»;
// без паузы было бы 65 с и бонуса бы не было («2 из 20»).
{
  const realNow = Date.now;
  let now = 1000000;
  Date.now = () => now;
  try {
    fire(els['btn-mode-sd'], 'click');
    now += 3000;
    global.document.hidden = true;
    fireDoc('visibilitychange');
    now += 60000;
    global.document.hidden = false;
    fireDoc('visibilitychange');
    now += 2000;
    const w = GEO.SUBJECTS.find((s) => els['q-title'].textContent.includes(s.name));
    const okb = els['district-btns'].children.find((b) => b.dataset.district === w.district);
    okb.closest = () => okb;
    fire(els['district-btns'], 'click', { target: okb });
    fire(els['btn-finish'], 'click');
    assert.ok(els['res-score'].textContent.indexOf('3 из 20') === 0,
      'скрытое время исключено, бонус дан: ' + els['res-score'].textContent);
  } finally {
    Date.now = realNow;
  }
}

console.log('smoke.test.js: OK (пауза при скрытой вкладке)');

// --- Таск 04, smoke: легенда-список (R01.2, история 2) ---
// Из спеки: клик по району в легенде в «Изучении» открывает список субъектов,
// клик по названию подсвечивает контур; в игре легенда списков не открывает.
fire(els['btn-study'], 'click');
assert.equal(els['screen-study'].hidden, false, 'изучение открыто');
fire(els.legend.children[0], 'click');
assert.equal(els['legend-list'].children.length, 13, 'Центральный район: 13 субъектов списком');
{
  const b0 = els['legend-list'].children[0];
  const s0 = GEO.SUBJECTS.find((s) => s.svgId === b0.dataset.svgId);
  assert.ok(s0 && s0.district === 'central', 'список — субъекты кликнутого района');
  fire(b0, 'click');
  assert.ok(svgPaths[GEO.SUBJECTS.indexOf(s0)].classList.contains('active-q'), 'клик по названию подсветил контур');
}
fire(els['btn-mode-sd'], 'click');
{
  const n0 = els['legend-list'].children.length;
  fire(els.legend.children[1], 'click');
  assert.equal(els['legend-list'].children.length, n0, 'в игре легенда списков не открывает');
}
fire(els['btn-finish'], 'click');

console.log('smoke.test.js: OK (легенда-список: открыт, подсветка, в игре молчит)');

// --- Таск 04, smoke: контрастная тема (R01.6, история 6) ---
// Из спеки: переключатель, выбор запоминается, карта в игре нейтральна в обеих темах.
els.theme.checked = true;
fire(els.theme, 'change');
assert.equal(JSON.parse(store['geo-trainer-v1']).theme, 'contrast', 'тема запомнена');
fire(els['btn-mode-sd'], 'click');
assert.ok(svgPaths.every((p) => p.style.fill === NEUTRAL), 'карта в игре нейтральна и в контрастной теме');
fire(els['btn-finish'], 'click');
els.theme.checked = false;
fire(els.theme, 'change');
assert.equal(JSON.parse(store['geo-trainer-v1']).theme, 'light', 'возврат к обычной теме запомнен');

console.log('smoke.test.js: OK (тема: переключатель, память, нейтральная карта в игре)');

// --- Таск 04, smoke: печать состава (R01.4, история 4) ---
// Из спеки: кнопка «Печать», печатная версия — районы и списки (карта-игры нет).
assert.ok(html.includes('@media print'), 'печатный CSS в сборке');
function texts(el) {
  let out = [el.textContent || ''];
  el.children.forEach((c) => { out.push(texts(c)); });
  return out.join(' ');
}
assert.equal(els['print-list'].children.length, 12, 'печатный состав: 12 районов');
assert.ok(texts(els['print-list']).includes('Центральный'), 'печатный состав: названия районов');
assert.ok(texts(els['print-list']).includes('Москва'), 'печатный состав: названия субъектов');
{
  let printed = 0;
  global.window.print = () => { printed++; };
  fire(els['btn-print'], 'click');
  assert.equal(printed, 1, 'кнопка «Печать» печатает');
}

console.log('smoke.test.js: OK (печать: кнопка, 12 районов со списками)');

// --- Таск 04, smoke: режим «соседи» (R01.5, история 5) ---
// Из спеки: называют субъект — кликаем граничащих; вопрос только по регионам
// с ≥1 соседом (без соседей — Калининград и Сахалин — не выпадают).
function nbSubject() {
  const w = GEO.SUBJECTS.find((s) => els['q-title'].textContent.includes(s.name));
  assert.ok(w, 'вопрос про известный субъект');
  return w;
}
fire(els['btn-mode-nb'], 'click');
assert.equal(els['screen-game'].hidden, false, 'режим соседей стартовал');
assert.match(els['q-title'].textContent, /сосед/i, 'вопрос про соседей');
{
  const w = nbSubject();
  assert.ok((GEO.NEIGHBORS[w.svgId] || []).length >= 1, 'у субъекта есть соседи');
}
for (let t = 0; t < 15; t++) {
  fire(els['btn-mode-nb'], 'click');
  const w = nbSubject();
  assert.ok(!['RU-KGD', 'RU-SAK'].includes(w.svgId), 'регион без соседей не выпадает');
}
{
  let w = null;
  for (let t = 0; t < 20; t++) {
    fire(els['btn-mode-nb'], 'click');
    w = nbSubject();
    if ((GEO.NEIGHBORS[w.svgId] || []).length > 1) break;
  }
  const nbs = GEO.NEIGHBORS[w.svgId];
  assert.ok(nbs.length > 1, 'нашёлся субъект с 2+ соседями');
  nbs.forEach((id) => {
    fire(svg, 'click', { target: svgPaths[GEO.SUBJECTS.findIndex((s) => s.svgId === id)] });
  });
  fire(els['btn-done'], 'click');
  assert.match(els['q-msg'].textContent, /Верно/, 'все соседи найдены: ' + els['q-msg'].textContent);
}
{
  let w = null;
  for (let t = 0; t < 20; t++) {
    fire(els['btn-mode-nb'], 'click');
    w = nbSubject();
    if ((GEO.NEIGHBORS[w.svgId] || []).length > 1) break;
  }
  const first = GEO.NEIGHBORS[w.svgId][0];
  fire(svg, 'click', { target: svgPaths[GEO.SUBJECTS.findIndex((s) => s.svgId === first)] });
  fire(els['btn-done'], 'click');
  assert.match(els['q-msg'].textContent, /Пропущены/, 'пропуски перечислены: ' + els['q-msg'].textContent);
}
fire(els['btn-finish'], 'click');
assert.equal(els['screen-result'].hidden, false, 'финал после соседей');

console.log('smoke.test.js: OK (соседи: клик+Готово, разбор, без соседей не выпадают)');

// --- ФО-02, smoke: переключатель набора (история 1, шов setDataset) ---
// Из спеки: «Экономические / Федеральные» на главной; 12 районов vs 8 округов.
assert.ok(html.includes('ds-fo'), 'переключатель ФО в сборке');
assert.equal(typeof window.GEO_APP.setDataset, 'function', 'шов setDataset выставлен');
assert.equal(els.legend.children.length, 12, 'старт: 12 экон. районов в легенде');
fire(els['ds-fo'], 'click');
assert.equal(window.GEO_APP.getDataset(), 'fo', 'активный набор — fo');
assert.equal(els.legend.children.length, 8, 'ФО: 8 округов в легенде');
assert.equal(els['district-btns'].children.length, 8, 'ФО: 8 кнопок округов в игре');
fire(els['ds-eco'], 'click');
assert.equal(window.GEO_APP.getDataset(), 'eco', 'возврат — eco');
assert.equal(els.legend.children.length, 12, 'снова 12 районов');

console.log('smoke.test.js: OK (ФО: переключатель 12/8)');

// --- ФО-02, smoke: вопрос по ФО (история 1) ---
// Из спеки: «Субъект→округ (8 кнопок)»; вопрос называет федеральный округ,
// ответ — по составу ФО (оракул — FO_OF из данных, не код приложения).
fire(els['ds-fo'], 'click');
fire(els['btn-mode-sd'], 'click');
assert.match(els['q-title'].textContent, /федеральный округ/, 'вопрос ФО: ' + els['q-title'].textContent);
assert.equal(els['district-btns'].children.length, 8, '8 кнопок округов');
{
  const w = GEO.SUBJECTS.find((s) => els['q-title'].textContent.includes(s.name));
  assert.ok(w, 'вопрос про известный субъект');
  const foWant = GEO.FO_OF[w.svgId];
  assert.ok(foWant, 'субъект есть в FO_OF');
  const okb = els['district-btns'].children.find((b) => b.dataset.district === foWant);
  assert.ok(okb, 'кнопка верного округа существует: ' + foWant);
  okb.closest = () => okb;
  fire(els['district-btns'], 'click', { target: okb });
  assert.ok(els['q-msg'].textContent.includes('Верно'), 'верный округ засчитан: ' + els['q-msg'].textContent);
}
fire(els['btn-finish'], 'click');
fire(els['ds-eco'], 'click');

console.log('smoke.test.js: OK (ФО: вопрос субъект→округ, 8 кнопок, верный ответ)');

// --- ФО-02, smoke: легенда с центром (история 3, R10) ---
// Из брифа дословно: ЦФО — центр Москва, «18 (17 областей и 1 город)»;
// ДВФО — центр Владивосток (с декабря 2018 года).
fire(els['ds-fo'], 'click');
{
  const labels = els.legend.children.map((b) => b.innerHTML);
  assert.equal(labels.length, 8, '8 округов в легенде');
  const cfo = labels.find((t) => t.includes('ЦФО'));
  assert.ok(cfo && cfo.includes('Москва'), 'ЦФО: центр Москва: ' + cfo);
  assert.ok(cfo.includes('18') && cfo.includes('17 областей') && cfo.includes('1 город'),
    'ЦФО: счёт 18 с разбивкой: ' + cfo);
  const dv = labels.find((t) => t.includes('ДВФО'));
  assert.ok(dv && dv.includes('Владивосток'), 'ДВФО: центр Владивосток: ' + dv);
  assert.ok(dv.includes('2018'), 'ДВФО: пометка про 2018: ' + dv);
  assert.ok(dv.includes('11'), 'ДВФО: 11 субъектов: ' + dv);
  const sz = labels.find((t) => t.includes('СЗФО'));
  assert.ok(sz && sz.includes('Санкт-Петербург') && sz.includes('11'), 'СЗФО: центр и счёт: ' + sz);
  const yu = labels.find((t) => t.includes('ЮФО'));
  assert.ok(yu && yu.includes('Ростов-на-Дону') && yu.includes('12'), 'ЮФО: центр и 12: ' + yu);
}
fire(els['ds-eco'], 'click');

console.log('smoke.test.js: OK (ФО: легенда с центром и счётом)');

// --- ФО-02, smoke: статистика раздельно (история 1, решения) ---
// Из спеки: asked/ok/errors/history/веса — раздельно (eco/fo),
// переключение прогресс не смешивает.
fire(els['btn-again'], 'click');
fire(els['btn-reset'], 'click');
fire(els['ds-eco'], 'click');
function ecoWrongOnce() {
  fire(els['btn-mode-sd'], 'click');
  const w = GEO.SUBJECTS.find((s) => els['q-title'].textContent.includes(s.name));
  assert.ok(w, 'эко-вопрос про известный субъект');
  const wb = els['district-btns'].children.find((b) => b.dataset.district !== w.district);
  wb.closest = () => wb;
  fire(els['district-btns'], 'click', { target: wb });
  fire(els['district-btns'], 'click', { target: wb });
  fire(els['district-btns'], 'click', { target: wb });
  fire(els['btn-finish'], 'click');
}
function foWrongOnce() {
  fire(els['btn-mode-sd'], 'click');
  assert.match(els['q-title'].textContent, /федеральный округ/);
  const w = GEO.SUBJECTS.find((s) => els['q-title'].textContent.includes(s.name));
  assert.ok(w, 'фо-вопрос про известный субъект');
  const foWant = GEO.FO_OF[w.svgId];
  const wb = els['district-btns'].children.find((b) => b.dataset.district !== foWant);
  assert.ok(wb, 'есть неверный округ');
  wb.closest = () => wb;
  fire(els['district-btns'], 'click', { target: wb });
  fire(els['district-btns'], 'click', { target: wb });
  fire(els['district-btns'], 'click', { target: wb });
  fire(els['btn-finish'], 'click');
}
ecoWrongOnce();
{
  const st = JSON.parse(store['geo-trainer-v1']);
  assert.ok(Object.keys(st.asked.eco).length > 0, 'эко-статистика пишется в eco');
  assert.deepEqual(st.asked.fo, {}, 'fo пока пуст');
  assert.equal(st.errors.length, 1, 'одна эко-ошибка');
  assert.equal(st.errors[0].ds, 'eco', 'ошибка помечена eco');
}
fire(els['ds-fo'], 'click');
assert.equal(els['btn-errors'].hidden, true, 'в fo эко-ошибки не видны');
foWrongOnce();
{
  const st = JSON.parse(store['geo-trainer-v1']);
  assert.ok(Object.keys(st.asked.fo).length > 0, 'фо-статистика пишется в fo');
  assert.ok(Object.keys(st.asked.eco).length > 0, 'эко-статистика сохранилась');
  assert.equal(st.errors.length, 2, 'ошибки обоих наборов хранятся');
  assert.deepEqual(new Set(st.errors.map((e) => e.ds)), new Set(['eco', 'fo']), 'ошибки помечены наборами');
  assert.deepEqual(new Set(st.history.map((h) => h.ds)), new Set(['eco', 'fo']), 'история помечена наборами');
  const ecoKeys = new Set(Object.keys(st.asked.eco));
  for (const k of Object.keys(st.asked.fo)) assert.ok(!ecoKeys.has(k), 'ключи статистики не смешиваются: ' + k);
}
fire(els['ds-eco'], 'click');
assert.ok(els['btn-errors'].textContent.includes('(1)'), 'в eco одна ошибка, а не две: ' + els['btn-errors'].textContent);
fire(els['ds-fo'], 'click');
assert.ok(els['btn-errors'].textContent.includes('(1)'), 'в fo одна ошибка: ' + els['btn-errors'].textContent);
fire(els['ds-eco'], 'click');

console.log('smoke.test.js: OK (ФО: статистика/ошибки/история раздельно)');

// --- ФО-02, smoke: изучение красит по ФО + округ→субъекты на данных ФО ---
// Из спеки: изучение и округ→субъекты — на данных ФО; счётчики из состава:
// ЦФО 18, СЗФО 11, ЮФО 12, СКФО 7, ПФО 14, УрФО 6, СФО 10, ДВФО 11.
fire(els['ds-fo'], 'click');
fire(els['btn-study'], 'click');
{
  const foColor = {};
  GEO.FO_GROUPS.forEach((g) => { foColor[g.id] = g.color; });
  const mowIdx = GEO.SUBJECTS.findIndex((s) => s.svgId === 'RU-MOW');
  assert.equal(svgPaths[mowIdx].style.fill, foColor[GEO.FO_OF['RU-MOW']], 'Москва красится цветом ЦФО');
  assert.equal(GEO.FO_OF['RU-MOW'], 'cfo', 'оракул: Москва — ЦФО');
}
fire(els['btn-mode-ds'], 'click');
assert.ok(els['q-title'].textContent.includes('Покажи на карте'), 'вопрос округ→субъекты');
{
  const g = GEO.FO_GROUPS.find((x) => els['q-title'].textContent.includes(x.name));
  assert.ok(g, 'округ вопроса известен');
  const knownCounts = { cfo: 18, szfo: 11, yufo: 12, skfo: 7, pfo: 14, urfo: 6, sfo: 10, dvfo: 11 };
  const members = GEO.SUBJECTS.filter((s) => GEO.FO_OF[s.svgId] === g.id);
  assert.equal(members.length, knownCounts[g.id], 'состав округа по спеке: ' + g.id);
  members.forEach((s) => {
    fire(svg, 'click', { target: svgPaths[GEO.SUBJECTS.indexOf(s)] });
  });
  fire(els['btn-done'], 'click');
  assert.match(els['q-msg'].textContent, /Верно/, 'все субъекты округа найдены');
}
fire(els['btn-finish'], 'click');
fire(els['ds-eco'], 'click');

console.log('smoke.test.js: OK (ФО: изучение по ФО, округ→субъекты)');

// --- ФО-02, smoke: соседи группируют по ФО ---
// Из спеки: та же матрица NEIGHBORS, группировка по ФО (статистика — в fo-id).
fire(els['btn-reset'], 'click');
fire(els['ds-fo'], 'click');
fire(els['btn-mode-nb'], 'click');
assert.match(els['q-title'].textContent, /сосед/i, 'вопрос про соседей в ФО');
{
  const w = GEO.SUBJECTS.find((s) => els['q-title'].textContent.includes(s.name));
  assert.ok(w && (GEO.NEIGHBORS[w.svgId] || []).length >= 1, 'у субъекта есть соседи');
  const foId = GEO.FO_OF[w.svgId];
  GEO.NEIGHBORS[w.svgId].forEach((id) => {
    fire(svg, 'click', { target: svgPaths[GEO.SUBJECTS.findIndex((s) => s.svgId === id)] });
  });
  fire(els['btn-done'], 'click');
  assert.match(els['q-msg'].textContent, /Верно/, 'соседи найдены');
  fire(els['btn-finish'], 'click');
  const st = JSON.parse(store['geo-trainer-v1']);
  assert.ok(st.asked.fo[foId] >= 1, 'статистика соседей — в ФО-группе ' + foId);
  assert.deepEqual(st.asked.eco, {}, 'эко-статистика не тронута соседями ФО');
}
fire(els['ds-eco'], 'click');

console.log('smoke.test.js: OK (ФО: соседи группируют по ФО)');

