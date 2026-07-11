# Boulder Problem Data Entry Tool

> **Legacy tool.** Since [ADR 0001](../../docs/adr/0001-cloud-source-of-truth.md) the
> `cirque-api` Cloudflare Worker (D1 + R2) is the source of truth for problem data, and
> problems are added/edited through the admin portal
> (<https://cirque-api.nathan-hadley.workers.dev/admin>). This local tool and
> `problems.geojson` are retained only as authoring/reference helpers; there is no longer a
> `data-sync` step that generates bundled app assets. See
> [`cirque-api/README.md`](../../cirque-api/README.md) for the current workflow.

**How to use**:
1. Double-click `problem-entry-tool.html` in Finder to open in your browser
2. Fill in the problem details form:
   - Name, grade, subarea, color, order (all required)
   - Description (optional)
   - Real-world coordinates (latitude/longitude)
3. Choose a topo image file
4. Click on the image to record the climbing line coordinates
5. Click "Add Problem" to add it to the dataset
6. Use "Load Existing GeoJSON" to import current problems.geojson
7. Use "Download GeoJSON" to save your updated dataset
8. Import the resulting problems into `cirque-api` via the admin portal (see
   [`cirque-api/README.md`](../../cirque-api/README.md))


