#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Live-updating tram position simulator.
Generates an HTML map that auto-refreshes positions.
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

def generate_live_map():
    """
    Generate HTML map with JavaScript that fetches positions every 10 seconds.
    """
    stops = load_route_stops()
    
    # Calculate stop pairs with distances
    stop_pairs = []
    for i in range(len(stops) - 1):
        stop_a = stops[i]
        stop_b = stops[i + 1]
        common_lines = list(set(stop_a['tram_lines']) & set(stop_b['tram_lines']))
        
        distance = haversine_distance(stop_a['lon'], stop_a['lat'], 
                                       stop_b['lon'], stop_b['lat'])
        
        stop_pairs.append({
            'stop_a': {'name': stop_a['name'], 'lat': stop_a['lat'], 'lon': stop_a['lon']},
            'stop_b': {'name': stop_b['name'], 'lat': stop_b['lat'], 'lon': stop_b['lon']},
            'lines': common_lines,
            'distance': distance
        })
    
    html = f"""<!DOCTYPE html>
<html>
<head>
    <title>Live Tram Positions</title>
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
            max-width: 250px;
        }}
        .info h3 {{ margin-top: 0; }}
        .update-status {{
            color: #666;
            font-size: 12px;
            margin-top: 10px;
        }}
        .tram-line {{
            display: inline-block;
            padding: 2px 6px;
            margin: 2px;
            background: #0066ff;
            color: white;
            border-radius: 3px;
            font-size: 11px;
        }}
    </style>
</head>
<body>
    <div class="info">
        <h3>Live Tram Positions</h3>
        <p>Active trams: <span id="tram-count">...</span></p>
        <p>Lines on route: <span id="tram-lines">...</span></p>
        <div class="update-status">
            Last update: <span id="last-update">...</span><br>
            Next update in: <span id="countdown">10</span>s
        </div>
    </div>
    <div id="map"></div>
    
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
        const map = L.map('map').setView([47.3667, 8.5490], 14);
        L.tileLayer('https://{{s}}.tile.openstreetmap.org/{{z}}/{{x}}/{{y}}.png').addTo(map);
        
        const TRAM_SPEED_MPS = 15000 / 3600; // ~15 km/h average
        const UPDATE_INTERVAL = 10000; // Update every 10 seconds
        
        const stopPairs = {json.dumps(stop_pairs)};
        
        let tramMarkers = [];
        
        function haversineDistance(lon1, lat1, lon2, lat2) {{
            const R = 6371000;
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                     Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                     Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c;
        }}
        
        async function fetchTramSchedule(stopName, lines) {{
            const url = `https://transport.opendata.ch/v1/stationboard?station=Zürich, ${{encodeURIComponent(stopName)}}&limit=50`;
            
            try {{
                const response = await fetch(url);
                const data = await response.json();
                
                const trams = [];
                for (const dep of data.stationboard || []) {{
                    if (dep.category === 'T' && lines.includes(dep.number)) {{
                        const delay = dep.stop?.delay || 0;
                        const departureStr = dep.stop?.departure;
                        
                        if (departureStr) {{
                            const scheduled = new Date(departureStr);
                            const actual = new Date(scheduled.getTime() + delay * 60000);
                            
                            trams.push({{
                                line: dep.number,
                                destination: dep.to,
                                scheduledTime: scheduled,
                                actualTime: actual,
                                delay: delay
                            }});
                        }}
                    }}
                }}
                
                return trams;
            }} catch (error) {{
                console.error(`Error fetching schedule for ${{stopName}}:`, error);
                return [];
            }}
        }}
        
        async function calculateTramPositions() {{
            const now = new Date();
            const allTrams = [];
            
            for (const pair of stopPairs) {{
                const travelTime = pair.distance / TRAM_SPEED_MPS;
                
                // Fetch schedules for stop A
                const departures = await fetchTramSchedule(pair.stop_a.name, pair.lines);
                
                for (const tram of departures) {{
                    const departure = tram.actualTime;
                    const arrival = new Date(departure.getTime() + travelTime * 1000);
                    
                    // Is tram currently between stops?
                    if (departure <= now && now <= arrival) {{
                        const elapsed = (now - departure) / 1000;
                        const progress = elapsed / travelTime;
                        
                        // Interpolate position
                        const lat = pair.stop_a.lat + (pair.stop_b.lat - pair.stop_a.lat) * progress;
                        const lon = pair.stop_a.lon + (pair.stop_b.lon - pair.stop_a.lon) * progress;
                        
                        allTrams.push({{
                            line: tram.line,
                            destination: tram.destination,
                            fromStop: pair.stop_a.name,
                            toStop: pair.stop_b.name,
                            progress: progress,
                            lat: lat,
                            lon: lon,
                            delay: tram.delay
                        }});
                    }}
                }}
            }}
            
            return allTrams;
        }}
        
        function updateMap(trams) {{
            // Remove old markers
            tramMarkers.forEach(marker => map.removeLayer(marker));
            tramMarkers = [];
            
            // Add new markers
            trams.forEach(tram => {{
                const marker = L.circleMarker([tram.lat, tram.lon], {{
                    radius: 8,
                    fillColor: tram.delay > 0 ? '#ff6600' : '#0066ff',
                    color: '#fff',
                    weight: 2,
                    fillOpacity: 0.9
                }}).addTo(map);
                
                marker.bindPopup(`
                    <b>Line ${{tram.line}}</b><br>
                    To: ${{tram.destination}}<br>
                    ${{tram.fromStop}} → ${{tram.toStop}}<br>
                    Progress: ${{(tram.progress * 100).toFixed(1)}}%
                    ${{tram.delay > 0 ? `<br><span style="color: #ff6600;">+${{tram.delay}} min delay</span>` : ''}}
                `);
                
                tramMarkers.push(marker);
            }});
            
            // Update info panel
            document.getElementById('tram-count').textContent = trams.length;
            
            const lines = [...new Set(trams.map(t => t.line))].sort();
            document.getElementById('tram-lines').innerHTML = 
                lines.map(l => `<span class="tram-line">${{l}}</span>`).join('');
            
            document.getElementById('last-update').textContent = 
                new Date().toLocaleTimeString();
        }}
        
        let countdown = 10;
        setInterval(() => {{
            countdown--;
            if (countdown < 0) countdown = 10;
            document.getElementById('countdown').textContent = countdown;
        }}, 1000);
        
        async function refresh() {{
            console.log('Updating tram positions...');
            const trams = await calculateTramPositions();
            updateMap(trams);
            countdown = 10;
        }}
        
        // Initial load
        refresh();
        
        // Auto-refresh every 10 seconds
        setInterval(refresh, UPDATE_INTERVAL);
    </script>
</body>
</html>"""
    
    output_file = 'data/processed/tram-simulation-live.html'
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(html)
    
    print(f"Generated live map: {output_file}")
    print("Open in browser to see trams updating every 10 seconds!")

if __name__ == '__main__':
    generate_live_map()