'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Card, SearchInput, DataTable, StatusBadge, Alert } from '@/components/ui';
import Link from 'next/link';
import type { StatusOS } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { getUserEmpresaId } from '@/lib/supabase/helpers';

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

export default function OSPage() {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('abertas');
    const [osList, setOsList] = useState<OSListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showError, setShowError] = useState('');

    const [empresaId, setEmpresaId] = useState<string | null>(null);

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

        async function loadOS() {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('ordens_servico')
                    .select(`
                        *,
                        clientes(nome),
                        veiculos(placa, marca, modelo, ano_modelo),
                        mecanico:usuarios!ordens_servico_mecanico_id_fkey(nome)
                    `)
                    .eq('empresa_id', empresaId)
                    .order('numero', { ascending: false });

                if (error) {
                    console.error('Erro ao carregar OS:', error);
                    setShowError('Erro ao carregar OS: ' + error.message);
                } else {
                    const osFormatadas = (data || []).map((os: any) => ({
                        id: os.id,
                        numero: os.numero,
                        cliente_nome: os.clientes?.nome || 'Cliente não encontrado',
                        veiculo_descricao: os.veiculos ? `${os.veiculos.marca} ${os.veiculos.modelo} ${os.veiculos.ano_modelo}` : '-',
                        veiculo_placa: os.veiculos?.placa || '-',
                        data_abertura: os.data_abertura,
                        valor_total: os.valor_total || 0,
                        status: os.status,
                        mecanico_nome: os.mecanico?.nome || null,
                    }));
                    setOsList(osFormatadas);
                }
            } catch (err) {
                console.error('Erro:', err);
                setShowError('Erro ao conectar com o banco de dados');
            } finally {
                setLoading(false);
            }
        }

        loadOS();
    }, [empresaId]);

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

    const handleIniciar = async (id: string) => {
        try {
            const { error } = await supabase
                .from('ordens_servico')
                .update({ status: 'em_execucao' })
                .eq('id', id);

            if (error) throw error;

            setOsList(prev => prev.map(os =>
                os.id === id ? { ...os, status: 'em_execucao' as StatusOS } : os
            ));
        } catch (err: any) {
            setShowError('Erro ao iniciar: ' + err.message);
        }
    };

    const handleFinalizar = async (id: string) => {
        try {
            const { error } = await supabase
                .from('ordens_servico')
                .update({ status: 'finalizada', data_conclusao: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;

            setOsList(prev => prev.map(os =>
                os.id === id ? { ...os, status: 'finalizada' as StatusOS } : os
            ));
        } catch (err: any) {
            setShowError('Erro ao finalizar: ' + err.message);
        }
    };

    const handleFaturar = async (id: string) => {
        try {
            // Buscar dados da OS para criar conta a receber
            const { data: osData, error: osError } = await supabase
                .from('ordens_servico')
                .select('*, clientes(nome)')
                .eq('id', id)
                .single();

            if (osError) throw osError;

            // Atualizar status da OS
            const { error } = await supabase
                .from('ordens_servico')
                .update({ status: 'faturada' })
                .eq('id', id);

            if (error) throw error;

            // Criar conta a receber
            const dataVencimento = new Date();
            dataVencimento.setDate(dataVencimento.getDate() + 30); // Vencimento em 30 dias

            await supabase
                .from('contas_receber')
                .insert({
                    empresa_id: empresaId,
                    cliente_id: osData.cliente_id,
                    os_id: osData.id,
                    descricao: `OS #${osData.numero} - ${osData.clientes?.nome || 'Cliente'}`,
                    valor: osData.valor_total,
                    data_emissao: new Date().toISOString().split('T')[0],
                    data_vencimento: dataVencimento.toISOString().split('T')[0],
                    status: 'aberto',
                    origem: 'os',
                });

            setOsList(prev => prev.map(os =>
                os.id === id ? { ...os, status: 'faturada' as StatusOS } : os
            ));
        } catch (err: any) {
            setShowError('Erro ao faturar: ' + err.message);
        }
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
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleIniciar(item.id)}
                        >
                            ▶ Iniciar
                        </button>
                    )}
                    {item.status === 'em_execucao' && (
                        <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleFinalizar(item.id)}
                        >
                            ✓ Finalizar
                        </button>
                    )}
                    {item.status === 'finalizada' && (
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleFaturar(item.id)}
                        >
                            💰 Faturar
                        </button>
                    )}
                    {item.status === 'faturada' && (
                        <Link href={`/nfse/emitir?os=${item.id}`} className="btn btn-success btn-sm">
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
                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center' }}>
                            Carregando ordens de serviço...
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={filteredOS}
                            keyExtractor={(item) => item.id}
                            emptyMessage="Nenhuma OS encontrada. Clique em 'Nova OS' para criar."
                        />
                    )}
                </Card>
            </div>
        </>
    );
}
