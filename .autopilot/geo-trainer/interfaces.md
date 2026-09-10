# Границы и правила сборки

Ярус T0 — один проход, один контекст, без разбивки на таски.

## Правила проекта

- Только статика: HTML + CSS + vanilla JS, без сборки, без сервера, без внешних запросов (офлайн из файла и на z.ai).
- Лимит z.ai: ≤50 МБ, только JS/TS. Зависимостей нет (jQuery из гитхаба не тянем).
- Основа карты: SVG из alexTitakoff/svg-map-Russia (атрибуция сохранена в коде/подвале).
- Не трогать: `.autopilot/`, `AGENTS.md`, `ru.svg` (исходник пользователя).
- Недоставаемая зависимость → вернуть `BLOCKED`, ничего не ставить из сети.

## Из прохода T0 — что построено

- `index.html` (сборка `python3 build.py` из `src/` + `vendor/map.svg`, 204 КБ, всё инлайн, внешних запросов нет)
- `src/data.js` — `GEO_DATA {DISTRICTS(12), SUBJECTS(89)}`, UMD (браузер + node)
- `src/quiz.js` — `GEO_QUIZ {subjectQuestion, districtQuestion, checkSubjectAnswer, checkDistrictAnswer, buildRound, makeRng}`, чистые функции без DOM
- `src/app.js` — экраны, легенда, зум (кнопки/колесо/щипок), localStorage `geo-trainer-v1`, клавиатура (Enter/Space)
- Швы: `GEO_QUIZ.*` и валидация `GEO_DATA` — тесты только здесь
- Тесты: `node --test tests/*.test.js` → 3 файла зелёных
