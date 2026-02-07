// =====================================================
// PAC OFICINAS - Builder de Payload NF-e
// =====================================================

import type { Empresa, OrdemServico, Cliente, Produto, Servico } from '@/types';
import type { NFePayload, NFeItem, NFePagamento } from './types';
import {
    TIPO_DOCUMENTO,
    FINALIDADE_EMISSAO,
    CONSUMIDOR_FINAL,
    PRESENCA_COMPRADOR,
    REGIME_TRIBUTARIO,
    INDICADOR_IE_DESTINATARIO,
    MODALIDADE_FRETE,
    ICMS_ORIGEM,
    ICMS_SITUACAO_TRIBUTARIA_SN,
    PIS_COFINS_SITUACAO,
    FORMAS_PAGAMENTO,
} from './constants';

export interface DadosNFeFromOS {
    empresa: Empresa;
    os: OrdemServico;
    cliente: Cliente;
    itens: Array<{
        produto?: Produto;
        servico?: Servico;
        quantidade: number;
        valorUnitario: number;
        valorTotal: number;
        cfop?: number;
        ncm?: string;
    }>;
    naturezaOperacao?: string;
    informacoesComplementares?: string;
}

/**
 * Mapeia regime tributário do sistema para código Focus NFe
 */
function mapearRegimeTributario(regime: string): number {
    const map: Record<string, number> = {
        'simples_nacional': REGIME_TRIBUTARIO.SIMPLES_NACIONAL,
        'mei': REGIME_TRIBUTARIO.SIMPLES_NACIONAL,
        'lucro_presumido': REGIME_TRIBUTARIO.REGIME_NORMAL,
        'lucro_real': REGIME_TRIBUTARIO.REGIME_NORMAL,
    };
    return map[regime] || REGIME_TRIBUTARIO.SIMPLES_NACIONAL;
}

/**
 * Limpa CPF/CNPJ removendo formatação
 */
function limparDocumento(doc: string | null): string {
    return (doc || '').replace(/\D/g, '');
}

/**
 * Limpa CEP removendo formatação
 */
function limparCep(cep: string | null): string {
    return (cep || '').replace(/\D/g, '');
}

/**
 * Determina o CFOP baseado no tipo de operação e localidade
 * Para venda de produtos dentro do estado
 */
function determinarCFOP(ufEmitente: string, ufDestinatario: string, isServico: boolean): number {
    // Serviços não possuem CFOP de NFe (usam NFS-e)
    // Mas caso inclua serviço em NFe, usar 5.933 ou 6.933
    if (isServico) {
        return ufEmitente === ufDestinatario ? 5933 : 6933;
    }

    // Venda de mercadoria
    if (ufEmitente === ufDestinatario) {
        return 5102; // Venda dentro do estado
    }
    return 6102; // Venda interestadual
}

/**
 * Formata data para ISO 8601
 */
function formatarDataISO(data: Date = new Date()): string {
    return data.toISOString();
}

/**
 * Constrói o payload de NF-e a partir dos dados da OS
 */
