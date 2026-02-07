'use client';

import { useState } from 'react';
import { Header } from '@/components/layout';
import { Card, EmptyState, StatusBadge, SearchInput, DataTable, Modal, Alert } from '@/components/ui';
import { Input, Select, Textarea, FormRow } from '@/components/ui';
import Link from 'next/link';
import type { Cliente } from '@/types';

// Mock data
const mockClientes: Cliente[] = [
    {
        id: '1',
        empresa_id: '1',
        nome: 'João Silva',
        cpf_cnpj: '123.456.789-00',
        telefone: '(11) 99999-1234',
        telefone2: null,
        email: 'joao@email.com',
        cep: '01234-567',
        logradouro: 'Rua das Flores',
        numero: '123',
        complemento: 'Apto 45',
        bairro: 'Centro',
        cidade: 'São Paulo',
        uf: 'SP',
        observacoes: null,
        ativo: true,
        created_at: '2024-01-15',
        updated_at: '2024-01-15',
    },
    {
        id: '2',
        empresa_id: '1',
        nome: 'Maria Santos',
        cpf_cnpj: '987.654.321-00',
        telefone: '(11) 98888-5678',
        telefone2: null,
        email: 'maria@email.com',
        cep: null,
        logradouro: null,
        numero: null,
        complemento: null,
        bairro: null,
        cidade: 'São Paulo',
        uf: 'SP',
        observacoes: 'Cliente VIP',
        ativo: true,
        created_at: '2024-01-20',
        updated_at: '2024-01-20',
    },
    {
        id: '3',
        empresa_id: '1',
        nome: 'Auto Peças Centro Ltda',
        cpf_cnpj: '12.345.678/0001-90',
        telefone: '(11) 3333-4444',
        telefone2: '(11) 3333-4445',
        email: 'contato@autopecascentro.com.br',
        cep: '01310-100',
        logradouro: 'Av. Paulista',
        numero: '1000',
        complemento: 'Sala 501',
        bairro: 'Bela Vista',
        cidade: 'São Paulo',
        uf: 'SP',
        observacoes: null,
        ativo: true,
        created_at: '2024-02-01',
        updated_at: '2024-02-01',
    },
];

export default function ClientesPage() {
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [clientes] = useState<Cliente[]>(mockClientes);

    const filteredClientes = clientes.filter((c) =>
        c.nome.toLowerCase().includes(search.toLowerCase()) ||
        c.cpf_cnpj?.includes(search) ||
        c.telefone?.includes(search)
    );

    const columns = [
        {
            key: 'nome',
            header: 'Cliente',
            render: (item: Cliente) => (
                <div>
                    <Link href={`/clientes/${item.id}`} className="action-link" style={{ fontWeight: 500 }}>
                        {item.nome}
                    </Link>
                    <div className="text-sm text-muted">{item.cpf_cnpj}</div>
                </div>
            ),
        },
        {
            key: 'telefone',
            header: 'Telefone',
            render: (item: Cliente) => item.telefone || '-',
        },
        {
            key: 'email',
            header: 'E-mail',
            render: (item: Cliente) => item.email || '-',
        },
        {
            key: 'cidade',
            header: 'Cidade',
            render: (item: Cliente) => (item.cidade ? `${item.cidade}/${item.uf}` : '-'),
        },
        {
            key: 'acoes',
            header: '',
            width: '100px',
            render: (item: Cliente) => (
                <div className="flex gap-sm">
                    <Link href={`/clientes/${item.id}`} className="btn btn-ghost btn-sm">
                        ✏️
                    </Link>
                    <Link href={`/clientes/${item.id}/veiculos`} className="btn btn-ghost btn-sm" title="Ver veículos">
                        🚗
                    </Link>
                </div>
            ),
        },
    ];

    return (
        <>
            <Header title="Clientes" subtitle="Gerencie seus clientes" />

            <div className="page-content">
                {showSuccess && (
                    <div className="mb-lg">
                        <Alert type="success" onClose={() => setShowSuccess(false)}>
                            Cliente salvo com sucesso!
                        </Alert>
                    </div>
                )}

                <div className="page-header">
                    <SearchInput
                        value={search}
                        onChange={setSearch}
                        placeholder="Buscar por nome, CPF/CNPJ ou telefone..."
                    />
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        ➕ Novo Cliente
                    </button>
                </div>

                <Card noPadding>
                    <DataTable
                        columns={columns}
                        data={filteredClientes}
                        keyExtractor={(item) => item.id}
                        emptyMessage="Nenhum cliente encontrado"
                    />
                </Card>
            </div>

            {/* Modal Novo Cliente */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Novo Cliente"
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
                            Salvar Cliente
                        </button>
                    </>
                }
            >
                <FormRow>
                    <Input label="Nome / Razão Social" required placeholder="Nome completo ou razão social" />
                    <Input label="CPF / CNPJ" placeholder="000.000.000-00" />
                </FormRow>

                <FormRow>
                    <Input label="Telefone" placeholder="(00) 00000-0000" />
                    <Input label="Telefone 2" placeholder="(00) 00000-0000" />
                </FormRow>

                <Input label="E-mail" type="email" placeholder="email@exemplo.com" />

                <div className="divider"></div>

                <h4 className="mb-md">Endereço</h4>

                <FormRow>
                    <Input label="CEP" placeholder="00000-000" style={{ maxWidth: '150px' }} />
                    <Input label="Logradouro" placeholder="Rua, Avenida..." />
                </FormRow>

                <FormRow>
                    <Input label="Número" placeholder="123" style={{ maxWidth: '100px' }} />
                    <Input label="Complemento" placeholder="Apto, Sala..." />
                    <Input label="Bairro" placeholder="Bairro" />
                </FormRow>

                <FormRow>
                    <Input label="Cidade" placeholder="Cidade" />
                    <Select
                        label="Estado"
                        options={[
                            { value: 'SP', label: 'São Paulo' },
                            { value: 'RJ', label: 'Rio de Janeiro' },
                            { value: 'MG', label: 'Minas Gerais' },
                            { value: 'PR', label: 'Paraná' },
                            { value: 'SC', label: 'Santa Catarina' },
                            { value: 'RS', label: 'Rio Grande do Sul' },
                        ]}
                    />
                </FormRow>

                <Textarea label="Observações" placeholder="Anotações sobre o cliente..." rows={3} />
            </Modal>
        </>
    );
}
