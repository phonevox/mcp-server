import axios, { type AxiosInstance, type AxiosError } from "axios";
import { createLogger } from "../../util/logger";
import type { ClientContext } from "../../context/types";
import * as IxcSchemas from "./schemas";
import type * as IxcTypes from "./types";
import * as z from "zod";
import type { Logger } from "pino";

type LoggerLike = {
    debug: (msg: string, obj?: any) => void;
    info: (msg: string, obj?: any) => void;
    warn: (msg: string, obj?: any) => void;
    error: (msg: string, obj?: any) => void;
}

export class IxcSoftClient {
    private axiosInstance: AxiosInstance;
    private clientId: string;
    private logger: LoggerLike;

    constructor(context: ClientContext, options?: { logger?: LoggerLike; apiToken?: string }) {
        /*
            Isso é opcional. Colocando aqui só pra caso for copiar esse service para outro projeto
            Essa parte aqui (constructor) é usada pra "fixar" uma base do IXC Soft neste client. clientId é um identificador opcional
            export interface ClientContext {
                clientId: string;
                ixcsoft?: {
                    baseUrl: string;
                    apiToken: string;
                };
            }
        */
        this.logger = options?.logger || {
            debug: () => {},
            info: () => {},
            warn: () => {},
            error: (msg, meta) => console.error(`[IxcSoftClient] ${msg}`, meta),
        };
        if (!context.ixcsoft) {
            throw new Error("IXCSoft não está configurado para este cliente");
        }

        this.clientId = context.clientId;
        this.axiosInstance = axios.create({
            baseURL: context.ixcsoft.baseUrl,
            timeout: 15000,
            headers: {
                Authorization: `Basic ${context.ixcsoft.apiToken}`,
                "Content-Type": "application/json",
            },
        });

        this.setupInterceptors();
    }

    private setupInterceptors() {
        // Request interceptor
        this.axiosInstance.interceptors.request.use(
            (config) => {
                this.logger.debug("IXCSoft API request", {
                    clientId: this.clientId,
                    method: config.method?.toUpperCase(),
                    url: config.url,
                    headers: config.headers?.ixcsoft,
                });
                return config;
            },
            (error) => {
                this.logger.error("Request interceptor error", {
                    error,
                    clientId: this.clientId,
                });
                return Promise.reject(error);
            },
        );

        // Response interceptor
        this.axiosInstance.interceptors.response.use(
            (response) => {
                this.logger.debug("IXCSoft API response", {
                    clientId: this.clientId,
                    status: response.status,
                    dataSize: JSON.stringify(response.data).length,
                });
                return response;
            },
            (error: AxiosError) => {
                this.logger.error("IXCSoft API error", {
                    clientId: this.clientId,
                    status: error.response?.status,
                    message: error.message,
                    data: error.response?.data,
                });
                return Promise.reject(error);
            },
        );
    }

    /**
     * Método genérico para fazer requisições ao IXCSoft
     */
    private async makeRequest<T>(
        method: "GET" | "POST",
        endpoint: string,
        params: Partial<IxcTypes.RequestParams>,
        schema: z.ZodType<T>,
        operationName: string
    ): Promise<T> {
        this.logger.info(operationName, {
            clientId: this.clientId,
            method,
            endpoint,
            params,
        });

        try {
            const response = await this.axiosInstance({
                method: method,
                url: endpoint,
                headers: {
                    ixcsoft: "listar",
                },
                data: params,
            });

            this.logger.debug(`${operationName} - Resposta da requisição`, {
                clientId: this.clientId,
                status: response.status,
                dataSize: JSON.stringify(response.data).length,
                data: response.data,
            });

            // Valida e parseia a resposta
            const validatedData = schema.parse(response.data);

            this.logger.info(`${operationName} - Sucesso`, {
                clientId: this.clientId,
                total: (validatedData as any).total ?? 0,
                page: (validatedData as any).page,
            });

            return validatedData;
        } catch (error) {
            this.handleError(error, operationName);
            throw error;
        }
    }

    /**
     * Handler centralizado de erros
     */
    private handleError(error: unknown, operation: string): never {
        if (axios.isAxiosError(error)) {
            const errorData = error.response?.data as any;
            const errorMessage =
                errorData?.mensagem ||
                errorData?.erro ||
                error.message ||
                "Erro desconhecido ao consultar IXCSoft";

            this.logger.error(`${operation} - Erro na requisição IXCSoft`, {
                clientId: this.clientId,
                status: error.response?.status,
                message: errorMessage,
                data: errorData,
            });

            throw new Error(errorMessage);
        }

        this.logger.error(`${operation} - Erro inesperado`, {
            error,
            clientId: this.clientId,
        });

        throw error;
    }

    /**
     * Método genérico para buscar por qualquer campo
     */
    async search<T>(
        method: "GET" | "POST",
        endpoint: string,
        qtype: string,
        query: string,
        schema: z.ZodType<T>,
        options?: {
            operator?: IxcTypes.RequestParams["oper"];
            page?: number;
            limit?: number;
            sortname?: string;
            sortorder?: "asc" | "desc";
            gridParam?: any[];
        }
    ): Promise<T> {
        const params: IxcTypes.RequestParams = {
            qtype,
            query,
            oper: options?.operator || "=",
            page: (options?.page || 1).toString(),
            rp: (options?.limit || 50).toString(),
            sortname: options?.sortname || "id",
            sortorder: options?.sortorder || "asc",
            ...(options?.gridParam && {
                grid_param: JSON.stringify(options.gridParam),
            }),
        };

        return this.makeRequest(
            method,
            endpoint,
            params,
            schema,
            `Buscando em ${endpoint}`
        );
    }

    // public methods

    async getClientById(id: string): Promise<z.infer<typeof IxcSchemas.ListClientResponseSchema>> {
        return this.search(
            "GET",
            "/webservice/v1/cliente",
            "cliente.id",
            id,
            IxcSchemas.ListClientResponseSchema
        );
    }

    async getClientByDocument(documento: string): Promise<z.infer<typeof IxcSchemas.ListClientResponseSchema>> {
        return this.search(
            "GET",
            "/webservice/v1/cliente",
            "cliente.cnpj_cpf",
            documento,
            IxcSchemas.ListClientResponseSchema,
            {
                page: 1,
                limit: 50,
                sortname: "cliente.id",
                sortorder: "asc",
            }
        );
    }

    async getContractsByClient(clientId: string): Promise<z.infer<typeof IxcSchemas.ListContractResponseSchema>> {
        return this.search(
            "GET",
            "/webservice/v1/cliente_contrato",
            "cliente_contrato.id_cliente",
            clientId,
            IxcSchemas.ListContractResponseSchema,
            {
                page: 1,
                limit: 999,
                sortname: "cliente_contrato.id",
                sortorder: "desc",
                gridParam: [
                    {
                        TB: "cliente_contrato.status",
                        OP: "IN",
                        P: '"A","P","N"',
                    },
                ],
            }
        );
    }

    async getDepartments(): Promise<z.infer<typeof IxcSchemas.ListDepartmentsResponseSchema>> {
        return this.search(
            "GET",
            "/webservice/v1/su_ticket_setor",
            "su_ticket_setor.id",
            "1",
            IxcSchemas.ListDepartmentsResponseSchema,
            {
                operator: ">="
            }
        );
    }
}