import { BaseHttpClient } from "@/services/http/BaseHttpClient";
import {
	ListClientResponseSchema,
	ListContractResponseSchema,
	ListDepartmentsResponseSchema,
	ListFaturasResponseSchema,
} from "@/services/ixcsoft/schemas";
import { createLogger } from "@/shared/logger";

const logger = createLogger("ixcsoft.client");

export type IxcSoftConfig = {
	baseURL: string;
	token: string;
};

export class IxcSoftClient extends BaseHttpClient {
	constructor(config: IxcSoftConfig) {
		super({
			baseURL: config.baseURL,
			headers: {
				Authorization: `Basic ${config.token}`,
			},
			logger,
		});
	}

	protected override async request<T = any>(config: Parameters<BaseHttpClient["request"]>[0]) {
		if (config?.data?.grid_param) {
			logger.debug("Stringifying grid_param ->", config.data.grid_param);
			config.data.grid_param = JSON.stringify(config.data.grid_param);
		}
		const response = await super.request<T>(config);
		const data: any = response.data;

		if (data?.type === "error") {
			logger.error(`Logical error: ${data?.message ?? "No message"}`, { config, data });
			throw new Error("Logical error, check logs for more details.");
		}

		return response;
	}

	async getClientById(clientId: string) {
		const response = await this.request({
			method: "GET",
			url: "/webservice/v1/cliente",
			headers: { ixcsoft: "listar" },
			data: {
				qtype: "cliente.id",
				query: clientId,
				oper: "=",
				page: "1",
				rp: "1",
			},
		});
		return ListClientResponseSchema.parse(response.data);
	}

	async getClientByDocument(document: string) {
		const response = await this.request({
			method: "GET",
			url: "/webservice/v1/cliente",
			headers: { ixcsoft: "listar" },
			data: {
				qtype: "cliente.cnpj_cpf",
				query: document,
				oper: "=",
				page: "1",
				rp: "50",
				sortname: "cliente.id",
				sortorder: "asc",
			},
		});
		const data = ListClientResponseSchema.parse(response.data);
		logger.info("getClientByDocument success", { total: data.total ?? 0, page: data.page });
		return data;
	}

	async getContractsByClient(clientId: string) {
		const response = await this.request({
			method: "GET",
			url: "/webservice/v1/cliente_contrato",
			headers: { ixcsoft: "listar" },
			data: {
				qtype: "cliente_contrato.id_cliente",
				query: clientId,
				oper: "=",
				page: "1",
				rp: "999",
				sortname: "cliente_contrato.id",
				sortorder: "desc",
				grid_param: [{ TB: "cliente_contrato.status", OP: "IN", P: '"A","P","N"' }],
			},
		});
		return ListContractResponseSchema.parse(response.data);
	}

	async getDepartments() {
		const response = await this.request({
			method: "GET",
			url: "/webservice/v1/su_ticket_setor",
			headers: { ixcsoft: "listar" },
			data: {
				qtype: "su_ticket_setor.id",
				query: "1",
				oper: ">=",
			},
		});
		return ListDepartmentsResponseSchema.parse(response.data);
	}

	async getFaturasByClient(clientId: string) {
		const response = await this.request({
			method: "GET",
			url: "/webservice/v1/fn_areceber",
			headers: { ixcsoft: "listar" },
			data: {
				qtype: "fn_areceber.id_cliente",
				query: clientId,
				oper: "=",
				page: "1",
				rp: "999",
				sortname: "fn_areceber.data_vencimento",
				sortorder: "desc",
				// grid_param: [{ TB: "fn_areceber.status", OP: "=", P: "A" }],
			},
		});
		return ListFaturasResponseSchema.parse(response.data);
	}

	async getFaturasByContract(contractId: string) {
		const response = await this.request({
			method: "GET",
			url: "/webservice/v1/fn_areceber",
			headers: { ixcsoft: "listar" },
			data: {
				qtype: "fn_areceber.id_contrato",
				query: contractId,
				oper: "=",
				page: "1",
				rp: "999",
				sortname: "fn_areceber.data_vencimento",
				sortorder: "desc",
				// @NOTE: vou listar todas as faturas e deixar a responsabilidade de filtrar abertas/vencidas para o usuário
				// grid_param: [
				// 	{ TB: "fn_areceber.status", OP: "=", P: "A" } ,
				// 	{ TB: "fn_areceber.data_vencimento", OP: "<", P: new Date().toISOString().substr(0, 10) + " 00:00:00"}
				// ],
			},
		});
		return ListFaturasResponseSchema.parse(response.data);
	}
}
