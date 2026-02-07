'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Card, Alert, DataTable, StatusBadge, SearchInput } from '@/components/ui';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface Cliente {
    id: string;
    nome: string;
    cpf_cnpj?: string;
    telefone?: string;
    telefone2?: string;
    email?: string;
    logradouro?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    observacoes?: string;
}

interface Veiculo {
    id: string;
    placa: string;
    marca: string;
    modelo: string;
    ano_modelo?: number;
    cor?: string;
    km_atual: number;
}

interface OSHistorico {
    id: string;
    numero: number;
    data_abertura: string;
    data_conclusao?: string;
    veiculo_placa: string;
    veiculo_descricao: string;
    km_entrada?: number;
    mecanico_nome?: string;
    valor_total: number;
    status: string;
    diagnostico?: string;
    servicos: string[];
    pecas: string[];
}

export default function ClienteDetalhesPage() {
    const params = useParams();
    const clienteId = params.id as string;
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
    const [historico, setHistorico] = useState<OSHistorico[]>([]);
    const [showError, setShowError] = useState('');
    const [expandedOS, setExpandedOS] = useState<string | null>(null);

    useEffect(() => {
        if (clienteId) {
            loadData();
        }
    }, [clienteId]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Buscar cliente
            const { data: clienteData, error: clienteError } = await supabase
                .from('clientes')
                .select('*')
                .eq('id', clienteId)
                .single();

            if (clienteError) throw clienteError;
            setCliente(clienteData);

            // Buscar veículos
            const { data: veiculosData } = await supabase
                .from('veiculos')
                .select('*')
                .eq('cliente_id', clienteId)
                .eq('ativo', true)
                .order('marca');

            setVeiculos(veiculosData || []);

            // Buscar histórico de OS com itens
            const { data: osData } = await supabase
                .from('ordens_servico')
                .select(`
                    *,
                    veiculos(placa, marca, modelo, ano_modelo),
                    mecanico:usuarios!ordens_servico_mecanico_id_fkey(nome),
                    os_itens(tipo, descricao, quantidade, valor_total)
                `)
                .eq('cliente_id', clienteId)
                .in('status', ['finalizada', 'faturada'])
                .order('data_abertura', { ascending: false });

            const historicoFormatado = (osData || []).map((os: any) => {
                const itens = os.os_itens || [];
                return {
                    id: os.id,
                    numero: os.numero,
                    data_abertura: os.data_abertura,
                    data_conclusao: os.data_conclusao,
                    veiculo_placa: os.veiculos?.placa || '-',
                    veiculo_descricao: os.veiculos ? `${os.veiculos.marca} ${os.veiculos.modelo} ${os.veiculos.ano_modelo || ''}` : '-',
                    km_entrada: os.km_entrada,
                    mecanico_nome: os.mecanico?.nome,
                    valor_total: os.valor_total || 0,
                    status: os.status,
                    diagnostico: os.diagnostico,
                    servicos: itens.filter((i: any) => i.tipo === 'servico').map((i: any) => i.descricao),
                    pecas: itens.filter((i: any) => i.tipo === 'produto').map((i: any) => `${i.descricao} (${i.quantidade}x)`),
                };
            });

            setHistorico(historicoFormatado);

        } catch (err: any) {
            console.error('Erro ao carregar dados:', err);
            setShowError('Erro ao carregar dados: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    const formatMoney = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    // Estatísticas
    const totalGasto = historico.reduce((acc, os) => acc + os.valor_total, 0);
    const totalOS = historico.length;
    const ultimaOS = historico[0];

    if (loading) {
        return (
            <>
                <Header title="Cliente" subtitle="Carregando..." />
                <div className="page-content">
                    <Card>
                        <div style={{ padding: '2rem', textAlign: 'center' }}>
                            Carregando dados do cliente...
                        </div>
                    </Card>
                </div>
            </>
        );
    }

    if (!cliente) {
        return (
            <>
                <Header title="Cliente" subtitle="Não encontrado" />
                <div className="page-content">
                    <Alert type="error">Cliente não encontrado</Alert>
                    <Link href="/clientes" className="btn btn-secondary mt-lg">
                        ← Voltar para lista
                    </Link>
                </div>
            </>
        );
    }

    return (
        <>
            <Header
                title={cliente.nome}
                subtitle="Histórico e dados do cliente"
            />

            <div className="page-content">
                {showError && (
                    <div className="mb-lg">
                        <Alert type="error" onClose={() => setShowError('')}>
                            {showError}
                        </Alert>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-4 mb-lg">
                    <div className="stat-card" style={{ borderLeft: '4px solid var(--primary-500)' }}>
                        <div className="stat-card-value">{totalOS}</div>
                        <div className="stat-card-label">OS Realizadas</div>
                    </div>
                    <div className="stat-card" style={{ borderLeft: '4px solid var(--success-500)' }}>
                        <div className="stat-card-value">{formatMoney(totalGasto)}</div>
                        <div className="stat-card-label">Total Gasto</div>
                    </div>
                    <div className="stat-card" style={{ borderLeft: '4px solid var(--warning-500)' }}>
                        <div className="stat-card-value">{veiculos.length}</div>
                        <div className="stat-card-label">Veículos</div>
                    </div>
                    <div className="stat-card" style={{ borderLeft: '4px solid var(--info-500)' }}>
                        <div className="stat-card-value">
                            {ultimaOS ? formatDate(ultimaOS.data_abertura) : '-'}
                        </div>
                        <div className="stat-card-label">Última Visita</div>
                    </div>
                </div>

                {/* Dados do Cliente */}
                <Card title="Dados do Cliente">
                    <div className="grid grid-cols-3">
                        <div>
                            <div className="mb-md">
                                <strong>Nome:</strong><br />
                                {cliente.nome}
                            </div>
                            <div className="mb-md">
                                <strong>CPF/CNPJ:</strong><br />
                                {cliente.cpf_cnpj || '-'}
                            </div>
                        </div>
                        <div>
                            <div className="mb-md">
                                <strong>Telefone:</strong><br />
                                {cliente.telefone || '-'}
                                {cliente.telefone2 && ` / ${cliente.telefone2}`}
                            </div>
                            <div className="mb-md">
                                <strong>E-mail:</strong><br />
                                {cliente.email || '-'}
                            </div>
                        </div>
                        <div>
                            <div className="mb-md">
                                <strong>Endereço:</strong><br />
                                {cliente.logradouro ? (
                                    <>
                                        {cliente.logradouro}, {cliente.numero}<br />
                                        {cliente.bairro} - {cliente.cidade}/{cliente.uf}
                                    </>
                                ) : '-'}
                            </div>
                        </div>
                    </div>
                    {cliente.observacoes && (
                        <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--gray-100)', borderRadius: 'var(--radius-md)' }}>
                            <strong>Observações:</strong> {cliente.observacoes}
                        </div>
                    )}
                </Card>

                {/* Veículos */}
                <Card title="Veículos" noPadding>
                    {veiculos.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-500)' }}>
                            Nenhum veículo cadastrado
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Placa</th>
                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Veículo</th>
                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Cor</th>
                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>KM Atual</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {veiculos.map(v => (
                                        <tr key={v.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                                            <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                                                {v.placa}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                {v.marca} {v.modelo} {v.ano_modelo}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>{v.cor || '-'}</td>
                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                                {v.km_atual?.toLocaleString('pt-BR')} km
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>

                {/* Histórico de OS */}
                <Card title="📋 Histórico de Serviços" noPadding>
                    {historico.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-500)' }}>
                            Nenhum serviço realizado ainda
                        </div>
                    ) : (
                        <div>
                            {historico.map(os => (
                                <div
                                    key={os.id}
                                    style={{
                                        borderBottom: '1px solid var(--gray-100)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {/* Cabeçalho da OS - sempre visível */}
                                    <div
                                        onClick={() => setExpandedOS(expandedOS === os.id ? null : os.id)}
                                        style={{
                                            padding: '1rem 1.5rem',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            background: expandedOS === os.id ? 'var(--gray-50)' : 'transparent',
                                            transition: 'background 0.2s'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <span style={{ fontSize: '1.25rem' }}>
                                                {expandedOS === os.id ? '▼' : '▶'}
                                            </span>
                                            <div>
                                                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                                    OS #{os.numero} - {os.veiculo_placa}
                                                </div>
                                                <div className="text-sm text-muted">
                                                    {formatDate(os.data_abertura)}
                                                    {os.mecanico_nome && ` • Mecânico: ${os.mecanico_nome}`}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <StatusBadge status={os.status} />
                                            <span style={{ fontWeight: 700, color: 'var(--success-600)' }}>
                                                {formatMoney(os.valor_total)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Detalhes da OS - expandível */}
                                    {expandedOS === os.id && (
                                        <div style={{
                                            padding: '1rem 1.5rem 1.5rem 3.5rem',
                                            background: 'var(--gray-50)',
                                            borderTop: '1px solid var(--gray-200)'
                                        }}>
                                            <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
                                                <div>
                                                    <div style={{ marginBottom: '1rem' }}>
                                                        <strong>Veículo:</strong><br />
                                                        {os.veiculo_descricao}
                                                        {os.km_entrada && ` • ${os.km_entrada.toLocaleString('pt-BR')} km`}
                                                    </div>

                                                    {os.diagnostico && (
                                                        <div style={{ marginBottom: '1rem' }}>
                                                            <strong>Diagnóstico:</strong><br />
                                                            <span className="text-muted">{os.diagnostico}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div>
                                                    {os.servicos.length > 0 && (
                                                        <div style={{ marginBottom: '1rem' }}>
                                                            <strong>🔧 Serviços Realizados:</strong>
                                                            <ul style={{ margin: '0.5rem 0 0 1rem', padding: 0 }}>
                                                                {os.servicos.map((s, i) => (
                                                                    <li key={i} style={{ marginBottom: '0.25rem' }}>{s}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {os.pecas.length > 0 && (
                                                        <div>
                                                            <strong>📦 Peças Utilizadas:</strong>
                                                            <ul style={{ margin: '0.5rem 0 0 1rem', padding: 0 }}>
                                                                {os.pecas.map((p, i) => (
                                                                    <li key={i} style={{ marginBottom: '0.25rem' }}>{p}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div style={{ marginTop: '1rem' }}>
                                                <Link href={`/os/${os.id}`} className="btn btn-secondary btn-sm">
                                                    Ver OS Completa →
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {/* Botão Voltar */}
                <div style={{ marginTop: '1rem' }}>
                    <Link href="/clientes" className="btn btn-secondary">
                        ← Voltar para lista
                    </Link>
                </div>
            </div>
        </>
    );
}
