'use client';

import { useState, useEffect, Suspense } from 'react';
import { Header } from '@/components/layout';
import { Card, Alert, Modal, DataTable, SearchInput } from '@/components/ui';
import { Input, Select, FormRow, MoneyInput, Textarea } from '@/components/ui';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Cliente, Veiculo, Produto, Servico } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { getUserEmpresaId } from '@/lib/supabase/helpers';

interface ItemOS {
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

interface OrcamentoAprovado {
    id: string;
    numero: number;
    cliente_id: string;
    cliente_nome: string;
    veiculo_id: string;
    veiculo_descricao: string;
    valor_total: number;
    data_orcamento: string;
}

type VeiculoComCliente = Veiculo & { cliente_nome?: string };

function NovaOSContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [empresaId, setEmpresaId] = useState<string | null>(null);

    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showError, setShowError] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    // Orçamentos aprovados
    const [orcamentosAprovados, setOrcamentosAprovados] = useState<OrcamentoAprovado[]>([]);
    const [orcamentoSelecionadoId, setOrcamentoSelecionadoId] = useState('');
    const [modoEntrada, setModoEntrada] = useState<'orcamento' | 'manual'>('manual');

    // Dados para selects
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [veiculos, setVeiculos] = useState<VeiculoComCliente[]>([]);
    const [veiculosFiltrados, setVeiculosFiltrados] = useState<VeiculoComCliente[]>([]);
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [servicos, setServicos] = useState<Servico[]>([]);

    // Formulário principal
    const [clienteId, setClienteId] = useState('');
    const [veiculoId, setVeiculoId] = useState('');
    const [kmEntrada, setKmEntrada] = useState('');
    const [diagnostico, setDiagnostico] = useState('');
    const [observacoes, setObservacoes] = useState('');

    // Itens da OS
    const [itens, setItens] = useState<ItemOS[]>([]);
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
            if (!id) {
                setShowError('❌ Erro: Usuário sem empresa associada. Contate o administrador do sistema.');
                setLoading(false);
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
                return;
            }
            setEmpresaId(id);
        }
        loadEmpresaId();
    }, []);


    useEffect(() => {
        if (!empresaId) return;

        async function loadData() {
            setLoading(true);
            try {
                const [clientesRes, veiculosRes, produtosRes, servicosRes, orcamentosRes] = await Promise.all([
                    supabase.from('clientes').select('*').eq('empresa_id', empresaId).eq('ativo', true).order('nome'),
                    supabase.from('veiculos').select('*, clientes(nome)').eq('empresa_id', empresaId).eq('ativo', true).order('marca'),
                    supabase.from('produtos').select('*').eq('empresa_id', empresaId).eq('ativo', true).order('descricao'),
                    supabase.from('servicos').select('*').eq('empresa_id', empresaId).eq('ativo', true).order('descricao'),
                    supabase.from('orcamentos')
                        .select(`*, clientes(nome), veiculos(placa, marca, modelo)`)
                        .eq('empresa_id', empresaId)
                        .eq('status', 'aprovado')
                        .order('numero', { ascending: false }),
                ]);

                setClientes(clientesRes.data || []);
                setVeiculos((veiculosRes.data || []).map((v: any) => ({
                    ...v,
                    cliente_nome: v.clientes?.nome
                })));
                setProdutos(produtosRes.data || []);
                setServicos(servicosRes.data || []);

                // Mapear orçamentos aprovados
                const orcamentos = (orcamentosRes.data || []).map((o: any) => ({
                    id: o.id,
                    numero: o.numero,
                    cliente_id: o.cliente_id,
                    cliente_nome: o.clientes?.nome || 'Cliente não encontrado',
                    veiculo_id: o.veiculo_id,
                    veiculo_descricao: o.veiculos ? `${o.veiculos.placa} - ${o.veiculos.marca} ${o.veiculos.modelo}` : '-',
                    valor_total: o.valor_total,
                    data_orcamento: o.data_orcamento,
                }));
                setOrcamentosAprovados(orcamentos);

                // Verificar se veio com orçamento pré-selecionado via URL
                const orcamentoIdUrl = searchParams.get('orcamento');
                if (orcamentoIdUrl) {
                    setModoEntrada('orcamento');
                    setOrcamentoSelecionadoId(orcamentoIdUrl);
                }
            } catch (err) {
                console.error('Erro ao carregar dados:', err);
                setShowError('Erro ao carregar dados');
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [empresaId]);

    // Quando selecionar orçamento, carregar dados
    useEffect(() => {
        if (orcamentoSelecionadoId && modoEntrada === 'orcamento') {
            loadOrcamentoData(orcamentoSelecionadoId);
        }
    }, [orcamentoSelecionadoId, modoEntrada]);

    const loadOrcamentoData = async (orcamentoId: string) => {
        try {
            // Buscar orçamento com itens
            const { data: orcamento, error: orcError } = await supabase
                .from('orcamentos')
                .select(`
                    *,
                    clientes(nome),
                    veiculos(placa, marca, modelo, km_atual),
                    orcamento_itens(*)
                `)
                .eq('id', orcamentoId)
                .single();

            if (orcError) throw orcError;

            // Preencher dados
            setClienteId(orcamento.cliente_id);
            setVeiculoId(orcamento.veiculo_id);
            setDesconto(orcamento.valor_desconto || 0);
            setObservacoes(orcamento.observacoes || '');

            if (orcamento.veiculos?.km_atual) {
                setKmEntrada(orcamento.veiculos.km_atual.toString());
            }

            // Mapear itens do orçamento para itens da OS
            const itensOrcamento = (orcamento.orcamento_itens || []).map((item: any) => ({
                id: Date.now().toString() + Math.random().toString(),
                tipo: item.tipo,
                produto_id: item.produto_id,
                servico_id: item.servico_id,
                descricao: item.descricao,
                quantidade: item.quantidade,
                valor_unitario: item.valor_unitario,
                valor_desconto: item.valor_desconto || 0,
                valor_total: item.valor_total,
            }));
            setItens(itensOrcamento);

        } catch (err) {
            console.error('Erro ao carregar orçamento:', err);
            setShowError('Erro ao carregar dados do orçamento');
        }
    };

    // Filtrar veículos quando cliente mudar
    useEffect(() => {
        if (clienteId) {
            setVeiculosFiltrados(veiculos.filter(v => v.cliente_id === clienteId));
        } else {
            setVeiculosFiltrados(veiculos);
        }
        if (modoEntrada !== 'orcamento') {
            setVeiculoId('');
        }
    }, [clienteId, veiculos]);

    // Selecionar automaticamente o cliente quando selecionar veículo
    useEffect(() => {
        if (veiculoId && !clienteId && modoEntrada === 'manual') {
            const veiculo = veiculos.find(v => v.id === veiculoId);
            if (veiculo) {
                setClienteId(veiculo.cliente_id);
            }
        }
        // Preencher KM atual do veículo
        if (veiculoId && modoEntrada === 'manual') {
            const veiculo = veiculos.find(v => v.id === veiculoId);
            if (veiculo && veiculo.km_atual) {
                setKmEntrada(veiculo.km_atual.toString());
            }
        }
    }, [veiculoId]);

    const formatMoney = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    // Totais
    const valorProdutos = itens.filter(i => i.tipo === 'produto').reduce((acc, i) => acc + i.valor_total, 0);
    const valorServicos = itens.filter(i => i.tipo === 'servico').reduce((acc, i) => acc + i.valor_total, 0);
    const valorTotal = valorProdutos + valorServicos - desconto;

    const handleModoChange = (modo: 'orcamento' | 'manual') => {
        setModoEntrada(modo);
        if (modo === 'manual') {
            // Limpar dados
            setOrcamentoSelecionadoId('');
            setClienteId('');
            setVeiculoId('');
            setItens([]);
            setDesconto(0);
            setKmEntrada('');
            setDiagnostico('');
            setObservacoes('');
        }
    };

    const handleAddItem = () => {
        if (!itemDescricao.trim()) {
            setShowError('Informe a descrição do item');
            return;
        }

        const quantidade = parseFloat(itemQtd) || 1;
        const valorUnitario = itemValor;
        const valorTotalItem = quantidade * valorUnitario;

        const novoItem: ItemOS = {
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

        setSaving(true);
        setShowError('');

        try {
            // Criar OS
            const { data: os, error: osError } = await supabase
                .from('ordens_servico')
                .insert({
                    empresa_id: empresaId,
                    orcamento_id: orcamentoSelecionadoId || null,
                    cliente_id: clienteId,
                    veiculo_id: veiculoId,
                    km_entrada: kmEntrada ? parseInt(kmEntrada) : null,
                    valor_produtos: valorProdutos,
                    valor_servicos: valorServicos,
                    valor_desconto: desconto,
                    valor_total: valorTotal,
                    status: 'aberta',
                    diagnostico: diagnostico || null,
                    observacoes: observacoes || null,
                })
                .select()
                .single();

            if (osError) throw osError;

            // Criar itens da OS (se houver)
            if (itens.length > 0) {
                const itensParaInserir = itens.map(item => ({
                    os_id: os.id,
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
                    .from('os_itens')
                    .insert(itensParaInserir);

                if (itensError) throw itensError;
            }

            // Atualizar status do orçamento para "convertido"
            if (orcamentoSelecionadoId) {
                await supabase
                    .from('orcamentos')
                    .update({ status: 'convertido' })
                    .eq('id', orcamentoSelecionadoId);
            }

            // Atualizar KM do veículo
            if (kmEntrada) {
                await supabase
                    .from('veiculos')
                    .update({ km_atual: parseInt(kmEntrada) })
                    .eq('id', veiculoId);
            }

            setShowSuccess(true);
            setTimeout(() => {
                router.push('/os');
            }, 1500);

        } catch (err: any) {
            console.error('Erro ao salvar:', err);
            setShowError('Erro ao salvar OS: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const itensColumns = [
        {
            key: 'tipo',
            header: 'Tipo',
            width: '100px',
            render: (item: ItemOS) => (
                <span className={`badge ${item.tipo === 'servico' ? 'badge-primary' : 'badge-info'}`}>
                    {item.tipo === 'servico' ? '🔧 Serviço' : '📦 Produto'}
                </span>
            ),
        },
        {
            key: 'descricao',
            header: 'Descrição',
            render: (item: ItemOS) => item.descricao,
        },
        {
            key: 'qtd',
            header: 'Qtd',
            width: '70px',
            render: (item: ItemOS) => item.quantidade,
        },
        {
            key: 'unitario',
            header: 'Unitário',
            width: '110px',
            render: (item: ItemOS) => formatMoney(item.valor_unitario),
        },
        {
            key: 'total',
            header: 'Total',
            width: '120px',
            render: (item: ItemOS) => (
                <span style={{ fontWeight: 600 }}>{formatMoney(item.valor_total)}</span>
            ),
        },
        {
            key: 'acoes',
            header: '',
            width: '60px',
            render: (item: ItemOS) => (
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
                <Header title="Nova Ordem de Serviço" subtitle="Carregando..." />
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
            <Header title="Nova Ordem de Serviço" subtitle="Abra uma nova OS para o veículo" />

            <div className="page-content">
                {showSuccess && (
                    <div className="mb-lg">
                        <Alert type="success">
                            OS criada com sucesso! Redirecionando...
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

                {/* Seleção de modo: A partir de orçamento ou manual */}
                <Card title="Como deseja criar a OS?">
                    <div className="flex gap-md" style={{ marginBottom: '1rem' }}>
                        <button
                            className={`btn ${modoEntrada === 'orcamento' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => handleModoChange('orcamento')}
                            style={{ flex: 1 }}
                        >
                            📋 A partir de um Orçamento Aprovado
                        </button>
                        <button
                            className={`btn ${modoEntrada === 'manual' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => handleModoChange('manual')}
                            style={{ flex: 1 }}
                        >
                            ✏️ Criar Manualmente
                        </button>
                    </div>

                    {modoEntrada === 'orcamento' && (
                        <>
                            {orcamentosAprovados.length === 0 ? (
                                <Alert type="warning">
                                    Nenhum orçamento aprovado encontrado. Aprove um orçamento primeiro ou crie a OS manualmente.
                                </Alert>
                            ) : (
                                <Select
                                    label="Selecione o Orçamento Aprovado"
                                    required
                                    value={orcamentoSelecionadoId}
                                    onChange={(e) => setOrcamentoSelecionadoId(e.target.value)}
                                    options={[
                                        { value: '', label: 'Selecione um orçamento...' },
                                        ...orcamentosAprovados.map(o => ({
                                            value: o.id,
                                            label: `#${o.numero} - ${o.cliente_nome} - ${o.veiculo_descricao} - ${formatMoney(o.valor_total)}`
                                        }))
                                    ]}
                                />
                            )}
                        </>
                    )}
                </Card>

                {/* Cliente e Veículo */}
                <Card title="Dados do Cliente e Veículo">
                    <FormRow>
                        <Select
                            label="Cliente"
                            required
                            value={clienteId}
                            onChange={(e) => setClienteId(e.target.value)}
                            disabled={modoEntrada === 'orcamento' && !!orcamentoSelecionadoId}
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
                            disabled={modoEntrada === 'orcamento' && !!orcamentoSelecionadoId}
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
                            label="KM de Entrada"
                            type="number"
                            value={kmEntrada}
                            onChange={(e) => setKmEntrada(e.target.value)}
                            placeholder="Quilometragem atual"
                        />
                        <div></div>
                    </FormRow>
                </Card>

                {/* Diagnóstico */}
                <Card title="Diagnóstico">
                    <Textarea
                        label="Diagnóstico / Reclamação do Cliente"
                        placeholder="Descreva o problema relatado pelo cliente..."
                        rows={3}
                        value={diagnostico}
                        onChange={(e) => setDiagnostico(e.target.value)}
                    />
                </Card>

                {/* Itens da OS */}
                <Card noPadding>
                    <div style={{
                        padding: '1rem 1.5rem',
                        borderBottom: '1px solid var(--gray-200)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <h3 style={{ margin: 0, fontWeight: 600 }}>Itens da OS</h3>
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
                            {modoEntrada === 'orcamento' && orcamentoSelecionadoId
                                ? 'Carregando itens do orçamento...'
                                : 'Nenhum item adicionado. Você pode adicionar itens agora ou depois.'}
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
                                placeholder="Observações internas..."
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
                    <button className="btn btn-secondary" onClick={() => router.push('/os')}>
                        Cancelar
                    </button>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                        {saving ? 'Salvando...' : '✓ Abrir OS'}
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

export default function NovaOSPage() {
    return (
        <Suspense fallback={
            <>
                <Header title="Nova Ordem de Serviço" subtitle="Carregando..." />
                <div className="page-content">
                    <Card>
                        <div style={{ padding: '2rem', textAlign: 'center' }}>
                            Carregando...
                        </div>
                    </Card>
                </div>
            </>
        }>
            <NovaOSContent />
        </Suspense>
    );
}
