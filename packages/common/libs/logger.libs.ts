import chalk from "chalk";
import { WinstonModuleOptions } from "nest-winston";
import * as winston from "winston";

export const loggerFormat = (appName: string): winston.Logform.Format =>
  winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.colorize({ level: true, message: true }),
    winston.format.printf((info: winston.Logform.TransformableInfo) => {
      const colorizeAppName = chalk.blue(`[${appName}]`);
      let context = chalk.cyan(`[Application]`.padEnd(20));

      if (info?.context && typeof info?.context === "string") {
        context = chalk.cyan(`[${info?.context}]`.padEnd(20));
      }

      const error = info?.error as any;
      let errorOutput = "";
      if (error?.stack) {
        errorOutput = chalk.red(error.stack);
      }

      let metaOutput;
      if (info?.meta) {
        metaOutput = `\n${JSON.stringify(info?.meta)}`;
      } else {
        metaOutput = "";
      }

      return `${colorizeAppName} - ${info.timestamp} ${context} ${info.level}: ${info.message} ${errorOutput} ${chalk.magentaBright(metaOutput)}`;
    }),
  );

export const getLoggerTransport = (
  appName: string,
  isProduction: boolean,
): WinstonModuleOptions => ({
  transports: [
    new winston.transports.Console({
      level: isProduction ? "info" : "debug",
      format: loggerFormat(appName),
      handleExceptions: true,
    }),
  ],
});
