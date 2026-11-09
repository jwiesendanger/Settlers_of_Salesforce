(function(){
/* ================= The Lost Athenaeum: tasks from John's "Knowledge" section, kept as scrolls in a crypt beneath the Library ================= */
const $ = id => document.getElementById(id);
const SVGNS = "http://www.w3.org/2000/svg";
function sv(tag, attrs, parent){ const e = document.createElementNS(SVGNS, tag); if (attrs) for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
function mk(tag, cls, text){ const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const sfx = n => { try{ if (window.__sfx) window.__sfx(n); }catch(e){} };

const SERVER = "Asana";
const KNOWLEDGE_SECTION = "1220179858997729";   /* the "Knowledge" section of John's My Tasks */
const CACHE_KEY = "settlers-athenaeum";
const FIELDS = "name,notes,due_on,created_at,modified_at,completed,permalink_url";

const root = $("tab-athenaeum");
const crypt = $("ath-crypt"), shelf = $("ath-shelf"), reader = $("ath-reader"), pinakes = $("ath-pinakes"), status = $("ath-status");
let scrolls = [], open = null, busy = false;

/* ---------- the crypt itself (drawn once; nothing inside it moves, so it never repaints) ---------- */
function drawCrypt(){
  const s = $("ath-arch"); s.textContent = "";
  s.setAttribute("viewBox", "0 0 1600 900"); s.setAttribute("preserveAspectRatio", "xMidYMid slice");
  const d = sv("defs", null, s);
  const g = (id, stops, attrs) => { const el = sv(attrs && attrs.r ? "radialGradient" : "linearGradient", Object.assign({id}, attrs || {x1:0, y1:0, x2:0, y2:1}), d); stops.forEach(([o, c, op]) => sv("stop", {offset:o, "stop-color":c, "stop-opacity":op == null ? 1 : op}, el)); };
  g("ath-wall", [["0", "#2c2117"], ["1", "#120d09"]]);
  g("ath-floor", [["0", "#2a2016"], ["1", "#0c0907"]]);
  g("ath-col", [["0", "#1c150f"], [".35", "#4a3a28"], [".6", "#3a2d20"], ["1", "#120d09"]], {x1:0, y1:0, x2:1, y2:0});
  g("ath-warm", [["0", "#ffb35c", .28], [".5", "#ff8a3a", .08], ["1", "#000", 0]], {r:"50%", cx:"50%", cy:"50%"});
  const pat = sv("pattern", {id:"ath-stone", width:"120", height:"60", patternUnits:"userSpaceOnUse"}, d);
  sv("path", {d:"M0 0 H120 M0 30 H120 M40 0 V30 M100 0 V30 M10 30 V60 M70 30 V60", stroke:"#000", "stroke-width":"2", opacity:".35", fill:"none"}, pat);
  /* back wall, honeycombed with the library's scroll niches */
  sv("rect", {x:0, y:0, width:1600, height:900, fill:"url(#ath-wall)"}, s);
  sv("rect", {x:0, y:0, width:1600, height:900, fill:"url(#ath-stone)"}, s);
  const niches = sv("g", null, s);
  let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  for (let y = 150; y < 700; y += 52){
    for (let x = 250; x < 1350; x += 62){
      sv("rect", {x, y, width:54, height:44, rx:3, fill:"#0b0806", stroke:"#3d2f20", "stroke-width":"2"}, niches);
      const n = rnd() < .18 ? 0 : 1 + Math.floor(rnd() * 3);
      for (let k = 0; k < n; k++){
        const cx = x + 12 + k * 15 + rnd() * 4, cy = y + 30 - rnd() * 6, r = 6 + rnd() * 2.5;
        sv("circle", {cx, cy, r, fill: rnd() < .5 ? "#6e5733" : "#5a4528", stroke:"#2a1f12", "stroke-width":"1"}, niches);
        sv("circle", {cx, cy, r:r * .45, fill:"none", stroke:"#2a1f12", "stroke-width":".8"}, niches);
        if (rnd() < .35) sv("path", {d:`M${cx} ${cy + r} l${-2 + rnd() * 4} ${9 + rnd() * 6}`, stroke:"#a8865a", "stroke-width":"1.2", opacity:".7"}, niches);
      }
    }
  }
  /* lintel and its inscription: "the healing-place of the soul", said to have hung over the great libraries of Egypt */
  sv("rect", {x:220, y:62, width:1160, height:66, fill:"#3b2e20", stroke:"#5c4930", "stroke-width":"3"}, s);
  sv("rect", {x:232, y:72, width:1136, height:46, fill:"none", stroke:"#1b140d", "stroke-width":"2"}, s);
  const ins = sv("text", {x:800, y:107, "text-anchor":"middle", class:"ath-inscription"}, s); ins.textContent = "ΨΥΧΗΣ · ΙΑΤΡΕΙΟΝ";
  /* floor, in perspective */
  sv("path", {d:"M0 720 H1600 V900 H0 Z", fill:"url(#ath-floor)"}, s);
  const fl = sv("g", {stroke:"#000", "stroke-width":"2", opacity:".45"}, s);
  for (let i = -8; i <= 8; i++) sv("line", {x1:800 + i * 40, y1:720, x2:800 + i * 260, y2:900}, fl);
  [740, 770, 812, 870].forEach(y => sv("line", {x1:0, y1:y, x2:1600, y2:y}, fl));
  /* a great arch frames the vault; everything outside it is cold stone */
  sv("path", {d:"M0 0 H1600 V900 H1440 V430 A640 380 0 0 0 160 430 V900 H0 Z", fill:"#0e0b08"}, s);
  sv("path", {d:"M0 0 H1600 V900 H1440 V430 A640 380 0 0 0 160 430 V900 H0 Z", fill:"url(#ath-stone)", opacity:".8"}, s);
  const vs = sv("g", {stroke:"#4a3a28", "stroke-width":"3", fill:"none"}, s);
  sv("path", {d:"M160 430 A640 380 0 0 1 1440 430"}, vs);
  sv("path", {d:"M128 430 A672 412 0 0 1 1472 430", stroke:"#2a2016"}, vs);
  for (let a = 0; a <= 180; a += 9){ const t = a * Math.PI / 180; sv("line", {x1:800 - Math.cos(t) * 640, y1:430 - Math.sin(t) * 380, x2:800 - Math.cos(t) * 672, y2:430 - Math.sin(t) * 412}, vs); }
  /* papyrus-bundle columns with lotus capitals */
  [[118, 1], [1402, -1]].forEach(([x]) => {
    const c = sv("g", null, s);
    sv("rect", {x, y:300, width:80, height:600, fill:"url(#ath-col)"}, c);
    for (let k = 1; k < 5; k++) sv("line", {x1:x + k * 16, y1:310, x2:x + k * 16, y2:900, stroke:"#120d09", "stroke-width":"2", opacity:".6"}, c);
    sv("path", {d:`M${x - 26} 300 Q ${x + 40} 214 ${x + 106} 300 Z`, fill:"#4d3c29", stroke:"#1c150f", "stroke-width":"2"}, c);
    for (let k = 0; k < 5; k++) sv("path", {d:`M${x + 4 + k * 18} 300 Q ${x + 10 + k * 18} 250 ${x + 14 + k * 15} 236`, stroke:"#2a1f14", "stroke-width":"2", fill:"none"}, c);
    sv("rect", {x:x - 14, y:300, width:108, height:16, fill:"#3b2e20", stroke:"#1c150f", "stroke-width":"2"}, c);
    sv("rect", {x:x - 10, y:870, width:100, height:30, fill:"#2a2016"}, c);
  });
  /* the reading table where a drawn scroll is laid open */
  sv("path", {d:"M560 760 L1040 760 L1090 820 L510 820 Z", fill:"#2f2418", stroke:"#120d09", "stroke-width":"2"}, s);
  sv("rect", {x:540, y:820, width:520, height:20, fill:"#1d160f"}, s);
  /* cobwebs in the upper corners */
  [[0, 0, 1], [1600, 0, -1]].forEach(([x, y, f]) => {
    const w = sv("g", {stroke:"#cfc6b4", "stroke-width":"1", fill:"none", opacity:".18", transform:`translate(${x} ${y}) scale(${f} 1)`}, s);
    for (let k = 0; k < 6; k++){ const a = k * 15 * Math.PI / 180; sv("line", {x1:0, y1:0, x2:Math.cos(a) * 190, y2:Math.sin(a) * 190}, w); }
    [50, 95, 140, 180].forEach(r => { let p = ""; for (let k = 0; k <= 5; k++){ const a = k * 15 * Math.PI / 180; p += (k ? " Q " + (Math.cos(a - .13) * r * .9).toFixed(1) + " " + (Math.sin(a - .13) * r * .9).toFixed(1) + " " : "M") + (Math.cos(a) * r).toFixed(1) + " " + (Math.sin(a) * r).toFixed(1); } sv("path", {d:p}, w); });
  });
}

/* ---------- dust drifting through the lamp light ---------- */
function dust(){
  const box = $("ath-dust"); box.textContent = "";
  if (REDUCED) return;
  for (let i = 0; i < 26; i++){
    const m = mk("i");
    m.style.left = (5 + Math.random() * 90) + "%"; m.style.top = (10 + Math.random() * 80) + "%";
    m.style.animationDuration = (9 + Math.random() * 12).toFixed(1) + "s"; m.style.animationDelay = (-Math.random() * 20).toFixed(1) + "s";
    m.style.setProperty("--dx", (Math.random() * 60 - 30).toFixed(0) + "px");
    box.appendChild(m);
  }
}

/* ---------- the lantern: darkness everywhere except where you hold the light ---------- */
let lx = 50, ly = 45, raf = 0;
crypt.addEventListener("pointermove", ev => {
  const r = crypt.getBoundingClientRect(); lx = (ev.clientX - r.left) / r.width * 100; ly = (ev.clientY - r.top) / r.height * 100;
  if (!raf) raf = requestAnimationFrame(() => { raf = 0; crypt.style.setProperty("--lx", lx.toFixed(1) + "%"); crypt.style.setProperty("--ly", ly.toFixed(1) + "%"); });
});
crypt.addEventListener("pointerleave", () => { crypt.style.setProperty("--lx", "50%"); crypt.style.setProperty("--ly", "40%"); });

/* ---------- reading a task's notes: plain text, with links turned into labelled seals ---------- */
function linkLabel(u){
  let h = ""; try{ h = new URL(u).hostname; }catch(e){ return "Link"; }
  if (/teams\.microsoft\.com/.test(h)) return /meetingrecap/.test(u) ? "Teams recording" : "Teams link";
  if (/sharepoint\.com/.test(h)){ if (/\.mp4|:v:/i.test(u)) return "Video on SharePoint"; if (/\.xlsx|:x:/i.test(u)) return "Spreadsheet on SharePoint"; if (/\.docx|:w:/i.test(u)) return "Document on SharePoint"; return "SharePoint file"; }
  if (/asana\.com/.test(h)) return /get_asset/.test(u) ? "Attachment in Asana" : "Asana link";
  if (/force\.com/.test(h)) return /\/Report\//.test(u) ? "Salesforce report" : "Salesforce link";
  return h.replace(/^www\./, "");
}
function noteBody(text){
  const box = mk("div", "ath-text");
  const paras = String(text || "").replace(/\r/g, "").split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  paras.forEach(p => {
    const el = mk("p"); let last = 0; const re = /https?:\/\/[^\s<>"]+/g; let m;
    while ((m = re.exec(p))){
      if (m.index > last) el.appendChild(document.createTextNode(p.slice(last, m.index)));
      const a = mk("a", "ath-seal"); a.href = m[0]; a.target = "_blank"; a.rel = "noopener noreferrer"; a.title = m[0];
      a.append(mk("i"), mk("span", null, linkLabel(m[0])));
      el.appendChild(a); last = m.index + m[0].length;
    }
    if (last < p.length) el.appendChild(document.createTextNode(p.slice(last)));
    box.appendChild(el);
  });
  return box;
}
const fmtDate = iso => { if (!iso) return ""; const d = new Date(iso.length === 10 ? iso + "T12:00:00" : iso); return d.toLocaleDateString(undefined, {month:"short", day:"numeric", year:"numeric"}); };
function roman(n){ const m = [[1000,"M"],[900,"CM"],[500,"D"],[400,"CD"],[100,"C"],[90,"XC"],[50,"L"],[40,"XL"],[10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]]; let s = ""; for (const [v, r] of m) while (n >= v){ s += r; n -= v; } return s; }

/* ---------- the shelf of scrolls ---------- */
function renderShelf(){
  shelf.textContent = ""; pinakes.textContent = "";
  if (!scrolls.length){ shelf.appendChild(mk("p", "ath-empty", status.dataset.empty || "The shelves are bare. Nothing waits in your Knowledge section.")); }
  scrolls.forEach((t, i) => {
    const b = mk("button", "ath-scroll"); b.type = "button"; b.dataset.gid = t.gid;
    b.setAttribute("aria-label", `Draw the scroll: ${t.name}`); b.title = t.name;
    b.style.setProperty("--tilt", ((i * 37) % 7 - 3) + "deg");
    b.style.setProperty("--hue", ((i * 53) % 24 - 12) + "deg");
    const roll = mk("span", "ath-roll");
    roll.append(mk("i", "knob l"), mk("i", "band"), mk("i", "knob r"));
    const tag = mk("span", "ath-tag"); tag.append(mk("small", null, roman(i + 1)), mk("span", null, t.name));
    b.append(roll, tag);
    b.addEventListener("click", () => draw(t, b));
    shelf.appendChild(b);
    const li = mk("li"); const a = mk("button", "ath-cat"); a.type = "button";
    a.append(mk("b", null, roman(i + 1) + "."), document.createTextNode(" " + t.name));
    a.addEventListener("click", () => draw(t, b));
    li.appendChild(a); pinakes.appendChild(li);
  });
  $("ath-count").textContent = scrolls.length ? `${scrolls.length} scroll${scrolls.length === 1 ? "" : "s"}` : "";
  $("ath-oracle").disabled = !scrolls.length;
}

/* draw a scroll: it flies off the shelf to the reading table, then unrolls */
async function draw(t, from){
  if (busy) return;
  if (open) await close(true);
  busy = true; open = t;
  shelf.querySelectorAll(".ath-scroll").forEach(e => e.classList.toggle("taken", e === from));
  sfx("chime");
  if (!REDUCED && from && from.isConnected){
    const a = from.querySelector(".ath-roll").getBoundingClientRect(), c = crypt.getBoundingClientRect();
    const fly = from.querySelector(".ath-roll").cloneNode(true); fly.classList.add("ath-fly");
    Object.assign(fly.style, {left:(a.left - c.left) + "px", top:(a.top - c.top) + "px", width:a.width + "px", height:a.height + "px"});
    crypt.appendChild(fly);
    const tx = c.width / 2 - (a.left - c.left) - a.width / 2, ty = c.height * .5 - (a.top - c.top) - a.height / 2;
    await fly.animate([{transform:"translate(0,0) rotate(0) scale(1)"}, {transform:`translate(${tx * .5}px, ${ty * .5 - 60}px) rotate(-12deg) scale(1.5)`, offset:.55}, {transform:`translate(${tx}px, ${ty}px) rotate(0) scale(2.2)`}], {duration:720, easing:"cubic-bezier(.3,.1,.25,1)"}).finished.catch(() => {});
    fly.remove();
  }
  buildReader(t);
  reader.hidden = false;
  const cr = crypt.getBoundingClientRect(); if (cr.top < 0 || cr.bottom > innerHeight) crypt.scrollIntoView({block: cr.height > innerHeight ? "start" : "center", behavior: REDUCED ? "auto" : "smooth"});
  reader.classList.remove("rolled"); void reader.offsetWidth; reader.classList.add("open");
  busy = false;
  setTimeout(() => { const f = reader.querySelector(".ath-close"); if (f) f.focus({preventScroll:true}); }, REDUCED ? 0 : 900);
}
function buildReader(t){
  reader.textContent = "";
  const veil = mk("div", "ath-veil"); veil.addEventListener("click", () => close());
  const pap = mk("div", "ath-papyrus"); pap.setAttribute("role", "dialog"); pap.setAttribute("aria-label", t.name);
  const sheet = mk("div", "ath-sheet");
  sheet.appendChild(mk("div", "ath-kicker", "From the Knowledge shelf"));
  sheet.appendChild(mk("h3", "ath-title", t.name));
  const meta = [`Inscribed ${fmtDate(t.created_at)}`];
  if (t.modified_at) meta.push(`last touched ${fmtDate(t.modified_at)}`);
  if (t.due_on) meta.push(`due ${fmtDate(t.due_on)}`);
  sheet.appendChild(mk("div", "ath-meta", meta.join(" · ")));
  sheet.appendChild(mk("div", "ath-rule"));
  if (String(t.notes || "").trim()) sheet.appendChild(noteBody(t.notes));
  else sheet.appendChild(mk("p", "ath-blank", "This scroll is blank. Whatever it holds is still in your head, or in Asana's attachments."));
  const acts = mk("div", "ath-acts");
  const go = mk("a", "ath-btn", "Open in Asana"); go.href = t.permalink_url || ("https://app.asana.com/0/0/" + t.gid); go.target = "_blank"; go.rel = "noopener noreferrer";
  const back = mk("button", "ath-btn ghost ath-close", "Return it to the shelf"); back.type = "button"; back.addEventListener("click", () => close());
  acts.append(go, back);
  sheet.appendChild(acts);
  pap.append(mk("i", "ath-rod l"), sheet, mk("i", "ath-rod r"));
  reader.append(veil, pap);
}
async function close(quick){
  if (!open) return;
  const was = open; open = null;
  reader.classList.remove("open"); reader.classList.add("rolled");
  if (!REDUCED && !quick) await new Promise(r => setTimeout(r, 520));
  reader.hidden = true; reader.classList.remove("rolled");
  shelf.querySelectorAll(".ath-scroll").forEach(e => e.classList.remove("taken"));
  const b = shelf.querySelector(`.ath-scroll[data-gid="${was.gid}"]`); if (b && !quick) b.focus({preventScroll:true});
}
document.addEventListener("keydown", ev => { if (ev.key === "Escape" && open && !root.hidden) close(); });

/* ask the librarian: the lamp wanders the shelf and settles on a scroll for you */
async function oracle(){
  if (busy || !scrolls.length) return;
  if (open) await close(true);
  busy = true;
  const els = [...shelf.querySelectorAll(".ath-scroll")];
  const pick = Math.floor(Math.random() * els.length);
  const hops = REDUCED ? 1 : Math.max(8, els.length * 2) + pick;
  let at = 0;
  for (let h = 0; h < hops; h++){
    at = REDUCED ? pick : (h % els.length);
    els.forEach((e, k) => e.classList.toggle("lit", k === at));
    if (!REDUCED) await new Promise(r => setTimeout(r, 70 + Math.pow(h / hops, 3) * 420));
  }
  at = pick; els.forEach((e, k) => e.classList.toggle("lit", k === at));
  await new Promise(r => setTimeout(r, REDUCED ? 0 : 380));
  els[at].classList.remove("lit");
  busy = false;
  draw(scrolls[at], els[at]);
}
$("ath-oracle").addEventListener("click", oracle);

/* ---------- reading the Knowledge section from Asana ---------- */
function payloadOf(res){ let p = res && res.payload !== undefined ? res.payload : res; if (typeof p === "string"){ try{ p = JSON.parse(p); }catch(e){} } return p; }
function say(text, kind){ status.textContent = text; status.className = "ath-status" + (kind ? " " + kind : ""); }
function saveCache(list){ try{ localStorage.setItem(CACHE_KEY, JSON.stringify({at:Date.now(), list})); }catch(e){} }
function readCache(){ try{ const c = JSON.parse(localStorage.getItem(CACHE_KEY) || "null"); return c && Array.isArray(c.list) ? c : null; }catch(e){ return null; } }
let loading = false, loaded = false;
async function load(fresh){
  if (loading) return; loading = true;
  const btn = $("ath-refresh"); btn.disabled = true;
  try{
    const mcp = window.claude && window.claude.use ? await window.claude.use("mcp") : null;
    if (!mcp){
      const c = readCache();
      say(c ? "Showing the scrolls you last read in this browser. Connect to Asana to dust the shelves." : "The crypt is sealed. Connect to Asana to read the scrolls.", "warn");
      return;
    }
    say("Lighting the lamps…");
    const opts = {cache: fresh ? {refresh:true, staleTime:0, gcTime:600000} : {staleTime:120000, gcTime:600000}};
    /* the connector wants a full timestamp here ("now" is refused); if it still objects, ask for everything and drop finished ones ourselves */
    const ask = input => mcp.callTool(SERVER, "get_tasks", input, opts).then(payloadOf);
    const base = {section: KNOWLEDGE_SECTION, opt_fields: FIELDS, limit: 100};
    let res;
    try{ res = await ask(Object.assign({completed_since: new Date().toISOString()}, base)); }
    catch(e){
      if (e && e.retryable){ await new Promise(r => setTimeout(r, 1200)); res = await ask(Object.assign({completed_since: new Date().toISOString()}, base)); }
      else if (e && (e.code === "tool_error" || e.code === "bad_request")) res = await ask(base);
      else throw e;
    }
    const list = ((res && res.data) || []).filter(t => !t.completed)
      .map(t => ({gid:t.gid, name:t.name || "Untitled", notes:t.notes || "", due_on:t.due_on || null, created_at:t.created_at || null, modified_at:t.modified_at || null, permalink_url:t.permalink_url || ""}));
    scrolls = list; loaded = true; saveCache(list); renderShelf();
    status.dataset.empty = "";
    say(list.length ? "Hold the lamp near a scroll, then draw it from its niche. Or ask the Librarian to choose." : "The shelves are bare. Nothing waits in your Knowledge section.");
  }catch(err){
    const code = err && err.code;
    if (code === "server_not_connected" || code === "not_granted" || code === "capability_disabled") say("The crypt is sealed. Asana isn't connected here.", "warn");
    else if (code === "needs_reauth") say("Your Asana sign-in has expired. Reconnect Asana, then dust the shelves again.", "warn");
    else if (code === "forbidden" || code === "not_found" || (code === "tool_error" && /forbidden|not found|permission|access/i.test(String(err.message || "")))) say("These scrolls are sealed: the Knowledge section lives in John's own My Tasks, which only his Asana account can open.", "warn");
    else if (code === "tool_error") say("Asana couldn't read the Knowledge section" + (err.message ? ": " + String(err.message).slice(0, 160) : ".") + " Try dusting the shelves again.", "warn");
    else say("The lamps guttered out before the scrolls could be read. Try dusting the shelves again.", "warn");
    if (!loaded){ const c = readCache(); if (c){ scrolls = c.list; renderShelf(); } }
  }finally{ loading = false; btn.disabled = false; }
}
$("ath-refresh").addEventListener("click", () => load(true));

/* the oil lamps sit on the column capitals, wherever the cropped scene puts them */
function placeLamps(){
  const r = crypt.getBoundingClientRect(); if (!r.width) return;
  const k = Math.max(r.width / 1600, r.height / 900), ox = (r.width - 1600 * k) / 2, oy = (r.height - 900 * k) / 2;
  [["ath-lamp-l", 158], ["ath-lamp-r", 1442]].forEach(([id, x]) => { const e = $(id); e.style.left = (ox + x * k) + "px"; e.style.top = (oy + 226 * k) + "px"; e.style.transform = `scale(${Math.max(.7, Math.min(1.4, k)).toFixed(2)})`; });
}
new ResizeObserver(placeLamps).observe(crypt);

/* wide tabs (this one and the Trade Map) span the window, measured without the scrollbar */
function bleed(){
  const vw = document.documentElement.clientWidth, gut = vw <= 600 ? 16 : 24;
  [root, document.querySelector(".trade-wrap")].forEach(el => {
    if (!el) return;
    const parent = el.parentElement.getBoundingClientRect(); if (!parent.width) return;
    const w = Math.min(2400, vw - gut * 2), left = (vw - w) / 2;
    el.style.width = w + "px"; el.style.maxWidth = "none";
    const cs = getComputedStyle(el.parentElement), contentLeft = parent.left + (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.borderLeftWidth) || 0);
    el.style.marginLeft = (left - contentLeft) + "px";
  });
}
addEventListener("resize", bleed);
new MutationObserver(bleed).observe(root, {attributes:true, attributeFilter:["hidden"]});
const tr = $("tab-trade"); if (tr) new MutationObserver(bleed).observe(tr, {attributes:true, attributeFilter:["hidden"]});
setTimeout(bleed, 0);

drawCrypt(); dust();
const c0 = readCache(); if (c0){ scrolls = c0.list; }
renderShelf();
let started = false;
const start = () => { if (!started){ started = true; load(false); } };
$("tabbtn-athenaeum").addEventListener("click", start);
if (!root.hidden) start();
new MutationObserver(() => { if (!root.hidden) start(); }).observe(root, {attributes:true, attributeFilter:["hidden"]});
})();
