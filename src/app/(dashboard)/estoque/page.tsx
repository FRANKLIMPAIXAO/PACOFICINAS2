'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Card, SearchInput, DataTable, Modal, Alert } from '@/components/ui';
import { Input, Select, FormRow, MoneyInput } from '@/components/ui';
import type { Produto } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { getUserEmpresaId } from '@/lib/supabase/helpers';

interface ProdutoForm {
    codigo: string;
    codigo_barras: string;
    descricao: string;
    unidade: string;
    ncm: string;
    cst: string;
    cfop_dentro: string;
    cfop_fora: string;
    preco_custo: number;
    preco_venda: number;
    estoque_atual: string;
    estoque_minimo: string;
    localizacao: string;
}

const initialFormState: ProdutoForm = {
    codigo: '',
    codigo_barras: '',
    descricao: '',
    unidade: 'UN',
    ncm: '',
    cst: '000',
    cfop_dentro: '5102',
    cfop_fora: '6102',
    preco_custo: 0,
    preco_venda: 0,
    estoque_atual: '0',
    estoque_minimo: '0',
    localizacao: '',
};

export default function EstoquePage() {
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState('');
    const [filter, setFilter] = useState('todos');
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<ProdutoForm>(initialFormState);

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

        async function loadProdutos() {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('produtos')
                    .select('*')
                    .eq('empresa_id', empresaId)
                    .order('descricao');

                if (error) {
                    console.error('Erro ao carregar produtos:', error);
                    setShowError('Erro ao carregar produtos: ' + error.message);
                } else {
                    setProdutos(data || []);
                }
            } catch (err) {
                console.error('Erro:', err);
                setShowError('Erro ao conectar com o banco de dados');
            } finally {
                setLoading(false);
            }
        }

        loadProdutos();
    }, [empresaId]);

    const handleInputChange = (field: keyof ProdutoForm, value: string | number) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!form.descricao.trim()) {
            setShowError('A descrição é obrigatória');
            return;
        }

        setSaving(true);
        setShowError('');

        try {
            const { data, error } = await supabase
                .from('produtos')
                .insert({
                    empresa_id: empresaId,
                    codigo: form.codigo || null,
                    codigo_barras: form.codigo_barras || null,
                    descricao: form.descricao,
                    unidade: form.unidade,
                    ncm: form.ncm || null,
                    cst: form.cst || null,
                    cfop_dentro: form.cfop_dentro || '5102',
                    cfop_fora: form.cfop_fora || '6102',
                    origem: '0',
                    preco_custo: form.preco_custo,
                    preco_venda: form.preco_venda,
                    margem_lucro: form.preco_custo > 0 ? ((form.preco_venda - form.preco_custo) / form.preco_custo * 100) : 0,
                    estoque_atual: parseFloat(form.estoque_atual) || 0,
                    estoque_minimo: parseFloat(form.estoque_minimo) || 0,
                    localizacao: form.localizacao || null,
                    ativo: true,
                })
                .select()
                .single();

            if (error) {
                console.error('Erro ao salvar:', error);
                setShowError('Erro ao salvar produto: ' + error.message);
            } else {
                setProdutos(prev => [...prev, data]);
                setShowModal(false);
                setShowSuccess(true);
                setForm(initialFormState);
                setTimeout(() => setShowSuccess(false), 3000);
            }
        } catch (err) {
            console.error('Erro:', err);
            setShowError('Erro ao salvar produto');
        } finally {
            setSaving(false);
        }
    };

    const filteredProdutos = produtos.filter((p) => {
        const matchSearch =
            p.descricao.toLowerCase().includes(search.toLowerCase()) ||
            p.codigo?.toLowerCase().includes(search.toLowerCase());

        if (filter === 'baixo') return matchSearch && p.estoque_atual <= p.estoque_minimo;
        if (filter === 'zerado') return matchSearch && p.estoque_atual === 0;
        return matchSearch;
    });

    const formatMoney = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const columns = [
        {
            key: 'codigo',
            header: 'Código',
            width: '100px',
            render: (item: Produto) => (
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
                    {item.codigo || '-'}
                </span>
            ),
        },
        {
            key: 'descricao',
            header: 'Descrição',
            render: (item: Produto) => (
                <div>
                    <div style={{ fontWeight: 500 }}>{item.descricao}</div>
                    <div className="text-sm text-muted">NCM: {item.ncm || '-'}</div>
                </div>
            ),
        },
        {
            key: 'estoque',
            header: 'Estoque',
            width: '120px',
            render: (item: Produto) => {
                const isBaixo = item.estoque_atual <= item.estoque_minimo;
                const isZerado = item.estoque_atual === 0;
                return (
                    <div>
                        <span
                            style={{
                                fontWeight: 600,
                                color: isZerado
                                    ? 'var(--error-600)'
                                    : isBaixo
                                        ? 'var(--warning-600)'
                                        : 'var(--success-600)',
                            }}
                        >
                            {item.estoque_atual} {item.unidade}
                        </span>
                        {isBaixo && (
                            <div className="text-sm text-muted">Mín: {item.estoque_minimo}</div>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'preco_custo',
            header: 'Custo',
            width: '110px',
            render: (item: Produto) => (
                <span className="text-muted">{formatMoney(item.preco_custo)}</span>
            ),
        },
        {
            key: 'preco_venda',
            header: 'Venda',
            width: '110px',
            render: (item: Produto) => (
                <span style={{ fontWeight: 500 }}>{formatMoney(item.preco_venda)}</span>
            ),
        },
        {
            key: 'localizacao',
            header: 'Local',
            width: '80px',
            render: (item: Produto) => item.localizacao || '-',
        },
        {
            key: 'acoes',
            header: '',
            width: '80px',
            render: () => (
                <button className="btn btn-ghost btn-sm">✏️</button>
            ),
        },
    ];

    return (
        <>
            <Header title="Estoque" subtitle="Gerencie peças e produtos" />

            <div className="page-content">
                {showSuccess && (
                    <div className="mb-lg">
                        <Alert type="success" onClose={() => setShowSuccess(false)}>
                            Produto salvo com sucesso!
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
                    <div className="stat-card">
                        <div className="stat-card-value">{produtos.length}</div>
                        <div className="stat-card-label">Total de Produtos</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-value" style={{ color: 'var(--error-600)' }}>
                            {produtos.filter((p) => p.estoque_atual === 0).length}
                        </div>
                        <div className="stat-card-label">Sem Estoque</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-value" style={{ color: 'var(--warning-600)' }}>
                            {produtos.filter((p) => p.estoque_atual <= p.estoque_minimo && p.estoque_atual > 0).length}
                        </div>
                        <div className="stat-card-label">Estoque Baixo</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-value">
                            {formatMoney(produtos.reduce((acc, p) => acc + p.preco_custo * p.estoque_atual, 0))}
                        </div>
                        <div className="stat-card-label">Valor em Estoque</div>
                    </div>
                </div>

                <div className="page-header">
                    <div className="flex gap-md items-center">
                        <SearchInput
                            value={search}
                            onChange={setSearch}
                            placeholder="Buscar por código ou descrição..."
                        />
                        <div className="flex gap-sm">
                            <button
                                className={`btn btn-sm ${filter === 'todos' ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setFilter('todos')}
                            >
                                Todos
                            </button>
                            <button
                                className={`btn btn-sm ${filter === 'baixo' ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setFilter('baixo')}
                            >
                                Estoque Baixo
                            </button>
                            <button
                                className={`btn btn-sm ${filter === 'zerado' ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setFilter('zerado')}
                            >
                                Sem Estoque
                            </button>
                        </div>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        ➕ Novo Produto
                    </button>
                </div>

                <Card noPadding>
                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center' }}>
                            Carregando produtos...
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={filteredProdutos}
                            keyExtractor={(item) => item.id}
                            emptyMessage="Nenhum produto encontrado. Clique em 'Novo Produto' para cadastrar."
                        />
                    )}
                </Card>
            </div>

            <Modal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setForm(initialFormState); setShowError(''); }}
                title="Novo Produto"
                size="lg"
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => { setShowModal(false); setForm(initialFormState); }}>
                            Cancelar
                        </button>
                        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                            {saving ? 'Salvando...' : 'Salvar Produto'}
                        </button>
                    </>
                }
            >
                {showError && (
                    <div className="mb-md">
                        <Alert type="error" onClose={() => setShowError('')}>{showError}</Alert>
                    </div>
                )}

                <FormRow>
                    <Input
                        label="Código"
                        placeholder="Código interno"
                        value={form.codigo}
                        onChange={(e) => handleInputChange('codigo', e.target.value)}
                    />
                    <Input
                        label="Código de Barras"
                        placeholder="EAN/GTIN"
                        value={form.codigo_barras}
                        onChange={(e) => handleInputChange('codigo_barras', e.target.value)}
                    />
                </FormRow>

                <Input
                    label="Descrição"
                    required
                    placeholder="Nome do produto"
                    value={form.descricao}
                    onChange={(e) => handleInputChange('descricao', e.target.value)}
                />

                <FormRow>
                    <Select
                        label="Unidade"
                        value={form.unidade}
                        onChange={(e) => handleInputChange('unidade', e.target.value)}
                        options={[
                            { value: 'UN', label: 'Unidade (UN)' },
                            { value: 'JG', label: 'Jogo (JG)' },
                            { value: 'PC', label: 'Peça (PC)' },
                            { value: 'LT', label: 'Litro (LT)' },
                            { value: 'KG', label: 'Quilo (KG)' },
                            { value: 'MT', label: 'Metro (MT)' },
                        ]}
                    />
                    <Input
                        label="Localização"
                        placeholder="Ex: A1-01"
                        value={form.localizacao}
                        onChange={(e) => handleInputChange('localizacao', e.target.value)}
                    />
                </FormRow>

                <div className="divider"></div>
                <h4 className="mb-md">Preços</h4>

                <FormRow>
                    <MoneyInput
                        label="Preço de Custo"
                        value={form.preco_custo}
                        onChange={(value) => handleInputChange('preco_custo', value)}
                    />
                    <MoneyInput
                        label="Preço de Venda"
                        value={form.preco_venda}
                        onChange={(value) => handleInputChange('preco_venda', value)}
                    />
                </FormRow>

                <div className="divider"></div>
                <h4 className="mb-md">Estoque</h4>

                <FormRow>
                    <Input
                        label="Estoque Atual"
                        type="number"
                        placeholder="0"
                        value={form.estoque_atual}
                        onChange={(e) => handleInputChange('estoque_atual', e.target.value)}
                    />
                    <Input
                        label="Estoque Mínimo"
                        type="number"
                        placeholder="0"
                        value={form.estoque_minimo}
                        onChange={(e) => handleInputChange('estoque_minimo', e.target.value)}
                    />
                </FormRow>

                <div className="divider"></div>
                <h4 className="mb-md">Dados Fiscais</h4>

                <FormRow>
                    <Input
                        label="NCM"
                        placeholder="00000000"
                        value={form.ncm}
                        onChange={(e) => handleInputChange('ncm', e.target.value)}
                    />
                    <Input
                        label="CST"
                        placeholder="000"
                        value={form.cst}
                        onChange={(e) => handleInputChange('cst', e.target.value)}
                    />
                </FormRow>

                <FormRow>
                    <Input
                        label="CFOP (Dentro do Estado)"
                        placeholder="5102"
                        value={form.cfop_dentro}
                        onChange={(e) => handleInputChange('cfop_dentro', e.target.value)}
                    />
                    <Input
                        label="CFOP (Fora do Estado)"
                        placeholder="6102"
                        value={form.cfop_fora}
                        onChange={(e) => handleInputChange('cfop_fora', e.target.value)}
                    />
                </FormRow>
            </Modal>
        </>
    );
}
