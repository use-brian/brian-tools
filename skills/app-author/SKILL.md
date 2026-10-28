---
name: app-author
description: Build or repair an application for Use Brian, from a sandboxed custom app screen to a Brian-native internal system with app-owned queries and transactional commands. Use for dashboards, boards, ERP/accounting/operations tools, and application integrations with Brian. Skip ordinary websites and browser automation.
license: MIT
compatibility: Designed for Use Brian; native integration requires a matching Brian deployment and current application grants.
metadata:
  author: Use Brian
  category: productivity
  when_to_use: When the user wants an app inside Brian, an internal system using Brian's backend, an app integration, or a repair to an existing custom app.
  tags: official
---

# Brian application authoring

Start with the user's workflow and the authoritative owner of its records.
An app screen can be small; the application behind it can be an internal system.
Do not infer its backend, permissions or business rules from its navigation slot.

## Choose the application boundary

| Need | Implementation |
|---|---|
| A view over existing Brian data | Static custom app bundle using the scoped Home bridge and currently available Brain MCP tools |
| Brian-managed business records and operations | App-owned deployed package with typed queries/commands over canonical relational stores; a Brian custom screen or separately hosted frontend calls those operations |
| A system that keeps its own backend and permissions | Independent connector/source; it verifies Brian's identity context and enforces its own current business authorization |
| Unattended orchestration or heavy processing | An explicitly authorized service/workflow calling the same admitted operations |

Complex business rules alone do not require an external backend. Keep short
transactional domain operations beside their canonical data; keep remote effects
and heavy processing outside that transaction. Reuse existing services before
adding infrastructure.

For native applications or independent sources, read
[the application contract](references/application-contract.md).
For an embedded screen, read
[the static bundle and bridge contract](references/static-bundle.md).

## Establish the actual deployment

Inspect the target's existing application catalog, schemas, operations, identity
flow and granted capabilities using available tools or source. Do not invent tool
names, field names, grants or endpoints from an example. A listed operation is
not proof that a later invocation is authorized.

The latest selected architecture is the **foundation-first application-records
boundary**: existing registration, typed dispatch, current scoped authority,
atomic commands/receipts, and lifecycle recovery. Preserve native relational
schemas and canonical identities. Do not replace them with a new generic record
store, ACL engine, SDK or dynamic-schema framework.

The F1-F5 foundation gate was verified locally on 2026-10-26. Real application
adapters, migrations, populated app journeys, publication and live qualification
remain separate work. Historical SDK/scaffold examples and management panels do
not prove that Home application binding, OAuth or source profiles are enabled on
the target. If a required capability is unavailable, report that dependency and
continue only with a clearly labelled static/mock preview or other authorized work.
Never bypass qualification or substitute owner credentials.

## Build the user-usable path

1. Identify the main read, business action, denied case and recovery path. Reuse
   the existing app/package and canonical writer when modifying an application.
2. Define the needed resource/action/field ceiling and current human, assistant
   or service authority. Registration, sign-in and menu visibility grant no data.
3. Implement domain rules once in the owning service/command. Human UI, Brian,
   MCP, imports and background work use that same semantic operation.
4. Build the screen with visible loading, empty, denied, expired and uncertain
   states. Follow the viewer's theme; render returned text as text.
5. Verify the real operation boundary: allowed and denied reads/writes, version
   conflict, duplicate command, revocation, lifecycle recovery and uncertain
   outcome reconciliation as applicable. Static bundle lint alone checks packaging.

Use [`brian-app-template`](https://github.com/use-brian/brian-app-template) for the
static frontend and its optional server module skeleton. The browser bundle and
trusted server package have separate deployment paths. A GitHub import uploads
static assets; it never deploys business code.

When authoring through Brian, use its app authoring tools only if available.
`writeHomeApp` is a **full bundle replacement**: read the existing app before an
update and include all required files. Authoring cannot approve its own scopes.
Do not claim to have deployed, imported or approved an app without a real result.

## Installation and navigation

Import the static bundle through **Studio > Mini apps > Custom > Add from GitHub**
or the available upload/authoring path. An owner/admin grants the stored manifest's
scopes. Widening scopes requires fresh consent. App registration, module lifecycle
and application grants remain separate from this Home consent.

The **App store** is the launcher. Home opens Chat. Workspace menu selection/order
and personal pins control navigation; hiding an app does not revoke its data
permissions. Custom apps still require current consent and renderability.

Report the resulting files/app link, what was actually verified, the authority
required, and any deployment, consent or integration step still owed.
