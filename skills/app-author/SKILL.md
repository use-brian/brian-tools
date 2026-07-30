---
name: app-author
description: Build a custom Home app for Use Brian — a small static web app (HTML/CSS/JS plus a brian-app.json manifest) that renders full-page on the Home strip and reads the workspace brain through a scoped bridge. Use when the user wants a dashboard, board, or internal tool inside Use Brian, wants to turn a spreadsheet or report into a live view over their brain, or is fixing an app that will not load or was taken off Home.
license: MIT
compatibility: Designed for Use Brian
metadata:
  author: Use Brian
  category: productivity
  when_to_use: When the user wants a custom view inside Use Brian - a dashboard over their tasks/CRM/memories, a small internal tool, or a fix to an app that stopped rendering. Skip for ordinary web apps that do not run inside Use Brian, and for browser automation (that is browser-skill-author).
  tags: official
---

# Custom Home app authoring

A **custom Home app** is a small static web app that renders full-page in a
slot on the Use Brian Home strip and reads the workspace brain through a scoped
bridge. This skill covers the **artifact contract** (manifest, bundle,
bridge) and the **judgement calls** that decide whether an app gets approved
and stays approved.

## Fast paths

- **New app:** [`use-brian/brian-app-template`](https://github.com/use-brian/brian-app-template) —
  click **Use this template** (or `gh repo create my-app --template use-brian/brian-app-template`).
  Then in Use Brian: **Studio → Mini apps → Custom → Add from GitHub**.
- **No repo wanted:** ask the assistant in chat. It writes the same bundle
  through `writeHomeApp`, and you iterate conversationally.
- **Checking a bundle:** `npx @use-brian/brian-app lint` — the same validator
  the importer runs.

## Scope

This skill does **not** grant an app access (only a workspace owner/admin can,
on the consent screen), host anything outside the bundle, run a build step, or
give an app a server. It is not for browser automation — that is
`browser-skill-author`.

## Mental model

| | Custom Home app | Browser skill | Workflow |
|---|---|---|---|
| Is | A page a person opens | Code that drives a browser | Steps that run on a trigger |
| Runs | In the viewer's browser, sandboxed | On a cloud/local browser | Server-side |
| Reads the brain via | The bridge token (brain MCP) | The runner's tools | Step inputs |
| Approved by | An admin granting scopes | An admin granting the skill on a profile | Workflow approval |

Reach for an app when someone wants to **look at** something regularly. Reach
for a workflow when something should **happen** on its own.

## The artifact

Three things, nothing else:

```
brian-app.json     the manifest — required
index.html         the entry — required (any name the manifest points at)
assets/**          CSS, JS, images, fonts — optional
```

No build step, no server, no install. Whatever is in the repo is what runs.
Files that cannot be served (`README.md`, `LICENSE`, CI config, lockfiles) are
ignored, so an ordinary repo is fine.

Limits: **100 files, 5 MB total, 2 MB per file.** If you are near them, you are
probably shipping a framework you do not need — these apps are small on
purpose.

### The manifest

```jsonc
{
  "manifestVersion": 1,
  "name": "Pipeline board",
  "description": "This quarter's deals, by stage",
  "icon": "Users",              // a lucide icon name
  "entry": "index.html",
  "scopes": {
    "data": "read",             // "read" | "read_write"
    "identity": false,          // release the viewer's display NAME
    "net": []                   // extra origins the app may fetch from
  }
}
```

Unknown top-level fields are kept as metadata, so a newer template will not
break an older server. Unknown keys **inside `scopes`** are a hard error — a
permission this build cannot show on a consent screen must never be silently
accepted.

## Scopes are the part that matters

`scopes` is the text a workspace owner or admin reads before deciding whether
to run your code against their company's data. Everything else in the app is
implementation; this is the ask.

**Ask for the least that works.**

- `data: "read"` reaches no write tool at all. Use it unless the app genuinely
  writes. `read_write` is a materially harder approval and should buy something
  the user asked for.
- `identity` is only the viewer's **name**. Your app can already tell viewers
  apart — a stable `userId` rides the bridge token — so you need this only to
  *display* who someone is.
- `net` origins must be bare `https://host`: no path, no wildcard. Default to
  none. The bridge already reaches the brain, and every extra origin is one
  more place workspace data can go. `https://*.example.com` is rejected on
  purpose: it would grant a whole subdomain tree while the consent screen shows
  one line.

**Widening scopes takes the app off Home.** A sync that brings a manifest
asking for more than was granted drops the app to *needs approval* and it
disappears from the strip until an admin re-approves. This is deliberate: a
push must not be able to widen what your code can reach. Plan for it — ship
features freely, and batch scope changes into a moment when you can tell the
admin why.

## The sandbox, and what follows from it

The app runs in an iframe **without `allow-same-origin`**, at an opaque origin:

- **no cookies**
- **no localStorage / sessionStorage / IndexedDB**
- **no access to the page around it**

This is not a restriction to work around; it is why a workspace can run your
code at all. Three consequences shape every app:

1. **You get data through the bridge**, not through your own fetch to some API.
2. **You persist through bridge KV**, not through storage.
3. **You navigate by asking the host**, not by setting `location`.

### Handshake

```js
const ctx = await new Promise((resolve) => {
  window.addEventListener("message", (e) => {
    if (e.data?.type === "ub:token" && e.data.token) resolve(e.data);
  });
  parent.postMessage({ type: "ub:ready" }, "*");
});
// ctx = { token, apiOrigin, appId, workspaceId }
```

The token is short-lived. Post `{ type: "ub:ready" }` or
`{ type: "ub:token" }` again to refresh; the host also refreshes on its own, so
a long-lived dashboard does not go stale.

### Reading the brain

The token authenticates against the **brain MCP server** — the same surface an
API key gets, gated to the scope the admin approved:

```js
const res = await fetch(`${ctx.apiOrigin}/api/brain/mcp`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${ctx.token}`,
  },
  body: JSON.stringify({
    jsonrpc: "2.0", id: 1, method: "tools/call",
    params: { name: "searchBrain", arguments: { query: "open deals" } },
  }),
});
```

Useful tools: `searchBrain`, `listTasks`, `getTask`, `listContacts`,
`listCompanies`, `listDeals`, `readPage`, `listPages`, `fileSearch`,
`fileRead`. With `read_write`, the matching write tools appear too.

Results are **clearance-filtered per viewer**. Two people can open the same app
and see different rows. Do not cache one viewer's results into workspace-scoped
state.

### Persisting

```js
// scope=user (per viewer) or scope=workspace (shared). 256 KB each.
await fetch(`${ctx.apiOrigin}/api/home-apps/${ctx.appId}/state?scope=user`, {
  method: "PUT",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${ctx.token}` },
  body: JSON.stringify({ data: { lastTab: "deals" } }),
});
```

### Navigating

```js
parent.postMessage({ type: "ub:navigate", path: `/w/${ctx.workspaceId}/tasks` }, "*");
```

In-app paths inside your own workspace only. Anything else is ignored.

## Writing the app itself

- **Follow the viewer's theme.** `color-scheme: light dark` plus `Canvas` /
  `CanvasText` is enough. An app that hard-codes white is the one thing on the
  page ignoring the user's choice.
- **Fail visibly.** A blank app is indistinguishable from a broken one — if a
  call fails, say so on screen.
- **Every bridge call spends daily budget.** Poll on a human cadence, not a
  frame loop.
- **No framework unless it earns its bytes.** Under the 5 MB cap, plain modules
  usually win, and there is no build step to lean on.

## Shipping

1. `npx @use-brian/brian-app lint` — schema errors are fatal, advisory findings
   are worth reading.
2. Push. The workspace syncs within 15 minutes, or an admin hits **Sync now**.
3. An admin approves it in **Studio → Mini apps → Custom**.
4. It appears on Home once an admin adds it to the strip in the same tab.

## When an app will not load

| Symptom | Cause |
|---|---|
| "Waiting for approval" | Nobody has granted it yet, or it just widened its scopes |
| "This app is turned off" | An admin disabled it |
| "This app could not be loaded" | The last sync failed — the reason is on the card in Studio |
| Approved but not on Home | Approval and *being on the strip* are separate: add it in the same Studio tab |
| A fetch fails with 429 | The daily bridge budget is spent |
| A fetch to your own API fails | That origin is not in `scopes.net`, or the app was approved before you added it |
