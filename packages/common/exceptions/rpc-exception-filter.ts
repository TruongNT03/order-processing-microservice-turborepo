import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Inject,
  Injectable,
} from "@nestjs/common";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";
import { throwError } from "rxjs";
import { RpcException } from "@nestjs/microservices";

/**
 * Filter dành riêng cho microservice (transport RMQ/Kafka).
 * Chuẩn hoá lỗi thành payload nhất quán rồi trả về observable error
 * để phía gateway (ClientProxy) nhận được qua catchError.
 */
@Injectable()
@Catch()
export class RpcAllExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
  ) {}

  catch(exception: any, _host: ArgumentsHost) {
    let errorPayload: Record<string, any>;

    if (exception instanceof RpcException) {
      errorPayload = { message: exception.message, statusCode: 400 };
    } else if (exception instanceof HttpException) {
      const res = exception.getResponse();
      errorPayload = {
        statusCode: exception.getStatus(),
        ...(typeof res === "object" ? res : { message: res }),
      };
    } else {
      errorPayload = {
        statusCode: 500,
        errorCode: "internal_server_error",
        message: exception?.message ?? "Internal Server Error",
      };
    }

    this.logger.error({
      context: "RpcAllExceptionFilter",
      message: "RPC handler error",
      error: exception,
      meta: errorPayload,
    });

    return throwError(() => errorPayload);
  }
}
