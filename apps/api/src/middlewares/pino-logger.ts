import { pinoLogger } from "hono-pino";
import pino from "pino";
import pretty from "pino-pretty";
import { env } from "@/env";
import { generateNanoId } from "@repo/db/schema/utils";
import path from "path";

export function pino_logger() {
  console.log("Pino Logger initialized with level:", env.LOG_LEVEL);

  const productionConfig = {
    level: env.LOG_LEVEL || "info",
    formatters: {
      level: (label: string) => {
        return { level: label };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    sync: false,
  };

  const developmentStream = pretty({
    colorize: true,
    translateTime: "HH:MM:ss Z",
    ignore: "pid,hostname",
  });

  // Automatic file output with daily rotation
  const fileStream = pino.destination({
    dest: path.join(
      process.cwd(),
      "logs",
      `app-${new Date().toISOString().split("T")[0]}.log`,
    ),
    sync: false,
    mkdir: true,
  });

  const streams = [
    {
      level: env.LOG_LEVEL || "info",
      stream:
        env.NODE_ENV === "production" ? process.stdout : developmentStream,
    },
    {
      level: env.LOG_LEVEL || "info",
      stream: fileStream,
    },
  ];

  return pinoLogger({
    pino: pino(productionConfig, pino.multistream(streams)),
    http: {
      reqId: () => generateNanoId(),
    },
  });
}
