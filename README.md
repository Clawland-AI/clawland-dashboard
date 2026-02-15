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

## Screenshots

> Coming soon — Dashboard is in active development.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 + TypeScript |
| State | Zustand |
| Charts | Recharts |
| Maps | Leaflet |
| Real-time | WebSocket |
| Styling | Tailwind CSS |
| Build | Vite |

## Quick Start

```bash
git clone https://github.com/Clawland-AI/clawland-dashboard.git
cd clawland-dashboard
npm install
npm run dev
```

Open http://localhost:5173 and connect to your moltclaw Fleet Manager endpoint.

## Directory Structure

```
clawland-dashboard/
├── src/
│   ├── components/
│   │   ├── NodeMap/           # Geographic node visualization
│   │   ├── AlertTimeline/     # Alert feed and management
│   │   ├── SensorCharts/      # Sensor data visualization
│   │   ├── FleetOverview/     # Fleet health dashboard
│   │   ├── CommandCenter/     # Remote command interface
│   │   └── Layout/            # App shell and navigation
│   ├── hooks/                 # WebSocket and data hooks
│   ├── stores/                # Zustand state stores
│   ├── api/                   # Fleet API client
│   ├── types/                 # TypeScript type definitions
│   └── App.tsx
├── public/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
└── README.md
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
