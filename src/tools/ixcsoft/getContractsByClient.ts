import * as z from "zod";
import { IxcSoftClient } from "@/services/ixcsoft/client";
import { defineTool, type ToolDefinition } from "@/tools/core/tool";

export const tool: ToolDefinition = defineTool(
	"ixcsoft.getContractsByClient",
	"Returns all contracts for a client via id",
	z.object({
		id: z.string().min(1, "ID is required").regex(/^\d+$/, "ID must contain only numbers"),
	}),
)
	.handler(async (ctx, params) => {
		ctx.logger.info(`Searching contracts for client ID: "${params.id}"`);

		const ixcsoft = new IxcSoftClient(ctx.context, {
			logger: ctx.logger?.child("IxcSoftClient"),
		});

		const response = await ixcsoft.getContractsByClient(params.id);

		return {
			contracts: (response.registros || []).map((c) => ({
				id: c.id,
				id_filial: c.id_filial,
				status: c.status,
				status_internet: c.status_internet,
				contrato: c.contrato,
				tipo: c.tipo,
				endereco: c.endereco,
				bairro: c.bairro,
				numero: c.numero,
			})),
			total: response.total || 0,
		};
	})
	.formatMessage((result, params) => `${result.total} contracts found for client ${params.id}`)
	.formatData((result) => result.contracts)
	.build();
