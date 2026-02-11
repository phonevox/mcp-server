// core/tool.ts
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ClientContext } from "@/context/types";
import { createLogger } from "@/shared/logger";
import type { ZodObject } from "zod";

export type ToolContext = {
  requestId: string;
  context: ClientContext;
  logger: any;
};

export type ToolHandler<TParams = any, TResult = any> = (
  ctx: ToolContext,
  params: TParams
) => Promise<TResult>;

export type ToolResultFormatter<TResult = any> = {
  message: (result: TResult, params: any) => string;
  data: (result: TResult) => any;
};

export type ToolDefinition = {
  name: string;
  schema: {
    description: string;
    inputSchema: ZodObject;
    outputSchema?: ZodObject;
  };
  handler: (
    meta: { requestId: string },
    context: ClientContext,
    params: Record<string, unknown>
  ) => Promise<CallToolResult>;
};

// Factory
export function createTool<TParams = any, TResult = any>(
  handler: ToolHandler<TParams, TResult>,
  formatter?: Partial<ToolResultFormatter<TResult>>
) {
  return async (
    meta: { requestId: string },
    context: ClientContext,
    params: Record<string, unknown>
  ): Promise<CallToolResult> => {
    const ctx: ToolContext = {
      requestId: meta.requestId,
      context,
      logger: createLogger(meta.requestId),
    };

    try {
      const result = await handler(ctx, params as TParams);
      
      const data = formatter?.data ? formatter.data(result) : result;
      const message = formatter?.message 
        ? formatter.message(result, params)
        : "Success";

      return {
        content: [
          { type: "text", text: message },
          { type: "text", text: JSON.stringify(data, null, 2) }
        ],
        structuredContent: {
          success: true,
          data,
          message,
        }
      };
    } catch (error: any) {
      ctx.logger.error(error);
      const errorMessage = error.message || "Erro desconhecido";

      return {
        content: [{ type: "text", text: `❌ ${errorMessage}` }],
        structuredContent: {
          success: false,
          message: errorMessage,
        },
        isError: true,
      };
    }
  };
}