import { HttpExceptionResponseDto } from "../dtos/http-exception-res.dto";

export enum ErrorResponseKey {
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
}

export const ERROR_RESPONSE = {
  INTERNAL_SERVER_ERROR: {
    statusCode: 500,
    errorCode: "internal_server_error",
    message: "Internal Server Error",
  },
} as const satisfies Record<ErrorResponseKey, HttpExceptionResponseDto>;
