'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Card } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { getUserEmpresaId } from '@/lib/supabase/helpers';

export default function RelatoriosPage() {
    const [empresaId, setEmpresaId] = useState<string | null>(null);

    const supabase = createClient();
    const [periodo, setPeriodo] = useState('mes');
    const [loading, setLoading] = useState(true);

    // Dados de faturamento
    const [faturamentoData, setFaturamentoData] = useState({
        total: 0,
        servicos: 0,
        pecas: 0,
        osFinalizadas: 0,
        ticketMedio: 0,
    });

    // Dados de contas
    const [contasData, setContasData] = useState({
        aReceber: 0,
        aPagar: 0,
        atrasadas: 0,
        saldo: 0,
    });

    // Dados de estoque
    const [estoqueData, setEstoqueData] = useState<any[]>([]);

    // Dados de OS
    const [osData, setOsData] = useState<any[]>([]);

    const formatMoney = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const getDateRange = () => {
        const now = new Date();
        let startDate: Date;

        switch (periodo) {
            case 'semana':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
                break;
            case 'trimestre':
                startDate = new Date(now);
                startDate.setMonth(now.getMonth() - 3);
                break;
            case 'ano':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            case 'mes':
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
        }

        return {
            start: startDate.toISOString().split('T')[0],
            end: now.toISOString().split('T')[0],
        };
    };

    useEffect(() => {
        async function loadEmpresaId() {
            const id = await getUserEmpresaId();
            setEmpresaId(id);
        }
        loadEmpresaId();
    }, []);


    useEffect(() => {
        loadData();
    }, [periodo]);

    const loadData = async () => {
        setLoading(true);
        const { start, end } = getDateRange();

        try {
            // Buscar OS faturadas/finalizadas do período
            const { data: osFinalizadas } = await supabase
                .from('ordens_servico')
                .select('id, valor_total, data_conclusao')
                .eq('empresa_id', empresaId)
                .in('status', ['finalizada', 'faturada'])
                .gte('data_conclusao', start)
                .lte('data_conclusao', end);

            const osList = osFinalizadas || [];
            const osIds = osList.map(os => os.id);

            // Buscar itens das OS para separar serviços e produtos
            let valorServicos = 0;
            let valorPecas = 0;

            if (osIds.length > 0) {
                const { data: osItens } = await supabase
                    .from('os_itens')
                    .select('tipo, valor_total')
                    .in('os_id', osIds);

                (osItens || []).forEach((item: any) => {
                    if (item.tipo === 'servico') {
                        valorServicos += parseFloat(item.valor_total) || 0;
                    } else {
                        valorPecas += parseFloat(item.valor_total) || 0;
                    }
                });
            }

            const totalFaturado = osList.reduce((sum, os) => sum + (parseFloat(os.valor_total) || 0), 0);
            const osCount = osList.length;

            setFaturamentoData({
                total: totalFaturado,
                servicos: valorServicos,
                pecas: valorPecas,
                osFinalizadas: osCount,
                ticketMedio: osCount > 0 ? totalFaturado / osCount : 0,
            });

            // Buscar contas a receber em aberto
            const { data: contasReceber } = await supabase
                .from('contas_receber')
                .select('valor, data_vencimento')
                .eq('empresa_id', empresaId)
                .eq('status', 'aberto');

            const hoje = new Date().toISOString().split('T')[0];
            let totalReceber = 0;
            let receberAtrasadas = 0;

            (contasReceber || []).forEach((conta: any) => {
                const valor = parseFloat(conta.valor) || 0;
                totalReceber += valor;
                if (conta.data_vencimento < hoje) {
                    receberAtrasadas += valor;
                }
            });

            // Buscar contas a pagar em aberto
            const { data: contasPagar } = await supabase
                .from('contas_pagar')
                .select('valor, data_vencimento')
                .eq('empresa_id', empresaId)
                .eq('status', 'aberto');

            let totalPagar = 0;
            let pagarAtrasadas = 0;

            (contasPagar || []).forEach((conta: any) => {
                const valor = parseFloat(conta.valor) || 0;
                totalPagar += valor;
                if (conta.data_vencimento < hoje) {
                    pagarAtrasadas += valor;
                }
            });

            setContasData({
                aReceber: totalReceber,
                aPagar: totalPagar,
                atrasadas: receberAtrasadas + pagarAtrasadas,
                saldo: totalReceber - totalPagar,
            });

            // Buscar produtos com estoque baixo
            const { data: produtosBaixos } = await supabase
                .from('produtos')
                .select('codigo, descricao, estoque_atual, estoque_minimo')
                .eq('empresa_id', empresaId)
                .eq('ativo', true)
                .order('estoque_atual', { ascending: true })
                .limit(10);

            const estoqueBaixo = (produtosBaixos || []).filter(
                (p: any) => (p.estoque_atual || 0) < (p.estoque_minimo || 5)
            );

            setEstoqueData(estoqueBaixo);

            // Buscar contagem de OS por status
            const { data: todasOS } = await supabase
                .from('ordens_servico')
                .select('status')
                .eq('empresa_id', empresaId)
                .not('status', 'in', '(cancelada)');

            const statusCount: Record<string, number> = {};
            (todasOS || []).forEach((os: any) => {
                statusCount[os.status] = (statusCount[os.status] || 0) + 1;
            });

            const statusColors: Record<string, string> = {
                aberta: 'var(--primary-500)',
                em_execucao: 'var(--warning-500)',
                aguardando_peca: '#a855f7',
                finalizada: 'var(--success-500)',
                faturada: 'var(--info-500)',
            };

            const statusLabels: Record<string, string> = {
                aberta: 'Abertas',
                em_execucao: 'Em Execução',
                aguardando_peca: 'Aguardando Peça',
                finalizada: 'Finalizadas',
                faturada: 'Faturadas',
            };

            const osStats = Object.entries(statusCount).map(([status, quantidade]) => ({
                status: statusLabels[status] || status,
                quantidade,
                cor: statusColors[status] || 'var(--gray-500)',
            }));

            setOsData(osStats);

        } catch (err) {
            console.error('Erro ao carregar dados:', err);
        } finally {
            setLoading(false);
        }
    };

    const totalOS = osData.reduce((acc, item) => acc + item.quantidade, 0);

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

                {loading ? (
                    <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>Carregando...</div>
                ) : (
                    <>
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
                                    <div className="p-md" style={{ background: 'var(--success-50)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success-600)' }}>
                                            {formatMoney(contasData.aReceber)}
                                        </div>
                                        <div className="text-sm text-muted">A Receber</div>
                                    </div>
                                    <div className="p-md" style={{ background: 'var(--error-50)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
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
                                <div className="p-md" style={{ background: contasData.saldo >= 0 ? 'var(--success-50)' : 'var(--error-50)', borderRadius: 'var(--radius-md)' }}>
                                    <div className="flex justify-between items-center">
                                        <span style={{ fontWeight: 500 }}>Saldo Previsto:</span>
                                        <span style={{ fontSize: '1.25rem', fontWeight: 700, color: contasData.saldo >= 0 ? 'var(--success-600)' : 'var(--error-600)' }}>
                                            {formatMoney(contasData.saldo)}
                                        </span>
                                    </div>
                                </div>
                            </Card>

                            {/* OS por Status */}
                            <Card title="🔧 Ordens de Serviço por Status">
                                {osData.length === 0 ? (
                                    <p className="text-muted">Nenhuma OS encontrada</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                                        {osData.map((item) => (
                                            <div key={item.status} className="flex items-center gap-md">
                                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: item.cor }}></div>
                                                <span style={{ flex: 1 }}>{item.status}</span>
                                                <div style={{ flex: 2, background: 'var(--gray-100)', borderRadius: 'var(--radius-full)', height: 8, overflow: 'hidden' }}>
                                                    <div style={{ width: `${totalOS > 0 ? (item.quantidade / totalOS) * 100 : 0}%`, height: '100%', background: item.cor, borderRadius: 'var(--radius-full)' }}></div>
                                                </div>
                                                <span style={{ fontWeight: 600, minWidth: 30, textAlign: 'right' }}>{item.quantidade}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="divider"></div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted">Total de OS ativas:</span>
                                    <span style={{ fontWeight: 600 }}>{totalOS}</span>
                                </div>
                            </Card>
                        </div>

                        {/* Estoque Baixo */}
                        <Card title="⚠️ Produtos com Estoque Baixo" className="mt-lg">
                            {estoqueData.length === 0 ? (
                                <p className="text-muted" style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
                                    ✅ Nenhum produto com estoque baixo
                                </p>
                            ) : (
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
                                                        <span style={{ color: item.estoque_atual === 0 ? 'var(--error-600)' : 'var(--warning-600)', fontWeight: 600 }}>
                                                            {item.estoque_atual || 0}
                                                        </span>
                                                    </td>
                                                    <td>{item.estoque_minimo || 5}</td>
                                                    <td style={{ fontWeight: 600 }}>{(item.estoque_minimo || 5) - (item.estoque_atual || 0)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card>
                    </>
                )}
            </div>
        </>
    );
}
