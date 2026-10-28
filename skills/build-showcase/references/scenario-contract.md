# Scenario contract

The scenario manifest is the private operational source of truth. The public
showcase record is a reviewed projection of it.

## Required identity

- `id`: lowercase kebab-case and permanent
- `version`: positive integer; increment for a materially new recording
- `title`: recognizable user outcome
- `category`: stable gallery group
- `mode`: prepare, record, or publish
- `environment`: local, staging, or production
- `data_kind`: synthetic, internal-approved, or customer-approved

The scenario ID is the reset key. Never reuse it for an unrelated outcome. If
feedback replaces the demonstrated outcome, create a new ID and update the
active showcase index; keep the previous private pack for provenance.

## Required story

Define:

- **Situation:** what the operator already has or just experienced
- **Request:** the exact words entered into Brian, or an explicitly labelled
  representative request when only a retained output exists
- **Work:** the minimum product behavior necessary to reach the result
- **Result:** the artifact, answer, or proposed action the viewer can inspect
- **Hero frame:** the one frame that proves the result
- **Viewer takeaway:** one sentence, without a feature dump

One short showcase proves one transformation, not the whole platform.

## Required capability declaration

For every capability, record:

- shipped, prototype, or planned;
- product surface and tool;
- required workspace role and clearance;
- connector and tool policy;
- expected approval surface; and
- known limitation or degraded path.

Planned capability cannot appear in a product-run showcase. Prototype
capability requires an explicit on-video and record label.

## Starting-state contract

List every object required before the run:

- workspace and assistant;
- company-context entries;
- people, companies, deals, projects, and tasks;
- files, pages, templates, recordings, and calendar events;
- connectors and controlled identities; and
- scenario marker on each object.

List the expected object count and the search used to detect duplicates.

## Verification contract

Write checks that a reviewer can observe. Examples:

- the meeting brief names all three agreed actions;
- each decision links to a real recording timestamp;
- the proposal contains the approved pilot scope and no invented price;
- the email approval card shows the controlled sender, recipient, subject,
  body, and attachment;
- no email is sent before approval;
- another controlled teammate retrieves the same commitment.

Avoid subjective checks such as `looks good`. If judgment is unavoidable,
name the reviewer and the acceptance question.

## Evidence and claim boundary

Record:

- date and product revision tested;
- whether the run was repeated;
- exact inputs and outputs retained privately;
- what the run supports claiming;
- what it does not support claiming; and
- evidence label shown on the rail, footer, poster, and card.

Use these evidence levels:

- `verified-demonstration`: the prompt, inputs, product work, and result are
  retained in causal order;
- `observed-output`: a real approved output is retained, but the complete
  generation run is not.

An observed output may support `Brian delivered this output on Slack`. It does
not establish the original prompt, a fabricated causal sequence, or a claim
such as `delivery works everywhere`. Record broader wording as a positioning
claim requiring explicit claim approval.

A single verified run supports `Brian produced X in this demonstration`, not
`Brian always produces X` or a universal time-saving claim.

## Recording contract

Specify:

- capture route and browser profile;
- expected master duration;
- public duration;
- opening situation frame;
- visible product actions;
- hero result frame;
- caption text;
- regions requiring crop or redaction;
- audio policy; and
- output filenames.

The edited sequence must preserve causal order. For `observed-output`, do not
invent missing steps: use stable crops of the retained output and state that
the request is representative.

## Release contract

The release candidate is complete only when it has:

- final video;
- poster;
- captions/transcript;
- public Markdown record;
- immutable media filename or pending placeholder;
- checksums;
- human privacy/claim review;
- human release decision; and
- catalog validation result.

Preparation, recording, release approval, repository commit, push, and deploy
are separate states. Report each truthfully.
