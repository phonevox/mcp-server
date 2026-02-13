import { prisma } from "@/database/prisma";

export const Clients = {
	async findById(id: string) {
		return prisma.client.findUnique({ where: { id } });
	},

	async findTokenById(tokenId: string) {
		return prisma.clientToken.findUnique({ where: { id: tokenId }, include: { client: true } });
	},

	async updateTokenLastUsed(tokenId: string) {
		return prisma.clientToken.update({
			where: { id: tokenId },
			data: { last_used_at: new Date() },
		});
	},
};
