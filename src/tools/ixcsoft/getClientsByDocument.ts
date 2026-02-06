import { createTool, type ToolDefinition } from "../core/tool";
import { IxcSoftClient } from "../../services/ixcsoft/client";
import * as z from "zod";
import { DocumentSchema } from "../../services/ixcsoft/schemas";

export const tool: ToolDefinition = {
    name: "ixcsoft.getCientsByDocument",

    schema: {
        description: "Returns clients by document (CPF/CNPJ). Input must be formatted",
        inputSchema: z.object({
            documento: DocumentSchema,
        }),
    },

    handler: createTool(
        async (ctx, params: { documento: string }) => {
            ctx.logger.info(`Searching "${params.documento}"`);

            const ixcClient = new IxcSoftClient(ctx.context, {
                logger: ctx.logger.child("IxcSoftClient")
            });

            const response = await ixcClient.getClientByDocument(params.documento);

            return {
                clients: (response.registros || []).map(c => ({
                    id: c.id,
                    razao: c.razao,
                    fantasia: c.fantasia,
                    cnpj_cpf: c.cnpj_cpf,
                    email: c.email,
                    fone: c.fone,
                    telefone_celular: c.telefone_celular,
                    ativo: c.ativo,
                })),
                total: response.total || 0
            };
        },
        {
            message: (result, params) =>
                `${result.total} clientes localizados para o documento ${params.documento}.`,
            data: (result) => result.clients
        }
    ),
};