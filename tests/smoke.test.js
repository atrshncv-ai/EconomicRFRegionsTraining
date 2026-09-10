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

