#!/usr/bin/env python3
"""
Extract substation locations from VBZ feeder data.
Substations are identified by clustering feeder endpoints.
"""

import json
from collections import defaultdict
from math import radians, cos, sin, asin, sqrt

def haversine_distance(lon1, lat1, lon2, lat2):
    """
    Calculate distance between two points in meters.
    """
    # Convert decimal degrees to radians
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    
    # Haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    r = 6371000  # Radius of earth in meters
    return c * r

def extract_endpoints(geojson_path):
    """
    Extract all endpoints from feeder LineStrings.
    """
    with open(geojson_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    endpoints = []
    
    for feature in data['features']:
        geom = feature['geometry']
        props = feature.get('properties', {})
        
        if geom['type'] == 'LineString':
            coords = geom['coordinates']
            # Get first and last point of each feeder
            start = coords[0]
            end = coords[-1]
            
            endpoints.append({
                'lon': start[0],
                'lat': start[1],
                'properties': props,
                'type': 'start'
            })
            endpoints.append({
                'lon': end[0],
                'lat': end[1],
                'properties': props,
                'type': 'end'
            })
    
    return endpoints

def cluster_endpoints(endpoints, cluster_radius=15):
    """
    Cluster endpoints that are within cluster_radius meters.
    These clusters likely represent substations.
    """
    clusters = []
    used = set()
    
    for i, point in enumerate(endpoints):
        if i in used:
            continue
        
        cluster = [point]
        used.add(i)
        
        for j, other in enumerate(endpoints):
            if j in used:
                continue
            
            dist = haversine_distance(
                point['lon'], point['lat'],
                other['lon'], other['lat']
            )
            
            if dist <= cluster_radius:
                cluster.append(other)
                used.add(j)
        
        if len(cluster) >= 3:  # Only consider clusters with 3+ feeders
            # Calculate centroid
            avg_lon = sum(p['lon'] for p in cluster) / len(cluster)
            avg_lat = sum(p['lat'] for p in cluster) / len(cluster)
            
            clusters.append({
                'lon': avg_lon,
                'lat': avg_lat,
                'feeder_count': len(cluster),
                'cluster': cluster
            })
    
    return clusters

def generate_geojson(clusters):
    """
    Generate GeoJSON of substation locations.
    """
    features = []
    
    for i, cluster in enumerate(clusters):
        features.append({
            'type': 'Feature',
            'properties': {
                'id': i + 1,
                'feeder_count': cluster['feeder_count'],
                'type': 'substation_candidate'
            },
            'geometry': {
                'type': 'Point',
                'coordinates': [cluster['lon'], cluster['lat']]
            }
        })
    
    return {
        'type': 'FeatureCollection',
        'features': features
    }

def generate_html_map(clusters, output_path):
    """
    Generate interactive HTML map showing substations.
    """
    html = f"""<!DOCTYPE html>
<html>
<head>
    <title>Substation Locations</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
        body {{ margin: 0; padding: 0; }}
        #map {{ height: 100vh; width: 100vw; }}
        .info {{
            position: absolute;
            top: 10px;
            right: 10px;
            background: white;
            padding: 15px;
            z-index: 1000;
            font-family: Arial, sans-serif;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        }}
        .info h3 {{ margin-top: 0; }}
    </style>
</head>
<body>
    <div class="info">
        <h3>🔌 Substations Found: {len(clusters)}</h3>
        <p>Red markers = Likely substation locations</p>
        <p>Click markers for details</p>
    </div>
    <div id="map"></div>
    
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
        // Initialize map centered on route
        const map = L.map('map').setView([47.3667, 8.5490], 14);
        L.tileLayer('https://{{s}}.tile.openstreetmap.org/{{z}}/{{x}}/{{y}}.png', {{
            attribution: '© OpenStreetMap contributors'
        }}).addTo(map);
        
        // Substation locations
        const substations = {json.dumps([{'lat': c['lat'], 'lon': c['lon'], 'count': c['feeder_count']} for c in clusters])};
        
        // Add markers
        substations.forEach((sub, i) => {{
            const marker = L.marker([sub.lat, sub.lon], {{
                icon: L.icon({{
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                }})
            }}).addTo(map);
            
            marker.bindPopup(`
                <b>Substation #${{i+1}}</b><br>
                Feeders: ${{sub.count}}<br>
                Location: ${{sub.lat.toFixed(6)}}, ${{sub.lon.toFixed(6)}}
            `);
        }});
        
        // Fit map to show all substations
        if (substations.length > 0) {{
            const bounds = L.latLngBounds(substations.map(s => [s.lat, s.lon]));
            map.fitBounds(bounds, {{ padding: [50, 50] }});
        }}
    </script>
</body>
</html>"""
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)

if __name__ == '__main__':
    print("🔍 Analyzing feeder data for substations...")
    
    # Load feeders
    feeders_path = 'data/raw/route-tram-feeders.geojson'
    endpoints = extract_endpoints(feeders_path)
    print(f"   Found {len(endpoints)} feeder endpoints")
    
    # Cluster endpoints
    clusters = cluster_endpoints(endpoints, cluster_radius=15)
    print(f"   Identified {len(clusters)} potential substations")
    
    # Sort by feeder count (most likely substations first)
    clusters.sort(key=lambda x: x['feeder_count'], reverse=True)
    
    # Print results
    print("\n📍 Substation Locations:")
    print("-" * 60)
    for i, cluster in enumerate(clusters):
        print(f"Substation #{i+1}: {cluster['feeder_count']} feeders")
        print(f"  Location: {cluster['lat']:.6f}, {cluster['lon']:.6f}")
        print(f"  Google Maps: https://www.google.com/maps?q={cluster['lat']},{cluster['lon']}")
        print()
    
    # Save GeoJSON
    geojson_output = 'data/processed/substations.geojson'
    with open(geojson_output, 'w', encoding='utf-8') as f:
        json.dump(generate_geojson(clusters), f, indent=2)
    print(f"✅ Saved GeoJSON: {geojson_output}")
    
    # Generate map
    map_output = 'data/processed/substations-map.html'
    generate_html_map(clusters, map_output)
    print(f"✅ Saved interactive map: {map_output}")
    print(f"\nOpen {map_output} in your browser to see the map!")
    