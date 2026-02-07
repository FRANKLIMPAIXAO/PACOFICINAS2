// =====================================================
// PAC OFICINAS - Gerador de DPS (Declaração de Prestação de Serviço)
// =====================================================

import type { Empresa, OrdemServico, Cliente, Servico } from '@/types';
import { VERSAO_LEIAUTE, MUNICIPIOS_GO } from './constants';

export interface DPSData {
    empresa: Empresa;
    os: OrdemServico;
    cliente: Cliente;
    servicos: Array<{
        servico: Servico;
        quantidade: number;
        valorUnitario: number;
        valorTotal: number;
    }>;
    discriminacao: string;
    competencia: Date;
    aliquotaISS?: number;
}

/**
 * Gera o ID da DPS no formato correto
 * Formato: CodMunIBGE(7) + TipoInsc(1) + InscFed(14) + Serie(5) + NumDPS(15)
 */
export function gerarIdDPS(empresa: Empresa, numeroDPS: number): string {
    const codMunicipio = empresa.codigo_municipio_ibge || MUNICIPIOS_GO.GOIANIA;
    const tipoInscricao = '2'; // 2 = CNPJ
    const cnpjNumerico = empresa.cnpj.replace(/\D/g, '').padStart(14, '0');
    const serie = '00001';
    const numDPS = numeroDPS.toString().padStart(15, '0');

    return `${codMunicipio}${tipoInscricao}${cnpjNumerico}${serie}${numDPS}`;
}

/**
 * Formata valor monetário para o XML (sem pontuação, 2 casas decimais)
 */
function formatarValor(valor: number): string {
    return valor.toFixed(2);
}

/**
 * Formata data para o padrão ISO (YYYY-MM-DD)
 */
function formatarData(data: Date): string {
    return data.toISOString().split('T')[0];
}

/**
 * Formata data e hora para o padrão ISO
 */
function formatarDataHora(data: Date): string {
    return data.toISOString();
}

/**
 * Limpa CPF/CNPJ mantendo apenas números
 */
function limparCpfCnpj(valor: string | null): string {
    return (valor || '').replace(/\D/g, '');
}

/**
 * Gera o XML da DPS conforme leiaute nacional
 */
