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

const logger = createLogger("contextprovider");

const cache = new LRUCache<string, Context>({
	max: 5000,
	ttl: config.CONTEXT_CACHE_TTL,
});

async function loadFromDatabase(tokenId: string): Promise<Context | undefined> {
	// Valida o token primeiro — os demais dependem dele
	const token = await db.Tokens.findById(tokenId);

	if (!token || !token.is_active) {
		logger.debug(`loadFromDatabase: Token not found or inactive -> ${tokenId}`);
		return undefined;
	}

	if (token.expires_at && token.expires_at < new Date()) {
		logger.debug(`loadFromDatabase: Token expired -> ${tokenId}`);
		return undefined;
	}

	// Company e integration são independentes entre si — busca em paralelo
	const [company, integration] = await Promise.all([
		db.Companies.findById(token.company_id),
		db.Integrations.findById(token.integration_id),
	]);

	if (!company || !company.is_active) {
		logger.debug(`loadFromDatabase: Company not found or inactive -> ${tokenId}`);
		return undefined;
	}

	if (!integration || !integration.is_active) {
		logger.debug(`loadFromDatabase: Integration not found or inactive -> ${tokenId}`);
		return undefined;
	}

	// Garante que o token não aponta para uma integration de outra empresa
	if (integration.company_id !== company.id) {
		logger.debug(
			`loadFromDatabase: Integration ${integration.id} does not belong to company ${company.id} -> ${tokenId}`,
		);
		return undefined;
	}

	logger.debug(
		`loadFromDatabase: Successfully loaded context for token ${tokenId}: "${company.name}" (${company.slug}), integration ${integration.type}`,
	);

	return {
		companyId: company.id,
		companyName: company.name,
		companySlug: company.slug,
		integrationId: integration.id,
		integrationType: integration.type,
	};
}

export const ContextProvider = {
	async getContext(tokenId: string): Promise<Context | undefined> {
		const cached = cache.get(tokenId);

		if (cached) {
			logger.debug(`getContext: ${tokenId} (hit)`);
			return cached;
		}

		try {
			const context = await loadFromDatabase(tokenId);

			if (!context) {
				logger.debug(`getContext: Failed to load context for token ${tokenId}`);
				return undefined;
			}

			cache.set(tokenId, context);
			logger.debug(`getContext: ${tokenId} (miss)`);
			return context;
		} catch (error) {
			logger.error(`getContext: Error loading context for token ${tokenId}: ${error}`);
			return undefined;
		}
	},

	invalidate(tokenId: string) {
		cache.delete(tokenId);
	},
};
