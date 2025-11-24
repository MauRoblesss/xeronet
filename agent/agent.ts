import axios from "axios";
import { execSync } from "child_process";

const PANEL_URL = process.env.PANEL_URL;
const NODE_ID = process.env.NODE_ID;
const API_TOKEN = process.env.API_TOKEN;
const INTERVAL = Number(process.env.POLL_INTERVAL_MS || 30000);

if (!PANEL_URL || !NODE_ID || !API_TOKEN) {
  console.error("Missing PANEL_URL, NODE_ID, or API_TOKEN environment variables");
  process.exit(1);
}

const sets = {
  v4: { global: "block_global_v4", node: "block_node_v4" },
  v6: { global: "block_global_v6", node: "block_node_v6" },
};

function ensureSet(name: string, family: "inet" | "inet6") {
  try {
    execSync(`ipset list ${name}`);
  } catch {
    execSync(`ipset create ${name} hash:net family ${family}`);
  }
}

function syncSet(name: string, entries: string[]) {
  const current = new Set<string>();
  try {
    const output = execSync(`ipset list ${name} -o save`).toString();
    output
      .split("\n")
      .filter((l) => l.startsWith("add"))
      .forEach((l) => {
        const parts = l.split(" ");
        if (parts[2]) current.add(parts[2]);
      });
  } catch (e) {
    console.error("Failed to read ipset", name, e);
  }

  const desired = new Set(entries);
  for (const entry of desired) {
    if (!current.has(entry)) {
      execSync(`ipset add ${name} ${entry}`, { stdio: "ignore" });
    }
  }
  for (const entry of current) {
    if (!desired.has(entry)) {
      execSync(`ipset del ${name} ${entry}`, { stdio: "ignore" });
    }
  }
}

function ensureRules() {
  const ensureRule = (family: "ipv4" | "ipv6", setName: string) => {
    const table = family === "ipv4" ? "iptables" : "ip6tables";
    const rule = `-m set --match-set ${setName} src -j DROP`;
    const rules = execSync(`${table} -S FORWARD`).toString();
    if (!rules.includes(rule)) {
      execSync(`${table} -A FORWARD ${rule}`);
    }
    const ruleDst = `-m set --match-set ${setName} dst -j DROP`;
    if (!rules.includes(ruleDst)) {
      execSync(`${table} -A FORWARD ${ruleDst}`);
    }
  };

  ensureRule("ipv4", sets.v4.global);
  ensureRule("ipv4", sets.v4.node);
  ensureRule("ipv6", sets.v6.global);
  ensureRule("ipv6", sets.v6.node);
}

async function poll() {
  try {
    const { data } = await axios.get(`${PANEL_URL}/api/nodes/${NODE_ID}/rules`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      timeout: 10000,
    });
    const { globalRules, nodeRules } = data as { globalRules: any[]; nodeRules: any[] };
    console.log(`Fetched ${globalRules.length} global rules, ${nodeRules.length} node rules`);

    ensureSet(sets.v4.global, "inet");
    ensureSet(sets.v4.node, "inet");
    ensureSet(sets.v6.global, "inet6");
    ensureSet(sets.v6.node, "inet6");

    syncSet(
      sets.v4.global,
      globalRules.filter((r) => r.version === 4).map((r) => r.ip || r.cidr).filter(Boolean)
    );
    syncSet(
      sets.v4.node,
      nodeRules.filter((r) => r.version === 4).map((r) => r.ip || r.cidr).filter(Boolean)
    );
    syncSet(
      sets.v6.global,
      globalRules.filter((r) => r.version === 6).map((r) => r.ip || r.cidr).filter(Boolean)
    );
    syncSet(
      sets.v6.node,
      nodeRules.filter((r) => r.version === 6).map((r) => r.ip || r.cidr).filter(Boolean)
    );

    ensureRules();
  } catch (err) {
    console.error("Polling failed", err);
  }
}

console.log("Starting XeroHost node agent...");
poll();
setInterval(poll, INTERVAL);
