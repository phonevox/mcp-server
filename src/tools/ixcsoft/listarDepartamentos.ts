import * as z from "zod";
import { createIxcSoftClient } from "@/services/ixcsoft/helper";
import { defineTool } from "@/tools/_core/tool";

export const listarDepartamentos = defineTool({
	name: "ixcsoft_listarDepartamentos",
	description: "Lista todos os departamentos",
	input: z.object({}),
	annotations: {
		destructiveHint: false,
		openWorldHint: false,
		readOnlyHint: true,
		idempotentHint: true,
	},
	async execute(ctx, _params) {
		const { context, logger } = ctx;
		logger.info(`Pesquisando departamentos para o ID da integração: "${context.integrationId}"`);

		const client = await createIxcSoftClient(context);
		const response = await client.getDepartments();

		const departments = (response.registros || []).map((c) => ({
			id: c.id,
			setor: c.setor,
		}));

		return {
			message: `Encontrados ${response.total || 0} departamentos`,
			data: departments,
		};
	},
});
