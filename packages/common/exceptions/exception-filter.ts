import {
  ArgumentsHost,
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

@Injectable()
export class AllExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
  ) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const isHttpException = exception instanceof HttpException;
    const errorData: Partial<HttpExceptionResponseDto> = {
      statusCode: isHttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    const convertErrorToObject = (error) => {
      if (!error) return null;

      if (typeof error === "string") {
        return error;
      }

      return _.pick(error, Object.getOwnPropertyNames(error));
    };

    if (isHttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === "string") {
        _.assign(errorData, { message: exceptionResponse });
      }

      _.assign(
        errorData,
        { statusCode: exception.getStatus() },
        exceptionResponse,
      );
    } else {
      this.logger.error({
        context: `AllExceptionFilter`,
        error: exception,
        message: `A non-http error being throw somewhere`,
        meta: exception,
      });

      _.assign(errorData, {
        ...ERROR_RESPONSE.INTERNAL_SERVER_ERROR,
        details: convertErrorToObject(exception),
      });
    }

    const isProduction = true;
    isProduction && delete errorData.details;

    response
      .status(errorData.statusCode)
      .json(plainToInstance(HttpExceptionResponseDto, errorData));
  }
}
