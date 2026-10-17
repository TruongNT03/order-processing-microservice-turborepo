import { Controller } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { RMQ_PATTERN } from "@repo/common";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern(RMQ_PATTERN.AUTH.REGISTER)
  register(@Payload() body: RegisterDto) {
    return this.authService.register(body);
  }

  @MessagePattern(RMQ_PATTERN.AUTH.LOGIN)
  login(@Payload() body: LoginDto) {
    return this.authService.login(body);
  }

  @MessagePattern(RMQ_PATTERN.AUTH.VALIDATE_TOKEN)
  validateToken(@Payload() token: string) {
    return this.authService.validateToken(token);
  }
}
