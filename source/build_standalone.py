import re
s=open('ops-catan.html').read()
copy=[
 ("Asana needs reconnecting. Reconnect it in claude.ai Settings → Connectors, then post again.","Asana rejected your token. Press Disconnect at the top, connect again with a fresh token, then post again."),
 ("Asana isn't connected. Add it in claude.ai Settings → Connectors.","Connect to Asana first, using the Connect button at the top of the page."),
 ("Posting only works when the page is open inside Claude.","Connect to Asana first, using the Connect button at the top of the page."),
 ("Showing the last board you loaded in this browser. Open it inside Claude to refresh.","Showing the last board you loaded in this browser. Connect to Asana to refresh it."),
 ("Open it inside Claude, with the Asana connector added, to deal the tiles.","Connect to Asana to deal the tiles."),
 ("Reconnect Asana in claude.ai Settings → Connectors, then press Reroll.","Your token was rejected. Press Disconnect at the top and connect again with a fresh token."),
 ("Add the Asana connector in claude.ai Settings → Connectors, then press Reroll.","Connect to Asana using the button at the top, then press Reroll."),
 ("Open the board in Claude to refresh it.","Connect to Asana to refresh it."),
 ("Saving needs the page open inside Claude.","Connect to Asana to make changes."),
 ("Open this page inside Claude to see and edit the shared guild.","Connect to Asana to see and edit the shared guild."),
 ("The ledger isn't available in this view anymore. Reload the page.","Asana stopped accepting your token. Disconnect and connect again with a fresh token."),
 ("Your access to this page is view-only, so the guild can't be changed here.","Asana refused that change. Make sure you're a member of the Guild Hall Ledger project in Asana."),
]
for a,b in copy:
    n=s.count(a); assert n>=1,(a); s=s.replace(a,b)
assert s.count('    <div class="controls">')==1
conn=open('standalone_connect.html').read()
acct, modal = conn.split('<div class="connect-back"',1)
s=s.replace('    <div class="controls">', acct+'    <div class="controls">',1)
s=s.replace('<div class="tip" id="tip" hidden></div>','<div class="tip" id="tip" hidden></div>\n<div class="connect-back"'+modal,1)
css='''
/* ---------- standalone: Asana connection ---------- */
body{margin:0}
.acct{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--muted);background:rgba(0,0,0,.22);border:1px solid var(--panel-line);border-radius:999px;padding:4px 4px 4px 12px}
.acct button{font-size:12.5px;padding:3px 10px;border-radius:999px}
.connect-back{position:fixed;inset:0;z-index:30;background:rgba(4,16,26,.75);display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto}
.connect{width:100%;max-width:520px;background:var(--parch);color:var(--parch-ink);border:3px solid var(--frame);border-radius:14px;padding:18px 20px;box-shadow:0 18px 40px rgba(0,0,0,.45);display:flex;flex-direction:column;gap:8px;font-size:14.5px;line-height:1.45}
.connect h3{margin:0;font-family:var(--f-display);font-weight:800;font-size:24px}
.connect p{margin:0}
.connect ol{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:3px}
.connect a{color:#7a3c12;font-weight:700}
.connect input{font:inherit;font-size:15px;color:var(--parch-ink);background:#fffaf0;border:1.5px solid #b89a63;border-radius:8px;padding:8px 10px;width:100%;box-sizing:border-box}
.connect input:focus-visible{outline:3px solid var(--brick);outline-offset:1px}
.connect button{border-color:#6b5330;background:var(--brick);color:#fff}
.connect .fine{font-size:12.5px;color:#6b5330}
'''
s=s.replace('</style>',css+'</style>',1)
i=s.index('<script>'); s=s[:i]+open('standalone_shim.js').read()+'\n'+s[i:]
s=s.rstrip()+'''
<script>
/* ---------- standalone: connect / disconnect ---------- */
(function(){
  const $ = id => document.getElementById(id);
  const B = window.asanaBridge;
  if (!B.connected()){
    $("connect").hidden = false;
    setTimeout(() => $("connect-token").focus(), 0);
  } else {
    $("acct").hidden = false;
    B.me().then(m => { $("acct-who").textContent = "Connected to Asana as " + (m.name || "you"); }).catch(() => {});
  }
  $("acct-out").addEventListener("click", () => { B.disconnect(); location.reload(); });
  $("connect-form").addEventListener("submit", async ev => {
    ev.preventDefault();
    const t = $("connect-token").value.trim(), st = $("connect-status");
    if (!t){ st.className = "cmt-status err"; st.textContent = "Paste your Asana token first."; return; }
    $("connect-go").disabled = true; st.className = "cmt-status"; st.textContent = "Checking with Asana…";
    try{ const me = await B.connect(t); st.className = "cmt-status ok"; st.textContent = "Welcome, " + (me.name || "settler") + "! Dealing the board…"; setTimeout(() => location.reload(), 700); }
    catch(e){ st.className = "cmt-status err"; st.textContent = e.code === "needs_reauth" ? "Asana didn't accept that token. Check you copied all of it, or create a new one." : (e.message || "Couldn't reach Asana."); $("connect-go").disabled = false; }
  });
})();
</script>
'''
head='<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<meta name="robots" content="noindex">\n'
s=head+s+'\n</html>\n'
open('standalone/index.html','w').write(s)
for k,blk in enumerate(re.findall(r'<script>(.*?)</script>',s,re.S)): open(f'st{k}.js','w').write(blk)
print(len(s))
