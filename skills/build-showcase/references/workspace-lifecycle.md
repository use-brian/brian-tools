# Demo workspace lifecycle

## Choose the environment

Use local or staging while authoring product behavior that is not yet released.
Use production only for shipped behavior and only through a controlled demo
account. Never blur a local prototype into a production claim.

## Find before creating

List workspaces available to the authenticated user and look for an isolated
showcase workspace whose purpose matches the requested scenario family.

Accept a workspace only when:

- it contains no customer or unrelated production data;
- the operator has the required role and clearance;
- its billing/credit state can support the rehearsal;
- required connectors are controlled demo instances; and
- its existing scenario markers make reset safe.

Prefer one reusable company workspace for related showcases. Do not create one
workspace per 10-second clip without a concrete isolation need.

## Create when necessary

In production, create through the authenticated product UI. Do not ask for or
store a production bearer token.

The workspace requires:

- a name of at most 100 characters; and
- a purpose between 10 and 500 characters that explains what company context
  the workspace shares.

Recommended pattern:

- Name: `Use Brian Showcase Lab`
- Purpose: `Synthetic small-company operations used only for verified product demonstrations.`

Workspace creation is a state change and may affect plan limits. Obtain
approval immediately before creation. Record the returned workspace ID only in
the private scenario manifest.

Local development may use the local-only dev-login and authenticated workspace
API when those surfaces are already running. Never transfer that approach to
production.

## Open

Open the workspace at the product's workspace route, normally
`/w/<workspaceId>`. Verify the visible workspace name and active assistant
before creating any data or starting capture.

Use a clean browser profile or named browser session dedicated to the demo.
The human performs any login, MFA, OAuth, or account recovery.

## Seed

Use one stable scenario marker:

`showcase:<scenario-id>`

Apply it wherever the product surface supports a tag, external reference,
filename, title prefix, description, or metadata field. Examples:

- CRM tag: `showcase:<scenario-id>`
- External ref: `{ provider: "showcase", id: "<scenario-id>:contact:1" }`
- File path: `showcases/<scenario-id>/company-overview.md`
- Calendar summary prefix: `[SHOWCASE <scenario-id>]`
- Task tag or title prefix: `[SHOWCASE <scenario-id>]`

Before creating, search for the marker. Reuse or update the expected object;
report unexpected duplicates instead of deleting broadly.

Create context in dependency order:

1. workspace purpose and assistant charter;
2. company context and operating rules;
3. people, companies, and projects;
4. CRM deals and relationships;
5. tasks and commitments;
6. files, pages, templates, and meeting material;
7. calendar state;
8. connectors and per-tool policies;
9. exact prompt and capture route.

Use normal product tools and UI. Direct database seeding is acceptable only in
an isolated local environment built for tests, never as the evidence path for
a production showcase.

## Reset

Reset only objects carrying the stable scenario marker. Prefer deterministic
update/upsert over deletion.

Never:

- call the full workspace-data flush route;
- delete the workspace;
- remove unrelated records;
- reset connector credentials;
- revoke another user's access; or
- clear a shared browser profile.

External systems require the same precision. Do not delete all calendar events
or email messages. Restore only controlled demo objects when an exact,
approved cleanup action exists.

## Two-teammate demonstrations

Use two controlled demo identities. Inviting or adding the second identity is
an external action and requires approval. Do not create a fictitious real
person or send an invitation to an uncontrolled address.

Demonstrate continuity by having the second identity retrieve the same
workspace context under its actual clearance. Do not fake the second view in
the first user's session.

## End state

Leave the workspace in a known state:

- scenario prepared and ready for another run;
- no pending unapproved external actions;
- no accidental duplicate records;
- no public post or message sent solely for staging;
- exact scenario version recorded; and
- cleanup needs listed for a human if safe reset was impossible.
