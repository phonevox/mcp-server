import "dotenv/config";
import { prisma } from "@/database/prisma";

async function main() {
	const name = process.argv[2];
	const slug = process.argv[3];

	if (!name || !slug) {
		console.error("❌ Usage: bun create-client <name> <slug>");
		process.exit(1);
	}

	console.log(`\n🔍 Checking if slug "${slug}" is already taken...\n`);

	const existing = await prisma.companies.findUnique({ where: { slug } });

	if (existing) {
		console.error("❌ Slug already in use.");
		process.exit(1);
	}

	try {
		const company = await prisma.companies.create({
			data: { name, slug },
		});

		console.log("✅ Client created successfully!\n");
		console.log(`👤 ${company.name}`);
		console.log(`🆔 ${company.id}`);
		console.log(`🔗 ${company.slug}\n`);
	} catch (error) {
		console.error("❌ Failed to create client:", error);
		process.exit(1);
	}
}

main();
