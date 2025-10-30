import { Injectable } from '@nestjs/common';

let promClient: any;
try {
    // Lazy import to avoid hard failure if not installed during dev
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    promClient = require('prom-client');
} catch {
    promClient = null;
}

@Injectable()
export class MetricsService {
    private initialized = false;
    private register: any;
    private orderCounter: any;
    private paymentCounter: any;
    private httpDuration: any;

    constructor() {
        if (promClient) {
            this.register = new promClient.Registry();
            promClient.collectDefaultMetrics({ register: this.register });

            this.orderCounter = new promClient.Counter({
                name: 'orders_total',
                help: 'Total number of orders processed',
                labelNames: ['status'],
            });

            this.paymentCounter = new promClient.Counter({
                name: 'payments_total',
                help: 'Total number of payments processed',
                labelNames: ['status', 'method'],
            });

            this.httpDuration = new promClient.Histogram({
                name: 'http_request_duration_ms',
                help: 'Duration of HTTP requests in ms',
                labelNames: ['method', 'route', 'status_code'],
                buckets: [50, 100, 200, 300, 500, 1000, 2000, 5000],
            });

            this.register.registerMetric(this.orderCounter);
            this.register.registerMetric(this.paymentCounter);
            this.register.registerMetric(this.httpDuration);
            this.initialized = true;
        }
    }

    isEnabled(): boolean {
        return !!this.initialized;
    }

    async getMetrics(): Promise<string> {
        if (!this.initialized) return '# Metrics disabled (prom-client not installed)\n';
        return await this.register.metrics();
    }

    incOrder(status: string) {
        if (!this.initialized) return;
        this.orderCounter.inc({ status });
    }

    incPayment(status: string, method: string) {
        if (!this.initialized) return;
        this.paymentCounter.inc({ status, method });
    }

    observeHttp(method: string, route: string, statusCode: number, durationMs: number) {
        if (!this.initialized) return;
        this.httpDuration.observe({ method, route, status_code: String(statusCode) }, durationMs);
    }
}


