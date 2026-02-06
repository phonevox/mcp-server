import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { authMiddleware } from "../middleware/auth";
import { mcpPostRoute, mcpGetRoute, mcpDeleteRoute } from "./routes";

export function createApp() {
  const app = createMcpExpressApp();
  app.set("trust proxy", true);

  // Middleware
  app.use('/mcp', authMiddleware);

  // Routes
  app.post("/mcp", mcpPostRoute);
  app.get("/mcp", mcpGetRoute);
  app.delete("/mcp", mcpDeleteRoute);

  return app;
}