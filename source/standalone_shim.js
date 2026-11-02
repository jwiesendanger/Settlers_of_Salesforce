<script>
/* ================= Standalone Asana bridge =================
   This copy of the page runs outside Claude. It talks to the Asana REST API
   directly from the browser with each person's own Asana personal access token,
   which stays in that person's browser (localStorage) and is sent only to app.asana.com.
   It exposes the same small interface the page's code already uses:
     claude.use("mcp") -> callTool("Asana", "get_users" | "search_tasks" | "add_comment", input)
     claude.use("db")  -> collection(...).onSnapshot / doc(...).set / delete, stored as tasks
                          in the Guild Hall Ledger project in Asana                        */
(function(){
const CONFIG = {
  workspace: "71309345811105",
  ledgerProject: "1219951921516481",
  ledgerSections: {duties: "1219952038707160", heroes: "1219951921525417", classes: "1219951921525417"},
  api: "https://app.asana.com/api/1.0",
  pollMs: 30000
};
const TOKEN_KEY = "settlers-asana-token";
let token = null;
try{ token = localStorage.getItem(TOKEN_KEY); }catch(e){}

function err(code, message, extra){ return Object.assign({code, message}, extra || {}); }
async function asana(method, path, {query, body} = {}){
  if (!token) throw err("server_not_connected", "Connect to Asana first.");
  const url = new URL(CONFIG.api + path);
  if (query) Object.entries(query).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v)); });
  let res;
  try{
    res = await fetch(url.toString(), {method, headers: Object.assign({"Authorization": "Bearer " + token, "Accept": "application/json"}, body ? {"Content-Type": "application/json"} : {}), body: body ? JSON.stringify({data: body}) : undefined});
  }catch(e){
    throw err("network_blocked", "Your browser couldn't reach Asana. Check your connection; if this keeps happening, your network or browser may be blocking direct calls to Asana.", {retryable: true});
  }
  let json = null; try{ json = await res.json(); }catch(e){}
  if (res.ok) return json;
  const msg = (json && json.errors && json.errors[0] && json.errors[0].message) || ("Asana returned " + res.status);
  if (res.status === 401) throw err("needs_reauth", "Your Asana token was rejected. " + msg);
  if (res.status === 429){ const ra = Number(res.headers.get("Retry-After")) || 5; throw err("rate_limited", "Asana asked us to slow down.", {retryable: true, retryAfterMs: ra * 1000}); }
  if (res.status >= 500) throw err("server_unavailable", "Asana is having trouble. " + msg, {retryable: true});
  throw err("tool_error", msg);
}

/* ---------- "mcp" shim: the three Asana tools the page uses ---------- */
const TOOLS = {
  async get_users({team}){ return asana("GET", `/teams/${team}/users`, {query: {opt_fields: "name,email", limit: 100}}); },
  async search_tasks(i){
    return asana("GET", `/workspaces/${CONFIG.workspace}/tasks/search`, {query: {
      "assignee.any": i.assignee_any, completed: i.completed, sort_by: i.sort_by, sort_ascending: i.sort_ascending,
      opt_fields: i.opt_fields, limit: i.limit,
      "created_at.before": i.created_at_before, "completed_at.after": i.completed_at_after, "completed_at.before": i.completed_at_before
    }});
  },
  async add_comment({task_id, text}){ return asana("POST", `/tasks/${task_id}/stories`, {body: {text}}); }
};
const mcp = {
  async callTool(server, tool, input){
    if (!TOOLS[tool]) throw err("bad_request", "Unknown tool " + tool);
    const json = await TOOLS[tool](input || {});
    return {payload: json, content: []};
  }
};

