import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import type { Context } from "@/context/provider";
import { ContextProvider } from "@/context/provider";
import { db } from "@/database";
import { hashToken } from "@/security/hash";
import { createLogger, type Logger } from "@/shared/logger";

export type AuthenticatedRequest = Request & {
	context: Context;
	requestId: string;
	logger: Logger;
};

export const authenticate = async (
	_req: Request,
	res: Response,
	next: NextFunction,
	// biome-ignore lint/suspicious/noConfusingVoidType: stfu
): Promise<void | Response> => {
	const req = _req as AuthenticatedRequest;
	req.requestId = crypto.randomUUID();
	req.logger = createLogger(`[${req.requestId}]`);

	req.logger.info(`Incoming request: ${req.method} ${req.url}`);
	req.logger.debug(`Headers: ${JSON.stringify(req.headers)}`);
	req.logger.debug(`Query: ${JSON.stringify(req.query)}`);
	req.logger.debug(`Body: ${JSON.stringify(req.body)}`);
	req.logger.debug(`Cookies: ${JSON.stringify(req.cookies)}`);
	req.logger.debug(`Params: ${JSON.stringify(req.params)}`);
	req.logger.debug(`IP: ${req.ip}`);

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
		req.logger = createLogger(`[${req.requestId}:${ctx.companySlug}]`);
		req.logger.info(
			`Authenticated: ${ctx.companyName} (${ctx.companySlug}), integration ${ctx.integrationType}`,
		);

		return next();
	} catch (error) {
		req.logger.error("Authentication failed:", {
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
