'use client';

import { useState } from 'react';
import { Modal, Alert } from '@/components/ui';
import { Input, Select, Textarea, FormRow, MoneyInput } from '@/components/ui';
import type { OrdemServico, Cliente, Servico } from '@/types';

interface EmitirNFSeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (dados: EmissaoNFSeData) => Promise<void>;
    os?: OrdemServico;
    cliente?: Cliente;
    servicos?: Array<{ servico: Servico; quantidade: number; valorTotal: number }>;
}

export interface EmissaoNFSeData {
    discriminacao: string;
    aliquotaISS: number;
    codigoServico: string;
    competencia: string;
}

export function EmitirNFSeModal({
    isOpen,
    onClose,
    onSubmit,
    os,
    cliente,
    servicos = []
}: EmitirNFSeModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Dados do formulário
    const [discriminacao, setDiscriminacao] = useState(
        os?.diagnostico ||
        servicos.map(s => `${s.quantidade}x ${s.servico.descricao}`).join('\n') ||
        ''
    );
    const [aliquotaISS, setAliquotaISS] = useState(5.00);
    const [codigoServico, setCodigoServico] = useState('14.01');
    const [competencia, setCompetencia] = useState(
        new Date().toISOString().slice(0, 7) // YYYY-MM
    );

    const valorTotal = os?.valor_servicos || servicos.reduce((sum, s) => sum + s.valorTotal, 0);
    const valorISS = valorTotal * (aliquotaISS / 100);
    const valorLiquido = valorTotal - valorISS;

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);

        try {
            // Validações
            if (!discriminacao || discriminacao.length < 10) {
                throw new Error('A discriminação dos serviços deve ter no mínimo 10 caracteres');
            }
            if (!cliente?.cpf_cnpj) {
                throw new Error('O cliente precisa ter CPF/CNPJ cadastrado');
            }

            await onSubmit({
                discriminacao,
                aliquotaISS,
                codigoServico,
                competencia,
            });

            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao emitir NFS-e');
        } finally {
            setLoading(false);
        }
    };

    const formatMoney = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Emitir NFS-e"
            size="lg"
            footer={
                <>
                    <button
                        className="btn btn-secondary"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? '⏳ Emitindo...' : '📤 Emitir NFS-e'}
                    </button>
                </>
            }
        >
            {error && (
                <Alert type="error" onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Dados da OS */}
            <div className="card-section mb-lg" style={{
                background: 'var(--gray-50)',
                padding: 'var(--space-md)',
                borderRadius: 'var(--radius-md)'
            }}>
                <h4 className="mb-sm">📋 Dados da OS #{os?.numero}</h4>
                <div className="grid grid-cols-2 gap-md">
                    <div>
                        <span className="text-muted">Cliente:</span>
                        <div style={{ fontWeight: 500 }}>{cliente?.nome || '-'}</div>
                    </div>
                    <div>
                        <span className="text-muted">CPF/CNPJ:</span>
                        <div style={{ fontFamily: 'var(--font-mono)' }}>{cliente?.cpf_cnpj || '-'}</div>
                    </div>
                </div>
            </div>

            {/* Valores */}
            <div className="card-section mb-lg" style={{
                background: 'var(--primary-50)',
                padding: 'var(--space-md)',
                borderRadius: 'var(--radius-md)'
            }}>
                <h4 className="mb-sm">💰 Valores</h4>
                <div className="grid grid-cols-3 gap-md">
                    <div>
                        <span className="text-muted">Valor Serviços:</span>
                        <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{formatMoney(valorTotal)}</div>
                    </div>
                    <div>
                        <span className="text-muted">ISS ({aliquotaISS}%):</span>
                        <div style={{ fontWeight: 500, color: 'var(--error-600)' }}>{formatMoney(valorISS)}</div>
                    </div>
                    <div>
                        <span className="text-muted">Valor Líquido:</span>
                        <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--success-600)' }}>
                            {formatMoney(valorLiquido)}
                        </div>
                    </div>
                </div>
            </div>

            <div className="divider"></div>
            <h4 className="mb-md">📝 Dados da NFS-e</h4>

            <FormRow>
                <Select
                    label="Código do Serviço (LC 116)"
                    value={codigoServico}
                    onChange={(e) => setCodigoServico(e.target.value)}
                    options={[
                        { value: '14.01', label: '14.01 - Manutenção e conservação de veículos' },
                        { value: '14.14', label: '14.14 - Guincho intramunicipal' },
                    ]}
                />
                <Input
                    label="Competência"
                    type="month"
                    value={competencia}
                    onChange={(e) => setCompetencia(e.target.value)}
                />
            </FormRow>

            <FormRow>
                <Input
                    label="Alíquota ISS (%)"
                    type="number"
                    step="0.01"
                    min="2"
                    max="5"
                    value={aliquotaISS}
                    onChange={(e) => setAliquotaISS(parseFloat(e.target.value) || 5)}
                />
                <div></div>
            </FormRow>

            <Textarea
                label="Discriminação dos Serviços *"
                value={discriminacao}
                onChange={(e) => setDiscriminacao(e.target.value)}
                placeholder="Descreva detalhadamente os serviços prestados..."
                rows={5}
            />
            <span className="text-sm text-muted">
                Mínimo 10 caracteres. Esta descrição aparecerá na NFS-e.
            </span>

            <div className="divider"></div>

            <Alert type="info">
                <strong>Ambiente:</strong> Homologação (Produção Restrita)
                <br />
                As notas emitidas neste ambiente são apenas para teste e não têm validade fiscal.
            </Alert>
        </Modal>
    );
}
