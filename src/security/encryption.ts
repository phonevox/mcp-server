import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

if (!process.env.ENCRYPTION_KEY) {
	throw new Error("ENCRYPTION_KEY is not defined");
}
const SECRET: string = process.env.ENCRYPTION_KEY;

const KEY: Buffer = crypto.scryptSync(SECRET, "salt", 32);

export const encrypt = (text: string | null | undefined): string | null => {
	if (!text) return null;

	const iv = crypto.randomBytes(IV_LENGTH);
	const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

	const encryptedBuffer = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);

	const authTag = cipher.getAuthTag();

	return `${iv.toString("hex")}:${authTag.toString("hex")}:${encryptedBuffer.toString("hex")}`;
};

export const decrypt = (encryptedData: string | null | undefined): string | null => {
	if (!encryptedData) return null;

	const parts = encryptedData.split(":");
	if (parts.length !== 3) {
		throw new Error("Invalid encrypted data format");
	}

	const [ivHex, authTagHex, encryptedHex] = parts as [string, string, string];

	const iv = Buffer.from(ivHex, "hex");
	const authTag = Buffer.from(authTagHex, "hex");
	const encryptedBuffer = Buffer.from(encryptedHex, "hex");

	const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
	decipher.setAuthTag(authTag);

	const decryptedBuffer = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);

	return decryptedBuffer.toString("utf8");
};
