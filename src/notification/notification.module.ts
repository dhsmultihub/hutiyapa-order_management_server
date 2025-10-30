import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { EmailNotificationService } from './services/email-notification.service';
import { SmsNotificationService } from './services/sms-notification.service';
import { PushNotificationService } from './services/push-notification.service';
import { NotificationPreferencesService } from './services/notification-preferences.service';
import { PrismaModule } from '../database/prisma.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [ConfigModule, PrismaModule, WebSocketModule],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    EmailNotificationService,
    SmsNotificationService,
    PushNotificationService,
    NotificationPreferencesService,
  ],
  exports: [NotificationService, NotificationPreferencesService],
})
export class NotificationModule {}