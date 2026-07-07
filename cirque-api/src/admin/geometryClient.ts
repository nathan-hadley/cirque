// Geometry conversion shared by the admin map editor (browser) and its tests.
//
// It is authored as a plain-JS source string so there is ONE implementation:
//   - page.ts inlines it verbatim into the admin page's <script>.
//   - geometry.test.ts evaluates it with `new Function` and exercises it.
//
// The editor draws with Terra Draw (Polygons for boulder/subarea outlines,
// Points for area/subarea labels) but the app and the `documents` table expect
// the legacy shapes: boulders + subareas are CLOSED-RING LineStrings with
// `properties: null`; areas + subarea-centers are Points with `{ name }`.
// These functions are the only thing standing between "drew a shape" and "wrote
// data the app renders", so the round trip must be exact — hence the tests.
//
// Constraints on the source below (it lives inside a template literal twice):
// no backticks and no `${` sequences.
export const GEOMETRY_CLIENT_JS = `
var DOCUMENT_GEOMETRY = {
  boulders: "polygon",
  subareas: "polygon",
  areas: "point",
  "subarea-centers": "point",
};

function ringIsClosed(ring) {
  var a = ring[0], b = ring[ring.length - 1];
  return !!a && !!b && a[0] === b[0] && a[1] === b[1];
}

// documents table -> Terra Draw features (what addFeatures consumes).
function documentToEditorFeatures(name, fc) {
  var kind = DOCUMENT_GEOMETRY[name];
  var feats = (fc && fc.features) || [];
  var out = [];
  for (var i = 0; i < feats.length; i++) {
    var f = feats[i];
    if (!f || !f.geometry) continue;
    var g = f.geometry;
    var props = f.properties || {};
    if (kind === "polygon") {
      var ring = null;
      if (g.type === "LineString") ring = g.coordinates.slice();
      else if (g.type === "Polygon") ring = (g.coordinates[0] || []).slice();
      else continue;
      if (ring.length < 3) continue;
      if (!ringIsClosed(ring)) ring.push([ring[0][0], ring[0][1]]);
      out.push({
        type: "Feature",
        properties: { mode: "polygon" },
        geometry: { type: "Polygon", coordinates: [ring] },
      });
    } else if (kind === "point") {
      if (g.type !== "Point") continue;
      out.push({
        type: "Feature",
        properties: { mode: "point", name: props.name != null ? String(props.name) : "" },
        geometry: { type: "Point", coordinates: g.coordinates.slice() },
      });
    }
  }
  return out;
}

// Terra Draw snapshot -> documents table FeatureCollection.
// Point names are read from feature.properties.name; the editor writes the
// live name onto each point before calling this.
function editorFeaturesToDocument(name, features) {
  var kind = DOCUMENT_GEOMETRY[name];
  var out = [];
  for (var i = 0; i < features.length; i++) {
    var f = features[i];
    if (!f || !f.geometry) continue;
    var g = f.geometry;
    if (kind === "polygon") {
      if (g.type !== "Polygon") continue;
      // Terra Draw already applies its own coordinatePrecision, so pass
      // coordinates through untouched: an unedited boulder re-saves byte-for-byte.
      var ring = (g.coordinates[0] || []).slice();
      if (ring.length && !ringIsClosed(ring)) ring.push([ring[0][0], ring[0][1]]);
      if (ring.length < 4) continue; // needs >=3 distinct vertices + closing point
      out.push({
        type: "Feature",
        properties: null,
        geometry: { type: "LineString", coordinates: ring },
      });
    } else if (kind === "point") {
      if (g.type !== "Point") continue;
      var nm = f.properties && f.properties.name != null ? String(f.properties.name) : "";
      out.push({
        type: "Feature",
        properties: { name: nm },
        geometry: { type: "Point", coordinates: g.coordinates.slice() },
      });
    }
  }
  return { type: "FeatureCollection", generator: "cirque-admin", features: out };
}
`;
