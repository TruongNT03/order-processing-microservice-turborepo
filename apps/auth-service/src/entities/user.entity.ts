import { Column, Entity, Index } from "typeorm";
import { BaseEntity } from "@repo/database";

export const TableName = "users";

export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
}

/**
 * Tài khoản người dùng. Mật khẩu chỉ lưu dưới dạng hash (bcrypt),
 * không bao giờ lưu plaintext. Email là duy nhất.
 */
@Entity(TableName)
@Index(["email"], { unique: true })
export class User extends BaseEntity {
  @Column({ type: "varchar", length: 255, unique: true })
  email: string;

  @Column({ type: "varchar", length: 255 })
  passwordHash: string;

  @Column({ type: "varchar", length: 100 })
  name: string;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;
}
