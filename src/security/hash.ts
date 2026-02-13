import crypto from "node:crypto";

export type GenerateRandomKeyOptions = {
	prefix?: string;
	bytes?: number;
};

export function generateRandomKey(options: GenerateRandomKeyOptions = {}): {
	key: string;
	hash: string;
} {
	const { prefix = "vox_live", bytes = 32 } = options;

	const randomPart = crypto.randomBytes(bytes).toString("hex");

	const key = `${prefix}_${randomPart}`;
	const hash = hashToken(key);

	return { key, hash };
}

export function hashToken(token: string): string {
	return crypto.createHash("sha256").update(token).digest("hex");
}
