'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Card, SearchInput, DataTable, Modal, Alert } from '@/components/ui';
import { Input, Select, Textarea, FormRow } from '@/components/ui';
import Link from 'next/link';
import type { Cliente } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { getUserEmpresaId } from '@/lib/supabase/helpers';

interface ClienteForm {
    nome: string;
    cpf_cnpj: string;
    telefone: string;
    telefone2: string;
    email: string;
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    uf: string;
    observacoes: string;
}

const initialFormState: ClienteForm = {
    nome: '',
    cpf_cnpj: '',
    telefone: '',
    telefone2: '',
    email: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: 'SP',
    observacoes: '',
};

export default function ClientesPage() {
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState('');
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<ClienteForm>(initialFormState);
    const [empresaId, setEmpresaId] = useState<string | null>(null);

    const supabase = createClient();

    // Carregar empresa_id do usuário
    useEffect(() => {
        async function loadEmpresaId() {
            const id = await getUserEmpresaId();
            setEmpresaId(id);
        }
        loadEmpresaId();
    }, []);

    // Carregar clientes do Supabase
    useEffect(() => {
        if (!empresaId) return;

        async function loadClientes() {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('clientes')
                    .select('*')
                    .eq('empresa_id', empresaId)
                    .order('nome');

                if (error) {
                    console.error('Erro ao carregar clientes:', error);
                    setShowError('Erro ao carregar clientes: ' + error.message);
                } else {
                    setClientes(data || []);
                }
            } catch (err) {
                console.error('Erro:', err);
                setShowError('Erro ao conectar com o banco de dados');
            } finally {
                setLoading(false);
            }
        }

        loadClientes();
    }, [empresaId]);

    // Atualizar campo do formulário
    const handleInputChange = (field: keyof ClienteForm, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    // Salvar cliente no Supabase
    const handleSave = async () => {
        if (!empresaId) {
            setShowError('Erro: Empresa não identificada');
            return;
        }

        if (!form.nome.trim()) {
            setShowError('O nome é obrigatório');
            return;
        }

        setSaving(true);
        setShowError('');

        try {
            const { data, error } = await supabase
                .from('clientes')
                .insert({
                    empresa_id: empresaId,
                    nome: form.nome,
                    cpf_cnpj: form.cpf_cnpj || null,
                    telefone: form.telefone || null,
                    telefone2: form.telefone2 || null,
                    email: form.email || null,
                    cep: form.cep || null,
                    logradouro: form.logradouro || null,
                    numero: form.numero || null,
                    complemento: form.complemento || null,
                    bairro: form.bairro || null,
                    cidade: form.cidade || null,
                    uf: form.uf || null,
                    observacoes: form.observacoes || null,
                    ativo: true,
                })
                .select()
                .single();

            if (error) {
                console.error('Erro ao salvar:', error);
                setShowError('Erro ao salvar cliente: ' + error.message);
            } else {
                // Adicionar novo cliente à lista
                setClientes(prev => [...prev, data]);
                setShowModal(false);
                setShowSuccess(true);
                setForm(initialFormState);

                // Esconder mensagem de sucesso após 3 segundos
                setTimeout(() => setShowSuccess(false), 3000);
            }
        } catch (err) {
            console.error('Erro:', err);
            setShowError('Erro ao salvar cliente');
        } finally {
            setSaving(false);
        }
    };

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
                    <Link href={`/clientes/${item.id}`} className="btn btn-primary btn-sm" title="Ver histórico">
                        📋 Histórico
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
                        placeholder="Buscar por nome, CPF/CNPJ ou telefone..."
                    />
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        ➕ Novo Cliente
                    </button>
                </div>

                <Card noPadding>
                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center' }}>
                            Carregando clientes...
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={filteredClientes}
                            keyExtractor={(item) => item.id}
                            emptyMessage="Nenhum cliente encontrado. Clique em 'Novo Cliente' para cadastrar o primeiro."
                        />
                    )}
                </Card>
            </div>

            {/* Modal Novo Cliente */}
            <Modal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setForm(initialFormState); setShowError(''); }}
                title="Novo Cliente"
                size="lg"
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => { setShowModal(false); setForm(initialFormState); }}>
                            Cancelar
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? 'Salvando...' : 'Salvar Cliente'}
                        </button>
                    </>
                }
            >
                {showError && (
                    <div className="mb-md">
                        <Alert type="error" onClose={() => setShowError('')}>
                            {showError}
                        </Alert>
                    </div>
                )}

                <FormRow>
                    <Input
                        label="Nome / Razão Social"
                        required
                        placeholder="Nome completo ou razão social"
                        value={form.nome}
                        onChange={(e) => handleInputChange('nome', e.target.value)}
                    />
                    <Input
                        label="CPF / CNPJ"
                        placeholder="000.000.000-00"
                        value={form.cpf_cnpj}
                        onChange={(e) => handleInputChange('cpf_cnpj', e.target.value)}
                    />
                </FormRow>

                <FormRow>
                    <Input
                        label="Telefone"
                        placeholder="(00) 00000-0000"
                        value={form.telefone}
                        onChange={(e) => handleInputChange('telefone', e.target.value)}
                    />
                    <Input
                        label="Telefone 2"
                        placeholder="(00) 00000-0000"
                        value={form.telefone2}
                        onChange={(e) => handleInputChange('telefone2', e.target.value)}
                    />
                </FormRow>

                <Input
                    label="E-mail"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={form.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                />

                <div className="divider"></div>

                <h4 className="mb-md">Endereço</h4>

                <FormRow>
                    <Input
                        label="CEP"
                        placeholder="00000-000"
                        style={{ maxWidth: '150px' }}
                        value={form.cep}
                        onChange={(e) => handleInputChange('cep', e.target.value)}
                    />
                    <Input
                        label="Logradouro"
                        placeholder="Rua, Avenida..."
                        value={form.logradouro}
                        onChange={(e) => handleInputChange('logradouro', e.target.value)}
                    />
                </FormRow>

                <FormRow>
                    <Input
                        label="Número"
                        placeholder="123"
                        style={{ maxWidth: '100px' }}
                        value={form.numero}
                        onChange={(e) => handleInputChange('numero', e.target.value)}
                    />
                    <Input
                        label="Complemento"
                        placeholder="Apto, Sala..."
                        value={form.complemento}
                        onChange={(e) => handleInputChange('complemento', e.target.value)}
                    />
                    <Input
                        label="Bairro"
                        placeholder="Bairro"
                        value={form.bairro}
                        onChange={(e) => handleInputChange('bairro', e.target.value)}
                    />
                </FormRow>

                <FormRow>
                    <Input
                        label="Cidade"
                        placeholder="Cidade"
                        value={form.cidade}
                        onChange={(e) => handleInputChange('cidade', e.target.value)}
                    />
                    <Select
                        label="Estado"
                        value={form.uf}
                        onChange={(e) => handleInputChange('uf', e.target.value)}
                        options={[
                            { value: 'AC', label: 'Acre' },
                            { value: 'AL', label: 'Alagoas' },
                            { value: 'AP', label: 'Amapá' },
                            { value: 'AM', label: 'Amazonas' },
                            { value: 'BA', label: 'Bahia' },
                            { value: 'CE', label: 'Ceará' },
                            { value: 'DF', label: 'Distrito Federal' },
                            { value: 'ES', label: 'Espírito Santo' },
                            { value: 'GO', label: 'Goiás' },
                            { value: 'MA', label: 'Maranhão' },
                            { value: 'MT', label: 'Mato Grosso' },
                            { value: 'MS', label: 'Mato Grosso do Sul' },
                            { value: 'MG', label: 'Minas Gerais' },
                            { value: 'PA', label: 'Pará' },
                            { value: 'PB', label: 'Paraíba' },
                            { value: 'PR', label: 'Paraná' },
                            { value: 'PE', label: 'Pernambuco' },
                            { value: 'PI', label: 'Piauí' },
                            { value: 'RJ', label: 'Rio de Janeiro' },
                            { value: 'RN', label: 'Rio Grande do Norte' },
                            { value: 'RS', label: 'Rio Grande do Sul' },
                            { value: 'RO', label: 'Rondônia' },
                            { value: 'RR', label: 'Roraima' },
                            { value: 'SC', label: 'Santa Catarina' },
                            { value: 'SP', label: 'São Paulo' },
                            { value: 'SE', label: 'Sergipe' },
                            { value: 'TO', label: 'Tocantins' },
                        ]}
                    />
                </FormRow>

                <Textarea
                    label="Observações"
                    placeholder="Anotações sobre o cliente..."
                    rows={3}
                    value={form.observacoes}
                    onChange={(e) => handleInputChange('observacoes', e.target.value)}
                />
            </Modal>
        </>
    );
}
