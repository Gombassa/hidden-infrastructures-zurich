#!/usr/bin/env python3
"""
extract-water-infrastructure.py

Extracts water supply infrastructure from the WVZ NIS DXF export
(GeoShop GEO405/DXF format, LV95 / EPSG:2056 coordinates).

Outputs:
  public/route-water-pipes.geojson   — pipe segments (LineString features)
  public/route-water-nodes.geojson   — point features (hydrants, valves, etc.)

Layer naming (GEO405/DXF spec, Layerbeschrieb_GEO405-DXF.pdf):
  LKZ13 1x ...   pipe segments, x = function code
  LKZ13 2x ...   point nodes, x = type code
  LKZ13 31 ...   Spezialbauwerk (special structures)

Pipe function codes (layer position 6):
  0 = misc/unknown   1 = transport/Fernwasser   2 = feeder/Zubringer
  3 = main           4 = distribution           5 = connection
  6 = vent           7 = hydrant_connection      8 = drain
  9 = spring         A = spring_outlet           B = internal (lower accuracy)

Node type codes (layer position 6):
  0 = unknown   1 = valve   2 = hydrant   3 = vent_standpipe   5 = fountain

Usage:
  python3 scripts/extract-water-infrastructure.py \\
      --input path/to/NIS_ZH_WVZ.dxf \\
      [--bounds minLat,minLng,maxLat,maxLng] \\
      [--outdir public]

Default bounds: District 1 (8001) + 200m buffer.
Omit --bounds to extract the full DXF area.

Requires: ezdxf  (pip install ezdxf)
"""

import sys
import json
import argparse
from pathlib import Path

try:
    import ezdxf
except ImportError:
    sys.exit("ezdxf not installed. Run: pip install ezdxf --break-system-packages")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

parser = argparse.ArgumentParser(description='Extract WVZ water infrastructure from DXF to GeoJSON')
parser.add_argument('--input', required=True, help='Path to NIS_ZH_WVZ.dxf')
parser.add_argument('--bounds', default=None,
                    help='minLat,minLng,maxLat,maxLng (WGS84). Default: District 1 + 200m buffer')
parser.add_argument('--outdir', default='public', help='Output directory (default: public)')
args = parser.parse_args()

if args.bounds:
    parts = [float(x) for x in args.bounds.split(',')]
    MIN_LAT, MIN_LNG, MAX_LAT, MAX_LNG = parts
else:
    # District 1 (8001) bounding box with ~200m buffer
    MIN_LAT, MIN_LNG = 47.366, 8.534
    MAX_LAT, MAX_LNG = 47.380, 8.550

outdir = Path(args.outdir)
outdir.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------------------------
# LV95 (EPSG:2056) → WGS84
# Swisstopo approximate formula — accurate to <1m within Switzerland.
# No pyproj dependency required.
# ---------------------------------------------------------------------------

def lv95_to_wgs84(e, n):
    """Convert LV95 easting/northing to (lat, lng) WGS84."""
    e_ = (e - 2_600_000) / 1_000_000
    n_ = (n - 1_200_000) / 1_000_000

    lng_raw = (
        2.6779094
        + 4.728982 * e_
        + 0.791484 * e_ * n_
        + 0.1306 * e_ * n_ * n_
        - 0.0436 * e_ * e_ * e_
    )
    lat_raw = (
        16.9023892
        + 3.238272 * n_
        - 0.270978 * e_ * e_
        - 0.002528 * n_ * n_
        - 0.0447 * e_ * e_ * n_
        - 0.014 * n_ * n_ * n_
    )
    return lat_raw * 100 / 36, lng_raw * 100 / 36


def in_bounds(lat, lng):
    return MIN_LAT <= lat <= MAX_LAT and MIN_LNG <= lng <= MAX_LNG


# ---------------------------------------------------------------------------
# Layer name parsing
# ---------------------------------------------------------------------------

PIPE_FUNCTION = {
    '0': 'misc',
    '1': 'transport',
    '2': 'feeder',
    '3': 'main',
    '4': 'distribution',
    '5': 'connection',
    '6': 'vent',
    '7': 'hydrant_connection',
    '8': 'drain',
    '9': 'spring',
    'A': 'spring_outlet',
    'B': 'internal',
}

NODE_TYPE = {
    '0': 'unknown',
    '1': 'valve',
    '2': 'hydrant',
    '3': 'vent_standpipe',
    '5': 'fountain',
}

EXCLUDE_PIPE_FUNCTIONS = {'misc', 'internal'}   # code 0 (misc/unknown), B (lower accuracy)
EXCLUDE_NODE_TYPES     = {'unknown'}             # code 0


