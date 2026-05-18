import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Cloud,
  Command,
  Filter,
  Gauge,
  Globe2,
  MapPin,
  Radio,
  RotateCw,
  Send,
  Server,
  ShieldCheck,
  SlidersHorizontal,
  WifiOff,
} from "lucide-react";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { dispatchCommand, fetchFleetSnapshot } from "./fleetClient";
import { mockSnapshot } from "./mockData";
import type { AlertEvent, CommandResult, FleetNode, FleetSnapshot, NodeStatus, SensorSeries, Severity } from "./types";

const statusLabel: Record<NodeStatus, string> = {
  online: "Online",
  warning: "Warning",
  critical: "Critical",
  offline: "Offline",
};

const severityRank: Record<Severity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

const statusIcon: Record<NodeStatus, ReactNode> = {
  online: <CheckCircle2 size={16} />,
  warning: <AlertTriangle size={16} />,
  critical: <AlertTriangle size={16} />,
  offline: <WifiOff size={16} />,
};

function useFleetData(apiBaseUrl: string) {
  const [snapshot, setSnapshot] = useState<FleetSnapshot>(mockSnapshot);
  const [connected, setConnected] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let disposed = false;
    let timer: number | undefined;

    const refresh = async () => {
      try {
        const next = await fetchFleetSnapshot(apiBaseUrl);
        if (!disposed) {
          setSnapshot(next);
          setConnected(Boolean(apiBaseUrl.trim()));
          setLoadError("");
        }
      } catch (error) {
        if (!disposed) {
          setSnapshot(mockSnapshot);
          setConnected(false);
          setLoadError(error instanceof Error ? error.message : "Fleet API unavailable");
        }
      }
    };

    refresh();
    timer = window.setInterval(refresh, 15000);

    return () => {
      disposed = true;
      if (timer) {
        window.clearInterval(timer);
      }
    };
  }, [apiBaseUrl]);

  useEffect(() => {
    if (!apiBaseUrl.trim()) {
      return undefined;
    }

    const wsUrl = apiBaseUrl.replace(/^http/, "ws").replace(/\/$/, "") + "/fleet/ws";
    let socket: WebSocket | undefined;

    try {
      socket = new WebSocket(wsUrl);
      socket.onmessage = (event) => {
        const next = JSON.parse(event.data) as Partial<FleetSnapshot>;
        setSnapshot((current) => ({
          nodes: next.nodes ?? current.nodes,
          alerts: next.alerts ?? current.alerts,
          sensorSeries: next.sensorSeries ?? current.sensorSeries,
          updatedAt: new Date().toISOString(),
        }));
        setConnected(true);
      };
      socket.onerror = () => setConnected(false);
    } catch {
      setConnected(false);
    }

    return () => socket?.close();
  }, [apiBaseUrl]);

  return { snapshot, connected, loadError };
}

