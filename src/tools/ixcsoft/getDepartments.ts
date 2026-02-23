import * as z from "zod";
import { createIxcSoftClient } from "@/services/ixcsoft/helper";
import { defineTool, type ToolDefinition } from "@/tools/core/tool";

export const tool: ToolDefinition = defineTool(
	"ixcsoft.getAllDepartments",
	"Returns all departments",
	z.object({}),
)
	.handler(async (ctx, _params) => {
		const { context, logger } = ctx;
		logger.info(`Searching departments for integration ID: "${context.integrationId}"`);

		const client = await createIxcSoftClient(context);
		const response = await client.getDepartments();

		return {
			departments: (response.registros || []).map((c) => ({
				id: c.id,
				setor: c.setor,
			})),
			total: response.total || 0,
		};
	})
	.formatMessage((result) => `Found ${result.total} departments`)
	.formatData((result) => result.departments)
	.build();
