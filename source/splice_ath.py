# Puts ath.css, ath.html and ath.js (The Lost Athenaeum tab) into ops-catan.html. Safe to run again after edits.
import re
h = open("ops-catan.html").read(); css = open("ath.css").read(); html = open("ath.html").read(); js = open("ath.js").read()
# styles
if "/* ---------- The Lost Athenaeum ---------- */" in h:
    a = h.index("/* ---------- The Lost Athenaeum ---------- */"); b = h.index("</style>", a); h = h[:a] + css + h[b:]
else:
    i = h.index("</style>"); h = h[:i] + css + h[i:]
# fonts for the crypt
if "family=Cinzel" not in h:
    h = h.replace("&family=MedievalSharp&display=swap", "&family=MedievalSharp&family=Cinzel:wght@500;700&family=IM+Fell+English:ital@0;1&display=swap", 1)
# tab button
if 'id="tabbtn-athenaeum"' not in h:
    i = h.index('id="tabbtn-trade"'); j = h.index("</button>", i) + len("</button>")
    btn = '\n    <button class="tab" role="tab" id="tabbtn-athenaeum" aria-controls="tab-athenaeum" aria-selected="false" type="button" tabindex="-1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="6" width="18" height="7" rx="3.5"/><path d="M14 6v7"/><path d="M8 13v4l2-1.2 2 1.2v-4"/></svg>The Lost Athenaeum</button>'
    h = h[:j] + btn + h[j:]
# panel
if '<section id="tab-athenaeum"' in h:
    a = h.index('  <section id="tab-athenaeum"'); b = h.index("</section>", a) + len("</section>"); h = h[:a] + html.rstrip("\n") + h[b:]
else:
    i = h.index('<section id="tab-trade"'); j = h.index("\n  </section>", i) + len("\n  </section>")
    h = h[:j] + "\n" + html.rstrip("\n") + h[j:]
h = h.replace('const TABS = ["board", "guild", "village", "trade"];', 'const TABS = ["board", "guild", "village", "trade", "athenaeum"];')
# script
marker = "/* ================= The Lost Athenaeum"
if marker in h:
    i = h.rindex("<script>", 0, h.index(marker)); j = h.index("</script>", i) + len("</script>"); h = h[:i] + "<script>\n" + js + "</script>" + h[j:]
else:
    k = h.rindex("</script>") + len("</script>"); h = h[:k] + "\n<script>\n" + js + "</script>" + h[k:]
open("ops-catan.html", "w").write(h)
print("spliced athenaeum")
