import type { RequestHandler } from "express";
import type { AuthenticatedRequest } from "@/middleware/authenticate";
import { getMcpHandler } from "@/server/mcp-handler";

export const mcpPostRoute: RequestHandler = async (_req, res) => {
	const req = _req as AuthenticatedRequest;

	const clientId = req.context?.companyId;

	if (!req.context) {
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
		const handler = getMcpHandler(req.context);
		await handler(req, res);
	} catch (error) {
		req.logger?.error("MCP POST request failed", { error, clientId });
		throw error;
	}
};

// export const mcpGetRoute = async (_req: Request, res: Response) => {
// 	res.writeHead(405).end(
// 		JSON.stringify({
// 			jsonrpc: "2.0",
// 			error: { code: -32000, message: "Method not allowed." },
// 			id: null,
// 		}),
// 	);
// };

// export const mcpDeleteRoute = async (_req: Request, res: Response) => {
// 	res.writeHead(405).end(
// 		JSON.stringify({
// 			jsonrpc: "2.0",
// 			error: { code: -32000, message: "Method not allowed." },
// 			id: null,
// 		}),
// 	);
// };
