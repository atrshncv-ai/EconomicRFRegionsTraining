window.STATE =
{
  "slug": "federal-districts",
  "title": "Федеральные округа тем же движком",
  "mode": "semi",
  "depth": "normal",
  "polish": null,
  "tier": "T1",
  "briefFile": "2026-09-10-brief.md",
  "memoryFile": "AGENTS.md",
  "startedAt": "2026-09-10T11:56:47+04:00",
  "updatedAt": "2026-09-10T14:19:09+04:00",
  "finishedAt": "2026-09-10T14:19:09+04:00",
  "stages": [
    { "id": "preflight", "status": "done", "startedAt": "2026-09-10T11:56:47+04:00", "finishedAt": "2026-09-10T11:56:47+04:00" },
    { "id": "manifest", "status": "done", "startedAt": "2026-09-10T11:56:47+04:00", "finishedAt": "2026-09-10T11:56:47+04:00" },
    { "id": "briefing", "status": "done", "startedAt": "2026-09-10T11:56:47+04:00", "finishedAt": "2026-09-10T11:56:47+04:00", "note": "1 вопрос" },
    { "id": "spec", "status": "done", "startedAt": "2026-09-10T11:56:47+04:00", "finishedAt": "2026-09-10T11:56:47+04:00" },
    { "id": "plan", "status": "done", "startedAt": "2026-09-10T11:56:47+04:00", "finishedAt": "2026-09-10T11:56:47+04:00", "note": "3 таска, ярус T1" },
    { "id": "build", "status": "done", "startedAt": "2026-09-10T11:56:47+04:00", "finishedAt": "2026-09-10T14:16:01+04:00", "note": "3 из 3 тасков готовы" },
    { "id": "review", "status": "done", "startedAt": "2026-09-10T11:56:47+04:00", "finishedAt": "2026-09-10T14:16:01+04:00", "note": "проверено 3 из 3" },
    { "id": "final", "status": "done", "startedAt": "2026-09-10T14:16:01+04:00", "finishedAt": "2026-09-10T14:19:09+04:00" }
  ],
  "requirements": {
    "total": 11, "done": 11, "inTicket": 0, "inSpec": 0,
    "placeholder": 0, "deferred": 0, "dropped": 0
  },
  "tickets": [
    { "id": "01", "title": "Данные федеральных округов", "requirements": ["R01", "R02", "R03", "R04", "R05", "R06", "R07", "R08", "R09", "R10", "R11"], "blockedBy": [], "wave": 1, "zone": ["src/data.js", "tests/data.test.js"], "status": "done", "startedAt": "2026-09-10T11:56:47+04:00", "finishedAt": "2026-09-10T12:03:01+04:00", "retries": 0, "repairs": 0, "files": ["src/data.js", "tests/data.test.js"], "tests": { "passed": 3, "failed": 0 }, "commit": "43a11c2", "concerns": [] },
    { "id": "02", "title": "Движок на двух наборах", "requirements": ["R01", "R10"], "blockedBy": ["01"], "wave": 2, "zone": ["src/app.js", "src/template.html", "src/styles.css", "tests/smoke.test.js"], "status": "done", "startedAt": "2026-09-10T12:03:01+04:00", "finishedAt": "2026-09-10T13:54:35+04:00", "retries": 1, "repairs": 1, "files": ["src/app.js", "src/template.html", "src/styles.css", "tests/smoke.test.js", "index.html"], "tests": { "passed": 3, "failed": 0 }, "commit": "2aed0b6", "concerns": [] },
    { "id": "03", "title": "Печать обоих наборов и финал", "requirements": ["R01", "R10"], "blockedBy": ["02"], "wave": 3, "zone": ["src/app.js", "src/template.html", "src/styles.css", "tests/smoke.test.js"], "status": "done", "startedAt": "2026-09-10T13:54:35+04:00", "finishedAt": "2026-09-10T14:16:01+04:00", "retries": 0, "repairs": 0, "files": ["src/app.js", "tests/smoke.test.js", "index.html"], "tests": { "passed": 3, "failed": 0 }, "commit": "fb29257", "concerns": [] }
  ],
  "singlePass": null,
  "tests": { "passed": 3, "failed": 0 },
  "debt": { "placeholders": [], "assumptions": [], "emptyEnv": [] },
  "additions": [],
  "coverage": { "missing": 0, "half": 3, "halfDisposition": "ЮФО 8→12 — слова пользователя из брифинга; разбивка по типам и пометка Владивостока — добавлены в историю 3", "verdict": "pass" },
  "blind": { "result": "pass", "note": "ЮФО 12 = решение пользователя из брифинга", "notRun": "браузер: ни у меня, ни у проверяющего нет браузера" },
}
