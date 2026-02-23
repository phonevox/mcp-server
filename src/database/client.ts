import { LRUCache } from "lru-cache";
import { prisma } from "@/database/prisma";
import { decrypt } from "@/security/encryption";
import { createLogger } from "@/shared/logger";
import type {
	Companies as CompaniesType,
	CompanyToken as CompanyTokenType,
	Integration as IntegrationType,
} from "../../generated/prisma/client";

const logger = createLogger("database:cache");

// ─── Caches ──────────────────────────────────────────────────────────────────

const tokenCache = new LRUCache<string, CompanyTokenType>({
	max: 5000,
	ttl: 1000 * 60 * 60, // 1h
});

const companyCache = new LRUCache<string, CompaniesType>({
	max: 2000,
	ttl: 1000 * 60 * 60, // 1h
});

const integrationCache = new LRUCache<string, IntegrationType>({
	max: 2000,
	ttl: 1000 * 60 * 60, // 1h
});

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Busca do cache ou executa o fetcher, armazenando o resultado.
 * Loga hit/miss automaticamente.
 */
async function withCache<T extends {}>(
	cache: LRUCache<string, T>,
	key: string,
	fetcher: () => Promise<T | null>,
	logLabel: string,
): Promise<T | null> {
	const cached = cache.get(key);
	if (cached) {
		logger.debug(`${logLabel} ${key} (hit)`);
		return cached;
	}

	logger.debug(`${logLabel} ${key} (miss)`);
	const value = await fetcher();

	if (value) {
		cache.set(key, value);
	}

	return value;
}

// ─── Companies ────────────────────────────────────────────────────────────────

export const Companies = {
	async findById(id: string) {
		return withCache(
			companyCache,
			id,
			() => prisma.companies.findUnique({ where: { id } }),
			"Companies.findById",
		);
	},

	async findByToken(tokenId: string) {
		return withCache(
			companyCache,
			`token:${tokenId}`,
			() => prisma.companies.findFirst({ where: { tokens: { some: { id: tokenId } } } }),
			"Companies.findByToken",
		);
	},

	async findTokenById(tokenId: string) {
		return prisma.companyToken.findUnique({ where: { id: tokenId }, include: { company: true } });
	},

	async update(id: string, data: Partial<CompaniesType>) {
		const updated = await prisma.companies.update({ where: { id }, data });

		// Atualiza entrada direta
		companyCache.set(id, updated);

		// Invalida todas as entradas token:* que referenciam esta empresa.
		// Elas serão recarregadas na próxima leitura com dados frescos.
		for (const [key] of companyCache.entries()) {
			if (key.startsWith("token:")) {
				const cached = companyCache.get(key);
				if (cached?.id === id) {
					companyCache.set(key, updated);
				}
			}
		}

		return updated;
	},
};

// ─── Tokens ───────────────────────────────────────────────────────────────────

export const Tokens = {
	async findById(id: string) {
		return withCache(
			tokenCache,
			id,
			() => prisma.companyToken.findUnique({ where: { id } }),
			"Tokens.findById",
		);
	},

	async findByHash(hash: string) {
		return withCache(
			tokenCache,
			hash,
			() => prisma.companyToken.findUnique({ where: { token_hash: hash } }),
			"Tokens.findByHash",
		);
	},

	async create({
		companyId,
		integrationId,
		hash,
		isActive = true,
	}: {
		companyId: string;
		integrationId: string;
		hash: string;
		isActive?: boolean;
	}) {
		const token = await prisma.companyToken.create({
			data: {
				company_id: companyId,
				integration_id: integrationId,
				token_hash: hash,
				is_active: isActive,
			},
		});

		tokenCache.set(hash, token);
		tokenCache.set(token.id, token);

		return token;
	},

	async revoke(hash: string) {
		const token = await prisma.companyToken.update({
			where: { token_hash: hash },
			data: { is_active: false },
		});

		// Remove pelo hash e pelo id para evitar entradas obsoletas
		tokenCache.delete(hash);
		tokenCache.delete(token.id);
	},

	async updateLastUsed(tokenId: string) {
		const token = await prisma.companyToken.update({
			where: { id: tokenId },
			data: { last_used_at: new Date() },
		});

		// Atualiza ambas as chaves para manter consistência
		tokenCache.set(tokenId, token);
		tokenCache.set(token.token_hash, token);
	},
};

// ─── Integrations ─────────────────────────────────────────────────────────────

export const Integrations = {
	async findById(integrationId: string) {
		return withCache(
			integrationCache,
			integrationId,
			() => prisma.integration.findUnique({ where: { id: integrationId } }),
			"Integrations.findById",
		);
	},

	async findByToken(tokenId: string) {
		return withCache(
			integrationCache,
			`token:${tokenId}`,
			() => prisma.integration.findFirst({ where: { tokens: { some: { id: tokenId } } } }),
			"Integrations.findByToken",
		);
	},

	async findSettingsById(integrationId: string) {
		// Usa chave separada pois inclui relações e dados descriptografados
		const cacheKey = `settings:${integrationId}`;
		const cached = integrationCache.get(cacheKey);

		if (cached) {
			logger.debug(`Integrations.findSettingsById ${integrationId} (hit)`);
			return buildSettings(cached);
		}

		logger.debug(`Integrations.findSettingsById ${integrationId} (miss)`);

		const integration = await prisma.integration.findUnique({
			where: { id: integrationId },
			include: { ixcConfig: true, sgpConfig: true },
		});

		if (!integration) return null;

		// Cacheia o objeto base (sem os dados descriptografados)
		integrationCache.set(cacheKey, integration);

		return buildSettings(integration);
	},
};

// ─── Helpers privados ─────────────────────────────────────────────────────────

type IntegrationWithConfigs = IntegrationType & {
	ixcConfig?: { base_url: string; token: string } | null;
	sgpConfig?: { base_url: string; app: string; token: string } | null;
};

function buildSettings(integration: IntegrationWithConfigs) {
	const { ixcConfig, sgpConfig, ...baseIntegration } = integration;

	switch (integration.type) {
		case "ixcsoft": {
			if (!ixcConfig) return null;
			return {
				...baseIntegration,
				config: {
					base_url: decrypt(ixcConfig.base_url),
					token: decrypt(ixcConfig.token),
				},
			};
		}

		case "tsmxsgp": {
			if (!sgpConfig) return null;
			return {
				...baseIntegration,
				config: {
					base_url: decrypt(sgpConfig.base_url),
					app: decrypt(sgpConfig.app),
					token: decrypt(sgpConfig.token),
				},
			};
		}

		default:
			return null;
	}
}
