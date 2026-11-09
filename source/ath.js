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
const FIELDS = "name,notes,html_notes,due_on,created_at,modified_at,completed,permalink_url";

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

/* ---------- rich notes: Asana's formatted description, with any process map drawn as a diagram ---------- */
function richBody(html){
  if (!html || !/<(h1|h2|ul|ol|pre|table|blockquote|strong)\b/i.test(html)) return null;
  let doc; try{ doc = new DOMParser().parseFromString(html, "text/html"); }catch(e){ return null; }
  const box = mk("div", "ath-text ath-rich");
  const KEEP = {H1:"h4", H2:"h4", UL:"ul", OL:"ol", LI:"li", STRONG:"strong", EM:"em", U:"u", S:"s", CODE:"code", BLOCKQUOTE:"blockquote", HR:"hr", TABLE:"table", TR:"tr", TD:"td"};
  const walk = (src, dst) => {
    src.childNodes.forEach(n => {
      if (n.nodeType === 3){ dst.appendChild(document.createTextNode(n.textContent)); return; }
      if (n.nodeType !== 1) return;
      const tag = n.tagName;
      if (tag === "A"){
        const href = n.getAttribute("href") || "";
        if (/^https?:\/\//i.test(href)){ const a = mk("a", "ath-seal"); a.href = href; a.target = "_blank"; a.rel = "noopener noreferrer"; a.title = href; const label = n.textContent.trim(); a.append(mk("i"), mk("span", null, label && label !== href ? label : linkLabel(href))); dst.appendChild(a); }
        else dst.appendChild(document.createTextNode(n.textContent));
        return;
      }
      if (tag === "PRE"){
        const txt = n.textContent.trim();
        if (/^(flowchart|graph)\b/i.test(txt)){ const fig = flowFigure(parseFlow(txt)); if (fig){ dst.appendChild(fig); return; } }
        dst.appendChild(mk("pre", "ath-pre", txt)); return;
      }
      if (tag === "BR"){ dst.appendChild(document.createElement("br")); return; }
      const keep = KEEP[tag];
      if (keep){ const el = document.createElement(keep); dst.appendChild(el); walk(n, el); }
      else walk(n, dst);
    });
  };
  walk(doc.body, box);
  return box;
}

/* ---------- process maps: a small subset of Mermaid flowchart syntax, drawn in ink ---------- */
function parseFlow(code){
  const nodes = new Map(), edges = [];
  const node = (id, raw) => {
    if (!nodes.has(id)) nodes.set(id, {id, label:id, type:"step"});
    if (raw){
      const n = nodes.get(id);
      let m;
      if ((m = raw.match(/^\(\[\s*"?(.*?)"?\s*\]\)$/))) { n.label = m[1]; n.type = /^(end|finish|done|stop)\b/i.test(m[1]) ? "end" : "start"; }
      else if ((m = raw.match(/^\(\(\s*"?(.*?)"?\s*\)\)$/))) { n.label = m[1]; n.type = "end"; }
      else if ((m = raw.match(/^\{\s*"?(.*?)"?\s*\}$/))) { n.label = m[1]; n.type = "decision"; }
      else if ((m = raw.match(/^\[\s*"?(.*?)"?\s*\]$/))) { n.label = m[1]; }
      else if ((m = raw.match(/^\(\s*"?(.*?)"?\s*\)$/))) { n.label = m[1]; }
    }
    return id;
  };
  const tok = /([A-Za-z_][\w-]*)\s*(\(\[.*?\]\)|\(\(.*?\)\)|\{.*?\}|\[.*?\]|\(.*?\))?/y;
  String(code).split(/\n|;/).slice(1).forEach(line => {
    line = line.trim(); if (!line || line.startsWith("%%") || /^(classDef|class|style|linkStyle|subgraph|end)\b/.test(line)) return;
    let i = 0, prev = null, label = null;
    const skip = () => { while (i < line.length && line[i] === " ") i++; };
    while (i < line.length){
      skip(); tok.lastIndex = i; const m = tok.exec(line); if (!m) break;
      const id = node(m[1], m[2]); i = tok.lastIndex;
      if (prev) edges.push({from:prev, to:id, label});
      prev = id; label = null; skip();
      const arrow = line.slice(i).match(/^(-->|---|==>|-\.->)\s*(\|([^|]*)\|)?|^--\s*([^-]+?)\s*-->/);
      if (!arrow) break;
      label = (arrow[3] || arrow[4] || "").trim() || null; i += arrow[0].length;
    }
  });
  return {nodes:[...nodes.values()], edges};
}
function wrapText(t, n){ const words = String(t).split(/\s+/), lines = []; let cur = ""; words.forEach(w => { if ((cur + " " + w).trim().length > n && cur){ lines.push(cur); cur = w; } else cur = (cur + " " + w).trim(); }); if (cur) lines.push(cur); return lines.slice(0, 4); }
function flowFigure(flow){
  if (!flow || !flow.nodes.length) return null;
  const N = flow.nodes, E = flow.edges.filter(e => e.from !== e.to);
  const idx = new Map(N.map((n, i) => [n.id, i]));
  /* rank each node by its longest path from a start, ignoring loops back up the chart */
  const out = N.map(() => []), indeg = N.map(() => 0), back = new Set();
  const order = [], seen = new Set(), stack = new Set();
  const dfs = i => { seen.add(i); stack.add(i); E.forEach((e, k) => { if (idx.get(e.from) !== i) return; const j = idx.get(e.to); if (stack.has(j)) back.add(k); else if (!seen.has(j)) dfs(j); }); stack.delete(i); order.unshift(i); };
  N.forEach((n, i) => { if (!seen.has(i) && !E.some(e => e.to === n.id)) dfs(i); });
  N.forEach((n, i) => { if (!seen.has(i)) dfs(i); });
  E.forEach((e, k) => { if (back.has(k)) return; out[idx.get(e.from)].push(idx.get(e.to)); indeg[idx.get(e.to)]++; });
  const rank = N.map(() => 0);
  order.forEach(i => out[i].forEach(j => { rank[j] = Math.max(rank[j], rank[i] + 1); }));
  const rows = []; order.forEach(i => { (rows[rank[i]] = rows[rank[i]] || []).push(i); });
  const box = N.map(n => { const lines = wrapText(n.label, n.type === "decision" ? 16 : 22); const w = Math.max(96, Math.min(230, Math.max(...lines.map(l => l.length)) * 7.4 + 30)); const h = 18 * lines.length + (n.type === "decision" ? 34 : 18); return {lines, w: n.type === "decision" ? w + 26 : w, h}; });
  const GAPX = 34, GAPY = 52, PAD = 24;
  const rowW = rows.map(r => r.reduce((s, i) => s + box[i].w, 0) + GAPX * (r.length - 1));
  const W = Math.max(...rowW) + PAD * 2 + 60, pos = [];
  let y = PAD;
  rows.forEach((r, ri) => {
    const h = Math.max(...r.map(i => box[i].h)); let x = (W - 60 - rowW[ri]) / 2;
    r.forEach(i => { pos[i] = {x: x + box[i].w / 2, y: y + h / 2}; x += box[i].w + GAPX; });
    y += h + GAPY;
  });
  const H = y - GAPY + PAD;
  const svg = sv("svg", {viewBox:`0 0 ${W} ${H}`, class:"ath-flow", role:"img", "aria-label":"Process map: " + N.map(n => n.label).join(", ")});
  const d = sv("defs", null, svg);
  const mkr = sv("marker", {id:"ath-arrow", viewBox:"0 0 10 10", refX:"9", refY:"5", markerWidth:"8", markerHeight:"8", orient:"auto-start-reverse"}, d);
  sv("path", {d:"M0 1 L10 5 L0 9 Z", fill:"#3b2610"}, mkr);
  const eg = sv("g", {class:"edges"}, svg), ng = sv("g", {class:"nodes"}, svg);
  E.forEach((e, k) => {
    const a = idx.get(e.from), b = idx.get(e.to), A = pos[a], B = pos[b];
    let path, lx, ly;
    if (back.has(k) || rank[b] <= rank[a]){
      const sx = A.x + box[a].w / 2, ex = B.x + box[b].w / 2, rx = Math.max(sx, ex) + 40;
      path = `M${sx} ${A.y} C ${rx} ${A.y}, ${rx} ${B.y}, ${ex + 4} ${B.y}`; lx = rx - 6; ly = (A.y + B.y) / 2;
    } else {
      const sy = A.y + box[a].h / 2, ey = B.y - box[b].h / 2 - 3, my = (sy + ey) / 2;
      path = `M${A.x} ${sy} C ${A.x} ${my}, ${B.x} ${my}, ${B.x} ${ey}`; lx = (A.x + B.x) / 2; ly = my;
    }
    sv("path", {d:path, class:"edge", "marker-end":"url(#ath-arrow)"}, eg);
    if (e.label){ const t = sv("text", {x:lx + 6, y:ly + 4, class:"elabel"}, eg); t.textContent = e.label; }
  });
  N.forEach((n, i) => {
    const {x, y: cy} = pos[i], {w, h, lines} = box[i], g = sv("g", {class:"node " + n.type}, ng);
    if (n.type === "decision") sv("path", {d:`M${x} ${cy - h / 2} L${x + w / 2} ${cy} L${x} ${cy + h / 2} L${x - w / 2} ${cy} Z`}, g);
    else sv("rect", {x:x - w / 2, y:cy - h / 2, width:w, height:h, rx: n.type === "step" ? 6 : h / 2}, g);
    const t = sv("text", {x, y:cy - (lines.length - 1) * 9 + 5, "text-anchor":"middle"}, g);
    lines.forEach((l, k) => { const s2 = sv("tspan", {x, dy: k ? 18 : 0}, t); s2.textContent = l; });
  });
  const fig = mk("figure", "ath-flowbox"); fig.appendChild(svg);
  return fig;
}

/* ---------- wear and tear: every scroll is battered in its own way, the same way every time ---------- */
function seeded(key){ let h = 2166136261; for (const c of String(key)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296; }
function ragged(r, depth){ const pts = []; for (let x = 0; x <= 100; x += 12.5) pts.push(`${x}% ${Math.round(r() * depth * 10) / 10}px`); pts.push("100% 100%", "0 100%"); return `polygon(${pts.join(",")})`; }
function tornTag(r){
  const pts = ["0 0", "100% 0"];
  for (let x = 100; x >= 0; x -= 6.25) pts.push(`${x}% calc(100% - ${(r() * (r() < .15 ? 9 : 4)).toFixed(1)}px)`);
  if (r() < .5) pts.splice(1, 0, `${70 + r() * 25}% 0`, `${85 + r() * 10}% ${(2 + r() * 5).toFixed(1)}px`);
  return `polygon(${pts.join(",")})`;
}
function raggedSheet(r){
  const top = [], bot = [];
  for (let x = 0; x <= 100; x += 2){ const bite = r() < .07 ? 10 + r() * 16 : r() * 7; top.push(`${x}% ${bite.toFixed(1)}px`); }
  for (let x = 100; x >= 0; x -= 2){ const bite = r() < .07 ? 10 + r() * 16 : r() * 7; bot.push(`${x}% calc(100% - ${bite.toFixed(1)}px)`); }
  return `polygon(${top.join(",")},${bot.join(",")})`;
}

/* ---------- the sound of old papyrus: a dry hiss with crackles as the fibres separate ---------- */
let noiseBuf = null;
function paperSound(kind){
  const a = window.__audio && window.__audio(); if (!a) return;
  try{
    if (!noiseBuf || noiseBuf.sampleRate !== a.sampleRate){
      noiseBuf = a.createBuffer(1, a.sampleRate * 2, a.sampleRate); const d = noiseBuf.getChannelData(0);
      let b = 0; for (let i = 0; i < d.length; i++){ const w = Math.random() * 2 - 1; b = .97 * b + .03 * w; d[i] = w * .7 + b * 2; }
    }
    const out = a.createGain(); out.gain.value = .9; out.connect(a.destination);
    const t0 = a.currentTime + .01;
    const burst = (at, dur, {f = 3000, q = 1, vol = .1, type = "bandpass", attack = .002} = {}) => {
      const src = a.createBufferSource(); src.buffer = noiseBuf;
      const fl = a.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
      const g = a.createGain(); g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(vol, at + attack); g.gain.exponentialRampToValueAtTime(.0008, at + dur);
      src.connect(fl); fl.connect(g); g.connect(out);
      src.start(at, Math.random() * 1.5, dur + .05); src.stop(at + dur + .06);
    };
    const swell = (at, dur, f, vol) => {
      const src = a.createBufferSource(); src.buffer = noiseBuf;
      const fl = a.createBiquadFilter(); fl.type = "bandpass"; fl.frequency.setValueAtTime(f * .6, at); fl.frequency.linearRampToValueAtTime(f, at + dur * .6); fl.Q.value = .6;
      const g = a.createGain(); g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(vol, at + dur * .25); g.gain.linearRampToValueAtTime(vol * .7, at + dur * .7); g.gain.linearRampToValueAtTime(0, at + dur);
      src.connect(fl); fl.connect(g); g.connect(out); src.start(at, Math.random()); src.stop(at + dur + .05);
    };
    if (kind === "slide"){
      swell(t0, .32, 900, .07);
      for (let k = 0; k < 5; k++) burst(t0 + .05 + Math.random() * .25, .012 + Math.random() * .02, {f:2200 + Math.random() * 2000, vol:.04 + Math.random() * .05});
      burst(t0 + .62, .09, {type:"lowpass", f:420, q:.7, vol:.16, attack:.004});   /* set down on the table */
    } else if (kind === "unroll"){
      const D = .85;
      swell(t0, D, 2600, .085);
      swell(t0 + .05, D * .9, 700, .05);
      /* crackles come thick as the scroll first gives, then thin out as it lies flat */
      for (let k = 0; k < 46; k++){ const u = Math.pow(Math.random(), 1.6); burst(t0 + u * D, .006 + Math.random() * .03, {f:1600 + Math.random() * 4200, q:.8 + Math.random() * 2.5, vol:(.05 + Math.random() * .14) * (1 - u * .6)}); }
      for (let k = 0; k < 4; k++) burst(t0 + .1 + Math.random() * .6, .05 + Math.random() * .05, {f:5200 + Math.random() * 1500, q:.6, vol:.035});   /* a dry tearing whisper */
      burst(t0 + D, .12, {type:"lowpass", f:300, q:.8, vol:.18, attack:.005});   /* the rods knock against the table */
    } else {
      const D = .48;
      swell(t0, D, 2200, .07);
      for (let k = 0; k < 26; k++){ const u = Math.random(); burst(t0 + u * D, .006 + Math.random() * .02, {f:1800 + Math.random() * 3600, q:1 + Math.random() * 2, vol:(.04 + Math.random() * .1) * (.5 + u * .5)}); }
      burst(t0 + D, .08, {type:"lowpass", f:380, q:.8, vol:.12, attack:.004});
    }
    setTimeout(() => out.disconnect(), 2000);
  }catch(e){}
}

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
    const r1 = seeded(t.gid);
    roll.style.setProperty("--sx", Math.round(r1() * 100) + "%"); roll.style.setProperty("--sy", Math.round(r1() * 100) + "%");
    roll.style.setProperty("--fx", Math.round(18 + r1() * 55) + "%"); roll.style.setProperty("--age", (r1() * .25).toFixed(2));
    const flap = mk("i", "flap"); flap.style.clipPath = ragged(r1, 6);
    roll.append(mk("i", "knob l"), mk("i", "band"), flap, mk("i", "knob r"));
    const tw = mk("span", "ath-tagwrap");
    const tag = mk("span", "ath-tag"); tag.append(mk("small", null, roman(i + 1)), mk("span", null, t.name));
    tag.style.clipPath = tornTag(r1);
    tw.appendChild(tag);
    b.append(roll, tw);
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
  paperSound("slide");
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
  paperSound("unroll");
  busy = false;
  setTimeout(() => { const f = reader.querySelector(".ath-close"); if (f) f.focus({preventScroll:true}); }, REDUCED ? 0 : 900);
}
function buildReader(t){
  reader.textContent = "";
  const veil = mk("div", "ath-veil"); veil.addEventListener("click", () => close());
  const pap = mk("div", "ath-papyrus"); pap.setAttribute("role", "dialog"); pap.setAttribute("aria-label", t.name);
  const outer = mk("div", "ath-sheet");
  const r2 = seeded(t.gid + "sheet");
  const paper = mk("div", "ath-paper"); paper.style.clipPath = raggedSheet(r2);
  paper.style.setProperty("--bx", Math.round(r2() * 520) + "px"); paper.style.setProperty("--by", Math.round(r2() * 520) + "px");
  for (let k = 0, n = 3 + Math.floor(r2() * 3); k < n; k++){ const h = mk("i", "ath-hole"); const z = 6 + r2() * 12; Object.assign(h.style, {left:(4 + r2() * 92) + "%", top:(r2() < .5 ? 2 + r2() * 10 : 86 + r2() * 11) + "%", width:z + "px", height:z * (.7 + r2() * .5) + "px"}); paper.appendChild(h); }
  for (let k = 0, n = 1 + Math.floor(r2() * 2); k < n; k++){ const g = mk("i", "ath-ring"); const z = 70 + r2() * 90; Object.assign(g.style, {left:(10 + r2() * 70) + "%", top:(10 + r2() * 60) + "%", width:z + "px", height:z * (.85 + r2() * .3) + "px"}); paper.appendChild(g); }
  const sheet = mk("div", "ath-content");
  outer.append(paper, sheet);
  sheet.appendChild(mk("div", "ath-kicker", "From the Knowledge shelf"));
  sheet.appendChild(mk("h3", "ath-title", t.name));
  const meta = [`Inscribed ${fmtDate(t.created_at)}`];
  if (t.modified_at) meta.push(`last touched ${fmtDate(t.modified_at)}`);
  if (t.due_on) meta.push(`due ${fmtDate(t.due_on)}`);
  sheet.appendChild(mk("div", "ath-meta", meta.join(" · ")));
  sheet.appendChild(mk("div", "ath-rule"));
  const rich = richBody(t.html_notes);
  if (rich) sheet.appendChild(rich);
  else if (String(t.notes || "").trim()) sheet.appendChild(noteBody(t.notes));
  else sheet.appendChild(mk("p", "ath-blank", "This scroll is blank. Whatever it holds is still in your head, or in Asana's attachments."));
  const acts = mk("div", "ath-acts");
  const go = mk("a", "ath-btn", "Open in Asana"); go.href = t.permalink_url || ("https://app.asana.com/0/0/" + t.gid); go.target = "_blank"; go.rel = "noopener noreferrer";
  const back = mk("button", "ath-btn ghost ath-close", "Return it to the shelf"); back.type = "button"; back.addEventListener("click", () => close());
  acts.append(go, back);
  sheet.appendChild(acts);
  pap.append(mk("i", "ath-rod l"), outer, mk("i", "ath-rod r"));
  reader.append(veil, pap);
}
async function close(quick){
  if (!open) return;
  const was = open; open = null;
  reader.classList.remove("open"); reader.classList.add("rolled");
  if (!quick) paperSound("rollup");
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
      .map(t => ({gid:t.gid, name:t.name || "Untitled", notes:t.notes || "", html_notes:t.html_notes || "", due_on:t.due_on || null, created_at:t.created_at || null, modified_at:t.modified_at || null, permalink_url:t.permalink_url || ""}));
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

/* ================= The Archivist: turns a recording, document or transcript into a knowledge article and files it ================= */
const arc = {svg:$("arc-svg"), say:$("arc-say"), tray:$("arc-tray"), url:$("arc-url"), list:$("arc-sources"), text:$("arc-text"), focus:$("arc-focus"), start:$("arc-start"), meter:$("arc-meter"), result:$("arc-result")};
let arcSources = [], arcBusy = false, arcArticle = null, arcAbort = null;
const ARC_MAX_CHARS = 600000;

function drawArchivist(){
  const s = arc.svg; s.textContent = "";
  const d = sv("defs", null, s);
  const rg = sv("radialGradient", {id:"arc-candle", cx:"50%", cy:"50%", r:"50%"}, d);
  sv("stop", {offset:"0", "stop-color":"#ffc070", "stop-opacity":".55"}, rg); sv("stop", {offset:"1", "stop-color":"#ffc070", "stop-opacity":"0"}, rg);
  const robe = sv("linearGradient", {id:"arc-robe", x1:"0", y1:"0", x2:"1", y2:"1"}, d);
  sv("stop", {offset:"0", "stop-color":"#5e462a"}, robe); sv("stop", {offset:".6", "stop-color":"#433019"}, robe); sv("stop", {offset:"1", "stop-color":"#2a1d0e"}, robe);
  const skin = sv("radialGradient", {id:"arc-skin", cx:"40%", cy:"35%", r:"70%"}, d);
  sv("stop", {offset:"0", "stop-color":"#d9b48a"}, skin); sv("stop", {offset:"1", "stop-color":"#9c7652"}, skin);
  /* the gloom behind him: a shelf of crumbling codices */
  sv("rect", {x:0, y:0, width:380, height:400, fill:"#120d08"}, s);
  const bk = sv("g", {opacity:".55"}, s);
  sv("rect", {x:14, y:96, width:352, height:8, fill:"#3a2a18"}, bk); sv("rect", {x:14, y:186, width:352, height:8, fill:"#3a2a18"}, bk);
  let x = 20; const cols = ["#4a2e1c", "#2e3a24", "#5a3d22", "#3a2618", "#4d3a2a", "#2c2a38"];
  for (let i = 0; x < 360; i++){ const w = 10 + (i * 7) % 12, h = 46 + (i * 13) % 30, lean = i % 9 === 4 ? -10 : 0; sv("rect", {x, y:96 - h, width:w, height:h, fill:cols[i % cols.length], transform: lean ? `rotate(${lean} ${x} 96)` : null}, bk); x += w + 2; }
  x = 24; for (let i = 0; x < 350; i++){ const w = 12 + (i * 5) % 10, h = 40 + (i * 11) % 34; sv("rect", {x, y:186 - h, width:w, height:h, fill:cols[(i + 3) % cols.length]}, bk); x += w + 3; }
  /* candle glow */
  sv("circle", {cx:62, cy:232, r:120, fill:"url(#arc-candle)", class:"arc-glow"}, s);
  /* the stool, and the hem of his robe hanging ragged below the desk */
  sv("path", {d:"M262 360 L256 400 M338 360 L346 400 M300 362 L300 400", stroke:"#2a1c0f", "stroke-width":"7"}, s);
  sv("rect", {x:250, y:352, width:100, height:12, rx:4, fill:"#3b2915"}, s);
  const body = sv("g", {class:"arc-body"}, s);
  sv("path", {d:"M336 358 C 352 284, 330 192, 268 150 C 240 136, 210 138, 192 154 C 182 190, 194 244, 212 300 L 226 356 L 236 348 L 244 360 L 254 347 L 264 362 L 274 350 L 286 361 L 298 349 L 310 362 L 322 350 Z", fill:"url(#arc-robe)", stroke:"#1c1309", "stroke-width":"2"}, body);
  /* the arch of his back, a patch or two, worn threads */
  sv("path", {d:"M318 300 C 330 250, 312 196, 268 166", stroke:"#6b5232", "stroke-width":"2", fill:"none", opacity:".7"}, body);
  sv("path", {d:"M300 330 C 300 300, 290 270, 276 252", stroke:"#1c1309", "stroke-width":"2", fill:"none", opacity:".6"}, body);
  sv("rect", {x:276, y:206, width:26, height:20, fill:"#6e5634", stroke:"#c9b48a", "stroke-width":"1.1", "stroke-dasharray":"3 2", transform:"rotate(-14 289 216)"}, body);
  sv("rect", {x:236, y:272, width:18, height:15, fill:"#38281a", stroke:"#a8946c", "stroke-width":"1", "stroke-dasharray":"2.5 2", transform:"rotate(9 245 280)"}, body);
  sv("path", {d:"M326 330 l6 10 M312 342 l3 12 M284 344 l-2 12", stroke:"#5e462a", "stroke-width":"1.4"}, body);
  /* cowl slumped at the neck */
  sv("path", {d:"M196 150 C 214 128, 252 130, 270 152 C 252 160, 220 162, 196 150 Z", fill:"#3a2a17", stroke:"#1c1309", "stroke-width":"1.5"}, body);
  /* head, thrust forward and low */
  const head = sv("g", {class:"arc-head"}, s);
  sv("path", {d:"M200 118 C 214 132, 214 156, 200 168", stroke:"#e9e3d4", "stroke-width":"3", fill:"none", opacity:".85"}, head);
  sv("path", {d:"M205 126 c 10 6, 12 16, 6 26 M198 112 c 12 0, 18 8, 16 16", stroke:"#dcd5c4", "stroke-width":"1.6", fill:"none"}, head);
  sv("ellipse", {cx:176, cy:136, rx:28, ry:31, fill:"url(#arc-skin)", transform:"rotate(-18 176 136)", stroke:"#6b4a2c", "stroke-width":"1.2"}, head);
  sv("circle", {cx:182, cy:116, r:3, fill:"#9a724c", opacity:".7"}, head); sv("circle", {cx:191, cy:124, r:2, fill:"#9a724c", opacity:".7"}, head); sv("circle", {cx:172, cy:112, r:1.6, fill:"#9a724c", opacity:".6"}, head);
  sv("ellipse", {cx:196, cy:144, rx:6, ry:9, fill:"#b98d64", stroke:"#6b4a2c", "stroke-width":"1"}, head);
  /* nose: long, hooked; cheeks hollow; an ink smudge where he rubbed his face */
  sv("path", {d:"M156 132 C 150 142, 140 152, 141 160 C 144 162, 150 160, 154 157", fill:"#c49a70", stroke:"#6b4a2c", "stroke-width":"1.3"}, head);
  sv("path", {d:"M168 150 c 4 6, 4 12, 0 16", stroke:"#8a6440", "stroke-width":"1.2", fill:"none", opacity:".8"}, head);
  sv("ellipse", {cx:180, cy:156, rx:5, ry:2.5, fill:"#1d1b2c", opacity:".55", transform:"rotate(-25 180 156)"}, head);
  /* bushy brow, a tired eye, spectacles slipping down */
  sv("path", {d:"M152 124 c 6 -6, 16 -6, 22 -1", stroke:"#ece6d8", "stroke-width":"3.4", "stroke-linecap":"round", fill:"none"}, head);
  sv("circle", {cx:162, cy:132, r:2.3, fill:"#1a120a"}, head);
  sv("ellipse", {cx:162, cy:131, rx:5, ry:4, fill:"#b98d64", class:"arc-lid"}, head);
  sv("path", {d:"M156 137 c 4 3, 9 3, 12 0", stroke:"#7a5636", "stroke-width":"1", fill:"none"}, head);
  sv("circle", {cx:158, cy:139, r:8, fill:"rgba(220,235,240,.12)", stroke:"#a8956c", "stroke-width":"1.4"}, head);
  sv("path", {d:"M166 137 L 194 140", stroke:"#a8956c", "stroke-width":"1.1"}, head);
  sv("path", {d:"M150 165 c 4 2, 8 2, 11 0", stroke:"#5a3a20", "stroke-width":"1.4", fill:"none"}, head);
  /* scraggly beard */
  const beard = sv("g", {stroke:"#ddd6c6", "stroke-width":"1.5", fill:"none", "stroke-linecap":"round"}, head);
  ["M156 166 C 152 182, 158 196, 150 214", "M162 166 C 162 184, 168 198, 162 220", "M168 164 C 172 180, 176 192, 172 208", "M152 166 C 146 178, 148 190, 142 200", "M174 160 C 180 172, 182 182, 180 194"].forEach(p => sv("path", {d:p}, beard));
  /* the writing arm: frayed sleeve, ink-blotched cuff, bony fingers black at the tips */
  const arm = sv("g", {class:"arc-arm"}, s);
  sv("path", {d:"M206 168 C 222 200, 214 236, 190 262 L 172 270 L 168 262 L 160 266 L 158 256 C 172 240, 186 210, 192 176 Z", fill:"#4a3520", stroke:"#1c1309", "stroke-width":"1.8"}, arm);
  sv("path", {d:"M160 258 l -4 8 M166 262 l -2 9 M172 266 l 0 8", stroke:"#5e462a", "stroke-width":"1.3"}, arm);
  sv("ellipse", {cx:176, cy:258, rx:7, ry:4, fill:"#16152a", opacity:".7"}, arm);
  const hand = sv("g", {class:"arc-hand"}, arm);
  sv("path", {d:"M150 262 C 144 266, 140 274, 144 282 C 152 288, 166 286, 170 276 C 170 268, 162 262, 150 262 Z", fill:"url(#arc-skin)", stroke:"#6b4a2c", "stroke-width":"1.2"}, hand);
  [[142, 282, 134, 296], [148, 285, 142, 299], [155, 286, 151, 300], [162, 284, 160, 296]].forEach(([x1, y1, x2, y2]) => {
    sv("path", {d:`M${x1} ${y1} L${x2} ${y2}`, stroke:"#a57d58", "stroke-width":"3.6", "stroke-linecap":"round"}, hand);
    sv("circle", {cx:x2, cy:y2, r:2.2, fill:"#151427"}, hand);
  });
  const quill = sv("g", {class:"arc-quill"}, hand);
  sv("path", {d:"M138 296 L 196 196", stroke:"#d8cbb0", "stroke-width":"1.6"}, quill);
  sv("path", {d:"M196 196 C 176 214, 160 240, 150 270 C 168 248, 186 226, 204 206 C 206 200, 202 196, 196 196 Z", fill:"#ebe2cc", stroke:"#9a8a6a", "stroke-width":"1"}, quill);
  for (let k = 0; k < 7; k++){ const t = k / 7, xx = 196 - t * 44, yy = 198 + t * 70; sv("path", {d:`M${xx} ${yy} l ${-8 + k} ${-4}`, stroke:"#b8a888", "stroke-width":".8"}, quill); }
  sv("circle", {cx:138, cy:297, r:1.6, fill:"#151427"}, quill);
  /* the desk and its clutter */
  sv("path", {d:"M6 300 L 272 300 L 282 322 L 0 322 Z", fill:"#3d2a16", stroke:"#1c1309", "stroke-width":"2"}, s);
  sv("rect", {x:0, y:322, width:282, height:78, fill:"#2a1c0e"}, s);
  sv("path", {d:"M10 340 H 270 M10 372 H 270", stroke:"#1a1108", "stroke-width":"2"}, s);
  sv("path", {d:"M98 300 L 104 290 L 214 290 L 220 300 Z", fill:"#d8c493", stroke:"#8a6a3a", "stroke-width":"1"}, s);
  const lines = sv("g", {stroke:"#3a2a1a", "stroke-width":"1", opacity:".7", class:"arc-lines"}, s);
  [[112, 292.5, 168], [110, 295, 196], [108, 297.5, 150]].forEach(([x1, y, x2]) => sv("path", {d:`M${x1} ${y} H ${x2}`, "stroke-dasharray":"5 2 9 2 3 2"}, lines));
  sv("circle", {cx:202, cy:296, r:3, fill:"#151427", opacity:".8"}, s); sv("circle", {cx:226, cy:306, r:5, fill:"#151427", opacity:".55"}, s);
  sv("path", {d:"M232 300 C 230 288, 252 286, 252 300 Z", fill:"#1b1a2a", stroke:"#0b0a14", "stroke-width":"1.5"}, s);
  sv("rect", {x:236, y:283, width:12, height:5, rx:1.5, fill:"#2c2a3a"}, s);
  [[18, 270, 64, 30, "#4a2e1c"], [24, 254, 54, 16, "#2e3a24"], [14, 240, 60, 14, "#5a3d22"]].forEach(([x1, y1, w, h, c], k) => sv("rect", {x:x1, y:y1, width:w, height:h, rx:2, fill:c, stroke:"#1c1309", "stroke-width":"1.2", transform:`rotate(${[-2, 3, -4][k]} ${x1 + w / 2} ${y1 + h / 2})`}, s));
  sv("path", {d:"M82 300 C 86 290, 94 288, 96 300", fill:"#d8c493", stroke:"#8a6a3a"}, s);
  /* the candle stub, guttering */
  sv("path", {d:"M54 300 L 54 262 C 56 258, 68 258, 70 262 L 70 300 Z", fill:"#e7dcc0", stroke:"#a8946c", "stroke-width":"1"}, s);
  sv("path", {d:"M56 264 c 0 8, 3 10, 2 18 M68 264 c 1 6, -2 9, 0 14", stroke:"#d4c6a2", "stroke-width":"2.4", fill:"none"}, s);
  sv("rect", {x:44, y:298, width:36, height:6, rx:3, fill:"#6b5232"}, s);
  sv("path", {d:"M62 262 L 62 254", stroke:"#1c1309", "stroke-width":"1.2"}, s);
  sv("path", {class:"arc-flame", d:"M62 232 C 54 244, 56 254, 62 256 C 68 254, 70 244, 62 232 Z", fill:"#ffcf6a"}, s);
  sv("path", {class:"arc-flame", d:"M62 242 C 59 248, 60 252, 62 253 C 64 252, 65 248, 62 242 Z", fill:"#fff5d6"}, s);
}

const ARC_LINES = {
  idle:["Eh? Another visitor. Leave your link and the words behind it, and I'll set it down properly.", "Mind the ink. It never comes off, you know. Not in forty years.", "A recording, you say? I can't hear them. Bring me the transcript and I'll make sense of it.", "Everything worth knowing ends up in here eventually. Usually misfiled."],
  linkOnly:"A link, eh? The doors behind it are sealed to me, sign-ins and such. Paste me the words, or drop the transcript or file itself.",
  ready:"Ah, that's something I can read. Hand it over when you're ready.",
  spLink:"SharePoint, is it? Lend me your key: press “Fetch with my sign-in” and I'll go through your own door for the transcript.",
  fetching:"Shuffling down to the SharePoint stacks with your key… a moment.",
  signIn:"The door wants your name. Sign in to Microsoft in the browser pane of the Claude app (Ctrl+Shift+B shows it), then press Fetch again.",
  noTranscript:"I found the recording, but no one kept a transcript of it. Transcription has to be on during the meeting. Paste me notes instead.",
  noBrowser:"My key only turns in the Claude desktop app, where its browser lives. Open this page there, or drop the transcript file.",
  fetched:w => `Got it: ${w} from the transcript. Hand it over when you're ready.`,
  reading:["Squinting at it now…", "Hmm. Hmm. Yes…", "Turning the pages…"],
  writing:"Setting it down: what you need to know, the key points, the steps, and a map of the process…",
  done:"There. Read it over. If it suits you, I'll seal it onto the Knowledge shelf.",
  filed:"Filed. It's on the shelf now, with the others.",
  video:"A recording? My ears are long gone. In Teams, open the meeting recap, then Transcript, then Download, and bring me that instead."
};
function arcSay(text, state){ arc.say.textContent = text; arc.svg.setAttribute("class", state || ""); }
arc.svg.addEventListener("click", () => { if (!arcBusy) arcSay(ARC_LINES.idle[Math.floor(Math.random() * ARC_LINES.idle.length)]); });

/* ---------- sources: links, files and pasted text ---------- */
function corpusChars(){ return arcSources.reduce((n, x) => n + (x.text ? x.text.length : 0), 0) + arc.text.value.trim().length; }
function wordsLabel(t){ const n = t.split(/\s+/).filter(Boolean).length; return n < 1000 ? `${n} words` : `${Math.round(n / 100) / 10}k words`; }
function arcRefresh(quiet){
  arc.list.textContent = "";
  arcSources.forEach((x, i) => {
    const li = mk("li", "arc-src" + (x.kind === "link" ? " link" : ""));
    const ic = mk("i"); li.appendChild(ic);
    if (x.kind === "link"){ const a = mk("a", null, x.label); a.href = x.url; a.target = "_blank"; a.rel = "noopener noreferrer"; a.title = x.url; li.appendChild(a); }
    else li.appendChild(mk("span", null, x.name));
    li.appendChild(mk("em", null, x.fetching ? "fetching…" : x.error ? x.error : x.text ? wordsLabel(x.text) : x.kind === "link" ? "link" : "reading…"));
    if (x.kind === "link" && isSharePoint(x.url) && !x.text && !x.fetching){
      const fb = mk("button", "arc-fetch", "Fetch with my sign-in"); fb.type = "button";
      fb.title = "Opens it in the Claude app's browser, where you're signed in to Microsoft, and pulls the transcript";
      fb.disabled = arcBusy || arcSources.some(s => s.fetching);
      fb.addEventListener("click", () => fetchSigned(x)); li.appendChild(fb);
    }
    const rm = mk("button", "arc-x", "×"); rm.type = "button"; rm.title = "Take it back"; rm.setAttribute("aria-label", "Remove " + (x.name || x.label));
    rm.addEventListener("click", () => { arcSources.splice(i, 1); arcRefresh(); });
    li.appendChild(rm); arc.list.appendChild(li);
  });
  const chars = corpusChars(), links = arcSources.filter(x => x.kind === "link").length;
  const w = Math.round(chars / 6);
  const vid = arcSources.some(x => x.kind === "link" && !x.text && /video|recording|stream/i.test(x.label + " " + x.url));
  const sp = arcSources.some(x => x.kind === "link" && !x.text && isSharePoint(x.url));
  arc.meter.classList.toggle("wait", !chars && !!links);
  arc.meter.textContent = chars ? `about ${w < 1000 ? w + " words" : Math.round(w / 100) / 10 + "k words"} to read`
    : links ? (sp ? "Press “Fetch with my sign-in” on the link (Claude desktop app), or drop the transcript file / paste its text above."
             : vid ? "Waiting on the transcript. In Teams: meeting recap → Transcript → Download, then drop the file here or paste its text above."
                   : "Waiting on the words. He can't open links behind a sign-in, so drop the file itself or paste its text above.")
    : "";
  arc.start.disabled = arcBusy || !chars;
  if (!quiet && !arcBusy && !arcSources.some(s => s.fetching)){ if (chars) arcSay(ARC_LINES.ready); else if (links) arcSay(sp ? ARC_LINES.spLink : vid ? ARC_LINES.video : ARC_LINES.linkOnly); }
  arc.text.classList.toggle("arc-want", !chars && !!links);
}
/* ---------- reading SharePoint / OneDrive recordings through the viewer's own Microsoft sign-in ----------
   The page can't hold Microsoft credentials, but the Claude desktop app's browser can: the viewer signs in there once,
   and the Archivist asks that browser to open SharePoint's own file API (cookie-authenticated, read-only GETs). */
const BROWSER = "host:claude_browser";
function isSharePoint(u){ try { return /(^|\.)sharepoint\.com$/i.test(new URL(u).hostname); } catch(e){ return false; } }
function b64url(s){ return btoa(unescape(encodeURIComponent(s))).replace(/=+$/, "").replace(/\//g, "_").replace(/\+/g, "-"); }
function resText(r){ return ((r && r.content) || []).filter(b => b && b.type === "text").map(b => b.text).join("\n") || (typeof r?.payload === "string" ? r.payload : ""); }
function resJson(r){
  if (r && r.payload && typeof r.payload === "object" && !Array.isArray(r.payload) && (r.payload.id || r.payload.value)) return r.payload;
  const t = resText(r), a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a < 0 || b < a) return null;
  try { return JSON.parse(t.slice(a, b + 1)); } catch(e){ return null; }
}
let arcTab = null;
const pause = ms => new Promise(r => setTimeout(r, ms));
async function fetchSigned(src){
  if (arcBusy || src.fetching) return;
  const mcp = window.claude && await claude.use("mcp").catch(() => null);
  if (!mcp){ src.error = "needs the Claude app"; arcRefresh(); arcSay(ARC_LINES.noBrowser, ""); return; }
  src.fetching = true; src.error = null; arcRefresh(); arcSay(ARC_LINES.fetching, "reading");
  const host = new URL(src.url).host, call = (tool, input) => mcp.callTool(BROWSER, tool, input, {cache:false});
  let tab = arcTab;
  const go = async url => { const r = await call("navigate", tab ? {url, tabId:tab} : {url}); await pause(900); return r; };
  const page = async () => resJson(await call("get_page_text", tab ? {tabId:tab, max_chars:900000} : {max_chars:900000}));
  const signIn = async () => { try { await go(src.url); } catch(e){} src.error = "sign in, then fetch again"; arcSay(ARC_LINES.signIn, ""); };
  try {
    let reused = false;
    if (tab){ try { await go(src.url); reused = true; } catch(e){ tab = null; } }
    if (!reused){
      const opened = await call("preview_start", {url:src.url});
      tab = arcTab = opened?.payload?.tabId || (/tab\s*_?id["'\s:=]+["']?([\w-]+)/i.exec(resText(opened)) || [])[1] || null;
    }
    await pause(1500);
    await go(`https://${host}/_api/v2.0/shares/u!${b64url(src.url)}/driveItem?$select=id,name,parentReference,file`);
    const item = await page();
    if (!item || !item.id){
      const ec = item && item.error && String(item.error.code || "");
      if (item && item.error && !/unauthenticated|InvalidAuthenticationToken|unauthorized/i.test(ec)) throw new Error(ec === "accessDenied" || ec === "itemNotFound" ? "you don't have access to that recording" : (item.error.message || ec));
      return await signIn();
    }
    const base = `https://${host}/_api/v2.1/drives/${item.parentReference.driveId}/items/${item.id}`;
    src.label = item.name || src.label;
    await go(base + "/media/transcripts");
    const list = await page(), ts = (list && list.value) || [];
    if (!list) return await signIn();
    if (!ts.length){ src.error = "no transcript on it"; arcSay(ARC_LINES.noTranscript, ""); return; }
    /* streamContent itself downloads as a file; /content?format=json redirects to a viewable JSON copy */
    const tr = ts.find(t => t.isDefault) || ts[0];
    await go(`${base}/media/transcripts/${tr.id}/content?format=json`); await pause(600);
    let raw = resText(await call("get_page_text", {tabId:tab, max_chars:2000000}));
    let text = "";
    const j = resJson({content:[{type:"text", text:raw}]}), e = j && (j.entries || j.value);
    if (Array.isArray(e)){
      const out = []; let who = null;
      e.forEach(x => { const s = (x.speakerDisplayName || "").replace(/^([^,]+),\s*(.+)$/, "$2 $1"), t = (x.text || "").trim(); if (!t) return;
        if (s && s === who) out[out.length - 1] += " " + t; else { out.push((s ? s + ": " : "") + t); who = s; } });
      text = out.join("\n");
    } else { const v = raw.indexOf("WEBVTT"); if (v >= 0) text = cleanCaptions(raw.slice(v)); }
    if (!text || text.length < 40) throw new Error("the transcript came back empty");
    src.text = text.slice(0, ARC_MAX_CHARS); src.name = src.label;
    try { await go(src.url); } catch(e){}
    arcSay(ARC_LINES.fetched(wordsLabel(src.text)), "");
  } catch(e){
    const code = e && e.code;
    if (code === "server_not_connected" || code === "not_in_manifest" || code === "capability_disabled"){ src.error = "needs the Claude app"; arcSay(ARC_LINES.noBrowser, ""); }
    else if (code === "not_granted" || code === "consent_required"){ src.error = "browser not allowed"; arcSay("You'd not let me use the browser. Fair enough. Drop the transcript file instead.", ""); }
    else { src.error = "couldn't fetch"; arcSay("The shelves wouldn't give it up: " + String((e && e.message) || e).slice(0, 140) + ". Drop the transcript file instead, if you have it.", ""); }
  } finally { src.fetching = false; arcRefresh(true); }
}
function addLink(raw){
  const u = String(raw || "").trim(); if (!/^https?:\/\//i.test(u)) return false;
  if (!arcSources.some(x => x.url === u)) arcSources.push({kind:"link", url:u, label:linkLabel(u)});
  arcRefresh(); return true;
}
const scriptCache = {};
function loadScript(src){ return scriptCache[src] || (scriptCache[src] = new Promise((res, rej) => { const el = document.createElement("script"); el.src = src; el.onload = res; el.onerror = () => { delete scriptCache[src]; rej(new Error("Couldn't load a reader for that file type.")); }; document.head.appendChild(el); })); }
function cleanCaptions(t){
  return t.replace(/^WEBVTT.*$/m, "").replace(/^\d+\s*$/gm, "").replace(/^[\d:.,]+\s*-->\s*[\d:.,]+.*$/gm, "")
    .replace(/<v\s+([^>]+)>/g, "$1: ").replace(/<\/?[^>]+>/g, "").replace(/\n{3,}/g, "\n\n").trim();
}
async function readFile(file){
  const name = file.name, ext = (name.split(".").pop() || "").toLowerCase();
  if (/^(mp4|m4a|mov|wav|mp3|webm|avi|mkv)$/.test(ext) || /^(video|audio)\//.test(file.type)) throw new Error("recording");
  if (file.size > 40 * 1024 * 1024) throw new Error("too big (40 MB max)");
  if (ext === "vtt" || ext === "srt") return cleanCaptions(await file.text());
  if (ext === "html" || ext === "htm"){ const doc = new DOMParser().parseFromString(await file.text(), "text/html"); return doc.body.innerText || doc.body.textContent || ""; }
  if (ext === "docx"){
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js");
    const zip = await window.JSZip.loadAsync(await file.arrayBuffer());
    const xml = await zip.file("word/document.xml").async("string");
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
    return [...doc.getElementsByTagNameNS(W, "p")].map(p => [...p.getElementsByTagNameNS(W, "t")].map(t => t.textContent).join("")).filter(Boolean).join("\n");
  }
  if (ext === "pdf"){
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
    const lib = window.pdfjsLib; lib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    const pdf = await lib.getDocument({data: new Uint8Array(await file.arrayBuffer())}).promise;
    const out = [];
    for (let i = 1; i <= Math.min(pdf.numPages, 300); i++){ const pg = await pdf.getPage(i); const tc = await pg.getTextContent(); out.push(tc.items.map(x => x.str).join(" ")); }
    return out.join("\n\n");
  }
  return await file.text();
}
async function addFiles(files){
  for (const f of files){
    const item = {kind:"file", name:f.name, text:""}; arcSources.push(item); arcRefresh();
    try{
      item.text = String(await readFile(f)).slice(0, ARC_MAX_CHARS).trim();
      if (!item.text) item.error = "no readable text";
      paperSound("slide");
    }catch(e){
      if (e && e.message === "recording"){ item.error = "a recording"; arcSay(ARC_LINES.video); }
      else item.error = (e && e.message) || "couldn't read";
    }
    arcRefresh();
    if (item.error === "a recording") arcSay(ARC_LINES.video);
  }
}
arc.tray.addEventListener("dragover", ev => { ev.preventDefault(); arc.tray.classList.add("hot"); });
arc.tray.addEventListener("dragleave", ev => { if (!arc.tray.contains(ev.relatedTarget)) arc.tray.classList.remove("hot"); });
arc.tray.addEventListener("drop", ev => {
  ev.preventDefault(); arc.tray.classList.remove("hot");
  const dt = ev.dataTransfer; if (!dt) return;
  if (dt.files && dt.files.length){ addFiles([...dt.files]); return; }
  const uris = (dt.getData("text/uri-list") || "").split(/\r?\n/).filter(l => l && !l.startsWith("#"));
  if (uris.length){ uris.forEach(addLink); return; }
  const txt = dt.getData("text/plain") || "";
  if (/^https?:\/\/\S+$/i.test(txt.trim())) addLink(txt); else if (txt.trim()){ arc.text.value = (arc.text.value + "\n\n" + txt).trim(); arcRefresh(); }
});
arc.tray.addEventListener("paste", ev => {
  if (ev.target === arc.url) return;
  const txt = ev.clipboardData && ev.clipboardData.getData("text/plain"); if (!txt) return;
  ev.preventDefault();
  if (/^https?:\/\/\S+$/i.test(txt.trim())) addLink(txt); else { arc.text.value = (arc.text.value + "\n\n" + txt).trim(); arcRefresh(); }
});
$("arc-add").addEventListener("click", () => { if (addLink(arc.url.value)) arc.url.value = ""; else arc.url.focus(); });
arc.url.addEventListener("keydown", ev => { if (ev.key === "Enter"){ ev.preventDefault(); if (addLink(arc.url.value)) arc.url.value = ""; } });
$("arc-file").addEventListener("change", ev => { addFiles([...ev.target.files]); ev.target.value = ""; });
arc.text.addEventListener("input", () => arcRefresh());

/* ---------- writing the article ---------- */
const bytes = s => new TextEncoder().encode(s).length;
function corpus(){
  const parts = arcSources.filter(x => x.text).map(x => `=== Source: ${x.name} ===\n${x.text}`);
  if (arc.text.value.trim()) parts.push(`=== Source: pasted text ===\n${arc.text.value.trim()}`);
  return parts.join("\n\n");
}
const ARTICLE_SPEC = `Return ONLY a JSON object with exactly these keys:
{"title": "short, specific title, at most 70 characters",
 "summary": "one or two plain sentences: what this is and why it matters",
 "need_to_know": ["3 to 6 bullets: the essentials someone must understand first"],
 "key_points": ["4 to 10 bullets: decisions, facts, numbers, owners, systems, dates"],
 "steps_kind": "to complete" if the source teaches how to do something, or "executed" if it records what was done,
 "steps": ["ordered steps, each one short imperative sentence"],
 "flow": {"nodes": [{"id": "n1", "label": "at most 6 words", "type": "start|step|decision|end"}], "edges": [{"from": "n1", "to": "n2", "label": "optional, e.g. Yes or No"}]},
 "gaps": ["anything important the source left unclear; empty if none"]}
Rules: use only what the source says; never invent names, numbers or links. The flow is a process map of the steps with 5 to 14 nodes, exactly one start node, at least one end node, and decision nodes whose outgoing edges are labeled. Write for a Salesforce CRM operations team at the University of Kentucky.`;
async function arcWrite(){
  if (arcBusy) return;
  const text = corpus(); if (!text.trim()) return;
  const sample = window.claude && window.claude.use ? await window.claude.use("sample").catch(() => null) : null;
  if (!sample){ arcSay("My eyes fail me in this copy. Open the page in Claude and I'll write for you there."); return; }
  arcBusy = true; arc.start.disabled = true; arc.result.hidden = true;
  arcAbort = new AbortController();
  const links = arcSources.filter(x => x.kind === "link").map(x => x.url);
  const focus = arc.focus.value.trim();
  try{
    const lim = await sample.limits().catch(() => null);
    const cap = lim && lim.maxPromptBytes ? lim.maxPromptBytes : 120000;
    const budget = Math.max(12000, Math.floor(cap * .7) - bytes(ARTICLE_SPEC) - 2000);
    let source = text;
    if (bytes(source) > budget){
      /* too long to read at once: condense it in parts, keeping every fact, then write from the notes */
      const size = Math.floor(budget * .9), parts = [];
      for (let i = 0; i < source.length; i += size) parts.push(source.slice(i, i + size));
      const notes = [];
      for (let k = 0; k < parts.length; k++){
        arcSay(`Reading part ${k + 1} of ${parts.length}… ${ARC_LINES.reading[k % ARC_LINES.reading.length]}`, "reading");
        const r = await sample(`You are condensing part ${k + 1} of ${parts.length} of a long source (a meeting transcript or document) so an article can be written from it later. Keep every decision, fact, number, owner, system, date, warning and step, in order, as terse bullet notes. Drop small talk.\n\n${parts[k]}`, {signal:arcAbort.signal, cache:false});
        notes.push(`--- Notes on part ${k + 1} ---\n${r.text}`);
      }
      source = notes.join("\n\n");
      if (bytes(source) > budget) source = source.slice(0, budget);
    } else arcSay(ARC_LINES.reading[0], "reading");
    arcSay(ARC_LINES.writing, "writing");
    const prompt = `You are the archivist of a team knowledge base. Turn the source below into a knowledge article.\n${focus ? `The reader especially wants: ${focus}\n` : ""}${links.length ? `The source came from: ${links.join(" , ")}\n` : ""}\n${ARTICLE_SPEC}\n\nSOURCE:\n${source}`;
    const art = await sample.json(prompt, {signal:arcAbort.signal, cache:false});
    arcArticle = normalizeArticle(art, links);
    showArticle(arcArticle);
    paperSound("unroll");
    arcSay(ARC_LINES.done, "done");
  }catch(e){
    const code = e && e.code;
    arcSay(code === "not_granted" ? "You'll have to let me use Claude for this. Allow it when asked, then try again." :
      code === "rate_limited" ? "My hand's cramped. Too many requests just now; try again in a little while." :
      code === "cancelled" ? "Very well, I'll stop." :
      code === "invalid_json" ? "I botched the lettering on that one. Ask me again." :
      "Something went wrong in the writing. Try me again.", "");
  }finally{ arcBusy = false; arcAbort = null; arcRefresh(); }
}
arc.start.addEventListener("click", arcWrite);
function normalizeArticle(a, links){
  const arr = v => (Array.isArray(v) ? v : []).map(x => String(x || "").trim()).filter(Boolean);
  const flow = a && a.flow && Array.isArray(a.flow.nodes) ? a.flow : {nodes:[], edges:[]};
  const ids = new Set();
  const nodes = flow.nodes.map((n, i) => { let id = String(n.id || "n" + (i + 1)).replace(/[^\w]/g, "") || "n" + (i + 1); if (/^\d/.test(id)) id = "n" + id; while (ids.has(id)) id += "x"; ids.add(id); return {id, label:String(n.label || "").replace(/["\[\]{}|()]/g, "'").slice(0, 60) || id, type: ["start", "step", "decision", "end"].includes(n.type) ? n.type : "step", _orig:String(n.id)}; });
  const map = new Map(nodes.map(n => [n._orig, n.id]));
  const edges = (Array.isArray(flow.edges) ? flow.edges : []).map(e => ({from:map.get(String(e.from)), to:map.get(String(e.to)), label:e.label ? String(e.label).replace(/[|"]/g, "").slice(0, 24) : null})).filter(e => e.from && e.to);
  return {title:String((a && a.title) || "Untitled knowledge").slice(0, 120), summary:String((a && a.summary) || ""), need:arr(a && a.need_to_know), points:arr(a && a.key_points), kind:(a && a.steps_kind) === "executed" ? "executed" : "to complete", steps:arr(a && a.steps), gaps:arr(a && a.gaps), flow:{nodes, edges}, links, files:arcSources.filter(x => x.kind === "file" && x.text).map(x => x.name)};
}
function mermaid(flow){
  const lines = ["flowchart TD"];
  flow.nodes.forEach(n => lines.push(`  ${n.id}${n.type === "decision" ? `{"${n.label}"}` : n.type === "start" ? `(["${n.label}"])` : n.type === "end" ? `(("${n.label}"))` : `["${n.label}"]`}`));
  flow.edges.forEach(e => lines.push(`  ${e.from} -->${e.label ? `|${e.label}|` : ""} ${e.to}`));
  return lines.join("\n");
}
const xe = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function articleHtml(a){
  const li = xs => xs.map(x => `<li>${xe(x)}</li>`).join("");
  let h = "<body>";
  if (a.summary) h += `<blockquote>${xe(a.summary)}</blockquote>`;
  if (a.need.length) h += `<h2>What you need to know</h2><ul>${li(a.need)}</ul>`;
  if (a.points.length) h += `<h2>Key points</h2><ul>${li(a.points)}</ul>`;
  if (a.steps.length) h += `<h2>Steps ${a.kind === "executed" ? "executed" : "to complete"}</h2><ol>${li(a.steps)}</ol>`;
  if (a.flow.nodes.length) h += `<h2>Process map</h2><pre>${xe(mermaid(a.flow))}</pre>`;
  if (a.gaps.length) h += `<h2>Still unclear</h2><ul>${li(a.gaps)}</ul>`;
  if (a.links.length || a.files.length) h += `<h2>Sources</h2><ul>${a.links.map(u => `<li><a href="${xe(u)}">${xe(linkLabel(u))}</a></li>`).join("")}${a.files.map(f => `<li>${xe(f)}</li>`).join("")}</ul>`;
  h += `<hr/><em>Written up by the Archivist of the Lost Athenaeum, ${xe(new Date().toLocaleDateString(undefined, {month:"long", day:"numeric", year:"numeric"}))}.</em></body>`;
  return h;
}
function showArticle(a){
  const r = arc.result; r.textContent = ""; r.hidden = false;
  const card = mk("div", "arc-article");
  const t = mk("input", "arc-title"); t.value = a.title; t.setAttribute("aria-label", "Article title"); t.addEventListener("input", () => { a.title = t.value; });
  card.appendChild(mk("div", "ath-kicker", "Draft knowledge article"));
  card.appendChild(t);
  const body = richBody(articleHtml(a).replace(/<hr\/>.*$/, "</body>"));
  if (body) card.appendChild(body);
  const acts = mk("div", "ath-acts");
  const seal = mk("button", "ath-btn", "Seal it onto the Knowledge shelf"); seal.type = "button";
  const again = mk("button", "ath-btn ghost", "Ask him to write it again"); again.type = "button";
  const toss = mk("button", "ath-btn ghost", "Throw it on the fire"); toss.type = "button";
  seal.addEventListener("click", () => arcFile(a, seal));
  again.addEventListener("click", () => arcWrite());
  toss.addEventListener("click", () => { r.hidden = true; r.textContent = ""; arcArticle = null; arcSay("Pity. The ink was still wet."); });
  acts.append(seal, again, toss);
  card.appendChild(acts);
  const msg = mk("div", "arc-msg"); card.appendChild(msg);
  r.appendChild(card);
  r.scrollIntoView({block:"nearest", behavior: REDUCED ? "auto" : "smooth"});
}
function findGid(x, depth){ if (!x || depth > 5) return null; if (typeof x === "object"){ if (x.gid && (x.name || x.resource_type === "task")) return String(x.gid); for (const k of Object.keys(x)){ const g = findGid(x[k], (depth || 0) + 1); if (g) return g; } } return null; }
async function arcFile(a, btn){
  const msg = arc.result.querySelector(".arc-msg");
  const mcp = window.claude && window.claude.use ? await window.claude.use("mcp").catch(() => null) : null;
  if (!mcp){ msg.textContent = "Asana isn't connected here, so I can't file it."; return; }
  btn.disabled = true; msg.textContent = "Sealing it…";
  try{
    const res = payloadOf(await mcp.callTool(SERVER, "create_tasks", {default_assignee:"me", tasks:[{name:a.title.trim() || "Untitled knowledge", html_notes:articleHtml(a), assignee:"me", assignee_section:KNOWLEDGE_SECTION}]}, {cache:false}));
    if (res && Array.isArray(res.failed) && res.failed.length && !(res.succeeded || []).length) throw {code:"tool_error", message:JSON.stringify(res.failed[0].errors || res.failed[0]).slice(0, 200)};
    const gid = findGid(res && (res.succeeded || res.data || res));
    msg.textContent = "";
    arcSay(ARC_LINES.filed, "done"); paperSound("rollup");
    arc.result.hidden = true; arcSources = []; arc.text.value = ""; arc.focus.value = ""; arcArticle = null; arcRefresh(); arcSay(ARC_LINES.filed, "done");
    await load(true);
    const el = gid && shelf.querySelector(`.ath-scroll[data-gid="${gid}"]`);
    if (el){ el.scrollIntoView({block:"nearest", behavior:"smooth"}); el.classList.add("lit"); setTimeout(() => el.classList.remove("lit"), 2600); }
  }catch(e){
    btn.disabled = false;
    msg.textContent = (e && e.code === "not_granted") ? "Asana needs your permission to create tasks from this page. Allow it when asked, then press Seal again." : "Asana wouldn't take it" + (e && e.message ? ": " + String(e.message).slice(0, 200) : ".") + " Nothing was filed.";
  }
}
drawArchivist(); arcRefresh();

drawCrypt(); dust();
const c0 = readCache(); if (c0){ scrolls = c0.list; }
renderShelf();
let started = false;
const start = () => { if (!started){ started = true; load(false); } };
$("tabbtn-athenaeum").addEventListener("click", start);
if (!root.hidden) start();
new MutationObserver(() => { if (!root.hidden) start(); }).observe(root, {attributes:true, attributeFilter:["hidden"]});
})();
