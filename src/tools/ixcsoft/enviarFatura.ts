import * as z from "zod";
// import { createIxcSoftClient } from "@/services/ixcsoft/helper";
import { defineTool } from "@/tools/_core/tool";

export const enviarFatura = defineTool({
	name: "ixcsoft_EnviarFatura",
	description: "Envia uma fatura para o cliente",
	input: z.object({
		faturaId: z.string().describe("ID da fatura a ser enviada"),
	}),
	annotations: {
		destructiveHint: false,
		openWorldHint: false,
		readOnlyHint: true,
		idempotentHint: true,
	},
	async execute(ctx, params) {
		// @NOTE: Implementação fake só para teste.
		const { logger } = ctx;
		const { faturaId } = params;

		// const client = await createIxcSoftClient(context);
		// const response = await client.enviarFatura(faturaId);

		logger.debug(`Enviando fatura ${faturaId}`);

		return {
			message: "OK",
			data: {},
		};
	},
});
