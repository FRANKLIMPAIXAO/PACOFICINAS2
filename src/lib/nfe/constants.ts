// =====================================================
// PAC OFICINAS - Constantes da API Focus NFe
// =====================================================

// URLs da API Focus NFe
export const FOCUS_NFE_URLS = {
    homologacao: 'https://homologacao.focusnfe.com.br',
    producao: 'https://api.focusnfe.com.br',
} as const;

// Endpoints da API
export const NFE_ENDPOINTS = {
    // NF-e
    nfe: '/v2/nfe',
    inutilizacao: '/v2/nfe/inutilizacao',
    inutilizacoes: '/v2/nfe/inutilizacoes',
    importacao: '/v2/nfe/importacao',
    danfePreview: '/v2/nfe/danfe',
} as const;

// Tipo de documento
export const TIPO_DOCUMENTO = {
    ENTRADA: 0,
    SAIDA: 1,
} as const;

// Finalidade de emissão
export const FINALIDADE_EMISSAO = {
    NORMAL: 1,
    COMPLEMENTAR: 2,
    AJUSTE: 3,
    DEVOLUCAO: 4,
} as const;

// Local de destino
export const LOCAL_DESTINO = {
    INTERNA: 1,
    INTERESTADUAL: 2,
    EXTERIOR: 3,
} as const;

// Indicador de consumidor final
export const CONSUMIDOR_FINAL = {
    NORMAL: 0,
    CONSUMIDOR_FINAL: 1,
} as const;

// Presença do comprador
export const PRESENCA_COMPRADOR = {
    NAO_APLICA: 0,
    PRESENCIAL: 1,
    INTERNET: 2,
    TELEATENDIMENTO: 3,
    ENTREGA_DOMICILIO: 4,
    OUTROS: 9,
} as const;

// Regime tributário
export const REGIME_TRIBUTARIO = {
    SIMPLES_NACIONAL: 1,
    SIMPLES_EXCESSO: 2,
    REGIME_NORMAL: 3,
} as const;

// Indicador de IE do destinatário
export const INDICADOR_IE_DESTINATARIO = {
    CONTRIBUINTE: 1,
    ISENTO: 2,
    NAO_CONTRIBUINTE: 9,
} as const;

// Modalidade de frete
export const MODALIDADE_FRETE = {
    EMITENTE: 0,
    DESTINATARIO: 1,
    TERCEIROS: 2,
    SEM_FRETE: 9,
} as const;

// Origem do ICMS
export const ICMS_ORIGEM = {
    NACIONAL: 0,
    ESTRANGEIRA_DIRETA: 1,
    ESTRANGEIRA_MERCADO_INTERNO: 2,
    NACIONAL_40_ESTRANGEIRO: 3,
    NACIONAL_PROCESSOS_BASICOS: 4,
    NACIONAL_MENOS_40_ESTRANGEIRO: 5,
    ESTRANGEIRA_DIRETA_SEM_SIMILAR: 6,
    ESTRANGEIRA_MERCADO_SEM_SIMILAR: 7,
} as const;

// Situação tributária do ICMS para Simples Nacional
export const ICMS_SITUACAO_TRIBUTARIA_SN = {
    TRIBUTADA_CREDITO: 101,
    TRIBUTADA_SEM_CREDITO: 102,
    ISENTA_FAIXA: 103,
    TRIBUTADA_CREDITO_ST: 201,
    TRIBUTADA_SEM_CREDITO_ST: 202,
    ISENTA_FAIXA_ST: 203,
    IMUNE: 300,
    NAO_TRIBUTADA: 400,
    SUBSTITUIDO: 500,
    OUTRAS: 900,
} as const;

// Situação tributária do PIS/COFINS
export const PIS_COFINS_SITUACAO = {
    TRIBUTAVEL_NORMAL: '01',
    TRIBUTAVEL_DIFERENCIADA: '02',
    TRIBUTAVEL_UNIDADE: '03',
    MONOFASICA_ZERO: '04',
    SUBSTITUICAO: '05',
    ALIQUOTA_ZERO: '06',
    ISENTA: '07',
    SEM_INCIDENCIA: '08',
    SUSPENSA: '09',
    OUTRAS_SAIDA: '49',
    OUTRAS: '99',
} as const;

// Status da NF-e
export const STATUS_NFE = {
    PROCESSANDO: 'processando_autorizacao',
    AUTORIZADO: 'autorizado',
    CANCELADO: 'cancelado',
    ERRO: 'erro_autorizacao',
    DENEGADO: 'denegado',
} as const;

// Formas de pagamento
export const FORMAS_PAGAMENTO = {
    DINHEIRO: '01',
    CHEQUE: '02',
    CARTAO_CREDITO: '03',
    CARTAO_DEBITO: '04',
    CARTAO_LOJA: '05',
    VALE_ALIMENTACAO: '10',
    VALE_REFEICAO: '11',
    VALE_PRESENTE: '12',
    VALE_COMBUSTIVEL: '13',
    DUPLICATA: '14',
    BOLETO: '15',
    DEPOSITO: '16',
    PIX_DINAMICO: '17',
    TRANSFERENCIA: '18',
    CASHBACK: '19',
    PIX_ESTATICO: '20',
    CREDITO_LOJA: '21',
    SEM_PAGAMENTO: '90',
    OUTROS: '99',
} as const;
