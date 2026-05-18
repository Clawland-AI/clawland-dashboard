# clawland-dashboard

Fleet visualization dashboard for the Clawland edge AI ecosystem.

---

## Overview

`clawland-dashboard` is a real-time web dashboard for monitoring and managing distributed Claw agent fleets. Built with React and TypeScript, it connects to the [clawland-fleet](https://github.com/Clawland-AI/clawland-fleet) backend.

## Features

- **Node Map** — Real-time geographic view of all edge nodes with status indicators
- **Alert Timeline** — Chronological alert feed with severity filtering and acknowledgment
- **Sensor Charts** — Live and historical sensor data visualization (temperature, humidity, DO, etc.)
- **Fleet Overview** — Node health matrix, uptime stats, and fleet-wide analytics
- **Command Center** — Send commands to individual nodes or node groups
- **Configuration** — Remote agent configuration management

## Current Implementation

This repository now ships a runnable Fleet Manager Dashboard:

- Real-time node status overview with online, warning, critical, and offline states
- Geolocated node map with selectable fleet nodes
- Alert aggregation with severity filtering and acknowledgment state display
- Sensor trend visualization for node-level telemetry
- Command dispatch form that posts to Fleet Manager or simulates queueing in demo mode
- Fleet API polling plus optional WebSocket updates, with mock data fallback for local demos

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 + TypeScript |
| State | React hooks |
| Charts | SVG line chart |
| Maps | SVG geolocation view |
| Real-time | Fleet API polling + optional WebSocket |
| Styling | CSS variables and responsive grid |
| Build | Vite |

## Quick Start

```bash
git clone https://github.com/Clawland-AI/clawland-dashboard.git
cd clawland-dashboard
npm install
npm run dev
```

Open http://localhost:5173 and connect to your moltclaw Fleet Manager endpoint.

If no endpoint is configured, the dashboard runs with deterministic demo telemetry so reviewers can inspect every view without starting a backend.

## Fleet API Contract

Set the endpoint in the top-right input, or leave it blank for demo mode. The dashboard expects:

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/fleet/nodes` | Returns fleet node status records |
| GET | `/fleet/events` | Returns alert/event records |
| GET | `/fleet/metrics` | Returns node sensor series |
| WS | `/fleet/ws` | Optional live partial snapshot updates |
| POST | `/fleet/command` | Queues a command for a target node |

Command dispatch payload:

```json
{
  "target_node_id": "pond-guardian-07",
  "type": "run_skill",
  "payload": {
    "skill": "diagnostics",
    "mode": "quick"
  }
}
```

## Directory Structure

```
clawland-dashboard/
├── src/
│   ├── fleetClient.ts         # Fleet API and command dispatch client
│   ├── mockData.ts            # Demo telemetry for local review
│   ├── styles.css             # Dashboard layout and responsive styling
│   ├── types.ts               # TypeScript type definitions
│   └── App.tsx
├── public/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Validation

```bash
npm run build
```

## Related Repositories

- [clawland-fleet](https://github.com/Clawland-AI/clawland-fleet) — Backend orchestration API
- [moltclaw](https://github.com/Clawland-AI/moltclaw) — Cloud AI Gateway
- [clawland-grafana](https://github.com/Clawland-AI/clawland-grafana) — Grafana integration for deep metrics

## Contributing

See [CONTRIBUTING.md](https://github.com/Clawland-AI/.github/blob/main/CONTRIBUTING.md). Dashboard improvements earn contribution points toward the quarterly [Revenue Pool](https://github.com/Clawland-AI/.github/blob/main/CONTRIBUTOR-REVENUE-SHARE.md).

## License

BSL 1.1 — Converts to Apache 2.0 after 4 years. See [LICENSE](LICENSE).

> **Additional Use Grant**: Non-competitive production use is permitted. You may not offer this dashboard as a hosted service competing directly with Clawland's official SaaS.
