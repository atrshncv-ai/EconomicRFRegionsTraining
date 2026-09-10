# Границы и правила сборки

## Границы, решённые в спецификации

- `quiz` — вопросы, веса, соседи, бонус. `weightFor(pct) -> w`, `neighborQuestion(subjects, neighbors, rng) -> q`, `bonusFor({attempt, seconds, hinted}) -> n`
- `sound` — синтез событий. `soundFor(event) -> {freq, dur}`, `play(spec)`
- `stats` — история игр в store. `pushHistory(game)`, `last(n)`
- `ui` — тема, печать, список легенды, секундомер. `setTheme(name)`, `show(screen, props)`
- Швы для тестов: `weightFor`, `neighborQuestion`, `bonusFor`, `soundFor`, валидация `NEIGHBORS`

## Из таска 01 — матрица соседства

- `GEO_DATA.NEIGHBORS: {svgId: [svgId...]}` — симметрично, 87 ключей; без соседей: RU-KGD, RU-SAK
- Ручные рёбра новых: DNR: LNR/ROS/ZAP; LNR: BEL/DNR/ROS/VOR; ZAP: DNR/KHE; KHE: ZAP/CR; CR: KHE/SEV; ROS +DNR/LNR; VOR +LNR; BEL +LNR
- Генератор: `tools/build_neighbors.py` (геометрия + MANUAL), обязан совпадать с data.js (0 расхождений)

## Из таска 02 — ядро

- `GEO_QUIZ.weightFor(pct) -> w` (0%→макс, 100%→мин>0, неизвестный район→1)
- `GEO_QUIZ.neighborQuestion(subjects, neighbors, rng) -> {kind:'neighbors', subject, neighbors}`
- `GEO_QUIZ.bonusFor({attempt, seconds, hinted}) -> n` (+1 лишь attempt=1, <8с, без подсказки)
- `buildRound(mode, subjects, districts, n, rng, weights)` — только явная форма, без перегрузок

## Из таска 03 — звук, время, история

- `GEO_SOUND.soundFor(event) -> {freq, dur}` (correct/wrong/finish/click, 4 различимых), `play(spec)` на WebAudio, без файлов
- Секундомер раунда + `bonusFor`, пауза по `visibilitychange`, помощник `visibleSeconds`
- `store.history` (20 игр: дата/счёт/всего), на результате последние 5; `store.sound` — тумблер
- `src/sound.js` подключён в `build.py` отдельным плейсхолдером (инлайн); офлайн цел

## Из таска 04 — экраны

- Раунд «соседи» (6, без повторов) через `neighborQuestion`; `weightsFromStats(asked, ok)` в quiz, `startMode` передаёт веса в `buildRound`
- `#legend-list` (список субъектов, только Изучение), `setTheme` + `store.theme`, `#btn-print` + `@media print` без карты-игры, `#btn-mode-nb`
- `applyTheme` при сбое явно откатывается на light с записью состояния

## Общие правила проекта

- Стек: статика HTML+CSS+vanilla JS, `python3 build.py` → `index.html` (всё инлайн, ≤50 МБ, без сервера, без внешних запросов)
- Тесты: `node --test tests/data.test.js tests/quiz.test.js tests/smoke.test.js`
- Состав 89 зафиксирован `tests/data.test.js` (`EXPECTED`); `RU-VOR` — Воронежская (не «чинить»)
- Не трогать: `vendor/map.svg`, `ru.svg`, `.autopilot/`, память проекта
- Не хватает зависимости — вернуть `BLOCKED`, из сети не ставить
