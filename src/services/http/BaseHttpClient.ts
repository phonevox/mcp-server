import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import axios from "axios";
import type { Logger } from "@/shared/logger";

export interface CustomRequestConfig extends AxiosRequestConfig {
	forceBody?: boolean;
}

export interface HttpClientOptions {
	baseURL: string;
	timeout?: number;
	headers?: Record<string, string>;
	logger?: Logger | null;
}

export abstract class BaseHttpClient {
	protected readonly axios: AxiosInstance;
	protected readonly logger: Logger | null;

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

		this.axios.interceptors.request.use(
			(config) => {
				// params vem de config.params (query string) ou config.data (body/GET não-convencional)
				const params = config.params ?? config.data ?? undefined;

				this.logger?.debug(`→ ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
					...(params !== undefined && { params }),
				});

				return config;
			},
			(err) => {
				this.logger?.error("Request interceptor error", { error: err });
				return Promise.reject(err);
			},
		);

		this.axios.interceptors.response.use(
			(res) => {
				this.logger?.debug(`← ${res.status} ${res.config.baseURL}${res.config.url}`, {
					dataSize: JSON.stringify(res.data ?? {}).length,
				});
				return res;
			},
			(err: AxiosError) => {
				this.logger?.error(
					`← ${err.response?.status ?? "ERR"} ${err.config?.baseURL}${err.config?.url}`,
					{
						message: err.message,
						data: err.response?.data,
					},
				);
				return Promise.reject(err);
			},
		);
	}

	protected async request<T = any>(config: CustomRequestConfig): Promise<AxiosResponse<T>> {
		const method = (config.method || "get").toUpperCase();
		const url = config.url ?? null;

		try {
			return await this.axios(config);
		} catch (err) {
			this.handleRequestError(err, { method, url });
			throw err;
		}
	}

	protected async requestData<T = any>(config: AxiosRequestConfig): Promise<T> {
		const response = await this.request<T>(config);
		return response.data;
	}

	private handleRequestError(
		error: unknown,
		context: { method: string; url: string | null },
	): void {
		if (!this.logger) return;

		if (axios.isAxiosError(error)) {
			const status = error.response?.status;
			const errData = error.response?.data;
			const message =
				(errData as any)?.mensagem ??
				(errData as any)?.erro ??
				(errData as any)?.message ??
				error.message ??
				"HTTP request error";

			this.logger.error(`Request failed: ${context.method} ${context.url}`, {
				status,
				message,
			});
		} else {
			this.logger.error(`Unexpected error: ${context.method} ${context.url}`, { error });
		}
	}
}
