'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Card, SearchInput, DataTable, Modal, Alert } from '@/components/ui';
import { Input, FormRow, MoneyInput, Textarea } from '@/components/ui';
import type { Servico } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { getUserEmpresaId } from '@/lib/supabase/helpers';

interface ServicoForm {
    codigo: string;
    descricao: string;
    codigo_servico: string;
    aliquota_iss: string;
    preco: number;
    tempo_estimado: string;
}

const initialFormState: ServicoForm = {
    codigo: '',
    descricao: '',
    codigo_servico: '14.01',
    aliquota_iss: '5.00',
    preco: 0,
    tempo_estimado: '',
};

export default function ServicosPage() {
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState('');
    const [servicos, setServicos] = useState<Servico[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<ServicoForm>(initialFormState);

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
        async function loadServicos() {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('servicos')
                    .select('*')
                    .order('descricao');

                if (error) {
                    console.error('Erro ao carregar serviços:', error);
                    setShowError('Erro ao carregar serviços: ' + error.message);
                } else {
                    setServicos(data || []);
                }
            } catch (err) {
                console.error('Erro:', err);
                setShowError('Erro ao conectar com o banco de dados');
            } finally {
                setLoading(false);
            }
        }

        loadServicos();
    }, []);

    const handleInputChange = (field: keyof ServicoForm, value: string | number) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!form.descricao.trim()) {
            setShowError('A descrição é obrigatória');
            return;
        }

        setSaving(true);
        setShowError('');

        try {
            const { data, error } = await supabase
                .from('servicos')
                .insert({
                    empresa_id: empresaId,
                    codigo: form.codigo || null,
                    descricao: form.descricao,
                    codigo_servico: form.codigo_servico || null,
                    aliquota_iss: form.aliquota_iss ? parseFloat(form.aliquota_iss) : 5.00,
                    preco: form.preco,
                    tempo_estimado: form.tempo_estimado ? parseInt(form.tempo_estimado) : null,
                    ativo: true,
                })
                .select()
                .single();

            if (error) {
                console.error('Erro ao salvar:', error);
                setShowError('Erro ao salvar serviço: ' + error.message);
            } else {
                setServicos(prev => [...prev, data]);
                setShowModal(false);
                setShowSuccess(true);
                setForm(initialFormState);
                setTimeout(() => setShowSuccess(false), 3000);
            }
        } catch (err) {
            console.error('Erro:', err);
            setShowError('Erro ao salvar serviço');
        } finally {
            setSaving(false);
        }
    };

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
                        placeholder="Buscar por código ou descrição..."
                    />
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        ➕ Novo Serviço
                    </button>
                </div>

                <Card noPadding>
                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center' }}>
                            Carregando serviços...
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={filteredServicos}
                            keyExtractor={(item) => item.id}
                            emptyMessage="Nenhum serviço encontrado. Clique em 'Novo Serviço' para cadastrar."
                        />
                    )}
                </Card>
            </div>

            <Modal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setForm(initialFormState); setShowError(''); }}
                title="Novo Serviço"
                size="md"
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => { setShowModal(false); setForm(initialFormState); }}>
                            Cancelar
                        </button>
                        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                            {saving ? 'Salvando...' : 'Salvar Serviço'}
                        </button>
                    </>
                }
            >
                {showError && (
                    <div className="mb-md">
                        <Alert type="error" onClose={() => setShowError('')}>{showError}</Alert>
                    </div>
                )}

                <FormRow>
                    <Input
                        label="Código"
                        placeholder="Ex: SV001"
                        value={form.codigo}
                        onChange={(e) => handleInputChange('codigo', e.target.value)}
                    />
                    <Input
                        label="Tempo Estimado (min)"
                        type="number"
                        placeholder="30"
                        value={form.tempo_estimado}
                        onChange={(e) => handleInputChange('tempo_estimado', e.target.value)}
                    />
                </FormRow>

                <Input
                    label="Descrição"
                    required
                    placeholder="Nome do serviço"
                    value={form.descricao}
                    onChange={(e) => handleInputChange('descricao', e.target.value)}
                />

                <MoneyInput
                    label="Preço"
                    value={form.preco}
                    onChange={(value) => handleInputChange('preco', value)}
                />

                <div className="divider"></div>
                <h4 className="mb-md">Dados Fiscais (NFS-e)</h4>

                <FormRow>
                    <Input
                        label="Código do Serviço"
                        placeholder="Ex: 14.01"
                        value={form.codigo_servico}
                        onChange={(e) => handleInputChange('codigo_servico', e.target.value)}
                    />
                    <Input
                        label="Alíquota ISS (%)"
                        type="number"
                        placeholder="5.00"
                        value={form.aliquota_iss}
                        onChange={(e) => handleInputChange('aliquota_iss', e.target.value)}
                    />
                </FormRow>
            </Modal>
        </>
    );
}
