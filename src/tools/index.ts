import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ClientContext } from "../context/types";
import * as z from "zod/v4";
import { tools as ixcsoftTools} from "./ixcsoft";
import { createLogger } from "../util/logger";

export function registerTools(server: McpServer, context: ClientContext, requestId: string) {
  const logger = createLogger(`${requestId}.registerTools`);

  if (context.ixcsoft) {
    ixcsoftTools.forEach(tool => {
      server.registerTool(
        tool.name, 
        tool.schema,
        (params) => tool.handler({ requestId }, context, params)
      );
    });
    logger.debug(`[ixcsoftTools] Registered ${ixcsoftTools.length} tools`, { tools: ixcsoftTools.map(t => t.name) });
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
    })
  );
}