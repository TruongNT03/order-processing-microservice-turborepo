import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";

@Exclude()
export class SuccessResponseDto {
  @Expose()
  @ApiProperty()
  success: boolean;
}
