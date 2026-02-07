'use client';

import { useState } from 'react';
import { Header } from '@/components/layout';
import { Card, SearchInput, DataTable, StatusBadge } from '@/components/ui';
import Link from 'next/link';
import type { StatusOS } from '@/types';

interface OSListItem {
    id: string;
    numero: number;
    cliente_nome: string;
    veiculo_descricao: string;
    veiculo_placa: string;
    data_abertura: string;
    valor_total: number;
    status: StatusOS;
    mecanico_nome: string | null;
}

// Mock data
const mockOS: OSListItem[] = [
    {
        id: '1',
        numero: 1042,
        cliente_nome: 'João Silva',
        veiculo_descricao: 'Fiat Uno 2019',
        veiculo_placa: 'ABC-1234',
        data_abertura: '2024-02-06T10:30:00',
        valor_total: 1250.00,
        status: 'em_execucao',
        mecanico_nome: 'Carlos Mecânico',
    },
    {
        id: '2',
        numero: 1041,
        cliente_nome: 'Maria Santos',
        veiculo_descricao: 'VW Gol 2020',
        veiculo_placa: 'XYZ-5678',
        data_abertura: '2024-02-06T08:00:00',
        valor_total: 890.00,
        status: 'aberta',
        mecanico_nome: null,
    },
    {
        id: '3',
        numero: 1040,
        cliente_nome: 'Pedro Costa',
        veiculo_descricao: 'Honda Civic 2021',
        veiculo_placa: 'DEF-9012',
        data_abertura: '2024-02-05T14:00:00',
        valor_total: 3500.00,
        status: 'aguardando_peca',
        mecanico_nome: 'Carlos Mecânico',
    },
    {
        id: '4',
        numero: 1039,
        cliente_nome: 'Ana Oliveira',
        veiculo_descricao: 'Toyota Corolla 2022',
        veiculo_placa: 'GHI-3456',
        data_abertura: '2024-02-05T09:00:00',
        valor_total: 2100.00,
        status: 'finalizada',
        mecanico_nome: 'Roberto Mecânico',
    },
    {
        id: '5',
        numero: 1038,
        cliente_nome: 'Lucas Ferreira',
        veiculo_descricao: 'Chevrolet Onix 2023',
        veiculo_placa: 'JKL-7890',
        data_abertura: '2024-02-04T11:00:00',
        valor_total: 750.00,
        status: 'faturada',
        mecanico_nome: 'Carlos Mecânico',
    },
];

