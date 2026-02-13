import "dotenv/config";
import { generateRandomKey } from "@/security/hash";

function main() {
	const { key, hash } = generateRandomKey();

	console.log(`\n🔑 Key : ${key}`);
	console.log(`🔐 Hash: ${hash}`);

	console.log("\n⚠️  This key will not be shown again.\n");
}

main();
