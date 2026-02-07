'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Card, SearchInput, DataTable, Modal, Alert } from '@/components/ui';
import { Input, Select, FormRow, Textarea } from '@/components/ui';
import Link from 'next/link';
import type { Veiculo, Cliente } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { getUserEmpresaId } from '@/lib/supabase/helpers';

interface VeiculoForm {
    cliente_id: string;
    placa: string;
    marca: string;
    modelo: string;
    ano_fabricacao: string;
    ano_modelo: string;
    cor: string;
    chassi: string;
    renavam: string;
    km_atual: string;
    combustivel: string;
    observacoes: string;
}

const initialFormState: VeiculoForm = {
    cliente_id: '',
    placa: '',
    marca: '',
    modelo: '',
    ano_fabricacao: '',
    ano_modelo: '',
    cor: '',
    chassi: '',
    renavam: '',
    km_atual: '',
    combustivel: 'Flex',
    observacoes: '',
};

type VeiculoComCliente = Veiculo & { cliente_nome?: string };

export default function VeiculosPage() {
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState('');
    const [veiculos, setVeiculos] = useState<VeiculoComCliente[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<VeiculoForm>(initialFormState);
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

        async function loadData() {
            setLoading(true);
            try {
                // Carregar veículos com nome do cliente
                const { data: veiculosData, error: veiculosError } = await supabase
                    .from('veiculos')
                    .select(`*, cliente:clientes(nome)`)
                    .eq('empresa_id', empresaId)
                    .order('placa');

                if (veiculosError) {
                    console.error('Erro ao carregar veículos:', veiculosError);
                    setShowError('Erro ao carregar veículos: ' + veiculosError.message);
                } else {
                    const veiculosFormatados = (veiculosData || []).map((v: any) => ({
                        ...v,
                        cliente_nome: v.cliente?.nome || 'Cliente não encontrado'
                    }));
                    setVeiculos(veiculosFormatados);
                }

                // Carregar clientes para o select
                const { data: clientesData } = await supabase
                    .from('clientes')
                    .select('id, nome')
                    .order('nome');
                setClientes((clientesData as any) || []);

            } catch (err) {
                console.error('Erro:', err);
                setShowError('Erro ao conectar com o banco de dados');
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, []);

    const handleInputChange = (field: keyof VeiculoForm, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!form.cliente_id) {
            setShowError('Selecione um cliente');
            return;
        }
        if (!form.placa.trim()) {
            setShowError('A placa é obrigatória');
            return;
        }

        setSaving(true);
        setShowError('');

        try {
            const { data, error } = await supabase
                .from('veiculos')
                .insert({
                    empresa_id: empresaId,
                    cliente_id: form.cliente_id,
                    placa: form.placa.toUpperCase(),
                    marca: form.marca || null,
                    modelo: form.modelo || null,
                    ano_fabricacao: form.ano_fabricacao ? parseInt(form.ano_fabricacao) : null,
                    ano_modelo: form.ano_modelo ? parseInt(form.ano_modelo) : null,
                    cor: form.cor || null,
                    chassi: form.chassi || null,
                    renavam: form.renavam || null,
                    km_atual: form.km_atual ? parseInt(form.km_atual) : 0,
                    combustivel: form.combustivel || null,
                    observacoes: form.observacoes || null,
                    ativo: true,
                })
                .select(`*, clientes(nome)`)
                .single();

            if (error) {
                console.error('Erro ao salvar:', error);
                setShowError('Erro ao salvar veículo: ' + error.message);
            } else {
                const novoVeiculo = {
                    ...data,
                    cliente_nome: data.clientes?.nome || ''
                };
                setVeiculos(prev => [...prev, novoVeiculo]);
                setShowModal(false);
                setShowSuccess(true);
                setForm(initialFormState);
                setTimeout(() => setShowSuccess(false), 3000);
            }
        } catch (err) {
            console.error('Erro:', err);
            setShowError('Erro ao salvar veículo');
        } finally {
            setSaving(false);
        }
    };

    const filteredVeiculos = veiculos.filter(
        (v) =>
            v.placa.toLowerCase().includes(search.toLowerCase()) ||
            v.modelo?.toLowerCase().includes(search.toLowerCase()) ||
            v.cliente_nome?.toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        {
            key: 'veiculo',
            header: 'Veículo',
            render: (item: VeiculoComCliente) => (
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
            render: (item: VeiculoComCliente) => (
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
            render: (item: VeiculoComCliente) => (
                <Link href={`/clientes/${item.cliente_id}`} className="action-link">
                    {item.cliente_nome}
                </Link>
            ),
        },
        {
            key: 'km',
            header: 'KM Atual',
            render: (item: VeiculoComCliente) =>
                (item.km_atual || 0).toLocaleString('pt-BR') + ' km',
        },
        {
            key: 'acoes',
            header: '',
            width: '100px',
            render: (item: VeiculoComCliente) => (
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

                {showError && (
                    <div className="mb-lg">
                        <Alert type="error" onClose={() => setShowError('')}>
                            {showError}
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
                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center' }}>
                            Carregando veículos...
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={filteredVeiculos}
                            keyExtractor={(item) => item.id}
                            emptyMessage="Nenhum veículo encontrado. Cadastre um cliente primeiro, depois adicione veículos."
                        />
                    )}
                </Card>
            </div>

            <Modal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setForm(initialFormState); setShowError(''); }}
                title="Novo Veículo"
                size="lg"
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => { setShowModal(false); setForm(initialFormState); }}>
                            Cancelar
                        </button>
                        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                            {saving ? 'Salvando...' : 'Salvar Veículo'}
                        </button>
                    </>
                }
            >
                {showError && (
                    <div className="mb-md">
                        <Alert type="error" onClose={() => setShowError('')}>{showError}</Alert>
                    </div>
                )}

                <Select
                    label="Cliente / Proprietário"
                    required
                    value={form.cliente_id}
                    onChange={(e) => handleInputChange('cliente_id', e.target.value)}
                    options={[
                        { value: '', label: 'Selecione um cliente...' },
                        ...clientes.map(c => ({ value: c.id, label: c.nome }))
                    ]}
                />

                <div className="divider"></div>
                <h4 className="mb-md">Dados do Veículo</h4>

                <FormRow>
                    <Input
                        label="Placa"
                        required
                        placeholder="ABC-1234"
                        value={form.placa}
                        onChange={(e) => handleInputChange('placa', e.target.value)}
                    />
                    <Select
                        label="Combustível"
                        value={form.combustivel}
                        onChange={(e) => handleInputChange('combustivel', e.target.value)}
                        options={[
                            { value: 'Flex', label: 'Flex' },
                            { value: 'Gasolina', label: 'Gasolina' },
                            { value: 'Etanol', label: 'Etanol' },
                            { value: 'Diesel', label: 'Diesel' },
                            { value: 'GNV', label: 'GNV' },
                            { value: 'Elétrico', label: 'Elétrico' },
                            { value: 'Híbrido', label: 'Híbrido' },
                        ]}
                    />
                </FormRow>

                <FormRow>
                    <Input
                        label="Marca"
                        placeholder="Ex: Fiat, VW, Honda..."
                        value={form.marca}
                        onChange={(e) => handleInputChange('marca', e.target.value)}
                    />
                    <Input
                        label="Modelo"
                        placeholder="Ex: Uno, Gol, Civic..."
                        value={form.modelo}
                        onChange={(e) => handleInputChange('modelo', e.target.value)}
                    />
                </FormRow>

                <FormRow>
                    <Input
                        label="Ano Fabricação"
                        type="number"
                        placeholder="2020"
                        value={form.ano_fabricacao}
                        onChange={(e) => handleInputChange('ano_fabricacao', e.target.value)}
                    />
                    <Input
                        label="Ano Modelo"
                        type="number"
                        placeholder="2021"
                        value={form.ano_modelo}
                        onChange={(e) => handleInputChange('ano_modelo', e.target.value)}
                    />
                    <Input
                        label="Cor"
                        placeholder="Branco, Prata..."
                        value={form.cor}
                        onChange={(e) => handleInputChange('cor', e.target.value)}
                    />
                </FormRow>

                <FormRow>
                    <Input
                        label="KM Atual"
                        type="number"
                        placeholder="0"
                        value={form.km_atual}
                        onChange={(e) => handleInputChange('km_atual', e.target.value)}
                    />
                    <Input
                        label="Renavam"
                        placeholder="00000000000"
                        value={form.renavam}
                        onChange={(e) => handleInputChange('renavam', e.target.value)}
                    />
                </FormRow>

                <Input
                    label="Chassi"
                    placeholder="Número do chassi"
                    value={form.chassi}
                    onChange={(e) => handleInputChange('chassi', e.target.value)}
                />

                <Textarea
                    label="Observações"
                    placeholder="Observações sobre o veículo..."
                    rows={2}
                    value={form.observacoes}
                    onChange={(e) => handleInputChange('observacoes', e.target.value)}
                />
            </Modal>
        </>
    );
}
