import { LRUCache } from "lru-cache";
import { prisma } from "@/database/prisma";
import { createLogger } from "@/shared/logger";
import type { Companies, CompanyToken } from "../../generated/prisma/client";

const logger = createLogger("database:cache");

const tokenCache = new LRUCache<string, CompanyToken>({
	max: 5000,
	ttl: 1000 * 60 * 60,
});

const companyCache = new LRUCache<string, Companies>({
	max: 2000,
	ttl: 1000 * 60 * 60, // 1h
});

export const CompaniesRepo = {
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

	async findTokenById(tokenId: string) {
		return prisma.companyToken.findUnique({ where: { id: tokenId }, include: { company: true } });
	},

	async update(id: string, data: Partial<Companies>) {
		const updated = await prisma.companies.update({
			where: { id },
			data,
		});

		companyCache.set(id, updated); // atualiza cache

		return updated;
	},
};

export const Tokens = {
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
		hash,
		isActive = true,
	}: {
		companyId: string;
		hash: string;
		isActive?: boolean;
	}) {
		const token = await prisma.companyToken.create({
			data: {
				company_id: companyId,
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
