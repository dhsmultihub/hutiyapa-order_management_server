import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';
import * as http from 'http';

type CheckResult = { name: string; url?: string; status: 'healthy' | 'unhealthy' | 'unknown'; latencyMs?: number; error?: string };

@Injectable()
export class ExternalHealthService {
    private readonly logger = new Logger(ExternalHealthService.name);

    constructor(private readonly config: ConfigService) { }

    private async ping(url?: string, timeoutMs = 2500): Promise<CheckResult> {
        if (!url) return { name: 'unknown', status: 'unknown' } as CheckResult;
        const name = new URL(url).hostname;
        const start = Date.now();
        return new Promise<CheckResult>((resolve) => {
            const handler = (res: http.IncomingMessage) => {
                const latencyMs = Date.now() - start;
                resolve({ name, url, status: res.statusCode && res.statusCode < 500 ? 'healthy' : 'unhealthy', latencyMs });
            };
            const onError = (err: Error) => {
                const latencyMs = Date.now() - start;
                this.logger.warn(`External health failed for ${url}: ${err.message}`);
                resolve({ name, url, status: 'unhealthy', latencyMs, error: err.message });
            };
            const lib = url.startsWith('https') ? https : http;
            const req = lib.request(url, { method: 'GET', timeout: timeoutMs }, handler);
            req.on('error', onError);
            req.on('timeout', () => {
                req.destroy(new Error('timeout'));
            });
            req.end();
        });
    }

    async checkAll(): Promise<Record<string, CheckResult>> {
        const authUrl = this.config.get<string>('AUTH_SERVICE_URL');
        const productUrl = this.config.get<string>('PRODUCT_SERVICE_URL');
        const cartUrl = this.config.get<string>('CART_SERVICE_URL');

        const [auth, product, cart] = await Promise.all([
            this.ping(authUrl),
            this.ping(productUrl),
            this.ping(cartUrl),
        ]);

        return {
            auth,
            product,
            cart,
        };
    }
}


