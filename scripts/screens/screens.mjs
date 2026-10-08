// Renders the UI screens shown on devices inside the Blender dioramas (and on
// the live 3D product models): GWD-palette dashboards, shops, apps and tools,
// drawn as HTML and captured to PNG.
//   node scripts/screens/screens.mjs [name,name]   → scripts/screens/out/<name>.png
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const OUT = path.resolve('scripts/screens/out');
fs.mkdirSync(OUT, { recursive: true });

const RED = '#e63946';
const MAROON = '#781215';
const LOGO = '#b40001';

/* ── Building blocks ───────────────────────────────────────── */
const base = (dark) => `
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{width:100%;height:100%;overflow:hidden}
  body{font-family:'Segoe UI',Arial,sans-serif;background:${dark ? '#0d0d10' : '#f4f4f6'};color:${dark ? '#f1f1ef' : '#121214'};-webkit-font-smoothing:antialiased}
  .muted{color:${dark ? '#8b8b93' : '#7a7a82'}}
  .card{background:${dark ? '#16161b' : '#ffffff'};border-radius:18px;box-shadow:${dark ? 'inset 0 0 0 1px #24242b' : '0 1px 0 #e4e4e8, 0 8px 24px -16px rgba(0,0,0,.25)'};padding:22px}
  .row{display:flex;gap:18px}.col{display:flex;flex-direction:column;gap:18px}
  .grow{flex:1}.red{color:${RED}}
  .pill{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:999px;font-size:15px}
  .dot{width:9px;height:9px;border-radius:50%;background:${RED};display:inline-block}
  .bar{height:12px;border-radius:6px;background:${dark ? '#24242b' : '#e8e8ec'}}
  h1{font-size:34px;font-weight:600;letter-spacing:-.02em} h2{font-size:22px;font-weight:600} h3{font-size:17px;font-weight:600}
  .k{font-size:44px;font-weight:300;letter-spacing:-.03em}
`;

const mark = (h = 28) =>
  `<svg height="${h}" viewBox="15 0 580 236"><path fill="${MAROON}" d="M19 80H37V214H169V232H19Z"/><path fill="${MAROON}" d="M440 4H590V156H572V22H440Z"/><path fill="${LOGO}" d="M190 53H150A67 69.5 0 0 0 150 192H190V105H136V132H163V166H150A40 43.5 0 0 1 150 79H190Z"/><path fill="${LOGO}" d="M213 79H241L258 125L285 53H314L340 125L357 79H384L342 192H338L300 89L260 192H256Z"/><path fill="${LOGO}" d="M412 53H450A68 69.5 0 0 1 450 192H412V137H438V166H450A40 43.5 0 0 0 450 79H438V110H412Z"/></svg>`;

// A deterministic pseudo-random series for charts.
function series(n, seed = 1, lo = 0.2, hi = 0.9, trend = 0.4) {
  let s = seed;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: n }, (_, i) => Math.min(1, Math.max(0, lo + (hi - lo) * (0.35 * r() + 0.65 * ((i / (n - 1)) * trend + (1 - trend) * r())))));
}
function line(vals, w, h, color = RED, fill = true) {
  const pts = vals.map((v, i) => [(i / (vals.length - 1)) * w, h - v * h]);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="overflow:visible">${fill ? `<path d="${d} L${w} ${h} L0 ${h} Z" fill="${color}" opacity=".14"/>` : ''}<path d="${d}" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round"/></svg>`;
}
function bars(vals, w, h, hot = -1, dark = true) {
  const bw = w / vals.length;
  return `<svg width="${w}" height="${h}">${vals.map((v, i) => `<rect x="${i * bw + bw * 0.18}" y="${h - v * h}" width="${bw * 0.64}" height="${v * h}" rx="5" fill="${i === hot ? RED : dark ? '#3a3a44' : '#d5d5db'}"/>`).join('')}</svg>`;
}
function donut(pct, size = 150, dark = true) {
  const r = size / 2 - 12;
  const c = 2 * Math.PI * r;
  return `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${dark ? '#26262d' : '#e6e6ea'}" stroke-width="16"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${RED}" stroke-width="16" stroke-linecap="round" stroke-dasharray="${c * pct} ${c}" transform="rotate(-90 ${size / 2} ${size / 2})"/><text x="50%" y="54%" text-anchor="middle" font-size="30" font-weight="300" fill="${dark ? '#f1f1ef' : '#111'}">${Math.round(pct * 100)}%</text></svg>`;
}
const sidebar = (items, active = 0, dark = true) =>
  `<div style="width:230px;padding:26px 18px;display:flex;flex-direction:column;gap:6px;background:${dark ? '#111115' : '#fff'};border-right:1px solid ${dark ? '#202027' : '#e6e6ea'}">
    <div style="margin:0 8px 26px">${mark(30)}</div>
    ${items.map((t, i) => `<div style="padding:11px 14px;border-radius:12px;font-size:16px;${i === active ? `background:${dark ? '#1d1d23' : '#f1f1f4'};font-weight:600` : `color:${dark ? '#8b8b93' : '#7a7a82'}`}">${i === active ? `<span class="dot" style="margin-right:10px"></span>` : ''}${t}</div>`).join('')}
  </div>`;
const topbar = (title, dark = true, right = '') =>
  `<div style="display:flex;align-items:center;justify-content:space-between;padding:22px 30px;border-bottom:1px solid ${dark ? '#202027' : '#e6e6ea'}"><h1 style="font-size:28px">${title}</h1><div class="row" style="align-items:center">${right}<div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,${RED},${MAROON})"></div></div></div>`;
const app = (dark, side, title, body, right = '') =>
  `<div style="display:flex;width:100%;height:100%">${side}<div class="grow" style="display:flex;flex-direction:column">${topbar(title, dark, right)}<div style="padding:26px 30px;flex:1" class="col">${body}</div></div></div>`;
const kpi = (label, value, delta) =>
  `<div class="card grow"><div class="muted" style="font-size:15px">${label}</div><div class="k" style="margin-top:8px">${value}</div><div style="margin-top:6px;font-size:14px" class="${delta.startsWith('-') ? 'muted' : 'red'}">${delta}</div></div>`;

