import type { ToolRegistry } from "@/tools/_core/registry";
import { listarClientesPeloDocumento } from "./listarClientesPeloDocumento";
import { listarContratosPorCliente } from "./listarContratosPorCliente";
import { listarDepartamentos } from "./listarDepartamentos";

export const registry: ToolRegistry = {
	tools: [listarClientesPeloDocumento, listarContratosPorCliente, listarDepartamentos],
};
