import * as z from "zod";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ClientContext } from "../../context/types";
import { createLogger } from "../../util/logger";
import { IxcSoftClient } from "../../services/ixcsoft/client";

export const getDepartmentsSchema = {
    description: "Lista todos os departamentos de um cliente no IXCSoft",
    outputSchema: z.object({
        success: z.boolean(),
        departments: z.array(z.object()).optional(),
        message: z.string().optional(),
    })
}

export async function getDepartments(context: ClientContext): Promise<CallToolResult> {
    const logger = createLogger(`tool:ixcsoft:getDepartments:${context.clientId}`);
    logger.info("Buscando departamentos");

    try {
        const ixcClient = new IxcSoftClient(context);
        const response = await ixcClient.getDepartments();

        // normalize answer
        const departments = response.registros || [];
        const total = response.total || 0;
        const message = `${total} departamentos encontrados.`;
        return {
            content: [
                {
                    type: "text",
                    text: message,
                },
                {
                    type: "text",
                    text: JSON.stringify(departments, null, 2),
                },
            ],
            structuredContent: {
                success: true,
                departments: departments,
                message,
            },
        };
    } catch (error: any) {
        logger.error("Erro ao listar departamentos", { error });
        const errorMessage = error.message || "Erro ao listar departamentos";
        return {
            content: [
                {
                    type: "text",
                    text: `❌ ${errorMessage}`,
                },
            ],
            structuredContent: {
                success: false,
                departments: [],
                message: errorMessage,
            },
            isError: true,
        };
    };
}

