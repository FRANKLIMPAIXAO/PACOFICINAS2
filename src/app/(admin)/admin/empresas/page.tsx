'use client';

import { useState, useEffect } from 'react';
import { createCompany } from './actions';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout';
import { Card, Alert, DataTable } from '@/components/ui';
import { Input, FormRow } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';

interface Empresa {
    id: string;
    razao_social: string;
    nome_fantasia: string | null;
    cnpj: string;
    email: string | null;
    created_at: string;
}

export default function EmpresasPage() {
    const supabase = createClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [loadingEmpresas, setLoadingEmpresas] = useState(true);
    const router = useRouter();

    useEffect(() => {
        loadEmpresas();
    }, []);

    const loadEmpresas = async () => {
        setLoadingEmpresas(true);
        try {
            const { data, error } = await supabase
                .from('empresas')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setEmpresas(data || []);
        } catch (err: any) {
            console.error('Erro ao carregar empresas:', err);
        } finally {
            setLoadingEmpresas(false);
        }
    };

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setMessage('');

        const formData = new FormData(event.currentTarget);
        const result = await createCompany(formData);

        if (result.error) {
            setMessage('Erro: ' + result.error);
        } else {
            setMessage('Sucesso! Empresa e Admin criados.');
            setIsModalOpen(false);
            loadEmpresas();
        }
        setLoading(false);
    }

    const handleDeleteEmpresa = async (empresa: Empresa) => {
        if (!confirm(`Tem certeza que deseja excluir a empresa "${empresa.razao_social}"?\n\nISSO IRÁ EXCLUIR TODOS OS DADOS RELACIONADOS!`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from('empresas')
                .delete()
                .eq('id', empresa.id);

            if (error) throw error;

            setMessage('Empresa excluída com sucesso!');
            loadEmpresas();
        } catch (err: any) {
            setMessage('Erro ao excluir: ' + err.message);
        }
    };

    const empresasColumns = [
        {
            key: 'razao_social',
            header: 'Razão Social',
            render: (item: Empresa) => <span style={{ fontWeight: 500 }}>{item.razao_social}</span>,
        },
        {
            key: 'nome_fantasia',
            header: 'Nome Fantasia',
            render: (item: Empresa) => item.nome_fantasia || '-',
        },
        {
            key: 'cnpj',
            header: 'CNPJ',
            width: '150px',
            render: (item: Empresa) => item.cnpj,
        },
        {
            key: 'email',
            header: 'E-mail',
            render: (item: Empresa) => item.email || '-',
        },
        {
            key: 'created_at',
            header: 'Cadastrado em',
            width: '130px',
            render: (item: Empresa) => new Date(item.created_at).toLocaleDateString('pt-BR'),
        },
        {
            key: 'acoes',
            header: '',
            width: '60px',
            render: (item: Empresa) => (
                <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleDeleteEmpresa(item)}
                    title="Excluir empresa"
                >
                    🗑️
                </button>
            ),
        },
    ];

    return (
        <>
            <Header
                title="Gerenciar Empresas"
                subtitle="Cadastre e gerencie os tenants do sistema"
            />

            <div className="page-content">
                {message && (
                    <div className="mb-lg">
                        <Alert
                            type={message.includes('Erro') ? 'error' : 'success'}
                            onClose={() => setMessage('')}
                        >
                            {message}
                        </Alert>
                    </div>
                )}

                <Card title="🏢 Lista de Empresas" noPadding>
                    {loadingEmpresas ? (
                        <div style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
                            Carregando...
                        </div>
                    ) : empresas.length === 0 ? (
                        <div style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
                            <p className="text-muted mb-md">Nenhuma empresa cadastrada</p>
                            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                                ➕ Cadastrar Primeira Empresa
                            </button>
                        </div>
                    ) : (
                        <>
                            <DataTable
                                columns={empresasColumns}
                                data={empresas}
                                keyExtractor={(item) => item.id}
                            />
                            <div style={{ padding: 'var(--space-md)' }}>
                                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                                    ➕ Nova Empresa
                                </button>
                            </div>
                        </>
                    )}
                </Card>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Cadastrar Nova Empresa</h3>
                            <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <h4 className="mb-md">Dados da Empresa</h4>
                                <FormRow>
                                    <Input
                                        label="Razão Social"
                                        name="razao_social"
                                        required
                                        placeholder="Ex: Oficina Silva LTDA"
                                    />
                                    <Input
                                        label="Nome Fantasia"
                                        name="nome_fantasia"
                                        placeholder="Ex: Silva Auto Center"
                                    />
                                </FormRow>
                                <FormRow>
                                    <Input
                                        label="CNPJ"
                                        name="cnpj"
                                        required
                                        placeholder="00.000.000/0000-00"
                                    />
                                </FormRow>

                                <div className="divider"></div>
                                <h4 className="mb-md">Administrador Inicial</h4>

                                <FormRow>
                                    <Input
                                        label="Nome Completo"
                                        name="admin_name"
                                        required
                                        placeholder="Nome do responsável"
                                    />
                                </FormRow>
                                <FormRow>
                                    <Input
                                        label="E-mail de Acesso"
                                        name="admin_email"
                                        type="email"
                                        required
                                        placeholder="email@empresa.com"
                                    />
                                </FormRow>
                                <FormRow>
                                    <Input
                                        label="Senha Provisória"
                                        name="admin_password"
                                        type="password"
                                        required
                                        placeholder="Mínimo 6 caracteres"
                                    />
                                </FormRow>
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="btn btn-secondary"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn btn-primary"
                                >
                                    {loading ? 'Salvando...' : 'Criar Empresa'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
