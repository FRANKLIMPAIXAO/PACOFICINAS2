'use client';

import { useState, useEffect, Suspense } from 'react';
import { Header } from '@/components/layout';
import { Card, Alert, DataTable } from '@/components/ui';
import { Input, Select, FormRow, MoneyInput } from '@/components/ui';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getUserEmpresaId } from '@/lib/supabase/helpers';

interface OSData {
    id: string;
    numero: number;
    cliente_id: string;
    cliente_nome: string;
    cliente_cpf_cnpj?: string;
    cliente_email?: string;
    cliente_endereco?: string;
    valor_produtos: number;
}

interface ItemProduto {
    id: string;
    produto_id?: string;
    descricao: string;
    quantidade: number;
    valor_unitario: number;
    valor_total: number;
    ncm?: string;
    cfop?: string;
}

function EmitirNFeContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const osId = searchParams.get('os');
    const [empresaId, setEmpresaId] = useState<string | null>(null);

    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [emitindo, setEmitindo] = useState(false);
    const [showError, setShowError] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    const [osData, setOsData] = useState<OSData | null>(null);
    const [produtos, setProdutos] = useState<ItemProduto[]>([]);

    // Dados da NF-e
    const [naturezaOperacao, setNaturezaOperacao] = useState('Venda de mercadorias');
    const [valorFrete, setValorFrete] = useState(0);
    const [valorSeguro, setValorSeguro] = useState(0);
    const [valorOutros, setValorOutros] = useState(0);
    const [valorDesconto, setValorDesconto] = useState(0);
    const [informacoesAdicionais, setInformacoesAdicionais] = useState('');

    // Dados do destinatário
    const [destNome, setDestNome] = useState('');
    const [destCpfCnpj, setDestCpfCnpj] = useState('');
    const [destEmail, setDestEmail] = useState('');

    useEffect(() => {
        async function loadEmpresaId() {
            const id = await getUserEmpresaId();
            setEmpresaId(id);
        }
        loadEmpresaId();
    }, []);


    useEffect(() => {
        if (osId) {
            loadOSData(osId);
        } else {
            setLoading(false);
        }
    }, [osId]);

    const loadOSData = async (id: string) => {
        setLoading(true);
        try {
            // Buscar OS com cliente e itens de produto
            const { data: os, error: osError } = await supabase
                .from('ordens_servico')
                .select(`
                    *,
                    clientes(nome, cpf_cnpj, email, logradouro, numero, bairro, cidade, uf),
                    os_itens(id, tipo, descricao, quantidade, valor_unitario, valor_total, produto_id)
                `)
                .eq('id', id)
                .single();

            if (osError) throw osError;

            const cliente = os.clientes;
            const endereco = cliente ? `${cliente.logradouro || ''}, ${cliente.numero || ''} - ${cliente.bairro || ''}, ${cliente.cidade || ''}/${cliente.uf || ''}` : '';

            setOsData({
                id: os.id,
                numero: os.numero,
                cliente_id: os.cliente_id,
                cliente_nome: cliente?.nome || 'Cliente não informado',
                cliente_cpf_cnpj: cliente?.cpf_cnpj,
                cliente_email: cliente?.email,
                cliente_endereco: endereco,
                valor_produtos: os.valor_produtos || 0,
            });

            // Filtrar apenas produtos
            const itensProduto = (os.os_itens || [])
                .filter((i: any) => i.tipo === 'produto')
                .map((i: any) => ({
                    id: i.id,
                    produto_id: i.produto_id,
                    descricao: i.descricao,
                    quantidade: i.quantidade,
                    valor_unitario: i.valor_unitario,
                    valor_total: i.valor_total,
                    ncm: '',
                    cfop: '5102', // Venda de mercadoria adquirida
                }));
            setProdutos(itensProduto);

            // Preencher dados do destinatário
            setDestNome(cliente?.nome || '');
            setDestCpfCnpj(cliente?.cpf_cnpj || '');
            setDestEmail(cliente?.email || '');

            // Informações adicionais
            setInformacoesAdicionais(`Referente à OS #${os.numero}`);

        } catch (err: any) {
            console.error('Erro ao carregar OS:', err);
            setShowError('Erro ao carregar dados da OS: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatMoney = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    // Cálculos
    const subtotalProdutos = produtos.reduce((acc, p) => acc + p.valor_total, 0);
    const totalNFe = subtotalProdutos + valorFrete + valorSeguro + valorOutros - valorDesconto;

    const handleEmitir = async () => {
        if (produtos.length === 0) {
            setShowError('Não há produtos para emitir NF-e');
            return;
        }
        if (!destNome.trim()) {
            setShowError('Informe o nome do destinatário');
            return;
        }

        setEmitindo(true);
        setShowError('');

        try {
            // Criar registro da NF-e
            const { data: nfe, error: nfeError } = await supabase
                .from('nfe')
                .insert({
                    empresa_id: empresaId,
                    os_id: osData?.id || null,
                    natureza_operacao: naturezaOperacao,
                    valor_produtos: subtotalProdutos,
                    valor_frete: valorFrete,
                    valor_seguro: valorSeguro,
                    valor_outras_despesas: valorOutros,
                    valor_desconto: valorDesconto,
                    valor_total: totalNFe,
                    destinatario_nome: destNome,
                    destinatario_cpf_cnpj: destCpfCnpj || null,
                    destinatario_email: destEmail || null,
                    informacoes_adicionais: informacoesAdicionais || null,
                    status: 'pendente',
                    ambiente: 'homologacao',
                })
                .select()
                .single();

            if (nfeError) throw nfeError;

            // Inserir itens da NF-e
            const itensNFe = produtos.map((p, index) => ({
                nfe_id: nfe.id,
                numero_item: index + 1,
                produto_id: p.produto_id || null,
                descricao: p.descricao,
                ncm: p.ncm || '00000000',
                cfop: p.cfop || '5102',
                unidade: 'UN',
                quantidade: p.quantidade,
                valor_unitario: p.valor_unitario,
                valor_total: p.valor_total,
            }));

            await supabase
                .from('nfe_itens')
                .insert(itensNFe);

            setShowSuccess(true);
            setTimeout(() => {
                router.push('/nfe');
            }, 2000);

        } catch (err: any) {
            console.error('Erro ao emitir NF-e:', err);
            setShowError('Erro ao criar NF-e: ' + err.message);
        } finally {
            setEmitindo(false);
        }
    };

    const produtosColumns = [
        {
            key: 'descricao',
            header: 'Produto',
            render: (item: ItemProduto) => item.descricao,
        },
        {
            key: 'quantidade',
            header: 'Qtd',
            width: '80px',
            render: (item: ItemProduto) => item.quantidade,
        },
        {
            key: 'unitario',
            header: 'Unitário',
            width: '120px',
            render: (item: ItemProduto) => formatMoney(item.valor_unitario),
        },
        {
            key: 'total',
            header: 'Total',
            width: '120px',
            render: (item: ItemProduto) => (
                <span style={{ fontWeight: 600 }}>{formatMoney(item.valor_total)}</span>
            ),
        },
    ];

    if (loading) {
        return (
            <>
                <Header title="Emitir NF-e" subtitle="Carregando..." />
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
            <Header
                title="Emitir NF-e"
                subtitle={osData ? `OS #${osData.numero} - ${osData.cliente_nome}` : 'Nova Nota Fiscal de Produtos'}
            />

            <div className="page-content">
                {showSuccess && (
                    <div className="mb-lg">
                        <Alert type="success">
                            NF-e criada com sucesso! Redirecionando...
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

                {!osId && (
                    <Alert type="warning">
                        Nenhuma OS selecionada. Para emitir NF-e de produtos, selecione uma OS com produtos.{' '}
                        <Link href="/os" className="action-link">Ver Ordens de Serviço</Link>
                    </Alert>
                )}

                {/* Dados da OS */}
                {osData && (
                    <Card title="Dados da Ordem de Serviço">
                        <div className="grid grid-cols-3">
                            <div>
                                <strong>OS:</strong> #{osData.numero}
                            </div>
                            <div>
                                <strong>Valor Produtos:</strong> {formatMoney(osData.valor_produtos)}
                            </div>
                            <div>
                                <strong>Qtd. Itens:</strong> {produtos.length} produto(s)
                            </div>
                        </div>
                    </Card>
                )}

                {/* Destinatário */}
                <Card title="Dados do Destinatário">
                    <FormRow>
                        <Input
                            label="Nome / Razão Social"
                            required
                            value={destNome}
                            onChange={(e) => setDestNome(e.target.value)}
                            placeholder="Nome do cliente"
                        />
                        <Input
                            label="CPF / CNPJ"
                            value={destCpfCnpj}
                            onChange={(e) => setDestCpfCnpj(e.target.value)}
                            placeholder="000.000.000-00"
                        />
                    </FormRow>
                    <FormRow>
                        <Input
                            label="E-mail"
                            type="email"
                            value={destEmail}
                            onChange={(e) => setDestEmail(e.target.value)}
                            placeholder="email@exemplo.com"
                        />
                        <Input
                            label="Natureza da Operação"
                            value={naturezaOperacao}
                            onChange={(e) => setNaturezaOperacao(e.target.value)}
                        />
                    </FormRow>
                </Card>

                {/* Produtos */}
                <Card title="📦 Produtos" noPadding>
                    {produtos.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-500)' }}>
                            Nenhum produto encontrado na OS
                        </div>
                    ) : (
                        <DataTable
                            columns={produtosColumns}
                            data={produtos}
                            keyExtractor={(item) => item.id}
                        />
                    )}
                </Card>

                {/* Valores Adicionais */}
                <Card title="Valores">
                    <div className="grid grid-cols-2">
                        <div>
                            <FormRow>
                                <MoneyInput
                                    label="Valor Frete"
                                    value={valorFrete}
                                    onChange={setValorFrete}
                                />
                                <MoneyInput
                                    label="Valor Seguro"
                                    value={valorSeguro}
                                    onChange={setValorSeguro}
                                />
                            </FormRow>
                            <FormRow>
                                <MoneyInput
                                    label="Outras Despesas"
                                    value={valorOutros}
                                    onChange={setValorOutros}
                                />
                                <MoneyInput
                                    label="Desconto"
                                    value={valorDesconto}
                                    onChange={setValorDesconto}
                                />
                            </FormRow>
                        </div>
                        <div style={{ paddingLeft: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span>Subtotal Produtos:</span>
                                <span>{formatMoney(subtotalProdutos)}</span>
                            </div>
                            {valorFrete > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span>Frete:</span>
                                    <span>+ {formatMoney(valorFrete)}</span>
                                </div>
                            )}
                            {valorSeguro > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span>Seguro:</span>
                                    <span>+ {formatMoney(valorSeguro)}</span>
                                </div>
                            )}
                            {valorOutros > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span>Outras Despesas:</span>
                                    <span>+ {formatMoney(valorOutros)}</span>
                                </div>
                            )}
                            {valorDesconto > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--error-600)' }}>
                                    <span>Desconto:</span>
                                    <span>- {formatMoney(valorDesconto)}</span>
                                </div>
                            )}
                            <hr style={{ margin: '1rem 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700 }}>
                                <span>TOTAL NF-e:</span>
                                <span style={{ color: 'var(--success-600)' }}>{formatMoney(totalNFe)}</span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Informações Adicionais */}
                <Card title="Informações Adicionais">
                    <textarea
                        className="form-control"
                        rows={3}
                        value={informacoesAdicionais}
                        onChange={(e) => setInformacoesAdicionais(e.target.value)}
                        placeholder="Informações complementares da nota fiscal..."
                        style={{ width: '100%', resize: 'vertical' }}
                    />
                </Card>

                {/* Ambiente */}
                <Card>
                    <Alert type="warning">
                        <strong>Ambiente de Homologação</strong><br />
                        Esta NF-e será criada em ambiente de teste. Para emissão em produção, configure o certificado digital e altere o ambiente nas configurações.
                    </Alert>
                </Card>

                {/* Botões */}
                <div className="flex gap-md" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button className="btn btn-secondary" onClick={() => router.back()}>
                        Cancelar
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleEmitir}
                        disabled={emitindo || produtos.length === 0}
                    >
                        {emitindo ? 'Emitindo...' : '📄 Emitir NF-e'}
                    </button>
                </div>
            </div>
        </>
    );
}

export default function EmitirNFePage() {
    return (
        <Suspense fallback={
            <>
                <Header title="Emitir NF-e" subtitle="Carregando..." />
                <div className="page-content">
                    <Card>
                        <div style={{ padding: '2rem', textAlign: 'center' }}>
                            Carregando...
                        </div>
                    </Card>
                </div>
            </>
        }>
            <EmitirNFeContent />
        </Suspense>
    );
}
