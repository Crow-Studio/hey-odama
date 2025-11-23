import { OpenAPIHono } from "@hono/zod-openapi";
import { serveEmojiFavicon } from "stoker/middlewares";
import { env } from "@/env";
import { pino_logger } from "@/middlewares/pino-logger";
import type { AppBindings } from "@/types";
import { cors } from "hono/cors";

export function createRouter() {
  return new OpenAPIHono<AppBindings>({
    strict: false,
    defaultHook: (result, c) => {
      if (!result.success) {
        const firstError = result.error.issues[0];
        return c.json(
          {
            error: `Validation failed: ${firstError.message}`,
          },
          400,
        );
      }
    },
  });
}

export default function createApp() {
  const app = createRouter();

  app.use(serveEmojiFavicon("🐼"));
  app.use(pino_logger());

  // CORS configuration
  const allowedOrigins: Array<string | RegExp> =
    env.NODE_ENV === "production"
      ? [
          "https://hey-odama.onrender.com",
        ]
      : [
          "http://localhost:3000",
        ];

  app.use(
    "*",
    cors({
      origin: (origin) => {
        if (!origin) return null;

        // Check if origin matches any allowed origin
        const isAllowed = allowedOrigins.some((allowed) => {
          if (typeof allowed === "string") {
            return allowed === origin;
          }
          // RegExp for wildcard subdomains
          return allowed.test(origin);
        });

        return isAllowed ? origin : null;
      },
      credentials: true,
      allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
      exposeHeaders: ["Content-Length", "X-Request-Id"],
      maxAge: 86400, // 24 hours - cache preflight requests
    }),
  );

  // Debug middleware - only in development
  if (env.NODE_ENV === "development") {
    app.use("*", async (c, next) => {
      const cookies = c.req.header("cookie");
      const token = cookies?.match(/session=([^;]+)/)?.[1];
      console.log(
        `[${c.req.method}] ${c.req.path} - Token: ${token ? "present" : "undefined"}`,
      );
      await next();
    });
  }

  /*
   * 404 Handler
   */
  app.notFound((c) =>
    c.json(
      {
        error: "Not Found",
        message: "The requested endpoint does not exist",
        path: c.req.path,
      },
      404,
    ),
  );

  /*
   * Global error handler
   */
  app.onError((err, c) => {
    // Log error in production
    if (env.NODE_ENV === "production") {
      console.error("Error:", err);
    }

    return c.json(
      {
        error: "Internal Server Error",
        message:
          env.NODE_ENV === "production"
            ? "An unexpected error occurred"
            : err.message,
        ...(env.NODE_ENV === "development" && { stack: err.stack }),
      },
      500,
    );
  });

  return app;
}
