<!-- autopilot:start -->
# Геотренажёр экономических районов РФ

Интерактивный тренажёр по экономическим районам России и субъектам в их составе (статика без сервера, офлайн, без зависимостей).

## Команды

| Команда | Что делает |
|---------|------------|
| `python3 build.py` | Собрать `index.html` из `src/` + карты |
| `node --test tests/data.test.js tests/quiz.test.js tests/smoke.test.js` | Прогнать тесты (data + quiz + smoke, 3 файла) |
| `open index.html` | Открыть собранный тренажёр локально |
| `python3 tools/build_neighbors.py` | Пересчитать `NEIGHBORS` из `vendor/map.svg` (stdout → в `src/data.js` вручную, сверка 0 расхождений) |

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
- `src/sound.js` — `GEO_SOUND`: `soundFor(event)`/`play(spec)`, UMD как `data.js`/`quiz.js`, в сборке отдельный `/*__SOUND__*/`
- `src/data.js` + `NEIGHBORS`: `{svgId: [svgId...]}` симметрично, 87 ключей, `RU-KGD`/`RU-SAK` вне матрицы
- `src/quiz.js` + `weightFor`/`weightsFromStats`/`neighborQuestion`/`bonusFor`; `buildRound(mode, subjects, districts, n, rng, weights)` только явная форма
- `src/app.js` + режимы `neighbors`/`errors`: секундомер `q-timer`, `history` (20/5), `theme`, `print-list`, `legend-list`, тумблер `sound`
- `src/template.html` + `/*__SOUND__*/`, ids `q-timer`/`legend-list`/`sound`/`theme`/`btn-print`/`print-list`/`btn-mode-nb`/`res-history`/`res-time`
- `tools/build_neighbors.py` — генератор соседства (геометрия `EPS=0.5` + `MANUAL` + анклавы), только stdlib
- `tests/*` расширены: `data` — симметрия/известные id/без петель; `quiz` — веса/бонус/соседи; `smoke` — звук/таймер/история/пауза/легенда/тема/печать/соседи
- `src/data.js` + `FO_GROUPS` (8: `id/имя/abbr/центр/centerNote/цвет`, своя палитра)/`FO_OF` (`svgId→foId`, 89, `cfo18/szfo11/yufo12/skfo7/pfo14/urfo6/sfo10/dvfo11`, новые 4 → `yufo`)
- `src/app.js` + `window.GEO_APP.setDataset/getDataset`, `src/template.html` ids `ds-eco/ds-fo`; неймспейсы `ok/asked={eco,fo}`, `errors/history` с `ds`; легенда `центр+счёт+разбивка`, печать обоих составов (активный первым, 20 разделов)
- `.autopilot/federal-districts/interfaces.md` — границы ФО-набора (швы `setDataset`, валидация, `subjFromTitle`)
- `.autopilot/geo-trainer/interfaces.md` — накопленные границы и правила сборки
- Актуальные границы — `.autopilot/extras/interfaces.md` (швы `weightFor`/`neighborQuestion`/`bonusFor`/`soundFor`)

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
- `tools/build_neighbors.py` обязан совпадать с `src/data.js` (0 расхождений, проверено): `assert` 85 контуров, `MANUAL` 8 рёбер, анклавы `MOW→MOS`/`SPE→LEN`/`SEV→CR`.
- `NEIGHBORS` симметрично без петель, только id из `SUBJECTS`; `neighborQuestion` без eligible возвращает `null`, `KGD`/`SAK` не выпадают.
- `weightFor`: `0→1`, `100→0.1` (пол), не-число→1; отсутствующий вес в `buildRound` = 1.
- `bonusFor` +1 лишь `attempt=1`, `<8с`, без подсказки; быстрый верный в `subject-district` = `3 из 20`.
- `soundFor`: 4 различимых (`correct 660/0.12`, `wrong 180/0.25`, `finish 880/0.4`, `click 440/0.07`); `play` без `AudioContext` — no-op.
- Секундомер через `visibleSeconds`, пауза по `visibilitychange` (`hiddenMs`/`roundHiddenMs`); уход с `game` в `show()` останавливает тимер.
- `store.history` кап 20, на результате последние 5; `store.theme` создаётся только явным переключением, `applyTheme` при сбое откатывается на `light`.
- `#legend-list` только в Изучении, в игре молчит; карта в игре нейтральная `#cfd8e3` в обеих темах.
- `#btn-print` → `window.print()`, `@media print` прячет карту-игру, `print-list` строится в JS (12 разделов).
- `btn-reset` чистит `ok`/`asked`/`errors`/`history`, но сохраняет `sound`/`theme`.
- Раунд соседи — 6 без повторов (`guard 200`); `startErrors` по-прежнему последние 30.
- `FO_OF` 89 ровно по одному зафиксирован `tests/data.test.js` (счётчики выше, `DNR/LNR/ZAP/KHE→yufo`); палитра ФО 8 вне 12 экон. цветов, `centerNote` только у `dvfo` (`2018`); `RU-VOR` и в ФО осознанно `cfo`.
- `setDataset` невалидное — no-op (возврат текущего); валидное перестраивает легенду/кнопки/печать/изучение + `paintStudy`/`refreshHome`, `dataset` persists в `store.dataset`.
- Миграция `ensureNs`: плоские `ok/asked` → `eco`, `errors/history` без `ds` → `eco`; кап `history` 20 на набор (`other+mine`), `startErrors`/веса/кнопка ошибок — фильтром своего `ds`; `btn-reset` чистит оба неймспейса + `errors/history`, хранит `sound/theme/dataset`.
- Легенда ФО `Имя (ABBR) — центр: X [(note)] — N: разбивка`; `typeOf` из названий (`область/край/республик/округ`, иначе `city`) + `plural`; `activeSubjects` подменяет `district=FO_OF`, ядро `quiz.js` generic не трогать.
- Печать 20 разделов (`12+8`), активный первым; заголовок ФО как легенда (центр+счёт+разбивка+`2018`); `subjFromTitle` в `tests/smoke.test.js` только точное `==` (`«»`/после `:`), `includes` запрещён (`NEN⊂YAN` ~10% флаков).

## Как здесь работает Autopilot

Сборка ведётся навыком `/autopilot`. Требования, спецификация и таски — в `.autopilot/`.
Прогресс — `.autopilot/dashboard.html`. Правило: требование из `manifest.md`
может снять только пользователь.

Если работа продолжается — скажи «продолжи автопилот»: состояние поднимется
из `.autopilot/state.js`, переспрашивать ничего не нужно.
<!-- autopilot:end -->
