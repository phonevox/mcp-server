import { tool as getClientByDocument } from "./getClientsByDocument";
import { tool as getClientContracts } from "./getContractsByClient";
import { tool as getDepartments } from "./getDepartments";

export const tools = [
    getClientByDocument,
    getClientContracts,
    getDepartments
];