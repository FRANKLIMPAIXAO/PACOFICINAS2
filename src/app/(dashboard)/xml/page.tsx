'use client';

import { useState, useRef } from 'react';
import { Header } from '@/components/layout';
import { Card, Alert, DataTable } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getUserEmpresaId } from '@/lib/supabase/helpers';

interface ProdutoXML {
    codigo: string;
    descricao: string;
    ncm: string;
    cfop: string;
    unidade: string;
    quantidade: number;
    valorUnitario: number;
    valorTotal: number;
    existente: boolean;
    produtoId?: string;
}

interface DadosNFe {
    chaveAcesso: string;
    numero: string;
    serie: string;
    dataEmissao: string;
    fornecedorCnpj: string;
    fornecedorNome: string;
    valorTotal: number;
    produtos: ProdutoXML[];
}

export default function ImportarXMLPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [empresaId, setEmpresaId] = useState<string | null>(null);

    const supabase = createClient();

    const [loading, setLoading] = useState(false);
    const [processando, setProcessando] = useState(false);
    const [showError, setShowError] = useState('');
    const [showSuccess, setShowSuccess] = useState('');

    const [dadosNFe, setDadosNFe] = useState<DadosNFe | null>(null);
    const [xmlContent, setXmlContent] = useState<string>('');

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.xml')) {
            setShowError('Por favor, selecione um arquivo XML válido');
            return;
        }

        setLoading(true);
        setShowError('');
        setDadosNFe(null);

        try {
            const content = await file.text();
            setXmlContent(content);

            // Parse do XML
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(content, 'text/xml');

            // Verificar erros de parsing
            const parseError = xmlDoc.querySelector('parsererror');
            if (parseError) {
                throw new Error('XML inválido ou mal formatado');
            }

            // Debug: mostrar conteúdo do XML no console
            console.log('XML Content:', content.substring(0, 500));

            // Função helper para buscar elementos (com ou sem namespace)
            const getElement = (parent: Element | Document, tagName: string): Element | null => {
                // Tentar sem namespace primeiro
                let el = parent.querySelector(tagName);
                if (el) return el;

                // Tentar com namespace
                el = parent.querySelector(`*|${tagName}`);
                if (el) return el;

                // Tentar getElementsByTagName (ignora namespace)
                const elements = parent.getElementsByTagName(tagName);
                if (elements.length > 0) return elements[0];

                return null;
            };

            const getElements = (parent: Element | Document, tagName: string): Element[] => {
                // Tentar getElementsByTagName (ignora namespace)
                const elements = parent.getElementsByTagName(tagName);
                return Array.from(elements);
            };

            const getText = (parent: Element | Document, tagName: string): string => {
                const el = getElement(parent, tagName);
                return el?.textContent?.trim() || '';
            };

            // Verificar se é XML de NF-e válido
            const nfeProc = getElement(xmlDoc, 'nfeProc') || getElement(xmlDoc, 'NFe');
            if (!nfeProc) {
                throw new Error('Este arquivo não parece ser um XML de NF-e válido. Verifique se é um XML de nota fiscal eletrônica.');
            }

            // Dados da nota
            const ide = getElement(xmlDoc, 'ide');
            const emit = getElement(xmlDoc, 'emit');
            const dest = getElement(xmlDoc, 'dest');
            const infProt = getElement(xmlDoc, 'infProt');
            const icmsTot = getElement(xmlDoc, 'ICMSTot');

            // Chave de acesso
            let chaveAcesso = getText(xmlDoc, 'chNFe');
            if (!chaveAcesso) {
                const infNFe = getElement(xmlDoc, 'infNFe');
                const id = infNFe?.getAttribute('Id') || '';
                chaveAcesso = id.replace('NFe', '');
            }

            const numero = getText(xmlDoc, 'nNF');
            const serie = getText(xmlDoc, 'serie');
            const dataEmissaoStr = getText(xmlDoc, 'dhEmi') || getText(xmlDoc, 'dEmi');
            const dataEmissao = dataEmissaoStr.split('T')[0];

            const fornecedorCnpj = emit ? getText(emit, 'CNPJ') : '';
            const fornecedorNome = emit ? getText(emit, 'xNome') : '';

            const valorTotalStr = icmsTot ? getText(icmsTot, 'vNF') : '0';
            const valorTotal = parseFloat(valorTotalStr.replace(',', '.')) || 0;

            console.log('Dados extraídos:', { numero, serie, fornecedorNome, valorTotal });

            // Se não conseguiu extrair dados básicos, mostrar erro
            if (!numero && !fornecedorNome) {
                throw new Error('Não foi possível extrair os dados da nota. O XML pode estar em formato diferente do esperado.');
            }

            // Extrair produtos
            const dets = getElements(xmlDoc, 'det');
            console.log('Produtos encontrados:', dets.length);

            const produtosXML: ProdutoXML[] = [];

            // Buscar produtos existentes no banco
            const { data: produtosExistentes } = await supabase
                .from('produtos')
                .select('id, codigo, codigo_barras');

            for (const det of dets) {
                const prod = getElement(det, 'prod');
                if (!prod) continue;

                const codigo = getText(prod, 'cProd');
                const codigoBarras = getText(prod, 'cEAN');
                const descricao = getText(prod, 'xProd');
                const ncm = getText(prod, 'NCM');
                const cfop = getText(prod, 'CFOP');
                const unidade = getText(prod, 'uCom') || getText(prod, 'uTrib') || 'UN';
                const quantidadeStr = getText(prod, 'qCom') || getText(prod, 'qTrib') || '0';
                const valorUnitarioStr = getText(prod, 'vUnCom') || getText(prod, 'vUnTrib') || '0';
                const valorTotalStr = getText(prod, 'vProd') || '0';

                const quantidade = parseFloat(quantidadeStr.replace(',', '.')) || 0;
                const valorUnitario = parseFloat(valorUnitarioStr.replace(',', '.')) || 0;
                const valorTotalProd = parseFloat(valorTotalStr.replace(',', '.')) || 0;

                console.log('Produto:', { codigo, descricao, quantidade, valorUnitario });

                // Verificar se produto já existe
                const produtoExistente = produtosExistentes?.find(
                    p => p.codigo === codigo || (codigoBarras && codigoBarras !== 'SEM GTIN' && p.codigo_barras === codigoBarras)
                );

                produtosXML.push({
                    codigo,
                    descricao,
                    ncm,
                    cfop,
                    unidade,
                    quantidade,
                    valorUnitario,
                    valorTotal: valorTotalProd,
                    existente: !!produtoExistente,
                    produtoId: produtoExistente?.id,
                });
            }

            if (produtosXML.length === 0) {
                throw new Error('Nenhum produto encontrado no XML. Verifique se o arquivo contém produtos.');
            }

            setDadosNFe({
                chaveAcesso,
                numero,
                serie,
                dataEmissao,
                fornecedorCnpj,
                fornecedorNome,
                valorTotal,
                produtos: produtosXML,
            });

        } catch (err: any) {
            console.error('Erro ao processar XML:', err);
            setShowError('Erro ao processar XML: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleImportar = async () => {
        if (!dadosNFe) return;

        setProcessando(true);
        setShowError('');

        try {
            // Verificar se XML já foi importado
            const { data: xmlExistente } = await supabase
                .from('xml_imports')
                .select('id')
                .eq('chave_nfe', dadosNFe.chaveAcesso)
                .single();

            if (xmlExistente) {
                setShowError('Este XML já foi importado anteriormente');
                setProcessando(false);
                return;
            }

            // Registrar importação
            const { data: xmlImport, error: xmlError } = await supabase
                .from('xml_imports')
                .insert({
                    empresa_id: empresaId,
                    chave_nfe: dadosNFe.chaveAcesso,
                    numero_nfe: dadosNFe.numero,
                    serie: dadosNFe.serie,
                    data_emissao: dadosNFe.dataEmissao || null,
                    fornecedor_cnpj: dadosNFe.fornecedorCnpj,
                    fornecedor_nome: dadosNFe.fornecedorNome,
                    valor_total: dadosNFe.valorTotal,
                    produtos_importados: dadosNFe.produtos.length,
                    processado: true,
                })
                .select()
                .single();

            if (xmlError) throw xmlError;

            // Processar cada produto
            for (const prod of dadosNFe.produtos) {
                if (prod.existente && prod.produtoId) {
                    // Atualizar estoque do produto existente
                    const { data: produtoAtual } = await supabase
                        .from('produtos')
                        .select('estoque_atual, preco_custo')
                        .eq('id', prod.produtoId)
                        .single();

                    if (produtoAtual) {
                        await supabase
                            .from('produtos')
                            .update({
                                estoque_atual: (produtoAtual.estoque_atual || 0) + prod.quantidade,
                                preco_custo: prod.valorUnitario,
                            })
                            .eq('id', prod.produtoId);

                        // Registrar movimentação de estoque
                        await supabase
                            .from('estoque_movimentos')
                            .insert({
                                empresa_id: empresaId,
                                produto_id: prod.produtoId,
                                tipo: 'entrada',
                                quantidade: prod.quantidade,
                                quantidade_anterior: produtoAtual.estoque_atual,
                                quantidade_atual: (produtoAtual.estoque_atual || 0) + prod.quantidade,
                                custo_unitario: prod.valorUnitario,
                                referencia_tipo: 'xml_import',
                                referencia_id: xmlImport.id,
                                observacao: `NF-e ${dadosNFe.numero} - ${dadosNFe.fornecedorNome}`,
                            });
                    }
                } else {
                    // Criar novo produto
                    const { data: novoProduto } = await supabase
                        .from('produtos')
                        .insert({
                            empresa_id: empresaId,
                            codigo: prod.codigo,
                            descricao: prod.descricao,
                            unidade: prod.unidade,
                            ncm: prod.ncm,
                            cfop_dentro: prod.cfop || '5102',
                            cfop_fora: '6102',
                            preco_custo: prod.valorUnitario,
                            preco_venda: prod.valorUnitario * 1.5, // Margem inicial de 50%
                            margem_lucro: 50,
                            estoque_atual: prod.quantidade,
                            estoque_minimo: 5,
                            ativo: true,
                        })
                        .select()
                        .single();

                    if (novoProduto) {
                        // Registrar movimentação de estoque
                        await supabase
                            .from('estoque_movimentos')
                            .insert({
                                empresa_id: empresaId,
                                produto_id: novoProduto.id,
                                tipo: 'entrada',
                                quantidade: prod.quantidade,
                                quantidade_anterior: 0,
                                quantidade_atual: prod.quantidade,
                                custo_unitario: prod.valorUnitario,
                                referencia_tipo: 'xml_import',
                                referencia_id: xmlImport.id,
                                observacao: `NF-e ${dadosNFe.numero} - ${dadosNFe.fornecedorNome} (Novo produto)`,
                            });
                    }
                }
            }

            // Criar conta a pagar
            const dataVencimento = new Date();
            dataVencimento.setDate(dataVencimento.getDate() + 30);

            await supabase
                .from('contas_pagar')
                .insert({
                    empresa_id: empresaId,
                    descricao: `NF-e ${dadosNFe.numero} - ${dadosNFe.fornecedorNome}`,
                    fornecedor: dadosNFe.fornecedorNome,
                    valor: dadosNFe.valorTotal,
                    data_emissao: dadosNFe.dataEmissao || new Date().toISOString().split('T')[0],
                    data_vencimento: dataVencimento.toISOString().split('T')[0],
                    status: 'aberto',
                    origem: 'xml',
                    xml_import_id: xmlImport.id,
                });

            setShowSuccess(`XML importado com sucesso! ${dadosNFe.produtos.length} produtos processados.`);

            // Limpar após sucesso
            setTimeout(() => {
                router.push('/estoque');
            }, 2000);

        } catch (err: any) {
            console.error('Erro ao importar:', err);
            setShowError('Erro ao importar: ' + err.message);
        } finally {
            setProcessando(false);
        }
    };

    const formatMoney = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    const produtosColumns = [
        {
            key: 'status',
            header: '',
            width: '50px',
            render: (item: ProdutoXML) => (
                <span title={item.existente ? 'Produto existente (atualiza estoque)' : 'Novo produto (será cadastrado)'}>
                    {item.existente ? '✅' : '🆕'}
                </span>
            ),
        },
        {
            key: 'codigo',
            header: 'Código',
            width: '100px',
            render: (item: ProdutoXML) => (
                <span style={{ fontFamily: 'var(--font-mono)' }}>{item.codigo}</span>
            ),
        },
        {
            key: 'descricao',
            header: 'Descrição',
            render: (item: ProdutoXML) => (
                <div>
                    <div>{item.descricao}</div>
                    <div className="text-sm text-muted">NCM: {item.ncm}</div>
                </div>
            ),
        },
        {
            key: 'quantidade',
            header: 'Qtd',
            width: '80px',
            render: (item: ProdutoXML) => item.quantidade,
        },
        {
            key: 'valorUnitario',
            header: 'Valor Unit.',
            width: '120px',
            render: (item: ProdutoXML) => formatMoney(item.valorUnitario),
        },
        {
            key: 'valorTotal',
            header: 'Total',
            width: '120px',
            render: (item: ProdutoXML) => (
                <span style={{ fontWeight: 600 }}>{formatMoney(item.valorTotal)}</span>
            ),
        },
    ];

    return (
        <>
            <Header
                title="Importar XML"
                subtitle="Importe NFe para cadastrar produtos e dar entrada no estoque"
            />

            <div className="page-content">
                {showSuccess && (
                    <div className="mb-lg">
                        <Alert type="success">
                            {showSuccess}
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

                {/* Upload */}
                {!dadosNFe && (
                    <Card>
                        <div
                            style={{
                                border: '2px dashed var(--gray-300)',
                                borderRadius: 'var(--radius-lg)',
                                padding: '3rem',
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.currentTarget.style.borderColor = 'var(--primary-500)';
                                e.currentTarget.style.backgroundColor = 'var(--primary-50)';
                            }}
                            onDragLeave={(e) => {
                                e.currentTarget.style.borderColor = 'var(--gray-300)';
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.currentTarget.style.borderColor = 'var(--gray-300)';
                                e.currentTarget.style.backgroundColor = 'transparent';
                                const file = e.dataTransfer.files[0];
                                if (file && fileInputRef.current) {
                                    const dt = new DataTransfer();
                                    dt.items.add(file);
                                    fileInputRef.current.files = dt.files;
                                    handleFileSelect({ target: { files: dt.files } } as any);
                                }
                            }}
                        >
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                {loading ? 'Processando...' : 'Clique ou arraste o arquivo XML aqui'}
                            </div>
                            <div className="text-muted">
                                Selecione um arquivo XML de NF-e para importar
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xml"
                                style={{ display: 'none' }}
                                onChange={handleFileSelect}
                            />
                        </div>
                    </Card>
                )}

                {/* Dados da NF-e */}
                {dadosNFe && (
                    <>
                        <Alert type="success">
                            <strong>XML processado com sucesso!</strong> Revise os itens abaixo antes de confirmar a importação.
                        </Alert>

                        <Card title="Dados da Nota Fiscal">
                            <div className="grid grid-cols-4">
                                <div>
                                    <div className="text-sm text-muted">Número da NFe</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                                        {dadosNFe.numero}/{dadosNFe.serie}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-muted">Fornecedor</div>
                                    <div style={{ fontWeight: 600 }}>{dadosNFe.fornecedorNome}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-muted">Data de Emissão</div>
                                    <div>{formatDate(dadosNFe.dataEmissao)}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-muted">Valor Total</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success-600)' }}>
                                        {formatMoney(dadosNFe.valorTotal)}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Legenda */}
                        <div className="flex gap-lg mb-md" style={{ fontSize: '0.875rem' }}>
                            <span>🆕 Novo produto (será cadastrado)</span>
                            <span>✅ Produto existente (atualiza estoque)</span>
                        </div>

                        {/* Produtos */}
                        <Card title={`📦 Produtos (${dadosNFe.produtos.length})`} noPadding>
                            <DataTable
                                columns={produtosColumns}
                                data={dadosNFe.produtos}
                                keyExtractor={(item) => item.codigo}
                            />
                        </Card>

                        {/* Resumo */}
                        <Card>
                            <div className="grid grid-cols-3">
                                <div>
                                    <strong>Produtos novos:</strong>{' '}
                                    {dadosNFe.produtos.filter(p => !p.existente).length}
                                </div>
                                <div>
                                    <strong>Produtos existentes:</strong>{' '}
                                    {dadosNFe.produtos.filter(p => p.existente).length}
                                </div>
                                <div>
                                    <strong>Conta a pagar:</strong>{' '}
                                    {formatMoney(dadosNFe.valorTotal)} (venc. 30 dias)
                                </div>
                            </div>
                        </Card>

                        {/* Botões */}
                        <div className="flex gap-md" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <button
                                className="btn btn-secondary"
                                onClick={() => {
                                    setDadosNFe(null);
                                    setXmlContent('');
                                    if (fileInputRef.current) {
                                        fileInputRef.current.value = '';
                                    }
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleImportar}
                                disabled={processando}
                            >
                                {processando ? 'Importando...' : '✓ Confirmar Importação'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
