import type { ToolRegistry } from "@/tools/_core/registry";
import { enviarFatura } from "./enviarFatura";
import { listarClientesPeloCelular } from "./listarClientesPeloCelular";
import { listarClientesPeloDocumento } from "./listarClientesPeloDocumento";
import { listarContratosPorCliente } from "./listarContratosPorCliente";
import { listarDepartamentos } from "./listarDepartamentos";
import { listarFaturasPorCliente } from "./listarFaturasPorCliente";
import { listarFaturasPorContrato } from "./listarFaturasPorContrato";

export const registry: ToolRegistry = {
	tools: [
		listarFaturasPorCliente,
		listarClientesPeloDocumento,
		listarClientesPeloCelular,
		listarContratosPorCliente,
		listarDepartamentos,
		listarFaturasPorContrato,
		enviarFatura,
	],
};
