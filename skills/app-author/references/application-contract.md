# Application operations and authority

Use this reference for a Brian-native backend, a standalone frontend/service, or
an independently authorized source. It is not an instruction to migrate an
existing application or activate an unavailable profile.

## Native ownership and registration

Keep domain schemas, constraints and business rules in app-owned deployed
packages. Existing CRM people/companies/deals and Tasks retain their canonical
identities and writers. App tables can reference those resources without making
another CRM copy or turning every record into a Brain memory.

The deployed host supplies `defineApplicationModules` and the existing
`ApplicationPlatformService`. A module declares its stable key/version,
dependencies, resources, typed queries/commands, events and optional contributions.
Configuration and a `brian-app.json` cannot register executable handlers. This
is trusted deployed code, not an arbitrary-code upload sandbox.

When enriching a lifecycle-only module, preserve its key, default state and
blocker compatibility. Reuse the host registry; do not replace a registered
application or inject reference modules into normal boot. Registration owns its
metadata and handler records; do not mutate callback closure state after capture.

## One canonical command boundary

- Validate input with the deployed typed contract. Enforce current workspace,
  row, relationship, field and action admission before reading or mutating data.
  Recheck protected query results and command references before returning them.
- Use the dispatcher's supplied transaction client for business writes, versions,
  receipt, audit and committed events. Calling several CRUD endpoints does not
  make a business operation atomic. Do not open an independent owner transaction
  or loop back through an owner-authenticated route.
- Preserve domain constraints at commit: exact money, immutable posted state,
  shared-capacity locks, independent approvals and canonical relationships as
  applicable. Registration and a generic write grant cannot enforce these rules.
- Keep resource versions as opaque strings. Commands carry the original
  `idempotencyKey`, `expectedVersion` when required, and exact JSON `input`.
  Do not normalize a changed request into an apparent replay.
- Command receipts retain canonical resource references. Replays and reconciliation
  reauthorize current access; an old receipt is not a cached permission grant.

`new_work` is the default operation class. `new_work`/`new_commerce` require an
enabled module. A trusted `existing_recovery` command can settle or recover
existing work while draining/disabled, provided its handler proves the current
resource authority and allowed transition. Clients cannot choose that class.

An interrupted write can have committed. Preserve its original envelope and
receipt/key; reconcile before deciding whether another write is safe. Never
automatically retry a write, refresh login and resend it, or report a timeout as
rollback. Preserve safe typed error metadata (`code`, `effect`, `retrySafe`,
`status`); `outcome_uncertain` requires recovery. `module_draining` and
`module_disabled` are lifecycle refusals, not permission to route around the module.

## Clients and credentials

Use matching deployment-supplied `@use-brian/brian-app` packages. Local SDK
conformance does not prove the required registry versions are published or that
the target profile is enabled. Do not tell the user a registry install or an old
scaffold command will activate the backend.

| Export/transport | Boundary |
|---|---|
| Root export | Static manifest/bundle validation |
| `./application` | Browser-safe application client, PKCE sign-in and Home transport |
| `./module` | Server-only module types and service/delegated transport |
| `./connector` | Server-only request-bound actor verification/source protocol |

`createApplicationClient({ appId, transport })` exposes `catalog`, `schema`,
`get`, `query`, `history`, `registeredQuery`, `command` and `reconcile` under
`/api/applications/:appId`. Use only the target's advertised resource and
operation contracts. Native app-owned commands do not require generic schema
editing. Schema preview/apply, when needed for an existing supported feature,
uses its separate native-management authority.

```js
// Bundle the browser-safe SDK locally, using the target deployment's version.
import { createApplicationClient, createHomeApplicationTransport }
  from '@use-brian/brian-app/application';

const bridge = createHomeApplicationTransport({
  appId: applicationClientId,   // registered application client, not the Home row
  homeAppId, workspaceId, apiOrigin, hostOrigin, window,
});
const app = createApplicationClient({
  appId: applicationClientId, transport: bridge.transport,
});
const catalog = await app.catalog({ signal });
// Use an exact query and input from catalog.operationSchemas/the deployed contract.
// Call bridge.dispose() on teardown.
```

The Home SDK checks exact parent window, host/API origin and Home/workspace
binding. The backend must also have a current application binding, viewer grant,
consent and client revision. A legacy Home token or `scopes.application` declaration
alone supplies none of those. Missing qualified binding means unavailable.

Standalone browsers use the registered app's OAuth/PKCE consent flow and
in-memory app-bound access token. Keep the originating page alive for the popup
flow; verify exact callback source, origin, redirect, state and audience. Login
alone grants no records. A customer/partner portal additionally needs an explicitly
admitted verified identity and current resource grant.

Service credentials stay server-side. Delegated service calls additionally carry
independently verified app-bound user authorization; their rights intersect.
Never send native session tokens, service secrets, user-ID impersonation headers
or owner credentials into a static bundle.

## Protected output and background work

Preserve returned fields, absent-field sets, opaque references/versions, source
evidence, query page envelopes and receipts. Exact decimals remain strings. Do
not flatten evidence into plain text and then treat the result as unrestricted.
Clear protected views and cancel outstanding calls on logout/expiry, authority
change or suspension. Late responses must not repaint a different session.

No persistent response cache, offline command queue or shared KV copy of a
viewer-specific result by default. Such storage needs its own admitted retention
path with current source/recipient checks. Background work needs explicit durable
service/delegation authority, fresh admission and receipt reconciliation; it must
not revive an expired human session or silently become the workspace owner.

## Independent systems

Keep an external system canonical when it owns its backend and rules. Use its
supported connector/source contract rather than pretending it is a native table.
Verify authenticated transport and request-bound Ed25519 actor assertions:
trusted issuer/audience/workspace/connector, exact request bytes, expiry and
durable atomic replay consumption. Map both initiating human and executing
assistant to source identities; unknown or disabled mappings deny.

Identity proof does not grant source permission. Enforce the source's current
record/field/action and recipient permissions as well as Brian's connector and
department floors. Governed observations require reauthorization; released
snapshots require independent release receipts/audience/expiry; ephemeral output
requires a compatible non-persisting lane. Advertise only supported capabilities.
External effects use the source's saved idempotency receipts and reconciliation.

## Maintained architecture

In a local platform checkout, read `docs/product-roadmap/native-extensible-backend-replanning.md`
(D05/D06) and `docs/plans/application-records-foundation-v1.md` first. Then use
`docs/architecture/features/application-platform.md` for the retained dispatcher
contract and `application-platform-sdk.md`, `application-platform-management.md`
and `application-platform-persistence.md` for the relevant transport/authority
details. Historical expansion and example acceptance matrices do not enlarge the
selected foundation. Local proof, application adoption and rollout are separate.
