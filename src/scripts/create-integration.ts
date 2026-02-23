import "dotenv/config";
import { prisma } from "@/database/prisma";
import { encrypt } from "@/security/encryption";
import { IntegrationType } from "../../generated/prisma/client";

// bun create-integration ixcsoft <companyId> <baseUrl> <token>
// bun create-integration tsmxsgp <companyId> <baseUrl> <app> <token>

const USAGE = {
	ixcsoft: "bun create-integration ixcsoft <companyId> <baseUrl> <token>",
	tsmxsgp: "bun create-integration tsmxsgp <companyId> <baseUrl> <app> <token>",
};

async function main() {
	const type = process.argv[2] as IntegrationType;
	const companyId = process.argv[3];

	if (!type || !companyId) {
		console.error(`❌ Usage:\n  ${Object.values(USAGE).join("\n  ")}`);
		process.exit(1);
	}

	if (!Object.values(IntegrationType).includes(type)) {
		console.error(`❌ Invalid type. Available: ${Object.values(IntegrationType).join(", ")}`);
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

	const existing = await prisma.integration.findUnique({
		where: { company_id_type: { company_id: companyId, type } },
	});

	if (existing) {
		console.error(`❌ Integration of type "${type}" already exists for this company.`);
		process.exit(1);
	}

	try {
		if (type === IntegrationType.ixcsoft) {
			const baseUrl = process.argv[4];
			const token = process.argv[5];

			if (!baseUrl || !token) {
				console.error(`❌ Usage: ${USAGE.ixcsoft}`);
				process.exit(1);
			}

			const integration = await prisma.integration.create({
				data: {
					company_id: companyId,
					type,
					ixcConfig: {
						create: {
							base_url: encrypt(baseUrl) as string,
							token: encrypt(token) as string,
						},
					},
				},
			});

			console.log("✅ IXCSoft integration created successfully!\n");
			console.log(`👤 ${company.name} (${company.id})`);
			console.log(`🧩 Type : ${integration.type}`);
			console.log(`🆔 ID   : ${integration.id}\n`);
		}

		if (type === IntegrationType.tsmxsgp) {
			const baseUrl = process.argv[4];
			const app = process.argv[5];
			const token = process.argv[6];

			if (!baseUrl || !app || !token) {
				console.error(`❌ Usage: ${USAGE.tsmxsgp}`);
				process.exit(1);
			}

			const integration = await prisma.integration.create({
				data: {
					company_id: companyId,
					type,
					sgpConfig: {
						create: {
							base_url: encrypt(baseUrl) as string,
							app: encrypt(app) as string,
							token: encrypt(token) as string,
						},
					},
				},
			});

			console.log("✅ TSMx SGP integration created successfully!\n");
			console.log(`👤 ${company.name} (${company.id})`);
			console.log(`🧩 Type : ${integration.type}`);
			console.log(`🆔 ID   : ${integration.id}\n`);
		}
	} catch (error) {
		console.error("❌ Failed to create integration:", error);
		process.exit(1);
	}
}

main();
