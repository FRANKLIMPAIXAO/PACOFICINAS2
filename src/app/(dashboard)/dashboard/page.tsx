'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { StatCard, Card, StatusBadge } from '@/components/ui';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getUserEmpresaId } from '@/lib/supabase/helpers';

interface DashboardStats {
    faturamentoMes: number;
    osAbertas: number;
    contasVencidas: number;
    estoqueBaixo: number;
}

interface OSRecente {
    id: string;
    numero: number;
    cliente_nome: string;
    veiculo_info: string;
    placa: string;
    status: string;
}

interface ContaVencer {
    id: string;
    descricao: string;
    valor: number;
    vencimento: string;
    tipo: 'pagar' | 'receber';
}

export default function DashboardPage() {
    const [empresaId, setEmpresaId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats>({
        faturamentoMes: 0,
        osAbertas: 0,
        contasVencidas: 0,
        estoqueBaixo: 0,
    });
    const [osRecentes, setOsRecentes] = useState<OSRecente[]>([]);
    const [contasVencer, setContasVencer] = useState<ContaVencer[]>([]);

    const supabase = createClient();

    useEffect(() => {
        async function loadEmpresaId() {
            const id = await getUserEmpresaId();
            setEmpresaId(id);
        }
        loadEmpresaId();
    }, []);

    useEffect(() => {
        if (!empresaId) return;
        loadDashboardData();
    }, [empresaId]);

    async function loadDashboardData() {
        if (!empresaId) return;

        setLoading(true);
        try {
            // Carregar OS recentes
            const { data: osData } = await supabase
                .from('ordens_servico')
                .select(`
                    id,
                    numero,
                    status,
                    clientes(nome),
                    veiculos(placa, marca, modelo)
                `)
                .eq('empresa_id', empresaId)
                .order('created_at', { ascending: false })
                .limit(4);

            if (osData) {
                const formattedOS = osData.map((os: any) => ({
                    id: os.id,
                    numero: os.numero,
                    cliente_nome: os.clientes?.nome || 'Cliente não encontrado',
                    veiculo_info: `${os.veiculos?.marca || ''} ${os.veiculos?.modelo || ''}`.trim() || 'Veículo',
                    placa: os.veiculos?.placa || '-',
                    status: os.status || 'aberta'
                }));
                setOsRecentes(formattedOS);
            }

            // Contar OS abertas
            const { count: osAbertasCount } = await supabase
                .from('ordens_servico')
                .select('*', { count: 'exact', head: true })
                .eq('empresa_id', empresaId)
                .in('status', ['aberta', 'em_execucao', 'aguardando_peca']);

            // Contar produtos com estoque baixo
            // Buscar produtos com estoque baixo (comparação de colunas feita no JS)
            const { data: produtosBaixoEstoque } = await supabase
                .from('produtos')
                .select('estoque_atual, estoque_minimo')
                .eq('empresa_id', empresaId);

            const estoqueBaixoCount = produtosBaixoEstoque?.filter(
                (p: any) => p.estoque_atual <= p.estoque_minimo
            ).length || 0;

            setStats({
                faturamentoMes: 0, // TODO: calcular faturamento real
                osAbertas: osAbertasCount || 0,
                contasVencidas: 0, // TODO: implementar contas
                estoqueBaixo: estoqueBaixoCount,
            });

        } catch (err) {
            console.error('Erro ao carregar dashboard:', err);
        } finally {
            setLoading(false);
        }
    }

    const formatMoney = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            'aberta': 'Aberta',
            'em_execucao': 'Em Execução',
            'aguardando_peca': 'Aguardando Peça',
            'finalizada': 'Finalizada',
            'cancelada': 'Cancelada'
        };
        return labels[status] || status;
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, 'blue' | 'yellow' | 'orange' | 'green' | 'gray'> = {
            'aberta': 'blue',
            'em_execucao': 'yellow',
            'aguardando_peca': 'orange',
            'finalizada': 'green',
            'cancelada': 'gray'
        };
        return colors[status] || 'gray';
    };

    if (!empresaId) {
        return (
            <>
                <Header title="Dashboard" subtitle="Visão geral da sua oficina" />
                <div className="page-content">
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                        Carregando informações da empresa...
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Header title="Dashboard" subtitle="Visão geral da sua oficina" />

            <div className="page-content">
                {/* Stats Grid */}
                <div className="grid grid-cols-4 mb-xl">
                    <StatCard
                        icon="💰"
                        label="Faturamento do Mês"
                        value={formatMoney(stats.faturamentoMes)}
                        color="green"
                        trend={stats.faturamentoMes > 0 ? { value: 12, label: 'vs. mês anterior' } : undefined}
                    />
                    <StatCard
                        icon="🔧"
                        label="OS em Andamento"
                        value={stats.osAbertas}
                        color="blue"
                    />
                    <StatCard
                        icon="⚠️"
                        label="Contas Vencidas"
                        value={stats.contasVencidas}
                        color="red"
                    />
                    <StatCard
                        icon="📦"
                        label="Estoque Baixo"
                        value={stats.estoqueBaixo}
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
                    <Link href="/clientes" className="btn btn-secondary btn-lg" style={{ justifyContent: 'flex-start' }}>
                        👤 Novo Cliente
                    </Link>
                    <Link href="/xml" className="btn btn-secondary btn-lg" style={{ justifyContent: 'flex-start' }}>
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
                        {loading ? (
                            <div style={{ padding: '2rem', textAlign: 'center' }}>
                                Carregando...
                            </div>
                        ) : osRecentes.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-500)' }}>
                                Nenhuma OS cadastrada ainda
                            </div>
                        ) : (
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
                                        {osRecentes.map((os) => (
                                            <tr key={os.id}>
                                                <td>
                                                    <Link href={`/os/${os.id}`} className="action-link">
                                                        #{os.numero}
                                                    </Link>
                                                </td>
                                                <td>{os.cliente_nome}</td>
                                                <td>
                                                    <div>{os.veiculo_info}</div>
                                                    <div className="text-sm text-muted">{os.placa}</div>
                                                </td>
                                                <td>
                                                    <StatusBadge
                                                        status={os.status}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>

                    {/* Próximas Contas */}
                    <Card
                        title="Próximas Contas"
                        actions={
                            <Link href="/financeiro" className="action-link text-sm">
                                Ver todas →
                            </Link>
                        }
                        noPadding
                    >
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-500)' }}>
                            Módulo financeiro em desenvolvimento
                        </div>
                    </Card>
                </div>
            </div>
        </>
    );
}
