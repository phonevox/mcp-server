import axios, { type AxiosInstance, type AxiosError, type AxiosRequestConfig, type AxiosResponse } from "axios";

export interface CustomRequestConfig extends AxiosRequestConfig {
    forceBody?: boolean;  // force body on get request
}

export interface HttpClientOptions {
    baseURL: string;
    timeout?: number;
    headers?: Record<string, string>;
    logger?: any | null;
}

export abstract class BaseHttpClient {
    protected readonly axios: AxiosInstance;
    protected readonly logger: any | null;

    constructor(options: HttpClientOptions) {
        this.logger = options.logger ?? null;

        this.axios = axios.create({
            baseURL: options.baseURL,
            timeout: options.timeout ?? 15000,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers ?? {}),
            },
        });

        this.setupInterceptors();
    }

    private setupInterceptors() {
        if (!this.logger) return;

        // Request interceptor
        this.axios.interceptors.request.use(
            (config) => {
                this.logger!.debug("HTTP → request", {
                    method: config.method?.toUpperCase(),
                    url: config.url,
                    // params: config.params,
                    // data: config.data,
                });
                return config;
            },
            (err) => {
                this.logger!.error("HTTP → request interceptor error", { error: err });
                return Promise.reject(err);
            }
        );

        // Response interceptor
        this.axios.interceptors.response.use(
            (res) => {
                this.logger!.debug("HTTP ← response", {
                    status: res.status,
                    dataSize: JSON.stringify(res.data ?? {}).length,
                });
                return res;
            },
            (err: AxiosError) => {
                this.logger!.error("HTTP ← error", {
                    status: err.response?.status,
                    message: err.message,
                    // data: err.response?.data,
                });
                return Promise.reject(err);
            }
        );
    }

    protected async request<T = any>(
        config: CustomRequestConfig
    ): Promise<AxiosResponse<T>> {
        const method = (config.method || "get").toUpperCase();
        const url = config.url ?? "sem-url";

        if (method === "GET" && config.data) {
            this.logger?.warn('Your GET request has a body (this is against standards)');
        }

        try {
            const response = await this.axios(config);
            return response;
        } catch (err) {
            this.handleRequestError(err, { method, url });
            throw err;
        }
    }

    protected async requestData<T = any>(
        config: AxiosRequestConfig
    ): Promise<T> {
        const response = await this.request<T>(config);
        return response.data;
    }

    private handleRequestError(error: unknown, context: { method: string; url: string }): void {
        if (!this.logger) return;

        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            let message = error.message || "Erro na requisição HTTP";

            const errData = error.response?.data;
            if (errData && typeof errData === "object") {
                message =
                    (errData as any).mensagem ??
                    (errData as any).erro ??
                    (errData as any).message ??
                    message;
            }

            this.logger.error(`request falhou`, {
                ...context,
                status,
                message,
                // data: errData,           // descomente só se for seguro
            });
        } else {
            this.logger.error(`request erro inesperado`, {
                ...context,
                error,
            });
        }
    }
}