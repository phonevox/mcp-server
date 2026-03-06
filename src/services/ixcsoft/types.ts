// src/services/ixcsoft/types.ts
import type { z } from "zod";
import type { ClientSchema, ContractSchema, FaturaSchema } from "@/services/ixcsoft/schemas";

export type Client = z.infer<typeof ClientSchema>;
export type Contract = z.infer<typeof ContractSchema>;
export type Fatura = z.infer<typeof FaturaSchema>;

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
