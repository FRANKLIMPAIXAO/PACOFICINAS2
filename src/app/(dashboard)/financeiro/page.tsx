'use client';

import { useState } from 'react';
import { Header } from '@/components/layout';
import { Card, SearchInput, DataTable, StatusBadge, Modal, Alert } from '@/components/ui';
import { Input, Select, FormRow, MoneyInput, Textarea } from '@/components/ui';
import type { StatusConta } from '@/types';

interface ContaItem {
    id: string;
    tipo: 'pagar' | 'receber';
    descricao: string;
    valor: number;
    data_vencimento: string;
    status: StatusConta;
    cliente_nome?: string;
    fornecedor?: string;
}

// Mock data
const mockContas: ContaItem[] = [
    {
        id: '1',
        tipo: 'pagar',
        descricao: 'Fornecedor Auto Peças XYZ',
        fornecedor: 'Auto Peças XYZ',
        valor: 2500.00,
        data_vencimento: '2024-02-10',
        status: 'aberto',
    },
    {
        id: '2',
        tipo: 'receber',
        descricao: 'OS #1038 - João Silva',
        cliente_nome: 'João Silva',
        valor: 1250.00,
        data_vencimento: '2024-02-12',
        status: 'aberto',
    },
    {
        id: '3',
        tipo: 'pagar',
        descricao: 'Aluguel do Galpão',
        valor: 3500.00,
        data_vencimento: '2024-02-05',
        status: 'atrasado',
    },
    {
        id: '4',
        tipo: 'receber',
        descricao: 'OS #1035 - Maria Santos',
        cliente_nome: 'Maria Santos',
        valor: 890.00,
        data_vencimento: '2024-02-01',
        status: 'pago',
    },
    {
        id: '5',
        tipo: 'pagar',
        descricao: 'Energia Elétrica',
        valor: 850.00,
        data_vencimento: '2024-02-15',
        status: 'aberto',
    },
    {
        id: '6',
        tipo: 'receber',
        descricao: 'OS #1034 - Pedro Costa',
        cliente_nome: 'Pedro Costa',
        valor: 3500.00,
        data_vencimento: '2024-01-28',
        status: 'atrasado',
    },
];

