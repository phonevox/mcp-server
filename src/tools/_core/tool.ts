import type { CallToolResult, ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import type { ZodObject } from "zod";
import type { Context } from "@/context/provider";
import type { Logger } from "@/shared/logger";

export type ToolContext = {
	context: Context;
	logger: Logger;
};

/**
 * Tool names must follow OpenAI's format: only letters, numbers, underscores and hyphens.
 * @see https://platform.openai.com/docs/api-reference/assistants/object
 */
const VALID_TOOL_NAME = /^[a-zA-Z0-9_-]+$/;

function assertValidToolName(name: string): void {
	if (!VALID_TOOL_NAME.test(name)) {
		throw new Error(
			`Invalid tool name "${name}". Only letters, numbers, underscores and hyphens are allowed (^[a-zA-Z0-9_-]+$).`,
		);
	}
}

type ToolInput<TInput extends ZodObject<any>> = {
	name: string;
	title?: string;
	description?: string;
	input: TInput;
	output?: ZodObject<any>;
	annotations?: ToolAnnotations;
	execute: (
		ctx: ToolContext,
		params: TInput["_output"],
	) => Promise<{ message: string; data?: unknown }>;
};

export type ToolDefinition = {
	name: string;
	schema: {
		title?: string;
		description?: string;
		inputSchema: ZodObject<any>;
		outputSchema?: ZodObject<any>;
		annotations?: ToolAnnotations;
	};
	handler: (ctx: ToolContext, params: Record<string, unknown>) => Promise<CallToolResult>;
};

export function defineTool<TInput extends ZodObject<any>>(def: ToolInput<TInput>): ToolDefinition {
	assertValidToolName(def.name);

	return {
		name: def.name,
		schema: {
			title: def.title,
			description: def.description,
			inputSchema: def.input,
			outputSchema: def.output,
			annotations: def.annotations,
		},
		handler: async (ctx, params) => {
			try {
				const { message, data } = await def.execute(ctx, params as TInput["_output"]);

				return {
					content: [
						{ type: "text", text: message },
						...(data !== undefined
							? [{ type: "text" as const, text: JSON.stringify(data, null, 2) }]
							: []),
					],
					structuredContent: {
						success: true,
						message,
						data,
					},
				};
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
				ctx.logger.error("Tool execution failed", { error, params });

				return {
					content: [{ type: "text", text: `❌ ${errorMessage}` }],
					structuredContent: { success: false, message: errorMessage },
					isError: true,
				};
			}
		},
	};
}
