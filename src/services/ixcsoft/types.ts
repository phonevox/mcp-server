// src/services/ixcsoft/types.ts
import type { z } from "zod";
import type { ClientSchema, ListClientResponseSchema, ContractSchema, ListContractResponseSchema } from "./schemas";

export type Client = z.infer<typeof ClientSchema>;
export type ListClientResponse = z.infer<typeof ListClientResponseSchema>;
export type Contract = z.infer<typeof ContractSchema>;
export type ListContractResponse = z.infer<typeof ListContractResponseSchema>;

export interface IxcApiError {
  mensagem?: string;
  erro?: string;
  message?: string;
}

export interface RequestParams {
  qtype: string;
  query: string;
  oper: "=" | ">" | "<" | ">=" | "<=" | "!=" | "IN" | "L";
  page: string;
  rp: string;
  sortname?: string;
  sortorder?: "asc" | "desc";
  grid_param?: string;
}