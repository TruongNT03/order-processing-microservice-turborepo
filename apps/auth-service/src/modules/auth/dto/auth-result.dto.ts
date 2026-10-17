import { UserRole } from "../../../entities/user.entity";

/** Thông tin user trả về cho client (không chứa passwordHash). */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

/** Payload nhúng trong JWT. */
export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

/** Kết quả register/login: user + access token. */
export interface AuthResult {
  user: AuthUser;
  accessToken: string;
}

/** Kết quả validate token (dùng bởi gateway guard ở Phase 5). */
export interface ValidateTokenResult {
  valid: boolean;
  user?: AuthUser;
  reason?: string;
}
