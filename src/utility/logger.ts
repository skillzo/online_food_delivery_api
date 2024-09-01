// logger.js
import morgan from "morgan";
import { createLogger, format, transports } from "winston";

const { combine, timestamp, label, printf } = format;
const myFormat = printf(({ level, message, label, timestamp }: any) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    myFormat
  ),
  transports: [new transports.Console()],
});

const requestLogger = morgan(
  ":method :url :status :response-time ms - :res[content-length]", // Log format
  {
    stream: {
      write: (message: string) => logger.error(message.trim()),
    },
  }
);

export { requestLogger };
