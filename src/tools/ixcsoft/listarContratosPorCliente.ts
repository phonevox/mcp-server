import * as z from "zod";
import { createIxcSoftClient } from "@/services/ixcsoft/helper";
import { defineTool } from "@/tools/_core/tool";

export const listarContratosPorCliente = defineTool({
	name: "ixcsoft_listarContratosDoCliente",
	description: "Lista os contratos associados a um cliente específico",
	input: z.object({
		clienteId: z.string().describe("ID do cliente para o qual os contratos serão listados"),
	}),
	annotations: {
		destructiveHint: false,
		openWorldHint: false,
		readOnlyHint: true,
		idempotentHint: true,
	},
	async execute(ctx, params) {
		const { context, logger } = ctx;
		logger.info(`Pesquisando contratos para o cliente ID: "${params.clienteId}"`);

		const client = await createIxcSoftClient(context);
		const response = await client.getContractsByClient(params.clienteId);

		const contracts = (response.registros || []).map((c) => ({
			id: c.id,
			id_filial: c.id_filial,
			status: c.status,
			status_internet: c.status_internet,
			contrato: c.contrato,
			tipo: c.tipo,
			endereco: c.endereco,
			bairro: c.bairro,
			numero: c.numero,
		}));

		return {
			message: `Encontrados ${response.total || 0} contratos`,
			data: contracts,
		};
	},
});
