import { tool as getClientByDocument } from "@/tools/ixcsoft/getClientsByDocument";
import { tool as getClientContracts } from "@/tools/ixcsoft/getContractsByClient";
import { tool as getDepartments } from "@/tools/ixcsoft/getDepartments";

export const tools = [getClientByDocument, getClientContracts, getDepartments];
