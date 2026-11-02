import re
ACR = {"HANA","SAP","RADAR","KCTCS","GSA","IRADS","IERS","UK","HR","SMS","RFI","SIR","GPA","CIP","ACT","EDC","IES","EEO","CRM","SF","API","ID","SSIS","NRCCUA","PTLW","EAPI","SAPI","HED","URL","PDF","MC","UKY"}
ACR_IF_CAPS = {"ED","FA"}
KEEP = {"icims":"iCIMS","linkblue":"linkblue","clearcost":"ClearCost","youvisit":"YouVisit","evertrue":"EverTrue","mulesoft":"MuleSoft","salesforce":"Salesforce","dempgraphics":"Demographics","affliliatio":"Affiliation","five9":"Five9","scoir":"Scoir","formassembly":"FormAssembly","rifs":"RFIs","rfis":"RFIs"}
SMALL = {"a","an","and","as","at","but","by","for","in","of","on","or","the","to","with","from","via"}
def word(w, first):
    m = re.match(r"^([^A-Za-z0-9]*)(.*?)([^A-Za-z0-9]*)$", w); pre, core, post = m.groups()
    if not core: return w
    lo = core.lower()
    if lo in KEEP: core = KEEP[lo]
    elif re.fullmatch(r"v\d+(\.\d+)*", lo): core = lo                 # version numbers: v2.0
    elif core.upper() in ACR or (core.isupper() and core in ACR_IF_CAPS): core = core.upper()
    elif re.search(r"\d", core) and not core.isalpha():
        core = re.sub(r"[a-z]+", lambda x: x.group(0).capitalize(), lo)   # 40+hrs -> 40+Hrs, ed2.0
    elif not first and lo in SMALL: core = lo
    elif core.isupper() or core.islower(): core = lo.capitalize()
    # else mixed case like ClearCost / RADAR 2.0 stays
    return pre + core + post
def title(s):
    s = re.sub(r"40\+\s*hrs", "40+ Hrs", s, flags=re.I)
    s = s.replace("_", " ").replace(".", ". ") if re.fullmatch(r"[A-Z0-9_.]+", s) else s.replace("_", " ")
    s = re.sub(r"\s+", " ", s).strip().replace(". ", " ") if re.fullmatch(r"[A-Za-z0-9 .]+", s) and s.isupper() else re.sub(r"\s+", " ", s).strip()
    parts = re.split(r"(\s+|/|-(?=[a-z]))", s)
    out = []; first = True
    for p in parts:
        if not p or re.fullmatch(r"\s+|/|-", p): out.append(p); continue
        out.append(word(p, first)); first = False
    return "".join(out)
if False:
    for t in ["address employee","SALESFORCE_CONTACT_EMPLOYEE_ALL_ASSIGNMENTS","EXTRACTS.SALESFORCE_APPLICATION","KCTCS 40+hrs","UK Invests V2.0","Slate Grad App Starters (deprecated)","join to dempgraphics","HANA Radar 2.0","Salary.com / iCIMS","Salesforce (Ed Cloud)","HANA › RADAR pipelines","uky-recruiting-event-intake-eapi","ClearCost v2","employees_paid_on_grants","Project Lead the Way","YouVisit v2","IES & Job History","Field mapping (HANA → Salesforce)","high school contact affiliation","Out of State Records Request","Slate visits Working document","name buys","Five9 status sync"]:
        print(repr(t), "->", repr(title(t)))
