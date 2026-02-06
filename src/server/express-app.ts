import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { authMiddleware } from "../middleware/auth";
import { mcpPostRoute, mcpGetRoute, mcpDeleteRoute } from "./routes";
import { config } from "../config";

function resolveAllowedHosts(): string[] {
  if (config.nodeEnv !== "production") return ["*"];

  const raw = process.env.MCP_ALLOWED_HOSTS;
  if (!raw) {
    throw new Error("MCP_ALLOWED_HOSTS must be set in production");
  }

  const hosts = raw.split(",").map(h => h.trim()).filter(Boolean);
  if (!hosts.length) {
    throw new Error("MCP_ALLOWED_HOSTS is empty in production");
  }

  return hosts;
}

export function createApp() {
  const app = createMcpExpressApp({ allowedHosts: resolveAllowedHosts() });

  // Middleware
  app.use('/mcp', authMiddleware);

  // Routes
  app.post("/mcp", mcpPostRoute);
  app.get("/mcp", mcpGetRoute);
  app.delete("/mcp", mcpDeleteRoute);

  return app;
}