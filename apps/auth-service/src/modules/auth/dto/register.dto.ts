import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class RegisterDto {
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(72) // giới hạn bcrypt (72 byte)
  password: string;

  @IsString()
  @MaxLength(100)
  name: string;
}
