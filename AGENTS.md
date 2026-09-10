<!-- autopilot:start -->
# Геотренажёр экономических районов РФ

Интерактивный тренажёр по экономическим районам России и субъектам в их составе (статика без сервера, офлайн, без зависимостей).

## Команды

| Команда | Что делает |
|---------|------------|
| `python3 build.py` | Собрать `index.html` из `src/` + карты |
| `node --test tests/data.test.js tests/quiz.test.js tests/smoke.test.js` | Прогнать тесты (data + quiz + smoke, 3 файла) |
| `open index.html` | Открыть собранный тренажёр локально |

## Структура

- `index.html` — собранный тренажёр (всё инлайн, не править вручную)
- `build.py` — сборка `src/template.html` + SVG-карта + `src/styles.css`/`data.js`/`quiz.js`/`app.js` → `index.html`
- `src/data.js` — `GEO_DATA`: `DISTRICTS` (12), `SUBJECTS` (89), UMD (браузер + node)
- `src/quiz.js` — `GEO_QUIZ`: чистые функции вопросов/проверки/раундов без DOM
- `src/app.js` — экраны, легенда, зум, прогресс в `localStorage geo-trainer-v1`
- `src/template.html` / `src/styles.css` — каркас с плейсхолдерами `/*__STYLES__*/`, `<!--__MAP__-->`, `/*__DATA__*/`, `/*__QUIZ__*/`, `/*__APP__*/`
- `vendor/map.svg` — карта для сборки (основа alexTitakoff/svg-map-Russia, атрибуция в коде/подвале)
- `ru.svg` — исходник карты от пользователя, в сборке не участвует, не трогать
- `tests/data.test.js` / `tests/quiz.test.js` / `tests/smoke.test.js` — швы `GEO_DATA` / `GEO_QUIZ` / связка template↔app
- `.autopilot/geo-trainer/interfaces.md` — накопленные границы и правила сборки

## Подводные камни

- Карта для сборки — только `vendor/map.svg`, внешних путей нет: правки карты сразу попадают в `index.html` через `python3 build.py`.
- `build.py` падает `assert «нет контуров»`, если хоть один `svgId` из `src/data.js` отсутствует в SVG.
- `RU-DNR`/`RU-LNR`/`RU-ZAP`/`RU-KHE` — `schematic: true`, дорисовываются прямоугольниками во врезку «Новые регионы*», геометрии в карте нет.
- `RU-VOR` в `src/data.js` — осознанно Воронежская область (в SVG-исходнике дубль подписи `RU-STA`), обратно не «чинить».
- Состав районов зафиксирован `tests/data.test.js` (`EXPECTED` по 12 районам, 89/уникальность): данные менять только вместе с тестом.
- `src/quiz.js` без DOM: детерминизм только через явный `rng` (`makeRng`), без аргумента `shuffle`/`pick` уходят на `Math.random`.
- Раунд `subject-district` — 10 вопросов, `district-subjects` — 6; `btn-hint` скрыта в строгом режиме и в `district-subjects`.
- Счёт `+2` с первой попытки / `+1` со второй–третьей / `+0` с подсказкой, итог `score/(2*total)`; `startErrors` берёт последние 30 ошибок.
- `next()` после `finish()` — no-op по `G === null` («Мне хватит» до срабатывания таймера игру не роняет).
- Без `localStorage` игра молча работает в памяти (`storageOK=false` в `src/app.js`).
- Города `RU-MOW`/`RU-SPE`/`RU-SEV` — класс `city` с широкой прозрачной обводкой ради зоны клика.
- `tests/data.test.js` требует офлайна: в `index.html` нет `http://`, кроме `w3.org`.
- `tests/smoke.test.js` на поддельном DOM: каждый `getElementById` из `src/app.js` обязан существовать в `src/template.html`.
- Зависимостей нет: недостающее из сети не ставить, вернуть `BLOCKED`.

## Как здесь работает Autopilot

Сборка ведётся навыком `/autopilot`. Требования, спецификация и таски — в `.autopilot/`.
Прогресс — `.autopilot/dashboard.html`. Правило: требование из `manifest.md`
может снять только пользователь.

Если работа продолжается — скажи «продолжи автопилот»: состояние поднимется
из `.autopilot/state.js`, переспрашивать ничего не нужно.
<!-- autopilot:end -->
