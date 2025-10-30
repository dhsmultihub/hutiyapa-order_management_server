import { PrismaClient, OrderStatus, PaymentStatus, FulfillmentStatus, ShipmentStatus, ReturnStatus, RefundStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');

    // Create sample orders
    const orders = await Promise.all([
        prisma.order.create({
            data: {
                orderNumber: 'ORD-2024-001',
                userId: BigInt(1),
                status: OrderStatus.COMPLETED,
                paymentStatus: PaymentStatus.COMPLETED,
                fulfillmentStatus: FulfillmentStatus.FULFILLED,
                totalAmount: 2999.00,
                subtotal: 2499.00,
                taxAmount: 449.82,
                shippingAmount: 50.18,
                discountAmount: 0,
                currency: 'INR',
                shippingAddress: {
                    firstName: 'John',
                    lastName: 'Doe',
                    address1: '123 Main Street',
                    address2: 'Apt 4B',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    postalCode: '400001',
                    country: 'India',
                    phone: '+91-9876543210',
                    email: 'john.doe@example.com'
                },
                billingAddress: {
                    firstName: 'John',
                    lastName: 'Doe',
                    address1: '123 Main Street',
                    address2: 'Apt 4B',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    postalCode: '400001',
                    country: 'India',
                    phone: '+91-9876543210',
                    email: 'john.doe@example.com'
                },
                notes: 'Please handle with care',
                shippedAt: new Date('2024-01-15T10:30:00Z'),
                deliveredAt: new Date('2024-01-17T14:20:00Z'),
                orderItems: {
                    create: [
                        {
                            productId: 'PROD-001',
                            variantId: 'VAR-001-RED-M',
                            sku: 'TSHIRT-RED-M',
                            name: 'Premium Cotton T-Shirt',
                            description: '100% cotton, comfortable fit',
                            quantity: 2,
                            unitPrice: 999.00,
                            totalPrice: 1998.00,
                            taxRate: 18.0,
                            metadata: {
                                color: 'Red',
                                size: 'M',
                                material: 'Cotton'
                            }
                        },
                        {
                            productId: 'PROD-002',
                            variantId: 'VAR-002-BLUE-L',
                            sku: 'JEANS-BLUE-L',
                            name: 'Classic Blue Jeans',
                            description: 'Denim jeans with modern fit',
                            quantity: 1,
                            unitPrice: 1999.00,
                            totalPrice: 1999.00,
                            taxRate: 18.0,
                            metadata: {
                                color: 'Blue',
                                size: 'L',
                                material: 'Denim'
                            }
                        }
                    ]
                },
                payments: {
                    create: [
                        {
                            paymentMethod: 'credit_card',
                            paymentGateway: 'razorpay',
                            transactionId: 'txn_1234567890',
                            amount: 2999.00,
                            currency: 'INR',
                            status: PaymentStatus.COMPLETED,
                            gatewayResponse: {
                                payment_id: 'pay_1234567890',
                                status: 'captured',
                                method: 'card',
                                card_id: 'card_1234567890'
                            },
                            processedAt: new Date('2024-01-14T15:30:00Z')
                        }
                    ]
                },
                shipments: {
                    create: [
                        {
                            trackingNumber: 'BD1234567890',
                            carrier: 'Blue Dart',
                            serviceType: 'Express',
                            status: ShipmentStatus.DELIVERED,
                            shippedAt: new Date('2024-01-15T10:30:00Z'),
                            deliveredAt: new Date('2024-01-17T14:20:00Z'),
                            estimatedDelivery: new Date('2024-01-18T18:00:00Z'),
                            trackingUrl: 'https://www.bluedart.com/track/BD1234567890'
                        }
                    ]
                }
            }
        }),
        prisma.order.create({
            data: {
                orderNumber: 'ORD-2024-002',
                userId: BigInt(2),
                status: OrderStatus.PROCESSING,
                paymentStatus: PaymentStatus.COMPLETED,
                fulfillmentStatus: FulfillmentStatus.UNFULFILLED,
                totalAmount: 1599.00,
                subtotal: 1299.00,
                taxAmount: 233.82,
                shippingAmount: 66.18,
                discountAmount: 0,
                currency: 'INR',
                shippingAddress: {
                    firstName: 'Jane',
                    lastName: 'Smith',
                    address1: '456 Oak Avenue',
                    city: 'Delhi',
                    state: 'Delhi',
                    postalCode: '110001',
                    country: 'India',
                    phone: '+91-9876543211',
                    email: 'jane.smith@example.com'
                },
                billingAddress: {
                    firstName: 'Jane',
                    lastName: 'Smith',
                    address1: '456 Oak Avenue',
                    city: 'Delhi',
                    state: 'Delhi',
                    postalCode: '110001',
                    country: 'India',
                    phone: '+91-9876543211',
                    email: 'jane.smith@example.com'
                },
                notes: 'Gift wrapping requested',
                orderItems: {
                    create: [
                        {
                            productId: 'PROD-003',
                            variantId: 'VAR-003-BLACK-S',
                            sku: 'HOODIE-BLACK-S',
                            name: 'Comfortable Hoodie',
                            description: 'Soft fleece hoodie with kangaroo pocket',
                            quantity: 1,
                            unitPrice: 1299.00,
                            totalPrice: 1299.00,
                            taxRate: 18.0,
                            metadata: {
                                color: 'Black',
                                size: 'S',
                                material: 'Fleece'
                            }
                        }
                    ]
                },
                payments: {
                    create: [
                        {
                            paymentMethod: 'upi',
                            paymentGateway: 'razorpay',
                            transactionId: 'txn_0987654321',
                            amount: 1599.00,
                            currency: 'INR',
                            status: PaymentStatus.COMPLETED,
                            gatewayResponse: {
                                payment_id: 'pay_0987654321',
                                status: 'captured',
                                method: 'upi',
                                vpa: 'jane@paytm'
                            },
                            processedAt: new Date('2024-01-20T09:15:00Z')
                        }
                    ]
                }
            }
        }),
        prisma.order.create({
            data: {
                orderNumber: 'ORD-2024-003',
                userId: BigInt(3),
                status: OrderStatus.CANCELLED,
                paymentStatus: PaymentStatus.CANCELLED,
                fulfillmentStatus: FulfillmentStatus.CANCELLED,
                totalAmount: 899.00,
                subtotal: 749.00,
                taxAmount: 134.82,
                shippingAmount: 15.18,
                discountAmount: 0,
                currency: 'INR',
                shippingAddress: {
                    firstName: 'Bob',
                    lastName: 'Johnson',
                    address1: '789 Pine Street',
                    city: 'Bangalore',
                    state: 'Karnataka',
                    postalCode: '560001',
                    country: 'India',
                    phone: '+91-9876543212',
                    email: 'bob.johnson@example.com'
                },
                billingAddress: {
                    firstName: 'Bob',
                    lastName: 'Johnson',
                    address1: '789 Pine Street',
                    city: 'Bangalore',
                    state: 'Karnataka',
                    postalCode: '560001',
                    country: 'India',
                    phone: '+91-9876543212',
                    email: 'bob.johnson@example.com'
                },
                notes: 'Customer requested cancellation',
                cancelledAt: new Date('2024-01-22T16:45:00Z'),
                orderItems: {
                    create: [
                        {
                            productId: 'PROD-004',
                            variantId: 'VAR-004-WHITE-M',
                            sku: 'CAP-WHITE-M',
                            name: 'Baseball Cap',
                            description: 'Adjustable baseball cap with logo',
                            quantity: 1,
                            unitPrice: 749.00,
                            totalPrice: 749.00,
                            taxRate: 18.0,
                            metadata: {
                                color: 'White',
                                size: 'M',
                                material: 'Cotton'
                            }
                        }
                    ]
                },
                payments: {
                    create: [
                        {
                            paymentMethod: 'net_banking',
                            paymentGateway: 'razorpay',
                            transactionId: 'txn_1122334455',
                            amount: 899.00,
                            currency: 'INR',
                            status: PaymentStatus.CANCELLED,
                            gatewayResponse: {
                                payment_id: 'pay_1122334455',
                                status: 'cancelled',
                                method: 'net_banking',
                                bank: 'HDFC'
                            },
                            processedAt: new Date('2024-01-22T16:45:00Z')
                        }
                    ]
                }
            }
        })
    ]);

    console.log(`✅ Created ${orders.length} orders`);

    // Create sample returns
    const returns = await Promise.all([
        prisma.return.create({
            data: {
                orderId: orders[0].id,
                returnNumber: 'RET-2024-001',
                reason: 'Product defect',
                status: ReturnStatus.APPROVED,
                requestedAt: new Date('2024-01-20T10:00:00Z'),
                approvedAt: new Date('2024-01-21T14:30:00Z'),
                refundAmount: 999.00,
                notes: 'Customer reported stitching issue'
            }
        }),
        prisma.return.create({
            data: {
                orderId: orders[1].id,
                returnNumber: 'RET-2024-002',
                reason: 'Wrong size',
                status: ReturnStatus.PENDING,
                requestedAt: new Date('2024-01-25T11:15:00Z'),
                notes: 'Customer ordered wrong size'
            }
        })
    ]);

    console.log(`✅ Created ${returns.length} returns`);

    // Get the first order's payment for refund
    const firstOrderPayment = await prisma.payment.findFirst({
        where: { orderId: orders[0].id }
    });

    // Create sample refunds
    const refunds = await Promise.all([
        prisma.refund.create({
            data: {
                orderId: orders[0].id,
                paymentId: firstOrderPayment?.id || BigInt(1),
                amount: 999.00,
                reason: 'Product defect',
                status: RefundStatus.COMPLETED,
                processedAt: new Date('2024-01-22T09:00:00Z')
            }
        })
    ]);

    console.log(`✅ Created ${refunds.length} refunds`);

    // Create additional orders for analytics
    const additionalOrders = await Promise.all([
        prisma.order.create({
            data: {
                orderNumber: 'ORD-2024-004',
                userId: BigInt(4),
                status: OrderStatus.SHIPPED,
                paymentStatus: PaymentStatus.COMPLETED,
                fulfillmentStatus: FulfillmentStatus.FULFILLED,
                totalAmount: 2299.00,
                subtotal: 1999.00,
                taxAmount: 359.82,
                shippingAmount: -59.82,
                discountAmount: 0,
                currency: 'INR',
                shippingAddress: {
                    firstName: 'Alice',
                    lastName: 'Brown',
                    address1: '321 Elm Street',
                    city: 'Chennai',
                    state: 'Tamil Nadu',
                    postalCode: '600001',
                    country: 'India',
                    phone: '+91-9876543213',
                    email: 'alice.brown@example.com'
                },
                billingAddress: {
                    firstName: 'Alice',
                    lastName: 'Brown',
                    address1: '321 Elm Street',
                    city: 'Chennai',
                    state: 'Tamil Nadu',
                    postalCode: '600001',
                    country: 'India',
                    phone: '+91-9876543213',
                    email: 'alice.brown@example.com'
                },
                shippedAt: new Date('2024-01-23T08:00:00Z'),
                orderItems: {
                    create: [
                        {
                            productId: 'PROD-005',
                            variantId: 'VAR-005-GREEN-L',
                            sku: 'JACKET-GREEN-L',
                            name: 'Winter Jacket',
                            description: 'Warm winter jacket with hood',
                            quantity: 1,
                            unitPrice: 1999.00,
                            totalPrice: 1999.00,
                            taxRate: 18.0,
                            metadata: {
                                color: 'Green',
                                size: 'L',
                                material: 'Polyester'
                            }
                        }
                    ]
                },
                payments: {
                    create: [
                        {
                            paymentMethod: 'wallet',
                            paymentGateway: 'razorpay',
                            transactionId: 'txn_5566778899',
                            amount: 2299.00,
                            currency: 'INR',
                            status: PaymentStatus.COMPLETED,
                            gatewayResponse: {
                                payment_id: 'pay_5566778899',
                                status: 'captured',
                                method: 'wallet',
                                wallet: 'Paytm'
                            },
                            processedAt: new Date('2024-01-22T20:30:00Z')
                        }
                    ]
                },
                shipments: {
                    create: [
                        {
                            trackingNumber: 'FD9876543210',
                            carrier: 'FedEx',
                            serviceType: 'Standard',
                            status: ShipmentStatus.IN_TRANSIT,
                            shippedAt: new Date('2024-01-23T08:00:00Z'),
                            estimatedDelivery: new Date('2024-01-25T18:00:00Z'),
                            trackingUrl: 'https://www.fedex.com/track/FD9876543210'
                        }
                    ]
                }
            }
        }),
        prisma.order.create({
            data: {
                orderNumber: 'ORD-2024-005',
                userId: BigInt(5),
                status: OrderStatus.CONFIRMED,
                paymentStatus: PaymentStatus.PROCESSING,
                fulfillmentStatus: FulfillmentStatus.UNFULFILLED,
                totalAmount: 1799.00,
                subtotal: 1499.00,
                taxAmount: 269.82,
                shippingAmount: 30.18,
                discountAmount: 0,
                currency: 'INR',
                shippingAddress: {
                    firstName: 'Charlie',
                    lastName: 'Wilson',
                    address1: '654 Maple Drive',
                    city: 'Kolkata',
                    state: 'West Bengal',
                    postalCode: '700001',
                    country: 'India',
                    phone: '+91-9876543214',
                    email: 'charlie.wilson@example.com'
                },
                billingAddress: {
                    firstName: 'Charlie',
                    lastName: 'Wilson',
                    address1: '654 Maple Drive',
                    city: 'Kolkata',
                    state: 'West Bengal',
                    postalCode: '700001',
                    country: 'India',
                    phone: '+91-9876543214',
                    email: 'charlie.wilson@example.com'
                },
                orderItems: {
                    create: [
                        {
                            productId: 'PROD-006',
                            variantId: 'VAR-006-PURPLE-M',
                            sku: 'SWEATER-PURPLE-M',
                            name: 'Wool Sweater',
                            description: '100% wool, hand-knitted',
                            quantity: 1,
                            unitPrice: 1499.00,
                            totalPrice: 1499.00,
                            taxRate: 18.0,
                            metadata: {
                                color: 'Purple',
                                size: 'M',
                                material: 'Wool'
                            }
                        }
                    ]
                },
                payments: {
                    create: [
                        {
                            paymentMethod: 'debit_card',
                            paymentGateway: 'razorpay',
                            transactionId: 'txn_9988776655',
                            amount: 1799.00,
                            currency: 'INR',
                            status: PaymentStatus.PROCESSING,
                            gatewayResponse: {
                                payment_id: 'pay_9988776655',
                                status: 'processing',
                                method: 'debit_card',
                                card_id: 'card_9988776655'
                            }
                        }
                    ]
                }
            }
        })
    ]);

    console.log(`✅ Created ${additionalOrders.length} additional orders`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Orders: ${orders.length + additionalOrders.length}`);
    console.log(`- Returns: ${returns.length}`);
    console.log(`- Refunds: ${refunds.length}`);
    console.log('\n🔍 Sample order numbers:');
    orders.forEach(order => console.log(`  - ${order.orderNumber}`));
    additionalOrders.forEach(order => console.log(`  - ${order.orderNumber}`));
}

main()
    .catch((e) => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
