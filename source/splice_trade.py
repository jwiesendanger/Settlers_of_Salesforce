# Puts trade.css, trade_ores.js and trade.js into ops-catan.html (run after editing any of them).
h = open("ops-catan.html").read(); js = open("trade.js").read(); css = open("trade.css").read(); ores = open("trade_ores.js").read()
a = h.index("/* ---------- Trade Map ---------- */"); b = h.index("</style>", a); h = h[:a] + css + h[b:]
if "window.__TRADE_ORES" in h:
    i = h.index("<script>\n/* Mines recreated"); j = h.index("</script>", i) + len("</script>"); h = h[:i] + h[j:].lstrip("\n")
i = h.index("<script>\n(function(){\n/* ================= Trade Map"); j = h.index("</script>", i)
h = h[:i] + "<script>\n" + ores + "</script>\n<script>\n" + js + h[j:]
open("ops-catan.html", "w").write(h)
print("spliced")
