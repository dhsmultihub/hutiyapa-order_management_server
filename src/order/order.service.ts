import { Injectable, NotFoundException, BadRequestException, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { OrderModel } from '../models/order.model';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { OrderStateMachineService } from './lifecycle/order-state-machine.service';
import { OrderValidatorService } from './lifecycle/order-validator.service';
import { OrderCreatorService } from './operations/order-creator.service';
import { PaymentService } from '../payment/payment.service';
import { ShipmentService } from '../shipment/shipment.service';
import { OrderEventsService } from '../events/order-events.service';
import { SearchService } from '../search/services/search.service';
import { SearchIndexingService } from '../search/services/search-indexing.service';

@Injectable()
export class OrderService {
    private readonly logger = new Logger(OrderService.name);

    constructor(
        private readonly prismaService: PrismaService,
        private readonly stateMachine: OrderStateMachineService,
        private readonly validator: OrderValidatorService,
        private readonly creator: OrderCreatorService,
        private readonly paymentService: PaymentService,
        private readonly shipmentService: ShipmentService,
        private readonly orderEvents: OrderEventsService,
        private readonly searchService: SearchService,
        private readonly searchIndexing: SearchIndexingService,
    ) { }

    async createOrder(createOrderDto: CreateOrderDto, user: any): Promise<OrderResponseDto> {
        this.logger.log(`Creating new order for user ${user?.id}`);

        try {
            // Validate and process order
            this.validator.validateCreate(createOrderDto);
            if (createOrderDto.useSameAddressForBilling) {
                createOrderDto.setSameAddressForBilling();
            }
            // Generate unique order number
            const orderNumber = await this.generateOrderNumber();
            const order = await this.creator.create(createOrderDto, orderNumber);

            // Emit order created event
            await this.orderEvents.emitOrderCreated({
                orderId: order.id.toString(),
                orderNumber: order.orderNumber,
                userId: order.userId.toString(),
                newStatus: order.status,
                amount: order.totalAmount.toNumber(),
            });

            // Index order for search
            await this.searchIndexing.reindexOrder(order.id.toString());

            this.logger.log(`Order created successfully: ${order.orderNumber}`);
            return this.mapOrderToResponseDto(order);
        } catch (error) {
            this.logger.error('Failed to create order:', error);
            throw error;
        }
    }

    async searchOrders(searchQuery: any, user: any): Promise<any> {
        this.logger.log(`Searching orders for user ${user?.id}`);

        try {
            return await this.searchService.search(searchQuery);
        } catch (error) {
            this.logger.error('Failed to search orders:', error);
            throw error;
        }
    }

    async getOrders(query: OrderQueryDto, user: any): Promise<{ orders: OrderResponseDto[]; total: number; page: number; limit: number }> {
        this.logger.log(`Fetching orders for user ${user?.id} with query:`, JSON.stringify(query));

        try {
            // Validate query
            const queryValidation = query.validate();
            if (!queryValidation.isValid) {
                throw new BadRequestException(`Query validation failed: ${queryValidation.errors.join(', ')}`);
            }

            const {
                page = 1,
                limit = 10,
                status,
                paymentStatus,
                fulfillmentStatus,
                userId,
                startDate,
                endDate,
                search,
                sortBy = 'createdAt',
                sortOrder = 'desc',
            } = query;

            const skip = (page - 1) * limit;
            const where: any = {};

            // Apply user authorization - REQUIRED: user must be authenticated
            if (!user) {
                throw new BadRequestException('Authentication required to view orders');
            }

            // Filter by userId - Regular users can only see their own orders
            if (!user.roles?.includes('admin') && !user.roles?.includes('staff')) {
                // Regular users can only see their own orders
                const userIdToFilter = user.id?.toString() || user.id;
                where.userId = BigInt(userIdToFilter);
                this.logger.log(`🔒 Filtering orders for regular user: ${userIdToFilter}`);
            } else if (userId) {
                // Admin/staff can filter by specific user if provided
                where.userId = BigInt(userId);
                this.logger.log(`👑 Admin/Staff filtering by userId: ${userId}`);
            } else {
                // Admin/staff without userId filter will see all orders (by design)
                this.logger.log(`👑 Admin/Staff viewing all orders`);
            }

            // Apply filters
            if (status) where.status = status;
            if (paymentStatus) where.paymentStatus = paymentStatus;
            if (fulfillmentStatus) where.fulfillmentStatus = fulfillmentStatus;
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) where.createdAt.gte = new Date(startDate);
                if (endDate) where.createdAt.lte = new Date(endDate);
            }
            if (search) {
                where.OR = [
                    { orderNumber: { contains: search, mode: 'insensitive' } },
                    { notes: { contains: search, mode: 'insensitive' } },
                ];
            }

            // Log the where clause for debugging
            this.logger.log(`📋 Database query where clause:`, JSON.stringify(where, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value
            ));

            const [orders, total] = await Promise.all([
                this.prismaService.order.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { [sortBy]: sortOrder },
                    include: {
                        orderItems: true,
                        payments: true,
                        shipments: true,
                        returns: true,
                        refunds: true,
                    },
                }),
                this.prismaService.order.count({ where }),
            ]);

            this.logger.log(`✅ Found ${orders.length} orders (total: ${total}) for user ${user.id}`);

            return {
                orders: orders.map(order => this.mapOrderToResponseDto(order)),
                total,
                page,
                limit,
            };
        } catch (error) {
            this.logger.error('Failed to fetch orders:', error);
            throw error;
        }
    }

    async getOrderById(id: string, user: any): Promise<OrderResponseDto> {
        this.logger.log(`Fetching order ${id} for user ${user?.id}`);

        try {
            const order = await this.prismaService.order.findUnique({
                where: { id: BigInt(id) },
                include: {
                    orderItems: true,
                    payments: true,
                    shipments: true,
                    returns: true,
                    refunds: true,
                },
            });

            if (!order) {
                throw new NotFoundException(`Order with ID ${id} not found`);
            }

            // Check user authorization
            if (user) {
                if (!user.roles?.includes('admin') && !user.roles?.includes('staff')) {
                    if (order.userId.toString() !== user.id) {
                        throw new ForbiddenException('Access denied. You can only view your own orders.');
                    }
                }
            }
            // If user is null, allow public access

            return this.mapOrderToResponseDto(order);
        } catch (error) {
            this.logger.error(`Failed to fetch order ${id}:`, error);
            throw error;
        }
    }

    async updateOrder(id: string, updateOrderDto: UpdateOrderDto, user: any): Promise<OrderResponseDto> {
        this.logger.log(`Updating order ${id} by user ${user?.id}`);

        try {
            const existingOrder = await this.prismaService.order.findUnique({
                where: { id: BigInt(id) },
            });

            if (!existingOrder) {
                throw new NotFoundException(`Order with ID ${id} not found`);
            }

            // Check user authorization
            if (!user.roles?.includes('admin') && !user.roles?.includes('staff')) {
                if (existingOrder.userId.toString() !== user.id) {
                    throw new ForbiddenException('Access denied. You can only update your own orders.');
                }
            }

            // Validate DTO
            const dtoValidation = updateOrderDto.validate();
            if (!dtoValidation.isValid) {
                throw new BadRequestException(`Validation failed: ${dtoValidation.errors.join(', ')}`);
            }

            const orderModel = OrderModel.fromPrisma(existingOrder);
            orderModel.updateFromDto(updateOrderDto);

            const updatedOrder = await this.prismaService.order.update({
                where: { id: BigInt(id) },
                data: orderModel.toPrismaUpdate(),
                include: {
                    orderItems: true,
                    payments: true,
                    shipments: true,
                    returns: true,
                    refunds: true,
                },
            });

            this.logger.log(`Order updated successfully: ${updatedOrder.orderNumber}`);
            return this.mapOrderToResponseDto(updatedOrder);
        } catch (error) {
            this.logger.error(`Failed to update order ${id}:`, error);
            throw error;
        }
    }

    async cancelOrder(id: string, user: any): Promise<OrderResponseDto> {
        this.logger.log(`Cancelling order ${id} by user ${user?.id}`);

        try {
            const existingOrder = await this.prismaService.order.findUnique({
                where: { id: BigInt(id) },
            });

            if (!existingOrder) {
                throw new NotFoundException(`Order with ID ${id} not found`);
            }

            // Check user authorization
            if (!user.roles?.includes('admin') && !user.roles?.includes('staff')) {
                if (existingOrder.userId.toString() !== user.id) {
                    throw new ForbiddenException('Access denied. You can only cancel your own orders.');
                }
            }

            const orderModel = OrderModel.fromPrisma(existingOrder);

            if (!orderModel.canBeCancelled()) {
                throw new BadRequestException('Order cannot be cancelled in current status');
            }

            orderModel.cancel();

            const updatedOrder = await this.prismaService.order.update({
                where: { id: BigInt(id) },
                data: orderModel.toPrismaUpdate(),
                include: {
                    orderItems: true,
                    payments: true,
                    shipments: true,
                    returns: true,
                    refunds: true,
                },
            });

            this.logger.log(`Order cancelled successfully: ${updatedOrder.orderNumber}`);
            return this.mapOrderToResponseDto(updatedOrder);
        } catch (error) {
            this.logger.error(`Failed to cancel order ${id}:`, error);
            throw error;
        }
    }

    async getOrderStatus(id: string, user: any): Promise<{ status: string; paymentStatus: string; fulfillmentStatus: string }> {
        this.logger.log(`Fetching order status ${id} for user ${user?.id}`);

        try {
            const order = await this.prismaService.order.findUnique({
                where: { id: BigInt(id) },
                select: {
                    status: true,
                    paymentStatus: true,
                    fulfillmentStatus: true,
                    userId: true,
                },
            });

            if (!order) {
                throw new NotFoundException(`Order with ID ${id} not found`);
            }

            // Check user authorization
            if (user) {
                if (!user.roles?.includes('admin') && !user.roles?.includes('staff')) {
                    if (order.userId.toString() !== user.id) {
                        throw new ForbiddenException('Access denied. You can only view your own order status.');
                    }
                }
            }
            // If user is null, allow public access

            return {
                status: order.status,
                paymentStatus: order.paymentStatus,
                fulfillmentStatus: order.fulfillmentStatus,
            };
        } catch (error) {
            this.logger.error(`Failed to fetch order status ${id}:`, error);
            throw error;
        }
    }

    async updateOrderStatus(id: string, status: string, user: any): Promise<OrderResponseDto> {
        this.logger.log(`Updating order status ${id} to ${status} by user ${user?.id}`);

        try {
            const existingOrder = await this.prismaService.order.findUnique({
                where: { id: BigInt(id) },
            });

            if (!existingOrder) {
                throw new NotFoundException(`Order with ID ${id} not found`);
            }

            // Check user authorization - only admin/staff can update order status
            if (!user.roles?.includes('admin') && !user.roles?.includes('staff')) {
                throw new ForbiddenException('Access denied. Only admin and staff can update order status.');
            }

            const orderModel = OrderModel.fromPrisma(existingOrder);
            this.stateMachine.validateTransition(orderModel, status);
            this.stateMachine.applyTransition(orderModel, status);

            const updatedOrder = await this.prismaService.order.update({
                where: { id: BigInt(id) },
                data: orderModel.toPrismaUpdate(),
                include: {
                    orderItems: true,
                    payments: true,
                    shipments: true,
                    returns: true,
                    refunds: true,
                },
            });

            this.logger.log(`Order status updated successfully: ${updatedOrder.orderNumber} to ${status}`);
            return this.mapOrderToResponseDto(updatedOrder);
        } catch (error) {
            this.logger.error(`Failed to update order status ${id}:`, error);
            throw error;
        }
    }

    private async generateOrderNumber(): Promise<string> {
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `ORD-${timestamp}-${random}`;
    }

    private mapOrderToResponseDto(order: any): OrderResponseDto {
        return {
            id: order.id.toString(),
            orderNumber: order.orderNumber,
            userId: order.userId.toString(),
            status: order.status,
            paymentStatus: order.paymentStatus,
            fulfillmentStatus: order.fulfillmentStatus,
            totalAmount: order.totalAmount.toNumber(),
            subtotal: order.subtotal.toNumber(),
            taxAmount: order.taxAmount.toNumber(),
            shippingAmount: order.shippingAmount.toNumber(),
            discountAmount: order.discountAmount.toNumber(),
            currency: order.currency,
            shippingAddress: order.shippingAddress,
            billingAddress: order.billingAddress,
            notes: order.notes,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            shippedAt: order.shippedAt,
            deliveredAt: order.deliveredAt,
            cancelledAt: order.cancelledAt,
            orderItems: order.orderItems?.map((item: any) => ({
                id: item.id.toString(),
                orderId: item.orderId.toString(),
                productId: item.productId,
                variantId: item.variantId,
                sku: item.sku,
                name: item.name,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice.toNumber(),
                totalPrice: item.totalPrice.toNumber(),
                taxRate: item.taxRate.toNumber(),
                metadata: item.metadata,
                createdAt: item.createdAt,
            })) || [],
            payments: order.payments?.map((payment: any) => ({
                id: payment.id.toString(),
                orderId: payment.orderId.toString(),
                paymentMethod: payment.paymentMethod,
                paymentGateway: payment.paymentGateway,
                transactionId: payment.transactionId,
                amount: payment.amount.toNumber(),
                currency: payment.currency,
                status: payment.status,
                gatewayResponse: payment.gatewayResponse,
                processedAt: payment.processedAt,
                createdAt: payment.createdAt,
            })) || [],
            shipments: order.shipments?.map((shipment: any) => ({
                id: shipment.id.toString(),
                orderId: shipment.orderId.toString(),
                trackingNumber: shipment.trackingNumber,
                carrier: shipment.carrier,
                serviceType: shipment.serviceType,
                status: shipment.status,
                shippedAt: shipment.shippedAt,
                deliveredAt: shipment.deliveredAt,
                estimatedDelivery: shipment.estimatedDelivery,
                trackingUrl: shipment.trackingUrl,
                createdAt: shipment.createdAt,
            })) || [],
            returns: order.returns?.map((returnItem: any) => ({
                id: returnItem.id.toString(),
                orderId: returnItem.orderId.toString(),
                returnNumber: returnItem.returnNumber,
                reason: returnItem.reason,
                status: returnItem.status,
                requestedAt: returnItem.requestedAt,
                approvedAt: returnItem.approvedAt,
                processedAt: returnItem.processedAt,
                refundAmount: returnItem.refundAmount?.toNumber(),
                notes: returnItem.notes,
            })) || [],
            refunds: order.refunds?.map((refund: any) => ({
                id: refund.id.toString(),
                orderId: refund.orderId.toString(),
                paymentId: refund.paymentId.toString(),
                amount: refund.amount.toNumber(),
                reason: refund.reason,
                status: refund.status,
                processedAt: refund.processedAt,
                createdAt: refund.createdAt,
            })) || [],
        };
    }

    /**
     * Get all unique userIds from orders (Development Only)
     */
    async getUniqueUserIds(): Promise<{ userIds: string[]; count: number; ordersPerUser: Array<{ userId: string; count: number }> }> {
        try {
            // Get distinct userIds from orders
            const orders = await this.prisma.order.findMany({
                select: {
                    userId: true,
                },
                distinct: ['userId'],
                orderBy: {
                    userId: 'asc',
                },
            });

            const userIds = orders.map((order) => order.userId.toString());
            const uniqueUserIds = [...new Set(userIds)];

            // Get order count per user
            const ordersPerUser = await Promise.all(
                uniqueUserIds.map(async (userId) => {
                    const count = await this.prisma.order.count({
                        where: {
                            userId: BigInt(userId),
                        },
                    });
                    return { userId, count };
                })
            );

            return {
                userIds: uniqueUserIds,
                count: uniqueUserIds.length,
                ordersPerUser,
            };
        } catch (error) {
            this.logger.error('Error fetching unique userIds:', error);
            throw new BadRequestException('Failed to fetch userIds');
        }
    }
}
