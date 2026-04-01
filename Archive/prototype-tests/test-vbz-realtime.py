#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test VBZ real-time tram position API.
Checks update frequency and data format.
"""

import urllib.request
import urllib.parse
import json
import time
from datetime import datetime

def test_vbz_api():
    """
    Test various VBZ real-time endpoints.
    """
    
    # Properly encode station names
    station_stadelhofen = urllib.parse.quote("Zürich, Stadelhofen")
    station_hb = urllib.parse.quote("Zürich HB")
    
    # Possible endpoints (try each)
    endpoints = [
        # Swiss public transport API (most reliable)
        f"https://transport.opendata.ch/v1/stationboard?station={station_stadelhofen}&limit=5",
        
        # Alternative - Zürich HB (bigger station, more traffic)
        f"https://transport.opendata.ch/v1/stationboard?station={station_hb}&limit=5",
        
        # Search.ch API
        f"https://timetable.search.ch/api/stationboard.json?stop={station_stadelhofen}&limit=5",
        
        # Try locations endpoint (real-time vehicle positions)
        f"https://transport.opendata.ch/v1/locations?query={urllib.parse.quote('Zürich')}",
    ]
    
    print("Testing VBZ Real-Time APIs...")
    print("=" * 60)
    
    for i, url in enumerate(endpoints, 1):
        print(f"\n[{i}] Testing: {urllib.parse.unquote(url)[:80]}...")
        try:
            req = urllib.request.Request(url)
            req.add_header('User-Agent', 'InvisibleInfrastructures/1.0')
            req.add_header('Accept', 'application/json')
            
            with urllib.request.urlopen(req, timeout=10) as response:
                if response.status == 200:
                    content = response.read()
                    data = json.loads(content.decode('utf-8'))
                    
                    print(f"SUCCESS! Status: {response.status}")
                    print(f"\nResponse preview:")
                    preview = json.dumps(data, indent=2, ensure_ascii=False)
                    print(preview[:800] + "\n..." if len(preview) > 800 else preview)
                    
                    # Save full response
                    output_file = f'data/processed/vbz-api-test-{i}.json'
                    with open(output_file, 'w', encoding='utf-8') as f:
                        json.dump(data, f, indent=2, ensure_ascii=False)
                    print(f"\nSaved full response: {output_file}")
                    
                    # Analyze structure
                    print(f"\nData Structure:")
                    analyze_structure(data)
                    
                    return urllib.parse.unquote(url), data
                else:
                    print(f"Failed with status: {response.status}")
        except urllib.error.HTTPError as e:
            print(f"HTTP Error: {e.code} - {e.reason}")
        except urllib.error.URLError as e:
            print(f"URL Error: {e.reason}")
        except Exception as e:
            print(f"Error: {type(e).__name__}: {str(e)}")
    
    print("\n" + "=" * 60)
    print("WARNING: No endpoints responded successfully.")
    print("\nManual Research Options:")
    print("1. Visit: https://opentransportdata.swiss/")
    print("2. Check: https://transport.opendata.ch/ (documentation)")
    print("3. Alternative: Use scheduled timetable data instead of real-time")
    return None, None

def analyze_structure(data):
    """
    Analyze the structure of returned data.
    """
    if isinstance(data, dict):
        print(f"  Type: Dictionary")
        print(f"  Keys: {list(data.keys())}")
        
        # Look for common fields
        if 'stationboard' in data:
            board = data.get('stationboard', [])
            print(f"  Stationboard entries: {len(board)}")
            if len(board) > 0:
                print(f"  First entry keys: {list(board[0].keys())}")
                first = board[0]
                category = first.get('category', '')
                number = first.get('number', '')
                to = first.get('to', '')
                print(f"  Example: {category} {number} to {to}")
        
        if 'connections' in data:
            print(f"  Connections: {len(data.get('connections', []))}")
        
        if 'stations' in data:
            print(f"  Stations: {len(data.get('stations', []))}")
            
    elif isinstance(data, list):
        print(f"  Type: List")
        print(f"  Length: {len(data)}")
        if len(data) > 0:
            print(f"  First item: {type(data[0])}")
            if isinstance(data[0], dict):
                print(f"  First item keys: {list(data[0].keys())}")

def test_update_frequency(url, samples=3, interval=10):
    """
    Test how frequently data updates.
    """
    print(f"\nTesting update frequency...")
    print(f"   Taking {samples} samples, {interval} seconds apart")
    print(f"   (This will take approximately {(samples - 1) * interval} seconds)")
    
    timestamps = []
    
    for i in range(samples):
        try:
            req = urllib.request.Request(url)
            req.add_header('User-Agent', 'InvisibleInfrastructures/1.0')
            req.add_header('Accept', 'application/json')
            
            with urllib.request.urlopen(req, timeout=10) as response:
                content = response.read()
                data = json.loads(content.decode('utf-8'))
                timestamp = datetime.now().strftime("%H:%M:%S")
                
                # Try to extract departure times
                sample_data = None
                if isinstance(data, dict) and 'stationboard' in data:
                    sample_data = data['stationboard'][:2]
                
                print(f"  Sample {i+1}/{samples} at {timestamp}")
                if sample_data:
                    for dep in sample_data:
                        category = dep.get('category', '')
                        number = dep.get('number', '')
                        to = dep.get('to', '')
                        stop = dep.get('stop', {})
                        departure = stop.get('departure', 'N/A')
                        print(f"     -> {category} {number} to {to}: {departure}")
                
                timestamps.append((timestamp, data))
                
                if i < samples - 1:
                    print(f"     Waiting {interval}s...")
                    time.sleep(interval)
        except Exception as e:
            print(f"  Error on sample {i+1}: {str(e)}")
    
    print(f"\nCollected {len(timestamps)} samples")
    
    # Save samples
    output_file = 'data/processed/vbz-frequency-test.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({
            'samples': len(timestamps),
            'interval_seconds': interval,
            'data': [{'timestamp': t, 'response': d} for t, d in timestamps]
        }, f, indent=2, ensure_ascii=False)
    print(f"Saved samples: {output_file}")
    
    return timestamps

if __name__ == '__main__':
    # Test APIs
    working_url, data = test_vbz_api()
    
    # If we found a working endpoint, test update frequency
    if working_url:
        print("\n" + "=" * 60)
        response = input("\nTest update frequency? (takes ~30s) [y/N]: ")
        if response.lower() == 'y':
            test_update_frequency(working_url)
        else:
            print("Skipped frequency test")
    
    print("\n" + "=" * 60)
    print("VBZ API test complete!")