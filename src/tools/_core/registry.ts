import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Context } from "@/context/provider";
import type { Logger } from "@/shared/logger";
import type { ToolDefinition } from "./tool";

export type ToolRegistry = {
	tools: ToolDefinition[];
};

export function registerToolsFromRegistry(
	server: McpServer,
	registry: ToolRegistry,
	context: Context,
	logger: Logger,
): void {
	for (const tool of registry.tools) {
		server.registerTool(tool.name, tool.schema, (params) =>
			tool.handler({ context, logger: logger.child(tool.name) }, params),
		);
	}

	logger.debug(`Registered ${registry.tools.length} tools`, {
		tools: registry.tools.map((t) => t.name),
	});
}
