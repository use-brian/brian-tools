# Permission preflight

Use this reference before changing a workspace, connecting a service,
recording a browser, spending credits, or publishing a showcase.

## Permission classes

| Class | Examples | Default |
|---|---|---|
| Read and plan | Inspect product docs, existing showcase records, workspace list, local assets | Proceed when already accessible |
| Workspace mutation | Create workspace, assistant, CRM data, tasks, pages, files | Require authenticated access and the minimum workspace role |
| Connector authorization | Gmail, Calendar, Fathom, Drive, Slack | Human completes OAuth or secret entry in the trusted UI |
| Exact external action | Send email, create or update attendee event, post publicly, invite a teammate | Show the exact action and obtain its approval |
| Paid usage | Model credits, transcription, generated voice, paid video provider, storage | Obtain a bounded budget approval before spending |
| Browser capture | Record product page, cursor, and product audio | Obtain permission for the target account/workspace and capture page-only |
| Public release | Upload media, add public record, commit/push, deploy | Separate human release approval |

An approval for one class does not imply another. In particular, workspace
access does not authorize public release, and release approval does not waive
exact-action approval inside the recorded run.

## Minimum workspace role

| Need | Minimum posture |
|---|---|
| Read existing workspace and use an available assistant | Member with sufficient clearance |
| Create or configure assistants, connectors, knowledge sources, or members | Admin or owner, depending on the product gate |
| Create a new workspace | Authenticated user who can own another workspace under the current plan |
| Billing, destructive workspace administration, ownership changes | Owner; avoid these for showcase production |

Ask for the minimum role. Do not request owner merely because it is convenient.

## Required preflight record

Record each item as `available`, `approved`, `not needed`, or `blocked`:

- product environment and URL;
- authenticated browser session;
- target workspace and role;
- scenario assistant and clearance;
- required product capabilities;
- required connector instances;
- per-tool policy for every write;
- controlled sender, recipient, attendee, and public account;
- model/transcription/video budget;
- page-capture permission;
- media-storage write access;
- agent-docs write access;
- commit/push/deploy authorization; and
- public-release approver.

Never record the credential itself.

## Data boundary

- Use synthetic or separately approved internal data.
- Treat approval to use a supplied internal screenshot in a local edit as
  asset-scoped approval only. It does not authorize other internal records,
  publication, or a broader product claim.
- Never use customer-specific in-app content for selling or public showcase
  production.
- Account-level and behavioral patterns are not permission to reveal the
  underlying content.
- Customer evidence requires explicit consent, evidence handling, claim review,
  and any necessary anonymization.
- Never use customer-specific in-app content for selling, even when the account
  is accessible. Customer-approved evidence must be separately supplied for
  that purpose or limited to permitted aggregate behavior patterns.
- Mark synthetic data visibly in the video and record.
- Mark approved Use Brian internal output as `INTERNAL DEMO` across the video,
  card, poster, and record. Do not mislabel it synthetic or customer evidence.

## External actions

For each action, expose the exact sender or actor, recipient or audience,
content, attachment or link, and execution time. Approve that one action.

Do not:

- send a test email to an uncontrolled address;
- invite a real person merely to populate the workspace;
- create calendar events for external attendees without approval;
- publish a social post while recording unless that exact post is approved; or
- convert a one-time approval into an ongoing grant.

## Capture and release

Capture only the product page. Hide notifications, password managers,
bookmarks, unrelated tabs, account menus, and system chrome. A human must
review the final frames, audio, captions, metadata, and claims before release.

When a supplied image or clip is enough to demonstrate an observed output, do
not open a production workspace or invoke a connector merely to make the edit
look more active. Retain the original asset and document what it does and does
not prove.

Public-release approval must name the scenario ID and version. Any later edit
that changes claims, recipients, customer identity, or evidence requires a new
release review.
