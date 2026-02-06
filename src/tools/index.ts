import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ClientContext } from "../context/types";
import { getClientByDocument, getClientByDocumentSchema } from "./ixcsoft/getClientByDocument";
import * as z from "zod/v4";
import { getClientContracts, getClientContractsSchema } from "./ixcsoft/getContractsByClient";
import { getDepartments, getDepartmentsSchema } from "./ixcsoft/getDepartments";

// import { getProducts, getProductsSchema } from "./ixcsoft/get-products.js";

export function registerTools(server: McpServer, context: ClientContext, requestId?: string) {


  // IXCSoft tools
  if (context.ixcsoft) {
    server.registerTool(
      "ixcsoft_get_client_by_document",
      getClientByDocumentSchema,
      async (params) => getClientByDocument({ requestId }, context, params)
    );

    server.registerTool(
      "ixcsoft_get_client_contracts_by_client",
      getClientContractsSchema,
      async (params) => getClientContracts({ requestId }, context, params)
    );

    server.registerTool(
      "ixcsoft_list_departments",
      getDepartmentsSchema,
      async (params) => getDepartments({ requestId }, context)
    )

  }

  // Outras tools que não dependem de contexto específico
  server.registerTool(
    "echo",
    {
      description: "Echoes back the provided message",
      inputSchema: z.object({
        message: z.string(),
      }),
      outputSchema: z.object({
        echo: z.string(),
      }),
    },
    async ({ message }) => ({
      content: [{ type: "text", text: message }],
      structuredContent: { echo: message },
    })
  );
}