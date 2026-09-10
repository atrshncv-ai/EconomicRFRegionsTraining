#!/usr/bin/env python3
"""Разовый расчёт матрицы соседства для режима «соседи» (R01.5).

Что делает: парсит контуры vendor/map.svg, считает попарные min-дистанции
сегментов и запекает NEIGHBORS в src/data.js (вставка вручную из stdout).

Запуск вручную из корня: python3 tools/build_neighbors.py
Зависимости: только stdlib. Порог EPS=0.5: истинные соседи <=0.05,
ложные >=0.69 (замер по карте), острова KGD/SAK остаются без соседей.

Особое: города-анклавы MOW/SPE/SEV принудительно связаны только с
хозяином (MOS/LEN/CR) — точка города на карте геометрически шумная.
Ручные рёбра (схематичная врезка + Крым) — см. MANUAL ниже.
"""
import math
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SVG = os.path.join(ROOT, "vendor", "map.svg")
EPS = 0.5

# Ручные рёбра: 4 схематичных региона без геометрии + Крым (географически:
# ДНР <-> ЛНР, Ростовская, Запорожская; ЛНР <-> ДНР, Ростовская,
# Воронежская, Белгородская;
# Запорожская <-> ДНР, Херсонская; Херсонская <-> Запорожская, Крым).
# Всё симметрично.
MANUAL = [
    ("RU-DNR", "RU-ROS"),
    ("RU-LNR", "RU-ROS"),
    ("RU-DNR", "RU-LNR"),
    ("RU-DNR", "RU-ZAP"),
    ("RU-LNR", "RU-VOR"),
    ("RU-BEL", "RU-LNR"),
    ("RU-ZAP", "RU-KHE"),
    ("RU-KHE", "RU-CR"),
]

# Города-анклавы: только хозяин (точка на карте, геометрия шумная).
ENCLAVE_HOST = {"RU-MOW": "RU-MOS", "RU-SPE": "RU-LEN", "RU-SEV": "RU-CR"}


def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read()


def extract_paths(svg):
    out = {}
    for m in re.finditer(r"<path\b([^>]*)>", svg):
        attrs = m.group(1)
        mid = re.search(r'id="(RU-[A-Z]+)"', attrs)
        md = re.search(r'd="([^"]+)"', attrs)
        if mid and md:
            out[mid.group(1)] = md.group(1)
    return out


def parse_segments(d):
    """d -> список отрезков ((x1,y1),(x2,y2)). Кривые C/c семплируются."""
    toks = re.findall(
        r"[MmLlHhVvCcSsQqTtAaZz]|[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?", d
    )
    segs = []
    x = y = 0.0
    sx = sy = 0.0
    i, cmd = 0, ""
    while i < len(toks):
        t = toks[i]
        if re.match(r"[A-Za-z]$", t):
            cmd = t
            i += 1
            if cmd in "Zz":
                if (x, y) != (sx, sy):
                    segs.append(((x, y), (sx, sy)))
                x, y = sx, sy
            continue
        c = cmd
        if c in "Mm":
            nx = float(toks[i]) + (0 if c == "M" else x)
            ny = float(toks[i + 1]) + (0 if c == "M" else y)
            i += 2
            x, y = nx, ny
            sx, sy = x, y
            cmd = "L" if c == "M" else "l"
        elif c in "Ll":
            nx = float(toks[i]) + (0 if c == "L" else x)
            ny = float(toks[i + 1]) + (0 if c == "L" else y)
            i += 2
            segs.append(((x, y), (nx, ny)))
            x, y = nx, ny
        elif c in "Cc":
            up = c.isupper()
            x1, y1 = float(toks[i]), float(toks[i + 1])
            x2, y2 = float(toks[i + 2]), float(toks[i + 3])
            x3, y3 = float(toks[i + 4]), float(toks[i + 5])
            if not up:
                x1 += x; y1 += y; x2 += x; y2 += y; x3 += x; y3 += y
            i += 6
            p0 = (x, y)
            prev = p0
            for k in range(1, 7):
                tt = k / 6
                mt = 1 - tt
                pt = (
                    mt**3 * p0[0] + 3 * mt * mt * tt * x1
                    + 3 * mt * tt * tt * x2 + tt**3 * x3,
                    mt**3 * p0[1] + 3 * mt * mt * tt * y1
                    + 3 * mt * tt * tt * y2 + tt**3 * y3,
                )
                segs.append((prev, pt))
                prev = pt
            x, y = x3, y3
        else:
            raise RuntimeError("неожиданная команда SVG: %r" % c)
    return segs


