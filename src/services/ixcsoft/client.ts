import type { ClientContext } from "../../context/types";
import { BaseHttpClient } from "../http/BaseHttpClient";
import { ListClientResponseSchema, ListContractResponseSchema, ListDepartmentsResponseSchema } from "./schemas";

export class IxcSoftClient extends BaseHttpClient {
    private readonly clientId: string;

    constructor(context: ClientContext, options?: { logger?: any }) {
        if (!context.ixcsoft) {
            throw new Error("IXCSoft not configured for this client");
        }

        super({
            baseURL: context.ixcsoft.baseUrl,
            headers: {
                Authorization: `Basic ${context.ixcsoft.apiToken}`,
            },
            logger: options?.logger,
        });

        this.clientId = context.clientId;
    }

    // interceptamos o método request pra fazermos uma verificação de erro específica do ixc
    protected override async request<T = any>(config: Parameters<BaseHttpClient["request"]>[0]) {
        const response = await super.request<T>(config);

        const data: any = response.data;

        if (data?.type === "error") {
            this.logger?.error(`[IxcSoftClient] Logical error: ${data?.message ?? "No message"}`, {
                config,
                data,
            });

            throw new Error(
                `Logical error, check logs for more details.`
            );
        }

        return response;
    }

    async getClientById(clientId: string) {
        const response = await this.request({
            method: "GET",
            url: `/webservice/v1/cliente`,
            headers: {
                ixcsoft: "listar",
            },
            data: {
                qtype: "cliente.id",
                query: clientId,
                oper: "=",
                page: "1",
                rp: "1",
            }
        });
        const data = ListClientResponseSchema.parse(response.data);
        return data;
    }

    async getClientByDocument(document: string) {
        const response = await this.request({
            method: "GET",
            url: "/webservice/v1/cliente",
            headers: {
                ixcsoft: "listar",
            },
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

        this.logger?.info("success", {
            clientId: this.clientId,
            total: data.total ?? 0,
            page: data.page,
        });

        return data;
    }

    async getContractsByClient(clientId: string) {
        const response = await this.request({
            method: "GET",
            url: "/webservice/v1/cliente_contrato",
            headers: {
                ixcsoft: "listar",
            },
            data: {
                qtype: "cliente_contrato.id_cliente",
                query: clientId,
                oper: "=",
                page: "1",
                rp: "999",
                sortname: "cliente_contrato.id",
                sortorder: "desc",
                gridParam: [
                    {
                        TB: "cliente_contrato.status",
                        OP: "IN",
                        P: '"A","P","N"',
                    },
                ],
            },
        });
        const data = ListContractResponseSchema.parse(response.data);
        return data;
    }

    async getDepartments() {
        const response = await this.request({
            method: "GET",
            url: "/webservice/v1/su_ticket_setor",
            headers: {
                ixcsoft: "listar",
            },
            data: {
                qtype: "su_ticket_setor.id",
                query: "1",
                oper: ">="
            }
        });
        const data = ListDepartmentsResponseSchema.parse(response.data);
        return data;
    }
}