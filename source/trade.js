(function(){
/* ================= Trade Map: systems and sources are settlements; integrations are the trade routes between them ================= */
const $ = id => document.getElementById(id);
const SVGNS = "http://www.w3.org/2000/svg";
function sv(tag, attrs, parent){ const e = document.createElementNS(SVGNS, tag); if (attrs) for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
function mk(tag, cls, text){ const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const sfx = n => { try{ if (window.__sfx) window.__sfx(n); }catch(e){} };
const MW = 3000, MH = 2000;          /* the whole continent; the first map sits in the middle, with room to grow on every side */
const OX = 900, OY = 600;            /* where the original 1200×800 map sits inside it */

/* guilds of traders: each integration tool gets a color and line style */
const TOOLS = {   /* alphabetical, so every list of tools reads A to Z */
  azure:     {label:"Azure Pipelines", color:"#6a4fc2", dash:null},
  connector: {label:"Connector / App", color:"#a8323e", dash:null},
  dataload:  {label:"Data Load",       color:"#7a5a2e", dash:"10 5"},
  view:      {label:"HANA View",       color:"#178f99", dash:null},
  mulesoft:  {label:"MuleSoft",        color:"#1f7fc4", dash:null},
  tbd:       {label:"Not Chosen Yet",  color:"#6d6a63", dash:null},
  automate:  {label:"Power Automate",  color:"#13896f", dash:null},
  talend:    {label:"Talend",          color:"#d0641c", dash:null}
};
const KINDS = {capital:"Capital (Core Platform)", source:"Source (Mine)", system:"System (Town)"};
const STATUS = {building:"Being Built", live:"Live", none:"Not Integrating", planned:"Planned", retired:"Retired"};

/* the starting map, drawn from the team's Asana tasks. Tools and directions are best guesses until someone corrects them. */
const SEED_S = [
  {id:"sf",         name:"Salesforce (Ed Cloud)", kind:"capital", blurb:"The capital: UK's CRM, moving to Education Cloud.", x:600, y:400},
  {id:"radar",      name:"RADAR",               kind:"system",  blurb:"Advancement's Salesforce org.", x:330, y:960},
  {id:"hana",       name:"SAP HANA",            kind:"system",  blurb:"HR and student records. Its views are the mines around it.", x:215, y:395},
  {id:"slate",      name:"Slate",               kind:"source",  blurb:"Admissions: undergraduate, graduate and events.", x:440, y:690},
  {id:"transfer",   name:"UK Transfer Portal",  kind:"source",  blurb:"Transfer student inquiries.", x:700, y:712},
  {id:"ukinvests",  name:"UK Invests",          kind:"source",  blurb:"UK Invests program data.", x:300, y:190},
  {id:"scoir",      name:"Scoir",               kind:"source",  blurb:"College search inquiries.", x:565, y:722},
  {id:"evertrue",   name:"EverTrue",            kind:"source",  blurb:"Donor engagement data.", x:580, y:1000},
  {id:"mc",         name:"Marketing Cloud",     kind:"system",  blurb:"Email and SMS journeys, data extensions.", x:962, y:335},
  {id:"sms",        name:"SMS Magic",           kind:"system",  blurb:"Texting from inside Salesforce.", x:914, y:502},
  {id:"outlook",    name:"Outlook",             kind:"system",  blurb:"Outlook plugin used by EDC.", x:880, y:160},
  {id:"bookings",   name:"Microsoft Bookings",  kind:"source",  blurb:"Appointments, carried in by Power Automate.", x:990, y:680},
  {id:"eventbrite", name:"Eventbrite",          kind:"source",  blurb:"Event registrations.", x:785, y:628},
  {id:"irads",      name:"IRADS",               kind:"system",  blurb:"Institutional research and analytics.", x:585, y:108},
  {id:"iers",       name:"IERS",                kind:"system",  blurb:"Receives an outbound integration.", x:470, y:178},
  {id:"cloudingo",  name:"Cloudingo",           kind:"system",  blurb:"Duplicate cleanup.", x:695, y:212},
  {id:"five9",      name:"Five9",               kind:"system",  blurb:"HR Contact Center phones.", x:1072, y:410},
  {id:"icims",      name:"Salary.com / iCIMS",  kind:"system",  blurb:"A possible future integration.", x:1062, y:212}
];
const SEED_R = [
  {id:"r-emp",      name:"Employee Contact & Assignment", from:"hana", to:"sf", tool:"mulesoft", flow:"one", status:"live", note:"The HANA-HR load. Picks up Beyond Blue employees."},
  {id:"r-ies",      name:"IES & Job History",        from:"hana", to:"sf", tool:"talend",   flow:"one", status:"live", note:""},
  {id:"r-progenr",  name:"Program Enrollment",       from:"hana", to:"sf", tool:"mulesoft", flow:"one", status:"building", note:"Ed Cloud migration build."},
  {id:"r-address",  name:"Address",                  from:"hana", to:"sf", tool:"mulesoft", flow:"one", status:"building", note:"Ed Cloud migration build."},
  {id:"r-grant",    name:"Grant Responsibility",     from:"hana", to:"sf", tool:"mulesoft", flow:"one", status:"building", note:"Ed Cloud migration build."},
  {id:"r-prireg",   name:"Priority Registration",    from:"hana", to:"sf", tool:"mulesoft", flow:"one", status:"building", note:"Ed Cloud migration build."},
  {id:"r-esc",      name:"Enrolled Student Comms",   from:"hana", to:"sf", tool:"mulesoft", flow:"one", status:"building", note:"Ed Cloud migration build."},
  {id:"r-email",    name:"UKY-Email-SAPI",           from:"hana", to:"sf", tool:"mulesoft", flow:"one", status:"building", note:"MuleSoft system API for UK email."},
  {id:"r-commpref", name:"Communication Preferences", from:"sf", to:"hana", tool:"mulesoft", flow:"two", status:"building", note:"Ed Cloud migration build."},
  {id:"r-ukinv",    name:"UK Invests",               from:"ukinvests", to:"sf", tool:"mulesoft", flow:"one", status:"live", note:"Fed from a view; new fields added for Fall 2026."},
  {id:"r-ukirads",  name:"UK Invests › IRADS",       from:"sf", to:"irads", tool:"mulesoft", flow:"one", status:"building", note:"Outbound integration."},
  {id:"r-iers",     name:"IERS Outbound",            from:"sf", to:"iers", tool:"mulesoft", flow:"one", status:"building", note:"Outbound integration."},
  {id:"r-slateug",  name:"Slate Undergrad",          from:"slate", to:"sf", tool:"talend", flow:"one", status:"live", note:""},
  {id:"r-slategr",  name:"Slate Grad",               from:"slate", to:"sf", tool:"talend", flow:"one", status:"live", note:"Handles term-shifted applications."},
  {id:"r-slateev",  name:"Slate Events",             from:"slate", to:"sf", tool:"talend", flow:"one", status:"live", note:"Preview and yield event handler flow."},
  {id:"r-recev",    name:"Recruiting Event Intake",  from:"slate", to:"sf", tool:"mulesoft", flow:"one", status:"building", note:"uky-recruiting-event-intake-eapi. Check which system it starts from."},
  {id:"r-transfer", name:"UK Transfer Portal",       from:"transfer", to:"sf", tool:"talend", flow:"one", status:"live", note:"Contacts, recruitments and RFIs; also reads from HANA."},
  {id:"r-scoir",    name:"Scoir Data Load",          from:"scoir", to:"sf", tool:"dataload", flow:"one", status:"live", note:"Added to the team's dataload tool."},
  {id:"r-radar",    name:"HANA › RADAR Pipelines",   from:"hana", to:"radar", tool:"azure", flow:"one", status:"live", note:"One main Azure pipeline runs all HANA-to-RADAR pipelines in sequence. Includes linkblue as work email."},
  {id:"r-evertrue", name:"EverTrue Cultivation",     from:"evertrue", to:"radar", tool:"connector", flow:"one", status:"live", note:"Cultivation updates into RADAR."},
  {id:"r-mc",       name:"Marketing Cloud Connect",  from:"sf", to:"mc", tool:"connector", flow:"two", status:"live", note:"Synchronized data extensions."},
  {id:"r-sms",      name:"SMS Magic",                from:"sf", to:"sms", tool:"connector", flow:"two", status:"live", note:""},
  {id:"r-outlook",  name:"Outlook Integration",      from:"outlook", to:"sf", tool:"connector", flow:"one", status:"live", note:"EDC contacts, businesses and opportunities from Outlook."},
  {id:"r-bookings", name:"Bookings Flows",           from:"bookings", to:"sf", tool:"automate", flow:"one", status:"live", note:"Power Automate flows send an EventFilterKey."},
  {id:"r-eventbr",  name:"Eventbrite Registrations", from:"eventbrite", to:"sf", tool:"connector", flow:"one", status:"live", note:""},
  {id:"r-dedupe",   name:"Cloudingo Dedupe",         from:"sf", to:"cloudingo", tool:"connector", flow:"two", status:"live", note:"Runs as the Cloudingo integration user."},
  {id:"r-five9",    name:"Five9 Status Sync",        from:"five9", to:"sf", tool:"connector", flow:"two", status:"planned", note:"Proof of concept: Five9 statuses with Omni-Channel."},
  {id:"r-icims",    name:"Salary.com / iCIMS",       from:"icims", to:"sf", tool:"tbd", flow:"one", status:"planned", note:"Potential integration."}
];
SEED_S.forEach(s => { s.x += OX; s.y += OY; });
/* mines recreated from the Ed Cloud data dictionary (already in full-map coordinates) */
const ORES = window.__TRADE_ORES || {settlements:[], routes:[], tables:[]};
SEED_S.push(...ORES.settlements.map(o => Object.assign({}, o)));
SEED_R.push(...ORES.routes.map(o => Object.assign({}, o)));
const SEED_T = ORES.tables;
const SEED_IDS = new Set([...SEED_S, ...SEED_R, ...SEED_T].map(x => x.id));

let docs = new Map();          /* id -> stored override or addition */
let db = null, readOnly = false;
let S = new Map(), R = new Map(), T = new Map();   /* T: tables kept at mines */
let sel = null;                /* {type:"s"|"r", id} */
let hover = null;
let mode = "view";             /* view | newS | newR | editS | editR | razeS | razeR | newT | editT */
let draft = null;
const hidden = new Set();      /* tools toggled off */
let showNames = true;
try{ showNames = localStorage.getItem("settlers-trade-names") !== "0"; }catch(e){}

function rebuild(){
  S = new Map(SEED_S.map(s => [s.id, Object.assign({}, s)]));
  R = new Map(SEED_R.map(r => [r.id, Object.assign({}, r)]));
  docs.forEach((v, id) => {
    const tgt = v.t === "s" ? S : v.t === "r" ? R : null;
    if (!tgt) return;
    if (v.removed){ tgt.delete(id); return; }
    const o = Object.assign({}, tgt.get(id) || {}, v, {id});
    /* positions saved before the map grew were measured on the smaller map */
    if (v.t === "s" && v.v !== 2 && typeof v.x === "number"){ o.x = v.x + OX; o.y = v.y + OY; }
    tgt.set(id, o);
  });
  mapIndex = null;
  T = new Map(SEED_T.filter(t => S.has(t.mine)).map(t => [t.id, Object.assign({t:"tbl"}, t)]));
  docs.forEach((v, id) => { if (v.t !== "tbl") return; if (v.removed){ T.delete(id); return; } if (S.has(v.mine) && Array.isArray(v.rows)) T.set(id, Object.assign({}, v, {id})); });
  R.forEach((r, id) => { if (!S.has(r.from) || !S.has(r.to) || r.from === r.to) R.delete(id); if (!TOOLS[r.tool]) r.tool = "tbd"; });
  if (sel && !(sel.type === "s" ? S : R).has(sel.id)) sel = null;
}
const canEdit = () => !!db && !readOnly;
function tablesOf(sid){ return [...T.values()].filter(t => t.mine === sid).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)); }
function routesOf(sid){ return [...R.values()].filter(r => r.from === sid || r.to === sid); }

/* ---------- drawing ---------- */
const svg = $("trade-svg");
svg.setAttribute("viewBox", `${OX} ${OY} 1200 800`);
let layerRoutes, layerTowns, layerLabels;

function drawBackdrop(){
  svg.textContent = "";
  const defs = sv("defs", null, svg);
  const pg = sv("radialGradient", {id:"tm-parch", cx:"50%", cy:"45%", r:"75%"}, defs);
  sv("stop", {offset:"0%", "stop-color":"#f1e4c0"}, pg); sv("stop", {offset:"100%", "stop-color":"#d9c597"}, pg);
  const wv = sv("pattern", {id:"tm-waves", width:"46", height:"20", patternUnits:"userSpaceOnUse"}, defs);
  sv("path", {d:"M0 10 q11.5 -7 23 0 t23 0", fill:"none", stroke:"#6f9a9c", "stroke-width":"1.2", opacity:".55"}, wv);
  /* sea, then the continent */
  sv("rect", {x:0, y:0, width:MW, height:MH, fill:"#a8c6c0"}, svg);
  sv("rect", {x:0, y:0, width:MW, height:MH, fill:"url(#tm-waves)"}, svg);
  const coast = "M70 120 C 120 40 300 46 420 58 C 560 30 700 62 820 48 C 960 34 1100 70 1150 140 C 1186 220 1160 300 1172 380 C 1190 470 1170 560 1150 640 C 1120 730 1000 772 880 764 C 760 776 640 768 520 772 C 380 780 240 770 150 724 C 70 680 52 600 46 520 C 36 420 40 330 48 250 C 52 190 46 160 70 120 Z";
  const K = `scale(${MW/1200} ${MH/800})`;
  sv("path", {d:coast, fill:"#8fb2ad", transform:K + " translate(4 5)"}, svg);
  sv("path", {d:coast, fill:"url(#tm-parch)", stroke:"#7d6a45", "stroke-width":"3", "vector-effect":"non-scaling-stroke", transform:K}, svg);
  sv("path", {d:coast, fill:"none", stroke:"#7d6a45", "stroke-width":"1.2", "stroke-dasharray":"3 6", "vector-effect":"non-scaling-stroke", transform:K + " translate(600 400) scale(.985) translate(-600 -400)", opacity:".6"}, svg);
  /* hills by the mines, woods by the towns: decoration only */
  const deco = sv("g", {opacity:".55", "pointer-events":"none"}, svg);
  const spots = [[150,300],[190,270],[290,300],[170,620],[300,520],[120,560],[470,620],[520,180],[700,190],[1010,230],[1110,520],[760,710]].map(([x, y]) => [x + OX, y + OY]);
  let seed = 11; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < 90; i++){
    const x = 260 + rnd() * (MW - 520), y = 240 + rnd() * (MH - 480);
    if (x > OX - 40 && x < OX + 1240 && y > OY - 40 && y < OY + 840) continue;   /* the charted middle already has its own */
    spots.push([x, y]);
  }
  spots.forEach(([x, y], i) => {
    if (i % 3 === 2){ sv("path", {d:`M${x-9} ${y+6} L${x} ${y-12} L${x+9} ${y+6} Z`, fill:"#6d8a4a"}, deco); sv("path", {d:`M${x+12} ${y+9} L${x+19} ${y-4} L${x+26} ${y+9} Z`, fill:"#5f7c40"}, deco); }
    else sv("path", {d:`M${x-20} ${y+8} Q ${x-6} ${y-14} ${x+8} ${y+8} M${x-2} ${y+8} Q ${x+10} ${y-6} ${x+22} ${y+8}`, fill:"none", stroke:"#8a7146", "stroke-width":"2"}, deco);
  });
  layerRoutes = sv("g", {class:"tm-routes"}, svg);
  layerTowns = sv("g", {class:"tm-towns"}, svg);
  layerLabels = sv("g", {class:"tm-labels", "pointer-events":"none"}, svg);
}

function geometry(){
  /* routes between the same two settlements fan out side by side */
  const groups = new Map();
  [...R.values()].forEach(r => { const k = [r.from, r.to].sort().join("|"); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(r); });
  const geo = new Map();
  groups.forEach((list, k) => {
    list.sort((a, b) => a.name.localeCompare(b.name));
    const [ia, ib] = k.split("|"); const A = S.get(ia), B = S.get(ib);
    const dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    const gap = Math.min(46, 400 / Math.max(list.length, 1)), base = list.length > 2 ? 0 : 26;
    list.forEach((r, i) => {
      const off = base + (i - (list.length - 1) / 2) * gap;
      const cx = (A.x + B.x) / 2 + nx * off, cy = (A.y + B.y) / 2 + ny * off;
      const F = S.get(r.from), T = S.get(r.to);
      const d = `M${F.x.toFixed(1)} ${F.y.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${T.x.toFixed(1)} ${T.y.toFixed(1)}`;
      const lr = F.x <= T.x ? d : `M${T.x.toFixed(1)} ${T.y.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${F.x.toFixed(1)} ${F.y.toFixed(1)}`;
      geo.set(r.id, {d, lr, len:L, q:[F.x, F.y, cx, cy, T.x, T.y]});
    });
  });
  return geo;
}

function focusSet(){
  const f = hover || sel; if (!f) return null;
  if (f.type === "r"){ const r = R.get(f.id); return r ? {routes:new Set([r.id]), towns:new Set([r.from, r.to])} : null; }
  const rs = routesOf(f.id);
  return {routes:new Set(rs.map(r => r.id)), towns:new Set([f.id, ...rs.flatMap(r => [r.from, r.to])])};
}

function drawRoutes(){
  layerRoutes.textContent = ""; carts.length = 0;
  const geo = geometry();
  [...R.values()].forEach(r => {
    if (hidden.has(r.tool)) return;
    const g0 = geo.get(r.id); if (!g0) return;
    const tool = TOOLS[r.tool];
    const g = sv("g", {class:"tm-route", "data-id":r.id, tabindex:"0", role:"button", "aria-label":`${r.name}: ${S.get(r.from).name} to ${S.get(r.to).name} by ${tool.label}`}, layerRoutes);
    const pid = "tm-p-" + r.id.replace(/[^\w-]/g, "_"), lid = "tm-l-" + r.id.replace(/[^\w-]/g, "_");
    sv("path", {d:g0.d, class:"tm-road-edge"}, g);
    sv("path", {id:pid, d:g0.d, class:"tm-road", stroke:tool.color, "stroke-dasharray": r.status === "planned" ? "2 8" : r.status === "retired" || r.status === "none" ? "1 7" : tool.dash, opacity: r.status === "planned" ? .8 : r.status === "retired" || r.status === "none" ? .45 : 1}, g);
    if (r.status === "building") sv("path", {d:g0.d, class:"tm-build", "stroke-dasharray":"1 13"}, g);
    sv("path", {d:g0.d, class:"tm-hit"}, g);
    sv("path", {id:lid, d:g0.lr, fill:"none", stroke:"none"}, g);
    if (showNames){
      const t = sv("text", {class:"tm-rname", dy:"-5"}, g);
      const tp = sv("textPath", {href:"#" + lid, startOffset:"50%", "text-anchor":"middle"}, t);
      tp.textContent = r.name;
    }
    if (r.status !== "planned" && r.status !== "retired" && r.status !== "none"){
      const dur = Math.max(5, g0.len / (r.status === "building" ? 26 : 48));
      /* carts are painted on a canvas above the map (see cartLoop), so the map itself never has to repaint for them */
      const cart = (rev, delay) => carts.push({id:r.id, g, q:g0.q, dur, delay, rev, color:tool.color});
      cart(false, (r.name.length * 1.7) % dur);
      if (r.flow === "two") cart(true, (r.name.length * 3.1 + dur / 2) % dur);
    }
    g.addEventListener("mouseenter", ev => { hover = {type:"r", id:r.id}; restyle(); showTip(ev, routeTip(r)); });
    g.addEventListener("mousemove", moveTip);
    g.addEventListener("mouseleave", () => { hover = null; restyle(); hideTip(); });
    const pick = ev => { ev.preventDefault(); ev.stopPropagation(); hideTip(); select({type:"r", id:r.id}); };
    g.addEventListener("click", pick);
    g.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " ") pick(ev); });
  });
}

