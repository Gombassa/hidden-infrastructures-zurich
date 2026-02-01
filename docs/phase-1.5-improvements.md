# Phase 1.5 Improvements

**Timeline:** Month 7-8 (after initial launch)
**Goal:** Improve accuracy and polish based on user feedback

---

## Geometry-Snapping Algorithm

### Problem

Straight-line interpolation between stops creates 10-20m offset from actual tram tracks. Combined with GPS accuracy (±5-10m), total error reaches ±15-30m, requiring wide audio trigger radius.

### Solution

Snap tram positions to actual overhead wire geometry from VBZ data.

### Implementation

```javascript
// Load wire segments between two stops
function getWirePathBetweenStops(stopA, stopB) {
  // 1. Find all powerline segments near both stops
  // 2. Build graph of connected segments
  // 3. Find shortest path along wires between stops
  // 4. Return ordered array of LineString coordinates
}

// Calculate position along curved path
function snapTramToWires(stopA, stopB, progress) {
  const wireSegments = getWirePathBetweenStops(stopA, stopB);

  // Calculate total distance along curved path
  const totalDistance = wireSegments.reduce((sum, seg) =>
    sum + segmentLength(seg), 0);

  // Find position at progress% of total distance
  const targetDistance = totalDistance * progress;
  let cumulative = 0;

  for (const segment of wireSegments) {
    const segLen = segmentLength(segment);
    if (cumulative + segLen >= targetDistance) {
      const segProgress = (targetDistance - cumulative) / segLen;
      return interpolateAlongSegment(segment, segProgress);
    }
    cumulative += segLen;
  }
}
```

### Benefits

| Metric | Before | After |
|--------|--------|-------|
| Position error | ±20m | ±5m |
| Audio trigger radius | 30-40m | 15-20m |
| Spatial accuracy | Approximate | Precise |

### Files to Modify

- `src/js/tram-simulator.js` - Add geometry loading and snapping
- `src/js/spatial-audio.js` - Update proximity calculations
- `data/processed/` - Preprocess wire paths between stops

---

## Time-Dependent Soundscapes

Adjust audio density based on actual tram frequency throughout the day.

### Time Periods

| Period | Hours | Tram Frequency | Audio Character |
|--------|-------|----------------|-----------------|
| Rush Hour | 7-9am, 5-7pm | High | Dense, overlapping events |
| Midday | 9am-5pm | Moderate | Balanced rhythm |
| Evening | 7-11pm | Lower | Spacious, contemplative |
| Late Night | 11pm-5am | Sparse | Isolated, dramatic events |

### Implementation

```javascript
function getAudioDensity(hour) {
  if ((hour >= 7 && hour < 9) || (hour >= 17 && hour < 19)) {
    return 'rush';      // Frequent tram events, dense layers
  } else if (hour >= 9 && hour < 17) {
    return 'midday';    // Moderate frequency
  } else if (hour >= 19 && hour < 23) {
    return 'evening';   // Sparser, more ambient
  } else {
    return 'night';     // Minimal events, deep drone focus
  }
}
```

---

## Per-Line Sonic Characteristics

Assign subtle audio signatures to different tram lines based on their character.

### Line Profiles

| Line | Frequency | Character | Sound |
|------|-----------|-----------|-------|
| 4, 11 | Very High | Workhorses | Deeper, constant hum |
| 2, 8, 9 | High | Major routes | Standard tone |
| 7, 10 | Moderate | Secondary | Slightly brighter |
| 13, 15 | Lower | Peripheral | Sharper, more noticeable |

---

## Performance Optimizations

### API Polling

| Time Period | Current | Optimized |
|-------------|---------|-----------|
| Rush hour | 60s | 30s |
| Normal | 60s | 60s |
| Off-peak | 60s | 120s |
| Background | 60s | Pause |

### Caching Strategy

- Cache wire geometry locally (static data)
- Cache stop coordinates (static data)
- Cache schedule data (refresh daily)
- Only poll real-time positions actively

### Battery Optimization

- Reduce GPS polling when stationary
- Lower audio sample rate for ambient layers
- Pause updates when app backgrounded
- Provide "low power" mode option

---

## Measurement & Validation

### Before Phase 1.5

- Collect user position error reports
- Analyze GPS accuracy distribution
- Document audio trigger false positives/negatives
- Profile battery usage per session

### After Phase 1.5

- Re-test position accuracy
- Measure reduced error margin
- Compare battery usage
- User feedback on improved spatial precision
