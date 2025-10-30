import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { OrderStatusDto } from './dto/order-status.dto';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class OrderController {
    constructor(private readonly orderService: OrderService) { }

    @Post()
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({ summary: 'Create a new order' })
    @ApiResponse({ status: 201, description: 'Order created successfully', type: OrderResponseDto })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async createOrder(
        @Body() createOrderDto: CreateOrderDto,
        @CurrentUser() user: any
    ): Promise<OrderResponseDto> {
        return this.orderService.createOrder(createOrderDto, user);
    }

    @Get()
    @Public()
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({ summary: 'Get all orders with filtering and pagination' })
    @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getOrders(
        @Query() query: OrderQueryDto,
        @CurrentUser() user: any
    ) {
        return this.orderService.getOrders(query, user);
    }

    @Get(':id')
    @Public()
    @ApiParam({ name: 'id', description: 'Order ID', example: '1' })
    @ApiOperation({ summary: 'Get order by ID' })
    @ApiResponse({ status: 200, description: 'Order retrieved successfully', type: OrderResponseDto })
    @ApiResponse({ status: 404, description: 'Order not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getOrderById(
        @Param('id') id: string,
        @CurrentUser() user: any
    ): Promise<OrderResponseDto> {
        return this.orderService.getOrderById(id, user);
    }

    @Put(':id')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiParam({ name: 'id', description: 'Order ID', example: '1' })
    @ApiOperation({ summary: 'Update order by ID' })
    @ApiResponse({ status: 200, description: 'Order updated successfully', type: OrderResponseDto })
    @ApiResponse({ status: 404, description: 'Order not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async updateOrder(
        @Param('id') id: string,
        @Body() updateOrderDto: UpdateOrderDto,
        @CurrentUser() user: any
    ): Promise<OrderResponseDto> {
        return this.orderService.updateOrder(id, updateOrderDto, user);
    }

    @Delete(':id')
    @ApiParam({ name: 'id', description: 'Order ID', example: '1' })
    @ApiOperation({ summary: 'Cancel order by ID' })
    @ApiResponse({ status: 200, description: 'Order cancelled successfully', type: OrderResponseDto })
    @ApiResponse({ status: 404, description: 'Order not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async cancelOrder(
        @Param('id') id: string,
        @CurrentUser() user: any
    ): Promise<OrderResponseDto> {
        return this.orderService.cancelOrder(id, user);
    }

    @Get(':id/status')
    @Public()
    @ApiParam({ name: 'id', description: 'Order ID', example: '1' })
    @ApiOperation({ summary: 'Get order status' })
    @ApiResponse({ status: 200, description: 'Order status retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Order not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async getOrderStatus(
        @Param('id') id: string,
        @CurrentUser() user: any
    ) {
        return this.orderService.getOrderStatus(id, user);
    }

    @Put(':id/status')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiParam({ name: 'id', description: 'Order ID', example: '1' })
    @ApiOperation({ summary: 'Update order status' })
    @ApiResponse({ status: 200, description: 'Order status updated successfully', type: OrderResponseDto })
    @ApiResponse({ status: 404, description: 'Order not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async updateOrderStatus(
        @Param('id') id: string,
        @Body() statusUpdate: OrderStatusDto,
        @CurrentUser() user: any
    ): Promise<OrderResponseDto> {
        return this.orderService.updateOrderStatus(id, statusUpdate.status, user);
    }
}
