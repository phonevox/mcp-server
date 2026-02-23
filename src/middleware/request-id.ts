import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { createLogger, type Logger } from "@/shared/logger";

export type BaseRequest = Request & {
	requestId: string;
	logger: Logger;
};

export const requestId = (req: Request, _res: Response, next: NextFunction) => {
	const r = req as BaseRequest;
	r.requestId = crypto.randomUUID();
	r.logger = createLogger(`[${r.requestId}]`);
	next();
};
