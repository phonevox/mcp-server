import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { Response } from "express";
import type { ClientContext } from "../context/types";
import { registerTools } from "../tools";
import type { AuthenticatedRequest } from "../middleware/auth";
import { logger } from "../util/logger";

// source: https://github.com/modelcontextprotocol/typescript-sdk/blob/v1.x/src/examples/server/simpleStatelessStreamableHttp.ts

export function getMcpHandler(context: ClientContext) {

  return async (req: AuthenticatedRequest, res: Response) => {
    req.logger?.debug("Creating MCP server instance");
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
    req.logger?.debug("Registering tools");
    registerTools(server, context, req.requestId);

    try {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });

      // req.logger?.debug("Connecting transport");
      await server.connect(transport);

      req.logger?.debug('Handling request', { body: req.body });
      req.logger?.info(`${req.body.method}/${req.body.params.name}`);
      await transport.handleRequest(req, res, req.body);

      res.on("close", () => {
        req.logger?.info('Request closed, cleaning up');
        transport.close();
        server.close();
      });
    } catch (error) {
      req.logger?.error("Error handling MCP request", { error });
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
