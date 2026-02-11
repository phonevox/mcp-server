import * as z from "zod";

// things

export const ClientSchema = z
	.object({
		id: z.string(),
		razao: z.string().optional(),
		fantasia: z.string().optional(),
		cnpj_cpf: z.string().optional(),
		tipo_pessoa: z.string().optional(),
		email: z.string().optional(),
		fone: z.string().optional(),
		telefone_celular: z.string().optional(),
		whatsapp: z.string().optional(),
		endereco: z.string().optional(),
		numero: z.string().optional(),
		complemento: z.string().optional(),
		bairro: z.string().optional(),
		cidade: z.string().optional(),
		uf: z.string().optional(),
		cep: z.string().optional(),
		ativo: z.string().optional(),
		data_cadastro: z.string().optional(),
		// vo bota tudo nao man
	})
	.loose();

export const ContractSchema = z
	.object({
		id_instalador: z.string().optional(),
		indicacao_contrato_id: z.string().optional(),
		id_indexador_reajuste: z.string().optional(),
		data_desistencia: z.string().optional(),
		motivo_desistencia: z.string().optional(),
		obs_desistencia: z.string().optional(),
		obs_contrato: z.string().optional(),
		alerta_contrato: z.string().optional(),
		ids_contratos_recorrencia: z.string().optional(),
		id_responsavel_desistencia: z.string().optional(),
		id_responsavel_cancelamento: z.string().optional(),
		id_responsavel_negativacao: z.string().optional(),
		origem_cancelamento: z.string().optional(),
		situacao_financeira_contrato: z.string().optional(),
		dt_ult_desbloq_auto: z.string().optional(),
		dt_ult_desbloq_manual: z.string().optional(),
		aplicar_desconto_tempo_bloqueio: z.string().optional(),
		tempo_permanencia: z.string().optional(),
		id: z.string(),
		id_filial: z.string().optional(),
		status: z.string().optional(),
		status_internet: z.string().optional(),
		id_cliente: z.string().optional(),
		data_assinatura: z.string().optional(),
		data_ativacao: z.string().optional(),
		data: z.string().optional(),
		data_renovacao: z.string().optional(),
		bloqueio_automatico: z.string().optional(),
		imp_carteira: z.string().optional(),
		data_expiracao: z.string().optional(),
		isentar_contrato: z.string().optional(),
		pago_ate_data: z.string().optional(),
		id_vd_contrato: z.string().optional(),
		contrato: z.string().optional(),
		endereco: z.string().optional(),
		numero: z.string().optional(),
		comissao: z.string().optional(),
		bairro: z.string().optional(),
		tipo: z.string().optional(),
		descricao_aux_plano_venda: z.string().optional(),
		aviso_atraso: z.string().optional(),
		id_tipo_contrato: z.string().optional(),
		id_carteira_cobranca: z.string().optional(),
		obs: z.string().optional(),
		id_modelo: z.string().optional(),
		status_velocidade: z.string().optional(),
		id_vendedor: z.string().optional(),
		cc_previsao: z.string().optional(),
		nao_avisar_ate: z.string().optional(),
		nao_bloquear_ate: z.string().optional(),
		id_tipo_documento: z.string().optional(),
		tipo_doc_opc: z.string().optional(),
		desconto_fidelidade: z.string().optional(),
		tipo_doc_opc2: z.string().optional(),
		tipo_doc_opc3: z.string().optional(),
		taxa_improdutiva: z.string().optional(),
		tipo_doc_opc4: z.string().optional(),
		desbloqueio_confianca: z.string().optional(),
		data_negativacao: z.string().optional(),
		data_acesso_desativado: z.string().optional(),
		motivo_cancelamento: z.string().optional(),
		data_cancelamento: z.string().optional(),
		obs_cancelamento: z.string().optional(),
		id_vendedor_ativ: z.string().optional(),
		fidelidade: z.string().optional(),
		tipo_cobranca: z.string().optional(),
		desbloqueio_confianca_ativo: z.string().optional(),
		id_responsavel: z.string().optional(),
		taxa_instalacao: z.string().optional(),
		protocolo_negativacao: z.string().optional(),
		dt_ult_bloq_auto: z.string().optional(),
		dt_ult_bloq_manual: z.string().optional(),
		dt_ult_des_bloq_conf: z.string().optional(),
		dt_ult_ativacao: z.string().optional(),
		avalista_1: z.string().optional(),
		dt_ult_finan_atraso: z.string().optional(),
		avalista_2: z.string().optional(),
		dt_utl_negativacao: z.string().optional(),
		data_cadastro_sistema: z.string().optional(),
		ultima_atualizacao: z.string().optional(),
		complemento: z.string().optional(),
		cep: z.string().optional(),
		imp_importacao: z.string().optional(),
		cidade: z.string().optional(),
		imp_rede: z.string().optional(),
		renovacao_automatica: z.string().optional(),
		imp_bkp: z.string().optional(),
		imp_treinamento: z.string().optional(),
		id_motivo_inclusao: z.string().optional(),
		imp_status: z.string().optional(),
		motivo_inclusao: z.string().optional(),
		imp_obs: z.string().optional(),
		liberacao_bloqueio_manual: z.string().optional(),
		imp_realizado: z.string().optional(),
		contrato_suspenso: z.string().optional(),
		imp_motivo: z.string().optional(),
		imp_inicial: z.string().optional(),
		imp_final: z.string().optional(),
		ativacao_numero_parcelas: z.string().optional(),
		ativacao_vencimentos: z.string().optional(),
		ativacao_valor_parcela: z.string().optional(),
		id_tipo_doc_ativ: z.string().optional(),
		id_produto_ativ: z.string().optional(),
		id_cond_pag_ativ: z.string().optional(),
		endereco_padrao_cliente: z.string().optional(),
		referencia: z.string().optional(),
		id_condominio: z.string().optional(),
		nf_info_adicionais: z.string().optional(),
		assinatura_digital: z.string().optional(),
		tipo_produtos_plano: z.string().optional(),
		bloco: z.string().optional(),
		apartamento: z.string().optional(),
		latitude: z.string().optional(),
		longitude: z.string().optional(),
		num_parcelas_atraso: z.string().optional(),
		dt_ult_desiste: z.string().optional(),
		id_contrato_principal: z.string().optional(),
		gerar_finan_assin_digital_contrato: z.string().optional(),
		credit_card_recorrente_token: z.string().optional(),
		credit_card_recorrente_bandeira_cartao: z.string().optional(),
		id_motivo_negativacao: z.string().optional(),
		obs_negativacao: z.string().optional(),
		restricao_auto_desbloqueio: z.string().optional(),
		motivo_restricao_auto_desbloq: z.string().optional(),
		nao_susp_parc_ate: z.string().optional(),
		liberacao_suspensao_parcial: z.string().optional(),
		utilizando_auto_libera_susp_parc: z.string().optional(),
		restricao_auto_libera_susp_parcial: z.string().optional(),
		motivo_restri_auto_libera_parc: z.string().optional(),
		data_inicial_suspensao: z.string().optional(),
		data_final_suspensao: z.string().optional(),
		data_retomada_contrato: z.string().optional(),
		dt_ult_liberacao_susp_parc: z.string().optional(),
		base_geracao_tipo_doc: z.string().optional(),
		integracao_assinatura_digital: z.string().optional(),
		url_assinatura_digital: z.string().optional(),
		token_assinatura_digital: z.string().optional(),
		testemunha_assinatura_digital: z.string().optional(),
		document_photo: z.string().optional(),
		selfie_photo: z.string().optional(),
		tipo_localidade: z.string().optional(),
		estrato_social_col: z.string().optional(),
		agrupar_financeiro_contrato: z.string().optional(),
		status_recorrencia: z.string().optional(),
	})
	.loose();

