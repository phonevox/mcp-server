import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { config } from "@/config";
import { authenticate } from "@/middleware/authenticate";
import { logging } from "@/middleware/logging";
import { requestId } from "@/middleware/request-id";
import { mcpPostRoute } from "@/server/routes";

export function createApp() {
	const app = createMcpExpressApp({ allowedHosts: config.MCP_ALLOWED_HOSTS });
	app.set("trust proxy", config.EXPRESS_TRUST_PROXY);

	app.use("/mcp", requestId);
	app.use("/mcp", logging);
	app.use("/mcp", authenticate);

	app.post("/mcp", mcpPostRoute);

	return app;
}