export function buildNFePayload(dados: DadosNFeFromOS): NFePayload {
    const { empresa, os, cliente, itens, naturezaOperacao, informacoesComplementares } = dados;

    const regimeTributario = mapearRegimeTributario(empresa.regime_tributario);
    const isSimples = regimeTributario === REGIME_TRIBUTARIO.SIMPLES_NACIONAL;
    const ufEmitente = empresa.uf || 'GO';
    const ufDestinatario = cliente.uf || 'GO';
    const isInterestadual = ufEmitente !== ufDestinatario;

    // Calcular totais
    const valorProdutos = itens.reduce((sum, item) => sum + item.valorTotal, 0);

    // Construir itens
    const nfeItens: NFeItem[] = itens.map((item, index) => {
        const isServico = !!item.servico && !item.produto;
        const cfop = item.cfop || determinarCFOP(ufEmitente, ufDestinatario, isServico);
        const ncm = item.ncm || item.produto?.ncm || '99999999'; // NCM genérico se não informado

        return {
            numero_item: index + 1,
            codigo_produto: item.produto?.codigo || item.servico?.codigo || `ITEM-${index + 1}`,
            descricao: item.produto?.descricao || item.servico?.descricao || 'Item',
            cfop,
            codigo_ncm: ncm,
            unidade_comercial: item.produto?.unidade || 'UN',
            quantidade_comercial: item.quantidade,
            valor_unitario_comercial: item.valorUnitario,
            valor_bruto: item.valorTotal,
            unidade_tributavel: item.produto?.unidade || 'UN',
            quantidade_tributavel: item.quantidade,
            valor_unitario_tributavel: item.valorUnitario,
            inclui_no_total: 1,
            // ICMS - Simples Nacional
            icms_origem: ICMS_ORIGEM.NACIONAL,
            icms_situacao_tributaria: isSimples
                ? ICMS_SITUACAO_TRIBUTARIA_SN.TRIBUTADA_SEM_CREDITO
                : 41, // Não tributada (regime normal)
            // PIS
            pis_situacao_tributaria: isSimples
                ? PIS_COFINS_SITUACAO.OUTRAS : PIS_COFINS_SITUACAO.ISENTA,
            // COFINS
            cofins_situacao_tributaria: isSimples
                ? PIS_COFINS_SITUACAO.OUTRAS : PIS_COFINS_SITUACAO.ISENTA,
        };
    });

    // Forma de pagamento (padrão: dinheiro à vista)
    const formasPagamento: NFePagamento[] = [{
        indicador_pagamento: 0, // À vista
        forma_pagamento: FORMAS_PAGAMENTO.DINHEIRO,
        valor_pagamento: valorProdutos,
    }];

    // Determinar indicador de IE do destinatário
    const cpfCnpjDestinatario = limparDocumento(cliente.cpf_cnpj);
    const isPJ = cpfCnpjDestinatario.length === 14;

    const payload: NFePayload = {
        // Dados gerais
        natureza_operacao: naturezaOperacao || 'Venda de mercadoria',
        data_emissao: formatarDataISO(),
        tipo_documento: TIPO_DOCUMENTO.SAIDA,
        finalidade_emissao: FINALIDADE_EMISSAO.NORMAL,
        consumidor_final: CONSUMIDOR_FINAL.CONSUMIDOR_FINAL,
        presenca_comprador: PRESENCA_COMPRADOR.PRESENCIAL,

        // Emitente
        cnpj_emitente: limparDocumento(empresa.cnpj),
        nome_emitente: empresa.razao_social,
        nome_fantasia_emitente: empresa.nome_fantasia || empresa.razao_social,
        inscricao_estadual_emitente: empresa.inscricao_estadual || '',
        regime_tributario_emitente: regimeTributario as 1 | 2 | 3,
        logradouro_emitente: empresa.logradouro || '',
        numero_emitente: empresa.numero || 'S/N',
        complemento_emitente: empresa.complemento || undefined,
        bairro_emitente: empresa.bairro || '',
        municipio_emitente: empresa.cidade || '',
        uf_emitente: ufEmitente,
        cep_emitente: limparCep(empresa.cep),
        telefone_emitente: empresa.telefone || undefined,

        // Destinatário
        nome_destinatario: cliente.nome,
        ...(isPJ
            ? { cnpj_destinatario: cpfCnpjDestinatario }
            : { cpf_destinatario: cpfCnpjDestinatario }
        ),
        indicador_inscricao_estadual_destinatario: isPJ
            ? INDICADOR_IE_DESTINATARIO.NAO_CONTRIBUINTE
            : INDICADOR_IE_DESTINATARIO.NAO_CONTRIBUINTE,
        email_destinatario: cliente.email || undefined,
        telefone_destinatario: cliente.telefone || undefined,
        logradouro_destinatario: cliente.logradouro || '',
        numero_destinatario: cliente.numero || 'S/N',
        complemento_destinatario: cliente.complemento || undefined,
        bairro_destinatario: cliente.bairro || '',
        municipio_destinatario: cliente.cidade || '',
        uf_destinatario: ufDestinatario,
        cep_destinatario: limparCep(cliente.cep),
        pais_destinatario: 'Brasil',

        // Itens
        items: nfeItens,

        // Transporte
        modalidade_frete: MODALIDADE_FRETE.SEM_FRETE,

        // Valores
        valor_frete: 0,
        valor_seguro: 0,
        valor_desconto: 0,
        valor_produtos: valorProdutos,
        valor_total: valorProdutos,

        // Pagamento
        formas_pagamento: formasPagamento,

        // Informações complementares
        informacoes_complementares: informacoesComplementares || `Ref. OS #${os.numero}`,
    };

    return payload;
}

/**
 * Valida payload antes de enviar
 */
export function validarNFePayload(payload: NFePayload): { valido: boolean; erros: string[] } {
    const erros: string[] = [];

    // Emitente
    if (!payload.cnpj_emitente && !payload.cpf_emitente) {
        erros.push('CNPJ ou CPF do emitente é obrigatório');
    }
    if (!payload.inscricao_estadual_emitente) {
        erros.push('Inscrição Estadual do emitente é obrigatória');
    }
    if (!payload.logradouro_emitente) {
        erros.push('Endereço do emitente é obrigatório');
    }

    // Destinatário
    if (!payload.nome_destinatario) {
        erros.push('Nome do destinatário é obrigatório');
    }
    if (!payload.cnpj_destinatario && !payload.cpf_destinatario) {
        erros.push('CNPJ ou CPF do destinatário é obrigatório');
    }

    // Itens
    if (!payload.items || payload.items.length === 0) {
        erros.push('É necessário ao menos um item na nota');
    }

    // Valores
    if (!payload.valor_total || payload.valor_total <= 0) {
        erros.push('Valor total deve ser maior que zero');
    }

    return {
        valido: erros.length === 0,
        erros,
    };
}