export default function FinanceiroPage() {
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'todos' | 'pagar' | 'receber'>('todos');
    const [filter, setFilter] = useState('aberto');
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<'pagar' | 'receber'>('pagar');
    const [showSuccess, setShowSuccess] = useState(false);
    const [contas] = useState<ContaItem[]>(mockContas);
    const [valor, setValor] = useState(0);

    const filteredContas = contas.filter((c) => {
        const matchSearch =
            c.descricao.toLowerCase().includes(search.toLowerCase()) ||
            c.cliente_nome?.toLowerCase().includes(search.toLowerCase()) ||
            c.fornecedor?.toLowerCase().includes(search.toLowerCase());

        const matchTab = activeTab === 'todos' || c.tipo === activeTab;
        const matchFilter = filter === 'todos' || c.status === filter;

        return matchSearch && matchTab && matchFilter;
    });

    const formatMoney = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('pt-BR');
    };

    const totalPagar = contas
        .filter((c) => c.tipo === 'pagar' && c.status !== 'pago')
        .reduce((acc, c) => acc + c.valor, 0);

    const totalReceber = contas
        .filter((c) => c.tipo === 'receber' && c.status !== 'pago')
        .reduce((acc, c) => acc + c.valor, 0);

    const totalAtrasado = contas
        .filter((c) => c.status === 'atrasado')
        .reduce((acc, c) => acc + c.valor, 0);

    const columns = [
        {
            key: 'tipo',
            header: 'Tipo',
            width: '100px',
            render: (item: ContaItem) => (
                <span
                    className={`badge ${item.tipo === 'receber' ? 'badge-success' : 'badge-error'}`}
                >
                    {item.tipo === 'receber' ? '↓ Receber' : '↑ Pagar'}
                </span>
            ),
        },
        {
            key: 'descricao',
            header: 'Descrição',
            render: (item: ContaItem) => (
                <div>
                    <div style={{ fontWeight: 500 }}>{item.descricao}</div>
                    {item.cliente_nome && (
                        <div className="text-sm text-muted">Cliente: {item.cliente_nome}</div>
                    )}
                    {item.fornecedor && (
                        <div className="text-sm text-muted">Fornecedor: {item.fornecedor}</div>
                    )}
                </div>
            ),
        },
        {
            key: 'vencimento',
            header: 'Vencimento',
            width: '120px',
            render: (item: ContaItem) => formatDate(item.data_vencimento),
        },
        {
            key: 'valor',
            header: 'Valor',
            width: '130px',
            render: (item: ContaItem) => (
                <span
                    style={{
                        fontWeight: 600,
                        color: item.tipo === 'receber' ? 'var(--success-600)' : 'var(--error-600)',
                    }}
                >
                    {item.tipo === 'receber' ? '+' : '-'} {formatMoney(item.valor)}
                </span>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            width: '120px',
            render: (item: ContaItem) => <StatusBadge status={item.status} />,
        },
        {
            key: 'acoes',
            header: '',
            width: '120px',
            render: (item: ContaItem) => (
                <div className="flex gap-sm">
                    {item.status !== 'pago' && (
                        <button className="btn btn-success btn-sm">
                            {item.tipo === 'receber' ? '💵 Receber' : '💳 Pagar'}
                        </button>
                    )}
                </div>
            ),
        },
    ];

    const openModal = (type: 'pagar' | 'receber') => {
        setModalType(type);
        setShowModal(true);
    };

    return (
        <>
            <Header title="Financeiro" subtitle="Controle de contas a pagar e receber" />

            <div className="page-content">
                {showSuccess && (
                    <div className="mb-lg">
                        <Alert type="success" onClose={() => setShowSuccess(false)}>
                            Conta salva com sucesso!
                        </Alert>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-4 mb-lg">
                    <div className="stat-card" style={{ borderLeft: '4px solid var(--success-500)' }}>
                        <div className="stat-card-value" style={{ color: 'var(--success-600)' }}>
                            {formatMoney(totalReceber)}
                        </div>
                        <div className="stat-card-label">A Receber</div>
                    </div>
                    <div className="stat-card" style={{ borderLeft: '4px solid var(--error-500)' }}>
                        <div className="stat-card-value" style={{ color: 'var(--error-600)' }}>
                            {formatMoney(totalPagar)}
                        </div>
                        <div className="stat-card-label">A Pagar</div>
                    </div>
                    <div className="stat-card" style={{ borderLeft: '4px solid var(--primary-500)' }}>
                        <div
                            className="stat-card-value"
                            style={{ color: totalReceber - totalPagar >= 0 ? 'var(--success-600)' : 'var(--error-600)' }}
                        >
                            {formatMoney(totalReceber - totalPagar)}
                        </div>
                        <div className="stat-card-label">Saldo Previsto</div>
                    </div>
                    <div className="stat-card" style={{ borderLeft: '4px solid var(--warning-500)' }}>
                        <div className="stat-card-value" style={{ color: 'var(--warning-600)' }}>
                            {formatMoney(totalAtrasado)}
                        </div>
                        <div className="stat-card-label">Em Atraso</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="tabs">
                    {[
                        { key: 'todos', label: 'Todas as Contas' },
                        { key: 'receber', label: '💵 A Receber' },
                        { key: 'pagar', label: '💳 A Pagar' },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.key as typeof activeTab)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="page-header">
                    <div className="flex gap-md items-center">
                        <SearchInput
                            value={search}
                            onChange={setSearch}
                            placeholder="Buscar por descrição, cliente ou fornecedor..."
                        />
                        <div className="flex gap-sm">
                            {[
                                { key: 'aberto', label: 'Em Aberto' },
                                { key: 'atrasado', label: 'Atrasadas' },
                                { key: 'pago', label: 'Pagas' },
                                { key: 'todos', label: 'Todas' },
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
                    <div className="flex gap-sm">
                        <button className="btn btn-success" onClick={() => openModal('receber')}>
                            ➕ Conta a Receber
                        </button>
                        <button className="btn btn-danger" onClick={() => openModal('pagar')}>
                            ➕ Conta a Pagar
                        </button>
                    </div>
                </div>

                <Card noPadding>
                    <DataTable
                        columns={columns}
                        data={filteredContas}
                        keyExtractor={(item) => item.id}
                        emptyMessage="Nenhuma conta encontrada"
                    />
                </Card>
            </div>

            {/* Modal Nova Conta */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={modalType === 'receber' ? 'Nova Conta a Receber' : 'Nova Conta a Pagar'}
                size="md"
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                            Cancelar
                        </button>
                        <button
                            className={`btn ${modalType === 'receber' ? 'btn-success' : 'btn-danger'}`}
                            onClick={() => {
                                setShowModal(false);
                                setShowSuccess(true);
                            }}
                        >
                            Salvar
                        </button>
                    </>
                }
            >
                <Input
                    label="Descrição"
                    required
                    placeholder={modalType === 'receber' ? 'Ex: OS #1042 - Cliente' : 'Ex: Fornecedor XYZ'}
                />

                {modalType === 'receber' ? (
                    <Select
                        label="Cliente"
                        options={[
                            { value: '1', label: 'João Silva' },
                            { value: '2', label: 'Maria Santos' },
                            { value: '3', label: 'Pedro Costa' },
                        ]}
                    />
                ) : (
                    <Input label="Fornecedor" placeholder="Nome do fornecedor" />
                )}

                <FormRow>
                    <MoneyInput label="Valor" value={valor} onChange={setValor} />
                    <Input label="Vencimento" type="date" required />
                </FormRow>

                {modalType === 'pagar' && (
                    <Select
                        label="Categoria"
                        options={[
                            { value: 'fornecedor', label: 'Fornecedor / Peças' },
                            { value: 'aluguel', label: 'Aluguel' },
                            { value: 'energia', label: 'Energia' },
                            { value: 'agua', label: 'Água' },
                            { value: 'internet', label: 'Internet/Telefone' },
                            { value: 'salarios', label: 'Salários' },
                            { value: 'outros', label: 'Outros' },
                        ]}
                    />
                )}

                <Textarea label="Observações" placeholder="Anotações adicionais..." rows={3} />
            </Modal>
        </>
    );
}
