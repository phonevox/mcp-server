#!/usr/bin/env bun

import "dotenv/config";
import { config } from "@/config";
import { createApp } from "@/server/express-app";
import { createLogger } from "@/shared/logger";

const logger = createLogger("app");
const app = createApp();

app.listen(config.port, () => {
	logger.info(`🚀 MCP-Server running at port ${config.port} (env: ${config.nodeEnv})`);
});

process.on("SIGINT", async () => {
	logger.info("🛑 SIGINT received, shutting down gracefully...");
	process.exit(0);
});

process.on("SIGTERM", async () => {
	logger.info("🛑 SIGTERM received, shutting down gracefully...");
	process.exit(0);
});

process.on("uncaughtException", (error) => {
	logger.error("💥 Uncaught Exception", { error });
	process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
	logger.error("💥 Unhandled Rejection", { reason, promise });
	process.exit(1);
});
