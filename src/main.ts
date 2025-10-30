import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { CacheInterceptor } from './common/interceptors/cache.interceptor';
import { PerformanceInterceptor } from './common/interceptors/performance.interceptor';
import { CacheService } from './cache/cache.service';
import { CustomValidationPipe } from './common/pipes/validation.pipe';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { CorrelationInterceptor } from './logging/correlation.interceptor';
import { HttpMetricsInterceptor } from './monitoring/http-metrics.interceptor';
import { MetricsService } from './monitoring/metrics.service';
import { ErrorTrackingService } from './monitoring/error-tracking.service';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);
    const logger = new Logger('Bootstrap');

    // Security middleware
    app.use(helmet());
    app.use(compression());

    // CORS configuration
    app.use(cors({
        origin: configService.get('CORS_ORIGIN', 'http://localhost:3000').split(','),
        credentials: configService.get('CORS_CREDENTIALS', true),
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));

    // Rate limiting
    app.use(rateLimit({
        windowMs: configService.get('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000), // 15 minutes
        max: configService.get('RATE_LIMIT_MAX_REQUESTS', 100), // limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
    }));

    // Global validation pipe
    app.useGlobalPipes(new CustomValidationPipe());

    // Global guards
    const reflector = app.get(Reflector);
    app.useGlobalGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector));

    // Global filters
    const errorTracking = app.get(ErrorTrackingService);
    app.useGlobalFilters(new HttpExceptionFilter(errorTracking));

    // Global interceptors
    const reflectorForCache = app.get(Reflector);
    app.useGlobalInterceptors(
        new CorrelationInterceptor(),
        new HttpMetricsInterceptor(app.get(MetricsService)),
        new LoggingInterceptor(),
        new PerformanceInterceptor(),
        new CacheInterceptor(app.get(CacheService), reflectorForCache),
        new TransformInterceptor(),
    );

    // API prefix
    const apiPrefix = configService.get('API_PREFIX', 'api/v1');
    app.setGlobalPrefix(apiPrefix);

    // Swagger documentation
    if (configService.get('NODE_ENV') !== 'production') {
        const config = new DocumentBuilder()
            .setTitle('Order Management API')
            .setDescription('Comprehensive order management microservice API')
            .setVersion('1.0.0')
            .addBearerAuth(
                {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    name: 'JWT',
                    description: 'Enter JWT token',
                    in: 'header',
                },
                'JWT-auth',
            )
            .addTag('Orders', 'Order management operations')
            .addTag('Payments', 'Payment processing operations')
            .addTag('Shipments', 'Shipment tracking operations')
            .addTag('Returns', 'Return management operations')
            .addTag('Refunds', 'Refund processing operations')
            .addTag('Analytics', 'Order analytics and reporting')
            .addTag('Health', 'Health check endpoints')
            .addTag('Monitoring', 'Operational monitoring and metrics')
            .build();

        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('api/docs', app, document, {
            swaggerOptions: {
                persistAuthorization: true,
                displayRequestDuration: true,
                filter: true,
                showRequestHeaders: true,
                tryItOutEnabled: true,
            },
        });

        logger.log(`📚 Swagger documentation available at http://localhost:${configService.get('PORT', 8001)}/api/docs`);
    }

    // Start the application
    const port = configService.get('PORT', 8001);
    await app.listen(port);

    logger.log(`🚀 Order Management Service is running on port ${port}`);
    logger.log(`🌍 Environment: ${configService.get('NODE_ENV', 'development')}`);
    logger.log(`📊 API Base URL: http://localhost:${port}/${apiPrefix}`);
    logger.log(`🔍 Health Check: http://localhost:${port}/${apiPrefix}/health`);
    logger.log(`📈 Metrics: http://localhost:${port}/${apiPrefix}/monitoring/metrics`);
    logger.log(`📊 Business Metrics: http://localhost:${port}/${apiPrefix}/monitoring/business-metrics`);
}

bootstrap().catch((error) => {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
});
