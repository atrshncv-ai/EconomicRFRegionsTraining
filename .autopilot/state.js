window.STATE =
{
  "slug": "func-audit",
  "title": "Проверка функций и доработки тренажёра",
  "mode": "semi",
  "depth": "normal",
  "polish": null,
  "tier": "T0",
  "briefFile": "2026-09-10-brief.md",
  "memoryFile": "AGENTS.md",
  "startedAt": "2026-09-10T10:19:04+04:00",
  "updatedAt": "2026-09-10T10:29:42+04:00",
  "finishedAt": "2026-09-10T10:29:42+04:00",
  "stages": [
    { "id": "preflight", "status": "done", "startedAt": "2026-09-10T10:19:04+04:00", "finishedAt": "2026-09-10T10:19:04+04:00" },
    { "id": "manifest", "status": "done", "startedAt": "2026-09-10T10:19:04+04:00", "finishedAt": "2026-09-10T10:19:04+04:00" },
    { "id": "briefing", "status": "done", "startedAt": "2026-09-10T10:19:04+04:00", "finishedAt": "2026-09-10T10:19:04+04:00", "note": "1 вопрос" },
    { "id": "spec", "status": "done", "startedAt": "2026-09-10T10:19:04+04:00", "finishedAt": "2026-09-10T10:19:04+04:00" },
    { "id": "plan", "status": "skipped", "startedAt": "2026-09-10T10:19:04+04:00", "finishedAt": "2026-09-10T10:19:04+04:00", "note": "ярус T0 — без разбивки на таски" },
    { "id": "build", "status": "done", "startedAt": "2026-09-10T10:19:04+04:00", "finishedAt": "2026-09-10T10:29:42+04:00", "note": "ярус T0 — один проход" },
    { "id": "review", "status": "done", "startedAt": "2026-09-10T10:29:42+04:00", "finishedAt": "2026-09-10T10:29:42+04:00", "note": "3 оси, самопроверка T0" },
    { "id": "final", "status": "done", "startedAt": "2026-09-10T10:29:42+04:00", "finishedAt": "2026-09-10T10:29:42+04:00" }
  ],
  "requirements": {
    "total": 3, "done": 3, "inTicket": 0, "inSpec": 0,
    "placeholder": 0, "deferred": 0, "dropped": 0
  },
  "tickets": [],
  "singlePass": {
    "startedAt": "2026-09-10T10:19:04+04:00",
    "finishedAt": "2026-09-10T10:29:42+04:00",
    "files": ["tests/smoke.test.js", "tests/data.test.js"],
    "tests": { "passed": 3, "failed": 0 },
    "commit": "32d29af"
  },
  "tests": { "passed": 3, "failed": 0 },
  "debt": { "placeholders": [], "assumptions": [], "emptyEnv": [] },
  "additions": [],
  "coverage": { "missing": 0, "half": 0, "extraFromBriefing": true, "verdict": "pass" },
  "blind": { "result": "pass", "notRun": "браузер: ни у меня, ни у проверяющего нет браузера — клики/зум/подсказка проверены тестами на поддельном DOM" }
}
