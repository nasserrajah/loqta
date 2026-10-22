export interface HealthStatus {
  status: 'ok';
  uptimeSeconds: number;
  timestamp: string;
}

export function getHealthStatus(now: Date = new Date()): HealthStatus {
  return {
    status: 'ok',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: now.toISOString(),
  };
}
