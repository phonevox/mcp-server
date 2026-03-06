import * as z from "zod";
import { createIxcSoftClient } from "@/services/ixcsoft/helper";
import { defineTool } from "@/tools/_core/tool";

export const listarFaturasPorCliente = defineTool({
	name: "ixcsoft_ListarFaturasPorCliente",
	description: "Lista as faturas ABERTAS associadas a um cliente",
	input: z.object({
		clienteId: z.string().describe("ID do cliente para listar as faturas"),
	}),
	annotations: {
		destructiveHint: false,
		openWorldHint: false,
		readOnlyHint: true,
		idempotentHint: true,
	},
	async execute(ctx, params) {
		const { context, logger } = ctx;
		const { clienteId } = params;

		logger.info(`Pesquisando boletos para o contrato ID: "${clienteId}"`);

		const client = await createIxcSoftClient(context);
		const response = await client.getFaturasByClient(clienteId);

		// filtra apenas faturas ativas
		const faturas = (response.registros || [])
			.filter((f) => f.status === "A")
			.map((f) => ({
				id: f.id,
				id_contrato: f.id_contrato,
				data_vencimento: f.data_vencimento,
				valor_em_aberto: f.valor_aberto,
				valor_total: f.valor,
				vencida: new Date(f.data_vencimento) < new Date(),
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
