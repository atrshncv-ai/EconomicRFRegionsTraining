# Geography Trainer: Economic Regions of Russia

A lightweight, offline geography trainer with an interactive SVG map of Russia. It helps learners practice the 12 economic regions and their 89 constituent subjects.

## Features

- Three modes: study, subject → region, and region → subjects.
- Interactive map with Russian place names and a 12-region legend.
- Score, review of mistakes, and progress saved in the browser.
- Static HTML/CSS/JavaScript; no backend or runtime network service.

## Build and run

Requirements: Python 3 to rebuild the single-file app; a modern browser to use it.

```sh
python3 build.py
```

Open `index.html` in a browser. No package installation is required.

To run the existing tests with Node.js:

```sh
node --test tests/data.test.js tests/quiz.test.js tests/smoke.test.js
```

## Project structure

- `src/` — application, quiz logic, map data, and styles.
- `vendor/map.svg` — bundled SVG map asset.
- `build.py` — assembles the source modules into `index.html`.
- `tests/` — data, quiz, and browser smoke checks.

The map asset's notice is in `vendor/LICENSE-map.txt`. No repository-wide `LICENSE` file currently declares terms for the project source.

---

# Геотренажёр экономических районов России

Лёгкий офлайн-тренажёр географии с интерактивной SVG-картой России. Он помогает изучать 12 экономических районов и входящие в них 89 субъектов.

## Возможности

- Три режима: изучение, «субъект → район» и «район → субъекты».
- Интерактивная карта с русскими названиями и легендой 12 районов.
- Подсчёт результата, разбор ошибок и сохранение прогресса в браузере.
- Статическое приложение на HTML/CSS/JavaScript без backend и сетевых сервисов во время работы.

## Сборка и запуск

Для пересборки одностраничного приложения нужен Python 3; для работы — современный браузер.

```sh
python3 build.py
```

Откройте `index.html` в браузере. Установка пакетов не требуется.

Чтобы запустить существующие тесты, нужен Node.js:

```sh
node --test tests/data.test.js tests/quiz.test.js tests/smoke.test.js
```

## Структура проекта

- `src/` — приложение, логика викторины, данные карты и стили.
- `vendor/map.svg` — встроенный SVG-файл карты.
- `build.py` — собирает исходные модули в `index.html`.
- `tests/` — проверки данных, викторины и smoke-проверки.

Условия использования карты указаны в `vendor/LICENSE-map.txt`. Корневой файл `LICENSE`, задающий условия для исходного кода проекта в целом, пока отсутствует.

## License / Лицензия

Released under the MIT License. See [LICENSE](LICENSE).
Проект распространяется по лицензии MIT. См. [LICENSE](LICENSE).
