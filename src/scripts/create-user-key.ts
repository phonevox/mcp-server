import "dotenv/config";
import { db } from "@/database";
import { generateRandomKey } from "@/security/hash";

async function main() {
	const companyId = process.argv[2];

	if (!companyId) {
		console.error("❌ Usage: bun create-user-key <companyId>");
		process.exit(1);
	}

	console.log(`\n🔍 Checking if client exists: ${companyId}...\n`);

	const client = await db.CompaniesRepo.findById(companyId);

	if (!client) {
		console.error("❌ Client not found.");
		process.exit(1);
	}

	if (!client.is_active) {
		console.error("❌ Client exists but is inactive.");
		process.exit(1);
	}

	console.log("✅ Client found.\n");

	const { key, hash } = generateRandomKey();

	try {
		const token = await db.Tokens.create({
			companyId,
			hash,
		});

		console.log(`✅ Token created successfully! (${token.id})`);

		console.log(`\n👤 ${client.name} (${client.id})`);
		console.log(`🔑 ${key}`);

		console.log("\n⚠️  This key will not be shown again.\n");
	} catch (error) {
		console.error("❌ Failed to create token:", error);
		process.exit(1);
	}
}

main();
