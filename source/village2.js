/* ================= Village Square: a medieval market square. Villagers mingle and say what they're working on; team stories hang on the buildings; Julie's headline is pinned to the castle. ================= */
const SVGNS = "http://www.w3.org/2000/svg", XHTML = "http://www.w3.org/1999/xhtml";
function sv(tag, attrs, parent){ const e = document.createElementNS(SVGNS, tag); if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
let villageDirty = true;
const julieCache = new Map();
const VW = 1200, VH = 1240;

/* buildings around the square; banners hang from their upper floors */
const SITES = {
  /* banners fit the upper floor and stop above each doorway; buildings sit well inside the frame */
  dev:   {label:"The Smithy",          x:62,  y:300, w:330, h:260, banner:{x:86,  y:334, w:282, h:124}},
  admin: {label:"The Guildhall",       x:435, y:276, w:330, h:284, banner:{x:459, y:322, w:282, h:128}},
  mc:    {label:"The Messenger's Post", x:808, y:300, w:330, h:260, banner:{x:832, y:334, w:282, h:128}}
};
/* where people gather on the square: little knots of villagers chatting, each team near its own building */
const CLUSTERS = {
  dev:   [{x:178, y:990, rx:92, ry:66}],
  mc:    [{x:1022, y:990, rx:92, ry:66}],
  admin: [{x:515, y:935, rx:72, ry:36}, {x:690, y:935, rx:72, ry:36}, {x:602, y:1082, rx:100, ry:38}]
};
/* a soft patch of ground and a signpost for each team, so the groups read as teams without walls between them */
const PATCHES = {
  dev:   {x:178, y:985, rx:150, ry:150, color:"#3f5e57"},
  mc:    {x:1022, y:985, rx:150, ry:150, color:"#7a3348"},
  admin: {x:602, y:1000, rx:240, ry:175, color:"#2f4170"}
};
/* ---------- the most important thing for Julie ---------- */
function julieKey(){ return TEAMS.map(storyKey).join("||"); }
function localJulie(){
  const B = window.__board;
  if (!B || !B.people().length) return "Word from the village is still on its way from Asana.";
  const T = B.todayIdx(), proj = new Map(), late = new Map();
  roster.forEach(h => { const bp = boardPerson(h.id); if (!bp) return; bp.brick.forEach(t => (t.projects || []).forEach(n => { proj.set(n, (proj.get(n) || 0) + 1); if (t.due && B.dueIdx(t.due) < T) late.set(n, (late.get(n) || 0) + 1); })); });
  const top = [...proj.entries()].sort((a, b) => b[1] - a[1])[0];
  const lateTop = [...late.entries()].sort((a, b) => b[1] - a[1])[0];
  if (!top) return "A calm week: no urgent work is stacking up anywhere in the village.";
  if (lateTop && lateTop[0] !== top[0]) return `${top[0]} is drawing the most urgent work this week, and ${lateTop[0]} has items slipping past due.`;
  if (lateTop) return `${top[0]} is drawing the most urgent work this week, and some of it has already slipped past due.`;
  return `${top[0]} is drawing the most urgent work this week, and it's all on schedule so far.`;
}
function juliePrompt(){
  const B = window.__board, T = B.todayIdx();
  const stories = TEAMS.map(t => `${t.name}: ${storyCache.get(storyKey(t)) || localStory(t)}`).join("\n");
  const late = [];
  roster.forEach(h => { const bp = boardPerson(h.id); if (!bp) return; bp.brick.forEach(t => { if (t.due && B.dueIdx(t.due) < T) late.push(`${t.name}${t.projects && t.projects[0] ? " [" + t.projects[0] + "]" : ""} (due ${t.due}, ${h.name.split(" ")[0]})`); }); });
  return `Julie is the senior marketing leader this Salesforce operations team ultimately serves. Here is this week's picture:\n${stories}\n\n` +
    `Overdue urgent items: ${late.slice(0, 15).join("; ") || "none"}\n\n` +
    `In ONE plain sentence of 22 words or fewer, state the single most important thing Julie should know this week: the biggest risk, milestone or win. ` +
    `Be specific (name the project or effort). No fantasy language, no counts, no reporting lines, no preamble.`;
}

/* ---------- Claude, asked only when someone opens the Village Square ---------- */
async function askClaude(prompt){
  if (storySample === "off") return null;
  const sample = (window.claude && window.claude.use) ? await window.claude.use("sample") : null;
  if (!sample){ storySample = "off"; return null; }
  try{ const res = await sample(prompt, {modelTier:"quick"}); return String(res && res.text || "").trim() || null; }
  catch(e){ if (e && e.code === "not_granted") storySample = "off"; return null; }
}
let villageAsking = false;
async function villageAsk(){
  if (villageAsking || storySample === "off" || !window.__board || !window.__board.people().length) return;
  villageAsking = true; renderVillage(true);
  try{
    for (const team of TEAMS){
      const k = storyKey(team);
      if (storyCache.has(k)) continue;
      const text = await askClaude(storyPrompt(team));
      if (!text) break;
      storyCache.set(k, text); renderChronicles();
    }
    const jk = julieKey();
    if (!julieCache.has(jk)){ const text = await askClaude(juliePrompt()); if (text) julieCache.set(jk, text.replace(/^["“]|["”]$/g, "")); }
  } finally { villageAsking = false; renderVillage(true); }
}
function villageOpen(ask){ renderVillage(true); if (ask) villageAsk(); }

/* ---------- what each villager says: a short first-person line from their Asana work ---------- */
function isAsleep(hero){
  if (hero.id === ROOT) return false;
  const bp = boardPerson(hero.id);
  return !bp || !bp.brick.length;
}
function speech(hero){
  const B = window.__board, bp = boardPerson(hero.id);
  if (!B || !bp) return hero.id === ROOT ? "Steady hands, everyone. Onward!" : "Just passing through the square.";
  const T = B.todayIdx();
  const cut = n => { const t = String(n).replace(/^[\d_:apm\s.-]{6,}\s*-?\s*/i, "").replace(/\s+/g, " ").trim(); return t.length > 40 ? t.slice(0, 38).trimEnd() + "…" : t; };
  const when = d => { const [y, m, dd] = d.split("-").map(Number); return ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m-1] + " " + dd; };
  const dated = bp.brick.filter(t => t.due).sort((a, b) => a.due.localeCompare(b.due));
  const late = dated.find(t => B.dueIdx(t.due) < T);
  if (late) return `“${cut(late.name)}” is overdue. I'm on it!`;
  if (dated.length){ const d = dated[0], di = B.dueIdx(d.due); return di === T ? `“${cut(d.name)}” is due today!` : `“${cut(d.name)}”, due ${when(d.due)}.`; }
  if (bp.brick.length) return `Busy with “${cut(bp.brick[0].name)}”.`;
  if (bp.gold.length) return `Just wrapped “${cut(bp.gold[0].name)}”!`;
  return "A quiet day. Fetch me a quest!";
}

