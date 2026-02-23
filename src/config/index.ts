export const config = {
	NODE_ENV: process.env.NODE_ENV || "development",
	IS_PROD: process.env.NODE_ENV === "production",

	EXPRESS_PORT: parseInt(process.env.EXPRESS_PORT || "3000", 10),
	EXPRESS_TRUST_PROXY: process.env.EXPRESS_TRUST_PROXY === "true" || true,

	ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || null,
	JWT_SECRET: process.env.JWT_SECRET || null,

	MCP_ALLOWED_HOSTS: process.env.MCP_ALLOWED_HOSTS?.toString().split(",") || ["*"],

	DATABASE_URL: process.env.DATABASE_URL || undefined,

	CONTEXT_CACHE_TTL: 60_000,
	DB_TOKEN_CACHE_TTL: 60_000,
	DB_COMPANY_CACHE_TTL: 60_000,
	DB_INTEGRATION_CACHE_TTL: 60_000,
} as const;
