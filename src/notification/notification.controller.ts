import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
// Define UserRole enum since it's not in Prisma schema
enum UserRole {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
  CUSTOMER = 'CUSTOMER',
}
import { NotificationService } from './notification.service';
import {
  CreateNotificationDto,
  NotificationResponseDto,
  NotificationQueryDto,
  NotificationPreferencesDto,
  UpdateNotificationPreferencesDto,
} from './dto/notification.dto';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Create notification' })
  @ApiResponse({ status: 201, description: 'Notification created successfully', type: NotificationResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createNotification(
    @Body() createNotificationDto: CreateNotificationDto,
  ): Promise<NotificationResponseDto> {
    return this.notificationService.createNotification(createNotificationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserNotifications(
    @Query() query: NotificationQueryDto,
    @CurrentUser() user: any,
  ): Promise<{ notifications: NotificationResponseDto[]; total: number }> {
    return this.notificationService.getUserNotifications(user.sub, query);
  }

  @Put(':id/read')
  @ApiParam({ name: 'id', description: 'Notification ID', example: '1' })
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read', type: NotificationResponseDto })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<NotificationResponseDto> {
    return this.notificationService.markAsRead(id, user.sub);
  }

  @Put('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markAllAsRead(@CurrentUser() user: any): Promise<void> {
    return this.notificationService.markAllAsRead(user.sub);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', description: 'Notification ID', example: '1' })
  @ApiOperation({ summary: 'Delete notification' })
  @ApiResponse({ status: 200, description: 'Notification deleted successfully' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteNotification(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<void> {
    return this.notificationService.deleteNotification(id, user.sub);
  }

  // Notification preferences
  @Get('preferences')
  @ApiOperation({ summary: 'Get user notification preferences' })
  @ApiResponse({ status: 200, description: 'Preferences retrieved successfully', type: NotificationPreferencesDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserPreferences(@CurrentUser() user: any): Promise<NotificationPreferencesDto> {
    return this.notificationService.getUserPreferences(user.sub);
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Update user notification preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated successfully', type: NotificationPreferencesDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateUserPreferences(
    @Body() updateDto: UpdateNotificationPreferencesDto,
    @CurrentUser() user: any,
  ): Promise<NotificationPreferencesDto> {
    return this.notificationService.updateUserPreferences(user.sub, updateDto);
  }

  // Device token management for push notifications
  @Post('device-tokens')
  @ApiOperation({ summary: 'Register device token for push notifications' })
  @ApiResponse({ status: 201, description: 'Device token registered successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async registerDeviceToken(
    @Body() body: { token: string; platform: 'ios' | 'android' | 'web' },
    @CurrentUser() user: any,
  ): Promise<{ success: boolean }> {
    const success = await this.notificationService.registerDeviceToken(
      user.sub,
      body.token,
      body.platform,
    );
    return { success };
  }

  @Delete('device-tokens/:token')
  @ApiParam({ name: 'token', description: 'Device token to unregister' })
  @ApiOperation({ summary: 'Unregister device token' })
  @ApiResponse({ status: 200, description: 'Device token unregistered successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async unregisterDeviceToken(
    @Param('token') token: string,
    @CurrentUser() user: any,
  ): Promise<{ success: boolean }> {
    const success = await this.notificationService.unregisterDeviceToken(user.sub, token);
    return { success };
  }
}
