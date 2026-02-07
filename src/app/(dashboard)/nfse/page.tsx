'use client';

import { useState } from 'react';
import { Header } from '@/components/layout';
import { Card, SearchInput, DataTable, StatusBadge, Modal, Alert } from '@/components/ui';
import type { NFSeListItem, StatusNFSe } from '@/types';

// Mock data para demonstração
const mockNFSe: NFSeListItem[] = [
    {
        id: '1',
        numero: 1001,
        serie: '1',
        chave_acesso: 'NFSe520870712345678901234100010000010011',
        data_emissao: '2024-02-06T14:30:00',
        valor_servicos: 1250.00,
        valor_iss: 62.50,
        valor_liquido: 1187.50,
        status: 'autorizada',
        tomador_nome: 'João Silva',
        tomador_cpf_cnpj: '123.456.789-00',
        os_numero: 1042,
        cliente_nome: 'João Silva',
        veiculo_placa: 'ABC-1234',
    },
    {
        id: '2',
        numero: 1002,
        serie: '1',
        chave_acesso: 'NFSe520870712345678901234100010000010021',
        data_emissao: '2024-02-05T10:00:00',
        valor_servicos: 890.00,
        valor_iss: 44.50,
        valor_liquido: 845.50,
        status: 'autorizada',
        tomador_nome: 'Maria Santos',
        tomador_cpf_cnpj: '987.654.321-00',
        os_numero: 1041,
        cliente_nome: 'Maria Santos',
        veiculo_placa: 'XYZ-5678',
    },
    {
        id: '3',
        numero: null,
        serie: null,
        chave_acesso: null,
        data_emissao: null,
        valor_servicos: 3500.00,
        valor_iss: null,
        valor_liquido: null,
        status: 'pendente',
        tomador_nome: 'Pedro Costa',
        tomador_cpf_cnpj: '456.789.123-00',
        os_numero: 1040,
        cliente_nome: 'Pedro Costa',
        veiculo_placa: 'DEF-9012',
    },
    {
        id: '4',
        numero: 999,
        serie: '1',
        chave_acesso: 'NFSe520870712345678901234100010000009991',
        data_emissao: '2024-01-20T16:00:00',
        valor_servicos: 750.00,
        valor_iss: 37.50,
        valor_liquido: 712.50,
        status: 'cancelada',
        tomador_nome: 'Ana Oliveira',
        tomador_cpf_cnpj: '741.852.963-00',
        os_numero: 1035,
        cliente_nome: 'Ana Oliveira',
        veiculo_placa: 'GHI-3456',
    },
];

const statusConfig: Record<StatusNFSe, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'gray' }> = {
    pendente: { label: 'Pendente', variant: 'warning' },
    processando: { label: 'Processando', variant: 'info' },
    autorizada: { label: 'Autorizada', variant: 'success' },
    cancelada: { label: 'Cancelada', variant: 'error' },
    substituida: { label: 'Substituída', variant: 'gray' },
    erro: { label: 'Erro', variant: 'error' },
};