export function App() {
  const [apiBaseUrl, setApiBaseUrl] = useState(() => localStorage.getItem("fleet-api-base") ?? "");
  const [selectedNodeId, setSelectedNodeId] = useState("all");
  const [severityFilter, setSeverityFilter] = useState<Severity | "all">("all");
  const [commandType, setCommandType] = useState("run_skill");
  const [commandPayload, setCommandPayload] = useState('{"skill":"diagnostics","mode":"quick"}');
  const [commandResult, setCommandResult] = useState<CommandResult>({ status: "idle", message: "Ready to dispatch." });

  const { snapshot, connected, loadError } = useFleetData(apiBaseUrl);

  const selectedNode = useMemo(
    () => snapshot.nodes.find((node) => node.id === selectedNodeId) ?? snapshot.nodes[0],
    [selectedNodeId, snapshot.nodes],
  );

  const alerts = useMemo(
    () =>
      snapshot.alerts
        .filter((alert) => severityFilter === "all" || alert.severity === severityFilter)
        .sort((a, b) => severityRank[a.severity] - severityRank[b.severity]),
    [severityFilter, snapshot.alerts],
  );

  const totals = useMemo(() => {
    const online = snapshot.nodes.filter((node) => node.status === "online").length;
    const warning = snapshot.nodes.filter((node) => node.status === "warning").length;
    const offline = snapshot.nodes.filter((node) => node.status === "offline").length;
    const critical = snapshot.nodes.filter((node) => node.status === "critical").length;
    const criticalAlerts = snapshot.alerts.filter((alert) => alert.severity === "critical" && !alert.acknowledged).length;
    const averageSignal = Math.round(snapshot.nodes.reduce((sum, node) => sum + node.signal, 0) / snapshot.nodes.length);
    return { online, warning, critical, offline, criticalAlerts, averageSignal };
  }, [snapshot.alerts, snapshot.nodes]);

  const updateApiBase = (value: string) => {
    setApiBaseUrl(value);
    if (value.trim()) {
      localStorage.setItem("fleet-api-base", value.trim());
    } else {
      localStorage.removeItem("fleet-api-base");
    }
  };

  const sendCommand = async (event: FormEvent) => {
    event.preventDefault();
    setCommandResult({ status: "sending", message: "Queueing command..." });

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(commandPayload) as Record<string, unknown>;
    } catch {
      setCommandResult({ status: "error", message: "Command payload must be valid JSON." });
      return;
    }

    try {
      const response = await dispatchCommand(apiBaseUrl, selectedNode.id, commandType, payload);
      setCommandResult({
        status: "sent",
        message: JSON.stringify(response),
      });
    } catch (error) {
      setCommandResult({
        status: "error",
        message: error instanceof Error ? error.message : "Command failed.",
      });
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Dashboard navigation">
        <div className="brand">
          <div className="brand-mark">CL</div>
          <div>
            <strong>Clawland Fleet</strong>
            <span>Edge AI operations</span>
          </div>
        </div>
        <nav className="nav-list">
          <a className="nav-item active" href="#overview">
            <Gauge size={18} />
            Overview
          </a>
          <a className="nav-item" href="#map">
            <Globe2 size={18} />
            Map
          </a>
          <a className="nav-item" href="#alerts">
            <AlertTriangle size={18} />
            Alerts
          </a>
          <a className="nav-item" href="#commands">
            <Command size={18} />
            Commands
          </a>
        </nav>
        <div className="connection-card">
          <span className={connected ? "pulse online" : "pulse simulated"} />
          <div>
            <strong>{connected ? "Fleet API connected" : "Demo telemetry"}</strong>
            <span>{loadError || "Set an endpoint to stream live fleet data."}</span>
          </div>
        </div>
      </aside>

      <main className="dashboard">
        <header className="topbar">
          <div>
            <p className="eyebrow">MoltClaw control plane</p>
            <h1>Fleet Manager Dashboard</h1>
          </div>
          <label className="endpoint-input">
            <Cloud size={17} />
            <input
              value={apiBaseUrl}
              onChange={(event) => updateApiBase(event.target.value)}
              placeholder="Fleet API URL, e.g. http://localhost:8080"
              aria-label="Fleet API base URL"
            />
          </label>
        </header>

        <section className="stat-grid" id="overview" aria-label="Fleet summary">
          <MetricCard icon={<Server />} label="Nodes online" value={`${totals.online}/${snapshot.nodes.length}`} accent="green" />
          <MetricCard icon={<AlertTriangle />} label="Needs attention" value={`${totals.warning + totals.critical + totals.offline}`} accent="amber" />
          <MetricCard icon={<ShieldCheck />} label="Critical alerts" value={String(totals.criticalAlerts)} accent="red" />
          <MetricCard icon={<Radio />} label="Avg signal" value={`${totals.averageSignal}%`} accent="blue" />
        </section>

        <section className="content-grid">
          <Panel id="map" title="Geolocated Nodes" icon={<MapPin size={18} />} action={<span>Updated {relativeTime(snapshot.updatedAt)}</span>}>
            <FleetMap nodes={snapshot.nodes} selectedNodeId={selectedNode.id} onSelect={setSelectedNodeId} />
          </Panel>

          <Panel title="Node Health Matrix" icon={<Activity size={18} />} action={<NodeSelect nodes={snapshot.nodes} value={selectedNode.id} onChange={setSelectedNodeId} />}>
            <NodeTable nodes={snapshot.nodes} selectedNodeId={selectedNode.id} onSelect={setSelectedNodeId} />
          </Panel>

          <Panel
            id="alerts"
            title="Alert Aggregation"
            icon={<AlertTriangle size={18} />}
            action={<SeverityFilter value={severityFilter} onChange={setSeverityFilter} />}
          >
            <AlertTimeline alerts={alerts} />
          </Panel>

          <Panel title="Sensor Trends" icon={<SlidersHorizontal size={18} />} action={<span>{selectedNode.name}</span>}>
            <SensorTrends series={snapshot.sensorSeries} selectedNodeId={selectedNode.id} />
          </Panel>

          <Panel id="commands" title="Command Dispatch" icon={<Command size={18} />} wide>
            <form className="command-form" onSubmit={sendCommand}>
              <label>
                Target node
                <NodeSelect nodes={snapshot.nodes} value={selectedNode.id} onChange={setSelectedNodeId} />
              </label>
              <label>
                Command
                <select value={commandType} onChange={(event) => setCommandType(event.target.value)}>
                  <option value="run_skill">Run skill</option>
                  <option value="sync_config">Sync config</option>
                  <option value="restart_agent">Restart agent</option>
                  <option value="mute_alerts">Mute alerts</option>
                </select>
              </label>
              <label className="payload-field">
                Payload JSON
                <textarea value={commandPayload} onChange={(event) => setCommandPayload(event.target.value)} rows={5} spellCheck={false} />
              </label>
              <button className="primary-button" type="submit" disabled={commandResult.status === "sending"} title="Dispatch command">
                {commandResult.status === "sending" ? <RotateCw size={17} className="spin" /> : <Send size={17} />}
                Dispatch
              </button>
              <output className={`command-result ${commandResult.status}`}>{commandResult.message}</output>
            </form>
          </Panel>
        </section>
      </main>
    </div>
  );
}

