import "dotenv/config";

import { db } from "@/database";

async function main() {
	const integration = process.argv[2];

	if (!integration) {
		console.error("❌ Usage: bun decode <integration>");
		process.exit(1);
	}

	const data = await db.Integrations.findSettingsById(integration);

	if (!data) {
		console.error("❌ Integration not found.");
	}

	console.log("❇️  Integration data:\n", data);
	process.exit(0);
}

main();
