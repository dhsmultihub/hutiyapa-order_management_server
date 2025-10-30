import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { PrismaService } from '../database/prisma.service';
import { PaymentProcessorService } from './services/payment-processor.service';
import { NotFoundException } from '@nestjs/common';

describe('PaymentService', () => {
    let service: PaymentService;
    let prismaService: PrismaService;
    let paymentProcessorService: PaymentProcessorService;

    const mockPayment = {
        id: BigInt(1),
        orderId: BigInt(1),
        paymentMethod: 'CREDIT_CARD',
        paymentGateway: 'stripe',
        transactionId: 'txn_123',
        amount: 1000,
        currency: 'INR',
        status: 'PENDING',
        gatewayResponse: {},
        processedAt: null,
        createdAt: new Date(),
    };

    const mockPrismaService = {
        payment: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
        },
        order: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    };

    const mockPaymentProcessorService = {
        processPayment: jest.fn(),
        verifyPayment: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PaymentService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: PaymentProcessorService,
                    useValue: mockPaymentProcessorService,
                },
            ],
        }).compile();

        service = module.get<PaymentService>(PaymentService);
        prismaService = module.get<PrismaService>(PrismaService);
        paymentProcessorService = module.get<PaymentProcessorService>(PaymentProcessorService);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should return all payments for an order', async () => {
            mockPrismaService.payment.findMany.mockResolvedValue([mockPayment]);

            const result = await service.findAll(BigInt(1));

            expect(result).toEqual([mockPayment]);
            expect(mockPrismaService.payment.findMany).toHaveBeenCalledWith({
                where: { orderId: BigInt(1) },
                orderBy: { createdAt: 'desc' },
            });
        });
    });

    describe('findOne', () => {
        it('should return a payment by id', async () => {
            mockPrismaService.payment.findUnique.mockResolvedValue(mockPayment);

            const result = await service.findOne(BigInt(1));

            expect(result).toEqual(mockPayment);
        });

        it('should throw NotFoundException if payment not found', async () => {
            mockPrismaService.payment.findUnique.mockResolvedValue(null);

            await expect(service.findOne(BigInt(999))).rejects.toThrow(NotFoundException);
        });
    });

    describe('create', () => {
        it('should create and process a payment', async () => {
            const createPaymentDto = {
                orderId: 1,
                paymentMethod: 'CREDIT_CARD' as const,
                paymentGateway: 'stripe',
                amount: 1000,
                currency: 'INR',
            };

            mockPrismaService.order.findUnique.mockResolvedValue({
                id: BigInt(1),
                totalAmount: 1000,
            });

            mockPaymentProcessorService.processPayment.mockResolvedValue(mockPayment);

            const result = await service.create(createPaymentDto);

            expect(result).toEqual(mockPayment);
            expect(mockPaymentProcessorService.processPayment).toHaveBeenCalledWith(
                createPaymentDto,
            );
        });
    });

    describe('verifyPayment', () => {
        it('should verify a payment', async () => {
            const verifiedPayment = { ...mockPayment, status: 'COMPLETED' };
            mockPrismaService.payment.findUnique.mockResolvedValue(mockPayment);
            mockPaymentProcessorService.verifyPayment.mockResolvedValue(verifiedPayment);

            const result = await service.verifyPayment(BigInt(1), { transactionId: 'txn_123' });

            expect(result).toEqual(verifiedPayment);
        });
    });
});

