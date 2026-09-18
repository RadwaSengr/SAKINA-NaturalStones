import express from "express";
import { createServer } from "node:http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { registerOAuthRoutes } from "./_core/oauth";
import { setupVite, serveStatic } from "./_core/vite";

function cookieMiddleware(
  req: express.Request,
  _res: express.Response,
  next: express.NextFunction
) {
  const cookies: Record<string, string> = {};
  for (const pair of (req.headers.cookie ?? "").split(";")) {
    const index = pair.indexOf("=");
    if (index === -1) continue;
    const key = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
  }
  (req as express.Request & { cookies: Record<string, string> }).cookies =
    cookies;
  next();
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieMiddleware);
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({ router: appRouter, createContext })
  );

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT ?? 3000);
  server.listen(port, "0.0.0.0", () => {
    console.log(`SAKINA server running at http://localhost:${port}`);
    console.log(`Open in browser: http://127.0.0.1:${port}`);
  });
}

startServer().catch(error => {
  console.error("Failed to start SAKINA server", error);
  process.exitCode = 1;
});
