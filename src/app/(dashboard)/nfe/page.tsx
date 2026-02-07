'use client';

import { useState } from 'react';
import { Header } from '@/components/layout';
import { Card, SearchInput, DataTable, Modal, Alert } from '@/components/ui';
import { STATUS_NFE } from '@/lib/nfe';

// Tipo para listagem
interface NFeListItem {
    id: string;
    ref: string;
    numero: string | null;
    serie: string | null;
    chave_nfe: string | null;
    data_emissao: string | null;
    valor_total: number;
    status: string;
    destinatario_nome: string | null;
    destinatario_cpf_cnpj: string | null;
    os_numero: number | null;
}

// Mock data para demonstração
const mockNFe: NFeListItem[] = [
    {
        id: '1',
        ref: 'OS-1042-001',
        numero: '1234',
        serie: '1',
        chave_nfe: 'NFe52240707504505000132550010000012341234567890',
        data_emissao: '2024-02-06T14:30:00',
        valor_total: 1250.00,
        status: 'autorizado',
        destinatario_nome: 'João Silva Auto Peças',
        destinatario_cpf_cnpj: '12.345.678/0001-90',
        os_numero: 1042,
    },
    {
        id: '2',
        ref: 'OS-1041-001',
        numero: '1233',
        serie: '1',
        chave_nfe: 'NFe52240707504505000132550010000012331234567891',
        data_emissao: '2024-02-05T10:00:00',
        valor_total: 890.00,
        status: 'autorizado',
        destinatario_nome: 'Maria Santos',
        destinatario_cpf_cnpj: '987.654.321-00',
        os_numero: 1041,
    },
    {
        id: '3',
        ref: 'OS-1040-001',
        numero: null,
        serie: null,
        chave_nfe: null,
        data_emissao: null,
        valor_total: 3500.00,
        status: 'processando_autorizacao',
        destinatario_nome: 'Pedro Costa Ltda',
        destinatario_cpf_cnpj: '45.678.912/0001-34',
        os_numero: 1040,
    },
    {
        id: '4',
        ref: 'OS-1035-001',
        numero: '1230',
        serie: '1',
        chave_nfe: 'NFe52240707504505000132550010000012301234567892',
        data_emissao: '2024-01-20T16:00:00',
        valor_total: 750.00,
        status: 'cancelado',
        destinatario_nome: 'Ana Oliveira',
        destinatario_cpf_cnpj: '741.852.963-00',
        os_numero: 1035,
    },
    {
        id: '5',
        ref: 'OS-1030-001',
        numero: null,
        serie: null,
        chave_nfe: null,
        data_emissao: null,
        valor_total: 450.00,
        status: 'erro_autorizacao',
        destinatario_nome: 'Carlos Mendes',
        destinatario_cpf_cnpj: '159.753.486-00',
        os_numero: 1030,
    },
];

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'gray' }> = {
    processando_autorizacao: { label: 'Processando', variant: 'info' },
    autorizado: { label: 'Autorizada', variant: 'success' },
    cancelado: { label: 'Cancelada', variant: 'error' },
    erro_autorizacao: { label: 'Erro', variant: 'error' },
    denegado: { label: 'Denegada', variant: 'gray' },
};

