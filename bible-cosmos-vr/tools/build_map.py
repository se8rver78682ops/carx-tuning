# Собирает data/map.json из Natural Earth (ne_50m_land, ne_10m_lakes, ne_10m_rivers_lake_centerlines, GeoJSON).
# Запуск: python3 -I tools/build_map.py <папка с geojson> data/map.json
import json, sys
D = sys.argv[1]
BB = (8.0, 22.0, 54.0, 43.0)  # lon0, lat0, lon1, lat1

def clip(poly):
    def inside(p, e):
        x, y = p
        return [x >= BB[0], y >= BB[1], x <= BB[2], y <= BB[3]][e]
    def inter(a, b, e):
        (x1, y1), (x2, y2) = a, b
        if e in (0, 2):
            X = BB[e]; t = (X - x1) / (x2 - x1); return (X, y1 + t * (y2 - y1))
        Y = BB[e]; t = (Y - y1) / (y2 - y1); return (x1 + t * (x2 - x1), Y)
    out = poly
    for e in range(4):
        if not out: break
        inp, out = out, []
        for i in range(len(inp)):
            cur, prev = inp[i], inp[i - 1]
            if inside(cur, e):
                if not inside(prev, e): out.append(inter(prev, cur, e))
                out.append(cur)
            elif inside(prev, e): out.append(inter(prev, cur, e))
    return out

def simplify(pts, tol):
    if len(pts) < 3: return pts
    def d(p, a, b):
        (x, y), (x1, y1), (x2, y2) = p, a, b
        dx, dy = x2 - x1, y2 - y1
        if dx == dy == 0: return ((x - x1) ** 2 + (y - y1) ** 2) ** 0.5
        t = max(0, min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)))
        return ((x - x1 - t * dx) ** 2 + (y - y1 - t * dy) ** 2) ** 0.5
    keep = [False] * len(pts); keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        best, bi = 0, -1
        for i in range(a + 1, b):
            dd = d(pts[i], pts[a], pts[b])
            if dd > best: best, bi = dd, i
        if best > tol: keep[bi] = True; stack += [(a, bi), (bi, b)]
    return [p for p, k in zip(pts, keep) if k]

def rings(geom):
    if geom['type'] == 'Polygon': return [geom['coordinates'][0]]
    if geom['type'] == 'MultiPolygon': return [p[0] for p in geom['coordinates']]
    return []

def lines(geom):
    if geom['type'] == 'LineString': return [geom['coordinates']]
    if geom['type'] == 'MultiLineString': return geom['coordinates']
    return []

r2 = lambda pts: [[round(x, 2), round(y, 2)] for x, y in pts]
land = []
for f in json.load(open(f'{D}/ne_50m_land.geojson'))['features']:
    for ring in rings(f['geometry']):
        c = clip([tuple(p[:2]) for p in ring])
        if len(c) >= 3:
            s = simplify(c, 0.04)
            if len(s) >= 3: land.append(r2(s))
lakes = []
for f in json.load(open(f'{D}/ne_10m_lakes.geojson'))['features']:
    for ring in rings(f['geometry']):
        c = clip([tuple(p[:2]) for p in ring])
        if len(c) >= 3:
            xs = [p[0] for p in c]; ys = [p[1] for p in c]
            if (max(xs) - min(xs)) * (max(ys) - min(ys)) < 0.01: continue
            lakes.append(r2(simplify(c, 0.01)))
rivers = []
want = {'Nile', 'Euphrates', 'Tigris', 'Jordan', 'Orontes', 'Halys', 'Kızılırmak', 'Tiber'}
for f in json.load(open(f'{D}/ne_10m_rivers_lake_centerlines.geojson'))['features']:
    name = f['properties'].get('name') or ''
    if not any(w.lower() in name.lower() for w in want): continue
    for ln in lines(f['geometry']):
        pts = [tuple(p[:2]) for p in ln if BB[0] <= p[0] <= BB[2] and BB[1] <= p[1] <= BB[3]]
        if len(pts) >= 2: rivers.append(r2(simplify(pts, 0.02)))
json.dump({'bbox': BB, 'land': land, 'lakes': lakes, 'rivers': rivers, 'src': 'Natural Earth (public domain)'}, open(sys.argv[2], 'w'), separators=(',', ':'))
print('land', len(land), sum(len(r) for r in land), 'lakes', len(lakes), 'rivers', len(rivers))
