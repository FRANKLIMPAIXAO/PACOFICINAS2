'use client';

import { useState } from 'react';
import { Header } from '@/components/layout';
import { Card, SearchInput, DataTable, StatusBadge, Alert } from '@/components/ui';
import Link from 'next/link';
import type { StatusOrcamento } from '@/types';

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

// Mock data
const mockOrcamentos: OrcamentoListItem[] = [
    {
        id: '1',
        numero: 1050,
        cliente_nome: 'João Silva',
        veiculo_descricao: 'Fiat Uno 2019',
        veiculo_placa: 'ABC-1234',
        data_orcamento: '2024-02-05',
        valor_total: 1250.00,
        status: 'aberto',
    },
    {
        id: '2',
        numero: 1049,
        cliente_nome: 'Maria Santos',
        veiculo_descricao: 'VW Gol 2020',
        veiculo_placa: 'XYZ-5678',
        data_orcamento: '2024-02-04',
        valor_total: 890.00,
        status: 'aprovado',
    },
    {
        id: '3',
        numero: 1048,
        cliente_nome: 'Pedro Costa',
        veiculo_descricao: 'Honda Civic 2021',
        veiculo_placa: 'DEF-9012',
        data_orcamento: '2024-02-03',
        valor_total: 3500.00,
        status: 'recusado',
    },
    {
        id: '4',
        numero: 1047,
        cliente_nome: 'Ana Oliveira',
        veiculo_descricao: 'Toyota Corolla 2022',
        veiculo_placa: 'GHI-3456',
        data_orcamento: '2024-01-28',
        valor_total: 2100.00,
        status: 'expirado',
    },
];

export default function OrcamentosPage() {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('todos');
    const [orcamentos] = useState<OrcamentoListItem[]>(mockOrcamentos);

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
            width: '150px',
            render: (item: OrcamentoListItem) => (
                <div className="flex gap-sm">
                    {item.status === 'aberto' && (
                        <button className="btn btn-success btn-sm">✓ Aprovar</button>
                    )}
                    {item.status === 'aprovado' && (
                        <Link href={`/os/nova?orcamento=${item.id}`} className="btn btn-primary btn-sm">
                            → Gerar OS
                        </Link>
                    )}
                    <button className="btn btn-ghost btn-sm">✏️</button>
                </div>
            ),
        },
    ];

    return (
        <>
            <Header title="Orçamentos" subtitle="Gerencie orçamentos de serviços" />

            <div className="page-content">
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
                    <DataTable
                        columns={columns}
                        data={filteredOrcamentos}
                        keyExtractor={(item) => item.id}
                        emptyMessage="Nenhum orçamento encontrado"
                    />
                </Card>
            </div>
        </>
    );
}
