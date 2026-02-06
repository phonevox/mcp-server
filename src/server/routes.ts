import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth";
import { getMcpHandler } from "./mcp-handler";
import { createLogger } from "../util/logger";

const logger = createLogger("routes");

export const mcpPostRoute = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const clientId = req.clientContext?.clientId;

  if (!req.clientContext) {
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
    const handler = getMcpHandler(req.clientContext);
    await handler(req, res);
  } catch (error) {
    req.logger?.error("MCP POST request failed", { error, clientId });
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
