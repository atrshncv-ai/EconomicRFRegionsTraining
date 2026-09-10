#!/usr/bin/env python3
"""Сборка index.html: template + styles + data + quiz + app + карта.
Карта: vendor github alexTitakoff/svg-map-Russia + 4 схематичных региона.
Запуск: python3 build.py. Выход: index.html в корне.
"""
import re
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'src')
VENDOR = os.path.join(ROOT, 'vendor', 'map.svg')


def read(p):
    with open(p, encoding='utf-8') as f:
        return f.read()


def data_names():
    js = read(os.path.join(SRC, 'data.js'))
    return {a: b for a, b, _ in re.findall(r"\['(RU-[A-Z]+)', '([^']+)', '([a-z]+)'\]", js)}


def path_bboxes(svg):
    """Честные bbox с учётом относительных команд."""
    out = {}
    for m in re.finditer(r'<path\b([^>]*)>', svg):
        attrs = m.group(1)
        mid = re.search(r'id="([^"]+)"', attrs)
        md = re.search(r'd="([^"]+)"', attrs)
        if not mid or not md:
            continue
        toks = re.findall(r'[MmLlHhVvCcSsQqTtAaZz]|[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?', md.group(1))
        x = y = 0.0
        xs, ys = [], []
        i, cmd = 0, ''
        while i < len(toks):
            t = toks[i]
            if re.match(r'[A-Za-z]$', t):
                cmd = t
                i += 1
                continue
            c = cmd
            if c in 'Mm':
                x = float(toks[i]) + (0 if c == 'M' else x)
                y = float(toks[i + 1]) + (0 if c == 'M' else y)
                i += 2
                xs.append(x); ys.append(y)
                cmd = 'L' if c == 'M' else 'l'
            elif c in 'Ll':
                x = float(toks[i]) + (0 if c == 'L' else x)
                y = float(toks[i + 1]) + (0 if c == 'L' else y)
                i += 2
                xs.append(x); ys.append(y)
            elif c in 'Hh':
                x = float(toks[i]) + (0 if c == 'H' else x)
                i += 1
                xs.append(x); ys.append(y)
            elif c in 'Vv':
                y = float(toks[i]) + (0 if c == 'V' else y)
                i += 1
                xs.append(x); ys.append(y)
            elif c in 'Cc':
                for k in range(3):
                    dx, dy = float(toks[i + 2 * k]), float(toks[i + 2 * k + 1])
                    xs.append(dx + (0 if c == 'C' else x)); ys.append(dy + (0 if c == 'C' else y))
                x = dx + (0 if c == 'C' else x); y = dy + (0 if c == 'C' else y)
                i += 6
            elif c in 'SsQqTt':
                up = c.isupper()
                for k in range(2):
                    dx, dy = float(toks[i + 2 * k]), float(toks[i + 2 * k + 1])
                    xs.append(dx + (0 if up else x)); ys.append(dy + (0 if up else y))
                x = dx + (0 if up else x); y = dy + (0 if up else y)
                i += 4
            elif c in 'Aa':
                ex, ey = float(toks[i + 5]), float(toks[i + 6])
                if c == 'a':
                    ex += x; ey += y
                xs.append(ex); ys.append(ey)
                x, y = ex, ey
                i += 7
            else:
                i += 1
        if xs:
            out[mid.group(1)] = (min(xs), min(ys), max(xs), max(ys))
    return out


def intersects(b, r):
    return not (b[2] < r[0] or b[0] > r[2] or b[3] < r[1] or b[1] > r[3])


NEW = [
    ('RU-DNR', 'Донецкая Народная Республика', 'black'),
    ('RU-LNR', 'Луганская Народная Республика', 'black'),
    ('RU-ZAP', 'Запорожская область', 'caucasus'),
    ('RU-KHE', 'Херсонская область', 'caucasus'),
]


