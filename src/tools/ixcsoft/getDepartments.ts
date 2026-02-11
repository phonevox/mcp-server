import * as z from "zod";
import { IxcSoftClient } from "@/services/ixcsoft/client";
import { defineTool, type ToolDefinition } from "@/tools/core/tool";

export const tool: ToolDefinition = defineTool(
	"ixcsoft.getAllDepartments",
	"Returns all departments",
	z.object({}),
)
	.handler(async (ctx, params) => {
		ctx.logger.info(`Searching contracts for client ID: "${params.id}"`);

		const ixcsoft = new IxcSoftClient(ctx.context, {
			logger: ctx.logger?.child("IxcSoftClient"),
		});

		const response = await ixcsoft.getDepartments();

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
