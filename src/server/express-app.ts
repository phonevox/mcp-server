import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { config } from "@/config";
import { authMiddleware } from "@/middleware/auth";
import { mcpDeleteRoute, mcpGetRoute, mcpPostRoute } from "@/server/routes";

export function createApp() {
	const app = createMcpExpressApp({ allowedHosts: config.MCP_ALLOWED_HOSTS });
	app.set("trust proxy", config.EXPRESS_TRUST_PROXY);

	// Middleware
	app.use("/mcp", authMiddleware);

	// Routes
	app.post("/mcp", mcpPostRoute);
	app.get("/mcp", mcpGetRoute);
	app.delete("/mcp", mcpDeleteRoute);

	return app;
}
