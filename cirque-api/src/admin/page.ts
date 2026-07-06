// Single-file admin page served at GET /admin (behind Cloudflare Access).
// Vanilla JS against /v1/admin/*. Kept deliberately small.
export const ADMIN_HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cirque Admin</title>
<style>
  body { font: 14px/1.4 system-ui, sans-serif; margin: 1.5rem; max-width: 1100px; }
  h1 { font-size: 1.3rem; }
  table { border-collapse: collapse; width: 100%; }
  th, td { text-align: left; padding: .35rem .5rem; border-bottom: 1px solid #ddd; }
  tr:hover { background: #f6f6f6; cursor: pointer; }
  .pending { background: #fff7e0; }
  .rejected { color: #999; }
  .filters button, .actions button { margin-right: .5rem; }
  #editor { border: 1px solid #ccc; padding: 1rem; margin: 1rem 0; display: none; }
  #editor label { display: block; margin: .4rem 0; }
  #editor input, #editor textarea { width: 100%; box-sizing: border-box; }
  #docs textarea { width: 100%; height: 260px; font-family: monospace; }
  .badge { padding: .1rem .4rem; border-radius: 4px; font-size: .8rem; }
  .badge.pending { background: #f5c542; }
  .badge.approved { background: #9be29b; }
  .badge.rejected { background: #e0e0e0; }
  img.topo { max-width: 320px; display: block; margin: .5rem 0; }
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

<h1>Documents</h1>
<div id="docs">
  <select id="docName">
    <option>areas</option><option>boulders</option><option>subareas</option><option>subarea-centers</option>
  </select>
  <button id="docLoad">Load</button>
  <button id="docSave">Save</button>
  <textarea id="docBody" placeholder="Load a document…"></textarea>
</div>

<script>
let problems = [];
let filter = "all";

async function api(path, opts) {
  const res = await fetch(path, opts);
  if (!res.ok) throw new Error(path + " → " + res.status + " " + await res.text());
  return res.json();
}

async function load() {
  problems = await api("/v1/admin/problems");
  render();
}

function render() {
  const rows = problems.filter(p => filter === "all" || p.status === filter);
  document.querySelector("#problems tbody").innerHTML = rows.map(p =>
    '<tr class="' + p.status + '" data-id="' + p.id + '">' +
    '<td><span class="badge ' + p.status + '">' + p.status + "</span></td>" +
    "<td>" + esc(p.name) + "</td><td>" + esc(p.grade) + "</td><td>" + esc(p.subarea) + "</td>" +
    "<td>" + esc(p.submitted_by_name || "—") + "</td><td>" + (p.created_at || "").slice(0, 10) + "</td></tr>"
  ).join("");
}

function esc(s) { return String(s ?? "").replace(/[&<>"']/g, ch => "&#" + ch.charCodeAt(0) + ";"); }

function edit(id) {
  const p = problems.find(x => x.id === id);
  const el = document.getElementById("editor");
  el.style.display = "block";
  el.innerHTML =
    "<b>" + esc(p.name) + "</b> <span class='badge " + p.status + "'>" + p.status + "</span>" +
    (p.submitted_by_email ? " — " + esc(p.submitted_by_name) + " &lt;" + esc(p.submitted_by_email) + "&gt;" : "") +
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

document.getElementById("docLoad").addEventListener("click", async () => {
  try {
    const doc = await api("/v1/admin/documents/" + document.getElementById("docName").value);
    document.getElementById("docBody").value = JSON.stringify(JSON.parse(doc.geojson), null, 2);
  } catch (e) { alert(e.message); }
});
document.getElementById("docSave").addEventListener("click", async () => {
  try {
    await api("/v1/admin/documents/" + document.getElementById("docName").value, {
      method: "PUT", body: document.getElementById("docBody").value,
    });
    alert("Saved");
  } catch (e) { alert(e.message); }
});

load().catch(e => document.body.insertAdjacentHTML("afterbegin", "<p style='color:red'>" + esc(e.message) + "</p>"));
</script>
</body>
</html>`;
