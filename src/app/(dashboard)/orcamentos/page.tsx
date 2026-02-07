'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Card, SearchInput, DataTable, StatusBadge, Alert } from '@/components/ui';
import Link from 'next/link';
import type { StatusOrcamento } from '@/types';
import { createClient } from '@/lib/supabase/client';

interface OrcamentoListItem {
    id: string;
    numero: number;
    cliente_nome: string;
    veiculo_descricao: string;
    veiculo_placa: string;
    data_orcamento: string;
    valor_total: number;
    status: StatusOrcamento;
}

export default function OrcamentosPage() {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('todos');
    const [orcamentos, setOrcamentos] = useState<OrcamentoListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showError, setShowError] = useState('');
    const [empresaId, setEmpresaId] = useState<string | null>(null);

    const supabase = createClient();

    useEffect(() => {
        async function loadEmpresaId() {
            const { getUserEmpresaId } = await import('@/lib/supabase/helpers');
            const id = await getUserEmpresaId();
            setEmpresaId(id);
        }
        loadEmpresaId();
    }, []);

    useEffect(() => {
        if (!empresaId) return;

        async function loadOrcamentos() {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('orcamentos')
                    .select(`
                        *,
                        clientes(nome),
                        veiculos(placa, marca, modelo, ano_modelo)
                    `)
                    .eq('empresa_id', empresaId)
                    .order('numero', { ascending: false });

                if (error) {
                    console.error('Erro ao carregar orçamentos:', error);
                    setShowError('Erro ao carregar orçamentos: ' + error.message);
                } else {
                    const orcamentosFormatados = (data || []).map((o: any) => ({
                        id: o.id,
                        numero: o.numero,
                        cliente_nome: o.clientes?.nome || 'Cliente não encontrado',
                        veiculo_descricao: o.veiculos ? `${o.veiculos.marca} ${o.veiculos.modelo} ${o.veiculos.ano_modelo}` : '-',
                        veiculo_placa: o.veiculos?.placa || '-',
                        data_orcamento: o.data_orcamento,
                        valor_total: o.valor_total || 0,
                        status: o.status,
                    }));
                    setOrcamentos(orcamentosFormatados);
                }
            } catch (err) {
                console.error('Erro:', err);
                setShowError('Erro ao conectar com o banco de dados');
            } finally {
                setLoading(false);
            }
        }

        loadOrcamentos();
    }, [empresaId]);

    const filteredOrcamentos = orcamentos.filter((o) => {
        const matchSearch =
            o.cliente_nome.toLowerCase().includes(search.toLowerCase()) ||
            o.veiculo_placa.toLowerCase().includes(search.toLowerCase()) ||
            o.numero.toString().includes(search);

        if (filter === 'todos') return matchSearch;
        return matchSearch && o.status === filter;
    });

    const formatMoney = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('pt-BR');
    };

    const handleAprovar = async (id: string) => {
        try {
            const { error } = await supabase
                .from('orcamentos')
                .update({ status: 'aprovado' })
                .eq('id', id);

            if (error) throw error;

            setOrcamentos(prev => prev.map(o =>
                o.id === id ? { ...o, status: 'aprovado' as StatusOrcamento } : o
            ));
        } catch (err: any) {
            setShowError('Erro ao aprovar: ' + err.message);
        }
    };

    const handleRecusar = async (id: string) => {
        try {
            const { error } = await supabase
                .from('orcamentos')
                .update({ status: 'recusado' })
                .eq('id', id);

            if (error) throw error;

            setOrcamentos(prev => prev.map(o =>
                o.id === id ? { ...o, status: 'recusado' as StatusOrcamento } : o
            ));
        } catch (err: any) {
            setShowError('Erro ao recusar: ' + err.message);
        }
    };

    const columns = [
        {
            key: 'numero',
            header: 'Nº',
            width: '80px',
            render: (item: OrcamentoListItem) => (
                <Link href={`/orcamentos/${item.id}`} className="action-link" style={{ fontWeight: 600 }}>
                    #{item.numero}
                </Link>
            ),
        },
        {
            key: 'data',
            header: 'Data',
            width: '100px',
            render: (item: OrcamentoListItem) => formatDate(item.data_orcamento),
        },
        {
            key: 'cliente',
            header: 'Cliente',
            render: (item: OrcamentoListItem) => (
                <div>
                    <div style={{ fontWeight: 500 }}>{item.cliente_nome}</div>
                    <div className="text-sm text-muted">
                        {item.veiculo_descricao} • {item.veiculo_placa}
                    </div>
                </div>
            ),
        },
        {
            key: 'valor',
            header: 'Valor',
            width: '120px',
            render: (item: OrcamentoListItem) => (
                <span style={{ fontWeight: 600 }}>{formatMoney(item.valor_total)}</span>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            width: '130px',
            render: (item: OrcamentoListItem) => <StatusBadge status={item.status} />,
        },
        {
            key: 'acoes',
            header: '',
            width: '180px',
            render: (item: OrcamentoListItem) => (
                <div className="flex gap-sm">
                    {item.status === 'aberto' && (
                        <>
                            <button
                                className="btn btn-success btn-sm"
                                onClick={() => handleAprovar(item.id)}
                            >
                                ✓ Aprovar
                            </button>
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => handleRecusar(item.id)}
                                title="Recusar"
                            >
                                ✕
                            </button>
                        </>
                    )}
                    {item.status === 'aprovado' && (
                        <Link href={`/os/nova?orcamento=${item.id}`} className="btn btn-primary btn-sm">
                            → Gerar OS
                        </Link>
                    )}
                </div>
            ),
        },
    ];

    return (
        <>
            <Header title="Orçamentos" subtitle="Gerencie orçamentos de serviços" />

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
                    <div className="stat-card">
                        <div className="stat-card-value">{orcamentos.filter((o) => o.status === 'aberto').length}</div>
                        <div className="stat-card-label">Em Aberto</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-value" style={{ color: 'var(--success-600)' }}>
                            {orcamentos.filter((o) => o.status === 'aprovado').length}
                        </div>
                        <div className="stat-card-label">Aprovados</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-value" style={{ color: 'var(--error-600)' }}>
                            {orcamentos.filter((o) => o.status === 'recusado').length}
                        </div>
                        <div className="stat-card-label">Recusados</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-value">
                            {formatMoney(orcamentos.filter((o) => o.status === 'aberto').reduce((acc, o) => acc + o.valor_total, 0))}
                        </div>
                        <div className="stat-card-label">Valor em Aberto</div>
                    </div>
                </div>

                <div className="page-header">
                    <div className="flex gap-md items-center">
                        <SearchInput
                            value={search}
                            onChange={setSearch}
                            placeholder="Buscar por número, cliente ou placa..."
                        />
                        <div className="flex gap-sm">
                            {['todos', 'aberto', 'aprovado', 'recusado'].map((s) => (
                                <button
                                    key={s}
                                    className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-ghost'}`}
                                    onClick={() => setFilter(s)}
                                >
                                    {s === 'todos' ? 'Todos' : s.charAt(0).toUpperCase() + s.slice(1) + 's'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <Link href="/orcamentos/novo" className="btn btn-primary">
                        ➕ Novo Orçamento
                    </Link>
                </div>

                <Card noPadding>
                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center' }}>
                            Carregando orçamentos...
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={filteredOrcamentos}
                            keyExtractor={(item) => item.id}
                            emptyMessage="Nenhum orçamento encontrado. Clique em 'Novo Orçamento' para criar."
                        />
                    )}
                </Card>
            </div>
        </>
    );
}
