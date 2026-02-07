'use client';

import { useState, useRef } from 'react';
import { Header } from '@/components/layout';
import { Card, Alert, DataTable } from '@/components/ui';

interface ImportedProduct {
    codigo: string;
    descricao: string;
    ncm: string;
    quantidade: number;
    valor_unitario: number;
    valor_total: number;
    novo: boolean;
}

export default function XMLImportPage() {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        nfe: {
            numero: string;
            fornecedor: string;
            data: string;
            valor_total: number;
        };
        produtos: ImportedProduct[];
    } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile?.name.endsWith('.xml')) {
            setFile(droppedFile);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile?.name.endsWith('.xml')) {
            setFile(selectedFile);
        }
    };

    const processXML = async () => {
        setProcessing(true);

        // Simular processamento
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Mock result
        setResult({
            success: true,
            nfe: {
                numero: '000123456',
                fornecedor: 'Auto Peças Distribuidora Ltda',
                data: '05/02/2024',
                valor_total: 2850.00,
            },
            produtos: [
                {
                    codigo: 'OL001',
                    descricao: 'Óleo Motor 5W30 Sintético 1L',
                    ncm: '27101932',
                    quantidade: 20,
                    valor_unitario: 35.00,
                    valor_total: 700.00,
                    novo: false,
                },
                {
                    codigo: 'FI003',
                    descricao: 'Filtro de Combustível Flex',
                    ncm: '84212300',
                    quantidade: 10,
                    valor_unitario: 45.00,
                    valor_total: 450.00,
                    novo: true,
                },
                {
                    codigo: 'PA002',
                    descricao: 'Pastilha de Freio Traseira Civic',
                    ncm: '68132090',
                    quantidade: 8,
                    valor_unitario: 85.00,
                    valor_total: 680.00,
                    novo: true,
                },
                {
                    codigo: 'VE001',
                    descricao: 'Vela de Ignição NGK',
                    ncm: '85111000',
                    quantidade: 24,
                    valor_unitario: 22.00,
                    valor_total: 528.00,
                    novo: false,
                },
                {
                    codigo: 'CO001',
                    descricao: 'Correia Dentada Gates',
                    ncm: '40103100',
                    quantidade: 5,
                    valor_unitario: 98.40,
                    valor_total: 492.00,
                    novo: true,
                },
            ],
        });

        setProcessing(false);
    };

    const confirmImport = () => {
        // Aqui faria a importação real para o banco
        alert('Produtos importados com sucesso!');
        setFile(null);
        setResult(null);
    };

    const formatMoney = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const columns = [
        {
            key: 'status',
            header: '',
            width: '50px',
            render: (item: ImportedProduct) => (
                <span
                    title={item.novo ? 'Novo produto' : 'Produto existente'}
                    style={{ fontSize: '1.25rem' }}
                >
                    {item.novo ? '🆕' : '✅'}
                </span>
            ),
        },
        {
            key: 'codigo',
            header: 'Código',
            width: '100px',
            render: (item: ImportedProduct) => (
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
                    {item.codigo}
                </span>
            ),
        },
        {
            key: 'descricao',
            header: 'Descrição',
            render: (item: ImportedProduct) => (
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
            render: (item: ImportedProduct) => item.quantidade,
        },
        {
            key: 'valor_unitario',
            header: 'Valor Unit.',
            width: '120px',
            render: (item: ImportedProduct) => formatMoney(item.valor_unitario),
        },
        {
            key: 'valor_total',
            header: 'Total',
            width: '120px',
            render: (item: ImportedProduct) => (
                <span style={{ fontWeight: 600 }}>{formatMoney(item.valor_total)}</span>
            ),
        },
    ];

    return (
        <>
            <Header title="Importar XML" subtitle="Importe NFe para cadastrar produtos e dar entrada no estoque" />

            <div className="page-content">
                <Alert type="info">
                    <strong>Como funciona:</strong> Faça upload do XML de uma NFe de entrada. O sistema irá ler os produtos,
                    cadastrar novos itens automaticamente e dar entrada no estoque.
                </Alert>

                {!result ? (
                    <Card className="mt-lg">
                        {/* Upload Area */}
                        <div
                            className={`p-xl`}
                            style={{
                                border: `2px dashed ${isDragging ? 'var(--primary-500)' : 'var(--border)'}`,
                                borderRadius: 'var(--radius-lg)',
                                background: isDragging ? 'var(--primary-50)' : 'var(--gray-50)',
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'all var(--transition-fast)',
                            }}
                            onDragOver={(e) => {
                                e.preventDefault();
                                setIsDragging(true);
                            }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xml"
                                onChange={handleFileSelect}
                                style={{ display: 'none' }}
                            />

                            <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>
                                📄
                            </div>

                            {file ? (
                                <>
                                    <div style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>
                                        {file.name}
                                    </div>
                                    <div className="text-muted">
                                        {(file.size / 1024).toFixed(2)} KB
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div style={{ fontSize: '1.125rem', fontWeight: 500, marginBottom: 'var(--spacing-sm)' }}>
                                        Arraste o arquivo XML aqui
                                    </div>
                                    <div className="text-muted">
                                        ou clique para selecionar
                                    </div>
                                </>
                            )}
                        </div>

                        {file && (
                            <div className="flex justify-center mt-lg">
                                <button
                                    className="btn btn-primary btn-lg"
                                    onClick={processXML}
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <>
                                            <span className="spinner" style={{ width: 20, height: 20 }}></span>
                                            Processando...
                                        </>
                                    ) : (
                                        <>📥 Processar XML</>
                                    )}
                                </button>
                            </div>
                        )}
                    </Card>
                ) : (
                    <>
                        {/* Resultado do Processamento */}
                        <Card className="mt-lg">
                            <Alert type="success">
                                <strong>XML processado com sucesso!</strong> Revise os itens abaixo antes de confirmar a importação.
                            </Alert>

                            {/* Dados da NFe */}
                            <div
                                className="p-lg mt-lg"
                                style={{
                                    background: 'var(--gray-50)',
                                    borderRadius: 'var(--radius-md)',
                                }}
                            >
                                <div className="grid grid-cols-4" style={{ gap: 'var(--spacing-lg)' }}>
                                    <div>
                                        <div className="text-sm text-muted">Número da NFe</div>
                                        <div style={{ fontWeight: 600 }}>{result.nfe.numero}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted">Fornecedor</div>
                                        <div style={{ fontWeight: 600 }}>{result.nfe.fornecedor}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted">Data de Emissão</div>
                                        <div style={{ fontWeight: 600 }}>{result.nfe.data}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted">Valor Total</div>
                                        <div style={{ fontWeight: 600, color: 'var(--success-600)' }}>
                                            {formatMoney(result.nfe.valor_total)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Legenda */}
                            <div className="flex gap-lg mt-lg mb-md">
                                <div className="flex items-center gap-sm">
                                    <span>🆕</span>
                                    <span className="text-sm text-muted">Novo produto (será cadastrado)</span>
                                </div>
                                <div className="flex items-center gap-sm">
                                    <span>✅</span>
                                    <span className="text-sm text-muted">Produto existente (atualiza estoque)</span>
                                </div>
                            </div>

                            {/* Tabela de Produtos */}
                            <DataTable
                                columns={columns}
                                data={result.produtos}
                                keyExtractor={(item) => item.codigo}
                            />

                            {/* Resumo */}
                            <div className="flex justify-between items-center mt-lg p-md" style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                                <div>
                                    <span className="text-muted">Total de produtos: </span>
                                    <strong>{result.produtos.length}</strong>
                                    <span className="text-muted"> | Novos: </span>
                                    <strong style={{ color: 'var(--primary-600)' }}>
                                        {result.produtos.filter((p) => p.novo).length}
                                    </strong>
                                    <span className="text-muted"> | Existentes: </span>
                                    <strong>{result.produtos.filter((p) => !p.novo).length}</strong>
                                </div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                                    Total: {formatMoney(result.nfe.valor_total)}
                                </div>
                            </div>

                            {/* Ações */}
                            <div className="flex justify-end gap-md mt-lg">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setFile(null);
                                        setResult(null);
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button className="btn btn-success btn-lg" onClick={confirmImport}>
                                    ✓ Confirmar Importação
                                </button>
                            </div>
                        </Card>
                    </>
                )}

                {/* Histórico de Importações */}
                <Card title="📋 Últimas Importações" className="mt-lg">
                    <div className="table-wrapper" style={{ border: 'none' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>NFe</th>
                                    <th>Fornecedor</th>
                                    <th>Produtos</th>
                                    <th>Valor</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>04/02/2024 14:32</td>
                                    <td>000123455</td>
                                    <td>Distribuidora de Autopeças SP</td>
                                    <td>12 itens</td>
                                    <td>{formatMoney(4250.00)}</td>
                                </tr>
                                <tr>
                                    <td>01/02/2024 10:15</td>
                                    <td>000098765</td>
                                    <td>Auto Peças Central</td>
                                    <td>8 itens</td>
                                    <td>{formatMoney(1890.00)}</td>
                                </tr>
                                <tr>
                                    <td>28/01/2024 16:45</td>
                                    <td>000054321</td>
                                    <td>Mega Peças Atacado</td>
                                    <td>25 itens</td>
                                    <td>{formatMoney(7500.00)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </>
    );
}
