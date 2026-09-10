/* Данные тренажёра: 12 экономических районов и 89 субъектов.
 * Состав — строго по списку пользователя + 4 новых региона по ОКЭР (G04):
 * ДНР/ЛНР → Центрально-Чернозёмный, Запорожская/Херсонская → Северо-Кавказский.
 * Геометрия: github alexTitakoff/svg-map-Russia (MIT, Elton Kamami).
 * Проверка имён: RU-VOR в исходнике ошибочно подписан «Ставропольский край»
 * (дубль RU-STA) — по координатам это Воронежская область, исправлено.
 * 4 новых региона (RU-DNR/RU-LNR/RU-ZAP/RU-KHE) — схематичные контуры,
 * дорисовываются сборкой рядом с Ростовской областью, в карте помечены.
 */
(function (root, factory) {
  var data = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = data;
  else root.GEO_DATA = data;
}(typeof self !== 'undefined' ? self : this, function () {
  var DISTRICTS = [
    { id: 'central',     name: 'Центральный',            color: '#e6194b' },
    { id: 'black',       name: 'Центрально-Чернозёмный', color: '#3cb44b' },
    { id: 'northwest',   name: 'Северо-Западный',        color: '#ffe119' },
    { id: 'northern',    name: 'Северный',               color: '#0082c8' },
    { id: 'kaliningrad', name: 'Калининградский',        color: '#f58231' },
    { id: 'vyatka',      name: 'Волго-Вятский',          color: '#911eb4' },
    { id: 'volga',       name: 'Поволжский',             color: '#46f0f0' },
    { id: 'caucasus',    name: 'Северо-Кавказский',      color: '#f032e6' },
    { id: 'ural',        name: 'Уральский',              color: '#9acd32' },
    { id: 'wsib',        name: 'Западно-Сибирский',      color: '#e6beff' },
    { id: 'esib',        name: 'Восточно-Сибирский',     color: '#008080' },
    { id: 'fareast',     name: 'Дальневосточный',        color: '#a52a2a' }
  ];
  // [svgId, русское название, districtId]
  var S = [
    ['RU-MOW', 'Москва', 'central'],
    ['RU-MOS', 'Московская область', 'central'],
    ['RU-TVE', 'Тверская область', 'central'],
    ['RU-SMO', 'Смоленская область', 'central'],
    ['RU-KLU', 'Калужская область', 'central'],
    ['RU-BRY', 'Брянская область', 'central'],
    ['RU-TUL', 'Тульская область', 'central'],
    ['RU-ORL', 'Орловская область', 'central'],
    ['RU-RYA', 'Рязанская область', 'central'],
    ['RU-VLA', 'Владимирская область', 'central'],
    ['RU-IVA', 'Ивановская область', 'central'],
    ['RU-KOS', 'Костромская область', 'central'],
    ['RU-YAR', 'Ярославская область', 'central'],
    ['RU-KRS', 'Курская область', 'black'],
    ['RU-BEL', 'Белгородская область', 'black'],
    ['RU-LIP', 'Липецкая область', 'black'],
    ['RU-VOR', 'Воронежская область', 'black'],
    ['RU-TAM', 'Тамбовская область', 'black'],
    ['RU-DNR', 'Донецкая Народная Республика', 'black'],
    ['RU-LNR', 'Луганская Народная Республика', 'black'],
    ['RU-SPE', 'Санкт-Петербург', 'northwest'],
    ['RU-LEN', 'Ленинградская область', 'northwest'],
    ['RU-NGR', 'Новгородская область', 'northwest'],
    ['RU-PSK', 'Псковская область', 'northwest'],
    ['RU-VLG', 'Вологодская область', 'northern'],
    ['RU-KR', 'Республика Карелия', 'northern'],
    ['RU-MUR', 'Мурманская область', 'northern'],
    ['RU-ARK', 'Архангельская область', 'northern'],
    ['RU-NEN', 'Ненецкий автономный округ', 'northern'],
    ['RU-KO', 'Республика Коми', 'northern'],
    ['RU-KGD', 'Калининградская область', 'kaliningrad'],
    ['RU-NIZ', 'Нижегородская область', 'vyatka'],
    ['RU-KIR', 'Кировская область', 'vyatka'],
    ['RU-ME', 'Республика Марий Эл', 'vyatka'],
    ['RU-CU', 'Чувашская Республика', 'vyatka'],
    ['RU-MO', 'Республика Мордовия', 'vyatka'],
    ['RU-TA', 'Республика Татарстан', 'volga'],
    ['RU-ULY', 'Ульяновская область', 'volga'],
    ['RU-PNZ', 'Пензенская область', 'volga'],
    ['RU-SAR', 'Саратовская область', 'volga'],
    ['RU-SAM', 'Самарская область', 'volga'],
    ['RU-VGG', 'Волгоградская область', 'volga'],
    ['RU-AST', 'Астраханская область', 'volga'],
    ['RU-KL', 'Республика Калмыкия', 'volga'],
    ['RU-ROS', 'Ростовская область', 'caucasus'],
    ['RU-KDA', 'Краснодарский край', 'caucasus'],
    ['RU-AD', 'Республика Адыгея', 'caucasus'],
    ['RU-CR', 'Республика Крым', 'caucasus'],
    ['RU-SEV', 'Севастополь', 'caucasus'],
    ['RU-STA', 'Ставропольский край', 'caucasus'],
    ['RU-KC', 'Карачаево-Черкесская Республика', 'caucasus'],
    ['RU-KB', 'Кабардино-Балкарская Республика', 'caucasus'],
    ['RU-SE', 'Республика Северная Осетия — Алания', 'caucasus'],
    ['RU-IN', 'Республика Ингушетия', 'caucasus'],
    ['RU-CE', 'Республика Чечня', 'caucasus'],
    ['RU-DA', 'Республика Дагестан', 'caucasus'],
    ['RU-ZAP', 'Запорожская область', 'caucasus'],
    ['RU-KHE', 'Херсонская область', 'caucasus'],
    ['RU-SVE', 'Свердловская область', 'ural'],
    ['RU-CHE', 'Челябинская область', 'ural'],
    ['RU-KGN', 'Курганская область', 'ural'],
    ['RU-PER', 'Пермский край', 'ural'],
    ['RU-UD', 'Удмуртская Республика', 'ural'],
    ['RU-BA', 'Республика Башкортостан', 'ural'],
    ['RU-ORE', 'Оренбургская область', 'ural'],
    ['RU-TYU', 'Тюменская область', 'wsib'],
    ['RU-KHM', 'Ханты-Мансийский автономный округ — Югра', 'wsib'],
    ['RU-YAN', 'Ямало-Ненецкий автономный округ', 'wsib'],
    ['RU-OMS', 'Омская область', 'wsib'],
    ['RU-TOM', 'Томская область', 'wsib'],
    ['RU-NVS', 'Новосибирская область', 'wsib'],
    ['RU-KEM', 'Кемеровская область', 'wsib'],
    ['RU-ALT', 'Алтайский край', 'wsib'],
    ['RU-AL', 'Республика Алтай', 'wsib'],
    ['RU-KYA', 'Красноярский край', 'esib'],
    ['RU-KK', 'Республика Хакасия', 'esib'],
    ['RU-TY', 'Республика Тыва', 'esib'],
    ['RU-IRK', 'Иркутская область', 'esib'],
    ['RU-BU', 'Республика Бурятия', 'esib'],
    ['RU-ZAB', 'Забайкальский край', 'esib'],
    ['RU-SA', 'Республика Саха (Якутия)', 'fareast'],
    ['RU-MAG', 'Магаданская область', 'fareast'],
    ['RU-CHU', 'Чукотский автономный округ', 'fareast'],
    ['RU-KAM', 'Камчатский край', 'fareast'],
    ['RU-AMU', 'Амурская область', 'fareast'],
    ['RU-YEV', 'Еврейская автономная область', 'fareast'],
    ['RU-KHA', 'Хабаровский край', 'fareast'],
    ['RU-PRI', 'Приморский край', 'fareast'],
    ['RU-SAK', 'Сахалинская область', 'fareast']
  ];
  var SUBJECTS = S.map(function (r) {
    return {
      svgId: r[0], name: r[1], district: r[2],
      schematic: r[0] === 'RU-DNR' || r[0] === 'RU-LNR' || r[0] === 'RU-ZAP' || r[0] === 'RU-KHE'
    };
  });
  return { DISTRICTS: DISTRICTS, SUBJECTS: SUBJECTS };
}));
