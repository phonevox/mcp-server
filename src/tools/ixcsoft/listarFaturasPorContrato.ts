import * as z from "zod";
import { createIxcSoftClient } from "@/services/ixcsoft/helper";
import { defineTool } from "@/tools/_core/tool";

export const listarFaturasPorContrato = defineTool({
	name: "ixcsoft_ListarFaturasDoContrato",
	description: "Lista as faturas ABERTAS associadas a um contrato",
	input: z.object({
		contratoId: z.string().describe("ID do contrato para listar as faturas"),
	}),
	annotations: {
		destructiveHint: false,
		openWorldHint: false,
		readOnlyHint: true,
		idempotentHint: true,
	},
	async execute(ctx, params) {
		const { context, logger } = ctx;
		const { contratoId } = params;

		logger.info(`Pesquisando boletos para o contrato ID: "${contratoId}"`);

		const client = await createIxcSoftClient(context);
		const response = await client.getFaturasByContract(contratoId);

		// filtra apenas faturas ativas
		const faturas = (response.registros || [])
			.filter((f) => f.status === "A")
			.map((f) => ({
				id: f.id,
				id_contrato: f.id_contrato,
				data_vencimento: f.data_vencimento,
			}));

		const now = new Date();

		// conta vencidas
		const vencidas = faturas.filter((f) => new Date(f.data_vencimento) < now);
		const vencidasIds = vencidas.map((f) => f.id).join(", ");

		if (vencidas.length > 0) {
			logger.warn(`Encontradas ${vencidas.length} faturas vencidas (ids: ${vencidasIds})`);
		}

		const messageParts = [`${faturas.length} faturas ativas encontradas`];

		if (vencidas.length > 0) {
			messageParts.push(`${vencidas.length} vencidas`);
		}

		return {
			message: messageParts.join(" — "),
			data: faturas,
		};
	},
});
