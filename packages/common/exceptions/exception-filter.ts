import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from "@nestjs/common";
import { Response } from "express";
import { HttpExceptionResponseDto } from "../dtos/http-exception-res.dto";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";
import * as _ from "lodash";
import { ERROR_RESPONSE } from "./exception.constant";
import { plainToInstance } from "class-transformer";

const isProductionEnv = (): boolean => process.env.NODE_ENV === "production";

const convertErrorToObject = (error: any) => {
  if (!error) return null;
  if (typeof error === "string") return error;
  return _.pick(error, Object.getOwnPropertyNames(error));
};

/**
 * Chuẩn hoá exception thành HttpExceptionResponseDto.
 * Hỗ trợ cả HTTP context (api-gateway) lẫn RPC context (các microservice
 * transport RMQ/Kafka), vì host.switchToHttp() không hợp lệ cho RPC.
 */
@Injectable()
@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
  ) {}

  private buildErrorData(exception: any, path?: string) {
    const isHttpException = exception instanceof HttpException;
    const errorData: Partial<HttpExceptionResponseDto> = {
      statusCode: isHttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp: new Date().toISOString(),
      path,
    };

    if (isHttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === "string") {
        _.assign(errorData, { message: exceptionResponse });
      }
      _.assign(
        errorData,
        { statusCode: exception.getStatus() },
        typeof exceptionResponse === "object" ? exceptionResponse : {},
      );
    } else {
      this.logger.error({
        context: `AllExceptionFilter`,
        error: exception,
        message: `A non-http error being thrown somewhere`,
        meta: exception,
      });
      _.assign(errorData, {
        ...ERROR_RESPONSE.INTERNAL_SERVER_ERROR,
        details: convertErrorToObject(exception),
      });
    }

    // Chỉ ẩn chi tiết lỗi khi chạy production
    if (isProductionEnv()) {
      delete errorData.details;
    }

    return errorData;
  }

  catch(exception: any, host: ArgumentsHost) {
    const type = host.getType();

    if (type === "http") {
      const ctx = host.switchToHttp();
      const request = ctx.getRequest<any>();
      const response = ctx.getResponse<Response>();
      const errorData = this.buildErrorData(exception, request?.url);

      response
        .status(errorData.statusCode)
        .json(plainToInstance(HttpExceptionResponseDto, errorData));
      return;
    }

    // RPC context (RMQ/Kafka): không có HTTP response.
    // Trả về observable lỗi để client phía gateway nhận được error payload.
    const errorData = this.buildErrorData(exception);
    this.logger.error({
      context: "AllExceptionFilter",
      message: "RPC handler error",
      meta: errorData,
    });
    throw exception;
  }
}