def bbox_of(segs):
    xs, ys = [], []
    for a, b in segs:
        xs += [a[0], b[0]]
        ys += [a[1], b[1]]
    return (min(xs), min(ys), max(xs), max(ys))


def pt_seg2(p, a, b):
    vx, vy = b[0] - a[0], b[1] - a[1]
    wx, wy = p[0] - a[0], p[1] - a[1]
    c1 = vx * wx + vy * wy
    if c1 <= 0:
        return wx * wx + wy * wy
    c2 = vx * vx + vy * vy
    if c2 <= c1:
        return (p[0] - b[0]) ** 2 + (p[1] - b[1]) ** 2
    t = c1 / c2
    px, py = a[0] + t * vx, a[1] + t * vy
    return (p[0] - px) ** 2 + (p[1] - py) ** 2


def seg2(s1, s2):
    return min(
        pt_seg2(s1[0], s2[0], s2[1]),
        pt_seg2(s1[1], s2[0], s2[1]),
        pt_seg2(s2[0], s1[0], s1[1]),
        pt_seg2(s2[1], s1[0], s1[1]),
    )


def expand(b, e):
    return (b[0] - e, b[1] - e, b[2] + e, b[3] + e)


def intersects(b1, b2):
    return not (b1[2] < b2[0] or b1[0] > b2[2] or b1[3] < b2[1] or b1[1] > b2[3])


def main():
    paths = extract_paths(read(SVG))
    assert len(paths) == 85, "в map.svg ждём 85 контуров, нашли %d" % len(paths)
    segs = {k: parse_segments(v) for k, v in paths.items()}
    bb = {k: bbox_of(v) for k, v in segs.items()}
    ids = sorted(paths)
    adj = {k: set() for k in ids}
    cap2 = EPS * EPS + 1e-9
    for i in range(len(ids)):
        for j in range(i + 1, len(ids)):
            a, b = ids[i], ids[j]
            if not intersects(expand(bb[a], EPS), bb[b]):
                continue
            found = False
            for s1 in segs[a]:
                for s2 in segs[b]:
                    if seg2(s1, s2) < cap2:
                        found = True
                        break
                if found:
                    break
            if found:
                adj[a].add(b)
                adj[b].add(a)
    # Города-анклавы: только хозяин.
    for city, host in ENCLAVE_HOST.items():
        for k in ids:
            if k != city and k != host:
                adj[k].discard(city)
        adj[city] = {host}
        adj[host].add(city)
    # Ручные рёбра (схематичные + Крым).
    for a, b in MANUAL:
        adj.setdefault(a, set()).add(b)
        adj.setdefault(b, set()).add(a)
    # Острова/эксклав без соседей — вне матрицы.
    adj.pop("RU-KGD", None)
    adj.pop("RU-SAK", None)
    for k in list(adj):
        adj[k] = sorted(adj[k])
        assert adj[k], "без соседей: %s" % k
    n_edges = sum(len(v) for v in adj.values()) // 2
    print("// NEIGHBORS: сгенерировано tools/build_neighbors.py из vendor/map.svg")
    print("// (геометрия EPS=%.1f + анклавы + MANUAL), вставить в src/data.js" % EPS)
    print("var NEIGHBORS = {");
    for k in sorted(adj):
        print('  "%s": [%s],' % (k, ", ".join('"%s"' % x for x in adj[k])));
    print("};");
    print("// рёбер: %d, ключей: %d" % (n_edges, len(adj)))


if __name__ == "__main__":
    main()
