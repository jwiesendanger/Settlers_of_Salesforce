# Settlers of Salesforce Ops

A Catan-style view of the Enterprise Salesforce Ops Group's Asana work, plus the Guild Hall org chart of responsibilities. It's one static page (`index.html`) with no server and no build step.

## How it works

- Each person connects with their own **Asana personal access token** the first time they open the page. The token is saved only in that browser's local storage and is sent only to `app.asana.com`.
- **The Board** and **The Treasure Hoard** read open and recently completed tasks live from Asana.
- Clicking a block lets you comment on the task in Asana (posted under your own name) or open it.
- **Guild Hall** data (responsibilities, recruits, dismissals, class changes) is stored as tasks in the Asana project **Guild Hall Ledger (Settlers of Salesforce Ops)**, so everyone sees the same thing. To edit it, a person needs access to that project. It's private to the Enterprise Salesforce Operations Group team.

## Hosting on GitHub Pages

1. Put `index.html` (and this README) at the root of a repository.
2. In the repository, open **Settings → Pages**, choose **Deploy from a branch**, then pick `main` and `/ (root)`.
3. Share the `https://<user-or-org>.github.io/<repo>/` link.

The page includes the team's names and job titles in its code. If the repository is public, anyone can read them. A private repository with Pages needs a paid GitHub plan; alternatively, host the file on an internal web server or SharePoint site.

## Settings in the code

Near the top of the first `<script>` in `index.html`, `CONFIG` holds:

| Setting | Value |
|---|---|
| Workspace | `71309345811105` |
| Guild Hall Ledger project | `1219951921516481` |
| Ledger sections | Responsibilities `1219952038707160`, Heroes `1219951921525417` |

The Asana team (`1209091985508243`) and the people left off the board are set further down, as `TEAM_GID` and `EXCLUDE`. The starting org chart is the `BASE` list in the Guild Hall script.

## Notes

- Don't hand-edit the line starting with `guild:` in a ledger task's description. The page reads it.
- Disconnect (top of the page) clears the token from that browser. Revoke tokens anytime in Asana's developer console.
- The Guild Hall checks for other people's changes every 30 seconds while the page is open.
