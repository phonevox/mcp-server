import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import type { ClientContext } from "@/context/types";
import { createLogger } from "@/shared/logger";
import { tools as ixcsoftTools } from "@/tools/ixcsoft";

export function registerTools(server: McpServer, context: ClientContext, requestId: string) {
	const logger = createLogger(`${requestId}.registerTools`);

	if (context.ixcsoft) {
		ixcsoftTools.forEach((tool) => {
			server.registerTool(tool.name, tool.schema, (params) =>
				tool.handler({ requestId }, context, params),
			);
		});
		logger.debug(`[ixcsoftTools] Registered ${ixcsoftTools.length} tools`, {
			tools: ixcsoftTools.map((t) => t.name),
		});
	}

	// misc tools
	server.registerTool(
		"echo",
		{
			description: "Echoes back the provided message",
			inputSchema: z.object({
				message: z.string(),
			}),
			outputSchema: z.object({
				echo: z.string(),
			}),
		},
		async ({ message }) => ({
			content: [{ type: "text", text: message }],
			structuredContent: { echo: message },
		}),
	);
}
