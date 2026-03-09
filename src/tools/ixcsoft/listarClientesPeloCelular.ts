import * as z from "zod";
import { createIxcSoftClient } from "@/services/ixcsoft/helper";
import { defineTool } from "@/tools/_core/tool";

export const listarClientesPeloCelular = defineTool({
	name: "ixcsoft_listarClientesPeloCelular",
	description: "Lista os clientes associados a um celular específico",
	input: z.object({
		numero: z.string().describe("Número de celular para o qual cadastros serão listados"),
	}),
	annotations: {
		destructiveHint: false,
		openWorldHint: false,
		readOnlyHint: true,
		idempotentHint: true,
	},
	async execute(ctx, params) {
		const { context, logger } = ctx;
		logger.info(`Pesquisando clientes para o número: "${params.numero}"`);

		const client = await createIxcSoftClient(context);
		logger.warn("pre request");
		const response = await client.getClientByCelular(params.numero);
		logger.warn(`${response}`);

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
