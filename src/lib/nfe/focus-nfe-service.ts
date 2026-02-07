// =====================================================
// PAC OFICINAS - Serviço de Integração Focus NFe
// =====================================================

import { FOCUS_NFE_URLS, NFE_ENDPOINTS, STATUS_NFE } from './constants';
import type {
    NFePayload,
    NFeResponse,
    NFeErroResponse,
    NFeCancelamentoResponse,
    NFeCartaCorrecaoResponse,
    NFeInutilizacaoPayload,
    NFeInutilizacaoResponse,
} from './types';

type AmbienteNFe = 'homologacao' | 'producao';

// =====================================================
// Tipos de Resposta da API
// =====================================================

interface APIResponse<T> {
    sucesso: boolean;
    dados?: T;
    mensagem?: string;
    erros?: string[];
}

// =====================================================
// Classe Principal do Serviço
// =====================================================

export class FocusNFeService {
    private ambiente: AmbienteNFe;
    private baseUrl: string;
    private token: string;

    constructor(token: string, ambiente: AmbienteNFe = 'homologacao') {
        this.token = token;
        this.ambiente = ambiente;
        this.baseUrl = FOCUS_NFE_URLS[ambiente];
    }

    /**
     * Headers de autenticação para API Focus NFe
     * Utiliza Basic Auth com token:
     */
    private getHeaders(): HeadersInit {
        const credentials = Buffer.from(`${this.token}:`).toString('base64');
        return {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };
    }

    /**
     * Emite uma NF-e
     * POST /v2/nfe?ref=REFERENCIA
     */
    async emitir(referencia: string, dados: NFePayload): Promise<APIResponse<NFeResponse>> {
        try {
            const url = `${this.baseUrl}${NFE_ENDPOINTS.nfe}?ref=${referencia}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(dados),
            });

            const resultado = await response.json();

            if (!response.ok || resultado.codigo) {
                const erro = resultado as NFeErroResponse;
                return {
                    sucesso: false,
                    mensagem: erro.mensagem,
                    erros: erro.erros?.map(e => e.mensagem) || [erro.mensagem],
                };
            }

            return {
                sucesso: true,
                dados: resultado as NFeResponse,
            };
        } catch (error) {
            return {
                sucesso: false,
                mensagem: `Erro de conexão: ${error instanceof Error ? error.message : 'Desconhecido'}`,
            };
        }
    }

    /**
     * Consulta uma NF-e pelo referência
     * GET /v2/nfe/REFERENCIA
     */
    async consultar(referencia: string, completa: boolean = false): Promise<APIResponse<NFeResponse>> {
        try {
            const url = `${this.baseUrl}${NFE_ENDPOINTS.nfe}/${referencia}?completa=${completa ? 1 : 0}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            if (!response.ok) {
                return {
                    sucesso: false,
                    mensagem: `NF-e não encontrada: ${response.status}`,
                };
            }

            const dados = await response.json() as NFeResponse;

            return {
                sucesso: true,
                dados,
            };
        } catch (error) {
            return {
                sucesso: false,
                mensagem: `Erro ao consultar NF-e: ${error instanceof Error ? error.message : 'Desconhecido'}`,
            };
        }
    }

    /**
     * Cancela uma NF-e
     * DELETE /v2/nfe/REFERENCIA
     */
    async cancelar(referencia: string, justificativa: string): Promise<APIResponse<NFeCancelamentoResponse>> {
        if (justificativa.length < 15 || justificativa.length > 255) {
            return {
                sucesso: false,
                mensagem: 'A justificativa deve ter entre 15 e 255 caracteres',
            };
        }

        try {
            const url = `${this.baseUrl}${NFE_ENDPOINTS.nfe}/${referencia}`;

            const response = await fetch(url, {
                method: 'DELETE',
                headers: this.getHeaders(),
                body: JSON.stringify({ justificativa }),
            });

            const resultado = await response.json();

            if (!response.ok || resultado.codigo) {
                return {
                    sucesso: false,
                    mensagem: resultado.mensagem || 'Erro ao cancelar NF-e',
                };
            }

            return {
                sucesso: true,
                dados: resultado as NFeCancelamentoResponse,
            };
        } catch (error) {
            return {
                sucesso: false,
                mensagem: `Erro ao cancelar NF-e: ${error instanceof Error ? error.message : 'Desconhecido'}`,
            };
        }
    }

