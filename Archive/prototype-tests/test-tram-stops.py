#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test tram-specific stops along the route.
Identifies which stops have tram service vs S-Bahn.
"""

import urllib.request
import urllib.parse
import json

def test_stop(stop_name):
    """
    Query a specific stop and return tram/bus/train breakdown.
    """
    encoded_stop = urllib.parse.quote(f"Zürich, {stop_name}")
    url = f"https://transport.opendata.ch/v1/stationboard?station={encoded_stop}&limit=20"
    
    try:
        req = urllib.request.Request(url)
        req.add_header('User-Agent', 'InvisibleInfrastructures/1.0')
        req.add_header('Accept', 'application/json')
        
        with urllib.request.urlopen(req, timeout=10) as response:
            content = response.read()
            data = json.loads(content.decode('utf-8'))
            
            # Analyze transport types
            stationboard = data.get('stationboard', [])
            
            categories = {}
            trams = []
            
            for departure in stationboard:
                cat = departure.get('category', 'Unknown')
                num = departure.get('number', '')
                to = departure.get('to', '')
                
                if cat not in categories:
                    categories[cat] = 0
                categories[cat] += 1
                
                # Collect tram lines
                if cat == 'T' or cat.startswith('Tram'):
                    trams.append({
                        'line': num,
                        'destination': to,
                        'departure': departure.get('stop', {}).get('departure', '')
                    })
            
            return {
                'stop_name': stop_name,
                'success': True,
                'categories': categories,
                'trams': trams,
                'total_departures': len(stationboard),
                'raw_data': data
            }
            
    except Exception as e:
        return {
            'stop_name': stop_name,
            'success': False,
            'error': str(e)
        }

if __name__ == '__main__':
    # Major stops along your route (Stadelhofen -> Bahnhofstrasse 45)
    route_stops = [
        'Bellevue',
        'Paradeplatz',
        'Rennweg',
        'Bahnhofstrasse/HB',
        'Bürkliplatz',
        'Opernhaus',
        'Stockerstrasse'
    ]
    
    print("Testing tram stops along route...")
    print("=" * 60)
    
    results = []
    
    for stop in route_stops:
        print(f"\nTesting: {stop}")
        result = test_stop(stop)
        results.append(result)
        
        if result['success']:
            print(f"  Total departures: {result['total_departures']}")
            print(f"  Transport types: {result['categories']}")
            
            if result['trams']:
                print(f"  Tram lines: {set([t['line'] for t in result['trams']])}")
                print(f"  Example trams:")
                for tram in result['trams'][:3]:
                    print(f"    - Line {tram['line']} to {tram['destination']}")
            else:
                print("  WARNING: No trams found at this stop!")
        else:
            print(f"  ERROR: {result['error']}")
    
    # Save results
    output_file = 'data/processed/route-tram-stops.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({
            'route': 'Stadelhofen to Bahnhofstrasse 45',
            'stops_tested': len(route_stops),
            'timestamp': '2026-02-01',
            'results': results
        }, f, indent=2, ensure_ascii=False)
    
    print("\n" + "=" * 60)
    print(f"Saved results: {output_file}")
    
    # Summary
    print("\nSummary:")
    tram_stops = [r for r in results if r['success'] and r['trams']]
    print(f"  Stops with trams: {len(tram_stops)}/{len(results)}")
    
    all_tram_lines = set()
    for r in tram_stops:
        all_tram_lines.update([t['line'] for t in r['trams']])
    
    print(f"  Tram lines on route: {sorted(all_tram_lines)}")