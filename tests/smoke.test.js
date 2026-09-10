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
['tip', 'legend', 'district-btns', 'q-title', 'q-hint', 'q-msg', 'btn-hint', 'btn-giveup',
 'btn-finish', 'btn-done', 'q-progress', 'zoom-in', 'zoom-out', 'zoom-reset', 'res-score',
 'res-districts', 'btn-retry-errors', 'btn-study', 'btn-mode-sd', 'btn-mode-ds',
 'btn-errors', 'btn-reset', 'btn-again', 'strict'].forEach((id) => { els[id] = makeEl(id); });
els.strict.checked = false;

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
global.window = { scrollTo: () => {}, GEO_DATA: require('../src/data.js'), GEO_QUIZ: require('../src/quiz.js') };
global.document = {
  getElementById: (id) => {
    assert.ok(els[id], 'document.getElementById(' + id + ') — нет такого элемента');
    return els[id];
  },
  createElement: (tag) => makeEl(tag + Math.random()),
  querySelectorAll: () => [],
};
global.self = global.window;

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
assert.equal(store['geo-trainer-v1'], '{"ok":{},"asked":{},"errors":[]}', 'хранилище сброшено');

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

