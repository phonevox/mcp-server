import crypto from "node:crypto";
import type { Request, RequestHandler } from "express";
import { ContextProvider } from "@/context/provider";
import type { ClientContext } from "@/context/types";
import type { AuthTokenPayload } from "@/middleware/auth.types";
import * as jwt from "@/security/jwt";
import { createLogger, type Logger } from "@/shared/logger";

export interface AuthenticatedRequest extends Request {
	clientContext?: ClientContext;
	requestId: string;
	logger?: Logger;
}

export const authMiddleware: RequestHandler = (req, res, next) => {
	const authReq = req as AuthenticatedRequest;

	authReq.requestId = crypto.randomUUID();
	authReq.logger = createLogger(`[${authReq.requestId}]`);

	const authHeader = authReq.headers.authorization;

	authReq.logger.debug("Incoming request");

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		authReq.logger.warn("Missing or invalid authorization header", {
			method: authReq.method,
			path: authReq.path,
		});

		return res.status(401).json({
			jsonrpc: "2.0",
			error: {
				code: -32000,
				message: "Missing or invalid authorization header",
			},
			id: null,
		});
	}

	try {
		const token = authHeader.substring(7);

		const payload = jwt.verify<AuthTokenPayload>(token);

		if (!payload.clientId) {
			throw new Error("Missing clientId");
		}

		authReq.clientContext = ContextProvider.getContext(payload.clientId);

		authReq.logger.debug(`Client context loaded for client: ${payload.clientId}`);

		next();
	} catch (error) {
		authReq.logger.error("Authentication failed", { error });

		return res.status(401).json({
			jsonrpc: "2.0",
			error: {
				code: -32000,
				message: "Invalid authentication token",
			},
			id: null,
		});
	}
};
