import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { Request, Response } from "express";
import type { ClientContext } from "../context/types";
import { registerTools } from "../tools";
import { createLogger } from "../util/logger";

export function getMcpHandler(context: ClientContext) {
  const logger = createLogger(`mcp:${context.clientId}`);

  return async (req: Request, res: Response) => {
    logger.info("Creating MCP server instance");
    const server = new McpServer(
      {
        name: `MCP-${context.clientId}`,
        version: "1.0.0",
      },
      {
        capabilities: {
          logging: {},
        },
      },
    );

    // Registrar tools com o contexto do cliente
    logger.debug("Registering tools");
    registerTools(server, context);

    try {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });

      logger.debug("Connecting transport");
      await server.connect(transport);

      logger.debug('Handling request');
      await transport.handleRequest(req, res, req.body);

      res.on("close", () => {
        logger.debug('Request closed, cleaning up');
        transport.close();
        server.close();
      });
    } catch (error) {
      logger.error("Error handling MCP request", { error });
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  };
}
