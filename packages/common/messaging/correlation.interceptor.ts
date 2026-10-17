import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { randomUUID } from "crypto";
import {
  CORRELATION_ID_HEADER,
  CorrelationContext,
} from "./correlation.context";

@Injectable()
export class CorrelationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== "http") {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const correlationId = req.headers?.[CORRELATION_ID_HEADER] ?? randomUUID();

    if (res?.setHeader) {
      res.setHeader(CORRELATION_ID_HEADER, correlationId);
    }

    return CorrelationContext.run(correlationId, () => next.handle());
  }
}
