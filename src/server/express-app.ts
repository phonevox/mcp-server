import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { authMiddleware } from "@/middleware/auth";
import { mcpPostRoute, mcpGetRoute, mcpDeleteRoute } from "@/server/routes";

const ALLOWED_HOSTS = process.env.MCP_ALLOWED_HOSTS?.toString().split(",") || ["*"];

export function createApp() {
  const app = createMcpExpressApp({ allowedHosts: ALLOWED_HOSTS});
  app.set("trust proxy", process.env.EXPRESS_TRUST_PROXY === "true");

  // Middleware
  app.use('/mcp', authMiddleware);

  // Routes
  app.post("/mcp", mcpPostRoute);
  app.get("/mcp", mcpGetRoute);
  app.delete("/mcp", mcpDeleteRoute);

  return app;
}