/* ---------- drawing helpers ---------- */
function htmlBox(parent, b, cls, build){
  const fo = sv("foreignObject", {x:b.x, y:b.y, width:b.w, height:b.h}, parent);
  const div = document.createElementNS(XHTML, "div"); div.className = cls; fo.appendChild(div); build(div);
  return fo;
}
function fitText(root){
  [[".v-banner", ".v-banner-text", 9.5], [".v-scroll", ".v-scroll-text", 10.5], [".v-bubble", ".v-bubble-text", 9.5]].forEach(([box, txt, min]) => {
    root.querySelectorAll(box).forEach(b => {
      const t = b.querySelector(txt); if (!t || !b.clientHeight) return;
      let size = parseFloat(getComputedStyle(t).fontSize) || 13;
      while (b.scrollHeight > b.clientHeight + 1 && size > min){ size -= 0.5; t.style.fontSize = size + "px"; }
    });
  });
}
function hdiv(parent, cls, text){ const d = document.createElementNS(XHTML, "div"); d.className = cls; if (text != null) d.textContent = text; parent.appendChild(d); return d; }
const HAT = {
  wizard:   c => `<path d="M-12 -40 L1 -68 L11 -40 Z" fill="${c}" stroke="#2b1d08" stroke-width="1.4"/><path d="M-16 -40 h30" stroke="#2b1d08" stroke-width="3.2" stroke-linecap="round"/><circle cx="3" cy="-56" r="2" fill="#e8c77a"/>`,
  sorcerer: c => `<path d="M-11 -40 L4 -66 L11 -40 Z" fill="${c}" stroke="#2b1d08" stroke-width="1.4"/><path d="M-15 -40 h28" stroke="#2b1d08" stroke-width="3" stroke-linecap="round"/>`,
  warlock:  c => `<path d="M-14 -34 Q-15 -60 0 -62 Q15 -60 14 -34 Q8 -44 0 -44 Q-8 -44 -14 -34 Z" fill="${c}" stroke="#2b1d08" stroke-width="1.4"/>`,
  rogue:    c => `<path d="M-14 -32 Q-16 -60 0 -60 Q16 -60 14 -32 Q8 -42 0 -42 Q-8 -42 -14 -32 Z" fill="#3b3a36" stroke="#1b1209" stroke-width="1.4"/>`,
  bard:     c => `<path d="M-13 -42 Q0 -53 13 -42 Z" fill="${c}" stroke="#2b1d08" stroke-width="1.2"/><path d="M8 -47 Q19 -62 24 -53" stroke="#e8c77a" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
  squire:   c => `<path d="M-12 -42 Q0 -51 12 -42 Z" fill="#6b5330" stroke="#2b1d08" stroke-width="1.2"/>`,
  ranger:   c => `<path d="M-13 -36 Q-13 -58 0 -58 Q13 -58 13 -36 L6 -44 L0 -42 L-6 -44 Z" fill="#4f6a34" stroke="#2b1d08" stroke-width="1.3"/>`,
  paladin:  c => `<path d="M-12 -35 Q-13 -56 0 -56 Q13 -56 12 -35 Z" fill="#b9bcc0" stroke="#5a5d62" stroke-width="1.4"/><path d="M-8 -42 h16" stroke="#3b3a36" stroke-width="2.6"/><path d="M0 -56 v-9" stroke="#8e2a17" stroke-width="4.5" stroke-linecap="round"/>`,
  fighter:  c => `<path d="M-12 -36 Q-13 -56 0 -56 Q13 -56 12 -36 Z" fill="#9a9c9f" stroke="#5a5d62" stroke-width="1.4"/><path d="M0 -56 v18" stroke="#5a5d62" stroke-width="2"/>`,
  barbarian:c => `<path d="M-12 -40 Q0 -51 12 -40 Z" fill="#6b4a2b"/><path d="M-10 -44 Q-21 -51 -19 -62" stroke="#efe3c8" stroke-width="3.6" fill="none" stroke-linecap="round"/><path d="M10 -44 Q21 -51 19 -62" stroke="#efe3c8" stroke-width="3.6" fill="none" stroke-linecap="round"/>`,
  monk:     c => `<path d="M-14 -30 Q-16 -54 0 -55 Q16 -54 14 -30 Q8 -40 0 -40 Q-8 -40 -14 -30 Z" fill="${c}" stroke="#2b1d08" stroke-width="1.3"/>`,
  cleric:   c => `<path d="M-9 -42 L-6 -62 L0 -56 L6 -62 L9 -42 Z" fill="#efe3c8" stroke="#8a6a2c" stroke-width="1.4"/><path d="M0 -58 v12 M-4 -52 h8" stroke="#8e2a17" stroke-width="1.8"/>`,
  druid:    c => `<path d="M-12 -42 q4 -9 8 0 q4 -9 8 0 q4 -9 8 0" stroke="#3c6d45" stroke-width="3.2" fill="none" stroke-linecap="round"/>`,
  artificer:c => `<path d="M-12 -40 Q0 -50 12 -40 Z" fill="#6b4a2b"/><path d="M-12 -36 h24" stroke="#4a3420" stroke-width="2.4"/><circle cx="-5" cy="-37" r="4" fill="#c9d8c8" stroke="#4a3420" stroke-width="1.6"/><circle cx="5" cy="-37" r="4" fill="#c9d8c8" stroke="#4a3420" stroke-width="1.6"/>`
};
/* tunic colours are earthy dyes keyed to each class */
const DYE = {paladin:"#8a6a2c", wizard:"#3d4f7a", bard:"#8a3a55", artificer:"#3f6e64", fighter:"#7a3328", ranger:"#4f6a34", barbarian:"#7d4423", monk:"#7a6a3a", cleric:"#a8862e", rogue:"#45474c", sorcerer:"#9a3a26", warlock:"#553a72", druid:"#3c6d45", squire:"#6d6a5e", crown:"#5d3f7a"};
function villager(parent, hero, x, y, scale, face, gesture, i, name, asleep){
  const cls = clsOf(hero), c = DYE[cls] || "#6d6a5e";
  const g = sv("g", {class:"villager", transform:`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${scale})`, tabindex:"0", role:"img", "aria-label":`${hero.name}, ${CLASSES[cls].label}`}, parent);
  let holder = g;
  if (asleep){
    gesture = false; g.setAttribute("aria-label", `${hero.name}, ${CLASSES[cls].label}, asleep: nothing urgent right now`);
    /* lying flat on a bedroll with the head on a straw pillow */
    const dir = face;
    sv("ellipse", {cx:0, cy:16, rx:44, ry:7, fill:"#2b1d08", opacity:".25"}, g);
    sv("rect", {x:-42, y:2, width:84, height:16, rx:7, fill:"#7d4423", stroke:"#3b2a17", "stroke-width":"1.6"}, g);
    sv("path", {d:"M-34 6 h68 M-34 13 h68", stroke:"#c9a24a", "stroke-width":"1.4", "stroke-dasharray":"5 4"}, g);
    sv("ellipse", {cx:dir*30, cy:6, rx:13, ry:7, fill:"#d9c08a", stroke:"#6b5330", "stroke-width":"1.4"}, g);
    holder = sv("g", {transform:`translate(0 6) rotate(${90*dir} 0 -13)`}, g);
  }
  const bob = sv("g", {class: asleep ? "bob asleep" : "bob", style:`animation-delay:${(i * 0.41) % 2.6}s`}, holder);
  if (!asleep) sv("ellipse", {cx:0, cy:17, rx:19, ry:5, fill:"#2b1d08", opacity:".28"}, bob);
  /* tunic: a game-piece body with a belt and a hem, plus a cloak in the class colour */
  sv("path", {d:"M-8 -24 Q-19 -21 -22 -11 Q-23 -6 -17 -7 L-11 -9 L-13 7 L-15 14 Q-15 17 -11 17 L-3 17 L0 7 L3 17 L11 17 Q15 17 15 14 L13 7 L11 -9 L17 -7 Q23 -6 22 -11 Q19 -21 8 -24 Z", fill:c, stroke:"#1f150a", "stroke-width":"1.7", "stroke-linejoin":"round"}, bob);
  sv("path", {d:"M-12 -2 h24", stroke:"#3b2a17", "stroke-width":"3"}, bob);
  sv("rect", {x:-2.5, y:-4.5, width:5, height:5, fill:"#c9a24a", stroke:"#3b2a17", "stroke-width":".8"}, bob);
  sv("path", {d:"M-13 6 h26", stroke:"rgba(255,255,255,.18)", "stroke-width":"2"}, bob);
  /* a hand raised mid-conversation */
  if (gesture) sv("path", {d:`M${14*face} -12 q${10*face} -6 ${12*face} -16`, stroke:c, "stroke-width":"6", "stroke-linecap":"round", fill:"none"}, bob);
  if (gesture) sv("circle", {cx:26*face, cy:-28, r:3.6, fill:"#f0dcbc", stroke:"#1f150a", "stroke-width":"1.2"}, bob);
  sv("circle", {cx:0, cy:-33, r:11, fill:"#f0dcbc", stroke:"#1f150a", "stroke-width":"1.7"}, bob);
  if (asleep){
    /* closed eyes and a little open mouth, snoozing */
    sv("path", {d:"M-6 -34 q2 2 4 0 M2 -34 q2 2 4 0", stroke:"#1f150a", "stroke-width":"1.5", fill:"none", "stroke-linecap":"round"}, bob);
    sv("ellipse", {cx:0, cy:-27.5, rx:1.8, ry:2.2, fill:"#1f150a"}, bob);
  } else {
    /* eyes glance toward whoever they're talking to */
    const ex = 1.6 * face;
    sv("circle", {cx:-4 + ex, cy:-34, r:1.7, fill:"#1f150a"}, bob);
    sv("circle", {cx:4 + ex, cy:-34, r:1.7, fill:"#1f150a"}, bob);
    sv("path", {d:`M${-3.5 + ex} -28.5 Q${ex} -25.5 ${3.5 + ex} -28.5`, stroke:"#1f150a", "stroke-width":"1.5", fill:"none", "stroke-linecap":"round"}, bob);
  }
  sv("circle", {cx:-7, cy:-30, r:1.8, fill:"#d98b74", opacity:".6"}, bob);
  sv("circle", {cx:7, cy:-30, r:1.8, fill:"#d98b74", opacity:".6"}, bob);
  const hat = sv("g", null, bob); hat.innerHTML = (HAT[cls] || HAT.squire)(c);   /* static, trusted drawing markup */
  const nm = sv("text", {x:0, y:33, "text-anchor":"middle", class:"vname"}, g); nm.textContent = name || hero.name.split(" ")[0];
  g.addEventListener("click", () => openSheet(hero.id));
  g.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " "){ ev.preventDefault(); openSheet(hero.id); } });
  return g;
}
function bubble(tails, boxes, x, headY, text, r, k){
  /* tails sit on their own layer underneath every bubble, so a long tail never crosses someone else's words */
  const tx = Math.max(r.x + 18, Math.min(r.x + r.w - 18, x)), by = r.y + r.h - 4;
  const midY = (by + headY - 6) / 2;
  sv("path", {d:`M${tx - 8} ${by} Q${tx - 4} ${midY} ${x} ${headY - 6} Q${tx + 6} ${midY} ${tx + 8} ${by} Z`, fill:"#fbf3dc", stroke:"#5a4128", "stroke-width":"1.6", "stroke-linejoin":"round"}, tails);
  const g = sv("g", {class:"bubble", style:`animation-delay:${(k*0.23) % 3}s`}, boxes);
  htmlBox(g, r, "v-bubble", d => hdiv(d, "v-bubble-text", text));
}
/* ---------- the scene ---------- */
function renderVillage(force){
  const host = $("village-scene"); if (!host) return;
  if ($("tab-village").hidden && !force){ villageDirty = true; return; }
  villageDirty = false;
  host.textContent = "";
  const s = sv("svg", {viewBox:`0 0 ${VW} ${VH}`, role:"img", "aria-label":"A medieval market square: the team's villagers mingle and talk about their work, team stories hang from the buildings, and a note for Julie is pinned to the castle"}, host);
  const defs = sv("defs", null, s);
  const sky = sv("linearGradient", {id:"vsky", x1:0, y1:0, x2:0, y2:1}, defs);
  sv("stop", {offset:"0%", "stop-color":"#93a6ad"}, sky); sv("stop", {offset:"65%", "stop-color":"#d6d0b8"}, sky); sv("stop", {offset:"100%", "stop-color":"#ead8b0"}, sky);
  const stone = sv("pattern", {id:"vstone", width:40, height:20, patternUnits:"userSpaceOnUse"}, defs);
  sv("rect", {width:40, height:20, fill:"#a59d8e"}, stone);
  sv("path", {d:"M0 10h40M20 0v10M0 20v-10M40 20v-10", stroke:"#7f786b", "stroke-width":"1.3"}, stone);
  const cob = sv("pattern", {id:"vcob", width:44, height:30, patternUnits:"userSpaceOnUse"}, defs);
  sv("rect", {width:44, height:30, fill:"#a8947a"}, cob);
  [[8,7,9,6],[27,6,10,5.5],[40,15,6,5],[16,20,10,6],[34,24,8,5],[2,24,5,4.5]].forEach(([cx, cy, rx, ry]) => sv("ellipse", {cx, cy, rx, ry, fill:"#b9a689", stroke:"#7d6c55", "stroke-width":"1.2"}, cob));
  const thatch = sv("pattern", {id:"vthatch", width:14, height:12, patternUnits:"userSpaceOnUse"}, defs);
  sv("rect", {width:14, height:12, fill:"#b4904f"}, thatch);
  sv("path", {d:"M0 12 L4 0 M7 12 L11 0 M3.5 12 L7.5 2", stroke:"#8a6a33", "stroke-width":"1.2"}, thatch);
  const slate = sv("pattern", {id:"vslate", width:18, height:12, patternUnits:"userSpaceOnUse"}, defs);
  sv("rect", {width:18, height:12, fill:"#4f5560"}, slate);
  sv("path", {d:"M0 6h18M9 0v6M0 12v-6M18 12v-6", stroke:"#363b44", "stroke-width":"1.2"}, slate);
  const tile = sv("pattern", {id:"vtile", width:16, height:10, patternUnits:"userSpaceOnUse"}, defs);
  sv("rect", {width:16, height:10, fill:"#9a4a2f"}, tile);
  sv("path", {d:"M0 10 Q4 4 8 10 Q12 4 16 10", stroke:"#6e2f1c", "stroke-width":"1.3", fill:"none"}, tile);

  sv("rect", {x:0, y:0, width:VW, height:VH, fill:"url(#vsky)"}, s);
  /* low clouds and crows */
  [[150, 92, 1], [430, 58, .8], [930, 108, .9]].forEach(([x, y, k], i) => { const c = sv("g", {class:"cloud", style:`animation-delay:${-i*12}s`}, s); [[0, 0, 30], [30, -8, 24], [58, 2, 26], [28, 8, 26]].forEach(([dx, dy, r]) => sv("circle", {cx:x + dx*k, cy:y + dy*k, r:r*k, fill:"#eee8da", opacity:".7"}, c)); });
  [[260, 150], [300, 132], [980, 160]].forEach(([x, y], i) => sv("path", {class:"bird", d:`M${x} ${y} q7 -7 14 0 q7 -7 14 0`, stroke:"#2b2a28", "stroke-width":"2.4", fill:"none", "stroke-linecap":"round", style:`animation-delay:${i*1.3}s`}, s));
  /* hills and the castle */
  sv("path", {d:"M0 300 Q200 200 420 246 Q600 150 790 236 Q1000 190 1200 276 V440 H0 Z", fill:"#7a8550"}, s);
  sv("path", {d:"M0 344 Q300 286 600 326 Q900 278 1200 338 V460 H0 Z", fill:"#65703f"}, s);
  sv("path", {d:"M560 262 Q600 300 640 262", stroke:"#a8947a", "stroke-width":"10", fill:"none"}, s);   /* road up to the gate */
  const castle = sv("g", {class:"castle", transform:"translate(0 -28)"}, s);
  sv("rect", {x:470, y:150, width:260, height:120, fill:"url(#vstone)", stroke:"#5f594f", "stroke-width":"2.5"}, castle);
  for (let i = 0; i < 13; i++) sv("rect", {x:470 + i*20, y:138, width:13, height:13, fill:"url(#vstone)", stroke:"#5f594f", "stroke-width":"1.5"}, castle);
  [[436, 116, 54, 154], [710, 116, 54, 154], [568, 92, 64, 178]].forEach(([x, y, w, h], ti) => {
    sv("rect", {x, y, width:w, height:h, fill:"url(#vstone)", stroke:"#5f594f", "stroke-width":"2.5"}, castle);
    sv("path", {d:`M${x - 7} ${y} L${x + w/2} ${y - 40} L${x + w + 7} ${y} Z`, fill:"url(#vslate)", stroke:"#2d3138", "stroke-width":"2"}, castle);
    const pole = x + w/2;
    sv("path", {d:`M${pole} ${y - 40} v-20`, stroke:"#2d3138", "stroke-width":"2"}, castle);
    sv("path", {class:"flag", d:`M${pole} ${y - 60} l26 5 l-8 4 l8 4 l-26 0 Z`, fill: ti === 2 ? "#8e2a17" : "#c9a24a", stroke:"#3b2a17", "stroke-width":"1"}, castle);
    sv("path", {d:`M${x + w/2 - 4} ${y + 34} h8 v18 h-8 Z`, fill:"#2b2620"}, castle);
  });
  sv("path", {d:"M578 270 v-38 a22 22 0 0 1 44 0 v38 Z", fill:"#2b2620", stroke:"#5f594f", "stroke-width":"2"}, castle);
  for (let i = 0; i < 5; i++) sv("path", {d:`M${584 + i*8} 236 v34`, stroke:"#6b6457", "stroke-width":"2"}, castle);   /* portcullis */
  /* Julie's proclamation nailed to the castle wall */
  const jk = julieKey(), jtext = julieCache.get(jk) || localJulie();
  sv("rect", {x:456, y:174, width:296, height:72, fill:"#000", opacity:".2"}, castle);
  htmlBox(castle, {x:450, y:166, w:300, h:76}, "v-scroll", d => {
    hdiv(d, "v-scroll-head", "By order of the Keep · for Julie");
    hdiv(d, "v-scroll-text", jtext);
  });
  sv("circle", {cx:600, cy:244, r:7, fill:"#8e2a17", stroke:"#5a1a0e", "stroke-width":"1.5"}, castle);   /* wax seal */
  /* the square */
  sv("path", {d:`M0 540 Q600 500 ${VW} 540 V${VH} H0 Z`, fill:"url(#vcob)"}, s);
  sv("path", {d:`M0 540 Q600 500 ${VW} 540`, stroke:"#6b5a45", "stroke-width":"4", fill:"none"}, s);
  drawSmithy(s, SITES.dev); drawGuildhall(s, SITES.admin); drawPost(s, SITES.mc);
  /* team stories on heraldic banners */
  TEAMS.forEach(team => {
    const site = SITES[team.key]; if (!site) return;
    const story = storyCache.get(storyKey(team)) || localStory(team);
    const b = site.banner;
    sv("path", {d:`M${b.x - 10} ${b.y - 2} h${b.w + 20}`, stroke:"#3b2a17", "stroke-width":"7", "stroke-linecap":"round"}, s);
    sv("circle", {cx:b.x - 10, cy:b.y - 2, r:6, fill:"#c9a24a", stroke:"#3b2a17", "stroke-width":"1.5"}, s);
    sv("circle", {cx:b.x + b.w + 10, cy:b.y - 2, r:6, fill:"#c9a24a", stroke:"#3b2a17", "stroke-width":"1.5"}, s);
    htmlBox(s, b, "v-banner v-" + team.key, d => { hdiv(d, "v-banner-head", team.name + " · " + site.label); hdiv(d, "v-banner-text", story); });
  });
  /* market props */
  drawWell(s, 600, 640); drawStall(s, 205, 618, "#8e2a17"); drawStall(s, 995, 618, "#3d4f7a");
  drawBarrels(s, 395, 652); drawBarrels(s, 790, 658); drawHay(s, 1150, 1215); drawHay(s, 52, 1215);
  drawTorch(s, 396, 560); drawTorch(s, 804, 560);
  TEAMS.forEach(team => {
    const pt = PATCHES[team.key]; if (!pt) return;
    sv("ellipse", {cx:pt.x, cy:pt.y, rx:pt.rx, ry:pt.ry, fill:pt.color, opacity:".13"}, s);
    sv("ellipse", {cx:pt.x, cy:pt.y, rx:pt.rx, ry:pt.ry, fill:"none", stroke:pt.color, "stroke-width":"2.5", "stroke-dasharray":"2 9", "stroke-linecap":"round", opacity:".45"}, s);
    const sx = team.key === "mc" ? pt.x + pt.rx - 34 : team.key === "dev" ? pt.x - pt.rx + 34 : pt.x + 36;
    const sy = team.key === "admin" ? 1174 : pt.y + pt.ry - 40;
    sv("path", {d:`M${sx} ${sy + 34} v-56`, stroke:"#4a3420", "stroke-width":"4"}, s);
    sv("path", {d:`M${sx} ${sy - 22} h${team.key === "dev" ? 70 : -70} l${team.key === "dev" ? 10 : -10} 10 l${team.key === "dev" ? -10 : 10} 10 h${team.key === "dev" ? -70 : 70} Z`, fill:pt.color, stroke:"#2b1d08", "stroke-width":"1.6"}, s);
    const t = sv("text", {x:sx + (team.key === "dev" ? 36 : -36), y:sy - 7, "text-anchor":"middle", class:"vsign"}, s); t.textContent = team.name;
  });
  /* villagers mingling in small groups, each turned toward the middle of their group */
  const firsts = new Map(); roster.forEach(h => { const f = h.name.split(" ")[0]; firsts.set(f, (firsts.get(f) || 0) + 1); });
  const label = h => { const parts = h.name.split(" "), f = parts[0]; return firsts.get(f) > 1 ? f + " " + parts[parts.length - 1][0] + "." : f; };
  const placed = [];
  TEAMS.forEach(team => {
    const groups = CLUSTERS[team.key], members = teamMembers(team);
    const per = Math.ceil(members.length / groups.length);
    members.forEach((h, i) => {
      const gi = Math.min(groups.length - 1, Math.floor(i / per)), grp = groups[gi];
      const inGroup = members.slice(gi*per, gi*per + per).length, k = i - gi*per;
      const ang = Math.PI * (0.85 + (inGroup === 1 ? 0.65 : 1.3 * k / (inGroup - 1)));   /* fan around the front of the group */
      const jitter = ((h.id.length * 37) % 17) - 8;
      const x = grp.x + Math.cos(ang) * grp.rx + jitter, y = grp.y - Math.sin(ang) * grp.ry * -1 + (k % 2 ? 10 : -6);
      placed.push({h, x, y, face: x < grp.x ? 1 : -1});
    });
  });
  const people = sv("g", null, s), tails = sv("g", null, s), talk = sv("g", null, s);
  const boxes = [];
  const hit = (a, b) => a.x < b.x + b.w + 6 && b.x < a.x + a.w + 6 && a.y < b.y + b.h + 6 && b.y < a.y + a.h + 6;
  placed.sort((a, b) => a.y - b.y).forEach((p, i) => {
    const sc = 0.8 + (p.y - 860) / 1500;   /* nearer folk look a little bigger */
    p.asleep = isAsleep(p.h);
    villager(people, p.h, p.x, p.y, sc, p.face, i % 3 === 0, i, label(p.h), p.asleep);
    if (p.asleep){
      /* drifting Zs instead of a speech bubble */
      const zz = sv("g", {class:"zzz", "aria-hidden":"true"}, talk);
      const hx = p.x + p.face * 26 * sc, hy = p.y - 22 * sc;   /* above the head, which now rests on the pillow */
      [[0, 0, 14], [10, -16, 17], [22, -34, 21]].forEach(([dx, dy, fs], k) => { const t = sv("text", {x:hx + p.face*dx*sc, y:hy + dy, class:"vz", "font-size":fs, style:`animation-delay:${k*0.6 + (i % 4)*0.3}s`}, zz); t.textContent = "z"; });
    }
    p.head = p.y - 72 * sc; p.sc = sc;
    p.body = {x:p.x - 26*sc, y:p.head - 4, w:52*sc, h:p.y + 36*sc - p.head + 4};   /* keep bubbles off everyone's face */
  });
  /* place each speech bubble above its speaker, nudging it up or sideways until it doesn't cover another bubble */
  placed.slice().filter(p => !p.asleep).sort((a, b) => b.y - a.y).forEach((p, i) => {
    const w = 150, h = 60;
    let best = null;
    const others = placed.filter(q => q !== p).map(q => q.body);
    for (let lift = 0; lift <= 320 && !best; lift += 10){
      for (const dx of [-p.face * 26, p.face * 40, -p.face * 90, p.face * 100, 0]){
        const r = {x: Math.max(20, Math.min(VW - w - 20, p.x - w/2 + dx)), y: p.head - h - 14 - lift, w, h};
        if (r.y < 560) continue;
        if (!boxes.some(b => hit(b, r)) && !others.some(b => hit(b, r))){ best = r; break; }
      }
    }
    if (!best) best = {x: Math.max(20, Math.min(VW - w - 20, p.x - w/2)), y: p.head - h - 16, w, h};
    boxes.push(best);
    bubble(tails, talk, p.x, p.head, speech(p.h), best, i);
  });
  /* shrink any writing that would spill out of its banner, scroll or bubble */
  requestAnimationFrame(() => fitText(host));
  /* manuscript border */
  sv("rect", {x:5, y:5, width:VW - 10, height:VH - 10, fill:"none", stroke:"#c9a24a", "stroke-width":"4", rx:10}, s);
  sv("rect", {x:13, y:13, width:VW - 26, height:VH - 26, fill:"none", stroke:"#5a4128", "stroke-width":"1.5", rx:6}, s);
  /* small-screen copy of the writing, since SVG text gets tiny on phones */
  const notes = $("village-notes"); notes.textContent = "";
  const j = mk("div", "vn-julie"); j.append(mk("b", null, "For Julie: "), document.createTextNode(jtext)); notes.appendChild(j);
  TEAMS.forEach(team => { const d = mk("div", "vn-team"); d.append(mk("b", null, team.name + ": "), document.createTextNode(storyCache.get(storyKey(team)) || localStory(team))); notes.appendChild(d); });
  const foot = $("village-foot");
  const allClaude = TEAMS.every(t => storyCache.has(storyKey(t))) && julieCache.has(jk);
  foot.textContent = allClaude ? "The banners and the castle proclamation were written by Claude from this week's Asana work. Villagers talk about their most urgent work; those with nothing urgent are napping. Click anyone to open their character sheet."
    : villageAsking ? "Claude is writing the banners and the proclamation from this week's Asana work…"
    : "Each villager is talking about their most urgent work from Asana; those with nothing urgent are napping. Click anyone to open their character sheet.";
}
function thatchRoof(s, x, y, w, fill){ sv("path", {d:`M${x - 18} ${y} L${x + w/2} ${y - 96} L${x + w + 18} ${y} Z`, fill, stroke:"#3b2a17", "stroke-width":"2.5", "stroke-linejoin":"round"}, s); sv("path", {d:`M${x - 18} ${y} h${w + 36}`, stroke:"#3b2a17", "stroke-width":"5", "stroke-linecap":"round"}, s); }
function timbered(s, x, y, w, h){
  sv("rect", {x, y, width:w, height:h, fill:"#ece0c3", stroke:"#3b2a17", "stroke-width":"2.5"}, s);
  const beam = {stroke:"#4a3420", "stroke-width":"7", "stroke-linecap":"square"};
  sv("path", Object.assign({d:`M${x} ${y + 4} h${w} M${x} ${y + h/2} h${w} M${x + 4} ${y} v${h} M${x + w - 4} ${y} v${h}`}, beam), s);
  const n = 4, step = w / n;
  for (let i = 0; i < n; i++){
    const a = x + i*step, b = a + step;
    sv("path", Object.assign({d:`M${a} ${y} V${y + h/2} M${a} ${y} L${b} ${y + h/2} M${b} ${y} L${a} ${y + h/2}`}, beam, {"stroke-width":"5"}), s);
  }
}
function arched(s, x, y, w, h, fill){ sv("path", {d:`M${x} ${y + h} v${-(h - w/2)} a${w/2} ${w/2} 0 0 1 ${w} 0 v${h - w/2} Z`, fill, stroke:"#2b1d08", "stroke-width":"2.5"}, s); }
function leaded(s, x, y){ arched(s, x, y, 26, 34, "#e9cf7f"); sv("path", {d:`M${x + 13} ${y + 2} v32 M${x} ${y + 20} h26`, stroke:"#2b1d08", "stroke-width":"1.6"}, s); }
function drawSmithy(s, b){
  const top = b.y + 30;
  sv("rect", {x:b.x + b.w - 78, y:top - 104, width:34, height:96, fill:"url(#vstone)", stroke:"#5f594f", "stroke-width":"2"}, s);
  [0, 1, 2].forEach(i => sv("circle", {class:"smoke", cx:b.x + b.w - 61, cy:top - 112, r:10 + i*4, fill:"#d9d3c7", style:`animation-delay:${i*1.1}s`}, s));
  thatchRoof(s, b.x, top, b.w, "url(#vthatch)");
  sv("rect", {x:b.x, y:top + b.h/2 - 10, width:b.w, height:b.h/2 - 20, fill:"url(#vstone)", stroke:"#5f594f", "stroke-width":"2.5"}, s);
  timbered(s, b.x, top, b.w, b.h/2 - 10);
  arched(s, b.x + b.w/2 - 40, b.y + b.h - 96, 80, 96, "#3b2a17");
  sv("path", {class:"forge", d:`M${b.x + b.w/2 - 30} ${b.y + b.h} v-46 a30 30 0 0 1 60 0 v46 Z`, fill:"#ff8a3a", opacity:".55"}, s);
  sv("path", {d:`M${b.x + 42} ${b.y + b.h + 4} h40 l-7 -11 h12 v-9 h-50 v9 h12 z`, fill:"#3b3a36", stroke:"#1b1209", "stroke-width":"1.5"}, s);
  sv("path", {d:`M${b.x + 28} ${b.y + b.h - 50} l16 -26 M${b.x + 40} ${b.y + b.h - 50} l-12 -24`, stroke:"#5a5d62", "stroke-width":"4", "stroke-linecap":"round"}, s);   /* crossed tools on the wall */
}
function drawGuildhall(s, b){
  const top = b.y + 40;
  sv("path", {d:`M${b.x - 18} ${top} L${b.x + b.w/2} ${top - 92} L${b.x + b.w + 18} ${top} Z`, fill:"url(#vslate)", stroke:"#2d3138", "stroke-width":"2.5", "stroke-linejoin":"round"}, s);
  const cx = b.x + b.w/2, cy = top - 36;
  sv("circle", {cx, cy, r:19, fill:"#efe3c8", stroke:"#2b1d08", "stroke-width":"2.5"}, s);
  for (let k = 0; k < 12; k++){ const a = k * Math.PI / 6; sv("path", {d:`M${(cx + 14*Math.sin(a)).toFixed(1)} ${(cy - 14*Math.cos(a)).toFixed(1)} L${(cx + 17*Math.sin(a)).toFixed(1)} ${(cy - 17*Math.cos(a)).toFixed(1)}`, stroke:"#2b1d08", "stroke-width":"1.5"}, s); }
  const now = new Date(), hr = (now.getHours() % 12 + now.getMinutes()/60) * 30, mn = now.getMinutes() * 6;
  sv("path", {d:`M${cx} ${cy} l${(8*Math.sin(hr*Math.PI/180)).toFixed(1)} ${(-8*Math.cos(hr*Math.PI/180)).toFixed(1)}`, stroke:"#2b1d08", "stroke-width":"3", "stroke-linecap":"round"}, s);
  sv("path", {d:`M${cx} ${cy} l${(12*Math.sin(mn*Math.PI/180)).toFixed(1)} ${(-12*Math.cos(mn*Math.PI/180)).toFixed(1)}`, stroke:"#2b1d08", "stroke-width":"2", "stroke-linecap":"round"}, s);
  timbered(s, b.x, top, b.w, b.h/2 - 18);
  sv("rect", {x:b.x, y:top + b.h/2 - 18, width:b.w, height:b.h/2 - 22, fill:"url(#vstone)", stroke:"#5f594f", "stroke-width":"2.5"}, s);
  [b.x + 26, b.x + 74, b.x + b.w - 100, b.x + b.w - 52].forEach(x => leaded(s, x, b.y + b.h - 70));
  arched(s, b.x + b.w/2 - 42, b.y + b.h - 104, 84, 104, "#4a3420");
  sv("path", {d:`M${b.x + b.w/2} ${b.y + b.h - 104} v104`, stroke:"#2b1d08", "stroke-width":"2"}, s);
  [-14, 14].forEach(d => sv("circle", {cx:b.x + b.w/2 + d, cy:b.y + b.h - 44, r:3, fill:"#c9a24a"}, s));
  sv("rect", {x:b.x - 14, y:b.y + b.h, width:b.w + 28, height:12, fill:"url(#vstone)", stroke:"#5f594f", "stroke-width":"1.5"}, s);
}
function drawPost(s, b){
  const top = b.y + 30;
  thatchRoof(s, b.x, top, b.w, "url(#vtile)");
  timbered(s, b.x, top, b.w, b.h/2 - 10);
  sv("rect", {x:b.x, y:top + b.h/2 - 10, width:b.w, height:b.h/2 - 20, fill:"#ece0c3", stroke:"#3b2a17", "stroke-width":"2.5"}, s);
  arched(s, b.x + b.w/2 - 34, b.y + b.h - 92, 68, 92, "#4a3420");
  leaded(s, b.x + 36, b.y + b.h - 72); leaded(s, b.x + b.w - 62, b.y + b.h - 72);
  const dx = b.x + b.w - 90, dy = top - 74;
  sv("rect", {x:dx, y:dy, width:44, height:36, fill:"#ece0c3", stroke:"#3b2a17", "stroke-width":"2"}, s);
  sv("path", {d:`M${dx - 6} ${dy} L${dx + 22} ${dy - 22} L${dx + 50} ${dy} Z`, fill:"url(#vtile)", stroke:"#3b2a17", "stroke-width":"2"}, s);
  [10, 26].forEach(o => arched(s, dx + o, dy + 12, 10, 14, "#2b1d08"));
  /* hanging sign with a sealed letter */
  sv("path", {d:`M${b.x + 20} ${top + 8} h46 M${b.x + 30} ${top + 8} v10 M${b.x + 58} ${top + 8} v10`, stroke:"#3b2a17", "stroke-width":"3"}, s);
}
function drawWell(s, x, y){
  sv("ellipse", {cx:x, cy:y + 30, rx:46, ry:12, fill:"#2b1d08", opacity:".25"}, s);
  sv("path", {d:`M${x - 40} ${y} v28 a40 10 0 0 0 80 0 v-28`, fill:"url(#vstone)", stroke:"#5f594f", "stroke-width":"2"}, s);
  sv("ellipse", {cx:x, cy:y, rx:40, ry:10, fill:"#3b4f5c", stroke:"#5f594f", "stroke-width":"2"}, s);
  sv("path", {d:`M${x - 34} ${y} v-54 M${x + 34} ${y} v-54`, stroke:"#4a3420", "stroke-width":"6"}, s);
  sv("path", {d:`M${x - 48} ${y - 50} L${x} ${y - 80} L${x + 48} ${y - 50} Z`, fill:"url(#vthatch)", stroke:"#3b2a17", "stroke-width":"2"}, s);
  sv("path", {d:`M${x - 34} ${y - 44} h68`, stroke:"#4a3420", "stroke-width":"4"}, s);
  sv("path", {d:`M${x} ${y - 44} v22`, stroke:"#6b5330", "stroke-width":"1.5"}, s);
  sv("path", {d:`M${x - 8} ${y - 22} h16 l-2 12 h-12 Z`, fill:"#7d5a33", stroke:"#3b2a17", "stroke-width":"1.5"}, s);
}
function drawStall(s, x, y, color){
  sv("path", {d:`M${x - 60} ${y} v-56 M${x + 60} ${y} v-56`, stroke:"#4a3420", "stroke-width":"5"}, s);
  const g = sv("g", null, s);
  for (let i = 0; i < 6; i++) sv("path", {d:`M${x - 66 + i*22} ${y - 56} h22 v18 q-11 8 -22 0 Z`, fill: i % 2 ? "#efe3c8" : color, stroke:"#3b2a17", "stroke-width":"1.2"}, g);
  sv("rect", {x:x - 56, y:y - 24, width:112, height:24, fill:"#7d5a33", stroke:"#3b2a17", "stroke-width":"2"}, s);
  [[-36, "#c0442e"], [-12, "#c9a24a"], [12, "#4f6a34"], [36, "#9a3a26"]].forEach(([dx, c]) => sv("circle", {cx:x + dx, cy:y - 28, r:7, fill:c, stroke:"#3b2a17", "stroke-width":"1"}, s));
}
function drawBarrels(s, x, y){ [[0, 0], [30, 4], [15, -26]].forEach(([dx, dy]) => { sv("rect", {x:x + dx - 13, y:y + dy - 30, width:26, height:30, rx:6, fill:"#8a5a33", stroke:"#3b2a17", "stroke-width":"1.6"}, s); sv("path", {d:`M${x + dx - 13} ${y + dy - 22} h26 M${x + dx - 13} ${y + dy - 8} h26`, stroke:"#3b3a36", "stroke-width":"2.4"}, s); }); }
function drawHay(s, x, y){ sv("rect", {x:x - 30, y:y - 26, width:60, height:28, rx:5, fill:"url(#vthatch)", stroke:"#6b5330", "stroke-width":"1.6"}, s); sv("path", {d:`M${x - 14} ${y - 26} v28 M${x + 14} ${y - 26} v28`, stroke:"#6b5330", "stroke-width":"2"}, s); }
function drawTorch(s, x, y){ sv("path", {d:`M${x} ${y} v-60`, stroke:"#3b2a17", "stroke-width":"5"}, s); sv("path", {d:`M${x - 7} ${y - 60} h14 l-3 -8 h-8 Z`, fill:"#3b3a36"}, s); sv("path", {class:"flame", d:`M${x} ${y - 90} q10 12 0 22 q-10 -10 0 -22 Z`, fill:"#ff9a3a"}, s); }
