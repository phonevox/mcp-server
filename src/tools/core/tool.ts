// core/tool.ts
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ZodObject } from "zod";
import type { ClientContext } from "@/context/types";
import { createLogger, type Logger } from "@/shared/logger";

export type ToolContext = {
	requestId: string;
	context: ClientContext;
	logger: Logger;
};

export type ToolDefinition = {
	name: string;
	schema: {
		description: string;
		inputSchema: ZodObject<any>;
		outputSchema?: ZodObject<any>;
	};
	handler: (
		meta: { requestId: string },
		context: ClientContext,
		params: Record<string, unknown>,
	) => Promise<CallToolResult>;
};

// Builder com interface fluente
export class ToolBuilder<TParams extends Record<string, unknown>, TResult = unknown> {
	private _name: string;
	private _description: string;
	private _inputSchema: ZodObject<any>;
	private _outputSchema?: ZodObject<any>;
	private _handler!: (ctx: ToolContext, params: TParams) => Promise<TResult>;
	private _formatMessage?: (result: TResult, params: TParams) => string;
	private _formatData?: (result: TResult) => unknown;

	constructor(name: string, description: string, inputSchema: ZodObject<any>) {
		this._name = name;
		this._description = description;
		this._inputSchema = inputSchema;
	}

	outputSchema(schema: ZodObject<any>): this {
		this._outputSchema = schema;
		return this;
	}

	// Handler agora retorna um novo ToolBuilder com o tipo TResult inferido
	handler<R>(fn: (ctx: ToolContext, params: TParams) => Promise<R>): ToolBuilder<TParams, R> {
		const builder = this as any as ToolBuilder<TParams, R>;
		builder._handler = fn;
		return builder;
	}

	formatMessage(fn: (result: TResult, params: TParams) => string): this {
		this._formatMessage = fn;
		return this;
	}

	formatData(fn: (result: TResult) => unknown): this {
		this._formatData = fn;
		return this;
	}

	build(): ToolDefinition {
		if (!this._handler) {
			throw new Error(`Tool "${this._name}" must have a handler`);
		}

		return {
			name: this._name,
			schema: {
				description: this._description,
				inputSchema: this._inputSchema,
				outputSchema: this._outputSchema,
			},
			handler: async (meta, context, params) => {
				const logger = createLogger(meta.requestId);
				const ctx: ToolContext = { requestId: meta.requestId, context, logger };

				try {
					const result = await this._handler(ctx, params as TParams);
					const data = this._formatData?.(result) ?? result;
					const message = this._formatMessage?.(result, params as TParams) ?? "Success";

					return {
						content: [
							{ type: "text", text: message },
							{ type: "text", text: JSON.stringify(data, null, 2) },
						],
						structuredContent: {
							success: true,
							data,
							message,
						},
					};
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
					logger.error("Tool execution failed", { error, params });

					return {
						content: [{ type: "text", text: `❌ ${errorMessage}` }],
						structuredContent: {
							success: false,
							message: errorMessage,
						},
						isError: true,
					};
				}
			},
		};
	}
}

// Factory function simplificada
export function defineTool<TInput extends ZodObject<any>>(
	name: string,
	description: string,
	inputSchema: TInput,
) {
	type TParams = TInput["_output"];
	return new ToolBuilder<TParams, unknown>(name, description, inputSchema);
}
