import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Context } from "@/context/provider";
import type { Logger } from "@/shared/logger";
import { registerToolsFromRegistry, type ToolRegistry } from "@/tools/_core/registry";
import { miscRegistry } from "@/tools/_misc";
import { registry as ixcsoftRegistry } from "./ixcsoft";

const integrationRegistries: Partial<Record<string, ToolRegistry>> = {
	ixcsoft: ixcsoftRegistry,
	// novaIntegracao: novaIntegracaoRegistry,
};

export function registerTools(server: McpServer, context: Context, logger: Logger): void {
	const registry = integrationRegistries[context.integrationType];

	if (registry) {
		registerToolsFromRegistry(server, registry, context, logger);
	} else {
		logger.warn(`No tools registered for integration type: ${context.integrationType}`);
	}

	registerToolsFromRegistry(server, miscRegistry, context, logger);
}