function townSize(s){ const n = routesOf(s.id).length; return s.kind === "capital" ? 3 : n >= 6 ? 3 : n >= 3 ? 2 : 1; }
function drawCastle(g){
  sv("ellipse", {cx:0, cy:14, rx:58, ry:12, fill:"#2b1d08", opacity:".22"}, g);
  sv("rect", {x:-40, y:-20, width:80, height:32, fill:"#d8d0bb", stroke:"#4a3d2a", "stroke-width":"2"}, g);
  for (let i = 0; i < 5; i++) sv("rect", {x:-40 + i*17, y:-27, width:9, height:8, fill:"#d8d0bb", stroke:"#4a3d2a", "stroke-width":"1.6"}, g);
  [[-48, -42], [32, -42]].forEach(([x, y]) => { sv("rect", {x, y, width:16, height:54, fill:"#cbc2aa", stroke:"#4a3d2a", "stroke-width":"2"}, g); sv("path", {d:`M${x-3} ${y} L${x+8} ${y-18} L${x+19} ${y} Z`, fill:"#9e3b33", stroke:"#4a3d2a", "stroke-width":"1.6"}, g); });
  sv("rect", {x:-11, y:-58, width:22, height:40, fill:"#cbc2aa", stroke:"#4a3d2a", "stroke-width":"2"}, g);
  sv("path", {d:"M-15 -58 L0 -80 L15 -58 Z", fill:"#9e3b33", stroke:"#4a3d2a", "stroke-width":"1.6"}, g);
  sv("path", {d:"M0 -80 V-98", stroke:"#4a3d2a", "stroke-width":"1.6"}, g);
  sv("path", {class:"tm-flag", d:"M0 -98 L18 -93 L0 -87 Z", fill:"#1f7fc4"}, g);
  sv("path", {d:"M-9 12 V-4 a9 9 0 0 1 18 0 V12 Z", fill:"#4a3420", stroke:"#2b1d08", "stroke-width":"1.5"}, g);
  sv("rect", {x:-4, y:-48, width:8, height:11, rx:4, fill:"#3a2a17"}, g);
}
function drawTown(g, size){
  const spots = [[[0, 0]], [[-12, 2], [12, -2]], [[-18, 4], [0, -6], [18, 4]]][size - 1];
  sv("ellipse", {cx:0, cy:12, rx:18 + size*10, ry:8, fill:"#2b1d08", opacity:".2"}, g);
  sv("ellipse", {cx:0, cy:6, rx:16 + size*10, ry:12, fill:"none", stroke:"#8a6a3a", "stroke-width":"2", "stroke-dasharray":"3 2"}, g);
  spots.forEach(([x, y], i) => {
    const w = 18, h = 14;
    sv("rect", {x:x - w/2, y:y - h + 6, width:w, height:h, fill:["#e8dcc0", "#dccfae", "#efe3c8"][i % 3], stroke:"#4a3d2a", "stroke-width":"1.5"}, g);
    sv("path", {d:`M${x - w/2 - 3} ${y - h + 7} L${x} ${y - h - 8} L${x + w/2 + 3} ${y - h + 7} Z`, fill:["#a8423a", "#8a5a2e", "#6a4a8a"][i % 3], stroke:"#4a3d2a", "stroke-width":"1.4"}, g);
    sv("rect", {x:x - 3, y:y - 2, width:6, height:8, fill:"#4a3420"}, g);
  });
}
function drawMine(g, size){
  const k = .8 + size * .15;
  sv("ellipse", {cx:0, cy:12, rx:34*k, ry:8, fill:"#2b1d08", opacity:".2"}, g);
  sv("path", {d:`M${-34*k} 10 Q ${-20*k} ${-30*k} 0 ${-32*k} Q ${22*k} ${-30*k} ${34*k} 10 Z`, fill:"#9a7b50", stroke:"#4a3d2a", "stroke-width":"1.8"}, g);
  sv("path", {d:`M${-11*k} 10 V${-6*k} a${11*k} ${11*k} 0 0 1 ${22*k} 0 V10 Z`, fill:"#2b1d08"}, g);
  sv("path", {d:`M${-13*k} 10 V${-7*k} M${13*k} 10 V${-7*k} M${-14*k} ${-8*k} H${14*k}`, stroke:"#6b4a26", "stroke-width":"3.2", "stroke-linecap":"round"}, g);
  /* a cart of ore at the entrance */
  sv("path", {d:`M${18*k} 2 h16 l-3 8 h-10 Z`, fill:"#6b4a26", stroke:"#2b1d08", "stroke-width":"1"}, g);
  [[22, 0], [27, -1], [31, 1]].forEach(([x, y]) => sv("circle", {cx:x*k + (1-k)*8, cy:y, r:2.6, fill:"#f0c25a", stroke:"#7a4f12", "stroke-width":".7"}, g));
  sv("circle", {cx:24*k + 2, cy:11, r:1.8, fill:"#2b1d08"}, g); sv("circle", {cx:31*k + 2, cy:11, r:1.8, fill:"#2b1d08"}, g);
}

