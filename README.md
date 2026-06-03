# prototype-for-jeffery

Agentic-AI prototype for an F&B SaaS kiosk (MY/SG dessert shop). Three agents —
**customer-facing**, **kitchen**, and **inventory** — share one tool-calling
loop, with event-driven auto-86 (out-of-stock → menu item disabled) and a
memory-augmented retrieval sidecar.

## Live demo (GitHub Pages)

The `snow-dessert/` kiosk + agent dashboards are published as a static site:

| View | URL |
|------|-----|
| App home (kiosk) | https://carrickcheah.github.io/prototype-for-jeffery/ |
| **Kitchen agent** | https://carrickcheah.github.io/prototype-for-jeffery/#app/kitchen-agent |
| Inventory agent | https://carrickcheah.github.io/prototype-for-jeffery/#app/inventory-agent |
| Customer-facing | https://carrickcheah.github.io/prototype-for-jeffery/#app/customer-facing-agent |

> **Static deploy note:** the dashboards render with realistic seed data. The
> live backend (`/api/*` — stats refresh + AI chat) runs as a separate Bun
> service and is **not** part of this Pages deployment.

## Local development

```bash
bun install
bun run dev                      # main Bun app on :8002 (API backend)
cd snow-dessert && bun run dev   # the kiosk UI
```

See [`CLAUDE.md`](./CLAUDE.md) for the full architecture map and `docs/` for
detailed design notes.
