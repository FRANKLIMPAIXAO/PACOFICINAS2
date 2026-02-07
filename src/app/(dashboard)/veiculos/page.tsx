'use client';

import { useState } from 'react';
import { Header } from '@/components/layout';
import { Card, SearchInput, DataTable, Modal, Alert } from '@/components/ui';
import { Input, Select, FormRow } from '@/components/ui';
import Link from 'next/link';
import type { Veiculo } from '@/types';

// Mock data
const mockVeiculos: (Veiculo & { cliente_nome: string })[] = [
    {
        id: '1',
        empresa_id: '1',
        cliente_id: '1',
        cliente_nome: 'João Silva',
        placa: 'ABC-1234',
        marca: 'Fiat',
        modelo: 'Uno',
        ano_fabricacao: 2018,
        ano_modelo: 2019,
        cor: 'Branco',
        chassi: null,
        renavam: null,
        km_atual: 85000,
        combustivel: 'Flex',
        observacoes: null,
        ativo: true,
        created_at: '2024-01-15',
        updated_at: '2024-01-15',
    },
    {
        id: '2',
        empresa_id: '1',
        cliente_id: '2',
        cliente_nome: 'Maria Santos',
        placa: 'XYZ-5678',
        marca: 'Volkswagen',
        modelo: 'Gol',
        ano_fabricacao: 2020,
        ano_modelo: 2020,
        cor: 'Prata',
        chassi: null,
        renavam: null,
        km_atual: 45000,
        combustivel: 'Flex',
        observacoes: null,
        ativo: true,
        created_at: '2024-01-20',
        updated_at: '2024-01-20',
    },
    {
        id: '3',
        empresa_id: '1',
        cliente_id: '1',
        cliente_nome: 'João Silva',
        placa: 'DEF-9012',
        marca: 'Honda',
        modelo: 'Civic',
        ano_fabricacao: 2021,
        ano_modelo: 2022,
        cor: 'Preto',
        chassi: '9BWZZZ377VT004251',
        renavam: '00123456789',
        km_atual: 32000,
        combustivel: 'Flex',
        observacoes: 'Carro novo, cliente exigente',
        ativo: true,
        created_at: '2024-02-01',
        updated_at: '2024-02-01',
    },
];

export default function VeiculosPage() {
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [veiculos] = useState(mockVeiculos);

    const filteredVeiculos = veiculos.filter(
        (v) =>
            v.placa.toLowerCase().includes(search.toLowerCase()) ||
            v.modelo?.toLowerCase().includes(search.toLowerCase()) ||
            v.cliente_nome.toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        {
            key: 'veiculo',
            header: 'Veículo',
            render: (item: typeof mockVeiculos[0]) => (
                <div>
                    <div style={{ fontWeight: 500 }}>
                        {item.marca} {item.modelo}
                    </div>
                    <div className="text-sm text-muted">
                        {item.ano_fabricacao}/{item.ano_modelo} • {item.cor}
                    </div>
                </div>
            ),
        },
        {
            key: 'placa',
            header: 'Placa',
            render: (item: typeof mockVeiculos[0]) => (
                <span
                    style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        background: 'var(--gray-100)',
                        padding: '0.25rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                    }}
                >
                    {item.placa}
                </span>
            ),
        },
        {
            key: 'cliente',
            header: 'Proprietário',
            render: (item: typeof mockVeiculos[0]) => (
                <Link href={`/clientes/${item.cliente_id}`} className="action-link">
                    {item.cliente_nome}
                </Link>
            ),
        },
        {
            key: 'km',
            header: 'KM Atual',
            render: (item: typeof mockVeiculos[0]) =>
                item.km_atual?.toLocaleString('pt-BR') + ' km',
        },
        {
            key: 'acoes',
            header: '',
            width: '100px',
            render: (item: typeof mockVeiculos[0]) => (
                <div className="flex gap-sm">
                    <Link href={`/veiculos/${item.id}`} className="btn btn-ghost btn-sm">
                        ✏️
                    </Link>
                    <Link href={`/os/nova?veiculo=${item.id}`} className="btn btn-ghost btn-sm" title="Nova OS">
                        🔧
                    </Link>
                </div>
            ),
        },
    ];

    return (
        <>
            <Header title="Veículos" subtitle="Gerencie os veículos dos clientes" />

            <div className="page-content">
                {showSuccess && (
                    <div className="mb-lg">
                        <Alert type="success" onClose={() => setShowSuccess(false)}>
                            Veículo salvo com sucesso!
                        </Alert>
                    </div>
                )}

                <div className="page-header">
                    <SearchInput
                        value={search}
                        onChange={setSearch}
                        placeholder="Buscar por placa, modelo ou proprietário..."
                    />
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        ➕ Novo Veículo
                    </button>
                </div>

                <Card noPadding>
                    <DataTable
                        columns={columns}
                        data={filteredVeiculos}
                        keyExtractor={(item) => item.id}
                        emptyMessage="Nenhum veículo encontrado"
                    />
                </Card>
            </div>

            {/* Modal Novo Veículo */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Novo Veículo"
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
                            Salvar Veículo
                        </button>
                    </>
                }
            >
                <Select
                    label="Cliente / Proprietário"
                    required
                    options={[
                        { value: '1', label: 'João Silva' },
                        { value: '2', label: 'Maria Santos' },
                        { value: '3', label: 'Auto Peças Centro Ltda' },
                    ]}
                />

                <div className="divider"></div>

                <h4 className="mb-md">Dados do Veículo</h4>

                <FormRow>
                    <Input label="Placa" required placeholder="ABC-1234" />
                    <Select
                        label="Combustível"
                        options={[
                            { value: 'flex', label: 'Flex' },
                            { value: 'gasolina', label: 'Gasolina' },
                            { value: 'etanol', label: 'Etanol' },
                            { value: 'diesel', label: 'Diesel' },
                            { value: 'gnv', label: 'GNV' },
                            { value: 'eletrico', label: 'Elétrico' },
                            { value: 'hibrido', label: 'Híbrido' },
                        ]}
                    />
                </FormRow>

                <FormRow>
                    <Input label="Marca" placeholder="Ex: Fiat, VW, Honda..." />
                    <Input label="Modelo" placeholder="Ex: Uno, Gol, Civic..." />
                </FormRow>

                <FormRow>
                    <Input label="Ano Fabricação" type="number" placeholder="2020" />
                    <Input label="Ano Modelo" type="number" placeholder="2021" />
                    <Input label="Cor" placeholder="Branco, Prata..." />
                </FormRow>

                <FormRow>
                    <Input label="KM Atual" type="number" placeholder="0" />
                    <Input label="Renavam" placeholder="00000000000" />
                </FormRow>

                <Input label="Chassi" placeholder="Número do chassi" />
            </Modal>
        </>
    );
}