/* ---------- "db" shim: shared Guild Hall data kept as tasks in the ledger project ---------- */
const PREFIX = "guild:";
let records = [];            /* {gid, coll, id, data} */
let loaded = false, loading = null;
const subs = {duties: new Set(), heroes: new Set(), classes: new Set()};
function parseTask(t){
  const line = String(t.notes || "").split("\n").find(l => l.startsWith(PREFIX));
  if (!line) return null;
  let m; try{ m = JSON.parse(line.slice(PREFIX.length)); }catch(e){ return null; }
  if (m.t === "duty") return {gid: t.gid, coll: "duties", id: t.gid, data: {person: m.person || "", text: t.name || "", note: m.note || "", createdAt: Date.parse(t.created_at) || 0}};
  if (m.t === "hero" && m.id) return {gid: t.gid, coll: "heroes", id: m.id, data: m.body || {}};
  if (m.t === "class" && m.id) return {gid: t.gid, coll: "classes", id: m.id, data: {cls: m.cls}};
  return null;
}
async function refresh(){
  if (loading) return loading;
  loading = (async () => {
    const out = []; let offset = null;
    for (let page = 0; page < 20; page++){
      const json = await asana("GET", `/projects/${CONFIG.ledgerProject}/tasks`, {query: {opt_fields: "name,notes,created_at", limit: 100, offset}});
      (json.data || []).forEach(t => { const r = parseTask(t); if (r) out.push(r); });
      offset = json.next_page && json.next_page.offset;
      if (!offset) break;
    }
    records = out; loaded = true; emitAll();
  })().finally(() => { loading = null; });
  return loading;
}
function snap(coll){
  const docs = records.filter(r => r.coll === coll).map(r => ({id: r.id, exists: true, data: () => r.data, metadata: {fromCache: false, hasPendingWrites: false}}));
  return {docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: {fromCache: false, hasPendingWrites: false}};
}
function emit(coll){ subs[coll].forEach(({next}) => { try{ next(snap(coll)); }catch(e){ console.error(e); } }); }
function emitAll(){ Object.keys(subs).forEach(emit); }
let pollTimer = null;
function startPolling(){
  if (pollTimer) return;
  pollTimer = setInterval(() => { if (document.visibilityState === "visible") refresh().catch(() => {}); }, CONFIG.pollMs);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") refresh().catch(() => {}); });
}
function dbErr(e){ return e && e.code === "needs_reauth" ? err("revoked", e.message) : e && e.retryable ? err("unavailable", e.message) : err("invalid_argument", (e && e.message) || "Asana refused the change."); }
function docRef(coll, id){
  const ref = {
    id, path: coll + "/" + id,
    async set(body){
      try{
        if (coll === "duties"){
          const existing = records.find(r => r.coll === coll && r.id === id);
          const notes = PREFIX + JSON.stringify({t: "duty", person: body.person, note: body.note || ""});
          if (existing){ await asana("PUT", `/tasks/${existing.gid}`, {body: {name: body.text, notes}}); existing.data = Object.assign({}, body); }
          else {
            const json = await asana("POST", "/tasks", {body: {name: body.text, notes, projects: [CONFIG.ledgerProject], memberships: [{project: CONFIG.ledgerProject, section: CONFIG.ledgerSections.duties}]}});
            const gid = json.data.gid; ref.id = gid;
            records.push({gid, coll, id: gid, data: Object.assign({}, body)});
          }
        } else {
          const kind = coll === "heroes" ? "hero" : "class";
          const payload = kind === "hero" ? {t: "hero", id, body} : {t: "class", id, cls: body.cls};
          const name = kind === "hero" ? "Hero: " + (body.name || id) : "Class: " + id + " → " + body.cls;
          const existing = records.find(r => r.coll === coll && r.id === id);
          const notes = PREFIX + JSON.stringify(payload);
          if (existing){ await asana("PUT", `/tasks/${existing.gid}`, {body: {name, notes}}); existing.data = kind === "hero" ? Object.assign({}, body) : {cls: body.cls}; }
          else {
            const json = await asana("POST", "/tasks", {body: {name, notes, projects: [CONFIG.ledgerProject], memberships: [{project: CONFIG.ledgerProject, section: CONFIG.ledgerSections[coll]}]}});
            records.push({gid: json.data.gid, coll, id, data: kind === "hero" ? Object.assign({}, body) : {cls: body.cls}});
          }
        }
      }catch(e){ throw dbErr(e); }
      emit(coll);
    },
    async update(body){ const ex = records.find(r => r.coll === coll && r.id === id); if (!ex) throw err("invalid_argument", "Not found"); return ref.set(Object.assign({}, ex.data, body)); },
    async delete(){
      const ex = records.find(r => r.coll === coll && r.id === id);
      if (!ex) return;
      try{ await asana("DELETE", `/tasks/${ex.gid}`); }catch(e){ if (e.code !== "tool_error") throw dbErr(e); }
      records = records.filter(r => r !== ex); emit(coll);
    },
    async get(){ const ex = records.find(r => r.coll === coll && r.id === id); return {id, exists: !!ex, data: () => ex ? ex.data : undefined, metadata: {fromCache: false, hasPendingWrites: false}}; },
    onSnapshot(next){ const one = {next: s => { const d = s.docs.find(x => x.id === id); next(d || {id, exists: false, data: () => undefined}); }}; subs[coll].add(one); if (loaded) one.next(snap(coll)); return () => subs[coll].delete(one); }
  };
  return ref;
}
const db = {
  collection(coll){
    if (!subs[coll]) subs[coll] = new Set();
    return {
      path: coll,
      doc(id){ return docRef(coll, id || ("new-" + Math.random().toString(36).slice(2))); },
      async add(body){ const r = docRef(coll); await r.set(body); return r; },
      onSnapshot(next, error){
        const s = {next, error}; subs[coll].add(s);
        if (loaded) setTimeout(() => next(snap(coll)), 0);
        else refresh().catch(e => { if (error) error(dbErr(e)); });
        startPolling();
        return () => subs[coll].delete(s);
      },
      async get(){ if (!loaded) await refresh(); return snap(coll); }
    };
  }
};

const downloads = {
  async save({filename, data}){
    const url = URL.createObjectURL(data instanceof Blob ? data : new Blob([data], {type: /\.csv$/i.test(filename) ? "text/csv;charset=utf-8" : "application/octet-stream"}));
    const link = document.createElement("a"); link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
};
window.claude = {use: async name => name === "downloads" ? downloads : !token ? null : name === "mcp" ? mcp : name === "db" ? db : null};
window.asanaBridge = {
  connected: () => !!token,
  async connect(t){
    const prev = token; token = t.trim();
    try{ const me = await asana("GET", "/users/me", {query: {opt_fields: "name,email"}}); localStorage.setItem(TOKEN_KEY, token); return me.data; }
    catch(e){ token = prev; throw e; }
  },
  disconnect(){ try{ localStorage.removeItem(TOKEN_KEY); localStorage.removeItem("settlers-sfops-v1"); }catch(e){} token = null; },
  me: () => asana("GET", "/users/me", {query: {opt_fields: "name"}}).then(j => j.data)
};
})();
</script>