def main():
    names = data_names()
    colors = dict(re.findall(r"\{ id: '([a-z]+)',\s+name: '[^']+',\s+color:\s+'([^']+)' \}",
                             read(os.path.join(SRC, 'data.js'))))
    svg_src = VENDOR
    svg = read(svg_src)
    m = re.search(r'<svg.*?</svg>', svg, re.S)
    svg = m.group(0)
    # Чистим под встраивание
    svg = re.sub(r'\s(id)="svg2"', r' \1="map"', svg)
    svg = re.sub(r'\s(width|height)="[^"]*"', '', svg)
    svg = re.sub(r'<\?xml[^?]*\?>', '', svg)
    svg = re.sub(r'<!--.*?-->', '', svg, flags=re.S)
    # Города — широкая невидимая обводка = большая зона клика
    for city in ('RU-MOW', 'RU-SPE', 'RU-SEV'):
        svg = re.sub(r'(<path\b[^>]*id="%s")' % city, r'\1 class="city"', svg)
    # Русские <title> в каждый контур (открывающий тег path)
    def add_title(mo):
        tag = mo.group(0)
        mid = re.search(r'id="(RU-[A-Z]+)"', tag)
        if mid and mid.group(1) in names:
            return tag + '<title>%s</title>' % names[mid.group(1)]
        return tag
    svg = re.sub(r'<path\b[^>]*>', add_title, svg)

    # Врезка новых регионов: ищем свободный угол
    boxes = path_bboxes(svg)
    inset_w, inset_h = 150, 120
    cands = [(905, 480), (20, 20), (700, 480), (905, 30)]
    ix, iy = cands[0]
    for cx, cy in cands:
        r = (cx, cy, cx + inset_w, cy + inset_h)
        if not any(intersects(b, r) for b in boxes.values()):
            ix, iy = cx, cy
            break
    cells = []
    for i, (sid, nm, dist) in enumerate(NEW):
        col, row = i % 2, i // 2
        x, y = ix + 10 + col * 70, iy + 28 + row * 44
        cells.append(
            '<g><path id="%s" class="schematic" d="M %d %d h 60 v 34 h -60 Z" '
            'fill="%s" fill-opacity="0.65"><title>%s (контур схематичный)</title></path>'
            '<text x="%d" y="%d" font-size="8">%s</text></g>'
            % (sid, x, y, colors[dist], nm, x + 2, y + 14, nm.split()[0]))
    inset = ('<g id="inset-new"><rect x="%d" y="%d" width="%d" height="%d" '
             'fill="#fff" fill-opacity="0.85" stroke="#333"/>'
             '<text x="%d" y="%d" font-size="10" font-weight="bold">Новые регионы*</text>'
             '%s</g></svg>' % (ix, iy, inset_w, inset_h, ix + 8, iy + 16, ''.join(cells)))
    svg = svg[:-len('</svg>')] + inset

    # Проверка покрытия: все svgId из данных есть в карте
    have = set(re.findall(r'id="(RU-[A-Z]+)"', svg))
    missing = [s for s in names if s not in have]
    assert not missing, 'нет контуров: %s' % missing

    tpl = read(os.path.join(SRC, 'template.html'))
    html = tpl.replace('/*__STYLES__*/', lambda_safe(read(os.path.join(SRC, 'styles.css'))))
    html = html.replace('<!--__MAP__-->', lambda_safe(svg))
    html = html.replace('/*__DATA__*/', lambda_safe(read(os.path.join(SRC, 'data.js'))))
    html = html.replace('/*__QUIZ__*/', lambda_safe(read(os.path.join(SRC, 'quiz.js'))))
    html = html.replace('/*__SOUND__*/', lambda_safe(read(os.path.join(SRC, 'sound.js'))))
    html = html.replace('/*__APP__*/', lambda_safe(read(os.path.join(SRC, 'app.js'))))
    out = os.path.join(ROOT, 'index.html')
    with open(out, 'w', encoding='utf-8') as f:
        f.write(html)
    import os as _os
    print('OK: %s (%d bytes), контуров: %d' % (out, _os.path.getsize(out), len(have)))


def lambda_safe(s):
    return s.replace('\\', '\\\\')


if __name__ == '__main__':
    main()
