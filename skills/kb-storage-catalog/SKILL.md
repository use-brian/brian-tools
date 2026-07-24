---
name: kb-storage-catalog
description: Catalog a raw-byte file corpus (S3, MinIO, GCS, or a local disk/folder) into a Use Brian local knowledge base, so an assistant can search across the files and retrieve the originals. Use when the user has an existing bucket or directory of files (documents, PDFs, exports) the assistant currently cannot see, and wants to make it searchable in daily use. Covers the storage-to-KB pipeline: crawl, extract text, emit KB entries plus file pointer-rows, wire a local KB source, and resolve retrieval across backends. For managed doc sources (Google Drive, Notion, Confluence) use kb-author instead.
license: MIT
compatibility: Designed for Use Brian
metadata:
  author: Use Brian
  category: productivity
  when_to_use: When the user has raw files in object storage (S3/MinIO/GCS) or a local directory the assistant can't currently search, and wants a searchable index over them. Skip for Google Drive/Notion/Confluence (use kb-author) and for authoring individual curated KB entries (also kb-author).
  tags: official
---

# Knowledge Base: Storage Catalog

Make a corpus of raw files that already lives in object storage or on disk searchable and retrievable by a Use Brian assistant. The bytes never move; you build one lightweight **catalog** over them.

This skill owns **Pattern A: raw-byte storage** (S3 / MinIO / GCS / local files). It inherits the KB authoring contract from [`kb-author`](../kb-author/SKILL.md) and adds the two things that differ for byte storage: a **storage adapter** (crawl + fetch) and a **text-extraction** step. Fetching the *original* file back (retrieval) is a separate one-time platform build - see [Retrieving the originals](#retrieving-the-originals-separate-build).

For a **managed doc source** (Google Drive, Notion, Confluence) the connector crawls and extracts for you and ACLs live in the source: use `kb-author`, not this skill.

## Why a catalog is required

Raw objects in a bucket are **invisible** to the assistant. No tool crawls a bucket, and every search tool reads a DB registry, not storage:

- `searchKnowledge` reads the KB index (`knowledge_entries`).
- `fileSearch` reads `workspace_files` (descriptors only, not content).
- `searchFileContent` / `searchBrain(file_segment)` read `file_segments` (per-file, ingested).

No row anywhere means the file does not exist to the assistant. The catalog is what creates those rows. Something **external** (this skill's cataloger) must walk the corpus once; the assistant cannot bootstrap itself from storage.

## Mental model: two layers, two artifacts per file

| Layer | Lives in | Purpose |
|---|---|---|
| Bytes | The bucket / disk (untouched) | The real file |
| Catalog | The KB index + a file pointer-row | Discovery and retrieval |

The cataloger emits **two artifacts per file**:

1. A **KB entry** (markdown) - powers discovery via `searchKnowledge` / `browseKnowledge`. Holds title, summary, tags, capped extracted text, and a source pointer.
2. A **`workspace_files` pointer-row** over the file's existing storage key - powers retrieval via `fileRead`, and optional deep content search via a lazy `file_segments` ingest.

Discover-then-fetch loop: `searchKnowledge` finds the entry, which carries the file id, then `fileRead(id)` returns the bytes from whatever backend. The assistant never learns per-storage mechanics.

## Inherit from kb-author (do not restate)

Stages 3-7 of cataloging are identical to `kb-author`. Follow it for:

- **Parser contract + frontmatter** (`title`, `description`, `tags`, `sensitivity`, `related`; everything else to `metadata`; flat scalars/arrays only).
- **Sensitivity tiers + picking rules** (`public` / `internal` / `confidential`).
- **Source pointers** - the pointer appears **twice**: in frontmatter (`source_url` / `storage_ref`) **and** as a visible `> **Source:**` line in the body, because `readKnowledgeEntry` returns only the body.
- **The index convention** (`index.md` per directory; a catalog-index is the discoverability backstop).
- **Lint** - `npx @use-brian/brian-kb lint <catalog-dir>` before wiring; the sync worker runs the same checks server-side.

This skill only specifies what byte storage adds.

## Prerequisites

| Capability | State | Needed for |
|---|---|---|
| `LOCAL_FILESYSTEM_SOURCES_ENABLED=true` | Config flag; only the OSS/standalone composition sets it | Registering a `source_type='local'` KB source |
| A `source_type='local'` KB source | Built (migration `365`) | Phase 1 discovery catalog |
| A storage binding (BYO `s3`/`gcs`/`local`, endpoint + credentials) | Built (`byo-files-resolver.ts`) | Phase 2 retrieval |
| Adopt-existing-key `workspace_files` registration | **Build required** - see [Retrieving the originals](#retrieving-the-originals-separate-build) | Retrieving the originals |

**The discovery catalog works today.** With extracted text in the catalog body, the assistant can search and answer from file contents with zero new builds. **Fetching the original bytes needs the adopt-existing-key capability** (the retrieval plan). Ship discovery first; add retrieval when the raw file is required.

## The storage adapter (three backends, one shape)

S3, GCS, and local disk are one pattern behind a two-method adapter. Add a fourth backend (Azure Blob, R2) as a ~30-line adapter, not a new skill.

| Method | S3 / MinIO | GCS | Local |
|---|---|---|---|
| `list()` -> manifest | `ListObjectsV2`, paginate `ContinuationToken` | `objects.list`, paginate `pageToken` | recursive `readdir` |
| `fetch(key)` -> bytes | `GetObject` | download | `readFile` |

`list()` returns a uniform manifest row per object: `{ key, size, contentType, mtime, etagOrHash }`. `fetch()` returns bytes. Nothing else varies - extraction and every downstream stage are backend-agnostic.

**Credentials never enter the catalog or the model.** They live in the storage binding (server-side). The manifest and KB entries carry only the relative key plus which binding to resolve through.

## The extraction module (by MIME, not by backend)

Bytes to text is keyed on file type, identical across S3/GCS/local:

| Type | Extract | Body |
|---|---|---|
| txt / md / csv / html / code | read directly | capped text |
| PDF (text layer) | PDF text extraction | capped text |
| PDF (scanned) / image | vision-capable model reads page images / the image (enrichment pass), or OCR | model transcription, or metadata-only |
| docx / xlsx / pptx | office parser to text | capped text |
| audio / video / archives / opaque binary | none | metadata-only body (still findable by name/path/tags) |

**Cap the body** (~20-50 KB of extracted text). Full text and the raw file stay in storage; the catalog is an index, not a mirror. Oversized bodies bloat the local sync (see Scale).

## How to run it

**One session, one script, one sync at the end.** The digest is a batch grind (CPU-bound extraction), not reasoning work, so parallelize *inside* the cataloger with a **worker pool across cores** and a **resumable manifest** - do not fan out into multiple agents. Three reasons: the KB local sync is **full-rescan** (it re-reads every catalog file to hash it and re-upserts all entries on any change), so a sync firing mid-generation mirrors a half-written catalog and repeated syncs thrash it; a single script owns one manifest, so a crash resumes instead of N agents re-deriving state; and it's a `for`-loop-with-workers job that agent overhead only slows down. Generate the **whole** catalog into **one** directory first, then wire and sync the local source **once**. Shard the input only as worker partitions inside the script (or across worker *processes* for a very slow/large box), all writing into the one catalog dir. At the target scale (thousands, < 50k files) this is comfortably a single session.

Reference implementation: [`references/cataloger.ts`](references/cataloger.ts) - implements the **local-disk backend** end to end (an S3/GCS backend swaps the walk/fetch for list+fetch calls, ~30 lines; everything downstream is unchanged). Rich-file extraction is wired through **optional deps** with graceful metadata-only fallback: `.pdf` via `pdf-parse`, `.docx` via `mammoth`, `.doc` via `word-extractor`, `.xlsx`/`.xls` via `xlsx` (`npm i` only what the corpus needs). The Phase 2 enricher is built in: pass `--llm-base-url` + `--llm-model` (any OpenAI-compatible endpoint - a local Qwen behind Ollama/vLLM works) and the script has the model read each file's extracted text; **images and scanned PDFs** (rendered via poppler's `pdftoppm`) go to `--llm-vision-model`, which must be vision-capable. Its contract: resumable manifest (keyed on extractor version + enricher version + model, so config changes regenerate), per-file failures logged (never fatal) and retried next run - an enrichment failure still writes the mechanical entry and re-enriches on the next run - stale entries for deleted files removed, per-directory wikilinked `index.md` tree regenerated every run so `kb lint` stays clean. **After changing extractors bump `EXTRACTOR_VERSION`; after changing the enrichment contract bump `ENRICHER_VERSION`** (or pass `--force`) so already-cataloged files regenerate - otherwise the manifest skips them.

## Phase 1 - build the discovery catalog (no LLM)

Start from [`references/cataloger.ts`](references/cataloger.ts) and complete the extractors; the stages below are what it does.

1. **Crawl to a manifest.** `adapter.list()` over the whole corpus. Metadata only, no fetching yet. Write the manifest to disk (resumable). Delegate very large crawls to a subagent with caps.
2. **Bucket and tier.** Apply the `kb-author` survey table; map folder/classification to a sensitivity tier. When uncertain between `internal` and `confidential`, pick `confidential`.
3. **Extract.** `adapter.fetch(key)` for surviving objects, run the extractor, cap the text. Skip content for media/binaries.
4. **Emit one KB entry per file.** Mirror the storage key as the catalog file path (`contracts/2025/acme.pdf` -> `contracts/2025/acme.pdf.md`) so `browseKnowledge` mirrors the bucket layout. Frontmatter:

```yaml
---
title: Q3 Vendor Contract - Acme Robotics
description: Signed MSA and SOW for robotics parts supply, 2025-08 to 2027-08.
tags: [contract, vendor, legal]
sensitivity: confidential
storage_ref: s3://onprem-corpus/contracts/2025/acme-robotics-msa.pdf
storage_binding: onprem-minio
content_type: application/pdf
size_bytes: 2451233
source_sha256: 9f2c...
---

> **Source:** `s3://onprem-corpus/contracts/2025/acme-robotics-msa.pdf`

<capped extracted text>
```

`title` / `description` / `tags` carry high-weight search signal (bands A/B); the body carries extracted text (band C); `storage_ref` / `storage_binding` land in `metadata` for the resolver.

5. **Author the index.** A root `index.md` and per-directory indices - the backstop that makes even un-distilled files findable through their index row.
6. **Wire and validate.** Point a `source_type='local'` KB source at the catalog directory. Let the sync worker mirror it. Run a few `searchKnowledge` queries and confirm retrieval quality on a **slice (200-500 files) before running the full corpus**.

## Phase 2 - optional enrichment (LLM)

Additive; the keyword catalog works without it. A pass over the entries fills better `description` + `tags` + `sensitivity` and, where valuable, distills durable facts into the body (the `kb-author` distill workflow). Apply selectively - it is model-dependent, so on an air-gapped box it needs a local model.

The reference cataloger implements this pass **inline**: with the `--llm-*` flags set, each file gets one strict-JSON model call over its extracted text (validated, one retry, mechanical fallback on failure) inside the same resumable run - never by an agent reading files into its own context. Images and scanned PDFs are read by the vision model, which is what makes photo/scan corpora searchable at all. The system prompt forbids copying credentials found inside files into any field.

## Retrieving the originals (separate build)

Discovery (this skill) lets the assistant *find* files and answer from their capped bodies. Fetching the **original bytes** back, or deep-searching a file's full content, is a **one-time platform build plus a per-workspace config** - not part of this workflow. The shape: a storage binding (credentials, server-side, e.g. `byo-files-resolver.ts` with a MinIO `endpoint`) + an adopt-existing-key `workspace_files` registration (a row whose `storage_uri` is the object's existing key, no byte copy) so the object becomes reachable through the existing `fileRead` tool, uniformly across backends; deep per-file content search then follows via a lazy `file_segments` ingest. Ship discovery first; add retrieval when someone actually needs the raw file. Until then, catalog entries still carry a `storage_ref` an operator can resolve by hand. (Platform-side spec: `docs/plans/kb-storage-retrieval.md` in the platform tree.)

## Scale

Tuned for corpora up to ~50k files (discovery entries), not GB:

- **`syncLocalSource` is full-rescan.** Every cycle reads all catalog markdown to hash it; any change re-parses and re-upserts every entry (no per-file delta on the local path). So keep bodies capped, and treat the corpus as catalog-once with occasional deltas rather than a tight sync loop. The cataloger keeps its **own** manifest (key -> hash) so re-runs only regenerate changed objects' markdown.
- **File count, not GB, is the limit.** For hundreds of thousands of files, use coarser granularity (per-folder entries) or split into several sources; do not emit one entry per file.
- The FTS table stays small (capped bodies), so Postgres is not the constraint.

## Pitfalls

1. **Dumping bytes into the KB.** The catalog is an index of summaries + pointers, not a copy of the files. Cap bodies; bytes stay in storage.
2. **Copying the corpus into `workspace_files`.** `persist()` would rewrite 200 GB under new keys and hit the workspace quota. Adopt existing keys as pointer-rows instead.
3. **Teaching the model per-storage retrieval.** It calls `fileRead`; the resolver handles S3 vs GCS vs local. Never surface backend mechanics to the assistant.
4. **Credentials in a KB entry.** Never. They live in the storage binding. Entries carry a relative key + binding id only.
5. **Deep-ingesting everything.** Only lazily ingest the files a query actually needs into `file_segments`.
6. **Frontmatter-only source pointer.** `readKnowledgeEntry` returns the body - the visible `> **Source:**` line is what lets the assistant hand back the original.
7. **Running the full corpus before validating a slice.** Prove retrieval quality on a few hundred files first.
8. **Uncapped bodies.** They make every local sync cycle re-read gigabytes. Cap at ~20-50 KB.