export const DepartmentSchema = z
	.object({
		id: z
			.string()
			.max(11, { message: "Max 11 characters" })
			.regex(/^\d+$/, { message: "Numbers only" }),

		setor: z
			.string()
			.min(1, { message: "Required field" })
			.max(200, { message: "Max 200 characters" }),

		email: z
			.string()
			.max(65535, { message: "Max 65535 characters" })
			.nullable()
			.optional()
			.describe("Can be null"),

		presta_atendimento: z.enum(["S", "N"]).default("S").optional().describe("S = Yes, N = No"),

		mostra_hotsite: z.enum(["S", "N"]).default("S").optional().describe("S = Yes, N = No"),

		exige_vinculo_produto: z.enum(["S", "N"]).default("S").optional().describe("S = Yes, N = No"),

		ordem: z
			.string()
			.min(1, { message: "Required field" })
			.max(15, { message: "Max 15 characters" })
			.default("10")
			.describe("Exhibition order (mask: Array)"),

		ativo: z.enum(["S", "N"]).default("S").optional().describe("S = Yes, N = No"),
	})
	.loose();

// responses

export const ListClientResponseSchema = z
	.object({
		page: z.string().optional(),
		total: z.number().optional(), // vsfd kkkkkkkkkkkkkkkkkkkkkkkk pq q essa p@$# é number e nos outros é string
		registros: z.array(ClientSchema).optional(),
	})
	.loose();

export const ListContractResponseSchema = z
	.object({
		page: z.string().optional(),
		total: z.string().optional(),
		registros: z.array(ContractSchema).optional(),
	})
	.loose();

export const ListDepartmentsResponseSchema = z
	.object({
		page: z.string().optional(),
		total: z.string().optional(),
		registros: z.array(DepartmentSchema).optional(),
	})
	.loose();

// fields

export const DocumentSchema = z
	.string()
	.min(1, "Document is required")
	.refine(
		(doc) =>
			/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(doc) || // CPF
			/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(doc), // CNPJ
		{
			message: "Document must be formatted.",
		},
	);