    /**
     * Envia uma Carta de Correção Eletrônica (CCe)
     * POST /v2/nfe/REFERENCIA/carta_correcao
     */
    async cartaCorrecao(referencia: string, correcao: string): Promise<APIResponse<NFeCartaCorrecaoResponse>> {
        if (correcao.length < 15 || correcao.length > 1000) {
            return {
                sucesso: false,
                mensagem: 'A correção deve ter entre 15 e 1000 caracteres',
            };
        }

        try {
            const url = `${this.baseUrl}${NFE_ENDPOINTS.nfe}/${referencia}/carta_correcao`;

            const response = await fetch(url, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ correcao }),
            });

            const resultado = await response.json();

            if (!response.ok || resultado.codigo) {
                return {
                    sucesso: false,
                    mensagem: resultado.mensagem || 'Erro ao enviar carta de correção',
                };
            }

            return {
                sucesso: true,
                dados: resultado as NFeCartaCorrecaoResponse,
            };
        } catch (error) {
            return {
                sucesso: false,
                mensagem: `Erro ao enviar carta de correção: ${error instanceof Error ? error.message : 'Desconhecido'}`,
            };
        }
    }

    /**
     * Inutiliza uma faixa de numeração
     * POST /v2/nfe/inutilizacao
     */
    async inutilizar(dados: NFeInutilizacaoPayload): Promise<APIResponse<NFeInutilizacaoResponse>> {
        if (dados.justificativa.length < 15) {
            return {
                sucesso: false,
                mensagem: 'A justificativa deve ter no mínimo 15 caracteres',
            };
        }

        try {
            const url = `${this.baseUrl}${NFE_ENDPOINTS.inutilizacao}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(dados),
            });

            const resultado = await response.json();

            if (!response.ok || resultado.codigo) {
                return {
                    sucesso: false,
                    mensagem: resultado.mensagem || 'Erro ao inutilizar numeração',
                };
            }

            return {
                sucesso: true,
                dados: resultado as NFeInutilizacaoResponse,
            };
        } catch (error) {
            return {
                sucesso: false,
                mensagem: `Erro ao inutilizar: ${error instanceof Error ? error.message : 'Desconhecido'}`,
            };
        }
    }

    /**
     * Reenvia email de uma NF-e
     * POST /v2/nfe/REFERENCIA/email
     */
    async reenviarEmail(referencia: string, emails: string[]): Promise<APIResponse<{ message: string }>> {
        if (emails.length === 0 || emails.length > 10) {
            return {
                sucesso: false,
                mensagem: 'Informe de 1 a 10 emails',
            };
        }

        try {
            const url = `${this.baseUrl}${NFE_ENDPOINTS.nfe}/${referencia}/email`;

            const response = await fetch(url, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ emails }),
            });

            if (!response.ok) {
                return {
                    sucesso: false,
                    mensagem: 'Erro ao reenviar email',
                };
            }

            return {
                sucesso: true,
                dados: { message: 'Emails enviados com sucesso' },
            };
        } catch (error) {
            return {
                sucesso: false,
                mensagem: `Erro ao reenviar email: ${error instanceof Error ? error.message : 'Desconhecido'}`,
            };
        }
    }

    /**
     * Gera DANFe de preview (sem valor fiscal)
     * POST /v2/nfe/danfe
     */
    async gerarDanfePreview(dados: NFePayload): Promise<APIResponse<Blob>> {
        try {
            const url = `${this.baseUrl}${NFE_ENDPOINTS.danfePreview}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(dados),
            });

            if (!response.ok) {
                const erro = await response.json() as NFeErroResponse;
                return {
                    sucesso: false,
                    mensagem: erro.mensagem || 'Erro ao gerar DANFe de preview',
                };
            }

            const blob = await response.blob();
            return {
                sucesso: true,
                dados: blob,
            };
        } catch (error) {
            return {
                sucesso: false,
                mensagem: `Erro ao gerar DANFe: ${error instanceof Error ? error.message : 'Desconhecido'}`,
            };
        }
    }

    /**
     * Faz download de um arquivo (XML ou PDF) pelo caminho
     */
    async downloadArquivo(caminho: string): Promise<APIResponse<Blob>> {
        try {
            const url = `${this.baseUrl}${caminho}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            if (!response.ok) {
                return {
                    sucesso: false,
                    mensagem: `Arquivo não encontrado: ${response.status}`,
                };
            }

            const blob = await response.blob();
            return {
                sucesso: true,
                dados: blob,
            };
        } catch (error) {
            return {
                sucesso: false,
                mensagem: `Erro ao baixar arquivo: ${error instanceof Error ? error.message : 'Desconhecido'}`,
            };
        }
    }

    /**
     * Verifica se uma NF-e foi autorizada (polling)
     */
    async aguardarAutorizacao(
        referencia: string,
        maxTentativas: number = 10,
        intervaloMs: number = 3000
    ): Promise<APIResponse<NFeResponse>> {
        for (let i = 0; i < maxTentativas; i++) {
            const resultado = await this.consultar(referencia);

            if (!resultado.sucesso) {
                return resultado;
            }

            const status = resultado.dados?.status;

            if (status === STATUS_NFE.AUTORIZADO ||
                status === STATUS_NFE.CANCELADO ||
                status === STATUS_NFE.ERRO ||
                status === STATUS_NFE.DENEGADO) {
                return resultado;
            }

            // Aguarda antes da próxima tentativa
            await new Promise(resolve => setTimeout(resolve, intervaloMs));
        }

        return {
            sucesso: false,
            mensagem: 'Timeout: NF-e ainda em processamento após todas as tentativas',
        };
    }
}

// =====================================================
// Factory Function
// =====================================================

/**
 * Cria uma instância do serviço Focus NFe
 */
export function criarFocusNFeService(token: string, ambiente: AmbienteNFe = 'homologacao'): FocusNFeService {
    return new FocusNFeService(token, ambiente);
}
