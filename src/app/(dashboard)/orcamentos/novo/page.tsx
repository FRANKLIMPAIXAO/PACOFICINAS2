'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Card, Alert, Modal, DataTable, SearchInput } from '@/components/ui';
import { Input, Select, FormRow, MoneyInput, Textarea } from '@/components/ui';
import { useRouter } from 'next/navigation';
import type { Cliente, Veiculo, Produto, Servico } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { getUserEmpresaId } from '@/lib/supabase/helpers';

interface ItemOrcamento {
    id: string;
    tipo: 'produto' | 'servico';
    produto_id?: string;
    servico_id?: string;
    descricao: string;
    quantidade: number;
    valor_unitario: number;
    valor_desconto: number;
    valor_total: number;
}

type VeiculoComCliente = Veiculo & { cliente_nome?: string };

export default function NovoOrcamentoPage() {
    const router = useRouter();
    const [empresaId, setEmpresaId] = useState<string | null>(null);

    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showError, setShowError] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    // Dados para selects
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [veiculos, setVeiculos] = useState<VeiculoComCliente[]>([]);
    const [veiculosFiltrados, setVeiculosFiltrados] = useState<VeiculoComCliente[]>([]);
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [servicos, setServicos] = useState<Servico[]>([]);

    // Formulário principal
    const [clienteId, setClienteId] = useState('');
    const [veiculoId, setVeiculoId] = useState('');
    const [validadeDias, setValidadeDias] = useState('7');
    const [observacoes, setObservacoes] = useState('');
    const [formaPagamento, setFormaPagamento] = useState('avista');
    const [prazoDias, setPrazoDias] = useState('30');

    // Itens do orçamento
    const [itens, setItens] = useState<ItemOrcamento[]>([]);
    const [desconto, setDesconto] = useState(0);

    // Modal de adicionar item
    const [showModalItem, setShowModalItem] = useState(false);
    const [tipoItem, setTipoItem] = useState<'produto' | 'servico'>('servico');
    const [itemSelecionadoId, setItemSelecionadoId] = useState('');
    const [itemDescricao, setItemDescricao] = useState('');
    const [itemQtd, setItemQtd] = useState('1');
    const [itemValor, setItemValor] = useState(0);
    const [searchItem, setSearchItem] = useState('');

    useEffect(() => {
        async function loadEmpresaId() {
            const id = await getUserEmpresaId();
            setEmpresaId(id);
        }
        loadEmpresaId();
    }, []);


    useEffect(() => {
        if (!empresaId) return;

        async function loadData() {
            setLoading(true);
            try {
                const [clientesRes, veiculosRes, produtosRes, servicosRes] = await Promise.all([
                    supabase.from('clientes').select('*').eq('empresa_id', empresaId).eq('ativo', true).order('nome'),
                    supabase.from('veiculos').select('*, clientes(nome)').eq('empresa_id', empresaId).eq('ativo', true).order('marca'),
                    supabase.from('produtos').select('*').eq('empresa_id', empresaId).eq('ativo', true).order('descricao'),
                    supabase.from('servicos').select('*').eq('empresa_id', empresaId).eq('ativo', true).order('descricao'),
                ]);

                setClientes(clientesRes.data || []);
                setVeiculos((veiculosRes.data || []).map((v: any) => ({
                    ...v,
                    cliente_nome: v.clientes?.nome
                })));
                setProdutos(produtosRes.data || []);
                setServicos(servicosRes.data || []);
            } catch (err) {
                console.error('Erro ao carregar dados:', err);
                setShowError('Erro ao carregar dados');
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [empresaId]);

    // Filtrar veículos quando cliente mudar
    useEffect(() => {
        if (clienteId) {
            setVeiculosFiltrados(veiculos.filter(v => v.cliente_id === clienteId));
        } else {
            setVeiculosFiltrados(veiculos);
        }
        setVeiculoId('');
    }, [clienteId, veiculos]);

    // Selecionar automaticamente o cliente quando selecionar veículo
    useEffect(() => {
        if (veiculoId && !clienteId) {
            const veiculo = veiculos.find(v => v.id === veiculoId);
            if (veiculo) {
                setClienteId(veiculo.cliente_id);
            }
        }
    }, [veiculoId]);

    const formatMoney = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    // Totais
    const valorProdutos = itens.filter(i => i.tipo === 'produto').reduce((acc, i) => acc + i.valor_total, 0);
    const valorServicos = itens.filter(i => i.tipo === 'servico').reduce((acc, i) => acc + i.valor_total, 0);
    const valorTotal = valorProdutos + valorServicos - desconto;

    const handleAddItem = () => {
        if (!itemDescricao.trim()) {
            setShowError('Informe a descrição do item');
            return;
        }

        const quantidade = parseFloat(itemQtd) || 1;
        const valorUnitario = itemValor;
        const valorTotalItem = quantidade * valorUnitario;

        const novoItem: ItemOrcamento = {
            id: Date.now().toString(),
            tipo: tipoItem,
            produto_id: tipoItem === 'produto' ? itemSelecionadoId : undefined,
            servico_id: tipoItem === 'servico' ? itemSelecionadoId : undefined,
            descricao: itemDescricao,
            quantidade,
            valor_unitario: valorUnitario,
            valor_desconto: 0,
            valor_total: valorTotalItem,
        };

        setItens(prev => [...prev, novoItem]);
        setShowModalItem(false);
        resetItemForm();
    };

    const resetItemForm = () => {
        setItemSelecionadoId('');
        setItemDescricao('');
        setItemQtd('1');
        setItemValor(0);
        setSearchItem('');
    };

    const handleRemoveItem = (id: string) => {
        setItens(prev => prev.filter(i => i.id !== id));
    };

    const handleSelectItem = (item: Produto | Servico, tipo: 'produto' | 'servico') => {
        setItemSelecionadoId(item.id);
        setItemDescricao(item.descricao);
        if (tipo === 'produto') {
            setItemValor((item as Produto).preco_venda);
        } else {
            setItemValor((item as Servico).preco);
        }
    };

    const handleSave = async () => {
        if (!clienteId) {
            setShowError('Selecione um cliente');
            return;
        }
        if (!veiculoId) {
            setShowError('Selecione um veículo');
            return;
        }
        if (itens.length === 0) {
            setShowError('Adicione pelo menos um item ao orçamento');
            return;
        }

        setSaving(true);
        setShowError('');

        try {
            // Criar orçamento
            const { data: orcamento, error: orcamentoError } = await supabase
                .from('orcamentos')
                .insert({
                    empresa_id: empresaId,
                    cliente_id: clienteId,
                    veiculo_id: veiculoId,
                    validade_dias: parseInt(validadeDias) || 7,
                    valor_produtos: valorProdutos,
                    valor_servicos: valorServicos,
                    valor_desconto: desconto,
                    valor_total: valorTotal,
                    status: 'aberto',
                    observacoes: observacoes || null,
                    forma_pagamento: formaPagamento,
                    prazo_dias: formaPagamento === 'prazo' ? parseInt(prazoDias) || 30 : 0,
                })
                .select()
                .single();

            if (orcamentoError) throw orcamentoError;

            // Criar itens do orçamento
            const itensParaInserir = itens.map(item => ({
                orcamento_id: orcamento.id,
                tipo: item.tipo,
                produto_id: item.produto_id || null,
                servico_id: item.servico_id || null,
                descricao: item.descricao,
                quantidade: item.quantidade,
                valor_unitario: item.valor_unitario,
                valor_desconto: item.valor_desconto,
                valor_total: item.valor_total,
            }));

            const { error: itensError } = await supabase
                .from('orcamento_itens')
                .insert(itensParaInserir);

            if (itensError) throw itensError;

            setShowSuccess(true);
            setTimeout(() => {
                router.push('/orcamentos');
            }, 1500);

        } catch (err: any) {
            console.error('Erro ao salvar:', err);
            setShowError('Erro ao salvar orçamento: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const itensColumns = [
        {
            key: 'tipo',
            header: 'Tipo',
            width: '100px',
            render: (item: ItemOrcamento) => (
                <span className={`badge ${item.tipo === 'servico' ? 'badge-primary' : 'badge-info'}`}>
                    {item.tipo === 'servico' ? '🔧 Serviço' : '📦 Produto'}
                </span>
            ),
        },
        {
            key: 'descricao',
            header: 'Descrição',
            render: (item: ItemOrcamento) => item.descricao,
        },
        {
            key: 'qtd',
            header: 'Qtd',
            width: '70px',
            render: (item: ItemOrcamento) => item.quantidade,
        },
        {
            key: 'unitario',
            header: 'Unitário',
            width: '110px',
            render: (item: ItemOrcamento) => formatMoney(item.valor_unitario),
        },
        {
            key: 'total',
            header: 'Total',
            width: '120px',
            render: (item: ItemOrcamento) => (
                <span style={{ fontWeight: 600 }}>{formatMoney(item.valor_total)}</span>
            ),
        },
        {
            key: 'acoes',
            header: '',
            width: '60px',
            render: (item: ItemOrcamento) => (
                <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleRemoveItem(item.id)}
                    title="Remover"
                >
                    🗑️
                </button>
            ),
        },
    ];

    const produtosFiltrados = produtos.filter(p =>
        p.descricao.toLowerCase().includes(searchItem.toLowerCase()) ||
        p.codigo?.toLowerCase().includes(searchItem.toLowerCase())
    );

    const servicosFiltrados = servicos.filter(s =>
        s.descricao.toLowerCase().includes(searchItem.toLowerCase()) ||
        s.codigo?.toLowerCase().includes(searchItem.toLowerCase())
    );

    if (loading) {
        return (
            <>
                <Header title="Novo Orçamento" subtitle="Carregando..." />
                <div className="page-content">
                    <Card>
                        <div style={{ padding: '2rem', textAlign: 'center' }}>
                            Carregando dados...
                        </div>
                    </Card>
                </div>
            </>
        );
    }

    return (
        <>
            <Header title="Novo Orçamento" subtitle="Crie um novo orçamento para o cliente" />

            <div className="page-content">
                {showSuccess && (
                    <div className="mb-lg">
                        <Alert type="success">
                            Orçamento criado com sucesso! Redirecionando...
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

                {/* Cliente e Veículo */}
                <Card title="Dados do Cliente">
                    <FormRow>
                        <Select
                            label="Cliente"
                            required
                            value={clienteId}
                            onChange={(e) => setClienteId(e.target.value)}
                            options={[
                                { value: '', label: 'Selecione um cliente...' },
                                ...clientes.map(c => ({ value: c.id, label: c.nome }))
                            ]}
                        />
                        <Select
                            label="Veículo"
                            required
                            value={veiculoId}
                            onChange={(e) => setVeiculoId(e.target.value)}
                            options={[
                                { value: '', label: clienteId ? 'Selecione um veículo...' : 'Selecione o cliente primeiro' },
                                ...veiculosFiltrados.map(v => ({
                                    value: v.id,
                                    label: `${v.placa} - ${v.marca} ${v.modelo}`
                                }))
                            ]}
                        />
                    </FormRow>
                    <FormRow>
                        <Input
                            label="Validade (dias)"
                            type="number"
                            value={validadeDias}
                            onChange={(e) => setValidadeDias(e.target.value)}
                        />
                        <Select
                            label="Forma de Pagamento"
                            value={formaPagamento}
                            onChange={(e) => setFormaPagamento(e.target.value)}
                            options={[
                                { value: 'avista', label: '💵 À Vista' },
                                { value: 'prazo', label: '📅 A Prazo' },
                                { value: 'cartao_debito', label: '💳 Cartão Débito' },
                                { value: 'cartao_credito', label: '💳 Cartão Crédito' },
                                { value: 'pix', label: '📱 PIX' },
                            ]}
                        />
                    </FormRow>
                    {formaPagamento === 'prazo' && (
                        <FormRow>
                            <Select
                                label="Prazo para Pagamento"
                                value={prazoDias}
                                onChange={(e) => setPrazoDias(e.target.value)}
                                options={[
                                    { value: '7', label: '7 dias' },
                                    { value: '14', label: '14 dias' },
                                    { value: '15', label: '15 dias' },
                                    { value: '21', label: '21 dias' },
                                    { value: '28', label: '28 dias' },
                                    { value: '30', label: '30 dias' },
                                    { value: '45', label: '45 dias' },
                                    { value: '60', label: '60 dias' },
                                    { value: '90', label: '90 dias' },
                                ]}
                            />
                            <div></div>
                        </FormRow>
                    )}
                </Card>

                {/* Itens do Orçamento */}
                <Card noPadding>
                    <div style={{
                        padding: '1rem 1.5rem',
                        borderBottom: '1px solid var(--gray-200)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <h3 style={{ margin: 0, fontWeight: 600 }}>Itens do Orçamento</h3>
                        <div className="flex gap-sm">
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => { setTipoItem('servico'); setShowModalItem(true); }}
                            >
                                🔧 + Serviço
                            </button>
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => { setTipoItem('produto'); setShowModalItem(true); }}
                            >
                                📦 + Produto
                            </button>
                        </div>
                    </div>
                    {itens.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>
                            Nenhum item adicionado. Clique em "+ Serviço" ou "+ Produto" para adicionar.
                        </div>
                    ) : (
                        <DataTable
                            columns={itensColumns}
                            data={itens}
                            keyExtractor={(item) => item.id}
                        />
                    )}
                </Card>

                {/* Totais */}
                <Card title="Resumo">
                    <div className="grid grid-cols-2">
                        <div>
                            <Textarea
                                label="Observações"
                                placeholder="Observações para o cliente..."
                                rows={3}
                                value={observacoes}
                                onChange={(e) => setObservacoes(e.target.value)}
                            />
                        </div>
                        <div style={{ paddingLeft: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span>Serviços:</span>
                                <span>{formatMoney(valorServicos)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span>Produtos:</span>
                                <span>{formatMoney(valorProdutos)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                                <span>Desconto:</span>
                                <div style={{ width: '150px' }}>
                                    <MoneyInput
                                        value={desconto}
                                        onChange={setDesconto}
                                    />
                                </div>
                            </div>
                            <hr style={{ margin: '1rem 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700 }}>
                                <span>TOTAL:</span>
                                <span style={{ color: 'var(--success-600)' }}>{formatMoney(valorTotal)}</span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Botões */}
                <div className="flex gap-md" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button className="btn btn-secondary" onClick={() => router.push('/orcamentos')}>
                        Cancelar
                    </button>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                        {saving ? 'Salvando...' : '✓ Salvar Orçamento'}
                    </button>
                </div>
            </div>

            {/* Modal Adicionar Item */}
            <Modal
                isOpen={showModalItem}
                onClose={() => { setShowModalItem(false); resetItemForm(); }}
                title={tipoItem === 'servico' ? 'Adicionar Serviço' : 'Adicionar Produto'}
                size="lg"
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => { setShowModalItem(false); resetItemForm(); }}>
                            Cancelar
                        </button>
                        <button className="btn btn-primary" onClick={handleAddItem}>
                            Adicionar
                        </button>
                    </>
                }
            >
                <SearchInput
                    value={searchItem}
                    onChange={setSearchItem}
                    placeholder={tipoItem === 'servico' ? 'Buscar serviço...' : 'Buscar produto...'}
                />

                <div style={{ maxHeight: '200px', overflowY: 'auto', margin: '1rem 0', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)' }}>
                    {tipoItem === 'servico' ? (
                        servicosFiltrados.length === 0 ? (
                            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--gray-500)' }}>
                                Nenhum serviço encontrado
                            </div>
                        ) : (
                            servicosFiltrados.map(s => (
                                <div
                                    key={s.id}
                                    onClick={() => handleSelectItem(s, 'servico')}
                                    style={{
                                        padding: '0.75rem 1rem',
                                        cursor: 'pointer',
                                        borderBottom: '1px solid var(--gray-100)',
                                        background: itemSelecionadoId === s.id ? 'var(--primary-50)' : 'transparent',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <span>{s.descricao}</span>
                                    <span style={{ fontWeight: 600 }}>{formatMoney(s.preco)}</span>
                                </div>
                            ))
                        )
                    ) : (
                        produtosFiltrados.length === 0 ? (
                            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--gray-500)' }}>
                                Nenhum produto encontrado
                            </div>
                        ) : (
                            produtosFiltrados.map(p => (
                                <div
                                    key={p.id}
                                    onClick={() => handleSelectItem(p, 'produto')}
                                    style={{
                                        padding: '0.75rem 1rem',
                                        cursor: 'pointer',
                                        borderBottom: '1px solid var(--gray-100)',
                                        background: itemSelecionadoId === p.id ? 'var(--primary-50)' : 'transparent',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <div>
                                        <div>{p.descricao}</div>
                                        <div className="text-sm text-muted">Estoque: {p.estoque_atual}</div>
                                    </div>
                                    <span style={{ fontWeight: 600 }}>{formatMoney(p.preco_venda)}</span>
                                </div>
                            ))
                        )
                    )}
                </div>

                <div className="divider"></div>

                <Input
                    label="Descrição"
                    required
                    value={itemDescricao}
                    onChange={(e) => setItemDescricao(e.target.value)}
                    placeholder="Descrição do item"
                />

                <FormRow>
                    <Input
                        label="Quantidade"
                        type="number"
                        value={itemQtd}
                        onChange={(e) => setItemQtd(e.target.value)}
                    />
                    <MoneyInput
                        label="Valor Unitário"
                        value={itemValor}
                        onChange={setItemValor}
                    />
                </FormRow>

                <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--gray-50)', borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 500 }}>Subtotal:</span>
                    <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                        {formatMoney((parseFloat(itemQtd) || 1) * itemValor)}
                    </span>
                </div>
            </Modal>
        </>
    );
}
