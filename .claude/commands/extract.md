Run the GeoShop tile extraction pipeline across `data/raw/GeoShop` and update the public GeoJSON layers.

1. Run `node scripts/import-new-tiles.js` from the project root
   - This detects any `order_*` subdirectories in `data/raw/GeoShop` that aren't yet in the manifest (`data/processed/.processed-orders.json`)
   - If new orders exist, it runs `extract-lk-geojson.js` which parses the DXF files and appends new features (deduped) into `public/lk-*.geojson`
   - The manifest is updated to record the processed orders
2. Report the summary output from the script (tiles processed, new features added per layer, updated bounding boxes)
3. If new features were added, note which GeoJSON files changed and suggest running `/deploy` to push the updated data to production
