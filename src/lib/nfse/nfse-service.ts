// =====================================================
// PAC OFICINAS - Serviço de Integração NFS-e Nacional
// =====================================================

import type {
    Empresa,
    OrdemServico,
    Cliente,
    NFSe,
    NFSeEvento,
    ParametrosMunicipais,
    AmbienteNFSe
} from '@/types';
import { NFSE_API_URLS, NFSE_ENDPOINTS } from './constants';
import { gerarXMLDPS, validarDadosDPS, type DPSData } from './dps-builder';

// =====================================================
// Tipos de Resposta da API
// =====================================================

interface APIResponse<T> {
    sucesso: boolean;
    dados?: T;
    mensagem?: string;
    erros?: string[];
}

interface EmissaoNFSeResponse {
    chaveAcesso: string;
    numero: number;
    serie: string;
    codigoVerificacao: string;
    dataEmissao: string;
    xmlNfse: string;
    protocolo: string;
}

interface ConsultaNFSeResponse {
    nfse: {
        chaveAcesso: string;
        numero: number;
        serie: string;
        status: string;
        xmlNfse: string;
    };
}

interface ParametrosMunicipaisResponse {
    codigoMunicipio: string;
    nomeMunicipio: string;
    uf: string;
    conveniado: boolean;
    aliquotaMinima: number;
    aliquotaMaxima: number;
    regimesEspeciais: object[];
}

// =====================================================
// Classe Principal do Serviço
// =====================================================

export class NFSeService {
    private ambiente: AmbienteNFSe;
    private baseUrl: string;
    private certificadoBase64: string | null = null;
    private senhaCertificado: string | null = null;

    constructor(ambiente: AmbienteNFSe = 'homologacao') {
        this.ambiente = ambiente;
        this.baseUrl = NFSE_API_URLS[ambiente];
    }

    /**
     * Configura o certificado digital para assinatura
     */
    configurarCertificado(certificadoBase64: string, senha: string): void {
        this.certificadoBase64 = certificadoBase64;
        this.senhaCertificado = senha;
    }