export function gerarXMLDPS(data: DPSData, numeroDPS: number): string {
    const { empresa, os, cliente, servicos, discriminacao, competencia, aliquotaISS } = data;

    const idDPS = gerarIdDPS(empresa, numeroDPS);
    const dataEmissao = formatarDataHora(new Date());
    const dataCompetencia = formatarData(competencia);

    // Calcular valores
    const valorServicos = servicos.reduce((sum, s) => sum + s.valorTotal, 0);
    const aliquota = aliquotaISS || 5.00; // Padrão 5%
    const valorISS = valorServicos * (aliquota / 100);
    const valorLiquido = valorServicos - valorISS;

    // Determinar código do município de incidência
    const codigoMunicipioIncidencia = empresa.codigo_municipio_ibge || MUNICIPIOS_GO.GOIANIA;

    // Código do serviço (usar do primeiro serviço ou padrão)
    const codigoServico = servicos[0]?.servico.codigo_servico || '14.01';

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<DPS xmlns="http://www.sped.fazenda.gov.br/nfse" versao="${VERSAO_LEIAUTE}">
  <infDPS Id="${idDPS}">
    <tpAmb>2</tpAmb>
    <dhEmi>${dataEmissao}</dhEmi>
    <verAplic>PAC-OFICINAS-1.0</verAplic>
    <dCompet>${dataCompetencia}</dCompet>
    
    <subst>
      <chSubstda></chSubstda>
    </subst>
    
    <prest>
      <CNPJ>${limparCpfCnpj(empresa.cnpj)}</CNPJ>
      <IM>${empresa.inscricao_municipal || ''}</IM>
      <regTrib>${getRegimeTributarioCode(empresa.regime_tributario)}</regTrib>
    </prest>
    
    <toma>
      ${cliente.cpf_cnpj && cliente.cpf_cnpj.length > 11
            ? `<CNPJ>${limparCpfCnpj(cliente.cpf_cnpj)}</CNPJ>`
            : `<CPF>${limparCpfCnpj(cliente.cpf_cnpj)}</CPF>`
        }
      <xNome>${escapeXml(cliente.nome)}</xNome>
      ${cliente.email ? `<email>${escapeXml(cliente.email)}</email>` : ''}
      ${cliente.telefone ? `<fone>${limparCpfCnpj(cliente.telefone)}</fone>` : ''}
      <end>
        ${cliente.logradouro ? `<xLgr>${escapeXml(cliente.logradouro)}</xLgr>` : ''}
        ${cliente.numero ? `<nro>${escapeXml(cliente.numero)}</nro>` : ''}
        ${cliente.complemento ? `<xCpl>${escapeXml(cliente.complemento)}</xCpl>` : ''}
        ${cliente.bairro ? `<xBairro>${escapeXml(cliente.bairro)}</xBairro>` : ''}
        ${cliente.cep ? `<CEP>${limparCpfCnpj(cliente.cep)}</CEP>` : ''}
      </end>
    </toma>
    
    <serv>
      <locPrest>
        <cLocPrestacao>${codigoMunicipioIncidencia}</cLocPrestacao>
        <cPaisPrestacao>1058</cPaisPrestacao>
      </locPrest>
      <cServ>
        <cTribNac>${codigoServico}</cTribNac>
        <xDescServ>${escapeXml(discriminacao)}</xDescServ>
      </cServ>
    </serv>
    
    <valores>
      <vServPrest>
        <vReceb>${formatarValor(valorServicos)}</vReceb>
      </vServPrest>
      <trib>
        <tribMun>
          <tribISSQN>1</tribISSQN>
          <cLocIncwordsid>${codigoMunicipioIncidencia}</cLocIncwordsid>
          <pAliq>${formatarValor(aliquota)}</pAliq>
          <tpRetISSQN>1</tpRetISSQN>
        </tribMun>
        <totTrib>
          <vTotTribFed>0.00</vTotTribFed>
          <vTotTribEst>0.00</vTotTribEst>
          <vTotTribMun>${formatarValor(valorISS)}</vTotTribMun>
        </totTrib>
      </trib>
    </valores>
  </infDPS>
</DPS>`;

    return xml;
}

/**
 * Converte regime tributário para código numérico do leiaute
 */
function getRegimeTributarioCode(regime: string): number {
    const map: Record<string, number> = {
        'simples_nacional': 1,
        'lucro_presumido': 2,
        'lucro_real': 3,
        'mei': 4,
    };
    return map[regime] || 1;
}

/**
 * Escapa caracteres especiais para XML
 */
function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Valida dados obrigatórios para emissão da DPS
 */
export function validarDadosDPS(data: DPSData): { valido: boolean; erros: string[] } {
    const erros: string[] = [];

    // Empresa
    if (!data.empresa.cnpj) erros.push('CNPJ da empresa é obrigatório');
    if (!data.empresa.razao_social) erros.push('Razão social da empresa é obrigatória');
    if (!data.empresa.inscricao_municipal) erros.push('Inscrição municipal da empresa é obrigatória para NFS-e');
    if (!data.empresa.codigo_municipio_ibge) erros.push('Código IBGE do município da empresa é obrigatório');

    // Cliente/Tomador
    if (!data.cliente.nome) erros.push('Nome do cliente é obrigatório');
    if (!data.cliente.cpf_cnpj) erros.push('CPF/CNPJ do cliente é obrigatório');

    // Serviços
    if (data.servicos.length === 0) erros.push('É necessário ao menos um serviço');

    // Valores
    const valorTotal = data.servicos.reduce((sum, s) => sum + s.valorTotal, 0);
    if (valorTotal <= 0) erros.push('Valor total dos serviços deve ser maior que zero');

    // Discriminação
    if (!data.discriminacao || data.discriminacao.length < 10) {
        erros.push('Discriminação dos serviços é obrigatória (mínimo 10 caracteres)');
    }

    return {
        valido: erros.length === 0,
        erros,
    };
}