/* ── Screens ──────────────────────────────────────────────── */
const SCREENS = {
  // Desktop dashboards (1600x1000)
  'soc-dashboard': {
    w: 1600,
    h: 1000,
    dark: true,
    html: () => {
      const dots = Array.from({ length: 34 }, (_, i) => {
        const x = 60 + ((i * 97) % 720);
        const y = 40 + ((i * 53) % 300);
        const hot = i % 7 === 0;
        return `<circle cx="${x}" cy="${y}" r="${hot ? 9 : 5}" fill="${hot ? RED : '#5a5a66'}" opacity="${hot ? 1 : 0.8}"/>${hot ? `<circle cx="${x}" cy="${y}" r="22" fill="none" stroke="${RED}" stroke-width="2" opacity=".5"/>` : ''}`;
      }).join('');
      return app(
        true,
        sidebar(['Overview', 'Threats', 'Assets', 'Vulnerabilities', 'Compliance', 'Incidents', 'Reports']),
        'Security operations',
        `<div class="row">${kpi('Threats blocked today', '1,284', '+12% vs yesterday')}${kpi('Open incidents', '3', '-2 since morning')}${kpi('Critical vulnerabilities', '0', 'All patched')}${kpi('Compliance score', '98%', 'ISO 27001 · SOC 2')}</div>
         <div class="row grow"><div class="card" style="flex:1.6"><h3>Live threat map</h3><svg width="840" height="380" style="margin-top:14px"><rect width="840" height="380" rx="14" fill="#101014"/>${dots}<path d="M120 300 Q 420 40 760 220" stroke="${RED}" stroke-width="2.5" fill="none" stroke-dasharray="8 8"/><path d="M200 120 Q 460 260 700 90" stroke="#777" stroke-width="2" fill="none" stroke-dasharray="6 10"/></svg></div>
         <div class="card col grow"><h3>Firewall events</h3>${['Blocked SQL injection · api.gateway', 'Brute-force attempt · auth', 'Port scan · 185.22.x.x', 'Malware signature · mail', 'Policy update deployed'].map((t, i) => `<div class="row" style="align-items:center;padding:10px 0;border-bottom:1px solid #22222a;font-size:15px"><span class="dot" style="background:${i < 3 ? RED : '#5a5a66'}"></span><span class="grow">${t}</span><span class="muted">${12 + i * 7}s</span></div>`).join('')}<div style="margin-top:auto">${line(series(30, 7), 460, 110)}</div></div></div>`,
      );
    },
  },
  'analytics-dashboard': {
    w: 1600,
    h: 1000,
    dark: false,
    html: () =>
      app(
        false,
        sidebar(['Dashboard', 'Revenue', 'Customers', 'Funnels', 'Cohorts', 'Data sources'], 0, false),
        'Business analytics',
        `<div class="row">${kpi('Revenue', '₹48.2L', '+18.4% this quarter', false)}${kpi('Active users', '12,480', '+9.1%', false)}${kpi('Conversion', '4.7%', '+0.6 pts', false)}${kpi('Churn', '1.9%', '-0.4 pts', false)}</div>
         <div class="row grow"><div class="card" style="flex:1.7"><h3>Revenue by month</h3><div style="margin-top:20px">${line(series(24, 3, 0.15, 0.95, 0.85), 880, 300)}</div></div>
         <div class="card col grow"><h3>Channels</h3><div style="display:flex;justify-content:center">${donut(0.68, 190, false)}</div>${bars(series(8, 11, 0.3, 1, 0.5), 420, 150, 5, false)}</div></div>`,
      ),
  },
  'ai-workflow': {
    w: 1600,
    h: 1000,
    dark: true,
    html: () => {
      const nodes = [
        ['Trigger', 'New invoice email', 90, 160],
        ['AI · Extract', 'Read fields with LLM', 470, 90],
        ['AI · Classify', 'Vendor & category', 470, 300],
        ['Validate', 'Rules + human check', 850, 190],
        ['ERP', 'Post to ledger', 1180, 120],
        ['Notify', 'Slack + email', 1180, 330],
      ];
      const n = nodes.map(([t, s, x, y], i) => `<div style="position:absolute;left:${x}px;top:${y}px;width:250px" class="card"><div class="row" style="align-items:center;gap:10px"><div style="width:34px;height:34px;border-radius:10px;background:${i === 1 || i === 2 ? RED : '#2a2a32'};display:grid;place-items:center;font-weight:700;font-size:15px">${i === 1 || i === 2 ? 'AI' : i + 1}</div><h3>${t}</h3></div><div class="muted" style="margin-top:10px;font-size:15px">${s}</div></div>`).join('');
      return app(
        true,
        sidebar(['Workflows', 'Agents', 'Runs', 'Models', 'Integrations', 'Settings']),
        'Invoice automation',
        `<div class="row" style="align-items:center"><span class="pill" style="background:#1f1f25"><span class="dot"></span>Running · 2,318 runs this week</span><span class="pill" style="background:#1f1f25">Saved 412 hours</span></div>
         <div class="card grow" style="position:relative;padding:0;background:#121216;background-image:radial-gradient(#26262e 1.5px,transparent 1.5px);background-size:26px 26px">
           <svg style="position:absolute;inset:0" width="1300" height="620"><g fill="none" stroke="${RED}" stroke-width="3" stroke-dasharray="10 8"><path d="M340 200 C 400 200 410 130 470 130"/><path d="M340 200 C 400 200 410 340 470 340"/><path d="M720 130 C 790 130 790 230 850 230"/><path d="M720 340 C 790 340 790 230 850 230"/><path d="M1100 230 C 1140 230 1140 160 1180 160"/><path d="M1100 230 C 1140 230 1140 370 1180 370"/></g></svg>${n}</div>`,
      );
    },
  },
  'cloud-console': {
    w: 1600,
    h: 1000,
    dark: true,
    html: () =>
      app(
        true,
        sidebar(['Clusters', 'Deployments', 'Pipelines', 'Monitoring', 'Costs', 'Logs']),
        'Production · ap-south-1',
        `<div class="row">${kpi('Uptime (30 days)', '99.98%', 'SLA met')}${kpi('Deploys today', '14', 'All green')}${kpi('p95 latency', '182 ms', '-24 ms')}${kpi('Monthly cost', '-31%', 'after rightsizing')}</div>
         <div class="row grow"><div class="card" style="flex:1.4"><h3>CI/CD pipeline</h3><div class="row" style="margin-top:26px;align-items:center">${['Build', 'Test', 'Scan', 'Stage', 'Deploy'].map((s, i) => `<div class="col" style="align-items:center;gap:10px"><div style="width:74px;height:74px;border-radius:20px;background:${i < 4 ? '#1f2f24' : RED};display:grid;place-items:center;font-size:30px">${i < 4 ? '✓' : '↑'}</div><span style="font-size:15px">${s}</span></div>${i < 4 ? '<div class="grow" style="height:3px;background:#2e2e36;margin-bottom:30px"></div>' : ''}`).join('')}</div><div style="margin-top:34px">${line(series(40, 5, 0.3, 0.7, 0.1), 720, 160, '#9a9aa6')}</div></div>
         <div class="card col grow"><h3>Nodes</h3>${Array.from({ length: 8 }, (_, i) => `<div class="row" style="align-items:center;font-size:15px"><span class="dot" style="background:${i === 5 ? RED : '#3fbf6f'}"></span><span class="grow">node-${String(i + 1).padStart(2, '0')} · k8s</span><div class="bar" style="width:160px;position:relative"><div style="position:absolute;inset:0;width:${30 + ((i * 23) % 60)}%;background:${i === 5 ? RED : '#55555f'};border-radius:6px"></div></div></div>`).join('')}</div></div>`,
      ),
  },
  'noc-monitor': {
    w: 1600,
    h: 1000,
    dark: true,
    html: () =>
      app(
        true,
        sidebar(['Status', 'Alerts', 'Tickets', 'Assets', 'Backups', 'SLA']),
        'Managed services · status',
        `<div class="row">${kpi('Systems monitored', '312', 'across 14 clients')}${kpi('Open tickets', '7', 'avg. response 9 min')}${kpi('Backups', '100%', 'verified tonight')}${kpi('Patch compliance', '97%', '+3 this week')}</div>
         <div class="row grow"><div class="card grow"><h3>Service health</h3><div style="display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-top:18px">${Array.from({ length: 30 }, (_, i) => `<div style="height:62px;border-radius:12px;background:${i === 8 || i === 21 ? RED : '#1f2a22'};display:grid;place-items:center;font-size:13px;color:${i === 8 || i === 21 ? '#fff' : '#7fd09a'}">${['API', 'DB', 'Web', 'Mail', 'VPN', 'ERP'][i % 6]}-${Math.floor(i / 6) + 1}</div>`).join('')}</div></div>
         <div class="card col" style="width:420px"><h3>Ticket queue</h3>${['Printer offline · Branch 2', 'Disk 92% · db-03', 'New laptop setup', 'VPN access request', 'SSL renewal due'].map((t, i) => `<div style="padding:12px 0;border-bottom:1px solid #22222a;font-size:15px" class="row"><span class="grow">${t}</span><span class="${i < 2 ? 'red' : 'muted'}">${i < 2 ? 'P1' : 'P3'}</span></div>`).join('')}</div></div>`,
      ),
  },
  'erp-dashboard': {
    w: 1600,
    h: 1000,
    dark: false,
    html: () =>
      app(
        false,
        sidebar(['Home', 'Orders', 'Inventory', 'Finance', 'HR', 'Approvals', 'Reports'], 0, false),
        'Operations',
        `<div class="row">${kpi('Orders today', '386', '+7%', false)}${kpi('Inventory value', '₹2.4Cr', 'across 4 warehouses', false)}${kpi('Pending approvals', '12', '3 urgent', false)}${kpi('Payroll', 'Ready', 'runs on the 30th', false)}</div>
         <div class="row grow"><div class="card" style="flex:1.5"><h3>Orders</h3><div style="margin-top:12px">${['#SO-4821 · Wholesale · ₹4.2L · Dispatched', '#SO-4820 · Retail · ₹86k · Packing', '#SO-4819 · Export · ₹12.6L · Awaiting LC', '#SO-4818 · Retail · ₹42k · Delivered', '#SO-4817 · Distributor · ₹3.1L · Invoiced'].map((t, i) => `<div style="padding:15px 0;border-bottom:1px solid #ececf0;font-size:16px" class="row"><span class="dot" style="background:${i === 2 ? RED : '#c9c9cf'};margin-top:6px"></span><span class="grow">${t}</span></div>`).join('')}</div></div>
         <div class="card col grow"><h3>Stock levels</h3>${bars(series(10, 21, 0.25, 1, 0.2), 460, 240, 3, false)}</div></div>`,
      ),
  },
  'saas-product': {
    w: 1600,
    h: 1000,
    dark: false,
    html: () =>
      app(
        false,
        sidebar(['Projects', 'Roadmap', 'Releases', 'Feedback', 'Billing', 'Team'], 1, false),
        'Roadmap · v2.0',
        `<div class="row grow">${['Discovery', 'In design', 'Building', 'Shipped'].map((col, ci) => `<div class="col grow" style="background:#ececf0;border-radius:18px;padding:16px"><div class="row" style="align-items:center"><h3 class="grow">${col}</h3><span class="muted">${3 + ci}</span></div>${Array.from({ length: 3 + (ci % 2) }, (_, i) => `<div class="card" style="padding:16px"><div style="font-size:16px;font-weight:600">${['Onboarding flow', 'Billing v2', 'Team roles', 'Mobile sync', 'Audit log', 'SSO', 'Usage analytics', 'Dark mode'][(ci * 3 + i) % 8]}</div><div class="row" style="margin-top:12px;align-items:center"><span class="pill" style="background:${(ci + i) % 3 === 0 ? RED : '#efeff2'};color:${(ci + i) % 3 === 0 ? '#fff' : '#555'};font-size:13px;padding:4px 10px">${['P1', 'P2', 'P3'][(ci + i) % 3]}</span><div class="grow"></div><div style="width:28px;height:28px;border-radius:50%;background:#d0d0d6"></div></div></div>`).join('')}</div>`).join('')}</div>`,
      ),
  },
  'api-console': {
    w: 1600,
    h: 1000,
    dark: true,
    html: () =>
      app(
        true,
        sidebar(['Endpoints', 'Integrations', 'Webhooks', 'Keys', 'Logs', 'Docs']),
        'Integrations',
        `<div class="row">${['Stripe', 'Razorpay', 'WhatsApp', 'Salesforce', 'Shopify', 'SAP'].map((t, i) => `<div class="card grow" style="text-align:center"><div style="width:58px;height:58px;margin:0 auto 12px;border-radius:16px;background:${i === 1 ? RED : '#25252c'};display:grid;place-items:center;font-size:24px;font-weight:700">${t[0]}</div><div style="font-size:16px">${t}</div><div class="muted" style="font-size:13px;margin-top:4px">● Connected</div></div>`).join('')}</div>
         <div class="row grow"><div class="card" style="flex:1.2;font-family:Consolas,monospace;font-size:17px;line-height:1.7"><div class="muted">POST /v1/orders</div><div>{</div><div>&nbsp;&nbsp;<span class="red">"customer"</span>: "cus_8421",</div><div>&nbsp;&nbsp;<span class="red">"items"</span>: [ { "sku": "GWD-01", "qty": 2 } ],</div><div>&nbsp;&nbsp;<span class="red">"payment"</span>: "razorpay",</div><div>&nbsp;&nbsp;<span class="red">"notify"</span>: [ "whatsapp", "email" ]</div><div>}</div><div style="margin-top:16px;color:#7fd09a">→ 201 Created · 84 ms</div></div>
         <div class="card col grow"><h3>Requests / min</h3>${line(series(36, 13, 0.3, 0.9, 0.3), 560, 220)}<div class="muted" style="font-size:15px">99.99% success · 2.1M calls this week</div></div></div>`,
      ),
  },
  'design-tool': {
    w: 1600,
    h: 1000,
    dark: true,
    html: () =>
      `<div style="display:flex;height:100%"><div style="width:250px;background:#151519;padding:20px" class="col">${mark(26)}<div class="muted" style="margin-top:20px;font-size:14px">LAYERS</div>${['Home', 'Hero', 'Nav', 'Cards', 'Checkout', 'Profile'].map((t, i) => `<div style="font-size:15px;padding:6px 8px;border-radius:8px;${i === 1 ? 'background:#26262d' : ''}">▢ ${t}</div>`).join('')}</div>
       <div class="grow" style="background:#1e1e23;position:relative;display:flex;gap:40px;align-items:center;justify-content:center">${[0, 1, 2].map((k) => `<div style="width:300px;height:620px;border-radius:34px;background:#fff;padding:22px;color:#111;${k === 1 ? `outline:3px solid ${RED};outline-offset:8px` : ''}" class="col"><div style="height:${k === 0 ? 230 : 160}px;border-radius:20px;background:${k === 1 ? RED : '#e9e9ee'}"></div><div class="bar" style="width:70%"></div><div class="bar" style="width:90%"></div><div class="bar" style="width:55%"></div><div class="row"><div class="grow" style="height:90px;border-radius:16px;background:#f0f0f3"></div><div class="grow" style="height:90px;border-radius:16px;background:#f0f0f3"></div></div><div style="margin-top:auto;height:52px;border-radius:999px;background:#111"></div></div>`).join('')}</div>
       <div style="width:270px;background:#151519;padding:20px" class="col"><div class="muted" style="font-size:14px">COLOUR</div><div class="row">${[RED, MAROON, '#111', '#f4f4f6', '#9a9aa2'].map((c) => `<div style="width:36px;height:36px;border-radius:10px;background:${c};box-shadow:inset 0 0 0 1px #333"></div>`).join('')}</div><div class="muted" style="font-size:14px;margin-top:16px">TYPE</div><div style="font-size:42px;font-weight:300">Aa</div><div class="muted" style="font-size:14px">Geist · 300 / 64</div></div></div>`,
  },
  'brand-board': {
    w: 1600,
    h: 1000,
    dark: false,
    html: () =>
      `<div style="padding:50px;display:grid;grid-template-columns:1.2fr 1fr 1fr;grid-template-rows:1fr 1fr;gap:24px;height:100%">
        <div class="card" style="grid-row:span 2;display:flex;flex-direction:column;justify-content:space-between;background:#111;color:#fff"><div class="muted">Brand guidelines · v3</div><div style="font-size:88px;font-weight:300;letter-spacing:-.04em;line-height:.95">Make it<br/><span style="color:${RED}">unmistakable.</span></div><div class="muted">Logo · Colour · Type · Voice · Motion</div></div>
        <div class="card" style="display:grid;place-items:center">${mark(120)}</div>
        <div class="card" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:14px">${[RED, MAROON, '#111114', '#e9e9ee'].map((c) => `<div style="border-radius:14px;background:${c}"></div>`).join('')}</div>
        <div class="card" style="background:${RED};color:#fff;display:flex;flex-direction:column;justify-content:flex-end"><div style="font-size:40px;font-weight:300;line-height:1.05">Social · Launch week</div><div style="margin-top:10px;opacity:.8">+214% reach</div></div>
        <div class="card"><div class="muted">Campaign reach</div>${line(series(20, 17, 0.2, 0.95, 0.9), 380, 200)}</div></div>`,
  },
  'video-editor': {
    w: 1600,
    h: 1000,
    dark: true,
    html: () =>
      `<div class="col" style="height:100%;gap:0"><div class="row" style="flex:1;padding:20px;gap:20px"><div class="card" style="width:300px" ><div class="muted" style="font-size:14px">MEDIA</div>${Array.from({ length: 6 }, (_, i) => `<div style="height:60px;margin-top:10px;border-radius:10px;background:linear-gradient(135deg,${i % 2 ? '#2a2a33' : MAROON},#18181d)"></div>`).join('')}</div>
        <div class="grow" style="border-radius:18px;background:radial-gradient(circle at 40% 45%,#3a1014,#0a0a0c 70%);position:relative;overflow:hidden"><div style="position:absolute;left:50%;top:48%;width:260px;height:260px;margin:-130px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ff6b74,${RED} 40%,#5a0a12)"></div><div style="position:absolute;left:24px;bottom:20px" class="pill" style="background:#0008">● REC 00:01:24:12</div></div></div>
        <div style="height:330px;background:#121216;padding:18px 20px" class="col"><div class="row muted" style="font-size:13px">${Array.from({ length: 12 }, (_, i) => `<span class="grow">00:0${Math.floor(i / 2)}:${i % 2 ? '30' : '00'}</span>`).join('')}</div>${['V3', 'V2', 'V1', 'A1', 'A2'].map((t, ti) => `<div class="row" style="align-items:center;gap:12px"><span class="muted" style="width:30px">${t}</span><div class="grow" style="position:relative;height:42px">${Array.from({ length: 4 }, (_, i) => `<div style="position:absolute;left:${(i * 25 + ti * 4) % 90}%;width:${14 + ((i + ti) % 3) * 6}%;top:0;bottom:0;border-radius:8px;background:${ti < 3 ? (i === 1 && ti === 1 ? RED : '#3b3b47') : '#24453a'}"></div>`).join('')}</div></div>`).join('')}<div style="position:absolute"></div></div></div>`,
  },
  'game-screen': {
    w: 1600,
    h: 1000,
    dark: true,
    html: () => {
      const tiles = Array.from({ length: 16 * 10 }, (_, i) => {
        const x = i % 16;
        const y = Math.floor(i / 16);
        const ground = y > 6 || (y === 6 && x % 5 < 2);
        return `<div style="background:${ground ? (y === 7 ? '#3d3d48' : '#26262d') : 'transparent'};${y === 3 && x % 6 === 2 ? `background:${RED}` : ''}"></div>`;
      }).join('');
      return `<div style="position:relative;height:100%;background:linear-gradient(#1a0a0d,#0b0b0e)"><div style="position:absolute;inset:0;display:grid;grid-template-columns:repeat(16,1fr);grid-template-rows:repeat(10,1fr)">${tiles}</div>
        <div style="position:absolute;left:31%;top:54%;width:70px;height:96px;border-radius:14px;background:#f2f2f0;box-shadow:0 0 0 6px #111"></div><div style="position:absolute;left:62%;top:30%;width:60px;height:60px;border-radius:50%;background:${RED};box-shadow:0 0 40px ${RED}"></div>
        <div style="position:absolute;left:30px;top:26px" class="row"><div class="pill" style="background:#0009;font-size:22px">♥ ♥ ♥</div><div class="pill" style="background:#0009;font-size:22px">SCORE 24,800</div></div><div style="position:absolute;right:30px;top:26px" class="pill" style="background:#0009;font-size:22px">LEVEL 3</div></div>`;
    },
  },
  'consulting-board': {
    w: 1600,
    h: 1000,
    dark: false,
    html: () =>
      `<div style="padding:46px;height:100%" class="col"><div class="row" style="align-items:center"><h1 class="grow">Digital transformation roadmap</h1>${mark(34)}</div>
       <div class="row" style="margin-top:6px">${['Q1 · Assess', 'Q2 · Plan', 'Q3 · Build', 'Q4 · Scale'].map((q, i) => `<div class="grow pill" style="justify-content:center;background:${i === 1 ? RED : '#e7e7eb'};color:${i === 1 ? '#fff' : '#333'};font-size:17px">${q}</div>`).join('')}</div>
       <div style="position:relative;flex:1;margin-top:10px">${[['Cloud migration', 0, 40, 46], ['ERP rollout', 1, 22, 48], ['Data platform', 2, 34, 50], ['Security baseline', 3, 6, 30], ['AI pilots', 4, 52, 40], ['Team training', 5, 18, 70]].map(([t, row, start, len], i) => `<div style="position:absolute;top:${(row * 15) + 4}%;left:${start}%;width:${len}%;height:11%;border-radius:14px;background:${i === 4 ? RED : i % 2 ? '#2a2a30' : '#d3d3d9'};color:${i === 4 || i % 2 ? '#fff' : '#222'};display:flex;align-items:center;padding:0 18px;font-size:17px">${t}</div>`).join('')}<div style="position:absolute;top:0;bottom:0;left:47%;width:3px;background:${RED}"></div></div></div>`,
  },
  'shop-site': {
    w: 1600,
    h: 1000,
    dark: false,
    html: () =>
      `<div class="col" style="height:100%;gap:0"><div class="row" style="align-items:center;padding:22px 40px;border-bottom:1px solid #e6e6ea"><div style="font-size:26px;font-weight:700;letter-spacing:-.02em" class="grow">STUDIO<span class="red">.</span></div>${['New', 'Women', 'Men', 'Home', 'Sale'].map((t) => `<span style="font-size:17px;margin-left:24px">${t}</span>`).join('')}<span class="pill" style="background:#111;color:#fff;margin-left:30px">Cart · 2</span></div>
       <div class="row" style="padding:30px 40px;gap:30px;flex:1"><div style="flex:1.1;border-radius:26px;background:linear-gradient(135deg,#1a1a1f,#3a0d12);color:#fff;padding:44px;display:flex;flex-direction:column;justify-content:flex-end"><div style="font-size:70px;font-weight:300;letter-spacing:-.04em;line-height:.95">Autumn<br/>collection</div><div class="pill" style="background:${RED};margin-top:24px;align-self:flex-start;font-size:18px;padding:12px 22px">Shop now →</div></div>
       <div style="flex:1;display:grid;grid-template-columns:1fr 1fr;gap:20px">${['Overshirt', 'Tote bag', 'Sneaker', 'Lamp'].map((t, i) => `<div class="card col" style="padding:14px;gap:10px"><div style="flex:1;border-radius:14px;background:${i === 2 ? RED : ['#e7e7ec', '#d9d9df', '', '#ececf0'][i]}"></div><div class="row"><span class="grow" style="font-size:16px">${t}</span><b>₹${[2499, 1299, 4999, 3299][i]}</b></div></div>`).join('')}</div></div></div>`,
  },
  'code-editor': {
    w: 1600,
    h: 1000,
    dark: true,
    html: () => {
      const L = [
        ['import', ' { createOrder } ', 'from', " './orders';"],
        ['export async function', ' handler', '(req) {', ''],
        ['  const', ' order', ' = await createOrder(req.body);', ''],
        ['  await', ' notify', '(order.customer, "confirmed");', ''],
        ['  return', ' Response.json', '(order, { status: 201 });', ''],
        ['}', '', '', ''],
      ];
      return `<div style="display:flex;height:100%"><div style="width:250px;background:#121216;padding:22px;font-size:15px" class="col"><div class="muted">EXPLORER</div>${['app/', '  api/', '    orders.ts', '  components/', 'lib/', 'tests/'].map((t, i) => `<div style="white-space:pre;${i === 2 ? `color:${RED}` : ''}">${t}</div>`).join('')}</div><div class="grow" style="padding:34px 40px;font-family:Consolas,monospace;font-size:24px;line-height:1.9">${L.map((l, i) => `<div><span class="muted" style="display:inline-block;width:46px">${i + 1}</span><span class="red">${l[0]}</span><span>${l[1]}</span><span class="muted">${l[2]}</span><span>${l[3]}</span></div>`).join('')}<div style="margin-top:40px;padding:18px 22px;border-radius:14px;background:#15201a;color:#7fd09a;font-size:19px">✓ 128 tests passed · build 42s · deployed to staging</div></div></div>`;
    },
  },

  // Phone screens (720x1480)
  'phone-app': {
    w: 720,
    h: 1480,
    dark: false,
    html: () =>
      `<div class="col" style="padding:70px 34px 40px;height:100%"><div class="row" style="align-items:center"><div class="grow"><div class="muted" style="font-size:22px">Good morning</div><div style="font-size:40px;font-weight:600">Aisha</div></div><div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,${RED},${MAROON})"></div></div>
       <div style="border-radius:32px;background:#111;color:#fff;padding:34px"><div class="muted" style="font-size:22px">Balance</div><div style="font-size:66px;font-weight:300;letter-spacing:-.03em">₹1,24,580</div><div class="row" style="margin-top:20px">${['Send', 'Pay', 'Top up'].map((t, i) => `<div class="grow pill" style="justify-content:center;background:${i === 0 ? RED : '#2a2a30'};font-size:22px;padding:14px">${t}</div>`).join('')}</div></div>
       <div style="font-size:26px;font-weight:600">Activity</div>${['Grocery · −₹1,240', 'Salary · +₹82,000', 'Metro card · −₹300', 'Coffee · −₹180'].map((t, i) => `<div class="card row" style="align-items:center;padding:20px"><div style="width:52px;height:52px;border-radius:16px;background:${i === 1 ? RED : '#efeff2'}"></div><span style="font-size:22px">${t}</span></div>`).join('')}</div>`,
  },
  'phone-sports': {
    w: 720,
    h: 1480,
    dark: true,
    html: () =>
      `<div class="col" style="padding:70px 34px 40px;height:100%"><div class="row" style="align-items:center"><div class="grow" style="font-size:24px;font-weight:700">GWD <span class="red">SPORTS</span></div><span class="pill" style="background:#1f1f25;font-size:18px"><span class="dot"></span>Live</span></div>
       <div style="border-radius:30px;padding:30px;background:linear-gradient(135deg,#5c3f0c,#f0c75e);color:#1a1203"><div class="row"><div><div style="font-size:84px;font-weight:300;line-height:1">78</div><div style="font-size:24px;font-weight:600">MID</div></div><div class="grow"></div><div style="width:150px;height:150px;border-radius:50%;background:#1a120333"></div></div><div style="font-size:30px;font-weight:600;margin-top:20px">PLAYER NAME</div><div class="row" style="margin-top:14px;font-size:22px">${['APP 24', 'GLS 11', 'INV 17', 'DIS 88'].map((t) => `<span class="grow">${t}</span>`).join('')}</div><div style="margin-top:12px;font-size:18px;opacity:.8">GWD-ZRKZB8 · GOLD</div></div>
       <div class="card col" style="padding:26px"><div class="row" style="align-items:center"><span style="font-size:24px;font-weight:600" class="grow">Today's session</span><span class="red" style="font-size:20px">5:30 PM</span></div><div style="display:grid;grid-template-columns:repeat(9,1fr);gap:6px;width:270px;align-self:center;margin:10px 0">${Array.from({ length: 81 }, (_, i) => `<div style="aspect-ratio:1;background:${(i * 37) % 7 < 3 || [0, 1, 2, 9, 11, 18, 19, 20, 6, 7, 8, 15, 17, 24, 25, 26, 54, 55, 56, 63, 65, 72, 73, 74].includes(i) ? '#f1f1ef' : 'transparent'}"></div>`).join('')}</div><div class="pill" style="justify-content:center;background:${RED};font-size:22px;padding:16px">Check in with QR</div></div>
       <div class="card row" style="padding:22px;align-items:center"><span style="font-size:22px" class="grow">Fees · October</span><span style="font-size:22px;color:#7fd09a">Paid ✓</span></div></div>`,
  },
  'phone-nestbridge': {
    w: 720,
    h: 1480,
    dark: false,
    html: () =>
      `<div class="col" style="padding:64px 32px 36px;height:100%;gap:16px"><div class="row" style="align-items:center"><div class="grow" style="font-size:30px;font-weight:700">Nest<span class="red">Bridge</span></div><span class="pill" style="background:#ececf0;font-size:18px">⌖ Hyderabad</span></div>
       <div class="row" style="gap:10px">${['Buy', 'Rent', 'New launches'].map((t, i) => `<span class="pill" style="font-size:20px;padding:10px 20px;background:${i === 0 ? '#111' : '#fff'};color:${i === 0 ? '#fff' : '#111'};box-shadow:inset 0 0 0 1px #dedee3">${t}</span>`).join('')}</div>
       <div style="border-radius:28px;overflow:hidden;background:#fff;box-shadow:0 10px 30px -18px rgba(0,0,0,.4)"><div style="height:300px;position:relative;background:linear-gradient(180deg,#cfd8e4,#eef1f5)">${[[40, 150, 120], [180, 210, 150], [350, 120, 110], [480, 250, 170]].map(([x, h, w]) => `<div style="position:absolute;left:${x}px;bottom:0;width:${w}px;height:${h}px;background:#f7f7f9;box-shadow:inset 0 0 0 2px #d9dbe1;background-image:repeating-linear-gradient(0deg,transparent 0 22px,#c3c9d4 22px 30px),repeating-linear-gradient(90deg,transparent 0 18px,#f7f7f9 18px 30px)"></div>`).join('')}<span class="pill" style="position:absolute;left:18px;top:18px;background:${RED};color:#fff;font-size:18px">For sale</span><span class="pill" style="position:absolute;right:18px;top:18px;background:#fff;font-size:18px">✓ Verified</span></div><div style="padding:22px"><div style="font-size:28px;font-weight:600">3 BHK apartment · Kondapur</div><div class="muted" style="font-size:20px;margin-top:6px">Ready to move · Site visit with your agent</div></div></div>
       ${[['Villa · Tellapur', 'For sale', RED], ['2 BHK flat · Gachibowli', 'For rent', '#111'], ['Tower B · Kokapet', 'New launch', '#7a7a82']].map(([t, tag, c]) => `<div class="card row" style="align-items:center;padding:18px 20px"><div style="width:62px;height:62px;border-radius:16px;background:linear-gradient(135deg,#e6e8ee,#cdd3dd)"></div><span class="grow" style="font-size:22px">${t}</span><span class="pill" style="font-size:17px;color:#fff;background:${c}">${tag}</span></div>`).join('')}
       <div style="border-radius:24px;background:#111;color:#fff;padding:22px" class="row"><span class="dot" style="width:14px;height:14px;margin-top:8px"></span><div class="grow"><div style="font-size:22px;font-weight:600">Maintenance · plumber assigned</div><div class="muted" style="font-size:19px;margin-top:4px">Arriving 4:30 PM · tracked by NestBridge</div></div></div><div class="row" style="margin-top:auto;padding:18px 10px 0;border-top:1px solid #e2e2e6;justify-content:space-around"><div class="col" style="gap:6px;align-items:center;font-size:17px;color:${RED}"><div style="width:30px;height:30px;border-radius:9px;background:${RED}"></div>Explore</div><div class="col" style="gap:6px;align-items:center;font-size:17px;color:#7a7a82"><div style="width:30px;height:30px;border-radius:9px;background:#dcdce1"></div>Saved</div><div class="col" style="gap:6px;align-items:center;font-size:17px;color:#7a7a82"><div style="width:30px;height:30px;border-radius:9px;background:#dcdce1"></div>My home</div><div class="col" style="gap:6px;align-items:center;font-size:17px;color:#7a7a82"><div style="width:30px;height:30px;border-radius:9px;background:#dcdce1"></div>Agent</div></div></div>`,
  },
  'phone-torqio': {
    w: 720,
    h: 1480,
    dark: true,
    html: () =>
      `<div class="col" style="padding:64px 32px 36px;height:100%;gap:16px"><div class="row" style="align-items:center"><div class="grow" style="font-size:30px;font-weight:700">Torq<span class="red">io</span></div><span class="pill" style="background:#1f1f25;font-size:18px">⌖ Near you</span></div>
       <div class="row" style="gap:10px">${['Cars', 'Two-wheelers', 'Commercial'].map((t, i) => `<span class="pill" style="font-size:20px;padding:10px 18px;background:${i === 0 ? RED : '#1f1f25'}">${t}</span>`).join('')}</div>
       <div style="border-radius:28px;background:linear-gradient(160deg,#24242b,#0f0f12);height:300px;position:relative"><div style="position:absolute;left:70px;right:70px;bottom:70px;height:86px;border-radius:40px 60px 20px 20px;background:#e9e9ec"></div><div style="position:absolute;left:160px;right:200px;bottom:146px;height:66px;border-radius:40px 40px 0 0;background:#cfcfd4"></div><div style="position:absolute;left:120px;bottom:44px;width:68px;height:68px;border-radius:50%;background:#111;box-shadow:0 0 0 8px #444"></div><div style="position:absolute;right:120px;bottom:44px;width:68px;height:68px;border-radius:50%;background:#111;box-shadow:0 0 0 8px #444"></div><span class="pill" style="position:absolute;right:20px;top:20px;background:${RED};font-size:18px">✓ Inspected</span><div style="position:absolute;left:24px;top:22px;font-size:22px;font-weight:600">2019 hatchback · 42,000 km</div></div>
       <div class="card" style="padding:22px"><div class="row" style="align-items:center"><span class="grow" style="font-size:23px;font-weight:600">Mechanics near you</span><span class="red" style="font-size:19px">Book a check</span></div><div class="row" style="margin-top:16px">${['1.2 km', '2.0 km', '3.1 km'].map((d) => `<div class="grow col" style="gap:8px;align-items:center"><div style="width:70px;height:70px;border-radius:50%;background:linear-gradient(135deg,#3a3a42,#1c1c22);box-shadow:inset 0 0 0 2px #444"></div><span class="muted" style="font-size:18px">${d}</span></div>`).join('')}</div></div>
       <div class="card" style="padding:22px"><div style="font-size:23px;font-weight:600">Spare parts · brake pads</div><div class="row" style="margin-top:12px;align-items:center"><span class="dot" style="background:#7fd09a"></span><span class="grow" style="font-size:20px">In stock at 4 stores nearby</span><span class="pill" style="background:${RED};font-size:18px">Reserve</span></div></div><div class="row" style="margin-top:auto;padding:18px 10px 0;border-top:1px solid #24242b;justify-content:space-around"><div class="col" style="gap:6px;align-items:center;font-size:17px;color:${RED}"><div style="width:30px;height:30px;border-radius:9px;background:${RED}"></div>Buy</div><div class="col" style="gap:6px;align-items:center;font-size:17px;color:#8b8b93"><div style="width:30px;height:30px;border-radius:9px;background:#2a2a30"></div>Sell</div><div class="col" style="gap:6px;align-items:center;font-size:17px;color:#8b8b93"><div style="width:30px;height:30px;border-radius:9px;background:#2a2a30"></div>Service</div><div class="col" style="gap:6px;align-items:center;font-size:17px;color:#8b8b93"><div style="width:30px;height:30px;border-radius:9px;background:#2a2a30"></div>Parts</div></div></div>`,
  },
  'phone-dreamx': {
    w: 720,
    h: 1480,
    dark: false,
    html: () => {
      const X = '#B4005A';
      const tiles = [
        ['#f3d9e4', '#B4005A', 'Kurta'],
        ['#dfe6f2', '#2c3e66', 'Shirt'],
        ['#f6ead9', '#a8742a', 'Dress'],
        ['#e3f0e6', '#2f6b47', 'Kids set'],
      ];
      return `<div class="col" style="padding:64px 32px 36px;height:100%;gap:16px"><div class="row" style="align-items:center"><div class="grow" style="font-size:30px;font-weight:700">Dream<span style="color:${X}">X</span></div><span class="pill" style="background:${X};color:#fff;font-size:18px">⚡ 30 min</span></div>
       <div class="row" style="gap:10px">${['Men', 'Women', 'Kids'].map((t, i) => `<span class="pill" style="font-size:20px;padding:10px 22px;background:${i === 1 ? '#111' : '#fff'};color:${i === 1 ? '#fff' : '#111'};box-shadow:inset 0 0 0 1px #dedee3">${t}</span>`).join('')}</div>
       <div style="font-size:22px;font-weight:600">Live from stores near you</div>
       <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">${tiles.map(([bg, c, t]) => `<div style="border-radius:22px;background:#fff;box-shadow:0 8px 24px -18px rgba(0,0,0,.4);overflow:hidden"><div style="height:190px;background:${bg};position:relative"><div style="position:absolute;left:50%;top:26px;transform:translateX(-50%);width:96px;height:140px;background:${c};border-radius:30px 30px 10px 10px;clip-path:polygon(18% 0,82% 0,100% 18%,86% 28%,86% 100%,14% 100%,14% 28%,0 18%)"></div></div><div style="padding:12px 14px"><div style="font-size:19px;font-weight:600">${t}</div><div class="muted" style="font-size:16px;margin-top:4px">In stock · S M L</div></div></div>`).join('')}</div>
       <div style="border-radius:24px;background:#111;color:#fff;padding:22px"><div class="row" style="align-items:center"><span class="grow" style="font-size:22px;font-weight:600">Rider picked up your order</span><span style="font-size:20px;color:#ff8cc0">18 min</span></div><div style="height:10px;border-radius:5px;background:#2a2a30;margin-top:14px;position:relative"><div style="position:absolute;inset:0;width:58%;border-radius:5px;background:${X}"></div></div><div class="muted" style="font-size:18px;margin-top:10px">From a store 2.1 km away</div></div><div class="row" style="margin-top:auto;padding:18px 10px 0;border-top:1px solid #e2e2e6;justify-content:space-around"><div class="col" style="gap:6px;align-items:center;font-size:17px;color:${X}"><div style="width:30px;height:30px;border-radius:9px;background:${X}"></div>Shop</div><div class="col" style="gap:6px;align-items:center;font-size:17px;color:#7a7a82"><div style="width:30px;height:30px;border-radius:9px;background:#dcdce1"></div>Stores</div><div class="col" style="gap:6px;align-items:center;font-size:17px;color:#7a7a82"><div style="width:30px;height:30px;border-radius:9px;background:#dcdce1"></div>Orders</div><div class="col" style="gap:6px;align-items:center;font-size:17px;color:#7a7a82"><div style="width:30px;height:30px;border-radius:9px;background:#dcdce1"></div>Me</div></div></div>`;
    },
  },
  'phone-chat': {
    w: 720,
    h: 1480,
    dark: true,
    html: () =>
      `<div class="col" style="padding:70px 30px 40px;height:100%"><div class="row" style="align-items:center"><div style="width:58px;height:58px;border-radius:18px;background:${RED};display:grid;place-items:center;font-size:24px;font-weight:700">AI</div><div><div style="font-size:26px;font-weight:600">GWD Assistant</div><div class="muted" style="font-size:18px">Online · answers in seconds</div></div></div>
       ${[['me', 'Where is my order #4821?'], ['ai', 'It left the warehouse this morning and arrives tomorrow by 6 PM. Want live tracking on WhatsApp?'], ['me', 'Yes please'], ['ai', 'Done. I also updated your delivery address to Madhapur.']].map(([w, t]) => `<div style="align-self:${w === 'me' ? 'flex-end' : 'flex-start'};max-width:80%;padding:20px 24px;border-radius:26px;font-size:24px;line-height:1.35;background:${w === 'me' ? RED : '#1d1d23'}">${t}</div>`).join('')}<div style="margin-top:auto" class="card row"><span class="muted grow" style="font-size:22px">Ask anything…</span><span class="red" style="font-size:26px">↑</span></div></div>`,
  },
  // Signs and fascias for the product dioramas
  'sign-sale': { w: 800, h: 400, dark: true, html: () => `<div style="height:100%;background:${RED};display:grid;place-items:center;text-align:center;color:#fff"><div><div style="font-size:150px;font-weight:800;letter-spacing:.02em;line-height:1">FOR SALE</div><div style="font-size:44px;font-weight:600;margin-top:18px;opacity:.9">NestBridge</div></div></div>` },
  'sign-rent': { w: 800, h: 400, dark: false, html: () => `<div style="height:100%;background:#fff;display:grid;place-items:center;text-align:center;color:${RED}"><div><div style="font-size:150px;font-weight:800;line-height:1">FOR RENT</div><div style="font-size:44px;font-weight:600;margin-top:18px;color:#111">NestBridge</div></div></div>` },
  'sign-launch': { w: 800, h: 400, dark: true, html: () => `<div style="height:100%;background:#111114;display:grid;place-items:center;text-align:center;color:#fff"><div><div style="font-size:120px;font-weight:800;line-height:1">NEW LAUNCH</div><div style="font-size:44px;font-weight:600;margin-top:18px">Nest<span style="color:${RED}">Bridge</span></div></div></div>` },
  'sign-nestbridge': { w: 1200, h: 400, dark: true, html: () => `<div style="height:100%;background:#111114;display:grid;place-items:center;color:#fff;font-size:190px;font-weight:700;letter-spacing:-.03em"><div>Nest<span style="color:${RED}">Bridge</span></div></div>` },
  'sign-torqio': { w: 1200, h: 400, dark: true, html: () => `<div style="height:100%;background:#0d0d10;display:grid;place-items:center;color:#fff;font-size:220px;font-weight:700;letter-spacing:-.03em"><div>Torq<span style="color:${RED}">io</span></div></div>` },
  'sign-parts': { w: 800, h: 300, dark: true, html: () => `<div style="height:100%;background:${RED};display:grid;place-items:center;color:#fff;font-size:96px;font-weight:800;letter-spacing:.04em">SPARE PARTS</div>` },
  'sign-service': { w: 800, h: 300, dark: true, html: () => `<div style="height:100%;background:#1b1b20;display:grid;place-items:center;color:#fff;font-size:110px;font-weight:800;letter-spacing:.04em"><div>SERVICE <span style="color:${RED}">BAY</span></div></div>` },
  'sign-dreamx': { w: 1200, h: 400, dark: true, html: () => `<div style="height:100%;background:#B4005A;display:grid;place-items:center;color:#fff;font-size:220px;font-weight:800;letter-spacing:-.03em">DreamX</div>` },
  'sign-men': { w: 800, h: 300, dark: true, html: () => `<div style="height:100%;background:#20283a;display:grid;place-items:center;color:#f3efe6;font-size:130px;font-weight:300;letter-spacing:.3em;padding-left:.3em">MEN</div>` },
  'sign-women': { w: 800, h: 300, dark: false, html: () => `<div style="height:100%;background:#f6e3ea;display:grid;place-items:center;color:#7a1f45;font-size:120px;font-weight:300;letter-spacing:.25em;padding-left:.25em">WOMEN</div>` },
  'sign-kids': { w: 800, h: 300, dark: false, html: () => `<div style="height:100%;background:#fdf0c9;display:grid;place-items:center;color:#2f6b47;font-size:140px;font-weight:700;letter-spacing:.2em;padding-left:.2em">KIDS</div>` },
  'sign-30': { w: 600, h: 600, dark: false, html: () => `<div style="height:100%;background:#B4005A;display:grid;place-items:center"><div style="width:540px;height:540px;border-radius:50%;background:#fff;display:grid;place-items:center;color:#B4005A;text-align:center"><div><div style="font-size:250px;font-weight:800;line-height:.9">30</div><div style="font-size:70px;font-weight:700;color:#111">MIN</div></div></div></div>` },
  'ads-sports': { w: 2400, h: 260, dark: true, html: () => `<div style="height:100%;display:flex;align-items:center;background:#0b0b0d;color:#fff;font-size:120px;font-weight:800;letter-spacing:.04em;white-space:nowrap;gap:70px;padding:0 40px"><span>GWD <span style="color:${RED}">SPORTS</span></span><span style="color:${RED}">●</span><span>ACADEMIES</span><span style="color:${RED}">●</span><span>TOURNAMENTS</span></div>` },
  'board-sports': { w: 1600, h: 560, dark: true, html: () => `<div style="height:100%;background:#09090b;padding:40px 60px;display:flex;flex-direction:column;justify-content:space-between;color:#fff"><div style="display:flex;align-items:center;justify-content:space-between"><div style="font-size:64px;font-weight:800;letter-spacing:.04em">GWD <span style="color:${RED}">SPORTS</span></div><div style="font-size:44px;display:flex;align-items:center;gap:16px"><span style="width:26px;height:26px;border-radius:50%;background:${RED};display:inline-block"></span>LIVE</div></div><div style="display:flex;align-items:center;justify-content:center;gap:60px;font-size:200px;font-weight:700;line-height:1"><span style="font-size:70px;font-weight:600;color:#bbb">HOME</span>2 <span style="color:${RED}">–</span> 1<span style="font-size:70px;font-weight:600;color:#bbb">AWAY</span></div></div>` },
  // Wide billboard (1600x800)
  billboard: {
    w: 1600,
    h: 800,
    dark: true,
    html: () =>
      `<div style="height:100%;background:linear-gradient(120deg,#111114 40%,${MAROON});padding:70px;display:flex;flex-direction:column;justify-content:space-between"><div>${mark(60)}</div><div style="font-size:120px;font-weight:300;letter-spacing:-.05em;line-height:.9;color:#fff">Launching<br/><span style="color:${RED}">this Friday.</span></div></div>`,
  },
};

const only = process.argv[2]?.split(',');
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
for (const [name, s] of Object.entries(SCREENS)) {
  if (only && !only.includes(name)) continue;
  const page = await browser.newPage();
  await page.setViewport({ width: s.w, height: s.h, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${base(s.dark)}</style></head><body>${s.html()}</body></html>`, { waitUntil: 'load' });
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  await page.close();
  console.log('screen', name);
}
await browser.close();
