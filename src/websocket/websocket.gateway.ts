import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface AuthenticatedSocket extends Socket {
    userId?: string;
    userRole?: string;
}

@WebSocketGateway({
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    },
    namespace: '/orders',
})
export class OrderWebSocketGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(OrderWebSocketGateway.name);
    private connectedClients = new Map<string, AuthenticatedSocket>();

    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    afterInit(server: Server) {
        this.logger.log('WebSocket Gateway initialized');
    }

    async handleConnection(client: AuthenticatedSocket) {
        try {
            // Extract token from handshake
            const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');

            if (!token) {
                this.logger.warn(`Client ${client.id} connected without token`);
                client.disconnect();
                return;
            }

            // Verify JWT token
            const payload = this.jwtService.verify(token, {
                secret: this.configService.get('JWT_SECRET'),
            });

            client.userId = payload.sub;
            client.userRole = payload.role;

            this.connectedClients.set(client.id, client);
            this.logger.log(`Client ${client.id} connected for user ${client.userId}`);

            // Join user-specific room
            client.join(`user:${client.userId}`);

            // Join role-based rooms
            if (client.userRole === 'ADMIN') {
                client.join('admin');
            }
            if (client.userRole === 'EMPLOYEE') {
                client.join('employee');
            }

            // Send connection confirmation
            client.emit('connected', {
                message: 'Connected to order management system',
                userId: client.userId,
                timestamp: new Date().toISOString(),
            });

        } catch (error) {
            this.logger.error(`Authentication failed for client ${client.id}: ${error.message}`);
            client.disconnect();
        }
    }

    handleDisconnect(client: AuthenticatedSocket) {
        this.connectedClients.delete(client.id);
        this.logger.log(`Client ${client.id} disconnected`);
    }

    @SubscribeMessage('join_order_room')
    handleJoinOrderRoom(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { orderId: string },
    ) {
        if (!client.userId) {
            client.emit('error', { message: 'Not authenticated' });
            return;
        }

        const roomName = `order:${data.orderId}`;
        client.join(roomName);
        this.logger.log(`Client ${client.id} joined room ${roomName}`);

        client.emit('joined_room', {
            room: roomName,
            orderId: data.orderId,
        });
    }

    @SubscribeMessage('leave_order_room')
    handleLeaveOrderRoom(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { orderId: string },
    ) {
        const roomName = `order:${data.orderId}`;
        client.leave(roomName);
        this.logger.log(`Client ${client.id} left room ${roomName}`);

        client.emit('left_room', {
            room: roomName,
            orderId: data.orderId,
        });
    }

    @SubscribeMessage('subscribe_notifications')
    handleSubscribeNotifications(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { types: string[] },
    ) {
        if (!client.userId) {
            client.emit('error', { message: 'Not authenticated' });
            return;
        }

        // Join notification type rooms
        data.types.forEach(type => {
            client.join(`notification:${type}`);
        });

        this.logger.log(`Client ${client.id} subscribed to notifications: ${data.types.join(', ')}`);

        client.emit('subscribed_notifications', {
            types: data.types,
            timestamp: new Date().toISOString(),
        });
    }

    // Public methods for emitting events
    emitOrderUpdate(orderId: string, update: any) {
        this.server.to(`order:${orderId}`).emit('order_updated', {
            orderId,
            update,
            timestamp: new Date().toISOString(),
        });
    }

    emitOrderStatusChange(orderId: string, oldStatus: string, newStatus: string, userId: string) {
        this.server.to(`order:${orderId}`).emit('order_status_changed', {
            orderId,
            oldStatus,
            newStatus,
            timestamp: new Date().toISOString(),
        });

        // Notify specific user
        this.server.to(`user:${userId}`).emit('order_status_changed', {
            orderId,
            oldStatus,
            newStatus,
            timestamp: new Date().toISOString(),
        });
    }

    emitPaymentUpdate(orderId: string, paymentUpdate: any) {
        this.server.to(`order:${orderId}`).emit('payment_updated', {
            orderId,
            payment: paymentUpdate,
            timestamp: new Date().toISOString(),
        });
    }

    emitShipmentUpdate(orderId: string, shipmentUpdate: any) {
        this.server.to(`order:${orderId}`).emit('shipment_updated', {
            orderId,
            shipment: shipmentUpdate,
            timestamp: new Date().toISOString(),
        });
    }

    emitNotification(userId: string, notification: any) {
        this.server.to(`user:${userId}`).emit('notification', {
            ...notification,
            timestamp: new Date().toISOString(),
        });
    }

    emitBroadcastNotification(notification: any, roles?: string[]) {
        if (roles && roles.length > 0) {
            roles.forEach(role => {
                this.server.to(role.toLowerCase()).emit('broadcast_notification', {
                    ...notification,
                    timestamp: new Date().toISOString(),
                });
            });
        } else {
            this.server.emit('broadcast_notification', {
                ...notification,
                timestamp: new Date().toISOString(),
            });
        }
    }

    emitSystemAlert(alert: any) {
        this.server.to('admin').to('employee').emit('system_alert', {
            ...alert,
            timestamp: new Date().toISOString(),
        });
    }

    // Get connected clients count
    getConnectedClientsCount(): number {
        return this.connectedClients.size;
    }

    // Get connected users
    getConnectedUsers(): string[] {
        return Array.from(this.connectedClients.values())
            .map(client => client.userId)
            .filter(Boolean);
    }
}