import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { RmqContext } from "@nestjs/microservices";
import { Observable, tap, catchError, throwError } from "rxjs";
import { Channel, Message } from "amqplib";

@Injectable()
export class RmqManualAckInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const logger = new Logger();
    if (context.getType() !== "rpc") {
      return next.handle();
    }

    const ctx = context.switchToRpc().getContext<RmqContext>();

    if (!(ctx instanceof RmqContext)) {
      return next.handle();
    }

    const channel: Channel = ctx.getChannelRef();
    const message = ctx.getMessage() as Message;

    return next.handle().pipe(
      tap(() => {
        channel.ack(message);
        logger.log(
          `Ack messageId:${message.properties.messageId} successfully!`,
        );
      }),
      catchError((error) => {
        const deaths = message.properties.headers?.["x-death"] ?? [];

        const rejected = deaths.find(
          (death: any) =>
            death.queue === "order_queue" && death.reason === "rejected",
        );

        const retryCount = Number(rejected?.count ?? 0);
        if (retryCount < 3) {
          channel.nack(message, false, false);
          logger.log(
            `Nack messageId:${message.properties.messageId} successfully!`,
          );
        } else {
          channel.publish("order.dlq.exchange", "order.dlq", message.content, {
            persistent: true,
            messageId: message.properties.messageId,
            headers: message.properties.headers,
          });

          channel.ack(message);
          logger.log(
            `Ack DLQ messageId:${message.properties.messageId} successfully!`,
          );
        }

        return throwError(() => error);
      }),
    );
  }
}
