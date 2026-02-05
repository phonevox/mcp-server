import * as z from "zod";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ClientContext } from "../../context/types";
import { createLogger } from "../../util/logger";
import { IxcSoftClient } from "../../services/ixcsoft/client";
import { DocumentSchema } from "../../services/ixcsoft/schemas";

export const getClientByDocumentSchema = {
    description: "Busca cliente(s) no IXCSoft a partir do CPF ou CNPJ. O documento necessita estar formatado em CPF XXX.XXX.XXX-XX para CPF ou XX.XXX.XXX/XXXX-XX para CNPJ",
    inputSchema: z.object({
        documento: DocumentSchema,
    }),
    outputSchema: z.object({
        success: z.boolean(),
        clients: z.array(
            z.object({
                id: z.string(),
                razao: z.string().optional(),
                fantasia: z.string().optional(),
                cnpj_cpf: z.string().optional(),
                email: z.string().optional(),
                fone: z.string().optional(),
                telefone_celular: z.string().optional(),
                ativo: z.string().optional().describe("Status do cadastro do cliente. Se 'S', ativo. Se 'N', inativo."),
            }),
        ),
        message: z.string().optional(),
    }),
};

export async function getClientByDocument(
    context: ClientContext,
    params: { documento: string },
): Promise<CallToolResult> {
    const logger = createLogger(
        `tool:ixcsoft:get-client-by-document:${context.clientId}`,
    );
    logger.info(`Buscando documento ${params.documento}`);

    try {
        const ixcClient = new IxcSoftClient(context);
        const response = await ixcClient.getClientByDocument(params.documento);

        // normalize answer
        const clients = response.registros || [];
        const total = response.total || 0;

        // resumindo os dados dos clientes, não precisamos retornar tudo
        const simplifiedClients = clients.map((client) => ({
            id: client.id,
            razao: client.razao,
            fantasia: client.fantasia,
            cnpj_cpf: client.cnpj_cpf,
            email: client.email,
            fone: client.fone,
            telefone_celular: client.telefone_celular,
            ativo: client.ativo,
        }));

        // mensagem para llm
        const message = `${total} clientes localizados para o documento ${params.documento}.`;

        return {
            content: [
                {
                    type: "text",
                    text: message,
                },
                {
                    type: "text",
                    text: JSON.stringify(simplifiedClients, null, 2),
                },
            ],
            structuredContent: {
                success: true,
                clients: simplifiedClients,
                message,
            },
        };
    } catch (error: any) {
        logger.error("Erro ao buscar cliente", {
            error,
            clientId: context.clientId,
            documento: params.documento,
        });

        const errorMessage =
            error.message || "Erro desconhecido ao consultar cliente";

        return {
            content: [
                {
                    type: "text",
                    text: `❌ ${errorMessage}`,
                },
            ],
            structuredContent: {
                success: false,
                clients: [],
                message: errorMessage,
            },
            isError: true,
        };
    }
}
