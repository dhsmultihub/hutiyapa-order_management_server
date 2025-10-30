import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ErrorTrackingService {
    private readonly logger = new Logger(ErrorTrackingService.name);
    private sentryEnabled = false;

    constructor(private readonly config: ConfigService) {
        const sentryDsn = this.config.get<string>('SENTRY_DSN');
        if (sentryDsn) {
            try {
                // Lazy load Sentry if configured
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const Sentry = require('@sentry/node');
                Sentry.init({
                    dsn: sentryDsn,
                    environment: this.config.get('NODE_ENV', 'development'),
                    tracesSampleRate: 0.1,
                });
                this.sentryEnabled = true;
                this.logger.log('✅ Sentry error tracking initialized');
            } catch (err) {
                this.logger.warn('Sentry not available, error tracking disabled');
            }
        }
    }

    captureException(error: Error, context?: Record<string, any>) {
        this.logger.error('Exception captured', { error: error.message, stack: error.stack, context });

        if (this.sentryEnabled) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const Sentry = require('@sentry/node');
                Sentry.captureException(error, {
                    contexts: context,
                });
            } catch (err) {
                this.logger.warn('Failed to send error to Sentry', err);
            }
        }
    }

    captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>) {
        this.logger.log(`Message captured: ${message}`, context);

        if (this.sentryEnabled) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const Sentry = require('@sentry/node');
                Sentry.captureMessage(message, {
                    level,
                    contexts: context,
                });
            } catch (err) {
                this.logger.warn('Failed to send message to Sentry', err);
            }
        }
    }

    setUser(userId: string, email?: string, username?: string) {
        if (this.sentryEnabled) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const Sentry = require('@sentry/node');
                Sentry.setUser({ id: userId, email, username });
            } catch (err) {
                this.logger.warn('Failed to set Sentry user', err);
            }
        }
    }

    addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
        if (this.sentryEnabled) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const Sentry = require('@sentry/node');
                Sentry.addBreadcrumb({
                    message,
                    category,
                    data,
                    timestamp: Date.now() / 1000,
                });
            } catch (err) {
                this.logger.warn('Failed to add Sentry breadcrumb', err);
            }
        }
    }
}