export default function NFSePage() {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('todas');
    const [nfseList] = useState<NFSeListItem[]>(mockNFSe);
    const [selectedNFSe, setSelectedNFSe] = useState<NFSeListItem | null>(null);
    const [showXMLModal, setShowXMLModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);

    const filteredNFSe = nfseList.filter((nfse) => {
        const matchSearch =
            nfse.tomador_nome?.toLowerCase().includes(search.toLowerCase()) ||
            nfse.numero?.toString().includes(search) ||
            nfse.os_numero?.toString().includes(search) ||
            nfse.veiculo_placa?.toLowerCase().includes(search.toLowerCase());

        if (filter === 'todas') return matchSearch;
        return matchSearch && nfse.status === filter;
    });

    const formatMoney = (value: number | null) => {
        if (value === null) return '-';
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const formatDateTime = (date: string | null) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Estatísticas
    const stats = {
        total: nfseList.length,
        autorizadas: nfseList.filter(n => n.status === 'autorizada').length,
        pendentes: nfseList.filter(n => n.status === 'pendente').length,
        valorTotal: nfseList
            .filter(n => n.status === 'autorizada')
            .reduce((sum, n) => sum + n.valor_servicos, 0),
    };

    const columns = [
        {
            key: 'numero',
            header: 'Número',
            width: '100px',
            render: (item: NFSeListItem) => (
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {item.numero ? `${item.numero}/${item.serie}` : '-'}
                </span>
            ),
        },
        {
            key: 'data',
            header: 'Emissão',
            width: '140px',
            render: (item: NFSeListItem) => (
                <span className="text-sm">{formatDateTime(item.data_emissao)}</span>
            ),
        },
        {
            key: 'tomador',
            header: 'Tomador / OS',
            render: (item: NFSeListItem) => (
                <div>
                    <div style={{ fontWeight: 500 }}>{item.tomador_nome || '-'}</div>
                    <div className="text-sm text-muted">
                        OS #{item.os_numero} • <span style={{ fontFamily: 'var(--font-mono)' }}>{item.veiculo_placa}</span>
                    </div>
                </div>
            ),
        },
        {
            key: 'valor',
            header: 'Valor',
            width: '120px',
            render: (item: NFSeListItem) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{formatMoney(item.valor_servicos)}</div>
                    {item.valor_iss && (
                        <div className="text-sm text-muted">ISS: {formatMoney(item.valor_iss)}</div>
                    )}
                </div>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            width: '120px',
            render: (item: NFSeListItem) => {
                const config = statusConfig[item.status];
                return (
                    <span className={`badge badge-${config.variant}`}>
                        {config.label}
                    </span>
                );
            },
        },
        {
            key: 'acoes',
            header: '',
            width: '180px',
            render: (item: NFSeListItem) => (
                <div className="flex gap-sm">
                    {item.status === 'autorizada' && (
                        <>
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => {
                                    setSelectedNFSe(item);
                                    setShowXMLModal(true);
                                }}
                                title="Ver XML"
                            >
                                📄
                            </button>
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => window.open(`/nfse/${item.id}/danfse`, '_blank')}
                                title="DANFSE"
                            >
                                🖨️
                            </button>
                            <button
                                className="btn btn-error btn-sm"
                                onClick={() => {
                                    setSelectedNFSe(item);
                                    setShowCancelModal(true);
                                }}
                                title="Cancelar"
                            >
                                ✖️
                            </button>
                        </>
                    )}
                    {item.status === 'pendente' && (
                        <button className="btn btn-primary btn-sm">
                            📤 Enviar
                        </button>
                    )}
                    {item.status === 'erro' && (
                        <button className="btn btn-warning btn-sm">
                            🔄 Reenviar
                        </button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <>
            <Header title="NFS-e" subtitle="Notas Fiscais de Serviço Eletrônicas" />

            <div className="page-content">
                {/* Stats */}
                <div className="grid grid-cols-4 mb-lg">
                    <div className="stat-card" style={{ borderLeft: '4px solid var(--primary-500)' }}>
                        <div className="stat-card-value">{stats.total}</div>
                        <div className="stat-card-label">Total de Notas</div>
                    </div>
                    <div className="stat-card" style={{ borderLeft: '4px solid var(--success-500)' }}>
                        <div className="stat-card-value">{stats.autorizadas}</div>
                        <div className="stat-card-label">Autorizadas</div>
                    </div>
                    <div className="stat-card" style={{ borderLeft: '4px solid var(--warning-500)' }}>
                        <div className="stat-card-value">{stats.pendentes}</div>
                        <div className="stat-card-label">Pendentes</div>
                    </div>
                    <div className="stat-card" style={{ borderLeft: '4px solid var(--info-500)' }}>
                        <div className="stat-card-value">{formatMoney(stats.valorTotal)}</div>
                        <div className="stat-card-label">Faturado (Mês)</div>
                    </div>
                </div>

                <div className="page-header">
                    <div className="flex gap-md items-center">
                        <SearchInput
                            value={search}
                            onChange={setSearch}
                            placeholder="Buscar por número, cliente, OS ou placa..."
                        />
                        <div className="flex gap-sm">
                            {[
                                { key: 'todas', label: 'Todas' },
                                { key: 'autorizada', label: 'Autorizadas' },
                                { key: 'pendente', label: 'Pendentes' },
                                { key: 'cancelada', label: 'Canceladas' },
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
                    <button className="btn btn-primary">
                        ➕ Emitir NFS-e
                    </button>
                </div>

                <Card noPadding>
                    <DataTable
                        columns={columns}
                        data={filteredNFSe}
                        keyExtractor={(item) => item.id}
                        emptyMessage="Nenhuma NFS-e encontrada"
                    />
                </Card>

                {/* Informação sobre ambiente */}
                <div className="mt-lg">
                    <Alert type="info">
                        <strong>Ambiente:</strong> Homologação (Produção Restrita) |
                        Municípios: Goiânia (5208707), Aparecida de Goiânia (5201405)
                    </Alert>
                </div>
            </div>

            {/* Modal XML */}
            <Modal
                isOpen={showXMLModal}
                onClose={() => setShowXMLModal(false)}
                title={`XML NFS-e #${selectedNFSe?.numero || ''}`}
                size="lg"
            >
                <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    background: 'var(--gray-100)',
                    padding: 'var(--space-md)',
                    borderRadius: 'var(--radius-md)',
                    whiteSpace: 'pre-wrap',
                    overflow: 'auto',
                    maxHeight: '400px',
                }}>
                    {`<?xml version="1.0" encoding="UTF-8"?>
<NFSe xmlns="http://www.sped.fazenda.gov.br/nfse" versao="1.00">
  <infNFSe Id="${selectedNFSe?.chave_acesso || ''}">
    <nNFSe>${selectedNFSe?.numero || ''}</nNFSe>
    <serie>${selectedNFSe?.serie || ''}</serie>
    <dhEmi>${selectedNFSe?.data_emissao || ''}</dhEmi>
    <verAplic>PAC-OFICINAS-1.0</verAplic>
    <!-- ... resto do XML ... -->
  </infNFSe>
</NFSe>`}
                </div>
                <div className="flex gap-md mt-lg justify-end">
                    <button className="btn btn-secondary" onClick={() => setShowXMLModal(false)}>
                        Fechar
                    </button>
                    <button className="btn btn-primary">
                        📥 Baixar XML
                    </button>
                </div>
            </Modal>

            {/* Modal Cancelamento */}
            <Modal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                title="Cancelar NFS-e"
                size="md"
            >
                <Alert type="warning">
                    Atenção! O cancelamento de NFS-e é uma ação irreversível e será registrado na SEFAZ.
                </Alert>

                <div className="mt-lg">
                    <p className="mb-md">
                        <strong>NFS-e:</strong> #{selectedNFSe?.numero}/{selectedNFSe?.serie}
                    </p>
                    <p className="mb-md">
                        <strong>Tomador:</strong> {selectedNFSe?.tomador_nome}
                    </p>
                    <p className="mb-lg">
                        <strong>Valor:</strong> {formatMoney(selectedNFSe?.valor_servicos || 0)}
                    </p>

                    <label className="form-label">Motivo do Cancelamento *</label>
                    <textarea
                        className="form-input"
                        rows={3}
                        placeholder="Informe o motivo do cancelamento (mínimo 15 caracteres)"
                    />
                </div>

                <div className="flex gap-md mt-lg justify-end">
                    <button className="btn btn-secondary" onClick={() => setShowCancelModal(false)}>
                        Voltar
                    </button>
                    <button className="btn btn-error">
                        ✖️ Confirmar Cancelamento
                    </button>
                </div>
            </Modal>
        </>
    );
}
