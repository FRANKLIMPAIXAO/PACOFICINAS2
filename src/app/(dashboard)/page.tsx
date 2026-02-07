'use client';

import { Header } from '@/components/layout';
import { StatCard, Card, StatusBadge } from '@/components/ui';
import Link from 'next/link';

// Mock data for demonstration
const mockStats = {
    faturamentoMes: 45850.00,
    osAbertas: 12,
    contasVencidas: 3,
    estoqueBaixo: 8,
};

const mockOSRecentes = [
    { id: '1', numero: 1042, cliente: 'João Silva', veiculo: 'Fiat Uno', placa: 'ABC-1234', status: 'em_execucao' },
    { id: '2', numero: 1041, cliente: 'Maria Santos', veiculo: 'VW Gol', placa: 'XYZ-5678', status: 'aberta' },
    { id: '3', numero: 1040, cliente: 'Pedro Costa', veiculo: 'Honda Civic', placa: 'DEF-9012', status: 'aguardando_peca' },
    { id: '4', numero: 1039, cliente: 'Ana Oliveira', veiculo: 'Toyota Corolla', placa: 'GHI-3456', status: 'finalizada' },
];

const mockContasVencer = [
    { id: '1', descricao: 'Fornecedor XYZ - Peças', valor: 1250.00, vencimento: '10/02/2026' },
    { id: '2', descricao: 'Cliente João - OS #1038', valor: 850.00, vencimento: '12/02/2026', tipo: 'receber' },
    { id: '3', descricao: 'Aluguel', valor: 2500.00, vencimento: '15/02/2026' },
];

export default function DashboardPage() {
    const formatMoney = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    return (
        <>
            <Header title="Dashboard" subtitle="Visão geral da sua oficina" />

            <div className="page-content">
                {/* Stats Grid */}
                <div className="grid grid-cols-4 mb-xl">
                    <StatCard
                        icon="💰"
                        label="Faturamento do Mês"
                        value={formatMoney(mockStats.faturamentoMes)}
                        color="green"
                        trend={{ value: 12, label: 'vs. mês anterior' }}
                    />
                    <StatCard
                        icon="🔧"
                        label="OS em Andamento"
                        value={mockStats.osAbertas}
                        color="blue"
                    />
                    <StatCard
                        icon="⚠️"
                        label="Contas Vencidas"
                        value={mockStats.contasVencidas}
                        color="red"
                    />
                    <StatCard
                        icon="📦"
                        label="Estoque Baixo"
                        value={mockStats.estoqueBaixo}
                        color="yellow"
                    />
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-4 mb-xl" style={{ gap: 'var(--spacing-md)' }}>
                    <Link href="/os/nova" className="btn btn-primary btn-lg" style={{ justifyContent: 'flex-start' }}>
                        ➕ Nova OS
                    </Link>
                    <Link href="/orcamentos/novo" className="btn btn-secondary btn-lg" style={{ justifyContent: 'flex-start' }}>
                        📝 Novo Orçamento
                    </Link>
                    <Link href="/clientes/novo" className="btn btn-secondary btn-lg" style={{ justifyContent: 'flex-start' }}>
                        👤 Novo Cliente
                    </Link>
                    <Link href="/xml-import" className="btn btn-secondary btn-lg" style={{ justifyContent: 'flex-start' }}>
                        📄 Importar XML
                    </Link>
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-2">
                    {/* OS Recentes */}
                    <Card
                        title="Ordens de Serviço Recentes"
                        actions={
                            <Link href="/os" className="action-link text-sm">
                                Ver todas →
                            </Link>
                        }
                        noPadding
                    >
                        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>OS</th>
                                        <th>Cliente</th>
                                        <th>Veículo</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mockOSRecentes.map((os) => (
                                        <tr key={os.id}>
                                            <td>
                                                <Link href={`/os/${os.id}`} className="action-link">
                                                    #{os.numero}
                                                </Link>
                                            </td>
                                            <td>{os.cliente}</td>
                                            <td>
                                                <div>{os.veiculo}</div>
                                                <div className="text-sm text-muted">{os.placa}</div>
                                            </td>
                                            <td>
                                                <StatusBadge status={os.status} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Contas a Vencer */}
                    <Card
                        title="Próximas Contas"
                        actions={
                            <Link href="/financeiro" className="action-link text-sm">
                                Ver todas →
                            </Link>
                        }
                        noPadding
                    >
                        <div style={{ padding: 'var(--spacing-md)' }}>
                            {mockContasVencer.map((conta) => (
                                <div
                                    key={conta.id}
                                    className="flex items-center justify-between"
                                    style={{
                                        padding: 'var(--spacing-md)',
                                        borderBottom: '1px solid var(--border)',
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 500 }}>{conta.descricao}</div>
                                        <div className="text-sm text-muted">Vence em {conta.vencimento}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div
                                            style={{
                                                fontWeight: 600,
                                                color: conta.tipo === 'receber' ? 'var(--success-600)' : 'var(--error-600)',
                                            }}
                                        >
                                            {conta.tipo === 'receber' ? '+' : '-'} {formatMoney(conta.valor)}
                                        </div>
                                        <span className={`badge ${conta.tipo === 'receber' ? 'badge-success' : 'badge-error'}`}>
                                            {conta.tipo === 'receber' ? 'A Receber' : 'A Pagar'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </>
    );
}
