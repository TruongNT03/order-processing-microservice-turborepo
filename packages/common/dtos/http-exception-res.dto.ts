import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";

@Exclude()
export class HttpExceptionResponseDto {
  @ApiProperty()
  @Expose()
  statusCode: number;

  @ApiPropertyOptional()
  @Expose()
  timestamp?: string;

  @ApiPropertyOptional()
  @Expose()
  path?: string;

  @ApiProperty()
  @Expose()
  errorCode: string;

  @ApiProperty()
  @Expose()
  message: string;

  @ApiPropertyOptional()
  @Expose()
  details?: object;
}
