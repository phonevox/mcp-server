#!/usr/bin/env bun

import "dotenv/config";
import { config } from "@/config";
import { createApp } from "@/server/express-app";
import { createLogger } from "@/shared/logger";

const logger = createLogger("app");

async function bootstrap() {
	const app = createApp();
	app.listen(config.port, () => {
		logger.info(`MCP Server running at port ${config.port} (env: ${config.nodeEnv})`);
	});
}

bootstrap().catch((err) => {
	logger.error(`Fatal: ${err?.message}`, err);
	process.exit(1);
});
