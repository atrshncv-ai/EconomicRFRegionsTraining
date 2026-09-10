window.STATE =
{
  "slug": "geo-trainer",
  "title": "Геотренажёр экономических районов РФ",
  "mode": "interview",
  "depth": "normal",
  "polish": null,
  "tier": "T0",
  "briefFile": "2026-09-10-brief.md",
  "memoryFile": "AGENTS.md",
  "startedAt": "2026-09-10T09:43:18+04:00",
  "updatedAt": "2026-09-10T10:12:49+04:00",
  "finishedAt": "2026-09-10T10:12:49+04:00",
  "stages": [
    { "id": "preflight", "status": "done", "startedAt": "2026-09-10T09:43:18+04:00", "finishedAt": "2026-09-10T09:43:44+04:00" },
    { "id": "manifest", "status": "done", "startedAt": "2026-09-10T09:43:44+04:00", "finishedAt": "2026-09-10T09:44:30+04:00" },
    { "id": "briefing", "status": "done", "startedAt": "2026-09-10T09:44:30+04:00", "finishedAt": "2026-09-10T10:01:37+04:00", "note": "14 вопросов" },
    { "id": "spec", "status": "done", "startedAt": "2026-09-10T10:01:37+04:00", "finishedAt": "2026-09-10T10:01:37+04:00" },
    { "id": "plan", "status": "skipped", "startedAt": "2026-09-10T10:01:37+04:00", "finishedAt": "2026-09-10T10:01:37+04:00", "note": "ярус T0 — без разбивки на таски" },
    { "id": "build", "status": "done", "startedAt": "2026-09-10T10:01:37+04:00", "finishedAt": "2026-09-10T10:09:44+04:00", "note": "ярус T0 — один проход" },
    { "id": "review", "status": "done", "startedAt": "2026-09-10T10:09:44+04:00", "finishedAt": "2026-09-10T10:09:44+04:00", "note": "3 оси, самопроверка T0" },
    { "id": "final", "status": "done", "startedAt": "2026-09-10T10:09:44+04:00", "finishedAt": "2026-09-10T10:12:49+04:00" }
  ],
  "requirements": {
    "total": 25, "done": 24, "inTicket": 0, "inSpec": 0,
    "placeholder": 0, "deferred": 1, "dropped": 0
  },
  "tickets": [],
  "singlePass": {
    "startedAt": "2026-09-10T10:01:37+04:00",
    "finishedAt": "2026-09-10T10:09:44+04:00",
    "files": ["index.html", "src/data.js", "src/quiz.js", "src/app.js", "src/styles.css", "src/template.html", "build.py", "vendor/map.svg", "tests/data.test.js", "tests/quiz.test.js", "tests/smoke.test.js"],
    "tests": { "passed": 3, "failed": 0 },
    "commit": "764b5f2"
  },
  "tests": { "passed": 3, "failed": 0 },
  "debt": { "placeholders": [], "assumptions": [], "emptyEnv": [] },
  "additions": ["Зум карты (кнопки/колесо/щипок) — ради R02 «только карта» на телефоне", "Клавиатура (Enter/Space) — ради R02", "Номера районов в легенде — ради дальтонизма (R04.2)"],
  "coverage": { "missing": 0, "half": 0, "extraFromBriefing": true, "verdict": "pass" },
  "blind": { "result": "pass-with-notes", "partial": ["R06: +ДНР/ЛНР сверх брифа (G04, слова пользователя)", "R12: +Запорожская/Херсонская сверх брифа (G04, слова пользователя)"], "notRun": "браузер: ни у меня, ни у проверяющего нет браузера в окружении — первый запуск за тобой" },
}
