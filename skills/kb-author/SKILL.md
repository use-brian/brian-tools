---
name: kb-author
description: Convert internal documentation (architecture docs, specs, runbooks) or any other source — Notion, Confluence, a Google Drive folder (crawled live via the Drive MCP connector), Google Docs, pasted emails, meeting transcripts — into Use Brian knowledge-base markdown entries. Use when the user wants to seed or extend a team knowledge base, ingest from an existing source, author a new entry, reorganize existing KB content, or audit KB hygiene.
license: MIT
compatibility: Designed for Use Brian
metadata:
  author: Use Brian
  category: productivity
  when_to_use: When the user wants to ingest content from any source into a KB (including pulling a shared Google Drive folder), author a new entry, restructure an existing KB, or audit KB hygiene. Skip when the user is asking general writing questions unrelated to the KB sync format.
  tags: official
---

# Knowledge Base Authoring

Author markdown files for a Use Brian team knowledge base — the GitHub repo the sync worker mirrors into `knowledge_entries`. The assistant queries them via `searchKnowledge` / `browseKnowledge` / `readKnowledgeEntry`.

This skill covers the **parser contract** (frontmatter, paths, wikilinks, sensitivity) and the **editorial decisions** that make the KB useful.

## Fast paths

- **New KB:** [`use-brian/brian-kb-template`](https://github.com/use-brian/brian-kb-template) — click **Use this template** (or `gh repo create --template use-brian/brian-kb-template`). Edit the meta files, push, connect in team settings.
- **Ingest from any existing source** — a `docs/` tree, Notion, Confluence, Google Docs, Slack, pasted emails, whiteboard photos, meeting transcripts — use the Ingest workflow below. The model is the adapter; no source-specific tooling.

## Scope

This skill does **not** run the sync worker, edit the DB directly (when a sync repo is connected, the repo is the source of truth), replace memories (those are per-user behavioral signal), wire repos (team settings), set assistant `clearance` (operator setting), or enforce emit guards — Use Brian's sensitivity model is read-filter + write-stamp only, with no automatic "don't output confidential" protection. The operator wires audiences correctly.

Skip this skill when the user wants to save a personal preference (→ memory), use the KB tools as a reader (→ `docs/architecture/features/knowledge-base.md`), or configure sync (→ team settings).

## Mental model

| Layer | Lives in | Lifecycle | Who reads |
|---|---|---|---|
| KB | GitHub repo → `knowledge_entries` | Curated, edited via PRs, team-scoped | Assistants with `clearance` ≥ entry's `sensitivity` |
| Memory | `memories` | Organic, per-user, decayed | Owning user's assistants, filtered by clearance |
| Session | `session_messages` | Ephemeral | Session participants |

If two people would write it the same way, it's KB. If it's *this user's* preference, it's memory.

## Parser contract

Parser: `packages/core/src/knowledge/parser.ts`. Deterministic — no LLM. Always write YAML frontmatter:

```yaml
---
title: Deploy Rollback      # → entries.title (falls back to first H1, then filename)
description: One line...    # → entries.summary (shown in listings — highest-leverage field)
tags: [runbook, deploy]     # → entries.tags (FTS B-band weight)
sensitivity: internal       # → entries.sensitivity (default when absent: internal)
related:                    # → entries.related_ids after wikilink resolution
  - runbooks/deploy/index
---
```

Other keys go to `entries.metadata` JSONB (`status`, `owner`, `last_reviewed`, `source`, etc.). Parser handles scalars, inline and block arrays, booleans, numbers. **No nested objects** — flat only.

**Paths:**

- `runbooks/deploy/rollback.md` → path `runbooks/deploy/rollback`
- `runbooks/deploy/index.md` → path `runbooks/deploy` (index is the directory's entry)
- Lowercase-kebab conventional; path lookup is case-sensitive.

**One file = one entry.** Split sections into siblings when they want their own URL.

## Sensitivity tiers

| Tier | Rank | Used for |
|---|---|---|
| `public` | 1 | Customer-facing: FAQs, public API, marketing |
| `internal` | 2 (default) | Engineering docs, runbooks, planning |
| `confidential` | 3 | Customers by name, security, contracts, financials, PII |

**Enforcement** (shipped):

- **Read filter** — every store query adds `WHERE sensitivity_rank(sensitivity) <= sensitivity_rank($clearance)`. `related_ids` UUIDs above clearance are also stripped.
- **Write stamp** — when the *model* writes via `saveMemory` / `addKnowledgeEntry`, the row inherits the max sensitivity seen that turn. Does **not** apply to repo-driven authoring — there, `frontmatter.sensitivity` is literal at sync time.

**The `related_ids` filter is structural, not lexical.** A `public` entry whose body contains `[[security/key-rotation]]` renders the path string to a public-cleared reader even though the resolved UUID is hidden. When crossing tiers, put the target in `frontmatter.related[]` (filtered) rather than body text.

**Mixed-tier `index.md`** must be at least the highest tier of any sub-entry it names in body. Otherwise the body leaks the higher-tier name.

**Picking a tier:**

- Identifies a real customer, counterparty, or outside-team individual? → `confidential`
- Security-relevant (auth, keys, vulns, secrets)? → `confidential`
- Names private infra (GCP project IDs, internal hostnames, vendor accounts)? → `confidential`
- Would you ship it on a public docs site? → `public`. If you hesitate, → `internal`.
- Otherwise → `internal`.

Uncertain between `internal` and `confidential`? Pick `confidential`. Declassification is just a frontmatter edit + push; under-restriction is a leak. The team's policy lives in `meta/sensitivity.md`; follow it, or update it in the same PR.

See `docs/architecture/platform/sensitivity.md` for the full design.

## Cross-linking

Related refs come from three places: `frontmatter.related[]`, body wikilinks, body markdown links.

```markdown
[[runbooks/deploy/rollback]]           # absolute
[[../deploy/rollback]]                 # relative from this file
[[rollback]]                           # bare — filename search
[[runbooks/deploy/index|Deploy]]       # display alias
[rollback steps](../deploy/rollback.md)   # standard link — also a related ref
```

External URLs are ignored for related-ref purposes. Source-code paths (`packages/core/src/...`) stay as prose — do **not** wrap in wikilinks.

## The `index.md` convention

Every directory has one. It's the entry browsers land on, the canonical "what is this folder" answer, and the natural target for `[[runbooks/deploy]]`. A good index lists sub-entries with one-line hooks. Without it, browsers see children but no orientation.

## Ingest workflow

Use this to populate a KB from an existing body of knowledge — wherever it lives.

### 0. Identify the source + access

| Source | Access |
|---|---|
| Markdown tree | Read files directly, or have the user paste. |
| Notion | Notion connector, or ask for markdown export / paste. |
| Confluence | Ask for HTML/PDF export; plan for lossy conversion. |
| Google Drive folder | Drive MCP connector (`search_files` / `read_file_content`) — see [Google Drive ingestion](#google-drive-ingestion). Fallback: user downloads/exports and you read locally. |
| Google Doc / Slack / email | User pastes; preserve headings, ignore formatting cruft. |
| Whiteboard photo / diagram / slides | Capture the *information*, not the pixels. |
| Meeting transcript | Summarize with the user; author entries for each decision / spec, not line-by-line. |

For >20 items, batch: (1) survey + bucket, confirm taxonomy with user; (2) convert one domain at a time; (3) user reviews each batch before the next. If the source *is* the current chat, skip to step 3.

### 1. Survey + bucket

| Bucket | Action | Tier |
|---|---|---|
| Spec / architecture / reference | → KB | `internal` |
| Runbook / process | → KB if team-relevant | `internal` |
| Security / auth / secrets / threat model | → KB, almost always | `confidential` |
| Customer-facing / public API / product overview | → KB if you'd publish externally | `public` |
| Plans / proposals (not yet built) | Skip, or `status: proposed` with a callout | `internal` |
| Incident postmortems / customers by name / contracts | → KB if searchable is desired | `confidential` |
| Historical / archived / "do not trust" | Skip | — |
| Research / external citations | Skip unless explicitly wanted | — |
| Machine-generated (changelogs, CLAUDE.md, API dumps) | Skip | — |

User disagreement overrides defaults.

### 2. Path mapping

- Mirror source structure when it already works; Notion hierarchy usually maps cleanly.
- Invent a taxonomy when the source doesn't have one (`products/`, `runbooks/`, `infra/`, `decisions/`).
- Strip noise from filenames: numeric prefixes (`31-`), dates (`2026-04-20-`), Notion ID suffixes (` abc123def`).
- Always create a root `index.md`.

### 3. Frontmatter

Every entry needs at minimum: `title`, `description`, `tags`, `sensitivity`. For markdown sources with existing frontmatter, merge (existing wins). For all others, generate.

- **Title** — scannable; no numeric prefix. Reuse first H1 when good; rewrite otherwise.
- **Description** — one line, ≤200 chars. Highest-leverage field: it's what `browseKnowledge` shows. Lead with the *thing*, then the *what-for*. Avoid "This document describes...".
- **Tags** — 3-6. Mix kind (`spec`, `runbook`, `reference`, `decision`, `glossary`) + domain (`auth`, `billing`, `infra`). Match `meta/tags.md`.
- **Sensitivity** — see the tier rules above. Don't let omission be a silent decision.

Optional: `status` (`stable` / `proposed` / `deprecated`), `owner`, `last_reviewed`, `source`. Entries distilled from an external system of record (Google Drive, Notion, a wiki) also carry `source_url` — see [Source pointers](#source-pointers-distill-dont-mirror).

### 4. Rewrite cross-references

- Internal reference you're also ingesting → wikilink or markdown link to the new path.
- Internal reference you're NOT ingesting → ingest it too, replace with prose, or link externally.
- Source-code paths → keep as prose.
- External URLs → keep.
- Notion cruft (block IDs, `?pvs=`, @-mentions) → strip or convert to prose.
- Confluence/Gdocs artifacts (inline comments, track-changes, auto-TOCs) → strip.

### 5. Author meta glossaries

Two entries pay for themselves many times over. The template ships starters — adapt them.

- **`meta/sensitivity.md`** — team's tier policy. Which folders default to which tier. Prevents drift.
- **`meta/tags.md`** — canonical tag vocabulary. Prevents near-duplicates drifting apart (`deploy` vs `deploys` vs `deployment`).

### 6. Audit

Run `npx @use-brian/brian-kb lint <path>` (or `--json` / `--strict` in CI). The sync worker runs the same checks server-side and logs findings, so issues surface even without the CLI — but lint locally first to catch them before push. Manual spot-checks for anything lint doesn't cover:

- [ ] Every directory has an `index.md`
- [ ] Every entry has `title`, `description`, `sensitivity`, ≥1 tag
- [ ] No numeric or date prefixes in filenames
- [ ] Wikilinks resolve (check against the path index)
- [ ] No leftover source-specific paths (`docs/...`, `notion.so/...`)
- [ ] Every `index.md` tier ≥ highest sub-entry tier named in its body
- [ ] No confidential-shaped strings (customer names, GCP project IDs, internal hostnames) in `public`/`internal` bodies
- [ ] No secrets or tokens in any entry
- [ ] Source-pointed entries: `source_url` in frontmatter **and** a visible `> **Source:**` line in the body; URLs are canonical file-ID form with no `?usp=`/`ouid=` cruft

## Google Drive ingestion

Use this when the knowledge lives in a shared Google Drive folder (the common client-onboarding case: "here's our Drive, make the assistant know our company"). Drive stays the **system of record**; the KB is the distilled, queryable layer over it. You are not migrating the client off Drive — every entry points back to the original file.

**Tooling.** The Google Drive MCP connector: `search_files` (structured queries, `parentId = '<folderId>'` for listing), `get_file_metadata`, `read_file_content` (returns a text representation of Docs, Slides, Sheets, pdf, docx, pptx, xlsx, and common images). In Claude Code, the user authenticates via `/mcp`. No browser automation — the metadata API is the linkage.

### Phase 1 — crawl to a manifest (metadata only)

Breadth-first from the root folder id: `search_files` with `parentId = '<id>'`, paginating via `nextPageToken`; queue every `application/vnd.google-apps.folder` child. Record per item: path-from-root, title, id, mimeType, size, modifiedTime, owner, viewUrl. **Do not read any file content in this phase** — the manifest is what you bucket against, and content reads on a corpus you haven't sized yet waste the budget. Large trees (hundreds of folders): delegate the crawl to a subagent with explicit caps and have it write the manifest to disk.

### Phase 2 — bucket with Drive-specific rules

Apply the survey table above, plus:

| Drive pattern | Action |
|---|---|
| Photo albums, media, design-asset folders | Skip content. At most one pointer entry ("event photos live here") in the drive index. |
| Per-cohort / per-semester / per-year copies of the same artifact (orientation decks, dashboards) | Distill **one** durable entry from the latest instance ("how onboarding runs"); pointer-list the instances. Never one entry per copy. |
| Third-party copyrighted material (books, purchased reports) | Never ingest content into the KB. Omit, or a bare pointer with a rights note. |
| Files owned by personal accounts (interns, ex-staff) | Ingest normally, but flag in `sources-and-open-questions`: the link dies if that account revokes sharing. |
| Working drafts superseded by a final | Pointer from the final's entry; don't distill the draft. |

### Phase 3 — extract and distill

`read_file_content` on the files that survived bucketing. **The entry answers; the pointer verifies.** Distill the durable facts into the body — never mirror the document. For data-heavy files (spreadsheets, norm tables), the entry says what the file contains and when to open it, nothing more. "Extract as much knowledge as possible" means *coverage of the corpus*, not verbatim volume: every surviving file should be represented by an entry, a line in a shared entry, or a drive-index row.

### Source pointers (distill, don't mirror)

Every entry distilled from a Drive file carries the pointer **twice**:

```yaml
source_url: https://docs.google.com/document/d/<fileId>/edit
source_modified: 2026-06-04        # Drive modifiedTime at ingest
last_reviewed: 2026-07-14          # when a human/agent last verified the distillation
```

```markdown
> **Source:** [June Career Webinar (Google Docs)](https://docs.google.com/document/d/<fileId>/edit)
```

The body line is load-bearing, not decoration: `readKnowledgeEntry` returns the entry **body**, so the visible Source line is what lets the assistant hand staff the original for further study ("the full deck is here"). Frontmatter-only pointers are invisible at read time. This mirrors the `> **Source of truth:**` convention in Use Brian's own KB.

Rules:

- **Canonical URLs only.** `https://docs.google.com/document/d/<id>/edit` (Docs/Sheets/Slides) or `https://drive.google.com/file/d/<id>/view` (binary). Strip `?usp=`, `&ouid=` cruft. File-ID URLs survive renames and moves; only trash-and-recreate breaks them.
- **Multi-source entries** list every source under one `> **Sources:**` block; `source_url` holds the primary.
- **ACLs are a feature, not a bug.** The link opens only for staff with Drive access to that file — raw-file access control stays in Drive where the client manages it. The entry's own `sensitivity` governs the distilled text: don't distill more into the body than the tier should carry.
- **Staleness is explicit.** The entry is true as of `last_reviewed`; the pointer is authoritative beyond that. A later hygiene job can diff Drive `modifiedTime` against `source_modified` to flag drifted entries.

### The drive index

Author one `drive-index.md` entry (or per-domain siblings for big corpora): the folder tree with one line + pointer per surviving file, including the skipped-but-pointable ones (photo folders, archives). This is the discoverability backstop — even a file nobody distilled is findable through `searchKnowledge` via its index row.

## Single new entry

1. Pick the path — walk the tree first. Create missing `index.md` for new branches in the same change.
2. Write title + description first — they're the retrieval hook.
3. Body: what & why in 2-3 sentences, then details. Headings are fine.
4. Cross-link generously.
5. Don't duplicate source code — link to it.

## Hygiene jobs

One-shot audits. `kb lint` automates all of these against the filesystem; the in-chat equivalents use KB read tools (`browseKnowledge`, `readKnowledgeEntry`) against the live DB when running inside a Use Brian session. Both paths are useful — CLI for CI, in-chat for ad-hoc.

| Job | How |
|---|---|
| Missing summaries | Grep entries with empty `description`. |
| Broken wikilinks | For each `[[target]]`, verify resolution. |
| Tag drift | Diff all tags against `meta/tags.md`; flag near-duplicates and singletons. |
| Sensitivity drift | Grep `public`/`internal` bodies for confidential-shaped strings. |
| Cross-tier body links | Flag body links where target tier > source tier. |
| Mixed-tier indices | Check each index against the tiers of sub-entries it names. |
| Orphans | Entries no other entry links to. |

## Pitfalls

1. **Writing for the model.** The KB is read by humans too. Avoid prompt-engineering voice.
2. **Migrating archived content.** "Do not trust" docs become "trust this" once in KB.
3. **One giant `everything.md`.** Split aggressively.
4. **External-URL links to your own docs** (`github.com/.../docs/foo.md`). Not collected as related refs; breaks on moves.
5. **Nested frontmatter objects.** Parser flattens — flat scalars + arrays only.
6. **Inventing tags freely.** Add to `meta/tags.md` in the same change.
7. **Downgrading sensitivity to make search work.** The fix is raising assistant `clearance` or splitting the entry, not lowering the tier.
8. **Public index naming confidential children in body.** Link text is user-readable — names leak even when the target is filtered.
9. **Assuming the write-stamp protects repo authoring.** It doesn't. Repo frontmatter is literal at sync time.
10. **Mirroring a source document instead of distilling it.** A KB entry that pastes the deck verbatim rots the moment the deck changes, and buries the retrieval signal. Distill; let the `> **Source:**` pointer carry the rest.
11. **Source pointer only in frontmatter.** `readKnowledgeEntry` returns the body — an assistant can't hand the user a link it never sees. The visible `> **Source:**` line is the contract.
