# XeroHost NOC panel

Internal network operations console built with Next.js, Prisma, NextAuth, and Tailwind CSS. Provides management of nodes, firewall rules, prefixes, and audit logging plus a node-side agent for synchronizing iptables/ipset.

## Getting started

1. Copy environment template:
   ```bash
   cp .env.example .env
   # update DATABASE_URL, DATABASE_PROVIDER, NEXTAUTH_SECRET
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Generate Prisma client and run migrations:
   ```bash
   npx prisma migrate dev --name init
   ```
4. Seed at least one user manually via the database with a bcrypt-hashed password and desired role (`owner`, `admin`, `noc`, `read_only`).
5. Run the app:
   ```bash
   npm run dev
   ```

The app requires authentication for all routes except `/login` and NextAuth internals. Roles owner/admin/noc can modify data; read_only can only view.

## API highlights

- `GET /api/nodes/{id}/rules` — bearer token (Node.apiToken) protected endpoint for agents returning global and node-specific active firewall rules.
- CRUD for nodes (`/api/nodes`), firewall rules (`/api/firewall-rules`), prefixes (`/api/prefixes`), audit logs (`/api/audit-logs`), and IP lookup (`/api/ip-lookup?ip=x.x.x.x`).

## Node agent

`agent/agent.ts` is a TypeScript script for Linux nodes. Configure and run with:
```bash
PANEL_URL=https://panel.example.com \
NODE_ID=cl... \
API_TOKEN=generated_token \
POLL_INTERVAL_MS=30000 \
node dist/agent.js
```

Behavior:
- Polls the panel every 30s for active rules.
- Ensures ipset sets (`block_global_v4`, `block_node_v4`, `block_global_v6`, `block_node_v6`) exist and match panel state.
- Ensures iptables/ip6tables FORWARD rules drop traffic matching the sets (source or destination).
- Idempotent syncing to avoid duplicates.

Compile with `tsc` or run via ts-node in trusted environments.
