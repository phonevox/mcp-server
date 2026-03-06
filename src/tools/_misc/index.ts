import * as z from "zod";
import type { ToolRegistry } from "@/tools/_core/registry";
import { defineTool } from "@/tools/_core/tool";

const echo = defineTool({
	name: "echo",
	description: "Echoes back the provided message",
	input: z.object({ message: z.string() }),
	output: z.object({ echo: z.string() }),

	async execute(_ctx, params) {
		return {
			message: params.message,
			data: { echo: params.message },
		};
	},
});

export const miscRegistry: ToolRegistry = {
	tools: [echo],
};
