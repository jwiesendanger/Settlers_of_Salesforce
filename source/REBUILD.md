# Rebuilding Settlers of Salesforce Ops

`index.html` at the repo root is the live GitHub Pages site. This folder holds the source used to make it.

| File | What it is |
|---|---|
| `ops-catan.html` | Master page (the Claude artifact version). Board, Treasure Hoard, Guild Hall and Village Square all live here. |
| `village2.js` | Source of the Village Square script. It is already inside `ops-catan.html`; edit it here and splice it back between `/* ================= Village Square` and `$("tabbtn-village").addEventListener(...)`. |
| `trade.js` | Source of the Trade Map script, the last `<script>` block in `ops-catan.html`. Edit it here and paste it back over that block. The starting settlements and routes are `SEED_S` and `SEED_R` at the top. |
| `trade.css` | Styles for the Trade Map. |
| `trade_ores.js` | The mines recreated from the Ed Cloud Data Dictionary, with their tables. Made by `gen_ores.py`. |
| `gen_ores.py` | Rebuilds `trade_ores.js` from the data dictionary workbook: `python3 gen_ores.py "Ed_Cloud_Data_Dictionary.xlsx"`. Red tabs become mines that feed Name Sources, teal tabs mines that feed HANA. |
| `splice_trade.py` | Puts `trade.css`, `trade_ores.js` and `trade.js` into `ops-catan.html`. Run it after changing any of them, then run `build_standalone.py`. |
| `ath.js`, `ath.css`, `ath.html` | The Lost Athenaeum tab (scrolls from the Knowledge section of John's My Tasks). |
| `splice_ath.py` | Puts the three Athenaeum files into `ops-catan.html`. Run it after changing any of them, then run `build_standalone.py`. |
| `standalone_shim.js` | Asana bridge for the GitHub version (personal access token, ledger-project storage). |
| `standalone_connect.html` | The "Connect to Asana" dialog for the GitHub version. |
| `build_standalone.py` | Turns `ops-catan.html` into the GitHub version. |

## Rebuild the GitHub version

From this folder:

```
mkdir -p standalone
python3 build_standalone.py
```

That writes `standalone/index.html`; copy it to the repo root as `index.html`.

## Restore the Claude version

Give Claude `ops-catan.html` and ask it to publish it as an artifact with these capabilities:
Asana connector tools `get_users`, `search_tasks`, `add_comment`; a shared database; downloads; and asking Claude (for hover briefings, team stories and Julie's headline).
Guild Hall data: the GitHub version stores it in Asana, in the project "Guild Hall Ledger (Settlers of Salesforce Ops)", so it survives anything. The Claude version stores its own, separate copy in the artifact's database.
