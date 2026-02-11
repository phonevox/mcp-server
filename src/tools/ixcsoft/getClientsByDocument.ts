import * as z from "zod";
import { IxcSoftClient } from "@/services/ixcsoft/client";
import { DocumentSchema } from "@/services/ixcsoft/schemas";
import { defineTool, type ToolDefinition } from "@/tools/core/tool";

export const tool: ToolDefinition = defineTool(
	"ixcsoft.getClientsByDocument",
	"Returns clients by document (CPF/CNPJ). Input must be formatted",
	z.object({
		documento: DocumentSchema,
		teste: z.string().optional(),
	}),
)
	.handler(async (ctx, params) => {
		ctx.logger.info(`Searching "${params.documento}"`);

		const ixcClient = new IxcSoftClient(ctx.context, {
			logger: ctx.logger.child("IxcSoftClient"),
		});

		const response = await ixcClient.getClientByDocument(params.documento);

		return {
			clients: (response.registros || []).map((c) => ({
				id: c.id,
				razao: c.razao,
				fantasia: c.fantasia,
				cnpj_cpf: c.cnpj_cpf,
				email: c.email,
				fone: c.fone,
				telefone_celular: c.telefone_celular,
				ativo: c.ativo,
			})),
			total: response.total || 0,
		};
	})
	.formatMessage(
		(result, params) =>
			`${result.total} clientes localizados para o documento ${params.documento}.`,
	)
	.formatData((result) => result.clients)
	.build();
