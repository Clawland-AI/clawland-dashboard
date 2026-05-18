export type NodeStatus = "online" | "warning" | "critical" | "offline";

export type Severity = "critical" | "warning" | "info";

export type FleetNode = {
  id: string;
  name: string;
  region: string;
  status: NodeStatus;
  agent: "picclaw" | "nanoclaw" | "microclaw";
  lat: number;
  lng: number;
  uptimeHours: number;
  cpu: number;
  memory: number;
  battery: number;
  signal: number;
  lastSeen: string;
  skill: string;
};

export type AlertEvent = {
  id: string;
  nodeId: string;
  nodeName: string;
  severity: Severity;
  title: string;
  description: string;
  timestamp: string;
  acknowledged: boolean;
};

export type SensorSeries = {
  nodeId: string;
  metric: "temperature" | "humidity" | "dissolved_oxygen" | "vibration";
  unit: string;
  values: Array<{ time: string; value: number }>;
};

export type FleetSnapshot = {
  nodes: FleetNode[];
  alerts: AlertEvent[];
  sensorSeries: SensorSeries[];
  updatedAt: string;
};

export type CommandResult = {
  status: "idle" | "sending" | "sent" | "error";
  message: string;
};
