import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";
import { DataSource, Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { User } from "../../entities/user.entity";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import {
  AuthResult,
  AuthUser,
  JwtPayload,
  ValidateTokenResult,
} from "./dto/auth-result.dto";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly saltRounds = 10;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Đăng ký tài khoản mới. Email phải duy nhất; mật khẩu được hash bcrypt.
   */
  async register(dto: RegisterDto): Promise<AuthResult> {
    const email = dto.email.toLowerCase().trim();

    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException(`Email ${email} already registered`);
    }

    const passwordHash = await bcrypt.hash(dto.password, this.saltRounds);
    const user = await this.userRepo.save(
      this.userRepo.create({
        email,
        passwordHash,
        name: dto.name,
      }),
    );

    this.logger.log(`User registered: ${email}`);
    return this.buildAuthResult(user);
  }

  /**
   * Đăng nhập: xác thực email + mật khẩu, phát JWT khi hợp lệ.
   * Trả lỗi chung chung để không lộ email nào tồn tại.
   */
  async login(dto: LoginDto): Promise<AuthResult> {
    const email = dto.email.toLowerCase().trim();
    const user = await this.userRepo.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const matched = await bcrypt.compare(dto.password, user.passwordHash);
    if (!matched) {
      throw new UnauthorizedException("Invalid credentials");
    }

    this.logger.log(`User logged in: ${email}`);
    return this.buildAuthResult(user);
  }

  /**
   * Xác thực JWT (dùng bởi gateway guard ở Phase 5).
   * Không ném lỗi — trả valid=false kèm lý do để caller tự quyết định.
   */
  async validateToken(token: string): Promise<ValidateTokenResult> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      const user = await this.userRepo.findOne({
        where: { id: payload.sub },
      });
      if (!user) {
        return { valid: false, reason: "User not found" };
      }
      return { valid: true, user: this.toAuthUser(user) };
    } catch (err) {
      return { valid: false, reason: "Invalid or expired token" };
    }
  }

  private async buildAuthResult(user: User): Promise<AuthResult> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const accessToken = await this.jwtService.signAsync(payload);
    return { user: this.toAuthUser(user), accessToken };
  }

  private toAuthUser(user: User): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }
}
