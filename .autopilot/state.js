window.STATE =
{
  "slug": "extras",
  "title": "Доработки тренажёра: предложения, звук, лобби, таймер",
  "mode": "semi",
  "depth": "normal",
  "polish": null,
  "tier": "T2",
  "briefFile": "2026-09-10-brief.md",
  "memoryFile": "AGENTS.md",
  "startedAt": "2026-09-10T10:32:57+04:00",
  "updatedAt": "2026-09-10T11:17:31+04:00",
  "finishedAt": "2026-09-10T11:17:31+04:00",
  "stages": [
    { "id": "preflight", "status": "done", "startedAt": "2026-09-10T10:32:57+04:00", "finishedAt": "2026-09-10T10:32:57+04:00" },
    { "id": "manifest", "status": "done", "startedAt": "2026-09-10T10:32:57+04:00", "finishedAt": "2026-09-10T10:32:57+04:00" },
    { "id": "briefing", "status": "done", "startedAt": "2026-09-10T10:32:57+04:00", "finishedAt": "2026-09-10T10:32:57+04:00", "note": "3 вопроса" },
    { "id": "spec", "status": "done", "startedAt": "2026-09-10T10:32:57+04:00", "finishedAt": "2026-09-10T10:32:57+04:00" },
    { "id": "plan", "status": "done", "startedAt": "2026-09-10T10:32:57+04:00", "finishedAt": "2026-09-10T10:32:57+04:00", "note": "4 таска, ярус T2" },
    { "id": "build", "status": "done", "startedAt": "2026-09-10T10:32:57+04:00", "finishedAt": "2026-09-10T11:14:09+04:00", "note": "4 из 4 тасков готовы" },
    { "id": "review", "status": "done", "startedAt": "2026-09-10T10:32:57+04:00", "finishedAt": "2026-09-10T11:14:09+04:00", "note": "проверено 4 из 4" },
    { "id": "final", "status": "done", "startedAt": "2026-09-10T11:14:09+04:00", "finishedAt": "2026-09-10T11:17:31+04:00" }
  ],
  "requirements": {
    "total": 5, "done": 4, "inTicket": 0, "inSpec": 0,
    "placeholder": 0, "deferred": 0, "dropped": 1
  },
  "tickets": [
    { "id": "01", "title": "Матрица соседства в данных", "requirements": ["R01"], "blockedBy": [], "wave": 1, "zone": ["src/data.js", "tests/data.test.js", "tools/"], "status": "done", "startedAt": "2026-09-10T10:32:57+04:00", "finishedAt": "2026-09-10T10:53:06+04:00", "retries": 0, "repairs": 2, "files": ["src/data.js", "tests/data.test.js", "tools/build_neighbors.py"], "tests": { "passed": 3, "failed": 0 }, "commit": "e6ba190", "concerns": [] },
    { "id": "02", "title": "Ядро: веса, соседи, бонус", "requirements": ["R01", "R04"], "blockedBy": ["01"], "wave": 2, "zone": ["src/quiz.js", "tests/quiz.test.js"], "status": "done", "startedAt": "2026-09-10T10:53:06+04:00", "finishedAt": "2026-09-10T10:58:05+04:00", "retries": 0, "repairs": 1, "files": ["src/quiz.js", "tests/quiz.test.js"], "tests": { "passed": 3, "failed": 0 }, "commit": "8aa4e64", "concerns": [] },
    { "id": "03", "title": "Звук, секундомер, история", "requirements": ["R01", "R02", "R04"], "blockedBy": ["02"], "wave": 3, "zone": ["src/app.js", "src/template.html", "src/styles.css", "src/sound.js", "tests/smoke.test.js"], "status": "done", "startedAt": "2026-09-10T10:58:05+04:00", "finishedAt": "2026-09-10T11:04:58+04:00", "retries": 0, "repairs": 1, "files": ["src/sound.js", "src/app.js", "src/template.html", "src/styles.css", "tests/smoke.test.js", "build.py"], "tests": { "passed": 3, "failed": 0 }, "commit": "2581066", "concerns": [] },
    { "id": "04", "title": "Экраны: легенда-список, тема, печать, соседи", "requirements": ["R01"], "blockedBy": ["02"], "wave": 4, "zone": ["src/app.js", "src/template.html", "src/styles.css", "tests/smoke.test.js"], "status": "done", "startedAt": "2026-09-10T11:04:58+04:00", "finishedAt": "2026-09-10T11:14:09+04:00", "retries": 0, "repairs": 2, "files": ["src/app.js", "src/template.html", "src/styles.css", "src/quiz.js", "tests/", "index.html"], "tests": { "passed": 3, "failed": 0 }, "commit": "5bbc252", "concerns": [] }
  ],
  "singlePass": null,
  "tests": { "passed": 3, "failed": 0 },
  "debt": { "placeholders": [], "assumptions": [], "emptyEnv": [] },
  "additions": [],
  "coverage": { "missing": 0, "half": 0, "extraGrounded": "R01→proposals.md, R03/R05→ответы брифинга, механики R02.1/R04.1—проработка normal", "verdict": "pass" },
  "blind": { "result": "pass", "note": "лобби/флаги отсутствуют как отказе пользователя (R03 dropped, R05)", "notRun": "браузер: ни у меня, ни у проверяющего нет браузера" },
}
