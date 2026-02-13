import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import * as z from "zod";
import type { ClientContext } from "@/context/provider";
import { ContextProvider } from "@/context/provider";
import { db } from "@/database";
import * as jwt from "@/security/jwt";
import { createLogger, type Logger } from "@/shared/logger";

const TokenPayloadSchema = z.object({
	clientId: z.uuid(),
	tokenId: z.uuid(),
});

export type AuthenticatedRequest = Request & {
	clientContext?: ClientContext;
	requestId: string;
	logger: Logger;
};

export const authMiddleware = async (_req: Request, res: Response, next: NextFunction) => {
	// @FIXME(adrian): this seems wrong. oh well
	let logger: Logger;
	const req = _req as AuthenticatedRequest;

	req.requestId = crypto.randomUUID();
	req.logger = createLogger(`[${req.requestId}]`);
	logger = req.logger; // lazy

	logger.debug("Incoming request");

	// check for auth
	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		logger.warn("Missing or invalid authorization header");

		return res.status(401).json({
			jsonrpc: "2.0",
			error: {
				code: -32000,
				message: "Missing or invalid authorization header",
			},
			id: null,
		});
	}

	// validate
	try {
		const token = authHeader.substring(7).trim();
		const decoded = jwt.verify(token);
		const tokenPayload = TokenPayloadSchema.parse(decoded);

		const dbToken = await db.Clients.findTokenById(tokenPayload.tokenId);

		if (!dbToken || !dbToken.is_active) throw new Error("Token revoked or not found");
		if (dbToken.expires_at && dbToken.expires_at < new Date()) throw new Error("Token expired");
		if (dbToken.client_id !== tokenPayload.clientId) throw new Error("Token/Client mismatch");
		await db.Clients.updateTokenLastUsed(dbToken.id);

		req.clientContext = await ContextProvider.getContext(dbToken.client_id);
		logger.debug(`Context loaded for client ${dbToken.client_id}`);

		return next();
	} catch (error) {
		req.logger.error("Authentication failed", {
			message: error instanceof Error ? error.message : "Unknown error",
		});

		return res.status(401).json({
			jsonrpc: "2.0",
			error: {
				code: -32000,
				message: "Authentication failed. Please check your credentials and try again.",
			},
			id: null,
		});
	}
};
