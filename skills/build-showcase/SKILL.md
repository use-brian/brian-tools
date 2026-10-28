---
name: build-showcase
description: Prepare, rehearse, record, revise, validate, and package reproducible Use Brian product showcases. Use when an agent is asked to create or update a short demo, incorporate feedback or a supplied screenshot/video, prepare an isolated demo workspace, seed a scenario, capture real product footage, or produce an agent-docs showcase release candidate. Enforce permission preflight, evidence-appropriate labels, exact-action approvals, first-viewer visual review, and a separate public-release gate.
---

# Build Showcase

Create an evidence-grounded product demonstration from a verified run or an
explicitly approved retained output. Never manufacture a response, conceal a
failure, or present synthetic or internal data as customer use.

## Operating roles

Distinguish these roles throughout:

- The **production agent** prepares the scenario, drives the authenticated
  browser, captures footage, and packages the release candidate.
- The **Brian assistant** inside the demo workspace performs the showcased
  work with only the tools and context actually available there.
- The **human approver** authorizes permissions, exact external actions,
  spending, and public release.

Never ask the human for a password, session cookie, OAuth token, API key, or
other credential in chat or in a tracked file. Ask them to complete login or
OAuth in the trusted UI.

## Required resources

Read the [permission preflight](references/permission-preflight.md) before any
workspace or connector mutation. Read the
[workspace lifecycle](references/workspace-lifecycle.md) before opening,
creating, seeding, or resetting a demo workspace. Read the
[scenario contract](references/scenario-contract.md) before authoring the
scenario or evaluating the run. Read the
[short-showcase video standard](references/video-standard.md) before planning,
capturing, editing, or reviewing media.

Read the [feedback and revision playbook](references/feedback-and-revision.md)
before changing an existing cut, replacing a showcase asset, or applying a
renderer-wide brand correction.

Create the internal working record from the
[scenario manifest template](assets/templates/scenario-manifest.md). Create the
public release candidate from the
[showcase record template](assets/templates/showcase-record.md). Create the
machine-verifiable media record from the
[release-manifest template](assets/templates/release-manifest.json). Validate
each readiness stage with
[`scripts/validate-showcase-pack.mjs`](scripts/validate-showcase-pack.mjs).
For the visual review, generate a time-sampled sheet with the
[review contact-sheet builder](scripts/build-review-contact-sheet.mjs).

## Workflow

### 1. Establish scope and mode

Identify:

- the requested showcase outcome and intended viewer;
- whether the work is prepare-only, record, or publish;
- the target environment: local, staging, or production;
- the available product, video-production, catalog, and media-storage repos;
- the requested scenario ID or a new lowercase kebab-case ID; and
- whether an existing showcase must be revised rather than duplicated.

Interpret words such as `instead`, `replace`, and `use this image` as a
replacement unless the surrounding request clearly asks for an additional
case. Preserve the old private pack, update the active index entry, and create
a new scenario ID when the new asset changes the demonstrated outcome.

For a batch, audit dependencies before selecting cases. Prefer useful cases
that the controlled environment can demonstrate without live connectors,
microphone capture, or external writes. Describe controlled exports as files,
not live connectors.

Default to **prepare-only** when publication intent is unclear. Prepare mode
ends with a validated scenario pack and, when authorized, a resettable demo
workspace. Record mode may produce a reviewed local release candidate. Publish
mode additionally requires explicit upload and public-release authority.

### 2. Run permission preflight

Build the minimum permission plan from the permission reference. Separate:

1. authenticated product access;
2. workspace role;
3. assistant/tool grants;
4. connector authorization;
5. exact external actions;
6. paid usage;
7. browser capture;
8. catalog and media publication.

Continue with read-only inspection and local drafting while approvals are
pending. Stop at the relevant gate, not at the beginning of all work.

### 3. Author the scenario before touching the workspace

Copy the scenario manifest template into the chosen working directory and fill
every required field. Use one stable scenario ID in filenames, record titles,
tags, calendar summaries, and artifact metadata.

Define one visible transformation:

> recognizable situation -> Brian works -> inspectable result

State the exact prompt—or clearly labelled representative request—starting
state, expected result, hero frame, proof boundary, unsupported behavior, and
reset selector. If the evidence cannot be evaluated objectively enough to
record, refine the scenario first.

Classify every retained asset before editing:

- `synthetic` -> persistent `SYNTHETIC DEMO` label;
- `internal-approved` -> persistent `INTERNAL DEMO` label and the exact scope
  of the human's asset-use approval; or
