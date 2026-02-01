#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Simulate tram positions along overhead wires using schedule data.
Creates realistic power consumption events without real-time GPS.
"""

import json
import urllib.request
import urllib.parse
from datetime import datetime, timedelta
from math import radians, cos, sin, asin, sqrt

def haversine_distance(lon1, lat1, lon2, lat2):
    """Calculate distance between two points in meters."""
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    return 6371000 * c

def load_route_stops():
    """Load tram stop data from our test results."""
    with open('data/processed/route-tram-stops.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    stops = []
    for result in data['results']:
        if result['success']:
            station = result['raw_data']['station']
            stops.append({
                'name': result['stop_name'],
                'lat': station['coordinate']['x'],
                'lon': station['coordinate']['y'],
                'tram_lines': list(set([t['line'] for t in result['trams']]))
            })
    
    return stops

def get_current_tram_schedule(stop_name, lines_filter=None):
    """
    Get current tram departures from a stop.
    Returns scheduled time, delay, and line number.
    """
    encoded_stop = urllib.parse.quote(f"Zürich, {stop_name}")
    url = f"https://transport.opendata.ch/v1/stationboard?station={encoded_stop}&limit=50"
    
    try:
        req = urllib.request.Request(url)
        req.add_header('User-Agent', 'InvisibleInfrastructures/1.0')
        
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode('utf-8'))
            
            trams = []
            for dep in data.get('stationboard', []):
                if dep['category'] == 'T':  # Trams only
                    line = dep['number']
                    
                    # Filter by specific lines if requested
                    if lines_filter and line not in lines_filter:
                        continue
                    
                    stop_data = dep.get('stop', {})
                    departure_str = stop_data.get('departure', '')
                    
                    # Handle None delay values
                    delay = stop_data.get('delay')
                    if delay is None:
                        delay = 0
                    
                    if departure_str:
                        try:
                            # Parse ISO timestamp - handle different formats
                            if '+' in departure_str:
                                departure_time = datetime.fromisoformat(departure_str.replace('+0100', ''))
                            else:
                                departure_time = datetime.fromisoformat(departure_str)
                            
                            trams.append({
                                'line': line,
                                'destination': dep['to'],
                                'scheduled_time': departure_time,
                                'delay_minutes': delay,
                                'actual_time': departure_time + timedelta(minutes=delay)
                            })
                        except (ValueError, TypeError) as e:
                            # Skip entries with invalid timestamps
                            print(f"    Skipping invalid timestamp for line {line}: {departure_str}")
                            continue
            
            return sorted(trams, key=lambda x: x['actual_time'])
            
    except Exception as e:
        print(f"  Error fetching schedule for {stop_name}: {e}")
        return []

def calculate_tram_positions(stop_a, stop_b, tram_line, current_time):
    """
    Calculate where trams on a specific line should be between two stops.
    
    Returns list of estimated tram positions with timestamps.
    """
    # Average tram speed in Zurich: ~15 km/h in city center
    TRAM_SPEED_MPS = 15000 / 3600  # meters per second (~4.17 m/s)
    
    # Get schedules from both stops
    departures_a = get_current_tram_schedule(stop_a['name'], [tram_line])
    departures_b = get_current_tram_schedule(stop_b['name'], [tram_line])
    
    # Calculate distance between stops
    distance = haversine_distance(stop_a['lon'], stop_a['lat'], 
                                   stop_b['lon'], stop_b['lat'])
    
    travel_time_seconds = distance / TRAM_SPEED_MPS
    
    print(f"\n  Line {tram_line}: {stop_a['name']} -> {stop_b['name']}")
    print(f"  Distance: {distance:.0f}m, Travel time: {travel_time_seconds:.0f}s")
    
    # Find trams currently in transit
    trams_in_transit = []
    
    for tram in departures_a:
        # When did this tram leave stop A?
        departure = tram['actual_time']
        
        # When should it arrive at stop B?
        arrival = departure + timedelta(seconds=travel_time_seconds)
        
        # Is it currently between the stops?
        if departure <= current_time <= arrival:
            # Calculate how far along the route it is (0.0 to 1.0)
            elapsed = (current_time - departure).total_seconds()
            progress = elapsed / travel_time_seconds
            
            # Interpolate position
            est_lat = stop_a['lat'] + (stop_b['lat'] - stop_a['lat']) * progress
            est_lon = stop_a['lon'] + (stop_b['lon'] - stop_a['lon']) * progress
            
            trams_in_transit.append({
                'line': tram_line,
                'from_stop': stop_a['name'],
                'to_stop': stop_b['name'],
                'destination': tram['destination'],
                'progress': progress,
                'position': {'lat': est_lat, 'lon': est_lon},
                'departed': departure.isoformat(),
                'arriving': arrival.isoformat()
            })
    
    return trams_in_transit

def simulate_all_trams(current_time=None):
    """
    Simulate positions of all trams on the route at current time.
    """
    if current_time is None:
        current_time = datetime.now()
    
    print(f"Simulating tram positions at: {current_time.strftime('%H:%M:%S')}")
    print("=" * 60)
    
    # Load stops along route
    stops = load_route_stops()
    
    all_active_trams = []
    
    # Check each consecutive pair of stops
    for i in range(len(stops) - 1):
        stop_a = stops[i]
        stop_b = stops[i + 1]
        
        # Find tram lines that serve both stops
        common_lines = set(stop_a['tram_lines']) & set(stop_b['tram_lines'])
        
        for line in common_lines:
            trams = calculate_tram_positions(stop_a, stop_b, line, current_time)
            all_active_trams.extend(trams)
    
    print("\n" + "=" * 60)
    print(f"Total trams currently on route: {len(all_active_trams)}")
    
    if all_active_trams:
        print("\nActive trams:")
        for tram in all_active_trams:
            print(f"  Line {tram['line']}: {tram['from_stop']} -> {tram['to_stop']}")
            print(f"    Progress: {tram['progress']*100:.1f}%")
            print(f"    Position: {tram['position']['lat']:.6f}, {tram['position']['lon']:.6f}")
    
    # Save results
    output = {
        'timestamp': current_time.isoformat(),
        'active_trams': all_active_trams,
        'count': len(all_active_trams)
    }
    
    output_file = 'data/processed/tram-simulation-snapshot.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"\nSaved snapshot: {output_file}")
    
    return all_active_trams

def generate_simulation_map(trams):
    """
    Generate HTML map showing simulated tram positions.
    """
    html = f"""<!DOCTYPE html>
