import { createTool, type ToolDefinition } from "../core/tool";
import { IxcSoftClient } from "../../services/ixcsoft/client";
import * as z from "zod";

export const tool: ToolDefinition= {
    name: "ixcsoft.GetContractsByClient",

    schema: {
        description: "Returns all contracts for a client via id",
        inputSchema: z.object({
            id: z.string().min(1, "id obrigatório").regex(/^\d+$/, "id deve conter apenas números"),
        }),
    },

    handler: createTool(
        async (ctx, params: { id: string }) => {
            ctx.logger.info(`Buscando contratos do cliente ID: "${params.id}"`);

            const ixcClient = new IxcSoftClient(ctx.context, {
                logger: ctx.logger.child("IxcSoftClient")
            });

            const response = await ixcClient.getContractsByClient(params.id);

            return {
                contracts: (response.registros || []).map(c => ({
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
                total: response.total || 0
            };
        },
        {
            message: (result, params) =>
                `${result.total} contratos localizados para o cliente ${params.id}`,
            data: (result) => result.contracts
        }
    ),
};