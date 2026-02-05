import type { Request, Response, NextFunction } from "express";
import { ContextProvider } from "../context/provider";
import type { ClientContext } from "../context/types";
import { createLogger } from "../util/logger";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import type { AuthTokenPayload } from "./auth.types";

const logger = createLogger("auth");

const SECRET = process.env.JWT_AUTH_SECRET!;

export interface AuthenticatedRequest extends Request {
  clientContext?: ClientContext;
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  logger.debug(
    "Incoming request",
    {
      method: req.method,
      path: req.path,
      hasAuth: !!authHeader,
    }
  );

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    logger.warn("Missing or invalid authorization header",
      {
        method: req.method,
        path: req.path,
      }
    );

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

    logger.info("Client authenticated", { clientId });

    req.clientContext = ContextProvider.getContext(clientId);

    logger.debug("Client context loaded", { clientId, hasIxcsoft: !!req.clientContext.ixcsoft });

    next();
  } catch (error) {
    logger.error("Authentication failed", { error });
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
