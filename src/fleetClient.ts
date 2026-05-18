import { mockSnapshot } from "./mockData";
import type { AlertEvent, FleetNode, FleetSnapshot, SensorSeries } from "./types";

const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/$/, "");

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchFleetSnapshot(baseUrl: string): Promise<FleetSnapshot> {
  if (!baseUrl.trim()) {
    return mockSnapshot;
  }

  const base = normalizeBaseUrl(baseUrl);
  const [nodes, alerts, sensorSeries] = await Promise.all([
    getJson<FleetNode[]>(`${base}/fleet/nodes`),
    getJson<AlertEvent[]>(`${base}/fleet/events`),
    getJson<SensorSeries[]>(`${base}/fleet/metrics`),
  ]);

  return {
    nodes,
    alerts,
    sensorSeries,
    updatedAt: new Date().toISOString(),
  };
}

export async function dispatchCommand(
  baseUrl: string,
  targetNodeId: string,
  type: string,
  payload: Record<string, unknown>,
) {
  if (!baseUrl.trim()) {
    await new Promise((resolve) => window.setTimeout(resolve, 450));
    return {
      status: "queued",
      target_node_id: targetNodeId,
      type,
      payload,
      simulated: true,
    };
  }

  const response = await fetch(`${normalizeBaseUrl(baseUrl)}/fleet/command`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      target_node_id: targetNodeId,
      type,
      payload,
    }),
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<unknown>;
}
