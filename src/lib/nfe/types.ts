// =====================================================
// PAC OFICINAS - Tipos para NF-e (Focus NFe)
// =====================================================

import {
    TIPO_DOCUMENTO,
    FINALIDADE_EMISSAO,
    LOCAL_DESTINO,
    CONSUMIDOR_FINAL,
    PRESENCA_COMPRADOR,
    REGIME_TRIBUTARIO,
    INDICADOR_IE_DESTINATARIO,
    MODALIDADE_FRETE,
    ICMS_ORIGEM,
    STATUS_NFE,
} from './constants';

// =====================================================
// Tipos para envio de NF-e
// =====================================================

export interface NFeDadosGerais {
    natureza_operacao: string;
    data_emissao: string; // ISO format
    data_entrada_saida?: string;
    tipo_documento: typeof TIPO_DOCUMENTO[keyof typeof TIPO_DOCUMENTO];
    finalidade_emissao: typeof FINALIDADE_EMISSAO[keyof typeof FINALIDADE_EMISSAO];
    local_destino?: typeof LOCAL_DESTINO[keyof typeof LOCAL_DESTINO];
    consumidor_final?: typeof CONSUMIDOR_FINAL[keyof typeof CONSUMIDOR_FINAL];
    presenca_comprador?: typeof PRESENCA_COMPRADOR[keyof typeof PRESENCA_COMPRADOR];
}

export interface NFeEmitente {
    cnpj_emitente?: string;
    cpf_emitente?: string;
    nome_emitente: string;
    nome_fantasia_emitente?: string;
    inscricao_estadual_emitente: string;
    regime_tributario_emitente?: typeof REGIME_TRIBUTARIO[keyof typeof REGIME_TRIBUTARIO];
    logradouro_emitente: string;
    numero_emitente: string;
    complemento_emitente?: string;
    bairro_emitente: string;
    municipio_emitente: string;
    uf_emitente: string;
    cep_emitente: string;
    telefone_emitente?: string;
}

export interface NFeDestinatario {
    nome_destinatario: string;
    cnpj_destinatario?: string;
    cpf_destinatario?: string;
    inscricao_estadual_destinatario?: string;
    indicador_inscricao_estadual_destinatario?: typeof INDICADOR_IE_DESTINATARIO[keyof typeof INDICADOR_IE_DESTINATARIO];
    email_destinatario?: string;
    telefone_destinatario?: string;
    logradouro_destinatario: string;
    numero_destinatario: string;
    complemento_destinatario?: string;
    bairro_destinatario: string;
    municipio_destinatario: string;
    uf_destinatario: string;
    cep_destinatario: string;
    pais_destinatario?: string;
}

export interface NFeItem {
    numero_item: number;
    codigo_produto: string;
    descricao: string;
    cfop: number;
    ncm?: string;
    codigo_ncm?: string;
    unidade_comercial: string;
    quantidade_comercial: number;
    valor_unitario_comercial: number;
    valor_bruto: number;
    unidade_tributavel?: string;
    quantidade_tributavel?: number;
    valor_unitario_tributavel?: number;
    inclui_no_total?: 0 | 1;
    // ICMS
    icms_origem: typeof ICMS_ORIGEM[keyof typeof ICMS_ORIGEM];
    icms_situacao_tributaria: number;
    icms_aliquota?: number;
    icms_base_calculo?: number;
    icms_valor?: number;
    // PIS
    pis_situacao_tributaria: string;
    pis_aliquota?: number;
    pis_valor?: number;
    // COFINS
    cofins_situacao_tributaria: string;
    cofins_aliquota?: number;
    cofins_valor?: number;
}

export interface NFeTransporte {
    modalidade_frete: typeof MODALIDADE_FRETE[keyof typeof MODALIDADE_FRETE];
    cnpj_transportador?: string;
    cpf_transportador?: string;
    nome_transportador?: string;
    inscricao_estadual_transportador?: string;
    endereco_transportador?: string;
    municipio_transportador?: string;
    uf_transportador?: string;
    // Veículo
    placa_veiculo?: string;
    uf_veiculo?: string;
    // Volumes
    quantidade_volumes?: number;
    especie_volumes?: string;
    peso_liquido?: number;
    peso_bruto?: number;
}

export interface NFePagamento {
    indicador_pagamento?: 0 | 1; // 0 = à vista, 1 = a prazo
    forma_pagamento: string;
    valor_pagamento: number;
    // Cartão
    cnpj_credenciadora?: string;
    bandeira_operadora?: string;
    numero_autorizacao?: string;
}

export interface NFePayload extends NFeDadosGerais, NFeEmitente, NFeDestinatario {
    items: NFeItem[];
    modalidade_frete: typeof MODALIDADE_FRETE[keyof typeof MODALIDADE_FRETE];
    valor_frete?: number;
    valor_seguro?: number;
    valor_desconto?: number;
    valor_outras_despesas?: number;
    valor_produtos?: number;
    valor_total?: number;
    informacoes_complementares?: string;
    formas_pagamento?: NFePagamento[];
    transporte?: NFeTransporte;
}

// =====================================================
// Tipos de resposta da API
// =====================================================

export interface NFeResponse {
    cnpj_emitente: string;
    ref: string;
    status: typeof STATUS_NFE[keyof typeof STATUS_NFE];
    status_sefaz?: string;
    mensagem_sefaz?: string;
    chave_nfe?: string;
    numero?: string;
    serie?: string;
    caminho_xml_nota_fiscal?: string;
    caminho_danfe?: string;
    caminho_xml_cancelamento?: string;
    caminho_xml_carta_correcao?: string;
    caminho_pdf_carta_correcao?: string;
    numero_carta_correcao?: number;
}

export interface NFeErroResponse {
    codigo: string;
    mensagem: string;
    erros?: Array<{
        mensagem: string;
        campo: string | null;
    }>;
}

export interface NFeCancelamentoResponse {
    status: 'cancelado' | 'erro_cancelamento';
    status_sefaz: string;
    mensagem_sefaz: string;
    caminho_xml_cancelamento?: string;
}

export interface NFeCartaCorrecaoResponse {
    status: 'autorizado' | 'erro_autorizacao';
    status_sefaz: string;
    mensagem_sefaz: string;
    caminho_xml_carta_correcao?: string;
    caminho_pdf_carta_correcao?: string;
    numero_carta_correcao?: number;
}

export interface NFeInutilizacaoPayload {
    cnpj: string;
    serie: string;
    numero_inicial: number;
    numero_final: number;
    justificativa: string;
}

export interface NFeInutilizacaoResponse {
    status: 'autorizado' | 'erro_autorizacao';
    status_sefaz: string;
    mensagem_sefaz: string;
    serie: string;
    numero_inicial: number;
    numero_final: number;
    modelo: string;
    cnpj: string;
    caminho_xml?: string;
    protocolo_sefaz?: string;
}
