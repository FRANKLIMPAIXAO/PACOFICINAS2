// =====================================================
// PAC OFICINAS - Constantes da API NFS-e Nacional
// =====================================================

// URLs da API NFS-e Nacional
export const NFSE_API_URLS = {
    homologacao: 'https://adn.producaorestrita.nfse.gov.br',
    producao: 'https://adn.nfse.gov.br',
} as const;

// Endpoints da API
export const NFSE_ENDPOINTS = {
    // Parâmetros Municipais
    parametrosMunicipais: '/contribuintes/parametros_municipais',

    // NFS-e
    nfse: '/contribuintes/nfse',

    // DPS
    dps: '/contribuintes/dps',

    // Eventos
    eventos: '/contribuintes/eventos',
} as const;

// Códigos IBGE dos municípios conveniados de Goiás
export const MUNICIPIOS_GO = {
    GOIANIA: '5208707',
    APARECIDA_DE_GOIANIA: '5201405',
} as const;

// Códigos de serviço mais comuns para oficinas (LC 116)
export const CODIGOS_SERVICO_OFICINAS = [
    { codigo: '14.01', descricao: 'Lubrificação, limpeza, lustração, revisão, carga e recarga, conserto, restauração, blindagem, manutenção e conservação de máquinas, veículos, aparelhos, equipamentos, motores, elevadores ou de qualquer objeto' },
    { codigo: '14.14', descricao: 'Guincho intramunicipal, guindaste e içamento' },
] as const;

// Regimes especiais de tributação
export const REGIMES_ESPECIAIS = {
    NENHUM: 0,
    MICROEMPRESA_MUNICIPAL: 1,
    ESTIMATIVA: 2,
    SOCIEDADE_PROFISSIONAIS: 3,
    COOPERATIVA: 4,
    MEI: 5,
    MEME: 6, // ME ou EPP do Simples Nacional
} as const;

// Códigos de cancelamento
export const CODIGOS_CANCELAMENTO = {
    ERRO_EMISSAO: 1,
    SERVICO_NAO_PRESTADO: 2,
    ERRO_ASSINATURA: 3,
    DUPLICIDADE: 4,
    ERRO_PROCESSAMENTO: 5,
} as const;

// Versão do leiaute
export const VERSAO_LEIAUTE = '1.00';
