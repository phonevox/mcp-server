import "dotenv/config";
import { prisma } from "@/database/prisma";
import { generateRandomKey } from "@/security/hash";

// bun create-token <companyId> <integrationId> [description]

async function main() {
	const companyId = process.argv[2];
	const integrationId = process.argv[3];
	const description = process.argv[4];

	if (!companyId || !integrationId) {
		console.error("❌ Usage: bun create-token <companyId> <integrationId> [description]");
		process.exit(1);
	}

	console.log(`\n🔍 Checking if company exists: ${companyId}...\n`);

	const company = await prisma.companies.findUnique({ where: { id: companyId } });

	if (!company) {
		console.error("❌ Company not found.");
		process.exit(1);
	}

	if (!company.is_active) {
		console.error("❌ Company exists but is inactive.");
		process.exit(1);
	}

	const integration = await prisma.integration.findUnique({
		where: { id: integrationId },
	});

	if (!integration) {
		console.error("❌ Integration not found.");
		process.exit(1);
	}

	if (integration.company_id !== companyId) {
		console.error("❌ Integration does not belong to this company.");
		process.exit(1);
	}

	if (!integration.is_active) {
		console.error("❌ Integration exists but is inactive.");
		process.exit(1);
	}

	const { key, hash } = generateRandomKey();

	try {
		const token = await prisma.companyToken.create({
			data: {
				company_id: companyId,
				integration_id: integrationId,
				token_hash: hash,
				description: description ?? null,
			},
		});

		console.log("✅ Token created successfully!\n");
		console.log(`👤 ${company.name} (${company.id})`);
		console.log(`🧩 Type      : ${integration.type}`);
		console.log(`🆔 Token ID  : ${token.id}`);
		console.log(`🔑 ${key}`);
		console.log("\n⚠️  This key will not be shown again.\n");
	} catch (error) {
		console.error("❌ Failed to create token:", error);
		process.exit(1);
	}
}

main();
