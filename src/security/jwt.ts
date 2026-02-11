import jwt from "jsonwebtoken";

if (!process.env.JWT_SECRET) {
	throw new Error("JWT_SECRET is not defined");
}

const SECRET: string = process.env.JWT_SECRET;

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
