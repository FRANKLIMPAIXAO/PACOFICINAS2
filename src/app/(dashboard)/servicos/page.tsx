'use client';

import { useState } from 'react';
import { Header } from '@/components/layout';
import { Card, SearchInput, DataTable, Modal, Alert } from '@/components/ui';
import { Input, FormRow, MoneyInput, Textarea } from '@/components/ui';
import type { Servico } from '@/types';

// Mock data
const mockServicos: Servico[] = [
    {
        id: '1',
        empresa_id: '1',
        codigo: 'SV001',
        descricao: 'Troca de Óleo',
        codigo_servico: '14.01',
        aliquota_iss: 5.00,
        preco: 80.00,
        tempo_estimado: 30,
        ativo: true,
        created_at: '2024-01-10',
        updated_at: '2024-01-10',
    },
    {
        id: '2',
        empresa_id: '1',
        codigo: 'SV002',
        descricao: 'Alinhamento e Balanceamento',
        codigo_servico: '14.01',
        aliquota_iss: 5.00,
        preco: 120.00,
        tempo_estimado: 60,
        ativo: true,
        created_at: '2024-01-10',
        updated_at: '2024-01-10',
    },
    {
        id: '3',
        empresa_id: '1',
        codigo: 'SV003',
        descricao: 'Troca de Pastilhas de Freio (Dianteira)',
        codigo_servico: '14.01',
        aliquota_iss: 5.00,
        preco: 150.00,
        tempo_estimado: 45,
        ativo: true,
        created_at: '2024-01-12',
        updated_at: '2024-01-12',
    },
    {
        id: '4',
        empresa_id: '1',
        codigo: 'SV004',
        descricao: 'Revisão Completa',
        codigo_servico: '14.01',
        aliquota_iss: 5.00,
        preco: 350.00,
        tempo_estimado: 180,
        ativo: true,
        created_at: '2024-01-15',
        updated_at: '2024-01-15',
    },
    {
        id: '5',
        empresa_id: '1',
        codigo: 'SV005',
        descricao: 'Diagnóstico Eletrônico',
        codigo_servico: '14.01',
        aliquota_iss: 5.00,
        preco: 100.00,
        tempo_estimado: 30,
        ativo: true,
        created_at: '2024-01-18',
        updated_at: '2024-01-18',
    },
];

export default function ServicosPage() {
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [servicos] = useState<Servico[]>(mockServicos);
    const [preco, setPreco] = useState(0);

    const filteredServicos = servicos.filter(
        (s) =>
            s.descricao.toLowerCase().includes(search.toLowerCase()) ||
            s.codigo?.toLowerCase().includes(search.toLowerCase())
    );

    const formatMoney = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const formatTempo = (minutos: number | null) => {
        if (!minutos) return '-';
        if (minutos < 60) return `${minutos} min`;
        const horas = Math.floor(minutos / 60);
        const mins = minutos % 60;
        return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
    };

    const columns = [
        {
            key: 'codigo',
            header: 'Código',
            width: '100px',
            render: (item: Servico) => (
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
                    {item.codigo || '-'}
                </span>
            ),
        },
        {
            key: 'descricao',
            header: 'Descrição',
            render: (item: Servico) => (
                <div style={{ fontWeight: 500 }}>{item.descricao}</div>
            ),
        },
        {
            key: 'tempo',
            header: 'Tempo Est.',
            width: '110px',
            render: (item: Servico) => formatTempo(item.tempo_estimado),
        },
        {
            key: 'preco',
            header: 'Preço',
            width: '120px',
            render: (item: Servico) => (
                <span style={{ fontWeight: 600, color: 'var(--success-600)' }}>
                    {formatMoney(item.preco)}
                </span>
            ),
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
            <Header title="Serviços" subtitle="Gerencie os serviços oferecidos" />

            <div className="page-content">
                {showSuccess && (
                    <div className="mb-lg">
                        <Alert type="success" onClose={() => setShowSuccess(false)}>
                            Serviço salvo com sucesso!
                        </Alert>
                    </div>
                )}

                <div className="page-header">
                    <SearchInput
                        value={search}
                        onChange={setSearch}
                        placeholder="Buscar por código ou descrição..."
                    />
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        ➕ Novo Serviço
                    </button>
                </div>

                <Card noPadding>
                    <DataTable
                        columns={columns}
                        data={filteredServicos}
                        keyExtractor={(item) => item.id}
                        emptyMessage="Nenhum serviço encontrado"
                    />
                </Card>
            </div>

            {/* Modal Novo Serviço */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Novo Serviço"
                size="md"
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
                            Salvar Serviço
                        </button>
                    </>
                }
            >
                <FormRow>
                    <Input label="Código" placeholder="Ex: SV001" />
                    <Input label="Tempo Estimado (min)" type="number" placeholder="30" />
                </FormRow>

                <Input label="Descrição" required placeholder="Nome do serviço" />

                <MoneyInput label="Preço" value={preco} onChange={setPreco} />

                <div className="divider"></div>
                <h4 className="mb-md">Dados Fiscais (NFS-e)</h4>

                <FormRow>
                    <Input label="Código do Serviço" placeholder="Ex: 14.01" />
                    <Input label="Alíquota ISS (%)" type="number" placeholder="5.00" />
                </FormRow>

                <Textarea
                    label="Descrição para NFS-e"
                    placeholder="Descrição detalhada do serviço para nota fiscal..."
                    rows={3}
                />
            </Modal>
        </>
    );
}
