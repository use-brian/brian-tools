# Static custom app bundles

Use this reference for a sandboxed screen inside Brian. The template's root is
this frontend artifact; its optional server module is deployed separately.

## Bundle and manifest

The bundle contains `brian-app.json`, its entry HTML and optional static assets.
Import runs no build, install or server process. Build locally if needed and
import the static output. GitHub import filters repository furniture such as
Markdown/CI files; explicit uploaded/assistant bundles must contain serveable
files only. Limits: 100 files, 5 MB total, 2 MB per file.

For an existing workspace-brain view:

```json
{
  "manifestVersion": 1,
  "name": "Workspace overview",
  "description": "A read-only view of authorized workspace information",
  "icon": "LayoutDashboard",
  "entry": "index.html",
  "scopes": { "data": "read", "identity": false, "net": [] }
}
```

For a **separately configured and admitted** native application, replace the
scope ceiling with exact deployed module/resource/action/field requirements:

```json
{
  "data": "none",
  "application": {
    "moduleKey": "example_module",
    "resources": [{
      "typeKey": "example_record",
      "actions": ["query", "command:change"],
      "readFields": ["title"],
      "writeFields": ["title"]
    }]
  }
}
```

This is the `scopes` value, not a second manifest or a grant. Replace all example
keys with the actual deployment catalog. `data: "none"` requires the
application-only profile and omits legacy store/agent powers. Legacy `read` and
`read_write` remain separate Brain permissions. Optional `store: "read"|"write"`
and `agent: "ask"` are independent existing consent axes, not an application
authority bypass. Store write excludes destructive operations; agent consults
remain within the app's own ceiling and spend model time.

Unknown top-level manifest fields are metadata. Unknown scope keys reject.
`identity` releases a display name, not authorization. `net` entries are exact
bare HTTPS origins without paths or wildcards. Scope widening clears renderability
until owner/admin reconsent; revocation does not preserve a grant for later reuse.

## Bridge and state

The iframe has `allow-scripts allow-forms` without `allow-same-origin`. It has no
cookies, browser storage or access to surrounding UI. Keep that sandbox intact.
Configure the exact trusted host/API origins, workspace and Home app binding.
Accept `ub:token` only from `window.parent` at that host origin with matching
bindings. A message with the right type alone is not trustworthy. `"null"` is
the opaque frame's origin, not the trusted parent origin.

`ub:ready`/`ub:token` request a short-lived bridge token. Hold it only in memory;
obtain a current token for later calls. Time out visibly and remove listeners on
completion/teardown. Bundle capability URLs, Home bridge tokens, application OAuth
and service credentials have different audiences and cannot be interchanged.

For multiple browser modules/assets, preserve the entry's signed bundle capability
on their same-bundle URLs, as the template bootstrap does, or emit one browser
bundle. Relative imports do not inherit a query string; a nested module's Referer
may no longer contain the entry capability. Never use that byte-serving capability
as an API bearer.

Existing Brain access uses JSON-RPC at `POST /api/brain/mcp`. Discover
`tools/list`, then call only admitted tool names/inputs through `tools/call`.
Handle both HTTP failures and JSON-RPC/tool errors. The application SDK uses the
same signed bridge with its additional binding for application HTTP operations.
Use `credentials: "omit"`, no-store responses and redirect refusal in a handwritten
legacy Brain client; never forward its bearer to a message-supplied arbitrary URL.

Bridge KV at `/api/home-apps/:homeAppId/state?scope=user|workspace` stores small
app state (256 KB per scope). Use it for preferences, not canonical business
records or protected query-result caching. Shared state must not expose one
viewer's authorized results to another. `ub:navigate` accepts only validated paths
inside the same workspace.

## Verify and install

Bridge calls share the app's daily budget. Show 429 as budget exhaustion and
wait for a user action/reset; do not poll or retry in a loop. Revoked/expired
access clears the protected view. A failed write requires reconciliation through
its canonical command, not a blind refresh-and-retry.

Run the matching deployment's `brian-app lint <bundle-directory>` validator.
The root CLI validates static packaging, not app authorization, deployment or
domain transactions. Do not assume the current local application SDK is already
published just because an older bundle validator is available on npm.

Import through Studio Mini apps, obtain owner/admin consent, and select the app
in the App store configuration. Home opens Chat; launcher selection and personal
pins do not grant resource access. Scope drift, disabled state and sync errors
must be corrected before the custom app can render. Verify with an actual
authorized viewer and a denied/revoked viewer where the target is available.
