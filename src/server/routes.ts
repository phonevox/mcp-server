import type { Request, RequestHandler, Response } from "express";
import type { AuthenticatedRequest } from "@/middleware/auth";
import { getMcpHandler } from "@/server/mcp-handler";
import { createLogger } from "@/shared/logger";

const logger = createLogger("routes");

export const mcpPostRoute: RequestHandler = async (req, res) => {
  const authReq = req as AuthenticatedRequest;

  const clientId = authReq.clientContext?.clientId;

  if (!authReq.clientContext) {
    return res.status(401).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Authentication required",
      },
      id: null,
    });
  }

  try {
    const handler = getMcpHandler(authReq.clientContext);
    await handler(authReq, res);
  } catch (error) {
    authReq.logger?.error("MCP POST request failed", { error, clientId });
    throw error;
  }
};

export const mcpGetRoute = async (req: Request, res: Response) => {
  res.writeHead(405).end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method not allowed." },
      id: null,
    }),
  );
};

export const mcpDeleteRoute = async (req: Request, res: Response) => {
  res.writeHead(405).end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method not allowed." },
      id: null,
    }),
  );
};
