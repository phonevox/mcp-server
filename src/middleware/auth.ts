import type { Request, Response, NextFunction, RequestHandler } from "express";
import { ContextProvider } from "@/context/provider";
import type { ClientContext } from "@/context/types";
import { createLogger } from "@/shared/logger";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import type { AuthTokenPayload } from "@/middleware/auth.types";
import type { LoggerLike } from "@/shared/logger";

const logger = createLogger("auth");

const SECRET = process.env.JWT_AUTH_SECRET!;

export interface AuthenticatedRequest extends Request {
  clientContext?: ClientContext;
  requestId: string;
  logger?: LoggerLike;
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
    const clientId = decodeClientId(token);

    authReq.clientContext = ContextProvider.getContext(clientId);
    authReq.logger.debug(`Client context loaded for client: ${clientId}`);

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

export function decodeClientId(token: string): string {
  try {
    const payload = jwt.verify(token, SECRET) as AuthTokenPayload;

    if (!payload.clientId) {
      throw new Error("Missing clientId");
    }

    return payload.clientId;
  } catch (err) {
    throw new Error("Invalid or expired token");
  }
}

export function generateToken(clientId: string): string {
  return jwt.sign({ clientId }, SECRET, {
    algorithm: "HS256",
    // expiresIn: "24h",
  });
}
