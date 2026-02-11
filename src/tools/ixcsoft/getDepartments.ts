import * as z from "zod";
import { createTool, type ToolDefinition } from "@/tools/core/tool";
import { IxcSoftClient } from "@/services/ixcsoft/client";

export const tool: ToolDefinition = {
    name: "ixcsoft.getAllDepartments",

    schema: {
        description: "Returns all departments",
        inputSchema: z.object({}),
    },

    handler: createTool(
        async (ctx, params: {}) => {
            ctx.logger.info(`Buscando departamentos`);

            const ixcClient = new IxcSoftClient(ctx.context, {
                logger: ctx.logger.child("IxcSoftClient")
            });

            const response = await ixcClient.getDepartments();

            return {
                departments: response.registros || [],
                total: response.total || 0
            }
        }
    )
}