import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { config } from "@/config";
import { authenticate } from "@/middleware/authenticate";
import { mcpPostRoute } from "@/server/routes";

export function createApp() {
	const app = createMcpExpressApp({ allowedHosts: config.MCP_ALLOWED_HOSTS });
	app.set("trust proxy", config.EXPRESS_TRUST_PROXY);

	// Middleware
	app.use("/mcp", authenticate);

	// Routes
	app.post("/mcp", mcpPostRoute);
	// app.get("/mcp", mcpGetRoute);
	// app.delete("/mcp", mcpDeleteRoute);

	return app;
}
