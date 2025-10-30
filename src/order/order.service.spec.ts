import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';
import { PrismaService } from '../database/prisma.service';
import { OrderEventsService } from '../events/order-events.service';
import { OrderCreatorService } from './operations/order-creator.service';
import { OrderUpdaterService } from './operations/order-updater.service';
import { OrderCancellerService } from './operations/order-canceller.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('OrderService', () => {
    let service: OrderService;
    let prismaService: PrismaService;
    let orderEventsService: OrderEventsService;

    const mockOrder = {
        id: BigInt(1),
        orderNumber: 'ORD-123',
        userId: BigInt(1),
        status: 'PENDING',
        paymentStatus: 'PENDING',
        fulfillmentStatus: 'UNFULFILLED',
        totalAmount: 1000,
        subtotal: 900,
        taxAmount: 50,
        shippingAmount: 50,
        discountAmount: 0,
        currency: 'INR',
        shippingAddress: { street: '123 Test St', city: 'Test City' },
        billingAddress: { street: '123 Test St', city: 'Test City' },
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        shippedAt: null,
        deliveredAt: null,
        cancelledAt: null,
    };

    const mockPrismaService = {
        order: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
        },
    };

    const mockOrderEventsService = {
        emitOrderCreated: jest.fn(),
        emitOrderUpdated: jest.fn(),
        emitOrderCancelled: jest.fn(),
    };

    const mockOrderCreatorService = {
        createOrder: jest.fn(),
    };

    const mockOrderUpdaterService = {
        updateOrder: jest.fn(),
    };

    const mockOrderCancellerService = {
        cancelOrder: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OrderService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: OrderEventsService,
                    useValue: mockOrderEventsService,
                },
                {
                    provide: OrderCreatorService,
                    useValue: mockOrderCreatorService,
                },
                {
                    provide: OrderUpdaterService,
                    useValue: mockOrderUpdaterService,
                },
                {
                    provide: OrderCancellerService,
                    useValue: mockOrderCancellerService,
                },
            ],
        }).compile();

        service = module.get<OrderService>(OrderService);
        prismaService = module.get<PrismaService>(PrismaService);
        orderEventsService = module.get<OrderEventsService>(OrderEventsService);

        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findOne', () => {
        it('should return an order by id', async () => {
            mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

            const result = await service.findOne(BigInt(1));

            expect(result).toEqual(mockOrder);
            expect(mockPrismaService.order.findUnique).toHaveBeenCalledWith({
                where: { id: BigInt(1) },
                include: {
                    items: true,
                    payments: true,
                    shipments: true,
                    returns: true,
                },
            });
        });

        it('should throw NotFoundException if order not found', async () => {
            mockPrismaService.order.findUnique.mockResolvedValue(null);

            await expect(service.findOne(BigInt(999))).rejects.toThrow(NotFoundException);
        });
    });

    describe('findAll', () => {
        it('should return paginated orders', async () => {
            const orders = [mockOrder];
            mockPrismaService.order.findMany.mockResolvedValue(orders);
            mockPrismaService.order.count.mockResolvedValue(1);

            const result = await service.findAll({ page: 1, limit: 10 });

            expect(result.data).toEqual(orders);
            expect(result.total).toBe(1);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
        });

        it('should filter orders by status', async () => {
            mockPrismaService.order.findMany.mockResolvedValue([mockOrder]);
            mockPrismaService.order.count.mockResolvedValue(1);

            await service.findAll({ status: 'PENDING', page: 1, limit: 10 });

            expect(mockPrismaService.order.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ status: 'PENDING' }),
                }),
            );
        });
    });

    describe('create', () => {
        it('should create a new order', async () => {
            const createOrderDto = {
                userId: 1,
                items: [
                    {
                        productId: '1',
                        sku: 'SKU-001',
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

            mockOrderCreatorService.createOrder.mockResolvedValue(mockOrder);

            const result = await service.create(createOrderDto);

            expect(result).toEqual(mockOrder);
            expect(mockOrderCreatorService.createOrder).toHaveBeenCalledWith(createOrderDto);
        });
    });

    describe('update', () => {
        it('should update an order', async () => {
            const updateDto = { notes: 'Updated notes' };
            const updatedOrder = { ...mockOrder, notes: 'Updated notes' };

            mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
            mockOrderUpdaterService.updateOrder.mockResolvedValue(updatedOrder);

            const result = await service.update(BigInt(1), updateDto);

            expect(result).toEqual(updatedOrder);
            expect(mockOrderUpdaterService.updateOrder).toHaveBeenCalledWith(BigInt(1), updateDto);
        });

        it('should throw NotFoundException if order not found', async () => {
            mockPrismaService.order.findUnique.mockResolvedValue(null);

            await expect(service.update(BigInt(999), { notes: 'test' })).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('remove', () => {
        it('should cancel an order', async () => {
            mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
            mockOrderCancellerService.cancelOrder.mockResolvedValue({
                ...mockOrder,
                status: 'CANCELLED',
            });

            const result = await service.remove(BigInt(1));

            expect(result.status).toBe('CANCELLED');
            expect(mockOrderCancellerService.cancelOrder).toHaveBeenCalledWith(BigInt(1));
        });
    });
});

