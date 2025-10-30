export interface HealthCheckResult {
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: string;
    checks: Record<string, CheckDetail>;
    system?: SystemInfo;
    responseTime?: string;
}

export interface CheckDetail {
    status: 'healthy' | 'unhealthy' | 'unknown';
    latencyMs?: number;
    error?: string;
    responseTime?: string;
}

export interface SystemInfo {
    memory: NodeJS.MemoryUsage;
    cpu: NodeJS.CpuUsage;
    platform: string;
    nodeVersion: string;
}

export interface AlertPayload {
    severity: 'critical' | 'warning' | 'info';
    subject: string;
    details?: Record<string, any>;
    timestamp: string;
    service: string;
}

export interface MetricLabels {
    [key: string]: string | number;
}

export interface BusinessMetrics {
    orders: {
        total: number;
        pending: number;
        completed: number;
        failed: number;
    };
    payments: {
        total: number;
        successful: number;
        failed: number;
    };
    shipments: {
        total: number;
        delivered: number;
        inTransit: number;
    };
}

