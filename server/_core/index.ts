import express from "express";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { registerOAuthRoutes } from "./oauth";
import { createContext } from "./context";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  const staticPath = path.resolve(__dirname, "public");

  app.use(express.json({ limit: "1mb" }));
  app.use(cookieMiddleware);
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({ router: appRouter, createContext })
  );
  app.use(express.static(staticPath));
  app.get("*", (_req, res) =>
    res.sendFile(path.join(staticPath, "index.html"))
  );

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
