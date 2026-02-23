import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import type { Context } from "@/context/provider";
import { ContextProvider } from "@/context/provider";
import { db } from "@/database";
import { hashToken } from "@/security/hash";
import { createLogger, type Logger } from "@/shared/logger";

export type AuthenticatedRequest = Request & {
	context: Context | undefined;
	requestId: string;
	logger: Logger;
};

export const authenticate = async (
	_req: Request,
	res: Response,
	next: NextFunction,
	// biome-ignore lint/suspicious/noConfusingVoidType: stfu
): Promise<void | Response> => {
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
		const rawToken = authHeader.substring(7).trim();
		const token = await db.Tokens.findByHash(hashToken(rawToken));
		// logger.debug(`Token found: ${token?.id}`);

		// validating token
		if (!token || !token.is_active) throw new Error("Token revoked or not found");
		if (token.expires_at && token.expires_at < new Date()) throw new Error("Token expired");
		await db.Tokens.updateLastUsed(token.id);
		// logger.debug(`Valid token ${token.id}`);

		const ctx = await ContextProvider.getContext(token.id);
		if (!ctx) {
			logger.error(`Failed to load context for token ${token.id}`);
			throw new Error("Failed to load context");
		}
		req.context = ctx;
		req.logger = createLogger(`[${req.requestId}:${ctx.companySlug}]`);
		logger.info(
			`Authenticated request for company ${ctx.companyName} (${ctx.companySlug}), integration ${ctx.integrationType}`,
		);

		return next();
	} catch (error) {
		logger.error("Authentication failed:", {
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