function MetricCard({ icon, label, value, accent }: { icon: ReactNode; label: string; value: string; accent: string }) {
  return (
    <article className={`metric-card ${accent}`}>
      <div className="metric-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function Panel({
  id,
  title,
  icon,
  action,
  wide,
  children,
}: {
  id?: string;
  title: string;
  icon: ReactNode;
  action?: ReactNode;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={wide ? "panel panel-wide" : "panel"} id={id}>
      <div className="panel-header">
        <h2>
          {icon}
          {title}
        </h2>
        {action && <div className="panel-action">{action}</div>}
      </div>
      {children}
    </section>
  );
}

function FleetMap({
  nodes,
  selectedNodeId,
  onSelect,
}: {
  nodes: FleetNode[];
  selectedNodeId: string;
  onSelect: (nodeId: string) => void;
}) {
  return (
    <div className="map-wrap">
      <svg className="fleet-map" viewBox="0 0 960 420" role="img" aria-label="Fleet node geographic map">
        <defs>
          <linearGradient id="mapLand" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#e8e2d7" />
            <stop offset="100%" stopColor="#d8dfd2" />
          </linearGradient>
        </defs>
        <rect width="960" height="420" rx="18" fill="#f4f0e8" />
        <path
          d="M83 148c43-54 112-68 183-53 37 8 61 4 92-19 38-28 93-18 125 20 22 27 54 40 90 37 59-5 119 17 151 59 44 58 87 67 154 38 26-11 47 17 31 41-35 53-100 69-159 52-55-16-94-5-139 31-47 38-112 43-163 12-37-22-77-27-119-10-68 28-147 10-194-44-44-50-105-48-154-3-18 17-50 5-51-20-2-48 34-101 103-141Z"
          fill="url(#mapLand)"
        />
        {Array.from({ length: 9 }, (_, index) => (
          <line key={`v-${index}`} x1={index * 120} x2={index * 120} y1="0" y2="420" stroke="#d8d2c8" strokeWidth="1" opacity="0.45" />
        ))}
        {Array.from({ length: 5 }, (_, index) => (
          <line key={`h-${index}`} x1="0" x2="960" y1={index * 105} y2={index * 105} stroke="#d8d2c8" strokeWidth="1" opacity="0.45" />
        ))}
        {nodes.map((node) => {
          const x = ((node.lng + 180) / 360) * 880 + 40;
          const y = ((90 - node.lat) / 180) * 340 + 40;
          const selected = node.id === selectedNodeId;
          return (
            <g
              key={node.id}
              className={`map-node ${node.status} ${selected ? "selected" : ""}`}
              onClick={() => onSelect(node.id)}
              tabIndex={0}
              role="button"
              aria-label={`${node.name}, ${statusLabel[node.status]}`}
            >
              <title>{`${node.name} - ${node.region} - ${statusLabel[node.status]}`}</title>
              <circle className="node-marker" cx={x} cy={y} r={selected ? 17 : 12} />
              <circle cx={x} cy={y} r={selected ? 28 : 22} className="node-ring" />
              <text x={x + 18} y={y + 4}>
                {node.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function NodeTable({
  nodes,
  selectedNodeId,
  onSelect,
}: {
  nodes: FleetNode[];
  selectedNodeId: string;
  onSelect: (nodeId: string) => void;
}) {
  return (
    <div className="node-table" role="table" aria-label="Node health table">
      {nodes.map((node) => (
        <button
          key={node.id}
          className={`node-row ${node.id === selectedNodeId ? "selected" : ""}`}
          type="button"
          onClick={() => onSelect(node.id)}
        >
          <span className={`status-pill ${node.status}`}>
            {statusIcon[node.status]}
            {statusLabel[node.status]}
          </span>
          <span className="node-name">
            <strong>{node.name}</strong>
            <small>{node.region}</small>
          </span>
          <span>{node.cpu}% CPU</span>
          <span>{node.memory}% MEM</span>
          <span>{node.signal}% RF</span>
          <ChevronRight size={16} />
        </button>
      ))}
    </div>
  );
}

function AlertTimeline({ alerts }: { alerts: AlertEvent[] }) {
  if (alerts.length === 0) {
    return <div className="empty-state">No alerts match the current filter.</div>;
  }

  return (
    <ol className="timeline">
      {alerts.map((alert) => (
        <li className={`timeline-item ${alert.severity}`} key={alert.id}>
          <span className="timeline-dot">
            <CircleDot size={14} />
          </span>
          <div>
            <div className="timeline-title">
              <strong>{alert.title}</strong>
              <span>{alert.timestamp}</span>
            </div>
            <p>{alert.description}</p>
            <footer>
              <span>{alert.nodeName}</span>
              <span>{alert.acknowledged ? "Acknowledged" : "Open"}</span>
            </footer>
          </div>
        </li>
      ))}
    </ol>
  );
}

function SensorTrends({ series, selectedNodeId }: { series: SensorSeries[]; selectedNodeId: string }) {
  const visible = series.find((item) => item.nodeId === selectedNodeId) ?? series[0];
  const values = visible.values;
  const min = Math.min(...values.map((point) => point.value));
  const max = Math.max(...values.map((point) => point.value));
  const spread = Math.max(max - min, 1);
  const points = values
    .map((point, index) => {
      const x = (index / (values.length - 1)) * 640 + 24;
      const y = 190 - ((point.value - min) / spread) * 150;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="chart-wrap">
      <div className="chart-meta">
        <strong>{formatMetric(visible.metric)}</strong>
        <span>
          {values[values.length - 1]?.value} {visible.unit}
        </span>
      </div>
      <svg className="line-chart" viewBox="0 0 700 220" role="img" aria-label={`${formatMetric(visible.metric)} trend`}>
        {Array.from({ length: 4 }, (_, index) => (
          <line key={index} x1="24" x2="668" y1={44 + index * 42} y2={44 + index * 42} />
        ))}
        <polyline points={points} />
        {values.map((point, index) => {
          const x = (index / (values.length - 1)) * 640 + 24;
          const y = 190 - ((point.value - min) / spread) * 150;
          return <circle key={point.time} cx={x} cy={y} r={index === values.length - 1 ? 5 : 3} />;
        })}
      </svg>
    </div>
  );
}

function SeverityFilter({ value, onChange }: { value: Severity | "all"; onChange: (value: Severity | "all") => void }) {
  return (
    <label className="compact-select">
      <Filter size={15} />
      <select value={value} onChange={(event) => onChange(event.target.value as Severity | "all")} aria-label="Filter alerts by severity">
        <option value="all">All severities</option>
        <option value="critical">Critical</option>
        <option value="warning">Warning</option>
        <option value="info">Info</option>
      </select>
    </label>
  );
}

function NodeSelect({
  nodes,
  value,
  onChange,
}: {
  nodes: FleetNode[];
  value: string;
  onChange: (nodeId: string) => void;
}) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} aria-label="Select node">
      {nodes.map((node) => (
        <option key={node.id} value={node.id}>
          {node.name}
        </option>
      ))}
    </select>
  );
}

function relativeTime(iso: string) {
  const elapsed = Math.max(0, Date.now() - new Date(iso).getTime());
  const seconds = Math.round(elapsed / 1000);
  if (seconds < 60) {
    return `${seconds}s ago`;
  }
  return `${Math.round(seconds / 60)}m ago`;
}

function formatMetric(metric: SensorSeries["metric"]) {
  return metric
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
