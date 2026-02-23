import type { NextFunction, Request, Response } from "express";
import type { Context } from "@/context/provider";
import { ContextProvider } from "@/context/provider";
import { db } from "@/database";
import type { BaseRequest } from "@/middleware/request-id";
import { hashToken } from "@/security/hash";
import { createLogger } from "@/shared/logger";

export type AuthenticatedRequest = BaseRequest & {
	context: Context;
};

export const authenticate = async (
	_req: Request,
	res: Response,
	next: NextFunction,
	// biome-ignore lint/suspicious/noConfusingVoidType: stfu
): Promise<void | Response> => {
	const req = _req as AuthenticatedRequest;

	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		req.logger.warn("Missing or invalid authorization header");
		return res.status(401).json({
			jsonrpc: "2.0",
			error: { code: -32000, message: "Missing or invalid authorization header" },
			id: null,
		});
	}

	try {
		const rawToken = authHeader.substring(7).trim();
		const token = await db.Tokens.findByHash(hashToken(rawToken));

		if (!token || !token.is_active) throw new Error("Token revoked or not found");
		if (token.expires_at && token.expires_at < new Date()) throw new Error("Token expired");

		await db.Tokens.updateLastUsed(token.id);

		const ctx = await ContextProvider.getContext(token.id);
		req.context = ctx;

		// Enriquece o logger com o slug da empresa a partir daqui
		req.logger = createLogger(`[${req.requestId}:${ctx.companySlug}]`);
		req.logger.info(`Authenticated: ${ctx.companyName}, integration ${ctx.integrationType}`);

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
