import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
});

afterAll(async () => {
    // Cleanup
    await prisma.$disconnect();
});

// Global test utilities
export const createMockOrder = () => ({
    orderNumber: `ORD-${Date.now()}`,
    userId: BigInt(1),
    status: 'PENDING' as const,
    paymentStatus: 'PENDING' as const,
    fulfillmentStatus: 'UNFULFILLED' as const,
    totalAmount: 1000,
    subtotal: 900,
    taxAmount: 50,
    shippingAmount: 50,
    discountAmount: 0,
    currency: 'INR',
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
});

export const createMockUser = () => ({
    id: 1,
    email: 'test@example.com',
    roles: ['customer'],
});

export { prisma };