function drawTowns(){
  layerTowns.textContent = ""; layerLabels.textContent = "";
  [...S.values()].sort((a, b) => a.y - b.y).forEach(s => {
    const g = sv("g", {class:"tm-town" + (canEdit() ? " movable" : ""), transform:`translate(${s.x} ${s.y})`, tabindex:"0", role:"button", "aria-label":`${s.name}, ${KINDS[s.kind] || s.kind}`, "data-id":s.id}, layerTowns);
    sv("circle", {r: s.kind === "capital" ? 70 : 44, cy:-6, class:"tm-halo"}, g);
    sv("circle", {r: s.kind === "capital" ? 62 : 38, cy:-6, fill:"transparent"}, g);
    const size = townSize(s);
    if (s.kind === "capital") drawCastle(g); else if (s.kind === "source") drawMine(g, size); else drawTown(g, size);
    const nt = tablesOf(s.id).length;
    if (nt){
      /* a little scroll marks a mine that has tables on file */
      const bx = s.kind === "capital" ? -58 : -38, by = -30, bg = sv("g", {class:"tm-scroll", transform:`translate(${bx} ${by})`}, g);
      sv("rect", {x:-9, y:-7, width:18, height:14, rx:2, fill:"#f6ecd2", stroke:"#7d6a45", "stroke-width":"1.3"}, bg);
      sv("path", {d:"M-5 -3 H5 M-5 0 H5 M-5 3 H2", stroke:"#8a6a3a", "stroke-width":"1"}, bg);
      sv("circle", {cx:9, cy:-7, r:6.5, fill:"#a8323e", stroke:"#f6ecd2", "stroke-width":"1.2"}, bg);
      const tx = sv("text", {x:9, y:-4.2, "text-anchor":"middle", class:"tm-badge"}, bg); tx.textContent = String(nt);
    }
    /* name ribbon */
    const ly = s.kind === "capital" ? 34 : 28, w = Math.max(60, s.name.length * 7.6 + 22);
    const lg = sv("g", {class:"tm-ribbon", "data-id":s.id, transform:`translate(${s.x} ${s.y + ly})`}, layerLabels);
    sv("path", {d:`M${-w/2 - 8} 2 l8 -9 v18 Z M${w/2 + 8} 2 l-8 -9 v18 Z`, fill:"#c9b07a", stroke:"#7d6a45", "stroke-width":"1"}, lg);
    sv("rect", {x:-w/2, y:-9, width:w, height:20, rx:3, fill:"#f6ecd2", stroke:"#7d6a45", "stroke-width":"1.4"}, lg);
    const t = sv("text", {y:5.5, "text-anchor":"middle", class: s.kind === "capital" ? "tm-sname cap" : "tm-sname"}, lg); t.textContent = s.name;
    g.addEventListener("mouseenter", ev => { if (drag) return; hover = {type:"s", id:s.id}; restyle(); showTip(ev, townTip(s)); });
    g.addEventListener("mousemove", moveTip);
    g.addEventListener("mouseleave", () => { if (drag) return; hover = null; restyle(); hideTip(); });
    g.addEventListener("pointerdown", ev => startDrag(ev, s, g));
    g.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " "){ ev.preventDefault(); townActivated(s.id); } });
  });
}
/* hover and selection only change classes, so the elements under the pointer stay put */
function restyle(){
  const fs = focusSet();
  layerRoutes.querySelectorAll(".tm-route").forEach(e => { const id = e.getAttribute("data-id"); e.classList.toggle("dim", !!fs && !fs.routes.has(id)); e.classList.toggle("on", !!sel && sel.type === "r" && sel.id === id); });
  layerTowns.querySelectorAll(".tm-town").forEach(e => { const id = e.getAttribute("data-id"); e.classList.toggle("dim", !!fs && !fs.towns.has(id)); e.classList.toggle("on", !!sel && sel.type === "s" && sel.id === id); });
  layerLabels.querySelectorAll(".tm-ribbon").forEach(e => { const id = e.getAttribute("data-id"); e.classList.toggle("dim", !!fs && !fs.towns.has(id)); });
}
function renderMap(){ if (!layerRoutes) drawBackdrop(); drawRoutes(); drawTowns(); restyle(); }

/* ---------- dragging a settlement to a new spot ---------- */
let drag = null;
function toMap(ev){ const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY; return pt.matrixTransform(svg.getScreenCTM().inverse()); }
function startDrag(ev, s, g){
  if (ev.button !== 0) return;
  ev.stopPropagation();
  const p = toMap(ev);
  drag = {id:s.id, dx:p.x - s.x, dy:p.y - s.y, sx:ev.clientX, sy:ev.clientY, moved:false, ox:s.x, oy:s.y};
  hideTip();
  try{ g.setPointerCapture(ev.pointerId); }catch(e){}
  const move = e => {
    if (!drag) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 5) return;
    if (!canEdit() || pick) return;
    drag.moved = true;
    const q = toMap(e), t = S.get(drag.id); if (!t) return;
    t.x = Math.round(Math.min(MW - 60, Math.max(60, q.x - drag.dx))); t.y = Math.round(Math.min(MH - 50, Math.max(70, q.y - drag.dy)));
    g.setAttribute("transform", `translate(${t.x} ${t.y})`);
    const rb = layerLabels.querySelector(`.tm-ribbon[data-id="${t.id}"]`); if (rb) rb.setAttribute("transform", `translate(${t.x} ${t.y + (t.kind === "capital" ? 34 : 28)})`);
    if (!drag.raf) drag.raf = requestAnimationFrame(() => { if (drag){ drag.raf = 0; drawRoutes(); restyle(); } });
  };
  const up = async () => {
    g.removeEventListener("pointermove", move); g.removeEventListener("pointerup", up); g.removeEventListener("pointercancel", up);
    const d = drag; drag = null;
    if (!d) return;
    if (!d.moved){ townActivated(d.id); return; }
    const t = S.get(d.id); if (!t) return;
    const ok = await save(d.id, settlementDoc(t));
    if (!ok){ t.x = d.ox; t.y = d.oy; renderMap(); }
  };
  g.addEventListener("pointermove", move); g.addEventListener("pointerup", up); g.addEventListener("pointercancel", up);
}


/* ---------- carts: one canvas, one animation loop ---------- */
const carts = [];
const cartCanvas = document.createElement("canvas"); cartCanvas.className = "tm-carts"; cartCanvas.setAttribute("aria-hidden", "true");
$("trade-frame").insertBefore(cartCanvas, $("trade-frame").querySelector(".tm-corner"));
const cctx = cartCanvas.getContext("2d");
let cartRaf = 0, lastPaint = 0, frameVisible = true;
function qpt(q, t){ const u = 1 - t; return [u*u*q[0] + 2*u*t*q[2] + t*t*q[4], u*u*q[1] + 2*u*t*q[3] + t*t*q[5]]; }
function qdir(q, t){ const u = 1 - t; return Math.atan2(2*u*(q[3] - q[1]) + 2*t*(q[5] - q[3]), 2*u*(q[2] - q[0]) + 2*t*(q[4] - q[2])); }
function paintCarts(now){
  const fr = $("trade-frame"), rect = fr.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
  const W = Math.round(rect.width * dpr), H = Math.round(rect.height * dpr);
  if (cartCanvas.width !== W || cartCanvas.height !== H){ cartCanvas.width = W; cartCanvas.height = H; }
  cctx.setTransform(1, 0, 0, 1, 0, 0); cctx.clearRect(0, 0, W, H);
  const m = svg.getScreenCTM(); if (!m || !carts.length) return;
  const k = Math.hypot(m.a, m.b), size = Math.min(2.2, Math.max(.45, k));   /* cart scale follows the zoom, within limits */
  const ox = rect.left, oy = rect.top, sec = now / 1000;
  for (const c of carts){
    let t = REDUCED ? (c.rev ? .38 : .62) : ((sec + c.delay) / c.dur) % 1; if (c.rev && !REDUCED) t = 1 - t;
    const [x, y] = qpt(c.q, t);
    const sx = (m.a * x + m.c * y + m.e - ox) * dpr, sy = (m.b * x + m.d * y + m.f - oy) * dpr;
    if (sx < -30 || sy < -30 || sx > W + 30 || sy > H + 30) continue;
    const ang = qdir(c.q, t) + (c.rev ? Math.PI : 0);
    cctx.setTransform(size * dpr, 0, 0, size * dpr, sx, sy); cctx.rotate(ang);
    cctx.globalAlpha = c.g.classList.contains("dim") ? .22 : 1;
    cctx.fillStyle = c.color; cctx.strokeStyle = "#2a1d0c"; cctx.lineWidth = .8;
    cctx.beginPath(); cctx.rect(-6, -4, 12, 7); cctx.fill(); cctx.stroke();
    cctx.fillStyle = "#f0c25a"; cctx.lineWidth = .6; cctx.beginPath(); cctx.rect(-4.5, -7, 9, 3.5); cctx.fill(); cctx.stroke();
    cctx.fillStyle = "#2a1d0c"; cctx.beginPath(); cctx.arc(-3.5, 4, 2, 0, 6.283); cctx.arc(3.5, 4, 2, 0, 6.283); cctx.fill();
  }
  cctx.globalAlpha = 1;
}
function cartLoop(now){
  cartRaf = 0;
  if ($("tab-trade").hidden || document.hidden || !frameVisible) return;   /* asleep until the map is on screen again */
  if (now - lastPaint >= 1000 / 40){ lastPaint = now; paintCarts(now); }
  cartRaf = requestAnimationFrame(cartLoop);
}
function wakeCarts(){ if (!cartRaf) cartRaf = requestAnimationFrame(cartLoop); }
new IntersectionObserver(es => { frameVisible = es.some(e => e.isIntersecting); if (frameVisible) wakeCarts(); }).observe($("trade-frame"));
document.addEventListener("visibilitychange", wakeCarts);
$("tabbtn-trade").addEventListener("click", () => setTimeout(wakeCarts, 30));
wakeCarts();

