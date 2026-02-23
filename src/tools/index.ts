import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import type { Context } from "@/context/provider";
import type { Logger } from "@/shared/logger";
import { tools as ixcsoftTools } from "@/tools/ixcsoft";

export function registerTools(server: McpServer, context: Context, logger: Logger) {
	switch (context.integrationType) {
		case "ixcsoft": {
			for (const tool of ixcsoftTools) {
				server.registerTool(tool.name, tool.schema, (params) =>
					tool.handler({ context, logger: logger.child(tool.name) }, params),
				);
			}
			logger.debug(`Registered ${ixcsoftTools.length} ixcsoft tools`, {
				tools: ixcsoftTools.map((t) => t.name),
			});
			break;
		}

		default: {
			logger.warn(`No tools registered for integration type: ${context.integrationType}`);
			break;
		}
	}

	// misc tools — disponíveis para todos os clientes
	server.registerTool(
		"echo",
		{
			description: "Echoes back the provided message",
			inputSchema: z.object({ message: z.string() }),
			outputSchema: z.object({ echo: z.string() }),
		},
		async ({ message }) => ({
			content: [{ type: "text", text: message }],
			structuredContent: { echo: message },
		}),
	);
}