- `customer-approved` -> explicit consent, approved public label, and the
  stricter customer-evidence process.

If only a retained output exists, mark the evidence `observed-output`. Label a
reconstructed request as representative; never call it the exact prompt or
manufacture a causal product run around it.

Use video profile `gallery-landscape-v1`. Fill the complete edit timeline,
evidence-label placement, capture settings, cursor path, scroll positions, and
recording-acceptance checks before capture. Keep the situation, request, work,
and result in causal order.

Retain the exact prompt, expected-result checks, and at least one scenario input
under `inputs/` in the private pack. Run:

```bash
node <skill-dir>/scripts/validate-showcase-pack.mjs <scenario-dir> --stage=prepare
```

Fix contract failures before seeding or recording.

### 4. Open or prepare the workspace

Follow the workspace lifecycle reference.

Skip workspace setup when an approved retained output is sufficient for an
honest observed-output showcase. Do not add production dependencies merely to
make a static evidence case look more active.

- Prefer an existing isolated showcase workspace.
- In a production environment, use the user's authenticated browser session.
- Create a workspace only after approval and only when no suitable isolated
  workspace exists.
- Use normal product UI, chat, and product APIs. Do not seed production by
  direct database writes.
- Never delete or flush a workspace as part of setup or reset.
- Never copy customer-specific in-app content into the showcase.

Record the workspace ID and primary assistant ID in the private scenario
manifest, never in the public showcase record.

### 5. Generate the scenario in place

Create only what the manifest requires:

- synthetic company overview, operating rules, offer, and brand context;
- synthetic people, companies, deals, projects, tasks, and commitments;
- synthetic files, pages, templates, meeting script, and recording;
- controlled calendar state and controlled outbound recipient when required;
- assistant charter, capabilities, and per-tool policy;
- exact prompt and any operator actions that begin the run.

Prefer product-native creation because it proves the same path a user can take.
Use deterministic seed/reset automation only when it calls supported product
surfaces and preserves the same permission model.

Apply the scenario ID to every generated object that supports a tag,
external reference, filename, title prefix, or description. Before creating an
object, search for that marker and update or reuse the existing object when
safe. Do not create duplicate state on repeated preparation runs.

For an external connector:

- let the human complete OAuth;
- use a controlled demo account and recipient;
- keep write tools on exact-action approval unless the scenario explicitly
  demonstrates a narrower approved workflow grant; and
- do not send merely to make the workspace look populated.

### 6. Rehearse and verify

For a product-run demonstration, run the scenario without recording first. For
an observed-output demonstration, verify the retained asset and its provenance
instead of recreating missing product work.

Verify:

- the starting state matches the manifest;
- the Brian assistant holds the stated context and tools;
- every shown capability is shipped, or visibly labelled prototype;
- the output satisfies the expected-result checks;
- citations, approval cards, attachments, recipients, and artifacts are
  inspectable where claimed;
- no customer data, credentials, unrelated notifications, or private browser
  chrome appear; and
- the final frame communicates the outcome without narration.

Distinguish a verified product run from an observed output. Stable crops of a
real supplied screenshot may demonstrate the output, but they cannot establish
the missing prompt, generation path, or arbitrary integrations.

Record the actual result and limitations in the manifest. If the run fails,
diagnose or narrow the scenario. Do not replace the result with a mock and call
it a product run.

### 7. Capture the verified run

Record a complete master, then edit it to the public duration. Do not force the
real product interaction to finish inside 10-15 seconds. Follow the video
standard's `gallery-landscape-v1` capture and delivery requirements.

When the sibling `brian-video` repo is available, reuse its page-only CDP
capture and deterministic ffmpeg pipeline. Prefer page capture over desktop
capture so notifications and unrelated windows cannot leak. Keep real product
footage real; never use generated imagery to imitate product UI.

Capture:

- a high-resolution landscape master;
- a poster frame;
- the exact prompt or initial situation;
- the real result and approval state; and
- captions or scene text sufficient without audio.

For a user-supplied screenshot or clip, retain the original bytes, record its
classification and approval, and crop or frame the real asset without
redrawing its UI. If it changes the story, author a replacement scenario
rather than mixing it into an unrelated synthetic sequence.

When narration is requested, lock the silent-first visual edit before
synthesizing speech. Use the shared `brian-video` narration command when
available, retain the exact script and provider metadata, and keep the clip
fully understandable with audio muted.

