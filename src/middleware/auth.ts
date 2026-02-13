import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import type { ClientContext } from "@/context/provider";
import { ContextProvider } from "@/context/provider";
import { db } from "@/database";
import { hashToken } from "@/security/hash";
import { createLogger, type Logger } from "@/shared/logger";

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
		// logger.debug(`Validating token: ${token}`);
		const hash = hashToken(token);
		// logger.debug(`Token hash: ${hash}`);

		const dbToken = await db.Tokens.findByHash(hash);
		// logger.debug(`Token found: ${dbToken?.id}`);

		if (!dbToken || !dbToken.is_active) throw new Error("Token revoked or not found");
		if (dbToken.expires_at && dbToken.expires_at < new Date()) throw new Error("Token expired");

		const company = await db.CompaniesRepo.findById(dbToken.company_id);
		if (!company) throw new Error("Company not found");

		logger.info(
			`Authenticated token ${dbToken.id} for company ${dbToken.company_id} (${company.slug})`,
		);
		await db.Tokens.updateLastUsed(dbToken.id);

		req.clientContext = await ContextProvider.getContext(dbToken.company_id);
		req.logger = createLogger(`[${req.requestId}:${company.slug}]`);
		// logger.debug(`Context loaded for company ${dbToken.company_id} (${dbToken.company.slug})`);

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
