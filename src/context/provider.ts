import { config } from "@/config";
import { db } from "@/database";
import { createLogger } from "@/shared/logger";

// @TODO(adrian)
// cache with lru-cache instead

export type ClientContext = {
	id: string;
	name: string;
	slug: string;
};

type CacheEntry = {
	context: ClientContext;
	loadedAt: number;
};

const logger = createLogger("ctx");

// biome-ignore lint/complexity/noStaticOnlyClass: yo shut up https://tenor.com/bu4sg.gif
export class ContextProvider {
	private static cache = new Map<string, CacheEntry>();
	private static TTL = config.CONTEXT_CACHE_TTL;

	static async getContext(clientId: string): Promise<ClientContext> {
		const cached = ContextProvider.cache.get(clientId);

		if (cached && Date.now() - cached.loadedAt < ContextProvider.TTL) {
			logger?.debug(`Loaded ${clientId}`);
			return cached.context;
		}

		const context = await ContextProvider.loadFromDatabase(clientId);

		ContextProvider.cache.set(clientId, {
			context,
			loadedAt: Date.now(),
		});

		logger?.debug(`Loaded ${clientId} (miss)`);
		return context;
	}

	private static async loadFromDatabase(clientId: string): Promise<ClientContext> {
		const client = await db.CompaniesRepo.findById(clientId);

		if (!client || !client.is_active) {
			logger?.debug(`loadFromDatabase: Not found or inactive -> ${clientId}`);
			throw new Error(`Client not found or inactive`);
		}
		logger?.debug(`loadFromDatabase: Found ${clientId}: "${client.name}" (${client.slug})`);

		return {
			id: client.id,
			name: client.name,
			slug: client.slug,
		};
	}

	static invalidate(clientId: string) {
		ContextProvider.cache.delete(clientId);
	}
}
