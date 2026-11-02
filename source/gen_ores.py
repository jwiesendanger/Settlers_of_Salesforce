# Builds trade_ores.js from the Ed Cloud data dictionary: red tabs -> mines feeding "Name Sources", teal tabs -> mines feeding HANA.
import openpyxl, json, datetime, math, re, sys
SRC = sys.argv[1] if len(sys.argv) > 1 else "xl/dd.xlsx"
wb = openpyxl.load_workbook(SRC, data_only=True)
RED = {"FFCC0000"}; TEAL = {"FF00FFFF", "FF16E6F6"}
def val(v):
    if v is None: return ""
    if isinstance(v, (datetime.datetime, datetime.date)): return v.strftime("%Y-%m-%d")
    if isinstance(v, float) and v.is_integer(): v = int(v)
    s = str(v).strip()
    return "" if s == "0" else s          # formulas pointing at blank cells show up as 0
NICE = {"Slate Grad App Starters DEPRECA": "Slate Grad App Starters (deprecated)",
        "Slate Grad App Completers DEPRE": "Slate Grad App Completers (deprecated)",
        "high school contact affliliatio": "high school contact affiliation",
        "SIR - GPA Source Code Conversio": "SIR - GPA Source Code Conversion"}
ores = []
for ws in wb.worksheets:
    c = ws.sheet_properties.tabColor; rgb = c.rgb if c is not None and c.type == "rgb" else None
    grp = "red" if rgb in RED else "teal" if rgb in TEAL else None
    if not grp: continue
    rows = [[val(v) for v in r] for r in ws.iter_rows(values_only=True)]
    rows = [r for r in rows if any(r)]
    used = [j for j in range(max((len(r) for r in rows), default=0)) if any(j < len(r) and r[j] for r in rows)]
    rows = [[r[j] if j < len(r) else "" for j in used] for r in rows]
    caption = ""
    if len(rows) > 1 and sum(1 for x in rows[0] if x) == 1:   # a title line above the real headings
        caption = next(x for x in rows[0] if x); rows = rows[1:]
    ores.append({"tab": ws.title, "grp": grp, "rows": rows, "caption": caption})

# existing settlements on the 3000x2000 map (seed spots + offset), used to keep clear of them
EXIST = {"sf":(1500,995),"radar":(1230,1560),"hana":(1115,995),"slate":(1340,1290),"transfer":(1600,1312),"ukinvests":(1200,790),
 "scoir":(1465,1322),"evertrue":(1480,1600),"mc":(1862,935),"sms":(1814,1102),"outlook":(1780,760),"bookings":(1890,1280),
 "eventbrite":(1685,1228),"irads":(1485,708),"iers":(1370,778),"cloudingo":(1595,812),"five9":(1972,1010),"icims":(1962,812)}
boxes = [(x, y, 190) for (x, y) in EXIST.values()]
def width(name): return max(60, len(name) * 7.6 + 22) + 30
def free(x, y, w):
    if not (200 < x - w/2 and x + w/2 < 2800 and 230 < y < 1800): return False
    for (bx, by, bw) in boxes:
        if abs(x - bx) < (w + bw) / 2 + 14 and abs(y - by) < 96: return False
    return True
def place(names, cx, cy, a0, a1, r0):
    out = []
    for nm in names:
        w = width(nm); done = False; r = r0
        while not done and r < 1400:
            steps = max(8, int(abs(a1 - a0) * math.pi / 180 * r / 12))
            for k in range(steps + 1):
                a = math.radians(a0 + (a1 - a0) * k / steps)
                x, y = cx + r * math.cos(a), cy + r * .78 * math.sin(a)
                if free(x, y, w): out.append((round(x), round(y))); boxes.append((x, y, w)); done = True; break
            r += 40
        if not done: raise SystemExit("no room for " + nm)
    return out
NS = (720, 560)   # the Name Sources town, in the open north-west
boxes.append((NS[0], NS[1], 200))
red = [o for o in ores if o["grp"] == "red"]; teal = [o for o in ores if o["grp"] == "teal"]
import os as _os
from importlib.machinery import SourceFileLoader as _L
_tc = _L("tc", _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), "tc.py")).load_module()
for o in ores: o["name"] = _tc.title(NICE.get(o["tab"], o["tab"]))
pr = place([o["name"] for o in red], NS[0], NS[1], -200, 160, 230)
pt = place([o["name"] for o in teal], 1115, 995, 122, 212, 250)
S, R, T = [], [], []
S.append({"id":"names", "name":"Name Sources", "kind":"system", "blurb":"Purchased lists, search services and Slate feeds, from the Ed Cloud data dictionary.", "x":NS[0], "y":NS[1]})
def slug(s): return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:40]
for o, (x, y) in list(zip(red, pr)) + list(zip(teal, pt)):
    sid = "o-" + slug(o["tab"]); to = "names" if o["grp"] == "red" else "hana"
    retired = "DEPRE" in o["tab"]
    blurb = ("Name source" if o["grp"] == "red" else "HANA view") + (" (deprecated)" if retired else "") + ". Mapping from the Ed Cloud data dictionary."
    S.append({"id":sid, "name":o["name"], "kind":"source", "blurb":blurb, "x":x, "y":y})
    R.append({"id":"r-" + sid, "name":o["name"], "from":sid, "to":to, "tool":"dataload" if o["grp"] == "red" else "view", "flow":"one", "status":"retired" if retired else "live", "note":"From the \"" + o["tab"] + "\" tab of the Ed Cloud Data Dictionary (V2.0, Oct 2023)."})
    if o["rows"]:
        T.append({"id":"t-" + sid, "mine":sid, "title":_tc.title(o["caption"] or o["name"]), "rows":o["rows"], "header":True, "createdAt":1698105600000})
js = "/* Mines recreated from the Ed Cloud Data Dictionary V2.0 (backup 10/24/2023): red tabs feed Name Sources, teal tabs feed HANA. Generated by gen_ores.py. */\nwindow.__TRADE_ORES = " + json.dumps({"settlements":S, "routes":R, "tables":T}, ensure_ascii=False, separators=(",", ":")) + ";\n"
open("trade_ores.js", "w").write(js)
print(len(red), "red", len(teal), "teal", len(T), "tables", len(js), "bytes")