    /**
     * Consulta os parâmetros do convênio de um município
     */
    async consultarParametrosMunicipais(codigoMunicipio: string): Promise<APIResponse<ParametrosMunicipais>> {
        try {
            const url = `${this.baseUrl}${NFSE_ENDPOINTS.parametrosMunicipais}/${codigoMunicipio}/convenio`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                return {
                    sucesso: false,
                    mensagem: `Erro ao consultar parâmetros: ${response.status}`,
                };
            }

            const dados = await response.json() as ParametrosMunicipaisResponse;

            return {
                sucesso: true,
                dados: {
                    id: '',
                    codigo_municipio: dados.codigoMunicipio,
                    nome_municipio: dados.nomeMunicipio,
                    uf: dados.uf,
                    conveniado: dados.conveniado,
                    data_adesao: null,
                    aliquota_minima: dados.aliquotaMinima,
                    aliquota_maxima: dados.aliquotaMaxima,
                    permite_deducao: false,
                    exige_inscricao_municipal: true,
                    regimes_especiais: dados.regimesEspeciais,
                    servicos: null,
                    updated_at: new Date().toISOString(),
                },
            };
        } catch (error) {
            return {
                sucesso: false,
                mensagem: `Erro de conexão: ${error instanceof Error ? error.message : 'Desconhecido'}`,
            };
        }
    }

    /**
     * Emite uma NFS-e a partir dos dados da OS
     */
    async emitirNFSe(dpsData: DPSData, numeroDPS: number): Promise<APIResponse<EmissaoNFSeResponse>> {
        // 1. Validar dados
        const validacao = validarDadosDPS(dpsData);
        if (!validacao.valido) {
            return {
                sucesso: false,
                mensagem: 'Dados inválidos para emissão',
                erros: validacao.erros,
            };
        }

        // 2. Verificar certificado
        if (!this.certificadoBase64 || !this.senhaCertificado) {
            return {
                sucesso: false,
                mensagem: 'Certificado digital não configurado',
            };
        }

        try {
            // 3. Gerar XML da DPS
            const xmlDPS = gerarXMLDPS(dpsData, numeroDPS);

            // 4. Assinar XML (implementação simplificada - em produção usar node-forge ou similar)
            const xmlAssinado = await this.assinarXML(xmlDPS);

            // 5. Enviar para API
            const url = `${this.baseUrl}${NFSE_ENDPOINTS.nfse}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    dps: xmlAssinado,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                return {
                    sucesso: false,
                    mensagem: `Erro na API: ${response.status}`,
                    erros: [errorText],
                };
            }

            const dados = await response.json() as EmissaoNFSeResponse;

            return {
                sucesso: true,
                dados,
            };
        } catch (error) {
            return {
                sucesso: false,
                mensagem: `Erro ao emitir NFS-e: ${error instanceof Error ? error.message : 'Desconhecido'}`,
            };
        }
    }

    /**
     * Consulta uma NFS-e pela chave de acesso
     */
    async consultarNFSe(chaveAcesso: string): Promise<APIResponse<ConsultaNFSeResponse>> {
        try {
            const url = `${this.baseUrl}${NFSE_ENDPOINTS.nfse}/${chaveAcesso}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                return {
                    sucesso: false,
                    mensagem: `NFS-e não encontrada: ${response.status}`,
                };
            }

            const dados = await response.json() as ConsultaNFSeResponse;

            return {
                sucesso: true,
                dados,
            };
        } catch (error) {
            return {
                sucesso: false,
                mensagem: `Erro ao consultar NFS-e: ${error instanceof Error ? error.message : 'Desconhecido'}`,
            };
        }
    }

    /**
     * Registra evento de cancelamento de NFS-e
     */
    async cancelarNFSe(
        chaveAcesso: string,
        codigoCancelamento: number,
        motivo: string
    ): Promise<APIResponse<{ protocolo: string }>> {
        if (!this.certificadoBase64 || !this.senhaCertificado) {
            return {
                sucesso: false,
                mensagem: 'Certificado digital não configurado',
            };
        }

        try {
            // Gerar XML do evento de cancelamento
            const xmlEvento = this.gerarXMLEventoCancelamento(chaveAcesso, codigoCancelamento, motivo);
            const xmlAssinado = await this.assinarXML(xmlEvento);

            const url = `${this.baseUrl}${NFSE_ENDPOINTS.nfse}/${chaveAcesso}/eventos`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    evento: xmlAssinado,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                return {
                    sucesso: false,
                    mensagem: `Erro ao cancelar: ${response.status}`,
                    erros: [errorText],
                };
            }

            const dados = await response.json() as { protocolo: string };

            return {
                sucesso: true,
                dados,
            };
        } catch (error) {
            return {
                sucesso: false,
                mensagem: `Erro ao cancelar NFS-e: ${error instanceof Error ? error.message : 'Desconhecido'}`,
            };
        }
    }

    /**
     * Consulta eventos de uma NFS-e
     */
    async consultarEventos(chaveAcesso: string): Promise<APIResponse<NFSeEvento[]>> {
        try {
            const url = `${this.baseUrl}${NFSE_ENDPOINTS.nfse}/${chaveAcesso}/eventos`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                return {
                    sucesso: false,
                    mensagem: `Erro ao consultar eventos: ${response.status}`,
                };
            }

            const dados = await response.json() as NFSeEvento[];

            return {
                sucesso: true,
                dados,
            };
        } catch (error) {
            return {
                sucesso: false,
                mensagem: `Erro ao consultar eventos: ${error instanceof Error ? error.message : 'Desconhecido'}`,
            };
        }
    }

    // =====================================================
    // Métodos Privados
    // =====================================================

    /**
     * Assina o XML com o certificado digital
     * NOTA: Implementação simplificada. Em produção, usar biblioteca como node-forge
     */
    private async assinarXML(xml: string): Promise<string> {
        // TODO: Implementar assinatura real com node-forge ou xml-crypto
        // Por enquanto, apenas retorna o XML sem assinar para desenvolvimento
        console.warn('ATENÇÃO: Assinatura XML não implementada. Usando XML sem assinatura.');
        return xml;
    }

    /**
     * Gera o XML do evento de cancelamento
     */
    private gerarXMLEventoCancelamento(
        chaveAcesso: string,
        codigoCancelamento: number,
        motivo: string
    ): string {
        const dataEvento = new Date().toISOString();

        return `<?xml version="1.0" encoding="UTF-8"?>
<pedRegEvento xmlns="http://www.sped.fazenda.gov.br/nfse" versao="1.00">
  <infPedReg>
    <tpEvento>e101101</tpEvento>
    <chNFSe>${chaveAcesso}</chNFSe>
    <nSeqEvento>1</nSeqEvento>
    <dhEvento>${dataEvento}</dhEvento>
    <e101101>
      <cMotivo>${codigoCancelamento}</cMotivo>
      <xMotivo>${this.escapeXml(motivo)}</xMotivo>
    </e101101>
  </infPedReg>
</pedRegEvento>`;
    }

    /**
     * Escapa caracteres especiais para XML
     */
    private escapeXml(str: string): string {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
}

// =====================================================
// Factory Function
// =====================================================

/**
 * Cria uma instância do serviço NFS-e
 */
export function criarNFSeService(ambiente: AmbienteNFSe = 'homologacao'): NFSeService {
    return new NFSeService(ambiente);
}
