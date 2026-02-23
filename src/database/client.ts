import { LRUCache } from "lru-cache";
import { prisma } from "@/database/prisma";
import { decrypt } from "@/security/encryption";
import { createLogger } from "@/shared/logger";
import type {
	Companies as CompaniesType,
	CompanyToken as CompanyTokenType,
} from "../../generated/prisma/client";

const logger = createLogger("database:cache");

const tokenCache = new LRUCache<string, CompanyTokenType>({
	max: 5000,
	ttl: 1000 * 60 * 60,
});

const companyCache = new LRUCache<string, CompaniesType>({
	max: 2000,
	ttl: 1000 * 60 * 60, // 1h
});

export const Companies = {
	async findById(id: string) {
		const cached = companyCache.get(id);
		if (cached) {
			logger.debug(`findById ${id} (hit)`);
			return cached;
		}
		logger.debug(`findById ${id} (miss)`);
		const company = await prisma.companies.findUnique({ where: { id } });

		if (company) {
			companyCache.set(id, company);
		}

		return company;
	},

	async findByToken(tokenId: string) {
		const cached = companyCache.get(`token:${tokenId}`);
		if (cached) {
			logger.debug(`findByToken ${tokenId} (hit)`);
			return cached;
		}
		logger.debug(`findByToken ${tokenId} (miss)`);

		const company = await prisma.companies.findFirst({
			where: { tokens: { some: { id: tokenId } } },
		});

		if (company) {
			companyCache.set(`token:${tokenId}`, company);
		}

		return company;
	},

	async findTokenById(tokenId: string) {
		return prisma.companyToken.findUnique({ where: { id: tokenId }, include: { company: true } });
	},

	async update(id: string, data: Partial<CompaniesType>) {
		const updated = await prisma.companies.update({
			where: { id },
			data,
		});

		companyCache.set(id, updated); // atualiza cache

		return updated;
	},
};

export const Tokens = {
	async findById(id: string) {
		const cached = tokenCache.get(id);
		if (cached) {
			logger.debug(`findById ${id} (hit)`);
			return cached;
		}
		logger.debug(`findById ${id} (miss)`);
		const token = await prisma.companyToken.findUnique({ where: { id } });

		if (token) {
			tokenCache.set(id, token);
		}

		return token;
	},

	async findByHash(hash: string) {
		const cached = tokenCache.get(hash);
		if (cached) {
			logger.debug(`findByHash ${hash} (hit)`);
			return cached;
		}
		logger.debug(`findByHash ${hash} (miss)`);

		const token = await prisma.companyToken.findUnique({
			where: { token_hash: hash },
		});

		if (token) {
			tokenCache.set(hash, token);
		}

		return token;
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

		return token;
	},

	async revoke(hash: string) {
		await prisma.companyToken.update({
			where: { token_hash: hash },
			data: { is_active: false },
		});

		tokenCache.delete(hash);
	},

	async updateLastUsed(tokenId: string) {
		const token = await prisma.companyToken.update({
			where: { id: tokenId },
			data: { last_used_at: new Date() },
		});

		tokenCache.set(tokenId, token);
	},
};

export const Integrations = {
	async findByToken(tokenId: string) {
		return prisma.integration.findFirst({
			where: { tokens: { some: { id: tokenId } } },
		});
	},

	async findById(integrationId: string) {
		return prisma.integration.findUnique({
			where: { id: integrationId },
		});
	},

	async findSettingsById(integrationId: string) {
		const integration = await prisma.integration.findUnique({
			where: { id: integrationId },
			include: {
				ixcConfig: true,
				sgpConfig: true,
			},
		});

		if (!integration) return null;

		const { ixcConfig, sgpConfig, ...baseIntegration } = integration;

		switch (integration.type) {
			case "ixcsoft": {
				if (!integration.ixcConfig) return null;

				return {
					...baseIntegration,
					config: {
						base_url: decrypt(integration.ixcConfig.base_url),
						token: decrypt(integration.ixcConfig.token),
					},
				};
			}

			case "tsmxsgp": {
				if (!integration.sgpConfig) return null;

				return {
					...baseIntegration,
					config: {
						base_url: decrypt(integration.sgpConfig.base_url),
						app: decrypt(integration.sgpConfig.app),
						token: decrypt(integration.sgpConfig.token),
					},
				};
			}

			default:
				return null;
		}
	},
};
