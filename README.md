# brian-tools

Community connectors and skills for [Use Brian](https://usebrian.ai).

```
brian-tools/
├── connectors/              # MCP servers with connector.json
├── skills/                  # Agent Skills Spec skills
└── README.md
```

## Related repositories

- [`use-brian/brian-kb-template`](https://github.com/use-brian/brian-kb-template) — GitHub template for a team knowledge base repo. Click **Use this template** to scaffold one.
- [`@use-brian/brian-kb`](https://github.com/use-brian/use-brian/tree/main/packages/brian-kb) — shared parser + lint package, powering both the backend sync worker and the public `kb lint` CLI (`npx @use-brian/brian-kb lint ./my-team-kb`).

---

## Skills

Skills follow the [Agent Skills Spec](https://agentskills.io/specification). Use Brian-specific extensions live under `metadata`.

### SKILL.md format

```markdown
---
name: my-skill
description: What this skill does and when to use it.
license: MIT
compatibility: Designed for Use Brian
metadata:
  author: your-name
  author_url: https://github.com/your-name
  category: productivity
  when_to_use: When the user asks for X
  requires_connectors: gcal,gmail
---

Instructions the assistant follows when this skill is activated...
```

### Required fields

| Field | Constraints |
|---|---|
| `name` | Lowercase, hyphens, max 64 chars. Must match directory name. |
| `description` | What it does + when to use it. Max 1024 chars. |

### Optional fields (Agent Skills Spec)

| Field | Description |
|---|---|
| `license` | License name or reference to LICENSE.txt |
| `compatibility` | Environment requirements (max 500 chars) |
| `allowed-tools` | Space-separated pre-approved tool names |

### Use Brian metadata extensions

| Key | Description |
|---|---|
| `metadata.author` | Author name |
| `metadata.author_url` | Author URL |
| `metadata.category` | `productivity`, `communication`, `research`, or `custom` |
| `metadata.when_to_use` | When the model should invoke this skill |
| `metadata.requires_connectors` | Comma-separated connector IDs (e.g. `gcal,gmail`) |

### Example

`skills/daily-briefing/SKILL.md`:

```markdown
---
name: daily-briefing
description: Morning summary of calendar, emails, and tasks. Use when the user asks for a briefing or daily agenda.
metadata:
  author: Use Brian
  category: productivity
  when_to_use: When the user asks for a briefing, morning summary, or daily agenda
  requires_connectors: gcal,gmail
---

When activated, gather the user's day at a glance:

1. Check today's calendar events
2. Check unread important emails from the last 12 hours
3. Present as a concise summary with 3-5 bullet points
```

### Native bundle shape

Every skill is a portable folder. `SKILL.md` is the small entry point; ordinary
relative Markdown links make supporting material discoverable without loading
it eagerly.

```text
skills/my-skill/
├── SKILL.md
├── references/          # Detailed methods and domain knowledge
├── assets/              # Templates and files used in output
│   └── templates/
└── scripts/             # Text-backed helper source (not executed by Brian)
```

State when a resource should be read and link it directly, for example:

```markdown
Before scoring the business, read the [diagnostic questions](references/diagnostic-questions.md).
Create the final page from the [scorecard](assets/templates/scorecard.md).
Hand pipeline work to [consult-sales](../consult-sales/SKILL.md).
```

`references/`, `assets/`, and `scripts/` are native. `templates/` remains an
import-compatible legacy alias, but new templates belong under
`assets/templates/`.

### Progressive disclosure

1. **Listing** (~100 tokens): `name` + `description` shown each turn
2. **Activation** (< 5000 tokens): Full body loaded when the model invokes `useSkill`
3. **Resource index**: Paths, kinds, and descriptions exposed after activation
4. **Resource read/search**: Only the relevant linked files loaded on demand

Keep `SKILL.md` under 500 lines.

### Validate and import

Run `node validate-skills.mjs` before submitting a skill. It rejects missing
links, orphaned resources, broken cross-skill dependencies, invalid metadata,
and oversized roots.

Use Brian discovers this repository as its native catalog when it is checked
out next to `brian-platform`. A catalog install copies the complete bundle into
the workspace. GitHub import accepts either the skill folder or its `SKILL.md`
and preserves the same paths and source digest; no pointer appendix or body
rewrite is needed.

---

## Connectors

Connectors are [MCP](https://modelcontextprotocol.io) servers that add external service integrations.

### connector.json format

```json
{
  "id": "my-connector",
  "name": "My Connector",
  "description": "What this connector provides.",
  "icon_url": "https://example.com/icon.png",
  "mcp_url": "https://example.com/mcp",
  "auth_type": "none",
  "author": "your-name",
  "author_url": "https://github.com/your-name",
  "tags": ["category", "domain"]
}
```

### Fields

| Field | Required | Description |
|---|---|---|
| `id` | Yes | Unique identifier. Must match directory name. |
| `name` | Yes | Display name |
| `description` | Yes | What the connector provides |
| `mcp_url` | Yes | MCP server endpoint URL |
| `auth_type` | Yes | `none`, `oauth`, or `api_key` |
| `icon_url` | No | Square icon URL (min 64x64) |
| `author` | No | Author or organization name |
| `author_url` | No | Author URL |
| `tags` | No | Category tags for filtering |

### Example

`connectors/cgov/connector.json`:

```json
{
  "id": "cgov",
  "name": "Cardano Onchain Governance",
  "description": "Query proposals, DRep registrations, votes, and governance actions.",
  "icon_url": "https://app.cgov.io/favicon.ico",
  "mcp_url": "https://cgov-mcp-589811450826.asia-south1.run.app/mcp",
  "auth_type": "none",
  "author": "NOMOS",
  "author_url": "https://app.cgov.io",
  "tags": ["blockchain", "cardano", "governance"]
}
```

---

## Contributing

1. Fork this repo
2. Add your connector or skill in the appropriate directory
3. Follow the specs above
4. Submit a PR

## License

MIT
