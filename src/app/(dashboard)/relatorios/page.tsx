'use client';

import { useState } from 'react';
import { Header } from '@/components/layout';
import { Card, StatCard } from '@/components/ui';

export default function RelatoriosPage() {
    const [periodo, setPeriodo] = useState('mes');

    const formatMoney = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    // Mock data para relatórios
    const faturamentoData = {
        total: 45850.00,
        servicos: 28500.00,
        pecas: 17350.00,
        osFinalizadas: 23,
        ticketMedio: 1993.48,
    };

    const contasData = {
        aReceber: 12500.00,
        aPagar: 8750.00,
        atrasadas: 3500.00,
        saldo: 3750.00,
    };

    const estoqueData = [
        { codigo: 'VE001', descricao: 'Vela de Ignição NGK', estoque: 0, minimo: 8 },
        { codigo: 'PA001', descricao: 'Pastilha de Freio Gol G5', estoque: 3, minimo: 5 },
        { codigo: 'FI002', descricao: 'Filtro de Ar Civic', estoque: 2, minimo: 4 },
        { codigo: 'OL002', descricao: 'Óleo 10W40 Semi-Sintético', estoque: 4, minimo: 10 },
    ];

    const osData = [
        { status: 'Abertas', quantidade: 5, cor: 'var(--primary-500)' },
        { status: 'Em Execução', quantidade: 8, cor: 'var(--warning-500)' },
        { status: 'Aguardando Peça', quantidade: 3, cor: '#a855f7' },
        { status: 'Finalizadas', quantidade: 7, cor: 'var(--success-500)' },
    ];

    return (
        <>
            <Header title="Relatórios" subtitle="Análises e indicadores da oficina" />

            <div className="page-content">
                {/* Período */}
                <div className="flex gap-sm mb-lg">
                    {[
                        { key: 'semana', label: 'Esta Semana' },
                        { key: 'mes', label: 'Este Mês' },
                        { key: 'trimestre', label: 'Trimestre' },
                        { key: 'ano', label: 'Este Ano' },
                    ].map((p) => (
                        <button
                            key={p.key}
                            className={`btn btn-sm ${periodo === p.key ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setPeriodo(p.key)}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                {/* Faturamento */}
                <Card title="💰 Faturamento Mensal" className="mb-lg">
                    <div className="grid grid-cols-4" style={{ gap: 'var(--spacing-lg)' }}>
                        <div className="stat-card" style={{ borderLeft: '4px solid var(--success-500)' }}>
                            <div className="stat-card-value">{formatMoney(faturamentoData.total)}</div>
                            <div className="stat-card-label">Total Faturado</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card-value">{formatMoney(faturamentoData.servicos)}</div>
                            <div className="stat-card-label">Em Serviços</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card-value">{formatMoney(faturamentoData.pecas)}</div>
                            <div className="stat-card-label">Em Peças</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card-value">{faturamentoData.osFinalizadas}</div>
                            <div className="stat-card-label">OS Finalizadas</div>
                        </div>
                    </div>

                    <div className="divider"></div>

                    <div className="flex justify-between items-center">
                        <span className="text-muted">Ticket Médio por OS:</span>
                        <span style={{ fontWeight: 600, fontSize: '1.25rem' }}>
                            {formatMoney(faturamentoData.ticketMedio)}
                        </span>
                    </div>
                </Card>

                <div className="grid grid-cols-2">
                    {/* Contas em Aberto */}
                    <Card title="📊 Contas em Aberto">
                        <div className="grid grid-cols-2" style={{ gap: 'var(--spacing-md)' }}>
                            <div
                                className="p-md"
                                style={{
                                    background: 'var(--success-50)',
                                    borderRadius: 'var(--radius-md)',
                                    textAlign: 'center',
                                }}
                            >
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success-600)' }}>
                                    {formatMoney(contasData.aReceber)}
                                </div>
                                <div className="text-sm text-muted">A Receber</div>
                            </div>
                            <div
                                className="p-md"
                                style={{
                                    background: 'var(--error-50)',
                                    borderRadius: 'var(--radius-md)',
                                    textAlign: 'center',
                                }}
                            >
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--error-600)' }}>
                                    {formatMoney(contasData.aPagar)}
                                </div>
                                <div className="text-sm text-muted">A Pagar</div>
                            </div>
                        </div>

                        <div className="divider"></div>

                        <div className="flex justify-between items-center mb-md">
                            <span>Contas Atrasadas:</span>
                            <span style={{ fontWeight: 600, color: 'var(--warning-600)' }}>
                                {formatMoney(contasData.atrasadas)}
                            </span>
                        </div>

                        <div
                            className="p-md"
                            style={{
                                background: contasData.saldo >= 0 ? 'var(--success-50)' : 'var(--error-50)',
                                borderRadius: 'var(--radius-md)',
                            }}
                        >
                            <div className="flex justify-between items-center">
                                <span style={{ fontWeight: 500 }}>Saldo Previsto:</span>
                                <span
                                    style={{
                                        fontSize: '1.25rem',
                                        fontWeight: 700,
                                        color: contasData.saldo >= 0 ? 'var(--success-600)' : 'var(--error-600)',
                                    }}
                                >
                                    {formatMoney(contasData.saldo)}
                                </span>
                            </div>
                        </div>
                    </Card>

                    {/* OS por Status */}
                    <Card title="🔧 Ordens de Serviço por Status">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                            {osData.map((item) => (
                                <div key={item.status} className="flex items-center gap-md">
                                    <div
                                        style={{
                                            width: 12,
                                            height: 12,
                                            borderRadius: '50%',
                                            background: item.cor,
                                        }}
                                    ></div>
                                    <span style={{ flex: 1 }}>{item.status}</span>
                                    <div
                                        style={{
                                            flex: 2,
                                            background: 'var(--gray-100)',
                                            borderRadius: 'var(--radius-full)',
                                            height: 8,
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: `${(item.quantidade / 23) * 100}%`,
                                                height: '100%',
                                                background: item.cor,
                                                borderRadius: 'var(--radius-full)',
                                            }}
                                        ></div>
                                    </div>
                                    <span style={{ fontWeight: 600, minWidth: 30, textAlign: 'right' }}>
                                        {item.quantidade}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="divider"></div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted">Total de OS ativas:</span>
                            <span style={{ fontWeight: 600 }}>
                                {osData.reduce((acc, item) => acc + item.quantidade, 0)}
                            </span>
                        </div>
                    </Card>
                </div>

                {/* Estoque Baixo */}
                <Card title="⚠️ Produtos com Estoque Baixo" className="mt-lg">
                    <div className="table-wrapper" style={{ border: 'none' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Produto</th>
                                    <th>Estoque Atual</th>
                                    <th>Estoque Mínimo</th>
                                    <th>Repor</th>
                                </tr>
                            </thead>
                            <tbody>
                                {estoqueData.map((item) => (
                                    <tr key={item.codigo}>
                                        <td style={{ fontFamily: 'var(--font-mono)' }}>{item.codigo}</td>
                                        <td>{item.descricao}</td>
                                        <td>
                                            <span
                                                style={{
                                                    color: item.estoque === 0 ? 'var(--error-600)' : 'var(--warning-600)',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {item.estoque}
                                            </span>
                                        </td>
                                        <td>{item.minimo}</td>
                                        <td style={{ fontWeight: 600 }}>{item.minimo - item.estoque}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </>
    );
}