export default function OSPage() {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('abertas');
    const [osList] = useState<OSListItem[]>(mockOS);

    const filteredOS = osList.filter((os) => {
        const matchSearch =
            os.cliente_nome.toLowerCase().includes(search.toLowerCase()) ||
            os.veiculo_placa.toLowerCase().includes(search.toLowerCase()) ||
            os.numero.toString().includes(search);

        if (filter === 'todas') return matchSearch;
        if (filter === 'abertas') return matchSearch && ['aberta', 'em_execucao', 'aguardando_peca'].includes(os.status);
        if (filter === 'finalizadas') return matchSearch && os.status === 'finalizada';
        if (filter === 'faturadas') return matchSearch && os.status === 'faturada';
        return matchSearch;
    });

    const formatMoney = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const formatDateTime = (date: string) => {
        return new Date(date).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const columns = [
        {
            key: 'numero',
            header: 'OS',
            width: '80px',
            render: (item: OSListItem) => (
                <Link href={`/os/${item.id}`} className="action-link" style={{ fontWeight: 700 }}>
                    #{item.numero}
                </Link>
            ),
        },
        {
            key: 'data',
            header: 'Abertura',
            width: '110px',
            render: (item: OSListItem) => (
                <span className="text-sm">{formatDateTime(item.data_abertura)}</span>
            ),
        },
        {
            key: 'cliente',
            header: 'Cliente / Veículo',
            render: (item: OSListItem) => (
                <div>
                    <div style={{ fontWeight: 500 }}>{item.cliente_nome}</div>
                    <div className="text-sm text-muted">
                        {item.veiculo_descricao} • <span style={{ fontFamily: 'var(--font-mono)' }}>{item.veiculo_placa}</span>
                    </div>
                </div>
            ),
        },
        {
            key: 'mecanico',
            header: 'Mecânico',
            width: '150px',
            render: (item: OSListItem) => item.mecanico_nome || <span className="text-muted">Não atribuído</span>,
        },
        {
            key: 'valor',
            header: 'Valor',
            width: '120px',
            render: (item: OSListItem) => (
                <span style={{ fontWeight: 600 }}>{formatMoney(item.valor_total)}</span>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            width: '140px',
            render: (item: OSListItem) => <StatusBadge status={item.status} />,
        },
        {
            key: 'acoes',
            header: '',
            width: '150px',
            render: (item: OSListItem) => (
                <div className="flex gap-sm">
                    {item.status === 'aberta' && (
                        <button className="btn btn-primary btn-sm">▶ Iniciar</button>
                    )}
                    {item.status === 'em_execucao' && (
                        <button className="btn btn-success btn-sm">✓ Finalizar</button>
                    )}
                    {item.status === 'finalizada' && (
                        <button className="btn btn-primary btn-sm">💰 Faturar</button>
                    )}
                    {item.status === 'faturada' && (
                        <Link href={`/nfse?os=${item.id}`} className="btn btn-success btn-sm">
                            📄 NFS-e
                        </Link>
                    )}
                    <Link href={`/os/${item.id}`} className="btn btn-ghost btn-sm">
                        👁️
                    </Link>
                </div>
            ),
        },
    ];

    return (
        <>
            <Header title="Ordens de Serviço" subtitle="Acompanhe os serviços da oficina" />

            <div className="page-content">
                {/* Stats */}
                <div className="grid grid-cols-4 mb-lg">
                    <div className="stat-card" style={{ borderLeft: '4px solid var(--primary-500)' }}>
                        <div className="stat-card-value">
                            {osList.filter((o) => o.status === 'aberta').length}
                        </div>
                        <div className="stat-card-label">Aguardando Início</div>
                    </div>
                    <div className="stat-card" style={{ borderLeft: '4px solid var(--warning-500)' }}>
                        <div className="stat-card-value">
                            {osList.filter((o) => o.status === 'em_execucao').length}
                        </div>
                        <div className="stat-card-label">Em Execução</div>
                    </div>
                    <div className="stat-card" style={{ borderLeft: '4px solid #a855f7' }}>
                        <div className="stat-card-value">
                            {osList.filter((o) => o.status === 'aguardando_peca').length}
                        </div>
                        <div className="stat-card-label">Aguardando Peça</div>
                    </div>
                    <div className="stat-card" style={{ borderLeft: '4px solid var(--success-500)' }}>
                        <div className="stat-card-value">
                            {osList.filter((o) => o.status === 'finalizada').length}
                        </div>
                        <div className="stat-card-label">Prontas para Faturar</div>
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
                            {[
                                { key: 'abertas', label: 'Em Andamento' },
                                { key: 'finalizadas', label: 'Finalizadas' },
                                { key: 'faturadas', label: 'Faturadas' },
                                { key: 'todas', label: 'Todas' },
                            ].map((s) => (
                                <button
                                    key={s.key}
                                    className={`btn btn-sm ${filter === s.key ? 'btn-primary' : 'btn-ghost'}`}
                                    onClick={() => setFilter(s.key)}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <Link href="/os/nova" className="btn btn-primary">
                        ➕ Nova OS
                    </Link>
                </div>

                <Card noPadding>
                    <DataTable
                        columns={columns}
                        data={filteredOS}
                        keyExtractor={(item) => item.id}
                        emptyMessage="Nenhuma OS encontrada"
                    />
                </Card>
            </div>
        </>
    );
}
