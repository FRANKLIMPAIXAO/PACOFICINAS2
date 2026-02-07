'use client';

import { useState } from 'react';
import { Header } from '@/components/layout';
import { Card, SearchInput, DataTable, Modal, Alert, StatusBadge } from '@/components/ui';
import { Input, Select, FormRow, MoneyInput } from '@/components/ui';
import type { Produto } from '@/types';

// Mock data
const mockProdutos: Produto[] = [
    {
        id: '1',
        empresa_id: '1',
        codigo: 'OL001',
        codigo_barras: '7891234567890',
        descricao: 'Óleo Motor 5W30 Sintético 1L',
        unidade: 'UN',
        ncm: '27101932',
        cest: null,
        cfop_dentro: '5102',
        cfop_fora: '6102',
        cst: '000',
        origem: '0',
        preco_custo: 35.00,
        preco_venda: 55.00,
        margem_lucro: 57.14,
        estoque_atual: 25,
        estoque_minimo: 10,
        localizacao: 'A1-01',
        ativo: true,
        created_at: '2024-01-10',
        updated_at: '2024-01-10',
    },
    {
        id: '2',
        empresa_id: '1',
        codigo: 'FI001',
        codigo_barras: null,
        descricao: 'Filtro de Óleo HB20',
        unidade: 'UN',
        ncm: '84212300',
        cest: null,
        cfop_dentro: '5102',
        cfop_fora: '6102',
        cst: '000',
        origem: '0',
        preco_custo: 18.00,
        preco_venda: 35.00,
        margem_lucro: 94.44,
        estoque_atual: 8,
        estoque_minimo: 5,
        localizacao: 'B2-03',
        ativo: true,
        created_at: '2024-01-12',
        updated_at: '2024-01-12',
    },
    {
        id: '3',
        empresa_id: '1',
        codigo: 'PA001',
        codigo_barras: null,
        descricao: 'Pastilha de Freio Dianteira Gol G5',
        unidade: 'JG',
        ncm: '68132090',
        cest: null,
        cfop_dentro: '5102',
        cfop_fora: '6102',
        cst: '000',
        origem: '0',
        preco_custo: 45.00,
        preco_venda: 89.00,
        margem_lucro: 97.78,
        estoque_atual: 3,
        estoque_minimo: 5,
        localizacao: 'C1-02',
        ativo: true,
        created_at: '2024-01-15',
        updated_at: '2024-01-15',
    },
    {
        id: '4',
        empresa_id: '1',
        codigo: 'VE001',
        codigo_barras: null,
        descricao: 'Vela de Ignição NGK',
        unidade: 'UN',
        ncm: '85111000',
        cest: null,
        cfop_dentro: '5102',
        cfop_fora: '6102',
        cst: '000',
        origem: '0',
        preco_custo: 22.00,
        preco_venda: 42.00,
        margem_lucro: 90.91,
        estoque_atual: 0,
        estoque_minimo: 8,
        localizacao: 'A2-05',
        ativo: true,
        created_at: '2024-01-18',
        updated_at: '2024-01-18',
    },
];

export default function EstoquePage() {
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [filter, setFilter] = useState('todos');
    const [produtos] = useState<Produto[]>(mockProdutos);
    const [precoCusto, setPrecoCusto] = useState(0);
    const [precoVenda, setPrecoVenda] = useState(0);

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
                    <DataTable
                        columns={columns}
                        data={filteredProdutos}
                        keyExtractor={(item) => item.id}
                        emptyMessage="Nenhum produto encontrado"
                    />
                </Card>
            </div>

            {/* Modal Novo Produto */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Novo Produto"
                size="lg"
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                            Cancelar
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                setShowModal(false);
                                setShowSuccess(true);
                            }}
                        >
                            Salvar Produto
                        </button>
                    </>
                }
            >
                <FormRow>
                    <Input label="Código" placeholder="Código interno" />
                    <Input label="Código de Barras" placeholder="EAN/GTIN" />
                </FormRow>

                <Input label="Descrição" required placeholder="Nome do produto" />

                <FormRow>
                    <Select
                        label="Unidade"
                        options={[
                            { value: 'UN', label: 'Unidade (UN)' },
                            { value: 'JG', label: 'Jogo (JG)' },
                            { value: 'PC', label: 'Peça (PC)' },
                            { value: 'LT', label: 'Litro (LT)' },
                            { value: 'KG', label: 'Quilo (KG)' },
                            { value: 'MT', label: 'Metro (MT)' },
                        ]}
                    />
                    <Input label="Localização" placeholder="Ex: A1-01" />
                </FormRow>

                <div className="divider"></div>
                <h4 className="mb-md">Preços</h4>

                <FormRow>
                    <MoneyInput
                        label="Preço de Custo"
                        value={precoCusto}
                        onChange={setPrecoCusto}
                    />
                    <MoneyInput
                        label="Preço de Venda"
                        value={precoVenda}
                        onChange={setPrecoVenda}
                    />
                </FormRow>

                <div className="divider"></div>
                <h4 className="mb-md">Estoque</h4>

                <FormRow>
                    <Input label="Estoque Atual" type="number" placeholder="0" />
                    <Input label="Estoque Mínimo" type="number" placeholder="0" />
                </FormRow>

                <div className="divider"></div>
                <h4 className="mb-md">Dados Fiscais</h4>

                <FormRow>
                    <Input label="NCM" placeholder="00000000" />
                    <Input label="CST" placeholder="000" />
                </FormRow>

                <FormRow>
                    <Input label="CFOP (Dentro do Estado)" placeholder="5102" />
                    <Input label="CFOP (Fora do Estado)" placeholder="6102" />
                </FormRow>
            </Modal>
        </>
    );
}
