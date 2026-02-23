import { LRUCache } from "lru-cache";
import { config } from "@/config";
import { db } from "@/database";
import type { Integration } from "@/database/types";
import { createLogger } from "@/shared/logger";

export type Context = {
	companyId: string;
	companyName: string;
	companySlug: string;
	integrationId: string;
	integrationType: Integration["type"];
};

const logger = createLogger("context.provider:cache");

const cache = new LRUCache<string, Context>({
	max: 5000,
	ttl: config.CONTEXT_CACHE_TTL,
});

async function buildContext(tokenId: string): Promise<Context> {
	const token = await db.Tokens.findById(tokenId);
	if (!token) throw new Error(`Token not found: ${tokenId}`);

	const [company, integration] = await Promise.all([
		db.Companies.findById(token.company_id),
		db.Integrations.findById(token.integration_id),
	]);

	if (!company) throw new Error(`Company not found for token: ${tokenId}`);
	if (!integration) throw new Error(`Integration not found for token: ${tokenId}`);

	if (integration.company_id !== company.id) {
		throw new Error(`Integration ${integration.id} does not belong to company ${company.id}`);
	}

	return {
		companyId: company.id,
		companyName: company.name,
		companySlug: company.slug,
		integrationId: integration.id,
		integrationType: integration.type,
	};
}

export const ContextProvider = {
	async getContext(tokenId: string): Promise<Context> {
		const cached = cache.get(tokenId);

		if (cached) {
			logger.debug(`getContext: ${tokenId} (hit)`);
			return cached;
		}

		logger.debug(`getContext: ${tokenId} (miss)`);
		const context = await buildContext(tokenId);
		cache.set(tokenId, context);
		return context;
	},

	invalidate(tokenId: string) {
		cache.delete(tokenId);
	},
};
