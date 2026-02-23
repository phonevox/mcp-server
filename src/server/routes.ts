import type { RequestHandler } from "express";
import type { AuthenticatedRequest } from "@/middleware/authenticate";
import { mcpHandler } from "@/server/mcp-handler";

export const mcpPostRoute: RequestHandler = (req, res) => {
	return mcpHandler(req as AuthenticatedRequest, res);
};
