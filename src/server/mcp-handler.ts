import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { Response } from "express";
import type { AuthenticatedRequest } from "@/middleware/authenticate";
import { registerTools } from "@/tools";

function parseMcpMethod(body: Record<string, unknown>): string {
	const method = typeof body.method === "string" ? body.method : "unknown";

	if (method === "tools/call" && body.params && typeof body.params === "object") {
		const name = (body.params as Record<string, unknown>).name;
		if (typeof name === "string") return `tools/call:${name}`;
	}

	return method;
}

export async function mcpHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
	const { context, logger } = req;

	const server = new McpServer(
		{ name: `mcp-${context.companySlug}`, version: "1.0.0" },
		{ capabilities: { logging: {} } },
	);

	registerTools(server, context, logger);

	try {
		const transport = new StreamableHTTPServerTransport({
			sessionIdGenerator: undefined,
		});

		await server.connect(transport);

		const method = parseMcpMethod(req.body);
		logger.info(method);

		await transport.handleRequest(req, res, req.body);

		res.on("close", () => {
			transport.close();
			server.close();
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		logger.error(`Error handling MCP request: ${message}`, { error });

		if (!res.headersSent) {
			res.status(500).json({
				jsonrpc: "2.0",
				error: { code: -32603, message: "Internal server error" },
				id: null,
			});
		}
	}
}
