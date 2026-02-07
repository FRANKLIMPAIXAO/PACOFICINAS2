'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Card, SearchInput, DataTable, StatusBadge, Modal, Alert } from '@/components/ui';
import { Input, Select, FormRow, MoneyInput, Textarea } from '@/components/ui';
import type { StatusConta, Cliente } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { getUserEmpresaId } from '@/lib/supabase/helpers';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

interface ContaForm {
    descricao: string;
    fornecedor: string;
    cliente_id: string;
    valor: number;
    data_vencimento: string;
    categoria: string;
    observacoes: string;
}

const initialFormState: ContaForm = {
    descricao: '',
    fornecedor: '',
    cliente_id: '',
    valor: 0,
    data_vencimento: '',
    categoria: 'fornecedor',
    observacoes: '',
};

export default function FinanceiroPage() {
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'todos' | 'pagar' | 'receber'>('todos');
    const [filter, setFilter] = useState('aberto');
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<'pagar' | 'receber'>('pagar');
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState('');
    const [contas, setContas] = useState<ContaItem[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<ContaForm>(initialFormState);

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
        async function loadData() {
            setLoading(true);
            try {
                // Carregar contas a pagar
                const { data: contasPagar, error: errPagar } = await supabase
                    .from('contas_pagar')
                    .select('*')
                    .order('data_vencimento');

                // Carregar contas a receber
                const { data: contasReceber, error: errReceber } = await supabase
                    .from('contas_receber')
                    .select('*, clientes(nome)')
                    .order('data_vencimento');

                if (errPagar || errReceber) {
                    setShowError('Erro ao carregar contas');
                } else {
                    const todasContas: ContaItem[] = [
                        ...(contasPagar || []).map((c: any) => ({
                            id: c.id,
                            tipo: 'pagar' as const,
                            descricao: c.descricao,
                            valor: c.valor,
                            data_vencimento: c.data_vencimento,
                            status: c.status,
                            fornecedor: c.fornecedor,
                        })),
                        ...(contasReceber || []).map((c: any) => ({
                            id: c.id,
                            tipo: 'receber' as const,
                            descricao: c.descricao,
                            valor: c.valor,
                            data_vencimento: c.data_vencimento,
                            status: c.status,
                            cliente_nome: c.clientes?.nome,
                        })),
                    ];
                    setContas(todasContas);
                }

                // Carregar clientes para o select
                const { data: clientesData } = await supabase
                    .from('clientes')
                    .select('id, nome')
                    .order('nome');
                setClientes(clientesData || []);

            } catch (err) {
                console.error('Erro:', err);
                setShowError('Erro ao conectar com o banco de dados');
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, []);

    const handleInputChange = (field: keyof ContaForm, value: string | number) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!form.descricao.trim()) {
            setShowError('A descrição é obrigatória');
            return;
        }
        if (!form.data_vencimento) {
            setShowError('A data de vencimento é obrigatória');
            return;
        }

        setSaving(true);
        setShowError('');

        try {
            if (modalType === 'pagar') {
                const { data, error } = await supabase
                    .from('contas_pagar')
                    .insert({
                        empresa_id: empresaId,
                        descricao: form.descricao,
                        fornecedor: form.fornecedor || null,
                        valor: form.valor,
                        data_vencimento: form.data_vencimento,
                        status: 'aberto',
                        categoria: form.categoria || null,
                        observacoes: form.observacoes || null,
                    })
                    .select()
                    .single();

                if (error) throw error;

                setContas(prev => [...prev, {
                    id: data.id,
                    tipo: 'pagar',
                    descricao: data.descricao,
                    valor: data.valor,
                    data_vencimento: data.data_vencimento,
                    status: data.status,
                    fornecedor: data.fornecedor,
                }]);
            } else {
                const { data, error } = await supabase
                    .from('contas_receber')
                    .insert({
                        empresa_id: empresaId,
                        cliente_id: form.cliente_id || null,
                        descricao: form.descricao,
                        valor: form.valor,
                        data_vencimento: form.data_vencimento,
                        status: 'aberto',
                        observacoes: form.observacoes || null,
                    })
                    .select('*, clientes(nome)')
                    .single();

                if (error) throw error;

                setContas(prev => [...prev, {
                    id: data.id,
                    tipo: 'receber',
                    descricao: data.descricao,
                    valor: data.valor,
                    data_vencimento: data.data_vencimento,
                    status: data.status,
                    cliente_nome: data.clientes?.nome,
                }]);
            }

            setShowModal(false);
            setShowSuccess(true);
            setForm(initialFormState);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (err: any) {
            console.error('Erro ao salvar:', err);
            setShowError('Erro ao salvar conta: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

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
                <span className={`badge ${item.tipo === 'receber' ? 'badge-success' : 'badge-error'}`}>
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
        setForm(initialFormState);
        setShowModal(true);
    };

    // Funções de exportação
    const exportToExcel = () => {
        const dataToExport = filteredContas.map(conta => ({
            'Tipo': conta.tipo === 'pagar' ? 'A Pagar' : 'A Receber',
            'Descrição': conta.descricao,
            'Cliente/Fornecedor': conta.tipo === 'receber' ? (conta.cliente_nome || '-') : (conta.fornecedor || '-'),
            'Valor': conta.valor,
            'Vencimento': formatDate(conta.data_vencimento),
            'Status': conta.status === 'aberto' ? 'Em Aberto' : conta.status === 'pago' ? 'Pago' : conta.status === 'atrasado' ? 'Atrasado' : conta.status,
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Contas');

        // Ajustar largura das colunas
        ws['!cols'] = [
            { wch: 12 }, { wch: 40 }, { wch: 30 }, { wch: 15 }, { wch: 12 }, { wch: 12 }
        ];

        const fileName = `relatorio_financeiro_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        setShowSuccess(true);
    };

    const exportToPDF = () => {
        const doc = new jsPDF();

        // Título
        doc.setFontSize(18);
        doc.text('Relatório Financeiro', 14, 22);

        doc.setFontSize(10);
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);

        // Resumo
        doc.setFontSize(12);
        doc.text('Resumo:', 14, 42);
        doc.setFontSize(10);
        doc.text(`Total a Receber: ${formatMoney(totalReceber)}`, 14, 50);
        doc.text(`Total a Pagar: ${formatMoney(totalPagar)}`, 14, 56);
        doc.text(`Saldo Previsto: ${formatMoney(totalReceber - totalPagar)}`, 14, 62);
        doc.text(`Em Atraso: ${formatMoney(totalAtrasado)}`, 14, 68);

        // Tabela
        const tableData = filteredContas.map(conta => [
            conta.tipo === 'pagar' ? 'A Pagar' : 'A Receber',
            conta.descricao.substring(0, 30),
            conta.tipo === 'receber' ? (conta.cliente_nome || '-').substring(0, 20) : (conta.fornecedor || '-').substring(0, 20),
            formatMoney(conta.valor),
            formatDate(conta.data_vencimento),
            conta.status === 'aberto' ? 'Aberto' : conta.status === 'pago' ? 'Pago' : 'Atrasado',
        ]);

        autoTable(doc, {
            startY: 78,
            head: [['Tipo', 'Descrição', 'Cliente/Forn.', 'Valor', 'Vencimento', 'Status']],
            body: tableData,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [59, 130, 246] },
        });

        doc.save(`relatorio_financeiro_${new Date().toISOString().split('T')[0]}.pdf`);
        setShowSuccess(true);
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

                {showError && (
                    <div className="mb-lg">
                        <Alert type="error" onClose={() => setShowError('')}>
                            {showError}
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
                        <button className="btn btn-secondary" onClick={exportToExcel} title="Exportar Excel">
                            📊 Excel
                        </button>
                        <button className="btn btn-secondary" onClick={exportToPDF} title="Exportar PDF">
                            📄 PDF
                        </button>
                        <button className="btn btn-success" onClick={() => openModal('receber')}>
                            ➕ Conta a Receber
                        </button>
                        <button className="btn btn-danger" onClick={() => openModal('pagar')}>
                            ➕ Conta a Pagar
                        </button>
                    </div>
                </div>

                <Card noPadding>
                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center' }}>
                            Carregando contas...
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={filteredContas}
                            keyExtractor={(item) => item.id}
                            emptyMessage="Nenhuma conta encontrada. Adicione uma conta a pagar ou receber."
                        />
                    )}
                </Card>
            </div>

            {/* Modal Nova Conta */}
            <Modal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setForm(initialFormState); setShowError(''); }}
                title={modalType === 'receber' ? 'Nova Conta a Receber' : 'Nova Conta a Pagar'}
                size="md"
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => { setShowModal(false); setForm(initialFormState); }}>
                            Cancelar
                        </button>
                        <button
                            className={`btn ${modalType === 'receber' ? 'btn-success' : 'btn-danger'}`}
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? 'Salvando...' : 'Salvar'}
                        </button>
                    </>
                }
            >
                {showError && (
                    <div className="mb-md">
                        <Alert type="error" onClose={() => setShowError('')}>{showError}</Alert>
                    </div>
                )}

                <Input
                    label="Descrição"
                    required
                    placeholder={modalType === 'receber' ? 'Ex: OS #1042 - Cliente' : 'Ex: Fornecedor XYZ'}
                    value={form.descricao}
                    onChange={(e) => handleInputChange('descricao', e.target.value)}
                />

                {modalType === 'receber' ? (
                    <Select
                        label="Cliente"
                        value={form.cliente_id}
                        onChange={(e) => handleInputChange('cliente_id', e.target.value)}
                        options={[
                            { value: '', label: 'Selecione um cliente (opcional)' },
                            ...clientes.map(c => ({ value: c.id, label: c.nome }))
                        ]}
                    />
                ) : (
                    <Input
                        label="Fornecedor"
                        placeholder="Nome do fornecedor"
                        value={form.fornecedor}
                        onChange={(e) => handleInputChange('fornecedor', e.target.value)}
                    />
                )}

                <FormRow>
                    <MoneyInput
                        label="Valor"
                        value={form.valor}
                        onChange={(value) => handleInputChange('valor', value)}
                    />
                    <Input
                        label="Vencimento"
                        type="date"
                        required
                        value={form.data_vencimento}
                        onChange={(e) => handleInputChange('data_vencimento', e.target.value)}
                    />
                </FormRow>

                {modalType === 'pagar' && (
                    <Select
                        label="Categoria"
                        value={form.categoria}
                        onChange={(e) => handleInputChange('categoria', e.target.value)}
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

                <Textarea
                    label="Observações"
                    placeholder="Anotações adicionais..."
                    rows={3}
                    value={form.observacoes}
                    onChange={(e) => handleInputChange('observacoes', e.target.value)}
                />
            </Modal>
        </>
    );
}