export default function NFePage() {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('todas');
    const [nfeList] = useState<NFeListItem[]>(mockNFe);
    const [selectedNFe, setSelectedNFe] = useState<NFeListItem | null>(null);
    const [showXMLModal, setShowXMLModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showCCeModal, setShowCCeModal] = useState(false);
    const [justificativa, setJustificativa] = useState('');
    const [correcao, setCorrecao] = useState('');

    const filteredNFe = nfeList.filter((nfe) => {
        const matchSearch =
            nfe.destinatario_nome?.toLowerCase().includes(search.toLowerCase()) ||
            nfe.numero?.includes(search) ||
            nfe.os_numero?.toString().includes(search) ||
            nfe.ref.toLowerCase().includes(search.toLowerCase());

        if (filter === 'todas') return matchSearch;
        return matchSearch && nfe.status === filter;
    });

    const formatMoney = (value: number) => {
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
        total: nfeList.length,
        autorizadas: nfeList.filter(n => n.status === 'autorizado').length,
        processando: nfeList.filter(n => n.status === 'processando_autorizacao').length,
        valorTotal: nfeList
            .filter(n => n.status === 'autorizado')
            .reduce((sum, n) => sum + n.valor_total, 0),
    };

    const columns = [
        {
            key: 'numero',
            header: 'Número',
            width: '100px',
            render: (item: NFeListItem) => (
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {item.numero ? `${item.numero}/${item.serie}` : '-'}
                </span>
            ),
        },
        {
            key: 'data',
            header: 'Emissão',
            width: '140px',
            render: (item: NFeListItem) => (
                <span className="text-sm">{formatDateTime(item.data_emissao)}</span>
            ),
        },
        {
            key: 'destinatario',
            header: 'Destinatário / OS',
            render: (item: NFeListItem) => (
                <div>
                    <div style={{ fontWeight: 500 }}>{item.destinatario_nome || '-'}</div>
                    <div className="text-sm text-muted">
                        OS #{item.os_numero} • <span style={{ fontFamily: 'var(--font-mono)' }}>{item.ref}</span>
                    </div>
                </div>
            ),
        },
        {
            key: 'valor',
            header: 'Valor',
            width: '120px',
            render: (item: NFeListItem) => (
                <div style={{ fontWeight: 600 }}>{formatMoney(item.valor_total)}</div>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            width: '120px',
            render: (item: NFeListItem) => {
                const config = statusConfig[item.status] || { label: item.status, variant: 'gray' };
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
            width: '200px',
            render: (item: NFeListItem) => (
                <div className="flex gap-sm">
                    {item.status === 'autorizado' && (
                        <>
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => {
                                    setSelectedNFe(item);
                                    setShowXMLModal(true);
                                }}
                                title="Ver XML"
                            >
                                📄
                            </button>
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => window.open(`/api/nfe/${item.ref}/danfe`, '_blank')}
                                title="DANFE"
                            >
                                🖨️
                            </button>
                            <button
                                className="btn btn-warning btn-sm"
                                onClick={() => {
                                    setSelectedNFe(item);
                                    setShowCCeModal(true);
                                }}
                                title="Carta de Correção"
                            >
                                ✏️
                            </button>
                            <button
                                className="btn btn-error btn-sm"
                                onClick={() => {
                                    setSelectedNFe(item);
                                    setJustificativa('');
                                    setShowCancelModal(true);
                                }}
                                title="Cancelar"
                            >
                                ✖️
                            </button>
                        </>
                    )}
                    {item.status === 'processando_autorizacao' && (
                        <button className="btn btn-info btn-sm">
                            🔄 Consultar
                        </button>
                    )}
                    {item.status === 'erro_autorizacao' && (
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
            <Header title="NF-e" subtitle="Notas Fiscais Eletrônicas (Produtos)" />

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
                    <div className="stat-card" style={{ borderLeft: '4px solid var(--info-500)' }}>
                        <div className="stat-card-value">{stats.processando}</div>
                        <div className="stat-card-label">Processando</div>
                    </div>
                    <div className="stat-card" style={{ borderLeft: '4px solid var(--warning-500)' }}>
                        <div className="stat-card-value">{formatMoney(stats.valorTotal)}</div>
                        <div className="stat-card-label">Faturado (Mês)</div>
                    </div>
                </div>

                <div className="page-header">
                    <div className="flex gap-md items-center">
                        <SearchInput
                            value={search}
                            onChange={setSearch}
                            placeholder="Buscar por número, cliente, OS..."
                        />
                        <div className="flex gap-sm">
                            {[
                                { key: 'todas', label: 'Todas' },
                                { key: 'autorizado', label: 'Autorizadas' },
                                { key: 'processando_autorizacao', label: 'Processando' },
                                { key: 'cancelado', label: 'Canceladas' },
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
                        ➕ Emitir NF-e
                    </button>
                </div>

                <Card noPadding>
                    <DataTable
                        columns={columns}
                        data={filteredNFe}
                        keyExtractor={(item) => item.id}
                        emptyMessage="Nenhuma NF-e encontrada"
                    />
                </Card>

                {/* Informação sobre ambiente */}
                <div className="mt-lg">
                    <Alert type="info">
                        <strong>API:</strong> Focus NFe |
                        <strong> Ambiente:</strong> Homologação |
                        <strong> Prazo cancelamento:</strong> 24 horas
                    </Alert>
                </div>
            </div>

            {/* Modal XML */}
            <Modal
                isOpen={showXMLModal}
                onClose={() => setShowXMLModal(false)}
                title={`XML NF-e #${selectedNFe?.numero || ''}`}
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
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe versao="4.00" Id="${selectedNFe?.chave_nfe || ''}">
      <ide>
        <nNF>${selectedNFe?.numero || ''}</nNF>
        <serie>${selectedNFe?.serie || ''}</serie>
        <dhEmi>${selectedNFe?.data_emissao || ''}</dhEmi>
        <tpNF>1</tpNF>
        <natOp>Venda de mercadoria</natOp>
      </ide>
      <!-- ... resto do XML ... -->
    </infNFe>
  </NFe>
</nfeProc>`}
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
                title="Cancelar NF-e"
                size="md"
            >
                <Alert type="warning">
                    Atenção! O cancelamento de NF-e só pode ser feito em até 24 horas após a autorização.
                </Alert>

                <div className="mt-lg">
                    <p className="mb-md">
                        <strong>NF-e:</strong> #{selectedNFe?.numero}/{selectedNFe?.serie}
                    </p>
                    <p className="mb-md">
                        <strong>Destinatário:</strong> {selectedNFe?.destinatario_nome}
                    </p>
                    <p className="mb-lg">
                        <strong>Valor:</strong> {formatMoney(selectedNFe?.valor_total || 0)}
                    </p>

                    <label className="form-label">Justificativa do Cancelamento *</label>
                    <textarea
                        className="form-input"
                        rows={3}
                        placeholder="Informe o motivo do cancelamento (15 a 255 caracteres)"
                        value={justificativa}
                        onChange={(e) => setJustificativa(e.target.value)}
                    />
                    <span className="text-sm text-muted">{justificativa.length}/255 caracteres</span>
                </div>

                <div className="flex gap-md mt-lg justify-end">
                    <button className="btn btn-secondary" onClick={() => setShowCancelModal(false)}>
                        Voltar
                    </button>
                    <button
                        className="btn btn-error"
                        disabled={justificativa.length < 15 || justificativa.length > 255}
                    >
                        ✖️ Confirmar Cancelamento
                    </button>
                </div>
            </Modal>

            {/* Modal Carta de Correção */}
            <Modal
                isOpen={showCCeModal}
                onClose={() => setShowCCeModal(false)}
                title="Carta de Correção Eletrônica (CCe)"
                size="md"
            >
                <Alert type="info">
                    A CCe pode corrigir erros na NF-e, exceto valores, dados cadastrais e data de emissão.
                </Alert>

                <div className="mt-lg">
                    <p className="mb-md">
                        <strong>NF-e:</strong> #{selectedNFe?.numero}/{selectedNFe?.serie}
                    </p>

                    <label className="form-label">Texto da Correção *</label>
                    <textarea
                        className="form-input"
                        rows={5}
                        placeholder="Descreva a correção a ser aplicada (15 a 1000 caracteres)"
                        value={correcao}
                        onChange={(e) => setCorrecao(e.target.value)}
                    />
                    <span className="text-sm text-muted">{correcao.length}/1000 caracteres</span>
                </div>

                <div className="flex gap-md mt-lg justify-end">
                    <button className="btn btn-secondary" onClick={() => setShowCCeModal(false)}>
                        Cancelar
                    </button>
                    <button
                        className="btn btn-primary"
                        disabled={correcao.length < 15 || correcao.length > 1000}
                    >
                        ✏️ Enviar Carta de Correção
                    </button>
                </div>
            </Modal>
        </>
    );
}