Prepare three localized narration variants from that one locked visual master:
English (`en`), Cantonese (`yue-HK`), and Japanese (`ja-JP`). Author and review
each script in its own language; do not use one language's timing as a reason
to truncate, unnaturally accelerate, or mechanically translate another.

The timed capture wrapper opens and records a route; it does not perform the
scenario. Pre-stage the route and use an interactive controller on the same
named browser session when the run requires clicks, typing, approvals, or
scrolling.

### 8. Edit and package the release candidate

Edit to one honest 10-15 second transformation or observed-output story. Cut waits and accelerate
uneventful intervals at up to 4x. Prefer a small number of stable visual beats
over rapid state changes. Preserve readable requests, approval details,
citations, and results. Hold the hero result for at least 2.5 seconds. Use
silent-first captions and keep `SYNTHETIC DEMO` visible throughout synthetic
product frames. Before packaging, inspect the real result for unintended
literal Markdown markers or broken native formatting; fix the product result
and recapture rather than painting over the footage.

Run the silent-first review loop before narration: inspect a time-sampled
contact sheet, watch at normal speed while muted, inspect the 480 x 270 card,
and verify the opening rail and compact corner mark. Review as a stranger in a
collapsed gallery view. Re-edit until the input, transformation, and payoff are
obvious without explanation.

Generate the standard review sheet with:

```bash
node <skill-dir>/scripts/build-review-contact-sheet.mjs <showcase.mp4> <contact-sheet.png>
```

Apply the evidence label consistently to the opening rail, persistent footer,
poster, card, captions, and metadata. Never leave a hard-coded `SYNTHETIC`
badge on an internal-approved asset.

Produce:

- scenario manifest with verification evidence;
- complete captured master;
- final MP4;
- English, Cantonese, and Japanese narrated MP4 variants when narration is enabled;
- poster image;
- localized captions or transcripts for every narrated variant;
- public showcase Markdown from the template;
- media checksums;
- catalog fields; and
- a concise list of limitations and open publication gates.

Place local artifacts under `release/v<version>/` and fill `release.json`.
Set the product, privacy, and claim decisions to `approved` only after the
named human reviewers make those decisions. Then run:

```bash
node <skill-dir>/scripts/validate-showcase-pack.mjs <scenario-dir> --stage=candidate
```

Do not call the pack a candidate until this command passes. Candidate status
does not authorize upload or publication.

After any visual-master or shared-renderer change, regenerate every affected
locale from the new silent master and refresh the poster, card, contact sheet,
checksums, and narration manifest. Never update only the English MP4.

Keep video bytes in versioned media storage, not in `agent-docs`. The public
record carries media URLs. Before upload, leave URL fields explicitly pending;
never invent a final URL.

### 9. Publish only after release approval

Public release is a separate approval from permission to prepare or record.
After approval:

1. upload immutable, versioned media;
2. update the approved `agent-docs/showcases/<id>.md` record;
3. regenerate and validate the showcase catalog;
4. verify the Studio card and detail page;
5. verify the agent-readable record and direct media URLs; and
6. set the release review and immutable URLs in `release.json`;
7. run the release validator:

   ```bash
   node <skill-dir>/scripts/validate-showcase-pack.mjs <scenario-dir> --stage=release
   ```

8. report any commit, push, or deployment still owed.

Do not infer permission to commit, push, deploy, upload, or publish from a
request to prepare or record.

## Hard stops

Stop and request direction when:

- an unapproved real employee, partner, or private production record would
  enter the scenario;
- customer-specific in-app content would be used for selling or showcase
  production;
- the only available workspace contains unrelated private data;
- a credential would have to be copied or stored;
- the required capability is not shipped and the label has not been approved;
- the scenario needs an external write without exact approval;
- workspace deletion, full data flush, or broad cleanup appears necessary;
- paid usage exceeds the approved amount;
- the release candidate is ready but public-release approval is absent;
- the master cannot preserve the real causal sequence; or
- the public clip fails duration, legibility, privacy, claim, or technical
  validation.

## Completion report

Report:

- scenario ID and mode completed;
- workspace reused or created;
- objects generated or updated;
- capability and evidence verdict;
- captured artifacts and their local paths;
- visual iterations completed and the first-viewer verdict;
- evidence classification, persistent label, and whether the request was exact
  or representative;
- approvals exercised;
- remaining permission or product gaps; and
- whether the result is only a release candidate or is actually published.
