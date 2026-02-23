import type { NextFunction, Request, Response } from "express";
import { config } from "@/config";
import type { BaseRequest } from "@/middleware/request-id";

function maskToken(authHeader: string): string {
	const token = authHeader.replace(/^Bearer\s+/i, "");
	if (token.length <= 8) return "Bearer ***";
	return `Bearer ${token.slice(0, 8)}***${token.slice(-4)}`;
}

export const logging = (req: Request, res: Response, next: NextFunction) => {
	const r = req as BaseRequest;
	const startedAt = Date.now();

	r.logger.info(`→ ${req.method} ${req.path}`);

	if (config.NODE_ENV === "development") {
		const headers = { ...req.headers };
		if (headers.authorization) {
			headers.authorization = maskToken(headers.authorization);
		}
		r.logger.debug("Headers", headers);

		if (req.body && Object.keys(req.body).length > 0) {
			r.logger.debug("Body", req.body);
		}
	}

	res.on("close", () => {
		const ms = Date.now() - startedAt;
		const status = res.statusCode;
		r.logger.info(`← ${req.method} ${req.path} ${status} ${ms}ms`);
	});

	next();
};