/* ---------- zoom and pan: the viewBox is the camera ---------- */
const frame = $("trade-frame");
const VIEW_KEY = "settlers-trade-view";
let view = null;
const MIN_W = 320, MAX_W = MW * 1.15;
function boxSize(){ const r = frame.getBoundingClientRect(); return {w:r.width, h:r.height}; }
function applyView(){ if (view) svg.setAttribute("viewBox", `${view.x.toFixed(1)} ${view.y.toFixed(1)} ${view.w.toFixed(1)} ${view.h.toFixed(1)}`); }
function saveView(){ try{ if (view) localStorage.setItem(VIEW_KEY, JSON.stringify(view)); }catch(e){} }
function clampView(){
  const {w, h} = boxSize(); if (!w || !h) return;
  view.w = Math.min(MAX_W, Math.max(MIN_W, view.w)); view.h = view.w * h / w;
  const padX = view.w * .4, padY = view.h * .4;
  view.x = Math.min(MW - view.w + padX, Math.max(-padX, view.x)); view.y = Math.min(MH - view.h + padY, Math.max(-padY, view.y));
}
function fitView(){
  const {w, h} = boxSize(); if (!w || !h) return false;
  const pts = [...S.values()]; if (!pts.length) pts.push({x:MW/2, y:MH/2});
  let x1 = Math.min(...pts.map(p => p.x)) - 150, x2 = Math.max(...pts.map(p => p.x)) + 150;
  let y1 = Math.min(...pts.map(p => p.y)) - 140, y2 = Math.max(...pts.map(p => p.y)) + 90;
  let bw = x2 - x1, bh = y2 - y1; const ar = w / h;
  if (bw / bh > ar){ const nh = bw / ar; y1 -= (nh - bh) / 2; bh = nh; } else { const nw = bh * ar; x1 -= (nw - bw) / 2; bw = nw; }
  view = {x:x1, y:y1, w:bw, h:bh}; clampView(); applyView(); saveView(); return true;
}
function zoomAt(f, cx, cy){
  if (!view) return;
  const nw = Math.min(MAX_W, Math.max(MIN_W, view.w / f)), k = nw / view.w;
  view.x = cx - (cx - view.x) * k; view.y = cy - (cy - view.y) * k; view.w = nw; view.h *= k;
  clampView(); applyView(); saveView();
}
function zoomCenter(f){ if (view) zoomAt(f, view.x + view.w / 2, view.y + view.h / 2); }
function showPoint(x, y){
  if (!view) return;
  if (x > view.x + 80 && x < view.x + view.w - 80 && y > view.y + 80 && y < view.y + view.h - 80) return;
  view.x = x - view.w / 2; view.y = y - view.h / 2; clampView(); applyView(); saveView();
}
let lastSize = null;
new ResizeObserver(() => {
  const {w, h} = boxSize(); if (!w || !h) return;
  if (!view){
    try{ const v = JSON.parse(localStorage.getItem(VIEW_KEY) || "null"); if (v && v.w > 0) view = v; }catch(e){}
    if (!view){ fitView(); lastSize = {w, h}; return; }
  } else if (lastSize){ view.w *= w / lastSize.w; }
  lastSize = {w, h}; clampView(); applyView();
}).observe(frame);
$("tm-zin").addEventListener("click", () => zoomCenter(1.35));
$("tm-zout").addEventListener("click", () => zoomCenter(1 / 1.35));
$("tm-zfit").addEventListener("click", () => fitView());
svg.addEventListener("wheel", ev => {
  if (!ev.ctrlKey && !ev.metaKey){ hint(); return; }
  ev.preventDefault();
  const p = toMap(ev); zoomAt(Math.exp(-ev.deltaY * .0025), p.x, p.y);
}, {passive:false});
let hintT = 0;
function hint(){ const h = $("tm-hint"); h.classList.add("show"); clearTimeout(hintT); hintT = setTimeout(() => h.classList.remove("show"), 1400); }
/* drag empty ground (or a road) to pan; two fingers to pinch-zoom */
const pts = new Map(); let pan = null, pinch = null, swallowClick = false;
svg.addEventListener("pointerdown", ev => {
  if (ev.button !== 0 || !view) return;
  swallowClick = false;
  pts.set(ev.pointerId, {x:ev.clientX, y:ev.clientY});
  if (pts.size === 2){
    const [a, b] = [...pts.values()];
    pinch = {d:Math.hypot(a.x - b.x, a.y - b.y), w:view.w}; pan = null; return;
  }
  pan = {sx:ev.clientX, sy:ev.clientY, vx:view.x, vy:view.y, moved:false, id:ev.pointerId};
});
svg.addEventListener("pointermove", ev => {
  if (!pts.has(ev.pointerId)) return;
  pts.set(ev.pointerId, {x:ev.clientX, y:ev.clientY});
  if (pinch && pts.size === 2){
    const [a, b] = [...pts.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
    const mid = toMap({clientX:(a.x + b.x) / 2, clientY:(a.y + b.y) / 2});
    zoomAt((pinch.w / view.w) * (d / pinch.d), mid.x, mid.y); swallowClick = true; return;
  }
  if (!pan) return;
  const dx = ev.clientX - pan.sx, dy = ev.clientY - pan.sy;
  if (!pan.moved && Math.hypot(dx, dy) < 5) return;
  if (!pan.moved){ pan.moved = true; svg.classList.add("panning"); hideTip(); try{ svg.setPointerCapture(pan.id); }catch(e){} }
  const k = view.w / boxSize().w;
  view.x = pan.vx - dx * k; view.y = pan.vy - dy * k; clampView(); applyView();
});
const endPointer = ev => {
  pts.delete(ev.pointerId);
  if (pts.size < 2) pinch = null;
  if (pan && pan.id === ev.pointerId){ if (pan.moved){ swallowClick = true; saveView(); } pan = null; svg.classList.remove("panning"); }
};
svg.addEventListener("pointerup", endPointer); svg.addEventListener("pointercancel", endPointer);
svg.addEventListener("click", ev => { if (swallowClick){ swallowClick = false; ev.stopPropagation(); ev.preventDefault(); } }, true);

/* ---------- tooltip ---------- */
const tip = mk("div", "tm-tip"); tip.hidden = true; document.body.appendChild(tip);
function routeTip(r){ const t = TOOLS[r.tool]; return [r.name, `${S.get(r.from).name} ${r.flow === "two" ? "⇄" : "→"} ${S.get(r.to).name}`, `${t.label} · ${STATUS[r.status] || r.status}`]; }
function townTip(s){ const n = routesOf(s.id).length, t = tablesOf(s.id).length; return [s.name, s.blurb || KINDS[s.kind], `${n} trade route${n === 1 ? "" : "s"}${t ? ` · ${t} table${t === 1 ? "" : "s"} on file` : ""}${canEdit() ? " · drag to move" : ""}`]; }
function showTip(ev, lines){ tip.textContent = ""; lines.forEach((l, i) => { if (l) tip.appendChild(mk(i ? "div" : "b", null, l)); }); tip.hidden = false; moveTip(ev); }
function moveTip(ev){ if (tip.hidden) return; const w = tip.offsetWidth, h = tip.offsetHeight; let x = ev.clientX + 14, y = ev.clientY + 14; if (x + w > innerWidth - 8) x = ev.clientX - w - 14; if (y + h > innerHeight - 8) y = ev.clientY - h - 14; tip.style.left = x + "px"; tip.style.top = y + "px"; }
function hideTip(){ tip.hidden = true; }

/* ---------- the ledger panel ---------- */
const panel = $("trade-panel");
function select(s){ sel = s; mode = "view"; draft = null; restyle(); renderPanel(); }
function btn(label, cls, fn, disabled){ const b = mk("button", cls, label); b.type = "button"; b.disabled = !!disabled; b.addEventListener("click", fn); return b; }
function field(label, input){ const l = mk("label", "tm-field"); l.append(mk("span", null, label), input); return l; }
function selectEl(opts, value){ const s = mk("select"); opts.forEach(([v, t]) => { const o = mk("option", null, t); o.value = v; s.appendChild(o); }); if (value != null) s.value = value; return s; }
function textEl(value, ph, max){ const i = mk("input"); i.type = "text"; i.value = value || ""; i.placeholder = ph || ""; i.maxLength = max || 80; return i; }
/* plain text with any web addresses turned into links that open in a new tab */
function linkText(text){
  const p = mk("p", "tm-p"); let last = 0; const re = /https?:\/\/[^\s<>"]+[^\s<>".,;:)]/g; let m;
  while ((m = re.exec(text))){
    if (m.index > last) p.appendChild(document.createTextNode(text.slice(last, m.index)));
    const a = mk("a", "tm-url", m[0].replace(/^https?:\/\//, "").replace(/\?.*$/, "")); a.href = m[0]; a.target = "_blank"; a.rel = "noopener noreferrer"; a.title = m[0];
    p.appendChild(a); last = m.index + m[0].length;
  }
  if (last < text.length) p.appendChild(document.createTextNode(text.slice(last)));
  return p;
}
const byName = (a, b) => a.localeCompare(b, undefined, {sensitivity:"base", numeric:true});
function townOpts(){ return [...S.values()].sort((a, b) => byName(a.name, b.name)).map(s => [s.id, s.name]); }

function renderPanel(){
  panel.textContent = "";
  const col1 = mk("div", "tm-col tm-col1"), col3 = mk("div", "tm-col tm-col3");
  const head = mk("div", "tm-phead");
  head.append(mk("h3", null, "Trade Ledger"), mk("div", "tm-count", `${S.size} settlements · ${R.size} trade routes`));
  col1.appendChild(head);
  col1.appendChild(searchBox());
  const acts = mk("div", "tm-acts tm-stack");
  acts.append(
    btn("Found a settlement", "tm-btn", () => { mode = "newS"; draft = {name:"", kind:"system", blurb:""}; renderPanel(); }, !canEdit()),
    btn("Open a trade route", "tm-btn", () => { mode = "newR"; draft = {name:"", from: sel && sel.type === "s" ? sel.id : "sf", to:"sf", tool:"mulesoft", flow:"one", status:"live", note:""}; if (draft.from === "sf") draft.to = [...S.keys()].find(k => k !== "sf") || "sf"; renderPanel(); }, !canEdit())
  );
  const clip = readClip();
  if (clip && canEdit()){
    const pb = btn("Paste " + clip.s.name, "tm-btn tm-paste-btn", () => pasteSettlement());
    pb.title = "Paste a copy of " + clip.s.name + (clip.tables.length ? ` with its ${clip.tables.length} table${clip.tables.length === 1 ? "" : "s"}` : "") + " (Ctrl+V)";
    acts.appendChild(pb);
  }
  col1.appendChild(acts);
  const body = mk("div", "tm-pbody");
  legend(col3);
  panel.append(col1, body, col3);
  if (mode === "newS" || mode === "editS") return settlementForm(body);
  if (mode === "newT" || mode === "editT") return tableForm(body);
  if (mode === "newR" || mode === "editR") return routeForm(body);
  if (sel && sel.type === "s" && S.has(sel.id)) return settlementCard(body, S.get(sel.id));
  if (sel && sel.type === "r" && R.has(sel.id)) return routeCard(body, R.get(sel.id));
  helpCard(body);
}
function helpCard(body){
  body.appendChild(mk("h4", null, "Reading the map"));
  body.appendChild(mk("p", "tm-p", "Zoom with the + and − buttons, Ctrl + scroll, or a pinch. Drag empty ground to pan. Fit brings everything back into view."));
  body.appendChild(mk("p", "tm-p", "Search fields (on the left) looks through every table on the map at once. Type a word like major or email to list each source field, where it lands and the destination object and field."));
  const ul = mk("ul", "tm-help");
  [["Castle and towns", "the systems we run or send data to"], ["Mines", "sources of record where data comes from"], ["Roads", "integrations, colored by the tool that carries them"], ["Carts", "travel the way data flows; two carts mean it flows both ways"], ["Gravel roads", "integrations still being built; dotted roads are only planned, and faint ones are retired or not integrating"]]
    .forEach(([a, b]) => { const li = mk("li"); li.append(mk("b", null, a + ": "), document.createTextNode(b)); ul.appendChild(li); });
  body.appendChild(ul);
  body.appendChild(mk("h4", null, "Changing the map"));
  body.appendChild(mk("p", "tm-p", canEdit()
    ? "Click a settlement or road to see its details, then Edit or remove it. Drag a settlement to move it. Copy one (Ctrl+C or its Copy button) and paste it (Ctrl+V) to make a duplicate, tables included. Use the buttons on the left to add new ones. Everyone sees your changes."
    : db ? "You have view-only access, so you can look but not change the map." : "This copy can't save changes. Open the shared page to edit the map."));
  body.appendChild(mk("p", "tm-note", "The starting map was drawn from your Asana tasks. Tools and directions are best guesses, so correct any that are wrong."));
}
function legend(body){
  body.appendChild(mk("h4", null, "Traders' guilds"));
  const lg = mk("div", "tm-legend");
  Object.entries(TOOLS).forEach(([k, t]) => {
    const n = [...R.values()].filter(r => r.tool === k).length;
    const b = mk("button", "tm-chip"); b.type = "button"; b.setAttribute("aria-pressed", String(!hidden.has(k)));
    const sw = mk("i"); sw.style.background = t.color; if (t.dash) sw.style.backgroundImage = "repeating-linear-gradient(90deg, transparent 0 4px, #f6ecd2 4px 7px)";
    b.append(sw, mk("span", null, t.label), mk("em", null, String(n)));
    b.title = hidden.has(k) ? "Show " + t.label + " routes" : "Hide " + t.label + " routes";
    b.addEventListener("click", () => { if (hidden.has(k)) hidden.delete(k); else hidden.add(k); renderMap(); renderPanel(); });
    lg.appendChild(b);
  });
  body.appendChild(lg);
  const nm = mk("label", "tm-toggle"); const cb = mk("input"); cb.type = "checkbox"; cb.checked = showNames;
  cb.addEventListener("change", () => { showNames = cb.checked; try{ localStorage.setItem("settlers-trade-names", showNames ? "1" : "0"); }catch(e){} renderMap(); });
  nm.append(cb, mk("span", null, "Show route names on the map")); body.appendChild(nm);
}
function settlementCard(body, s){
  body.appendChild(mk("div", "tm-kicker", KINDS[s.kind] || s.kind));
  body.appendChild(mk("h4", "tm-name", s.name));
  if (s.blurb) body.appendChild(linkText(s.blurb));
  const rs = routesOf(s.id).sort((a, b) => byName(a.name, b.name));
  const ts = tablesOf(s.id);
  tableSection(body, s, ts);
  body.appendChild(mk("h4", null, "Trade routes"));
  body.appendChild(mk("div", "tm-sub", rs.length ? `${rs.length} trade route${rs.length === 1 ? "" : "s"}` : "No trade routes yet"));
  const ul = mk("ul", "tm-list");
  rs.forEach(r => {
    const other = S.get(r.from === s.id ? r.to : r.from), arrow = r.flow === "two" ? "⇄" : r.from === s.id ? "→" : "←";
    const li = mk("li"); const b = mk("button", "tm-link"); b.type = "button";
    const sw = mk("i"); sw.style.background = TOOLS[r.tool].color;
    b.append(sw, mk("span", null, r.name), mk("em", null, `${arrow} ${other.name}`));
    b.addEventListener("click", () => select({type:"r", id:r.id}));
    li.appendChild(b); ul.appendChild(li);
  });
  body.appendChild(ul);
  if (mode === "razeS") return razeBox(body, `Raze ${s.name}?`, [rs.length ? `Its ${rs.length} trade route${rs.length === 1 ? "" : "s"} will close too.` : "", ts.length ? `Its ${ts.length} table${ts.length === 1 ? "" : "s"} will be thrown out.` : ""].filter(Boolean).join(" "), async () => {
    const ok = await removeItems([s.id, ...rs.map(r => r.id), ...ts.map(t => t.id)]);
    if (ok){ sfx("revoke"); sel = null; mode = "view"; renderMap(); renderPanel(); }
  });
  const acts = mk("div", "tm-acts");
  const cp = btn("Copy", "tm-btn", () => copySettlement(s.id)); cp.title = "Copy this settlement" + (ts.length ? " and its tables" : "") + " (Ctrl+C), then paste it with Ctrl+V or the Paste button";
  acts.append(cp);
  acts.append(btn("Edit", "tm-btn", () => { mode = "editS"; draft = Object.assign({}, s); renderPanel(); }, !canEdit()),
    btn("Open a route from here", "tm-btn", () => { mode = "newR"; draft = {name:"", from:s.id, to: s.id === "sf" ? ([...S.keys()].find(k => k !== "sf")) : "sf", tool:"mulesoft", flow:"one", status:"live", note:""}; renderPanel(); }, !canEdit()),
    btn("Raze", "tm-btn danger", () => { mode = "razeS"; renderPanel(); }, !canEdit()),
    btn("Back", "tm-btn ghost", () => select(null)));
  body.appendChild(acts);
}
function routeCard(body, r){
  const t = TOOLS[r.tool];
  const k = mk("div", "tm-kicker"); const sw = mk("i"); sw.style.background = t.color; k.append(sw, document.createTextNode(`${t.label} · ${STATUS[r.status] || r.status}`));
  body.appendChild(k);
  body.appendChild(mk("h4", "tm-name", r.name));
  if (canEdit()) body.appendChild(endsEditor(r));
  else {
    const path = mk("div", "tm-path");
    const a = btn(S.get(r.from).name, "tm-link plain", () => select({type:"s", id:r.from}));
    const z = btn(S.get(r.to).name, "tm-link plain", () => select({type:"s", id:r.to}));
    path.append(a, mk("span", "tm-arrow", r.flow === "two" ? "⇄" : "→"), z);
    body.appendChild(path);
  }
  if (r.note) body.appendChild(linkText(r.note));
  if (mode === "razeR") return razeBox(body, `Close the ${r.name} route?`, "", async () => {
    const ok = await removeItems([r.id]);
    if (ok){ sfx("revoke"); sel = null; mode = "view"; renderMap(); renderPanel(); }
  });
  const acts = mk("div", "tm-acts");
  acts.append(btn("Edit", "tm-btn", () => { mode = "editR"; draft = Object.assign({}, r); renderPanel(); }, !canEdit()),
    btn("Close route", "tm-btn danger", () => { mode = "razeR"; renderPanel(); }, !canEdit()),
    btn("Back", "tm-btn ghost", () => select(null)));
  body.appendChild(acts);
}
/* change where a route starts or ends right from its card: pick from a list, or click a settlement on the map */
let pick = null;   /* {route, end:"from"|"to"} while choosing on the map */
function routeDoc(r){ return {t:"r", name:r.name, from:r.from, to:r.to, tool:r.tool, flow:r.flow, status:r.status, note:r.note || ""}; }
async function setEnd(r, end, sid){
  const cur = R.get(r.id); if (!cur || cur[end] === sid) return;
  const other = end === "to" ? cur.from : cur.to;
  if (sid === other){ note("A route needs two different settlements.", "err"); renderPanel(); return; }
  const next = Object.assign({}, cur, {[end]:sid});
  const ok = await save(r.id, routeDoc(next));
  if (ok){ sfx("chime"); sel = {type:"r", id:r.id}; mode = "view"; restyle(); renderPanel(); pulse(r.id); note(`${next.name} now runs ${S.get(next.from).name} ${next.flow === "two" ? "⇄" : "→"} ${S.get(next.to).name}.`, ""); }
}
function startPick(r, end){
  pick = {route:r.id, end}; svg.classList.add("picking"); hideTip();
  note(`Click the settlement ${r.name} should ${end === "to" ? "go to" : "start from"}. Press Esc to cancel.`, "");
  renderPanel();
}
function cancelPick(){ if (!pick) return; pick = null; svg.classList.remove("picking"); note("", ""); renderPanel(); }
document.addEventListener("keydown", ev => { if (ev.key === "Escape" && pick) cancelPick(); });
function townActivated(id){
  if (pick){ const p = pick, r = R.get(p.route); pick = null; svg.classList.remove("picking"); if (r) setEnd(r, p.end, id); return; }
  select({type:"s", id});
}
function endsEditor(r){
  const box = mk("div", "tm-ends");
  const row = (label, end) => {
    const line = mk("div", "tm-end");
    const s = selectEl(townOpts(), r[end]); s.setAttribute("aria-label", label + " settlement");
    s.addEventListener("change", () => setEnd(r, end, s.value));
    const picking = pick && pick.route === r.id && pick.end === end;
    const pb = btn(picking ? "Click a settlement…" : "Pick on map", "tm-btn ghost tm-mini" + (picking ? " active" : ""), () => picking ? cancelPick() : startPick(r, end));
    pb.title = picking ? "Cancel picking" : `Choose the ${label.toLowerCase()} settlement by clicking it on the map`;
    const go = btn("Show", "tm-btn ghost tm-mini", () => { const t = S.get(r[end]); if (t) showPoint(t.x, t.y); select({type:"s", id:r[end]}); });
    go.title = "Open this settlement";
    line.append(mk("span", "tm-endlbl", label), s, pb, go);
    return line;
  };
  const flip = btn(r.flow === "two" ? "⇄ Both Ways" : "↓ One Way", "tm-btn ghost tm-mini tm-flip", async () => {
    const cur = R.get(r.id); if (!cur) return;
    const next = Object.assign({}, cur, {flow: cur.flow === "two" ? "one" : "two"});
    if (await save(r.id, routeDoc(next))){ sfx("chime"); renderPanel(); }
  });
  flip.title = "Switch between one-way and both ways";
  const swap = btn("Swap ends", "tm-btn ghost tm-mini", async () => {
    const cur = R.get(r.id); if (!cur) return;
    if (await save(r.id, routeDoc(Object.assign({}, cur, {from:cur.to, to:cur.from})))){ sfx("chime"); renderPanel(); }
  });
  swap.title = "Reverse the direction data flows";
  const mid = mk("div", "tm-endmid"); mid.append(flip, swap);
  box.append(row("From", "from"), mid, row("To", "to"));
  return box;
}
function razeBox(body, q, extra, fn){
  const box = mk("div", "tm-raze");
  box.append(mk("b", null, q)); if (extra) box.append(mk("div", null, extra));
  const acts = mk("div", "tm-acts");
  const yes = btn("Yes, remove it", "tm-btn danger", async () => { yes.disabled = true; await fn(); yes.disabled = false; });
  acts.append(yes, btn("Keep it", "tm-btn ghost", () => { mode = "view"; renderPanel(); }));
  box.appendChild(acts); body.appendChild(box);
}
function settlementForm(body){
  const isNew = mode === "newS";
  body.appendChild(mk("h4", null, isNew ? "Found a settlement" : "Edit " + draft.name));
  const f = mk("form", "tm-form");
  const name = textEl(draft.name, "e.g. Canvas", 40), kind = selectEl(Object.entries(KINDS), draft.kind), blurb = textEl(draft.blurb, "What it is, in a few words", 90);
  f.append(field("Name", name), field("Kind", kind), field("Description", blurb));
  const msg = mk("div", "tm-msg");
  const acts = mk("div", "tm-acts");
  const go = mk("button", "tm-btn", isNew ? "Found it" : "Save"); go.type = "submit";
  acts.append(go, btn("Cancel", "tm-btn ghost", () => { mode = "view"; renderPanel(); }));
  f.append(msg, acts);
  f.addEventListener("submit", async ev => {
    ev.preventDefault();
    const nm = name.value.trim(); if (!nm){ msg.textContent = "Give the settlement a name."; name.focus(); return; }
    if ([...S.values()].some(s => s.name.toLowerCase() === nm.toLowerCase() && s.id !== draft.id)){ msg.textContent = "There's already a settlement with that name."; return; }
    go.disabled = true;
    const id = isNew ? "s-" + Math.random().toString(36).slice(2, 10) : draft.id;
    const spot = isNew ? freeSpot(kind.value) : {x:draft.x, y:draft.y};
    const ok = await save(id, {t:"s", v:2, name:nm, kind:kind.value, blurb:blurb.value.trim(), x:spot.x, y:spot.y});
    if (ok) showPoint(spot.x, spot.y);
    go.disabled = false;
    if (ok){ sfx(isNew ? "grant" : "chime"); select({type:"s", id}); pulse(id); }
  });
  body.appendChild(f); name.focus();
}
function routeForm(body){
  const isNew = mode === "newR";
  body.appendChild(mk("h4", null, isNew ? "Open a trade route" : "Edit " + draft.name));
  const f = mk("form", "tm-form");
  const name = textEl(draft.name, "e.g. Course Enrollment", 50);
  const from = selectEl(townOpts(), draft.from), to = selectEl(townOpts(), draft.to);
  const tool = selectEl(Object.entries(TOOLS).map(([k, t]) => [k, t.label]), draft.tool);
  const flow = selectEl([["two", "Both Ways (⇄)"], ["one", "One Way (From → To)"]], draft.flow);
  const status = selectEl(Object.entries(STATUS), draft.status);
  const note = textEl(draft.note, "Optional: what it carries, schedule, owner", 160);
  const pair = mk("div", "tm-pair"); pair.append(field("From", from), field("To", to));
  const pair2 = mk("div", "tm-pair"); pair2.append(field("Direction", flow), field("Status", status));
  f.append(field("Name", name), pair, field("Tool", tool), pair2, field("Notes", note));
  const msg = mk("div", "tm-msg");
  const acts = mk("div", "tm-acts");
  const go = mk("button", "tm-btn", isNew ? "Open the route" : "Save"); go.type = "submit";
  acts.append(go, btn("Cancel", "tm-btn ghost", () => { mode = "view"; renderPanel(); }));
  f.append(msg, acts);
  f.addEventListener("submit", async ev => {
    ev.preventDefault();
    const nm = name.value.trim(); if (!nm){ msg.textContent = "Give the route a name."; name.focus(); return; }
    if (from.value === to.value){ msg.textContent = "A route needs two different settlements."; return; }
    go.disabled = true;
    const id = isNew ? "r-" + Math.random().toString(36).slice(2, 10) : draft.id;
    const ok = await save(id, {t:"r", name:nm, from:from.value, to:to.value, tool:tool.value, flow:flow.value, status:status.value, note:note.value.trim()});
    go.disabled = false;
    if (ok){ sfx(isNew ? "grant" : "chime"); select({type:"r", id}); pulse(id); }
  });
  body.appendChild(f); name.focus();
}

/* ---------- tables kept at a mine: pasted from Excel, Sheets, a web page, SQL output, CSV or Markdown ---------- */
const MAX_TABLE_CHARS = 60000;
function parseTable(text){
  const raw = String(text || "").replace(/\r\n?/g, "\n").replace(/\n+$/, "");
  if (!raw.trim()) return [];
  const lines = raw.split("\n");
  let rows;
  if (lines.some(l => l.includes("\t"))) rows = lines.map(l => l.split("\t"));
  else if (lines.filter(l => l.trim()).every(l => /^\s*\|.*\|\s*$/.test(l))){
    rows = lines.filter(l => l.trim() && !/^\s*\|[\s:|-]+\|\s*$/.test(l)).map(l => l.trim().replace(/^\||\|$/g, "").split("|").map(c => c.trim()));
  } else rows = csvRows(raw);
  rows = rows.map(r => r.map(c => String(c).trim())).filter(r => r.some(c => c !== ""));
  const w = Math.max(0, ...rows.map(r => r.length));
  return rows.map(r => r.concat(Array(w - r.length).fill("")));
}
function csvRows(raw){
  const sep = (raw.split("\n")[0].match(/;/g) || []).length > (raw.split("\n")[0].match(/,/g) || []).length ? ";" : ",";
  const out = []; let row = [], cell = "", q = false;
  for (let i = 0; i < raw.length; i++){
    const ch = raw[i];
    if (q){ if (ch === '"'){ if (raw[i+1] === '"'){ cell += '"'; i++; } else q = false; } else cell += ch; }
    else if (ch === '"' && cell === "") q = true;
    else if (ch === sep){ row.push(cell); cell = ""; }
    else if (ch === "\n"){ row.push(cell); out.push(row); row = []; cell = ""; }
    else cell += ch;
  }
  row.push(cell); out.push(row);
  return out;
}
function htmlTableRows(html){
  try{
    const doc = new DOMParser().parseFromString(html, "text/html"), t = doc.querySelector("table"); if (!t) return null;
    return [...t.querySelectorAll("tr")].map(tr => [...tr.children].flatMap(td => { const v = td.textContent.replace(/\s+/g, " ").trim(); const span = Math.min(20, Number(td.getAttribute("colspan")) || 1); return [v].concat(Array(span - 1).fill("")); }));
  }catch(e){ return null; }
}
const toTSV = rows => rows.map(r => r.map(c => String(c).replace(/[\t\n]/g, " ")).join("\t")).join("\n");
const toCSV = rows => rows.map(r => r.map(c => /[",\n]/.test(c) ? '"' + String(c).replace(/"/g, '""') + '"' : c).join(",")).join("\r\n");
function shapeText(rows){ const w = rows[0] ? rows[0].length : 0; return `${rows.length} row${rows.length === 1 ? "" : "s"} × ${w} column${w === 1 ? "" : "s"}`; }

function tableSection(body, s, ts){
  body.appendChild(mk("h4", null, "Tables on file"));
  if (!ts.length) body.appendChild(mk("p", "tm-note", canEdit() ? "Paste a table here to keep it here for later reference: field lists, mappings, sample rows, codes." : "No tables kept here yet."));
  const ul = mk("ul", "tm-list tm-tables");
  ts.forEach(t => {
    const li = mk("li"); const b = mk("button", "tm-link"); b.type = "button";
    const ic = mk("i", "tm-ticon");
    const body0 = t.header === false ? t.rows : t.rows.slice(1);
    b.append(ic, mk("span", null, t.title || "Untitled table"), mk("em", null, `${body0.length} × ${(t.rows[0] || []).length}`));
    b.title = "Open " + (t.title || "this table");
    b.addEventListener("click", () => openTable(t));
    li.appendChild(b); ul.appendChild(li);
  });
  if (ts.length) body.appendChild(ul);
  if (canEdit()) body.appendChild(btn("Paste a table", "tm-btn", () => { mode = "newT"; draft = {mine:s.id, title:"", rows:[], header:true}; renderPanel(); }));
}
function tableForm(body){
  const isNew = mode === "newT", mine = S.get(draft.mine);
  body.appendChild(mk("div", "tm-kicker", mine ? mine.name : ""));
  body.appendChild(mk("h4", null, isNew ? "Paste a table" : "Edit " + (draft.title || "table")));
  const f = mk("form", "tm-form");
  const title = textEl(draft.title, "e.g. Employee fields from HANA", 80);
  const area = mk("textarea", "tm-paste"); area.rows = 8; area.spellcheck = false;
  area.placeholder = "Paste rows from Excel, Sheets, a web page or SQL results. CSV and Markdown tables work too.";
  area.value = draft.rows.length ? toTSV(draft.rows) : "";
  const hdr = mk("label", "tm-toggle"); const hcb = mk("input"); hcb.type = "checkbox"; hcb.checked = draft.header !== false; hdr.append(hcb, mk("span", null, "First row is the column headings"));
  const shape = mk("div", "tm-sub");
  const prev = mk("div", "tm-preview");
  const msg = mk("div", "tm-msg");
  let rows = draft.rows.slice();
  const refresh = () => {
    rows = parseTable(area.value);
    shape.textContent = rows.length ? shapeText(hcb.checked ? rows.slice(1) : rows).replace(/^/, hcb.checked ? "Headings + " : "") : "Nothing pasted yet.";
    prev.textContent = ""; if (rows.length) prev.appendChild(tableEl(rows.slice(0, 6), hcb.checked));
    const size = JSON.stringify(rows).length;
    msg.textContent = size > MAX_TABLE_CHARS ? `That's too big to keep (about ${Math.round(size/1000)}k characters, the limit is ${MAX_TABLE_CHARS/1000}k). Paste fewer rows or split it into two tables.` : "";
  };
  area.addEventListener("paste", ev => {
    const html = ev.clipboardData && ev.clipboardData.getData("text/html");
    const hr = html && /<table/i.test(html) ? htmlTableRows(html) : null;
    if (hr && hr.length){ ev.preventDefault(); area.value = toTSV(hr); refresh(); }
  });
  area.addEventListener("input", refresh); hcb.addEventListener("change", refresh);
  f.append(field("Title", title), field("Table", area), hdr, shape, prev, msg);
  const acts = mk("div", "tm-acts");
  const go = mk("button", "tm-btn", isNew ? "Keep it" : "Save"); go.type = "submit";
  acts.append(go, btn("Cancel", "tm-btn ghost", () => { mode = "view"; renderPanel(); }));
  f.appendChild(acts);
  f.addEventListener("submit", async ev => {
    ev.preventDefault(); refresh();
    if (!rows.length){ msg.textContent = "Paste a table first."; area.focus(); return; }
    if (JSON.stringify(rows).length > MAX_TABLE_CHARS){ area.focus(); return; }
    const nm = title.value.trim() || "Table " + (tablesOf(draft.mine).length + 1);
    go.disabled = true;
    const id = isNew ? "t-" + Math.random().toString(36).slice(2, 10) : draft.id;
    const ok = await save(id, {t:"tbl", mine:draft.mine, title:nm, rows, header:hcb.checked, createdAt: draft.createdAt || Date.now()});
    go.disabled = false;
    if (ok){ const m = draft.mine; sfx(isNew ? "grant" : "chime"); select({type:"s", id:m}); pulse(m); }
  });
  body.appendChild(f); (isNew ? area : title).focus();
  refresh();
}
function tableEl(rows, header, filter){
  const tb = mk("table", "tm-table");
  let start = 0;
  if (header && rows.length){ const th = mk("thead"), tr = mk("tr"); rows[0].forEach(c => tr.appendChild(mk("th", null, c))); th.appendChild(tr); tb.appendChild(th); start = 1; }
  const bd = mk("tbody"); let shown = 0;
  const f = (filter || "").toLowerCase();
  for (let i = start; i < rows.length; i++){
    if (f && !rows[i].some(c => c.toLowerCase().includes(f))) continue;
    const tr = mk("tr"); rows[i].forEach(c => tr.appendChild(mk("td", null, c))); bd.appendChild(tr); shown++;
  }
  tb.appendChild(bd); tb.dataset.shown = shown;
  return tb;
}

/* full-size reader for a kept table */
let modal = null;
function closeTable(){ if (modal){ modal.remove(); modal = null; document.removeEventListener("keydown", escClose); } }
function escClose(ev){ if (ev.key === "Escape") closeTable(); }
function openTable(t){
  closeTable(); hideTip();
  const mine = S.get(t.mine);
  modal = mk("div", "tm-modal"); modal.setAttribute("role", "dialog"); modal.setAttribute("aria-modal", "true"); modal.setAttribute("aria-label", t.title || "Table");
  const card = mk("div", "tm-mcard");
  const head = mk("div", "tm-mhead");
  const tt = mk("div"); tt.append(mk("div", "tm-kicker", (mine ? mine.name : "") + " · table on file"), mk("h3", null, t.title || "Untitled table"));
  head.append(tt, btn("Close", "tm-btn ghost", closeTable));
  const bar = mk("div", "tm-mbar");
  const q = textEl("", "Filter rows…", 60); q.className = "tm-filter";
  const count = mk("span", "tm-sub");
  const st = mk("span", "tm-msg");
  const copyB = btn("Copy", "tm-btn", async () => {
    try{ await navigator.clipboard.writeText(toTSV(t.rows)); st.textContent = "Copied. Paste it into Excel or Sheets."; st.style.color = "var(--muted)"; }
    catch(e){ st.textContent = "Your browser blocked copying. Use Download instead."; st.style.color = ""; }
  });
  const dlB = btn("Download CSV", "tm-btn", async () => {
    const name = ((mine ? mine.name + " - " : "") + (t.title || "table")).replace(/[\\/:*?"<>|]+/g, "-").slice(0, 120) + ".csv";
    const data = new Blob(["﻿" + toCSV(t.rows)], {type:"text/csv"});
    try{
      const dl = window.claude && window.claude.use ? await window.claude.use("downloads") : null;
      if (dl) await dl.save({filename:name, data});
      else { const u = URL.createObjectURL(data), a = mk("a"); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); }
    }catch(e){ if (!e || e.code !== "declined"){ st.textContent = "Couldn't save the file here."; st.style.color = ""; } }
  });
  bar.append(q, count, st, copyB, dlB);
  if (canEdit()){
    bar.append(btn("Edit", "tm-btn", () => { closeTable(); sel = {type:"s", id:t.mine}; mode = "editT"; draft = Object.assign({}, t, {rows:t.rows.slice()}); restyle(); renderPanel(); }));
    const del = btn("Remove", "tm-btn danger", async () => {
      if (del.dataset.armed !== "1"){ del.dataset.armed = "1"; del.textContent = "Click again to remove"; return; }
      del.disabled = true;
      const ok = await removeItems([t.id]);
      if (ok){ sfx("revoke"); closeTable(); sel = {type:"s", id:t.mine}; mode = "view"; renderMap(); renderPanel(); } else del.disabled = false;
    });
    bar.append(del);
  }
  const wrap = mk("div", "tm-twrap");
  const draw = () => { wrap.textContent = ""; const el = tableEl(t.rows, t.header !== false, q.value); wrap.appendChild(el); const total = t.rows.length - (t.header !== false ? 1 : 0); count.textContent = q.value ? `${el.dataset.shown} of ${total} rows` : `${total} rows`; };
  q.addEventListener("input", draw);
  card.append(head, bar, wrap); modal.appendChild(card);
  modal.addEventListener("click", ev => { if (ev.target === modal) closeTable(); });
  document.body.appendChild(modal); document.addEventListener("keydown", escClose);
  draw(); q.focus();
}
function freeSpot(kind){
  const c = kind === "source" ? {x:OX + 250, y:OY + 420} : kind === "capital" ? {x:OX + 600, y:OY + 400} : {x:OX + 950, y:OY + 420};
  for (let r = 0; r < 1400; r += 30){
    for (let a = 0; a < 360; a += 24){
      const x = Math.round(c.x + r * Math.cos(a * Math.PI / 180)), y = Math.round(c.y + r * .8 * Math.sin(a * Math.PI / 180));
      if (x < 90 || x > MW - 90 || y < 130 || y > MH - 80) continue;
      if ([...S.values()].every(s => Math.hypot(s.x - x, s.y - y) > 120)) return {x, y};
    }
  }
  return {x:c.x, y:c.y};
}
function pulse(id){ setTimeout(() => { const e = svg.querySelector(`.tm-town[data-id="${id}"]`) || svg.querySelector(".tm-route.on"); if (e){ e.classList.remove("tm-pulse"); void e.getBoundingClientRect(); e.classList.add("tm-pulse"); } }, 60); }
function settlementDoc(s){ return {t:"s", v:2, name:s.name, kind:s.kind, blurb:s.blurb || "", x:s.x, y:s.y}; }

/* ---------- saving (shared db) ---------- */
const note = (text, kind) => { const n = $("trade-note"); n.textContent = text; n.className = "tm-status" + (kind ? " " + kind : ""); };
function fail(e, verb){
  const code = e && e.code;
  if (code === "invalid_argument"){ readOnly = true; note("Your access to this page is view-only, so the map can't be changed here.", "err"); }
  else if (code === "quota_exceeded") note("The ledger is full. Remove a few old routes before adding more.", "err");
  else if (code === "revoked" || code === "not_granted" || code === "capability_disabled" || code === "capability_removed"){ db = null; note("Saving isn't available in this view anymore. Reload the page.", "err"); }
  else note(`Couldn't ${verb}. Try again in a moment.`, "err");
  renderPanel();
}
async function retry(fn){ try{ return await fn(); }catch(e){ if (e && e.code === "unavailable"){ await new Promise(r => setTimeout(r, 700)); return await fn(); } throw e; } }
async function save(id, body){
  if (!canEdit()) return false;
  try{ await retry(() => db.collection("trade").doc(id).set(body)); docs.set(id, body); rebuild(); renderMap(); note("Saved. Everyone with the map sees the change.", ""); return true; }
  catch(e){ fail(e, "save that"); return false; }
}
async function removeItems(ids){
  if (!canEdit()) return false;
  try{
    for (const id of ids){
      const isS = S.has(id), item = isS ? S.get(id) : R.get(id) || T.get(id);
      if (SEED_IDS.has(id)){ const body = {t: isS ? "s" : T.has(id) ? "tbl" : "r", removed:true}; await retry(() => db.collection("trade").doc(id).set(body)); docs.set(id, body); }
      else { await retry(() => db.collection("trade").doc(id).delete()); docs.delete(id); }
      if (!item) continue;
    }
    rebuild(); note("Removed from the map.", ""); return true;
  }catch(e){ fail(e, "remove that"); return false; }
}

rebuild(); renderMap(); renderPanel();
window.__tradeRender = renderMap;

/* ---------- copy and paste settlements (with their tables; routes stay behind) ---------- */
/* ---------- field search: every mapping row in every table, matched loosely ---------- */
var mapIndex = null;   /* var: rebuild() clears it before this point runs */
const SRC_HDR = /column name in source|source field|hana (source )?field|field name from view|field in view|hana view|slate field|field name in source|^view field|^source column/i;
const DESC_HDR = /^data description|^description|^purpose|business rules?$|^notes?$/i;
const OBJ_HDR = /^sf object$|^object$|application object|\) object$|^salesforce object|^target object/i;
const FLD_HDR = /^sf field( api| name)?$|salesforce (target )?field|field name in salesforce|^field on |\) field$|^sortfield name|^sf field api|^target field|^field on applications/i;
function looksLikeView(c){ return /^"?[A-Z0-9_]+"?(\."?[A-Z0-9_]+"?)+$|^SALESFORCE[_.]|^"EXTRACTS/.test(String(c).trim()); }
function headerRow(rows){
  let best = 0, score = -1;
  for (let i = 0; i < Math.min(3, rows.length); i++){
    const sc = rows[i].filter(c => SRC_HDR.test(c) || OBJ_HDR.test(c) || FLD_HDR.test(c) || DESC_HDR.test(c) || looksLikeView(c)).length;
    if (sc > score){ score = sc; best = i; }
  }
  return score > 0 ? best : 0;
}
function tableMappings(t){
  const rows = t.rows || []; if (!rows.length) return [];
  const h = headerRow(rows), hdr = rows[h].map(c => String(c || "").trim());
  let view = "";
  for (let i = 0; i <= h; i++){ const v = rows[i].find(c => looksLikeView(c)); if (v){ view = String(v).replace(/"/g, ""); break; } }
  let src = hdr.findIndex(c => SRC_HDR.test(c));
  if (src < 0 && looksLikeView(hdr[0])) src = 0;
  const desc = hdr.findIndex((c, i) => i !== src && DESC_HDR.test(c));
  const objs = hdr.map((c, i) => OBJ_HDR.test(c) ? i : -1).filter(i => i >= 0 && i !== src);
  let flds = hdr.map((c, i) => FLD_HDR.test(c) ? i : -1).filter(i => i >= 0 && i !== src && !objs.includes(i));
  if (flds.some(i => /api$/i.test(hdr[i]))) flds = flds.filter(i => !/^sf field name$/i.test(hdr[i]));   /* keep the API name, not the label */
  const fieldObj = i => {   /* the object a field column writes to: named in its heading, or the nearest object column */
    const m = hdr[i].match(/^field on (.+?) object\s*(.*)$/i) || hdr[i].match(/^field on (.+)$/i);
    if (m){ const o = (m[2] || m[1]).trim().split(/\s+/); return o.filter((w, k) => o.findIndex(x => x.toLowerCase() === w.toLowerCase()) === k).join(" "); }
    if (!objs.length) return "";
    return objs.reduce((a, b) => Math.abs(b - i) < Math.abs(a - i) || (b < i && a > i) ? b : a, objs[0]);
  };
  const out = [], start = h + 1;
  for (let r = start; r < rows.length; r++){
    const row = rows[r].map(c => String(c || "").trim()); if (!row.some(Boolean)) continue;
    const sf = src >= 0 ? row[src] : row[0], ds = desc >= 0 ? row[desc] : "";
    let any = false;
    flds.forEach(i => {
      if (!row[i]) return;
      const o = fieldObj(i), obj = typeof o === "number" ? row[o] : o;
      out.push({sf, ds, obj: obj || "", df: row[i]}); any = true;
    });
    if (!any) out.push({sf, ds: ds || row.filter((c, i) => c && i !== src).join(" · "), obj:"", df:""});
  }
  return out.map(m => Object.assign(m, {view}));
}
function destChain(sid){
  /* follow the routes out of a settlement until a capital (or a dead end), e.g. mine → HANA → RADAR 2.0 */
  const path = [], seen = new Set([sid]); let cur = sid;
  for (let k = 0; k < 5; k++){
    const outs = [...R.values()].filter(r => r.from === cur && r.status !== "none" && r.status !== "retired").map(r => r.to).filter(id => !seen.has(id) && S.has(id));
    if (!outs.length) break;
    const next = outs.find(id => S.get(id).kind === "capital") || outs[0];
    path.push(S.get(next).name); seen.add(next); cur = next;
    if (S.get(next).kind === "capital") break;
  }
  return path.join(" → ");
}
const norm = s => String(s || "").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().replace(/__c\b/g, "").replace(/[^a-z0-9]+/g, " ").trim();
function buildIndex(){
  const list = [];
  T.forEach(t => {
    const m = S.get(t.mine); if (!m) return;
    const dest = destChain(t.mine);
    tableMappings(t).forEach(x => {
      const e = Object.assign({mine:t.mine, mineName:m.name, table:t.title || "Table", tableId:t.id, dest}, x);
      e.text = norm([e.sf, e.df, e.obj, e.ds, e.view, e.mineName, e.table, e.dest].join(" "));
      e.words = [...new Set(e.text.split(" "))];
      e.key = norm(e.sf + " " + e.df + " " + e.obj);
      list.push(e);
    });
  });
  return list;
}
function lev(a, b, max){
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({length:b.length + 1}, (_, i) => i), pp = prev;
  for (let i = 1; i <= a.length; i++){
    const cur = [i]; let best = i;
    for (let j = 1; j <= b.length; j++){
      cur[j] = Math.min(prev[j] + 1, cur[j-1] + 1, prev[j-1] + (a[i-1] === b[j-1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i-1] === b[j-2] && a[i-2] === b[j-1]) cur[j] = Math.min(cur[j], pp[j-2] + 1);   /* swapped letters count as one slip */
      best = Math.min(best, cur[j]);
    }
    if (best > max) return max + 1; pp = prev; prev = cur;
  }
  return prev[b.length];
}
function termScore(e, q){
  /* exact word > word start > anywhere > a close misspelling; field names count more than descriptions */
  const inKey = e.key.split(" ");
  if (inKey.includes(q)) return 6;
  if (e.words.includes(q)) return 4;
  if (inKey.some(w => w.startsWith(q))) return 4.5;
  if (e.words.some(w => w.startsWith(q))) return 3;
  if (q.length >= 3 && e.text.includes(q)) return 2;
  if (q.length >= 4){ const max = q.length >= 7 ? 2 : 1; if (e.words.some(w => w.length >= 3 && (lev(q, w, max) <= max || lev(q, w.slice(0, q.length), max) <= max))) return 1; }
  return 0;
}
function searchMappings(qs){
  if (!mapIndex) mapIndex = buildIndex();
  const terms = norm(qs).split(" ").filter(Boolean); if (!terms.length) return [];
  const hits = [];
  for (const e of mapIndex){
    let total = 0;
    for (const q of terms){ const sc = termScore(e, q); if (!sc){ total = 0; break; } total += sc; }
    if (total) hits.push([total + (e.df ? .5 : 0), e]);
  }
  hits.sort((a, b) => b[0] - a[0] || a[1].mineName.localeCompare(b[1].mineName));
  return hits.map(h => h[1]);
}
function searchBox(){
  const wrap = mk("div", "tm-search");
  const i = mk("input"); i.type = "search"; i.placeholder = "Search fields… e.g. major"; i.setAttribute("aria-label", "Search field mappings in every table");
  const go = () => { const v = i.value; i.value = ""; openSearch(v); };
  i.addEventListener("keydown", ev => { if (ev.key === "Enter" && i.value.trim()) go(); });
  i.addEventListener("input", () => { if (i.value.trim().length >= 2) go(); });
  wrap.appendChild(i);
  return wrap;
}
function openSearch(initial){
  closeTable(); hideTip();
  modal = mk("div", "tm-modal"); modal.setAttribute("role", "dialog"); modal.setAttribute("aria-modal", "true"); modal.setAttribute("aria-label", "Field search");
  const card = mk("div", "tm-mcard wide");
  const head = mk("div", "tm-mhead");
  const tt = mk("div"); tt.append(mk("div", "tm-kicker", "Every table on the map"), mk("h3", null, "Field Search"));
  head.append(tt, btn("Close", "tm-btn ghost", closeTable));
  const bar = mk("div", "tm-mbar");
  const q = textEl(initial || "", "Search fields, objects or descriptions… e.g. major", 80); q.className = "tm-filter tm-filter-wide";
  const count = mk("span", "tm-sub"), st = mk("span", "tm-msg");
  let current = [];
  const dl = btn("Download CSV", "tm-btn", async () => {
    const rows = [["Source", "Source Table", "Source Field", "Description", "Destination System", "Destination Object", "Destination Field"]].concat(current.map(e => [e.mineName, e.view || e.table, e.sf, e.ds, e.dest, e.obj, e.df]));
    const data = new Blob(["﻿" + toCSV(rows)], {type:"text/csv"}), name = "Field search - " + q.value.trim().replace(/[\\/:*?"<>|]+/g, "-").slice(0, 60) + ".csv";
    try{ const d = window.claude && window.claude.use ? await window.claude.use("downloads") : null; if (d) await d.save({filename:name, data}); else { const u = URL.createObjectURL(data), a = mk("a"); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); } }
    catch(e){ if (!e || e.code !== "declined") st.textContent = "Couldn't save the file here."; }
  });
  bar.append(q, count, st, dl);
  const wrap = mk("div", "tm-twrap");
  const LIMIT = 400;
  const draw = () => {
    wrap.textContent = ""; st.textContent = "";
    const v = q.value.trim();
    if (!v){ count.textContent = ""; current = []; dl.disabled = true; wrap.appendChild(mk("p", "tm-note tm-pad", "Type a word or part of one, such as major, email or term. Close misspellings still match.")); return; }
    current = searchMappings(v); dl.disabled = !current.length;
    count.textContent = current.length ? `${current.length} match${current.length === 1 ? "" : "es"}${current.length > LIMIT ? `, showing the best ${LIMIT}` : ""}` : "No matches";
    if (!current.length) return;
    const tb = mk("table", "tm-table tm-results");
    const th = mk("thead"), tr = mk("tr");
    ["Source", "Source Table", "Source Field", "Description", "Destination System", "Object", "Destination Field"].forEach(h => tr.appendChild(mk("th", null, h)));
    th.appendChild(tr); tb.appendChild(th);
    const bd = mk("tbody");
    current.slice(0, LIMIT).forEach(e => {
      const r = mk("tr");
      const srcCell = mk("td"); const sb = btn(e.mineName, "tm-cell-link", () => { closeTable(); const s0 = S.get(e.mine); if (s0) showPoint(s0.x, s0.y); select({type:"s", id:e.mine}); pulse(e.mine); }); sb.title = "Show " + e.mineName + " on the map"; srcCell.appendChild(sb);
      const tabCell = mk("td"); const tbtn = btn(e.view || e.table, "tm-cell-link", () => { const t = T.get(e.tableId); if (t){ openTable(t); const f = modal && modal.querySelector(".tm-filter"); if (f){ f.value = e.sf || e.df; f.dispatchEvent(new Event("input")); } } }); tbtn.title = "Open this table"; tabCell.appendChild(tbtn);
      r.append(srcCell, tabCell, mk("td", "mono", e.sf), mk("td", "desc", e.ds), mk("td", null, e.dest || "—"), mk("td", null, e.obj), mk("td", "mono", e.df));
      bd.appendChild(r);
    });
    tb.appendChild(bd); wrap.appendChild(tb);
  };
  let tmr = 0; q.addEventListener("input", () => { clearTimeout(tmr); tmr = setTimeout(draw, 120); });
  card.append(head, bar, wrap); modal.appendChild(card);
  modal.addEventListener("click", ev => { if (ev.target === modal) closeTable(); });
  document.body.appendChild(modal); document.addEventListener("keydown", escClose);
  draw(); q.focus(); q.setSelectionRange(q.value.length, q.value.length);
}

var CLIP_KEY = "settlers-trade-clip";
var clipMem = null, lastPointer = null;   /* var: renderPanel reads these before this point runs */
function readClip(){ if (clipMem) return clipMem; try{ const c = JSON.parse(localStorage.getItem(CLIP_KEY) || "null"); if (c && c.s && c.s.name) return (clipMem = Object.assign({tables:[]}, c)); }catch(e){} return null; }
function copySettlement(id){
  const s = S.get(id); if (!s) return;
  clipMem = {s:{name:s.name, kind:s.kind, blurb:s.blurb || "", x:s.x, y:s.y}, tables:tablesOf(id).map(t => ({title:t.title, rows:t.rows, header:t.header !== false}))};
  try{ localStorage.setItem(CLIP_KEY, JSON.stringify(clipMem)); }catch(e){ /* too big for this browser's storage: the copy still works on this page */ }
  sfx("chime");
  note(`Copied ${s.name}${clipMem.tables.length ? ` and its ${clipMem.tables.length} table${clipMem.tables.length === 1 ? "" : "s"}` : ""}. Press Ctrl+V, or use Paste, to place a copy.`, "");
  renderPanel();
}
function copyName(base){
  const names = new Set([...S.values()].map(s => s.name.toLowerCase()));
  const root = base.replace(/ \(copy(?: \d+)?\)$/, "");
  for (let i = 1; ; i++){ const n = root + (i === 1 ? " (copy)" : ` (copy ${i})`); if (!names.has(n.toLowerCase())) return n; }
}
let pasting = false;
async function pasteSettlement(){
  const clip = readClip(); if (!clip || !canEdit() || pasting) return;
  pasting = true;
  /* land under the pointer if it's over the map, otherwise just beside the original */
  let x = clip.s.x + 70, y = clip.s.y + 70;
  if (lastPointer && view && lastPointer.x > view.x && lastPointer.x < view.x + view.w && lastPointer.y > view.y && lastPointer.y < view.y + view.h){ x = lastPointer.x; y = lastPointer.y; }
  x = Math.round(Math.min(MW - 60, Math.max(60, x))); y = Math.round(Math.min(MH - 50, Math.max(70, y)));
  const id = "s-" + Math.random().toString(36).slice(2, 10);
  const name = copyName(clip.s.name);
  try{
    const ok = await save(id, {t:"s", v:2, name, kind:clip.s.kind, blurb:clip.s.blurb, x, y});
    if (!ok) return;
    for (const t of clip.tables){ await save("t-" + Math.random().toString(36).slice(2, 10), {t:"tbl", mine:id, title:t.title, rows:t.rows, header:t.header, createdAt:Date.now()}); }
    sfx("grant"); showPoint(x, y); select({type:"s", id}); pulse(id);
    note(`Pasted ${name}${clip.tables.length ? ` with ${clip.tables.length} table${clip.tables.length === 1 ? "" : "s"}` : ""}. Drag it where you want it, and use Edit to rename it.`, "");
  } finally { pasting = false; }
}
svg.addEventListener("pointermove", ev => { try{ lastPointer = toMap(ev); }catch(e){} });
svg.addEventListener("pointerleave", () => { lastPointer = null; });
document.addEventListener("keydown", ev => {
  if (!(ev.ctrlKey || ev.metaKey) || ev.altKey || ev.shiftKey) return;
  const k = ev.key.toLowerCase(); if (k !== "c" && k !== "v") return;
  if ($("tab-trade").hidden || modal) return;
  const t = ev.target; if (t && (t.closest("input, textarea, select, [contenteditable]"))) return;
  if (k === "c"){
    if (!sel || sel.type !== "s") return;
    const txt = String(window.getSelection ? window.getSelection() : ""); if (txt.trim()) return;   /* let normal text copying work */
    ev.preventDefault(); copySettlement(sel.id);
  } else {
    if (!readClip() || !canEdit()) return;
    ev.preventDefault(); pasteSettlement();
  }
});
(async function(){
  const use = window.claude && window.claude.use;
  try{ db = use ? await window.claude.use("db") : null; }catch(e){ db = null; }
  if (!db){ note("Showing the starting map. Changes can't be saved in this copy.", "err"); renderPanel(); return; }
  note("Loading the trade ledger…", "");
  renderPanel();
  let first = true;
  db.collection("trade").onSnapshot(snap => {
    const next = new Map();
    snap.docs.forEach(d => { if (d.exists) next.set(d.id, Object.assign({}, d.data() || {})); });
    docs = next; rebuild();
    if (!drag){ renderMap(); if (mode === "view") renderPanel(); }
    if (first){ first = false; note(`${R.size} trade routes between ${S.size} settlements. Click anything to see or change it.`, ""); }
  }, e => fail(e, "load the trade ledger"));
})();
})();
