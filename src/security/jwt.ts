import jwt from "jsonwebtoken";
import { config } from "@/config";

if (!config.JWT_SECRET) {
	throw new Error("JWT_SECRET is not defined");
}

const SECRET = Buffer.from(config.JWT_SECRET);

export function verify<T>(token: string): T {
	try {
		return jwt.verify(token, SECRET) as T;
	} catch {
		throw new Error("Invalid or expired token");
	}
}

export function sign<T extends object>(payload: T, options?: jwt.SignOptions): string {
	return jwt.sign(payload, SECRET, {
		algorithm: "HS256",
		...options,
	});
}
