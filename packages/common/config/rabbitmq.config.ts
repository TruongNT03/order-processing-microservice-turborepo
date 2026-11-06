import { registerAs } from "@nestjs/config";

export const rabbitmqConfiguration = registerAs("rabbitmqConfig", () => ({
  host: process.env.RABBITMQ_HOST || "localhost",
  port: +process.env.RABBITMQ_PORT || 5673,
  user: process.env.RABBITMQ_USER || "admin",
  password: process.env.RABBITMQ_PASS || "admin123",
}));
