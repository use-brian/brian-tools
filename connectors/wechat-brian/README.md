# WeChat Archive (`wechat-brian`)

Custom-connector MCP surface for the external **wechat-brian** service (source:
`use-brian/wechat-brian`). It exposes an assistant's archived WeChat history for
search. This is the external-service search surface of the messaging-archive
substrate (messaging-archive `D12`); it replaces the platform built-in
`searchChatArchive` for WeChat.

## Tools

| Tool | Purpose |
|---|---|
| `searchWeChatArchive` | Semantic + keyword search over the owner's archived WeChat messages. History recall only. |
| `getWeChatMessage` | Fetch one archived message by `provider_message_id`. |
| `listWeChatConversations` | List conversations with message counts, last activity, and any coverage gaps (history holes the archive is aware of). |

## Auth

`auth_type` is `api_key`: the user pastes a **per-instance token** the service
issued for their compartment. The MCP client presents it to the service as
`Authorization: Bearer <token>`. (The build plan calls this a "bearer" token;
the connector directory's auth enum has no `bearer` member, and `api_key` -- a
pasted secret, the same shape the GitHub-PAT connectors use -- is its exact fit.
The token still travels as an HTTP bearer.) Every call is scoped to the token's
compartment, so results are person-compartmented (messaging-archive `D3`): one
workspace member's token can never read another member's WeChat history.

## `mcp_url`

The archive is an **external service**, and on-prem it runs on the customer's own
box (wechat-brian `C8`: the gray corpus never leaves their hardware). The
`mcp_url` in `connector.json` is therefore a per-deployment value; the committed
default (`http://127.0.0.1:8787/mcp`) is the on-prem local address the service
binds by default (`WECHAT_BRIAN_ADDR`). Point it at the reachable address of the
deployed `wechat-brian` instance for a given customer.

## Related

- Service + build plan: `use-brian/wechat-brian/PLAN.md`.
- Append contract the service also implements (inbound push feed):
  `ub.ingest.append.v1` (`brian-platform/docs/plans/ingestion-external-endpoint.md` §4).
- Substrate + invariants: `brian-platform/docs/plans/messaging-archive-connector.md`.
