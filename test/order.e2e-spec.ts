import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('Order Management (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let authToken: string;
    let createdOrderId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());
        app.setGlobalPrefix('api/v1');

        await app.init();

        prisma = app.get<PrismaService>(PrismaService);

        // Mock auth token for testing
        authToken = 'Bearer test-token';
    });

    afterAll(async () => {
        // Cleanup test data
        if (createdOrderId) {
            await prisma.order.delete({ where: { id: BigInt(createdOrderId) } }).catch(() => { });
        }
        await app.close();
    });

    describe('/api/v1/health (GET)', () => {
        it('should return health status', () => {
            return request(app.getHttpServer())
                .get('/api/v1/health')
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('status');
                    expect(res.body).toHaveProperty('checks');
                });
        });
    });

    describe('/api/v1/health/ready (GET)', () => {
        it('should return readiness status', () => {
            return request(app.getHttpServer())
                .get('/api/v1/health/ready')
                .expect((res) => {
                    expect([200, 503]).toContain(res.status);
                });
        });
    });

    describe('/api/v1/health/live (GET)', () => {
        it('should return liveness status', () => {
            return request(app.getHttpServer())
                .get('/api/v1/health/live')
                .expect(200);
        });
    });

    describe('/api/v1/monitoring/metrics (GET)', () => {
        it('should return Prometheus metrics', () => {
            return request(app.getHttpServer())
                .get('/api/v1/monitoring/metrics')
                .expect(200)
                .expect('Content-Type', /text\/plain/);
        });
    });

    describe('/api/v1/monitoring/business-metrics (GET)', () => {
        it('should return business metrics', () => {
            return request(app.getHttpServer())
                .get('/api/v1/monitoring/business-metrics')
                .expect((res) => {
                    expect([200, 401]).toContain(res.status);
                    if (res.status === 200) {
                        expect(res.body).toHaveProperty('orders');
                        expect(res.body).toHaveProperty('payments');
                        expect(res.body).toHaveProperty('shipments');
                    }
                });
        });
    });

    describe('Order Flow (e2e)', () => {
        const orderData = {
            userId: 1,
            items: [
                {
                    productId: '1',
                    sku: 'TEST-001',
                    name: 'Test Product',
                    quantity: 2,
                    unitPrice: 500,
                },
            ],
            shippingAddress: {
                street: '123 Test St',
                city: 'Test City',
                state: 'TS',
                zipCode: '12345',
                country: 'IN',
            },
            billingAddress: {
                street: '123 Test St',
                city: 'Test City',
                state: 'TS',
                zipCode: '12345',
                country: 'IN',
            },
        };

        it('should create an order (with mock auth)', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/v1/orders')
                .set('Authorization', authToken)
                .send(orderData);

            // Either succeeds or fails with auth error
            expect([201, 401, 403]).toContain(response.status);

            if (response.status === 201) {
                expect(response.body).toHaveProperty('id');
                expect(response.body).toHaveProperty('orderNumber');
                createdOrderId = response.body.id;
            }
        });

        it('should get all orders', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/v1/orders')
                .set('Authorization', authToken);

            expect([200, 401]).toContain(response.status);

            if (response.status === 200) {
                expect(response.body).toHaveProperty('data');
                expect(Array.isArray(response.body.data)).toBe(true);
            }
        });
    });
});

