import { config } from "@/config";
import { db } from "@/database";
import type { Integration } from "@/database/types";
import { createLogger } from "@/shared/logger";

// @TODO(adrian)
// cache with lru-cache instead

export type Context = {
	companyId: string;
	companyName: string;
	companySlug: string;
	integrationId: string;
	integrationType: Integration["type"];
};

type CacheEntry = {
	context: Context;
	loadedAt: number;
};

const logger = createLogger("contextprovider");

// o trabalho do contextprovider é validar se
// - o token utilizado

// biome-ignore lint/complexity/noStaticOnlyClass: yo shut up https://tenor.com/bu4sg.gif
export class ContextProvider {
	private static cache = new Map<string, CacheEntry>();
	private static TTL = config.CONTEXT_CACHE_TTL;

	// static async getContext(tokenId: string): Promise<ClientContext> {
	// 	const cached = ContextProvider.cache.get(tokenId);

	// 	if (cached && Date.now() - cached.loadedAt < ContextProvider.TTL) {
	// 		logger?.debug(`Loaded ${tokenId}`);
	// 		return cached.context;
	// 	}

	// 	const context = await ContextProvider.loadFromDatabase(tokenId);

	// 	ContextProvider.cache.set(tokenId, {
	// 		context,
	// 		loadedAt: Date.now(),
	// 	});

	// 	logger?.debug(`Loaded ${tokenId} (miss)`);
	// 	return context;
	// }

	static async getContext(tokenId: string): Promise<Context | undefined> {
		const cached = ContextProvider.cache.get(tokenId);

		if (cached && Date.now() - cached.loadedAt < ContextProvider.TTL) {
			logger.debug(`getContext: Loaded context for token ${tokenId} (hit)`);
			return cached.context;
		}

		try {
			const context = await ContextProvider.loadFromDatabase(tokenId);

			if (!context) {
				logger.debug(`getContext: Something went wrong loading context for token ${tokenId}`);
				return undefined;
			}

			ContextProvider.cache.set(tokenId, {
				context,
				loadedAt: Date.now(),
			});

			logger.debug(`getContext: Loaded context for token ${tokenId} (miss)`);
			return context;
		} catch (error) {
			logger.error(`getContext: Error loading context for token ${tokenId}: ${error}`);
		}

		return undefined;
	}

	private static async loadFromDatabase(tokenId: string): Promise<Context | undefined> {
		// validate token
		const token = await db.Tokens.findById(tokenId);
		if (!token || !token.is_active) {
			logger.debug(`loadFromDatabase: Token not found or inactive -> ${tokenId}`);
			return undefined;
		}

		if (token.expires_at && token.expires_at < new Date()) {
			logger.debug(`loadFromDatabase: Token expired -> ${tokenId}`);
			return undefined;
		}

		// validate company
		const company = await db.Companies.findById(token.company_id);
		if (!company || !company.is_active) {
			logger.debug(`loadFromDatabase: Company not found or inactive -> ${tokenId}`);
			return undefined;
		}

		// validate integration
		const integration = await db.Integrations.findById(token.integration_id);
		if (!integration || !integration.is_active) {
			logger.debug(`loadFromDatabase: Integration not found or inactive -> ${tokenId}`);
			return undefined;
		}

		// security check: ensure token's company matches integration's company
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

	static invalidate(tokenId: string) {
		ContextProvider.cache.delete(tokenId);
	}
}
