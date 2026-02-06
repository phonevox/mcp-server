import * as z from "zod";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ClientContext } from "../../context/types";
import { createLogger } from "../../util/logger";
import { IxcSoftClient } from "../../services/ixcsoft/client";

export const getClientContractsSchema = {
    description: "Lista os contratos de um cliente no IXCSoft",
    inputSchema: z.object({
        id: z.string().min(1, "id obrigatório").regex(/^\d+$/, "id deve conter apenas números"),
    }),
    outputSchema: z.object({
        success: z.boolean(),
        contracts: z.array(z.object()).optional(),
        message: z.string().optional(),
    })
}

export async function getClientContracts(meta: any, context: ClientContext, params: { id: string }): Promise<CallToolResult> {
    const logger = createLogger(`${meta.requestId}`)
    logger.info(`Buscando contratos do cliente ID: "${params.id}"`);

    try {
        const ixcClient = new IxcSoftClient(context, { logger: logger.child("IxcSoftClient") });
        const response = await ixcClient.getContractsByClient(params.id);

        // normalize answer
        const contracts = response.registros || [];
        const total = response.total || 0;
        const simplifiedContracts = contracts.map(contract => ({
            id: contract.id,
            id_filial: contract.id_filial,
            status: contract.status,
            status_internet: contract.status_internet,
            contrato: contract.contrato,
            tipo: contract.tipo,
            endereco: contract.endereco,
            bairro: contract.bairro,
            numero: contract.numero,
        }))
        const message = `${total} contratos localizados para o cliente ${params.id}`;
        return {
            content: [
                {
                    type: "text",
                    text: message,
                },
                {
                    type: "text",
                    text: JSON.stringify(simplifiedContracts, null, 2),
                },
            ],
            structuredContent: {
                success: true,
                contracts: simplifiedContracts,
                message,
            },
        };
    } catch (error: any) {
        logger.error("Erro ao buscar contratos", { error, cliente: params.id });
        const errorMessage = error.message || "Erro ao buscar contratos";
        return {
            content: [
                {
                    type: "text",
                    text: `❌ ${errorMessage}`,
                },
            ],
            structuredContent: {
                success: false,
                contracts: [],
                message: errorMessage,
            },
            isError: true,
        };
    };
}

