# Business Consulting Kit

> **Status:** P1 built 2026-08-08 (`skills/business-checkup`, `skills/consult-finance`, `skills/consult-sales` - finance pulled into P1 for the operator's financial-analysis priority). §11 defaults applied pending founder answers: author `Use Brian`, category `productivity`, naming `consult-*` + `business-checkup`. Next: dogfood import, then P2 (`consult-offer`, `consult-strategy`), P3 (`consult-growth`, `consult-ops`, `consult-people`), P4 kit surface.
> **Ships as:** `skills/consult-*` + `skills/business-checkup` in this repo, imported per-workspace via Use Brian's skill import (GitHub browse / URL / paste).

An all-round business consulting toolkit for Use Brian's core audience: solo founders and 1-10 person teams who do not have a consultant on retainer. The differentiator over "ask any chatbot for advice" is the brain: every consult starts from what the workspace already knows (deals, contacts, decisions, prior consults) and ends by writing conclusions back, so each engagement compounds.

---

## §1 Product frame

- **Audience:** the workspace operator (founder / owner). Not enterprise; no committee workflows.
- **Positioning:** business acumen in a box - one intake diagnostic, seven specialist practices, one shared analysis method. The goal is the *analytical capability* of a good consultant (structure a case, analyze it, recommend) - **not** a simulation of a consulting firm's operations: no workplans, staffing models, or steering reviews (§13-C, locked 2026-08-08).
- **Compounding rule:** a consult that leaves no artifact in the brain did not happen. Every skill ends by writing back (§5), and every skill begins by reading what previous consults concluded.
- **Open-tools posture:** all eight skills run on Use Brian's always-available primitives (brain search, CRM entities/deals/contacts, pages, memories, tasks, workflow proposals). `requires_connectors` stays empty everywhere; connector-dependent moves are phrased conditionally in bodies ("only when X is connected"), following the `investor-update-monthly-digest` precedent.

## §2 MECE structure - two dimensions, one of them cuts skills

Business consultation decomposes along two independent dimensions. Only the first one produces skill boundaries.

1. **Function (the "what") - cuts skills.** Seven mutually exclusive business functions, each owned by exactly one skill, with written boundary rules for every classic straddle case (§3). Mutual exclusivity is not aesthetics: Use Brian selects skills by `when_to_use` trigger match, so overlapping scopes compete for the same phrasing and make routing flaky. MECE *is* the router design.
2. **Engagement mode (the "how") - shared spine, never a skill.** Diagnose / decide / plan / review are stages of one consultation arc (§4) that every skill embeds. A user who arrives with a framed decision enters the arc at the options stage; a scheduled review enters at orient with a diff-against-last-time framing. This dissolves the classic overlap trap (a standalone `decision-memo` skill would collide with every function skill).

**Collective exhaustiveness** is carried by two structural guarantees: `consult-ops` explicitly absorbs the internal-machinery residue (admin, legal, compliance, tooling), and `business-checkup` sweeps all seven functions so a user who cannot name their problem still lands in the right practice.

## §3 Roster and boundary map

| Skill | Owns | Boundary rules |
|---|---|---|
| `business-checkup` | Whole-business diagnostic sweep + routing | Never deep-dives; scores all seven functions, then routes |
| `consult-strategy` | Direction: who to serve, differentiation, business model, big bets, strategic partnerships, pivot/exit | Owns positioning (who/why). Messaging + channels belong to growth. Distribution partnerships belong to growth |
| `consult-offer` | What you sell: product/service scope, packaging, **pricing** | Owns *setting* the price. Finance owns the *consequences* (margins, unit economics). Roadmap lives here, not strategy |
| `consult-growth` | How buyers find you: marketing, channels, content, brand, distribution partnerships | Owns awareness through lead. Sales owns lead through close |
| `consult-sales` | How buyers buy: pipeline, deals, qualification, conversion, follow-up | Reads the built-in CRM. Hands off to growth at top-of-funnel, to ops after close |
| `consult-ops` | How value gets delivered: fulfillment, customer success, retention, internal process, tooling, admin/legal/compliance | The explicit residue catch-all. Retention/churn after onboarding lives here, not sales |
| `consult-finance` | How money flows: unit economics, margins, cash flow, runway, fundraising | Owns margin math and capital. Never sets prices (offer). "Can I afford to hire" is here; "should I hire" is people |
| `consult-people` | Who does the work: hiring, delegation, org shape, founder time | Owns role definition and the delegation ladder. Affordability check hands to finance |

Trigger exclusivity examples (each phrasing maps to exactly one skill):

- "how is my business doing", "where should I focus" -> `business-checkup`
- "should we pivot", "who should we target" -> `consult-strategy`
- "review my pricing", "what should we charge" -> `consult-offer`
- "nobody is finding us", "which marketing channel" -> `consult-growth`
- "deals keep stalling", "review my pipeline" -> `consult-sales`
- "we're drowning in delivery", "customers churn after onboarding" -> `consult-ops`
- "am I profitable", "how long is my runway", "should I raise", "where can I cut costs", "why is my profit shrinking", "break down my costs" -> `consult-finance`
- "should I make my first hire", "I'm the bottleneck" -> `consult-people`

Recurring cadences (weekly pipeline review, monthly health check) are **not** additional skills; they are these same skills invoked on a schedule (§8).

## §4 The consultation arc (shared spine)

Five stages, embedded compactly in every SKILL.md. Canonical definition lives here; each skill restates it in ~10 lines tuned to its function (support files are per-skill in Use Brian, so there is no shared-fragment mechanism to import from).

1. **Orient (brain-first).** Search the brain before asking anything: prior consult artifacts for this function (§5 conventions make them findable), relevant entities (company profile, deals, contacts), recent memories. State what is already known; ask only for what is missing, batched 2-3 questions at a time - never a field-by-field interrogation. Mirrors the `workflow-builder` / onboarding interview discipline.
2. **Diagnose.** Apply the function's framework (from `references/`) to locate the real problem. Name it plainly, with the evidence.
3. **Options.** 2-3 genuinely distinct paths, each with explicit tradeoffs and what it costs (time, money, risk). Never a single take-it-or-leave-it answer; never a fake third option.
4. **Recommend.** One recommendation with reasoning, stated as the consultant's opinion, plus what would change the answer.
5. **Commit (write back).** On the user's assent: write the consult page from the skill's template, save the key takeaways as memories, offer next actions as tasks, and where a cadence fits, offer a recurring workflow (§8). User-stated facts write immediately; researched facts are shown with sources first (show-then-write).

Entry points: a framed decision enters at stage 3; a scheduled review enters at stage 1 with "diff against last consult" as the orient objective.

**Numbers discipline (hard rule, all skills):** compute only from figures the user gave, the brain holds, or a connected source returned. Show the arithmetic. Never invent benchmarks or industry averages; where a benchmark would help, say what to look up and where. Frameworks in `references/` carry formulas and definitions, never fabricated reference values.

**Research spends:** any web-research step states its cost and asks before running (the platform's pre-flight confirmation invariant), and researched findings are pruned by the user before entering the brain.

## §5 Artifact model - how the kit compounds

Conventions every skill's commit stage follows, so every skill's orient stage can find prior work:

- **Consult page** per engagement, created from the skill's `templates/` file. Title convention: `Consult: <Function> - <YYYY-MM-DD>` (e.g. `Consult: Pricing - 2026-08-08`). Shape: Context, Findings, Options considered, Recommendation, Decision (the user's, verbatim), Next actions.
- **Memories** for durable takeaways, phrased with a stable searchable prefix: `Consulting takeaway (<function>): <one sentence>`. Orient searches this prefix + function.
- **Scorecard** (`business-checkup` only): one page per run scoring all seven functions with one-line evidence each; each run diffs against the previous scorecard so trend is visible. This is the kit's compounding showcase.
- **Tasks** only on assent, one per agreed next action, referencing the consult page.

## §6 Per-skill specs

Common frontmatter for all eight: `license: MIT`, `compatibility: Designed for Use Brian`, `metadata.author: Use Brian`, `metadata.category:` (§11 Q3), no `requires_connectors`. Descriptions written <= 250 chars from the start (the import path truncates at 250); `when_to_use` <= 300 chars, trigger-first - concrete user phrasings, not topic labels.

### §6.1 `business-checkup`
- **Arc emphasis:** orient sweeps the brain per function; diagnose scores each function 1-5 with one line of evidence; recommend names the top 2-3 focus areas and routes to the matching `consult-*` skill - or, if that skill is not imported in this workspace, says it exists in the brian-tools kit and how to import it. Commit writes the scorecard + diff vs the last one.
- **references/:** `function-taxonomy.md` (the §3 boundary map - the kit's canonical MECE definition), `diagnostic-questions.md` (per-function question bank, 4-6 questions each).
- **templates/:** `scorecard.md`.

### §6.2 `consult-strategy`
- **Arc emphasis:** orient pulls company profile + past strategy consults; diagnose separates a direction problem from an execution problem (execution problems get routed to the owning function instead of strategized about).
- **references/:** `strategy-frameworks.md` (where-to-play/how-to-win, positioning statement, bets portfolio: now/next/later with kill criteria).
- **templates/:** `strategy-onepager.md`.

### §6.3 `consult-offer`
- **Arc emphasis:** pricing consults must reach a number or a structure, not vibes; options stage always includes "change packaging, not price" as a candidate. Finance handoff for margin consequences is explicit.
- **references/:** `pricing-methods.md` (cost-plus, value-based, tiering, usage metering; when each fits), `offer-shaping.md` (productization ladder for service businesses).
- **templates/:** `pricing-decision.md`.

### §6.4 `consult-growth`
- **Arc emphasis:** diagnose forces channel focus (pick fewer); options are channel bets with an explicit test budget and a kill date.
- **references/:** `channel-map.md` (channel selection by audience/price-point/sales-motion), `funnel-definitions.md` (stage definitions only - no benchmark numbers).
- **templates/:** `growth-plan.md`.

### §6.5 `consult-sales`
- **Arc emphasis:** orient reads the live CRM (deals, stages, ages, contacts) so the consult is about *this* pipeline, not pipelines in general. Diagnose flags stalls (age vs stage), thin top-of-funnel (route to growth), and unqualified deals. This is the kit's best first-import demo.
- **references/:** `pipeline-hygiene.md` (stage definitions, stall rules, next-action discipline), `qualification.md` (a lightweight qualification frame).
- **templates/:** `pipeline-review.md`.

### §6.6 `consult-ops`
- **Arc emphasis:** diagnose maps the delivery process end-to-end and finds the constraint (the bottleneck, not the annoyance); options include "stop doing it" and "systematize it" before "hire for it" (which hands to people).
- **references/:** `bottleneck-diagnosis.md` (constraint-finding walk-through), `process-mapping.md`.
- **templates/:** `process-map.md`.

### §6.7 `consult-finance`

The deepest skill in the kit, because financial analysis is the diagnose stage of the finance function done properly - it stays *inside* this one skill (analysis is a mode, not a new function; a separate `analyze-financials` skill would break the MECE cut and split the triggers).

**The data reality (2026-08-08 audit):** Use Brian's official connector lineup has **no accounting or banking source** - no Xero/QuickBooks, no Stripe-as-user-data, no bank feeds (lineup: gmail, gcal, gdrive, gcs, s3, github, notion, imap, msgraph, office, shopify, fathom, agentmail, files, brand, cli, computer, local). Financial analysis must therefore be designed around what exists:

| Source | What it yields |
|---|---|
| Uploaded statements (PDF/spreadsheet - universal PDF read is live) | P&L, balance sheet, bank exports: the primary intake |
| Google Drive / Sheets (when connected) | Living bookkeeping spreadsheets |
| Shopify (when connected) | Revenue/order data for ecommerce workspaces |
| **Brain-native CRM (always available)** | Deals won + values -> revenue concentration per client, pipeline-weighted forward revenue |
| Interview | Whatever the documents do not carry (owner salary, personal runway, etc.) |

The CRM row matters: client-concentration and forward-revenue analysis need no connector at all, so the skill delivers real analysis even in a bare workspace.

**Entry points (same skill, same arc):** (a) advisory - "am I profitable", "how long is my runway", enters at orient; (b) artifact analysis - user drops a P&L/export, enters at diagnose directly against the document; (c) scheduled snapshot - monthly cadence, enters at orient with diff-vs-last-snapshot framing.

**Analysis layers (diagnose-stage machinery, shallow to deep):**

1. **Intake + canonical snapshot** - normalize whatever arrived (statement, export, interview) into the `finance-snapshot.md` template shape; note period, source, and gaps. Never analyze numbers whose provenance is unstated.
2. **Statement passes** - trend (MoM/YoY deltas), common-size (everything as % of revenue), and a small-business ratio set (gross/operating margin, current ratio, revenue per head). Flag anomalies: expense creep, margin drift.
3. **Concentration + quality of revenue** - per-client/per-product revenue share from CRM + statements; recurring vs one-off split; receivables gap for service businesses.
4. **Unit economics** - CAC, LTV, contribution margin, payback, per-client profitability (the killer cut for agencies).
5. **Cash + runway** - burn, runway months, working-capital timing; a simple 13-week cash view when the user can supply inflow/outflow timing.
6. **Hand-off into the arc** - findings feed options/recommend: pricing consequences (-> offer), hire affordability (-> people), raise-or-not (fundraising readiness).

**The profit-improvement diagnostic (flagship of the diagnose machinery).** The consultant's core move on a P&L: break the costs down, find the trends, and read the hints into net-profit levers. This operationalizes layers 2-3:

1. **Cost breakdown.** Categorize every line: direct/COGS vs opex; within opex a fixed small-business scheme (people, marketing, tools/software, facilities, professional services, other); fixed vs variable; committed vs discretionary. Then common-size (every line as % of revenue) and Pareto (which few lines carry ~80% of total cost - those are where the levers live).
2. **Trend passes** (want >= 3 periods; see bootstrap below). Per-line growth vs revenue growth - any cost line outgrowing revenue for 2+ periods is a flag (the "jaws" test). Step change vs creep - a one-time jump is a decision to verify, gradual drift is creep to challenge. Margin trends (gross, opex ratio, net). A simple net-profit bridge between periods: what moved profit - price, volume, mix, or which cost lines.
3. **Hints -> levers, on a MECE lever tree.** Net profit = revenue (price x volume x mix) - COGS - opex; every improvement lever lands in exactly one branch. Cost-side levers stay in this skill (renegotiate inputs, consolidate subscription sprawl, cut discretionary creep, fix utilization). Revenue-side levers are *diagnosed* here but *prescribed* by the owning sibling: price -> `consult-offer`, volume -> `consult-growth`/`consult-sales`, mix and client selection -> `consult-strategy`. Finance owns the whole P&L diagnosis; it never owns the pricing decision - the §3 boundaries hold under pressure exactly here.
4. **Rank and size.** At most 3 levers per consult, each sized with shown arithmetic ("tools spend is 11% of revenue and grew 40% while revenue grew 10%; consolidating saves ~$X/yr = Y points of net margin") and rated by ease. A hint is a hypothesis, never a verdict - a jumped cost line may be deliberate investment, so every flag is verified with the user before it becomes a recommendation (the diagnose -> options discipline, §4).

**No-history bootstrap.** Most small businesses cannot produce three clean periods on request. When history is missing, run the single-period breakdown (layers 1-3 still yield the Pareto and concentration reads), then offer the monthly snapshot cadence (§8): the cadence *creates* the trend dataset in the brain, so the trend passes unlock after 2-3 months. This is the kit's compounding rule (§1) made concrete - the skill gets analytically stronger the longer the workspace uses it.

- **Arc emphasis:** strictest numbers discipline in the kit - every figure sourced or asked for, every formula shown, no invented benchmarks. Fundraising consults separate "fundable" from "should raise".
- **references/:** `statement-analysis.md` (cost categorization scheme, common-size + Pareto + jaws passes, step-vs-creep, margin bridge), `profit-levers.md` (the MECE lever tree + the hint->lever catalog: gross-margin erosion -> pricing/input-cost/mix-shift; cost line outgrowing revenue -> creep audit; many small tool lines -> subscription sprawl; people cost rising against flat output -> utilization; marketing up while revenue flat -> CAC deterioration, route to growth; a large low-margin client -> reprice or exit, route to strategy), `unit-economics.md` (layer 4: formulas + computation discipline), `cashflow-runway.md` (layer 5), `fundraising-readiness.md`.
- **templates/:** `finance-snapshot.md` (the canonical snapshot every entry point fills), `profit-improvement.md` (cost-breakdown table + trend flags + the ranked lever shortlist with sizing and routes).
- **v2 pressure point:** layers 2-5 are arithmetic-heavy, and long in-context arithmetic is the model's weakest mode. This is exactly where the §12 "no MCP connector" non-goal will strain first: a deterministic calculation tool (or an accounting connector) is the natural v2 once the prompt-only version proves demand. Until then, the skill mitigates by showing every computation and keeping tables small.

### §6.8 `consult-people`
- **Arc emphasis:** "should I hire" consults start from the founder-time audit (what is actually consuming the week), then the delegation ladder (eliminate / automate / delegate / hire); role definition before candidate talk. Affordability hands to finance.
- **references/:** `hiring-decision.md` (delegation ladder, contractor-vs-employee frame, role one-pager method).
- **templates/:** `role-onepager.md`.

## §7 Packaging constraints (what the import path actually does)

These are facts of Use Brian's importer that shape authoring; they are why bodies stay lean and references stay few:

- **Folder skills:** a directory with `SKILL.md` imports as one skill; `references/` -> reference files, `templates/` -> template files, `scripts/` -> inlined-never-executed. `assets/` is skipped. Caps: 20 support files, 64 KB/file, 256 KB/skill.
- **Support files expand at activation, not on demand.** The importer appends pointer references for every support file and `useSkill` substitutes them all into context at load. Unlike Claude Code's progressive disclosure, there is no lazy per-file read. Self-imposed budget therefore: SKILL.md body <= 4,500 chars; references + templates <= 24 KB per skill.
- **Body cap:** the create route enforces ~5,000 chars on the body; an over-cap import forces manual trimming in the editor. Author under it.
- **Description cap:** truncated to 250 chars at import. Author under it; put the selector signal in `when_to_use`.
- **No bulk import (deliberate platform stance):** each skill is fetched, previewed, and saved by a human, one at a time - that reading is the certification. The kit therefore must be importable a-la-carte: every skill self-contained, `business-checkup` degrading gracefully when siblings are absent (§6.1). Cross-references between skills name the *skill*, never assume its presence.
- **Foreign-tools lint:** bodies must not name tools from other runtimes (`Bash`, `Grep`, etc. trip a warning). Use Brian tool references (searchBrain, listDeals, createPage, saveMemory, proposeWorkflow) are fine and encouraged where conditional.

## §8 Cadences - recurring consults via workflows

Each skill's commit stage may offer a recurring review; acceptance goes through the platform's `workflow-builder` (propose -> confirm), never a silent schedule. Recommended defaults:

| Consult | Cadence | Framing on scheduled entry |
|---|---|---|
| `business-checkup` | monthly or quarterly | re-score + diff vs last scorecard |
| `consult-sales` | weekly | stalls since last review, next actions aged out |
| `consult-finance` | monthly | snapshot refresh, runway delta |
| `consult-growth` | biweekly/monthly | channel-test results vs kill dates |
| others | on demand | - |

A scheduled snapshot that finds adopted levers from a prior consult also reports realized vs sized impact in its diff (§13-C2) - one line of behavior, not a tracking program.

## §9 Authoring rules (all skills)

1. Trigger-first `when_to_use` with concrete phrasings; no two skills share a phrasing (§3 is the source of truth).
2. Interview discipline: brain-first, batched asks, synthesize from history.
3. Show-then-write for researched facts; write-on-assent for conclusions; user-stated facts write immediately.
4. Pre-flight cost confirmation before any research spend.
5. Numbers discipline per §4; references carry formulas, never invented benchmark values.
6. Every consult ends in artifacts per §5; every orient reads them.
7. Bodies self-contained (a-la-carte import, §7); sibling skills referenced by name with graceful absence.
8. No em dashes in any skill copy (house copy rule); hyphens.

## §10 Build order

- **P1 - prove the pattern:** `business-checkup` + `consult-finance` (pulled forward 2026-08-08) + `consult-sales` (the CRM-native demo). **Built.** Import into a live workspace; run one real checkup, one profit breakdown, one pipeline review; fix what grates.
- **P2 - the money spine:** `consult-offer`, `consult-strategy`.
- **P3 - complete the seven:** `consult-growth`, `consult-ops`, `consult-people`.
- **P4 - kit surface:** README section in this repo listing the kit as a set (import order suggestion: checkup first), cadence recipes, and a paste-ready "advisor" L2 persona (voice only, lives outside the skills).

Each phase ends with a real-workspace dogfood run, not just a parse check.

## §11 Open questions

1. **Authorship/branding:** ship as official (`author: Use Brian`, `tags: official`-style) or as community-authored? Official implies the platform team maintains it.
2. **Naming:** `consult-*` prefix + `business-checkup` entry (current lock). Alternative: uniform `consult-*` including `consult-checkup`.
3. **Category:** Use Brian's category enum is `productivity | communication | research | custom` - consulting fits none. Recommendation: declare `productivity` for v1 (keeps the kit out of the unclassified `custom` sink); a `business` category in the platform enum is a separate platform decision, not blocked on.
4. **Distribution moment:** does the kit warrant a mention in the product's import UI / docs-site once shipped, or stay discoverable via this repo only?
5. **Accounting connector (platform roadmap, not this kit):** §6.7's audit found no accounting/banking source in the official connector lineup - financial analysis runs on uploads + CRM + interview. Whether Xero/QuickBooks-class connectors join the platform lineup is a product decision that would materially deepen `consult-finance`; the kit must ship without assuming it.

## §12 Non-goals (v1)

- No MCP connector (no calculators/benchmark services); the kit is pure skills.
- No bulk-import mechanism; a-la-carte is the platform's deliberate stance.
- No built-in-tree shipping (`packages/core/src/skills/builtin/`); this kit lives in brian-tools and imports. Promotion of individual skills to built-in is a later, separate decision.
- No industry-specialized variants (agency vs SaaS vs ecommerce); the frameworks are chosen to degrade gracefully across business types. Specialization can arrive later as references, not new skills.

## §13 Gap analysis - toward a top-tier ("McKinsey-grade") practice

> Proposed 2026-08-08, not locked. Assessed against the pillars that actually define the firm: structured problem solving, fact-base rigor, top-down communication, engagement management, and proprietary knowledge.

**Already at or above the bar:** the static MECE taxonomy with written boundary rules; the profit lever tree (§6.7 - a classic profit tree); hypothesis-not-verdict discipline; fact-provenance rules stricter than most human consultants; and one structural advantage no firm has - the brain persists client context between engagements, where a firm re-learns the client every study.

### A. Method gaps (the craft)

- **A1. Per-problem issue trees.** The kit's MECE is a *static* function taxonomy; top-tier practice builds a bespoke hypothesis/issue tree per problem and works the branches. Close: add SCQA problem framing + a mini issue tree to the arc's diagnose stage (§4) for non-obvious problems, with `issue-trees.md` under `business-checkup` (the kit's method holder).
- **A2. Pyramid-principle synthesis.** Commit artifacts are functional but not specced answer-first. Close: restructure consult-page templates answer-first (recommendation -> grouped support -> evidence), plus a 3-4 line synthesis discipline in every skill body.
- **A3. Universal "so what".** The rank-and-size rule exists only in §6.7. Generalize to every skill: no observation without an implication attached.

### B. Analytical machinery gaps

- **B1. Market sizing + market context.** `consult-strategy` has no sizing (top-down/bottom-up triangulation) or competitive-forces-lite machinery. Close: `market-sizing.md` + `market-context.md` references; research spends pre-flighted as usual.
- **B2. Benchmark sourcing method.** The kit bans invented benchmarks but offers no legitimate path to real ones. Close: `benchmarking-method.md` (source publicly, cite, confidence-rate, prefer the client's own trend over weak external comparisons).
- **B3. Scenario + sensitivity analysis.** Absent everywhere. Close lightly in `consult-finance` (base/upside/downside with shown arithmetic); the real fix is the §6.7 v2 calculator pressure point.
- **B4. Primary research.** No customer/stakeholder interview machinery (the SMB analog of expert interviews). Close: `customer-interviews.md` (guide design + synthesis) under `business-checkup` - interviewing is a data-gathering mode serving several functions, so it lives with the shared method, not one function.

### C. Engagement machinery - assessed and CUT (locked 2026-08-08)

Initially flagged as gaps, then cut when the kit's intent was sharpened: the goal is business acumen - the ability to structure and analyze a business case sharply - not a simulation of a consulting firm's engagement operations.

- **C1. Engagement container (scoping, workplans, interim reviews): dropped.** That is firm project management, not analysis. Continuity is already covered agent-natively: consult artifacts persist in the brain, and a big problem is simply several consults, each orienting on the last one's artifacts (§5). If dogfooding ever surfaces a real need for a tracked multi-analysis effort, the product's existing goal + task primitives are the vehicle - never kit machinery.
- **C2. Impact verification: not a standalone gap - one line folded into the snapshot cadence (§8).** When a scheduled snapshot finds adopted levers from a prior consult, the diff reports realized vs sized impact. Kept in that minimal form only because an analyst that sees which past calls moved the needle calibrates future ones - that is acumen, and it rides machinery already specced. No tracking program beyond that line.

### D. Deliberately out (audience mismatch, not oversights)

M&A / due diligence, org-scale change management, spans-and-layers work, proprietary benchmark databases, engagement/workplan management (C1), and the leveraged team model (parallel workstreams per tree branch could map to workflow fan-out later).

**Recommended sequencing:** A1-A3 close in v1 (cheap: reference files + template/arc edits - and they *are* the case-analysis craft, so they move from "gap" to core spec). B2 closes in v1 (small). B1, B4 target v1.5 after the P1 dogfood. B3 ships minimal now, real fix in v2. C2's snapshot line ships with `consult-finance`.
