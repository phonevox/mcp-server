import * as z from "zod";
import { createIxcSoftClient } from "@/services/ixcsoft/helper";
import { defineTool } from "@/tools/_core/tool";

export const listarClientesPeloDocumento = defineTool({
	name: "ixcsoft_listarClientesPeloDocumento",
	description: "Lista os clientes associados a um documento específico",
	input: z.object({
		documento: z.string().describe("Documento do cliente para o qual os contratos serão listados"),
	}),
	annotations: {
		destructiveHint: false,
		openWorldHint: false,
		readOnlyHint: true,
		idempotentHint: true,
	},
	async execute(ctx, params) {
		const { context, logger } = ctx;
		logger.info(`Pesquisando clientes para o documento: "${params.documento}"`);

		const client = await createIxcSoftClient(context);
		const response = await client.getClientByDocument(params.documento);

		const clients = (response.registros || []).map((c) => ({
			id: c.id,
			razao: c.razao,
			fantasia: c.fantasia,
			cnpj_cpf: c.cnpj_cpf,
			email: c.email,
			fone: c.fone,
			telefone_celular: c.telefone_celular,
			ativo: c.ativo,
			data_cadastro: c.data_cadastro,
		}));

		return {
			message: `Encontrados ${response.total || 0} clientes`,
			data: clients,
		};
	},
});
