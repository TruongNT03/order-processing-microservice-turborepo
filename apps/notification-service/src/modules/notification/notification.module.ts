import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { Notification } from '../../entities/notification.entity';
import { OutboxModule } from '@repo/database';

@Module({
  imports: [TypeOrmModule.forFeature([Notification]), OutboxModule],
  controllers: [NotificationController],
  providers: [NotificationService],
})
export class NotificationModule {}
