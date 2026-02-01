# Phase 0 Completion Report

**Date:** February 1, 2026
**Duration:** 1 day (originally planned 2-4 weeks)
**Status:** COMPLETE

---

## Summary

Phase 0 research exceeded expectations. The VBZ Infrastruktur OGD dataset provides complete tram electrical infrastructure data, eliminating the need for EWZ partnership negotiations and enabling immediate progression to Phase 1.

---

## Data Acquisition

### Infrastructure Data Acquired

| Data Type | Count | Source |
|-----------|-------|--------|
| Overhead wire segments | 1,689 | VBZ OGD |
| Support poles | 258 | VBZ OGD |
| Power feeders | 366 | VBZ OGD |
| Substations identified | 71 | Clustering analysis |
| Buildings along route | 1,872 | City of Zurich |

### Data Files Created

- `route-tram-powerlines.geojson` - 1,689 overhead wire segments
- `route-tram-masts.geojson` - 258 support poles
- `route-tram-feeders.geojson` - 366 power feeders
- `substations.geojson` - 71 substation locations

---

## API Testing

### VBZ Real-Time API

- **9 tram lines** serve our route: 2, 4, 7, 8, 9, 10, 11, 13, 15
- **100% coverage** across all 7 route stops
- Real-time tram positions accessible
- Schedule data available for all stops
- Delay information integrated

---

## Tram Position Simulation

### Approach: Schedule-Based Interpolation

1. Fetch tram schedules from VBZ API
2. Calculate travel time between stops (distance / 15 km/h avg speed)
3. Determine which trams are currently in transit
4. Interpolate position along route based on elapsed time
5. Apply real-time delays for accuracy
6. Update positions every 10 seconds

### Example Calculation

```
Tram 11: Rennweg → Bahnhofstrasse/HB
- Distance: 359m
- Travel time: 86 seconds
- Departed: 18:21:00 (actual, +1 min delay)
- Current time: 18:21:30
- Progress: 30s / 86s = 35% complete
- Position: 35% along line between stops
```

---

## Known Limitation: Straight-Line Interpolation

**Issue:** Current simulation uses straight-line interpolation between stop GPS coordinates. Actual tram tracks follow curved paths.

**Impact:**
- GPS phone accuracy: ±5-10m
- Simulation offset: ±10-20m
- Combined error budget: ±15-30m

**Mitigation:**
- Phase 1: Use 30-40m audio trigger radius
- Phase 1.5: Implement geometry-snapping to powerline curves
- Phase 2: Reduce trigger radius to 15-20m

---

## Tools & Scripts Created

| Script | Purpose |
|--------|---------|
| `tests/find-substations.py` | Clusters feeders to identify substations |
| `tests/test-vbz-realtime.py` | Tests VBZ API endpoints |
| `tests/test-tram-stops.py` | Analyzes tram coverage on route |
| `tests/simulate-tram-positions.py` | Snapshot position simulator |
| `tests/simulate-tram-positions-live.py` | Live-updating visualization |

### Output Files

| File | Description |
|------|-------------|
| `data/processed/substations.geojson` | 71 substation locations |
| `data/processed/substations-map.html` | Interactive substation map |
| `data/processed/route-tram-stops.json` | Tram line analysis |
| `data/processed/tram-simulation-live.html` | Live tram position map |

---

## Phase 1 Readiness

- [x] Complete and accurate infrastructure data
- [x] Real-time data access confirmed
- [x] Simulation engine proven
- [x] Development environment set up
- [x] Route validated digitally

---

## Strategic Pivot

| Original Plan | New MVP Scope |
|---------------|---------------|
| City-wide electrical grid | Tram power network |
| Substations, underground cables | Overhead wires, visible infrastructure |
| Waiting for EWZ partnership | Ready immediately |

**Why This Is Better:**
- Complete data access (no waiting)
- Visible infrastructure (users see what they hear)
- Real-time consumption events (trams drawing power)
- Iconic Zurich feature (trams are beloved)
- 600V DC system is dramatic and interesting
- Can expand to full grid in Phase 2
