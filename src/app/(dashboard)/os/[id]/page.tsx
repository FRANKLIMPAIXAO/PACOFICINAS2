'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Card, Alert, Modal, DataTable, StatusBadge } from '@/components/ui';
import { Input, Select, FormRow, MoneyInput, Textarea } from '@/components/ui';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getUserEmpresaId } from '@/lib/supabase/helpers';

interface OS {
    id: string;
    numero: number;
    cliente_id: string;
    cliente_nome: string;
    cliente_telefone?: string;
    veiculo_id: string;
    veiculo_placa: string;
    veiculo_descricao: string;
    orcamento_id?: string;
    orcamento_numero?: number;
    km_entrada?: number;
    data_abertura: string;
    data_previsao?: string;
    data_conclusao?: string;
    valor_produtos: number;
    valor_servicos: number;
    valor_desconto: number;
    valor_total: number;
    status: string;
    mecanico_id?: string;
    mecanico_nome?: string;
    diagnostico?: string;
    observacoes?: string;
}

interface ItemOS {
    id: string;
    tipo: string;
    descricao: string;
    quantidade: number;
    valor_unitario: number;
    valor_total: number;
}

export default function OSDetalhesPage() {
    const router = useRouter();
    const params = useParams();
    const osId = params.id as string;
    const [empresaId, setEmpresaId] = useState<string | null>(null);

    const supabase = createClient();

    const [os, setOS] = useState<OS | null>(null);
    const [itens, setItens] = useState<ItemOS[]>([]);
    const [loading, setLoading] = useState(true);
    const [showError, setShowError] = useState('');
    const [showSuccess, setShowSuccess] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        async function loadEmpresaId() {
            const id = await getUserEmpresaId();
            setEmpresaId(id);
        }
        loadEmpresaId();
    }, []);


    useEffect(() => {
        if (osId) {
            loadOS();
        }
    }, [osId]);

    const loadOS = async () => {
        setLoading(true);
        try {
            // Buscar OS
            const { data: osData, error: osError } = await supabase
                .from('ordens_servico')
                .select(`
                    *,
                    clientes(nome, telefone),
                    veiculos(placa, marca, modelo, ano_modelo),
                    orcamentos(numero)
                `)
                .eq('id', osId)
                .single();

            if (osError) throw osError;

            setOS({
                id: osData.id,
                numero: osData.numero,
                cliente_id: osData.cliente_id,
                cliente_nome: osData.clientes?.nome || '-',
                cliente_telefone: osData.clientes?.telefone,
                veiculo_id: osData.veiculo_id,
                veiculo_placa: osData.veiculos?.placa || '-',
                veiculo_descricao: osData.veiculos ? `${osData.veiculos.marca} ${osData.veiculos.modelo} ${osData.veiculos.ano_modelo}` : '-',
                orcamento_id: osData.orcamento_id,
                orcamento_numero: osData.orcamentos?.numero,
                km_entrada: osData.km_entrada,
                data_abertura: osData.data_abertura,
                data_previsao: osData.data_previsao,
                data_conclusao: osData.data_conclusao,
                valor_produtos: osData.valor_produtos || 0,
                valor_servicos: osData.valor_servicos || 0,
                valor_desconto: osData.valor_desconto || 0,
                valor_total: osData.valor_total || 0,
                status: osData.status,
                mecanico_id: osData.mecanico_id,
                diagnostico: osData.diagnostico,
                observacoes: osData.observacoes,
            });

            // Buscar itens
            const { data: itensData } = await supabase
                .from('os_itens')
                .select('*')
                .eq('os_id', osId)
                .order('tipo');

            setItens(itensData || []);

        } catch (err: any) {
            console.error('Erro ao carregar OS:', err);
            setShowError('Erro ao carregar OS: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatMoney = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    const formatDateTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('pt-BR');
    };

    const handleUpdateStatus = async (newStatus: string) => {
        setActionLoading(true);
        try {
            const updateData: any = { status: newStatus };

            if (newStatus === 'em_execucao') {
                // Não precisamos de data específica para em_execucao
            } else if (newStatus === 'finalizada') {
                updateData.data_conclusao = new Date().toISOString();
            }

            const { error } = await supabase
                .from('ordens_servico')
                .update(updateData)
                .eq('id', osId);

            if (error) throw error;

            setShowSuccess(`OS ${newStatus === 'em_execucao' ? 'iniciada' : newStatus === 'finalizada' ? 'finalizada' : 'atualizada'} com sucesso!`);
            loadOS();
        } catch (err: any) {
            setShowError('Erro ao atualizar: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleFaturar = async () => {
        if (!os) return;
        setActionLoading(true);
        try {
            const { error } = await supabase
                .from('ordens_servico')
                .update({ status: 'faturada' })
                .eq('id', osId);

            if (error) throw error;

            // Criar conta a receber automaticamente
            const dataVencimento = new Date();
            dataVencimento.setDate(dataVencimento.getDate() + 30); // Vencimento em 30 dias

            const empresaId = '00000000-0000-0000-0000-000000000001';

            await supabase
                .from('contas_receber')
                .insert({
                    empresa_id: empresaId,
                    cliente_id: os.cliente_id,
                    os_id: os.id,
                    descricao: `OS #${os.numero} - ${os.cliente_nome}`,
                    valor: os.valor_total,
                    data_emissao: new Date().toISOString().split('T')[0],
                    data_vencimento: dataVencimento.toISOString().split('T')[0],
                    status: 'aberto',
                    origem: 'os',
                });

            setShowSuccess('OS faturada com sucesso! Conta a receber criada.');
            loadOS();
        } catch (err: any) {
            setShowError('Erro ao faturar: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const itensColumns = [
        {
            key: 'tipo',
            header: 'Tipo',
            width: '100px',
            render: (item: ItemOS) => (
                <span className={`badge ${item.tipo === 'servico' ? 'badge-primary' : 'badge-info'}`}>
                    {item.tipo === 'servico' ? '🔧 Serviço' : '📦 Produto'}
                </span>
            ),
        },
        {
            key: 'descricao',
            header: 'Descrição',
            render: (item: ItemOS) => item.descricao,
        },
        {
            key: 'qtd',
            header: 'Qtd',
            width: '80px',
            render: (item: ItemOS) => item.quantidade,
        },
        {
            key: 'unitario',
            header: 'Unitário',
            width: '120px',
            render: (item: ItemOS) => formatMoney(item.valor_unitario),
        },
        {
            key: 'total',
            header: 'Total',
            width: '120px',
            render: (item: ItemOS) => (
                <span style={{ fontWeight: 600 }}>{formatMoney(item.valor_total)}</span>
            ),
        },
    ];

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            'aberta': 'Aberta',
            'em_execucao': 'Em Andamento',
            'aguardando_peca': 'Aguardando Peça',
            'finalizada': 'Finalizada',
            'faturada': 'Faturada',
        };
        return labels[status] || status;
    };

    if (loading) {
        return (
            <>
                <Header title="Ordem de Serviço" subtitle="Carregando..." />
                <div className="page-content">
                    <Card>
                        <div style={{ padding: '2rem', textAlign: 'center' }}>
                            Carregando dados da OS...
                        </div>
                    </Card>
                </div>
            </>
        );
    }

    if (!os) {
        return (
            <>
                <Header title="Ordem de Serviço" subtitle="Não encontrada" />
                <div className="page-content">
                    <Alert type="error">OS não encontrada</Alert>
                    <Link href="/os" className="btn btn-secondary mt-lg">
                        ← Voltar para lista
                    </Link>
                </div>
            </>
        );
    }

    return (
        <>
            <Header
                title={`OS #${os.numero}`}
                subtitle={`${os.cliente_nome} • ${os.veiculo_placa}`}
            />

            <div className="page-content">
                {showSuccess && (
                    <div className="mb-lg">
                        <Alert type="success" onClose={() => setShowSuccess('')}>
                            {showSuccess}
                        </Alert>
                    </div>
                )}

                {showError && (
                    <div className="mb-lg">
                        <Alert type="error" onClose={() => setShowError('')}>
                            {showError}
                        </Alert>
                    </div>
                )}

                {/* Header com ações */}
                <Card>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <StatusBadge status={os.status} />
                            <span className="text-muted">
                                Aberta em {formatDateTime(os.data_abertura)}
                            </span>
                            {os.orcamento_numero && (
                                <span className="badge badge-secondary">
                                    Orç. #{os.orcamento_numero}
                                </span>
                            )}
                        </div>
                        <div className="flex gap-sm">
                            {os.status === 'aberta' && (
                                <button
                                    className="btn btn-primary"
                                    onClick={() => handleUpdateStatus('em_execucao')}
                                    disabled={actionLoading}
                                >
                                    ▶ Iniciar OS
                                </button>
                            )}
                            {os.status === 'em_execucao' && (
                                <>
                                    <button
                                        className="btn btn-warning"
                                        onClick={() => handleUpdateStatus('aguardando_peca')}
                                        disabled={actionLoading}
                                    >
                                        ⏸ Aguardando Peça
                                    </button>
                                    <button
                                        className="btn btn-success"
                                        onClick={() => handleUpdateStatus('finalizada')}
                                        disabled={actionLoading}
                                    >
                                        ✓ Finalizar
                                    </button>
                                </>
                            )}
                            {os.status === 'aguardando_peca' && (
                                <button
                                    className="btn btn-primary"
                                    onClick={() => handleUpdateStatus('em_execucao')}
                                    disabled={actionLoading}
                                >
                                    ▶ Retomar
                                </button>
                            )}
                            {os.status === 'finalizada' && (
                                <button
                                    className="btn btn-success"
                                    onClick={handleFaturar}
                                    disabled={actionLoading}
                                >
                                    💰 Faturar
                                </button>
                            )}
                            {os.status === 'faturada' && (
                                <>
                                    <Link href={`/nfse/emitir?os=${os.id}`} className="btn btn-primary">
                                        📄 Emitir NFS-e (Serviços)
                                    </Link>
                                    <Link href={`/nfe/emitir?os=${os.id}`} className="btn btn-success">
                                        📦 Emitir NF-e (Produtos)
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Dados do Cliente e Veículo */}
                <div className="grid grid-cols-2">
                    <Card title="Cliente">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div><strong>Nome:</strong> {os.cliente_nome}</div>
                            {os.cliente_telefone && (
                                <div><strong>Telefone:</strong> {os.cliente_telefone}</div>
                            )}
                        </div>
                    </Card>
                    <Card title="Veículo">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div><strong>Placa:</strong> {os.veiculo_placa}</div>
                            <div><strong>Veículo:</strong> {os.veiculo_descricao}</div>
                            {os.km_entrada && (
                                <div><strong>KM Entrada:</strong> {os.km_entrada.toLocaleString('pt-BR')}</div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Diagnóstico */}
                {os.diagnostico && (
                    <Card title="Diagnóstico / Reclamação">
                        <p style={{ whiteSpace: 'pre-wrap' }}>{os.diagnostico}</p>
                    </Card>
                )}

                {/* Itens */}
                <Card title="Serviços e Produtos" noPadding>
                    {itens.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-500)' }}>
                            Nenhum item cadastrado
                        </div>
                    ) : (
                        <DataTable
                            columns={itensColumns}
                            data={itens}
                            keyExtractor={(item) => item.id}
                        />
                    )}
                </Card>

                {/* Totais */}
                <Card title="Valores">
                    <div style={{ maxWidth: '400px', marginLeft: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>Serviços:</span>
                            <span>{formatMoney(os.valor_servicos)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>Produtos:</span>
                            <span>{formatMoney(os.valor_produtos)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--error-600)' }}>
                            <span>Desconto:</span>
                            <span>- {formatMoney(os.valor_desconto)}</span>
                        </div>
                        <hr style={{ margin: '1rem 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700 }}>
                            <span>TOTAL:</span>
                            <span style={{ color: 'var(--success-600)' }}>{formatMoney(os.valor_total)}</span>
                        </div>
                    </div>
                </Card>

                {/* Observações */}
                {os.observacoes && (
                    <Card title="Observações">
                        <p style={{ whiteSpace: 'pre-wrap' }}>{os.observacoes}</p>
                    </Card>
                )}

                {/* Botão Voltar */}
                <div style={{ marginTop: '1rem' }}>
                    <Link href="/os" className="btn btn-secondary">
                        ← Voltar para lista
                    </Link>
                </div>
            </div>
        </>
    );
}
