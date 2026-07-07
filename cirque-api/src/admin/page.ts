// Single-file admin page served at GET /admin (behind Cloudflare Access).
// Vanilla JS against /v1/admin/*. Kept deliberately small.
//
// The Documents section is a map editor (MapLibre + Terra Draw): draw boulder
// outlines / subarea polygons / area + label points directly on satellite
// imagery and save straight to D1 — no JOSM export/import round trip. The
// geometry <-> documents-table conversion is shared, tested code (geometryClient).
//
// Inline JS uses string concatenation (no template literals) so the whole file
// can live inside this backtick string. Same rule applies to GEOMETRY_CLIENT_JS.
import { GEOMETRY_CLIENT_JS } from "./geometryClient";

const MAPLIBRE_VERSION = "5.24.0";
const TERRA_DRAW_VERSION = "1.31.2";
const TERRA_DRAW_ADAPTER_VERSION = "1.4.1";

export const ADMIN_HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cirque Admin</title>
<link rel="stylesheet" href="https://unpkg.com/maplibre-gl@${MAPLIBRE_VERSION}/dist/maplibre-gl.css">
<style>
  body { font: 14px/1.4 system-ui, sans-serif; margin: 1.5rem; max-width: 1100px; }
  h1 { font-size: 1.3rem; }
  h2 { font-size: 1.1rem; margin-top: 2rem; }
  table { border-collapse: collapse; width: 100%; }
  th, td { text-align: left; padding: .35rem .5rem; border-bottom: 1px solid #ddd; }
  tr:hover { background: #f6f6f6; cursor: pointer; }
  .pending { background: #fff7e0; }
  .rejected { color: #999; }
  .filters button, .actions button { margin-right: .5rem; }
  #editor { border: 1px solid #ccc; padding: 1rem; margin: 1rem 0; display: none; }
  #editor label { display: block; margin: .4rem 0; }
  #editor input, #editor textarea { width: 100%; box-sizing: border-box; }
  .badge { padding: .1rem .4rem; border-radius: 4px; font-size: .8rem; }
  .badge.pending { background: #f5c542; }
  .badge.approved { background: #9be29b; }
  .badge.rejected { background: #e0e0e0; }
  img.topo { max-width: 320px; display: block; margin: .5rem 0; }
  #geoToolbar { display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; margin: .5rem 0; }
  #geoToolbar select, #geoToolbar button, #geoToolbar input { padding: .3rem .5rem; }
  #geoToolbar button.on { background: #2b6cb0; color: #fff; }
  #map { width: 100%; height: 480px; border: 1px solid #ccc; border-radius: 4px; }
  #geoStatus { min-height: 1.2em; color: #555; margin: .3rem 0; }
  #geoStatus.err { color: #c00; }
  #nameBox { display: none; gap: .4rem; align-items: center; }
  #rawWrap { margin-top: .6rem; }
  #rawWrap textarea { width: 100%; height: 220px; font-family: monospace; }
  details > summary { cursor: pointer; color: #2b6cb0; }
  .hint { color: #777; font-size: .85rem; }
</style>
</head>
<body>
<h1>Cirque Admin</h1>
<div class="filters">
  <button data-f="all">All</button>
  <button data-f="pending">Pending</button>
  <button data-f="approved">Approved</button>
  <button data-f="rejected">Rejected</button>
</div>
<div id="editor"></div>
<table id="problems"><thead>
  <tr><th>Status</th><th>Name</th><th>Grade</th><th>Subarea</th><th>Submitted by</th><th>Created</th></tr>
</thead><tbody></tbody></table>

<h2>Map editor</h2>
<p class="hint">Draw boulder outlines, subarea polygons, and area / label points on the map, then Save. Existing problems show as reference dots.</p>
<div id="geoToolbar">
  <select id="docName">
    <option value="boulders">boulders (outlines)</option>
    <option value="subareas">subareas (polygons)</option>
    <option value="areas">areas (points)</option>
    <option value="subarea-centers">subarea-centers (labels)</option>
  </select>
  <button id="btnDraw" title="Draw a new shape">Draw</button>
  <button id="btnSelect" title="Select / move / edit vertices">Select</button>
  <button id="btnDelete" title="Delete the selected shape">Delete</button>
  <span id="nameBox"><label for="ptName" style="margin:0">Name</label><input id="ptName" placeholder="label text"></span>
  <button id="btnSave">Save</button>
  <button id="btnReload" title="Discard edits, reload from server">Reload</button>
</div>
<div id="geoStatus"></div>
<div id="map"></div>
<div id="rawWrap">
  <details>
    <summary>Advanced: edit raw GeoJSON</summary>
    <p class="hint">Escape hatch — pasted GeoJSON replaces the whole document. Loading the map above overwrites this box.</p>
    <button id="rawLoad">Load</button>
    <button id="rawSave">Save raw</button>
    <textarea id="rawBody" placeholder="Load a document..."></textarea>
  </details>
</div>

<script src="https://unpkg.com/maplibre-gl@${MAPLIBRE_VERSION}/dist/maplibre-gl.js"></script>
<script src="https://unpkg.com/terra-draw@${TERRA_DRAW_VERSION}/dist/terra-draw.umd.js"></script>
<script src="https://unpkg.com/terra-draw-maplibre-gl-adapter@${TERRA_DRAW_ADAPTER_VERSION}/dist/terra-draw-maplibre-gl-adapter.umd.js"></script>
<script>
${GEOMETRY_CLIENT_JS}
</script>
<script>
let problems = [];
let filter = "all";

async function api(path, opts) {
  const res = await fetch(path, opts);
  if (!res.ok) throw new Error(path + " -> " + res.status + " " + await res.text());
  return res.json();
}

async function load() {
  problems = await api("/v1/admin/problems");
  render();
  if (window.__geoRefreshProblems) window.__geoRefreshProblems();
}

function render() {
  const rows = problems.filter(p => filter === "all" || p.status === filter);
  document.querySelector("#problems tbody").innerHTML = rows.map(p =>
    '<tr class="' + p.status + '" data-id="' + p.id + '">' +
    '<td><span class="badge ' + p.status + '">' + p.status + "</span></td>" +
    "<td>" + esc(p.name) + "</td><td>" + esc(p.grade) + "</td><td>" + esc(p.subarea) + "</td>" +
    "<td>" + esc(p.submitted_by_name || "-") + "</td><td>" + (p.created_at || "").slice(0, 10) + "</td></tr>"
  ).join("");
}

function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, ch => "&#" + ch.charCodeAt(0) + ";"); }

function edit(id) {
  const p = problems.find(x => x.id === id);
  const el = document.getElementById("editor");
  el.style.display = "block";
  el.innerHTML =
    "<b>" + esc(p.name) + "</b> <span class='badge " + p.status + "'>" + p.status + "</span>" +
    (p.submitted_by_email ? " - " + esc(p.submitted_by_name) + " &lt;" + esc(p.submitted_by_email) + "&gt;" : "") +
    (p.topo_key ? '<img class="topo" src="/images/' + esc(p.topo_key) + '/full.webp">' : "") +
    ["name", "grade", "subarea", "color", "sort_order", "description", "lat", "lng", "line"].map(f =>
      "<label>" + f + '<input name="' + f + '" value="' + esc(p[f]) + '"></label>'
    ).join("") +
    (p.review_note ? "<p>Review note: " + esc(p.review_note) + "</p>" : "") +
    '<div class="actions">' +
    '<button data-act="save">Save</button>' +
    '<button data-act="approve">Approve</button>' +
    '<button data-act="reject">Reject</button>' +
    '<button data-act="close">Close</button>' +
    "</div>";
  el.querySelector(".actions").addEventListener("click", (e) => {
    const act = e.target.dataset.act;
    if (act === "save") save(id);
    else if (act === "approve") review(id, "approved");
    else if (act === "reject") review(id, "rejected");
    else if (act === "close") el.style.display = "none";
  });
}

async function save(id) {
  const body = {};
  let invalid = null;
  document.querySelectorAll("#editor input").forEach(i => {
    let v = i.value === "" ? null : i.value;
    if (["sort_order", "lat", "lng"].includes(i.name) && v !== null) {
      v = Number(v);
      if (Number.isNaN(v)) invalid = i.name + " must be a number";
    }
    if (["name", "lat", "lng"].includes(i.name) && v === null) invalid = i.name + " is required";
    body[i.name] = v;
  });
  if (invalid) { alert(invalid); return; }
  try {
    await api("/v1/admin/problems/" + id, { method: "PUT", body: JSON.stringify(body) });
    await load();
  } catch (e) { alert(e.message); }
}

async function review(id, status) {
  const note = status === "rejected" ? prompt("Rejection note (optional):") : null;
  await api("/v1/admin/problems/" + id + "/" + (status === "approved" ? "approve" : "reject"),
    { method: "POST", body: JSON.stringify({ note }) });
  await load();
  document.getElementById("editor").style.display = "none";
}

document.querySelector("#problems tbody").addEventListener("click", e => {
  const tr = e.target.closest("tr");
  if (tr) edit(tr.dataset.id);
});
document.querySelectorAll(".filters button").forEach(b =>
  b.addEventListener("click", () => { filter = b.dataset.f; render(); }));

load().catch(e => document.body.insertAdjacentHTML("afterbegin", "<p style='color:red'>" + esc(e.message) + "</p>"));
</script>

<script>
// ---- Map editor -------------------------------------------------------------
(function () {
  const statusEl = document.getElementById("geoStatus");
  function status(msg, isErr) { statusEl.textContent = msg || ""; statusEl.className = isErr ? "err" : ""; }

  const map = new maplibregl.Map({
    container: "map",
    center: [-120.713, 47.585],
    zoom: 12,
    style: {
      version: 8,
      glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
      sources: {
        sat: {
          type: "raster",
          tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
          tileSize: 256,
          maxzoom: 19,
          attribution: "Imagery &copy; Esri",
        },
      },
      layers: [{ id: "sat", type: "raster", source: "sat" }],
    },
  });
  map.addControl(new maplibregl.NavigationControl());

  const draw = new terraDraw.TerraDraw({
    adapter: new terraDrawMaplibreGlAdapter.TerraDrawMapLibreGLAdapter({ map }),
    modes: [
      new terraDraw.TerraDrawPolygonMode(),
      new terraDraw.TerraDrawPointMode(),
      new terraDraw.TerraDrawSelectMode({
        flags: {
          polygon: { feature: { draggable: true, coordinates: { midpoints: true, draggable: true, deletable: true } } },
          point: { feature: { draggable: true } },
        },
      }),
    ],
  });

  // Terra Draw ids -> point label text (points only). editorFeaturesToDocument
  // reads properties.name, so we stamp names onto the snapshot before saving.
  let pointNames = {};
  let selectedId = null;

  const docSel = document.getElementById("docName");
  const nameBox = document.getElementById("nameBox");
  const ptName = document.getElementById("ptName");
  const btnDraw = document.getElementById("btnDraw");
  const btnSelect = document.getElementById("btnSelect");

  function kind() { return DOCUMENT_GEOMETRY[docSel.value]; }
  function isPointLayer() { return kind() === "point"; }

  function setActive(btn) {
    [btnDraw, btnSelect].forEach(b => b.classList.remove("on"));
    if (btn) btn.classList.add("on");
  }

  function toDrawMode() {
    draw.setMode(isPointLayer() ? "point" : "polygon");
    setActive(btnDraw);
    nameBox.style.display = "none";
  }
  function toSelectMode() {
    draw.setMode("select");
    setActive(btnSelect);
  }

  btnDraw.addEventListener("click", toDrawMode);
  btnSelect.addEventListener("click", toSelectMode);

  document.getElementById("btnDelete").addEventListener("click", () => {
    if (!selectedId) { status("Select a shape first."); return; }
    draw.removeFeatures([selectedId]);
    delete pointNames[selectedId];
    selectedId = null;
    nameBox.style.display = "none";
    status("Deleted (not yet saved).");
  });

  ptName.addEventListener("input", () => {
    if (selectedId != null) pointNames[selectedId] = ptName.value;
  });

  draw.on("select", (id) => {
    selectedId = id;
    if (isPointLayer()) {
      nameBox.style.display = "inline-flex";
      ptName.value = pointNames[id] != null ? pointNames[id] : "";
      ptName.focus();
    }
  });
  draw.on("deselect", () => { selectedId = null; nameBox.style.display = "none"; });
  draw.on("finish", (id) => {
    // A freshly drawn point: give it a home in pointNames and prompt for a label.
    if (isPointLayer()) {
      if (pointNames[id] == null) pointNames[id] = "";
      selectedId = id;
      nameBox.style.display = "inline-flex";
      ptName.value = pointNames[id];
      ptName.focus();
    }
  });

  async function loadDoc() {
    const name = docSel.value;
    status("Loading " + name + "...");
    draw.clear();
    pointNames = {};
    selectedId = null;
    nameBox.style.display = "none";
    let fc = { type: "FeatureCollection", features: [] };
    try {
      const doc = await api("/v1/admin/documents/" + name);
      fc = JSON.parse(doc.geojson);
    } catch (e) {
      if (!/-> 404/.test(e.message)) { status(e.message, true); return; }
      // 404 => new/empty document; start blank.
    }
    document.getElementById("rawBody").value = JSON.stringify(fc, null, 2);
    const feats = documentToEditorFeatures(name, fc);
    if (feats.length) draw.addFeatures(feats);
    // addFeatures preserves input order, so bind loaded names by index.
    if (isPointLayer()) {
      const snap = draw.getSnapshot().filter(f => f.geometry.type === "Point");
      const names = (fc.features || []).map(f => (f.properties && f.properties.name != null ? String(f.properties.name) : ""));
      snap.forEach((f, i) => { pointNames[f.id] = names[i] != null ? names[i] : ""; });
    }
    toSelectMode();
    fitTo(feats);
    status(feats.length + " feature(s) loaded. Draw to add, Select to edit.");
  }

  function fitTo(feats) {
    let minX = 180, minY = 90, maxX = -180, maxY = -90, any = false;
    feats.forEach(f => {
      const coords = f.geometry.type === "Point" ? [f.geometry.coordinates] : f.geometry.coordinates[0];
      coords.forEach(c => { any = true; minX = Math.min(minX, c[0]); minY = Math.min(minY, c[1]); maxX = Math.max(maxX, c[0]); maxY = Math.max(maxY, c[1]); });
    });
    if (any) map.fitBounds([[minX, minY], [maxX, maxY]], { padding: 60, maxZoom: 18, duration: 0 });
  }

  async function saveDoc() {
    const name = docSel.value;
    const snapshot = draw.getSnapshot();
    if (isPointLayer()) {
      snapshot.forEach(f => {
        if (f.geometry.type === "Point") {
          f.properties = f.properties || {};
          f.properties.name = pointNames[f.id] != null ? pointNames[f.id] : "";
        }
      });
    }
    const doc = editorFeaturesToDocument(name, snapshot);
    if (isPointLayer()) {
      const missing = doc.features.some(f => !f.properties.name);
      if (missing && !confirm("Some points have no name. Save anyway?")) return;
    }
    status("Saving " + doc.features.length + " feature(s)...");
    try {
      await api("/v1/admin/documents/" + name, { method: "PUT", body: JSON.stringify(doc) });
      document.getElementById("rawBody").value = JSON.stringify(doc, null, 2);
      status("Saved " + doc.features.length + " feature(s) to " + name + ".");
    } catch (e) { status(e.message, true); }
  }

  document.getElementById("btnSave").addEventListener("click", saveDoc);
  document.getElementById("btnReload").addEventListener("click", loadDoc);
  docSel.addEventListener("change", loadDoc);

  // Reference layer: existing problems as small dots, so shapes land in place.
  window.__geoRefreshProblems = function () {
    const fc = {
      type: "FeatureCollection",
      features: (problems || [])
        .filter(p => p.lng != null && p.lat != null && p.status !== "rejected")
        .map(p => ({ type: "Feature", properties: { name: p.name }, geometry: { type: "Point", coordinates: [Number(p.lng), Number(p.lat)] } })),
    };
    const src = map.getSource("ref-problems");
    if (src) src.setData(fc);
  };

  map.on("load", () => {
    draw.start();
    map.addSource("ref-problems", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
    map.addLayer({
      id: "ref-problems",
      type: "circle",
      source: "ref-problems",
      paint: { "circle-radius": 4, "circle-color": "#22c55e", "circle-stroke-width": 1, "circle-stroke-color": "#0a5" },
    });
    window.__geoRefreshProblems();
    loadDoc();
  });

  // Raw-JSON escape hatch.
  document.getElementById("rawLoad").addEventListener("click", async () => {
    try {
      const doc = await api("/v1/admin/documents/" + docSel.value);
      document.getElementById("rawBody").value = JSON.stringify(JSON.parse(doc.geojson), null, 2);
    } catch (e) { alert(e.message); }
  });
  document.getElementById("rawSave").addEventListener("click", async () => {
    try {
      await api("/v1/admin/documents/" + docSel.value, { method: "PUT", body: document.getElementById("rawBody").value });
      alert("Saved. Reload the map to see it.");
    } catch (e) { alert(e.message); }
  });
})();
</script>
</body>
</html>`;