<html>
<head>
    <title>Simulated Tram Positions</title>
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
    </style>
</head>
<body>
    <div class="info">
        <h3>Simulated Tram Positions</h3>
        <p>Active trams: {len(trams)}</p>
        <p>Blue markers = current estimated positions</p>
    </div>
    <div id="map"></div>
    
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
        const map = L.map('map').setView([47.3667, 8.5490], 14);
        L.tileLayer('https://{{s}}.tile.openstreetmap.org/{{z}}/{{x}}/{{y}}.png').addTo(map);
        
        const trams = {json.dumps([{'lat': t['position']['lat'], 'lon': t['position']['lon'], 'line': t['line'], 'dest': t['destination'], 'progress': t['progress']} for t in trams])};
        
        trams.forEach(tram => {{
            const marker = L.circleMarker([tram.lat, tram.lon], {{
                radius: 8,
                fillColor: '#0066ff',
                color: '#fff',
                weight: 2,
                fillOpacity: 0.8
            }}).addTo(map);
            
            marker.bindPopup(`
                <b>Line ${{tram.line}}</b><br>
                To: ${{tram.dest}}<br>
                Progress: ${{(tram.progress * 100).toFixed(1)}}%
            `);
        }});
        
        if (trams.length > 0) {{
            const bounds = L.latLngBounds(trams.map(t => [t.lat, t.lon]));
            map.fitBounds(bounds, {{ padding: [50, 50] }});
        }}
    </script>
</body>
</html>"""
    
    output_file = 'data/processed/tram-simulation-map.html'
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(html)
    
    print(f"Generated map: {output_file}")

if __name__ == '__main__':
    # Simulate current positions
    trams = simulate_all_trams()
    
    # Generate visualization
    if trams:
        generate_simulation_map(trams)
        print(f"\nOpen data/processed/tram-simulation-map.html to see current positions!")
    else:
        print("\nNo trams currently active on route (might be late evening/night)")