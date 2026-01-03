import { Module, Global } from '@nestjs/common';
import { NotificationsGateway } from './websocket.gateway';

@Global()
@Module({
  providers: [NotificationsGateway],
  exports: [NotificationsGateway],
})
export class WebSocketModule {}