def parse_wvz_layer(layer_name):
    """
    Returns a dict with 'kind' key, or None if not a WVZ layer.
    kind = 'pipe' | 'node' | 'structure' | 'cable'
    """
    if not layer_name.startswith('LKZ13'):
        return None
    if len(layer_name) < 7:
        return None

    element = layer_name[5]   # '1'=line, '2'=point, '3'=structure, '4'=cable
    code = layer_name[6].upper()

    if element == '1':
        return {'kind': 'pipe', 'function': PIPE_FUNCTION.get(code, 'unknown')}
    if element == '2':
        return {'kind': 'node', 'node_type': NODE_TYPE.get(code, 'unknown')}
    if element == '3':
        return {'kind': 'structure'}
    if element == '4':
        return {'kind': 'cable'}
    return None


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

print(f'Reading {args.input} ...')
doc = ezdxf.readfile(args.input)

# GeoShop DXF exports use 'Layout1' not 'Model'
layout_name = 'Layout1'
if layout_name not in [l.name for l in doc.layouts]:
    layout_name = doc.layouts[0].name
layout = doc.layouts.get(layout_name)

entities = list(layout)
print(f'Layout "{layout_name}": {len(entities)} entities')

pipe_features = []
node_features = []
skipped_oob = 0
skipped_layer = 0
skipped_excl = 0
skipped_other = 0

for entity in entities:
    layer_name = entity.dxf.layer if entity.dxf.hasattr('layer') else ''
    layer_info = parse_wvz_layer(layer_name)

    if layer_info is None:
        skipped_layer += 1
        continue

    etype = entity.dxftype()

    # ---- Pipe segments (POLYLINE or LWPOLYLINE) ----
    if etype in ('POLYLINE', 'LWPOLYLINE') and layer_info['kind'] == 'pipe':
        if layer_info['function'] in EXCLUDE_PIPE_FUNCTIONS:
            skipped_excl += 1
            continue

        if etype == 'LWPOLYLINE':
            coords_lv95 = [(pt[0], pt[1]) for pt in entity.get_points()]
        else:
            coords_lv95 = [(v.dxf.location.x, v.dxf.location.y) for v in entity.vertices]

        if len(coords_lv95) < 2:
            continue

        coords_wgs84 = [lv95_to_wgs84(e, n) for e, n in coords_lv95]

        # Include segment if at least one vertex is in bounds
        if not any(in_bounds(lat, lng) for lat, lng in coords_wgs84):
            skipped_oob += 1
            continue

        pipe_features.append({
            'type': 'Feature',
            'geometry': {
                'type': 'LineString',
                'coordinates': [[round(lng, 7), round(lat, 7)] for lat, lng in coords_wgs84],
            },
            'properties': {
                'layer': layer_name,
                'function': layer_info['function'],
            },
        })

    # ---- Point nodes (INSERT = block reference symbol) ----
    elif etype == 'INSERT' and layer_info['kind'] in ('node', 'structure'):
        if layer_info.get('node_type') in EXCLUDE_NODE_TYPES:
            skipped_excl += 1
            continue

        x, y = entity.dxf.insert.x, entity.dxf.insert.y
        lat, lng = lv95_to_wgs84(x, y)

        if not in_bounds(lat, lng):
            skipped_oob += 1
            continue

        node_features.append({
            'type': 'Feature',
            'geometry': {
                'type': 'Point',
                'coordinates': [round(lng, 7), round(lat, 7)],
            },
            'properties': {
                'layer': layer_name,
                'kind': layer_info['kind'],
                'node_type': layer_info.get('node_type'),
            },
        })

    else:
        skipped_other += 1

# ---------------------------------------------------------------------------
# Write output
# ---------------------------------------------------------------------------

pipes_path = outdir / 'route-water-pipes.geojson'
nodes_path = outdir / 'route-water-nodes.geojson'

pipes_path.write_text(json.dumps({'type': 'FeatureCollection', 'features': pipe_features}), encoding='utf-8')
nodes_path.write_text(json.dumps({'type': 'FeatureCollection', 'features': node_features}), encoding='utf-8')

print(f'\nResults:')
print(f'  Pipe segments:  {len(pipe_features):4d}  → {pipes_path}')
print(f'  Point features: {len(node_features):4d}  → {nodes_path}')
print(f'  Skipped (out of bounds): {skipped_oob}')
print(f'  Skipped (excluded type): {skipped_excl}')
print(f'  Skipped (non-WVZ layer): {skipped_layer}')
print(f'  Skipped (other entity type): {skipped_other}')

# Breakdown by pipe function
if pipe_features:
    by_fn = {}
    for f in pipe_features:
        fn = f['properties']['function']
        by_fn[fn] = by_fn.get(fn, 0) + 1
    print(f'\nPipe segments by function:')
    for fn, count in sorted(by_fn.items(), key=lambda x: -x[1]):
        print(f'  {fn:<22} {count}')

# Breakdown by node type
if node_features:
    by_type = {}
    for f in node_features:
        t = f['properties'].get('node_type') or f['properties']['kind']
        by_type[t] = by_type.get(t, 0) + 1
    print(f'\nPoint features by type:')
    for t, count in sorted(by_type.items(), key=lambda x: -x[1]):
        print(f'  {t:<22} {count}')
