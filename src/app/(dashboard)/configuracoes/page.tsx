'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Card, Alert, DataTable } from '@/components/ui';
import { Input, Select, FormRow, Textarea } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { getUserEmpresaId } from '@/lib/supabase/helpers';

interface Usuario {
    id: string;
    nome: string;
    email: string;
    perfil: string;
    ativo: boolean;
}

interface EmpresaConfig {
    razao_social: string;
    nome_fantasia: string;
    cnpj: string;
    regime_tributario: string;
    inscricao_estadual: string;
    inscricao_municipal: string;
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;
    telefone: string;
    email: string;
    nfse_ambiente: string;
    nfse_municipio: string;
    nfse_codigo_servico: string;
    nfse_aliquota_iss: string;
    validade_orcamento_dias: string;
    estoque_minimo_padrao: string;
    observacao_os_padrao: string;
    termos_orcamento: string;
}

export default function ConfiguracoesPage() {
    const supabase = createClient();
    const [empresaId, setEmpresaId] = useState<string | null>(null);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [loadingUsuarios, setLoadingUsuarios] = useState(true);
    const [loadingConfig, setLoadingConfig] = useState(true);
    const [showSuccess, setShowSuccess] = useState('');
    const [showError, setShowError] = useState('');
    const [savingConfig, setSavingConfig] = useState(false);

    // Configurações da empresa
    const [config, setConfig] = useState<EmpresaConfig>({
        razao_social: '',
        nome_fantasia: '',
        cnpj: '',
        regime_tributario: 'simples_nacional',
        inscricao_estadual: '',
        inscricao_municipal: '',
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: 'GO',
        telefone: '',
        email: '',
        nfse_ambiente: 'homologacao',
        nfse_municipio: '5208707',
        nfse_codigo_servico: '14.01',
        nfse_aliquota_iss: '5.00',
        validade_orcamento_dias: '7',
        estoque_minimo_padrao: '5',
        observacao_os_padrao: '',
        termos_orcamento: '',
    });

    // Modal de novo usuário
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<Usuario | null>(null);
    const [formNome, setFormNome] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formPerfil, setFormPerfil] = useState('mecanico');
    const [formAtivo, setFormAtivo] = useState(true);
    const [formPassword, setFormPassword] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadEmpresaId();
    }, []);

    useEffect(() => {
        if (empresaId) {
            loadUsuarios();
            loadConfiguracoes();
        }
    }, [empresaId]);

    const loadEmpresaId = async () => {
        const id = await getUserEmpresaId();
        if (id) {
            setEmpresaId(id);
        } else {
            setShowError('Erro: Usuário sem empresa associada');
        }
    };

    const loadConfiguracoes = async () => {
        if (!empresaId) return;

        setLoadingConfig(true);
        try {
            const { data, error } = await supabase
                .from('empresas')
                .select('*')
                .eq('id', empresaId)
                .single();

            if (data) {
                setConfig({
                    razao_social: data.razao_social || '',
                    nome_fantasia: data.nome_fantasia || '',
                    cnpj: data.cnpj || '',
                    regime_tributario: data.regime_tributario || 'simples_nacional',
                    inscricao_estadual: data.inscricao_estadual || '',
                    inscricao_municipal: data.inscricao_municipal || '',
                    cep: data.cep || '',
                    logradouro: data.logradouro || '',
                    numero: data.numero || '',
                    complemento: data.complemento || '',
                    bairro: data.bairro || '',
                    cidade: data.cidade || '',
                    estado: data.estado || 'GO',
                    telefone: data.telefone || '',
                    email: data.email || '',
                    nfse_ambiente: data.nfse_ambiente || 'homologacao',
                    nfse_municipio: data.nfse_municipio || '5208707',
                    nfse_codigo_servico: data.nfse_codigo_servico || '14.01',
                    nfse_aliquota_iss: data.nfse_aliquota_iss?.toString() || '5.00',
                    validade_orcamento_dias: data.validade_orcamento_dias?.toString() || '7',
                    estoque_minimo_padrao: data.estoque_minimo_padrao?.toString() || '5',
                    observacao_os_padrao: data.observacao_os_padrao || '',
                    termos_orcamento: data.termos_orcamento || '',
                });
            }
        } catch (err: any) {
            console.error('Erro ao carregar configurações:', err);
        } finally {
            setLoadingConfig(false);
        }
    };

    const handleSalvarConfiguracoes = async () => {
        if (!empresaId) return;

        setSavingConfig(true);
        setShowError('');

        try {
            // Verificar se empresa existe
            const { data: existing } = await supabase
                .from('empresas')
                .select('id')
                .eq('id', empresaId)
                .single();

            const empresaData = {
                razao_social: config.razao_social,
                nome_fantasia: config.nome_fantasia,
                cnpj: config.cnpj,
                regime_tributario: config.regime_tributario,
                inscricao_estadual: config.inscricao_estadual || null,
                inscricao_municipal: config.inscricao_municipal || null,
                cep: config.cep || null,
                logradouro: config.logradouro || null,
                numero: config.numero || null,
                complemento: config.complemento || null,
                bairro: config.bairro || null,
                cidade: config.cidade || null,
                estado: config.estado || null,
                telefone: config.telefone || null,
                email: config.email || null,
                nfse_ambiente: config.nfse_ambiente,
                nfse_municipio: config.nfse_municipio || null,
                nfse_codigo_servico: config.nfse_codigo_servico || null,
                nfse_aliquota_iss: parseFloat(config.nfse_aliquota_iss) || 5.00,
                validade_orcamento_dias: parseInt(config.validade_orcamento_dias) || 7,
                estoque_minimo_padrao: parseInt(config.estoque_minimo_padrao) || 5,
                observacao_os_padrao: config.observacao_os_padrao || null,
                termos_orcamento: config.termos_orcamento || null,
            };

            if (existing) {
                // Atualizar
                const { error } = await supabase
                    .from('empresas')
                    .update(empresaData)
                    .eq('id', empresaId);

                if (error) throw error;
            } else {
                // Criar
                const { error } = await supabase
                    .from('empresas')
                    .insert({ id: empresaId, ...empresaData });

                if (error) throw error;
            }

            setShowSuccess('Configurações salvas com sucesso!');
        } catch (err: any) {
            setShowError('Erro ao salvar: ' + err.message);
        } finally {
            setSavingConfig(false);
        }
    };

    const loadUsuarios = async () => {
        if (!empresaId) return;

        setLoadingUsuarios(true);
        try {
            const { data, error } = await supabase
                .from('usuarios')
                .select('*')
                .eq('empresa_id', empresaId)
                .order('nome');

            if (error) throw error;
            setUsuarios(data || []);
        } catch (err: any) {
            console.error('Erro ao carregar usuários:', err);
        } finally {
            setLoadingUsuarios(false);
        }
    };

    const handleNovoUsuario = () => {
        setEditingUser(null);
        setFormNome('');
        setFormEmail('');
        setFormPassword('');
        setFormPerfil('mecanico');
        setFormAtivo(true);
        setShowModal(true);
    };

    const handleEditarUsuario = (user: Usuario) => {
        setEditingUser(user);
        setFormNome(user.nome);
        setFormEmail(user.email);
        setFormPassword('');
        setFormPerfil(user.perfil);
        setFormAtivo(user.ativo);
        setShowModal(true);
    };

    const handleSalvarUsuario = async () => {
        if (!formNome.trim() || !formEmail.trim()) {
            setShowError('Nome e e-mail são obrigatórios');
            return;
        }

        if (!editingUser && !formPassword.trim()) {
            setShowError('Senha é obrigatória para novos usuários');
            return;
        }

        setSaving(true);
        setShowError('');

        try {
            if (editingUser) {
                const { error } = await supabase
                    .from('usuarios')
                    .update({
                        nome: formNome.trim(),
                        email: formEmail.trim(),
                        perfil: formPerfil,
                        ativo: formAtivo,
                    })
                    .eq('id', editingUser.id);

                if (error) throw error;
                setShowSuccess('Usuário atualizado com sucesso!');
            } else {
                const formData = new FormData();
                formData.append('email', formEmail.trim());
                formData.append('password', formPassword.trim());
                formData.append('nome', formNome.trim());
                formData.append('perfil', formPerfil);
                formData.append('empresa_id', empresaId!);
                formData.append('ativo', String(formAtivo));

                const { createUser } = await import('./actions');
                const result = await createUser(formData);

                if (result.error) throw new Error(result.error);
                setShowSuccess('Usuário criado com sucesso!');
            }

            setShowModal(false);
            loadUsuarios();
        } catch (err: any) {
            setShowError('Erro ao salvar: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const updateConfig = (field: keyof EmpresaConfig, value: string) => {
        setConfig(prev => ({ ...prev, [field]: value }));
    };

    const getPerfilBadge = (perfil: string) => {
        const badges: Record<string, { class: string; label: string }> = {
            admin: { class: 'badge-info', label: 'Admin' },
            mecanico: { class: 'badge-gray', label: 'Mecânico' },
            financeiro: { class: 'badge-warning', label: 'Financeiro' },
            atendente: { class: 'badge-primary', label: 'Atendente' },
        };
        const badge = badges[perfil] || { class: 'badge-gray', label: perfil };
        return <span className={`badge ${badge.class}`}>{badge.label}</span>;
    };

    const usuariosColumns = [
        {
            key: 'nome',
            header: 'Nome',
            render: (item: Usuario) => <span style={{ fontWeight: 500 }}>{item.nome}</span>,
        },
        { key: 'email', header: 'E-mail', render: (item: Usuario) => item.email },
        {
            key: 'perfil',
            header: 'Perfil',
            width: '120px',
            render: (item: Usuario) => getPerfilBadge(item.perfil),
        },
        {
            key: 'status',
            header: 'Status',
            width: '100px',
            render: (item: Usuario) => (
                <span className={`badge ${item.ativo ? 'badge-success' : 'badge-gray'}`}>
                    {item.ativo ? 'Ativo' : 'Inativo'}
                </span>
            ),
        },
        {
            key: 'acoes',
            header: '',
            width: '60px',
            render: (item: Usuario) => (
                <button className="btn btn-ghost btn-sm" onClick={() => handleEditarUsuario(item)} title="Editar">✏️</button>
            ),
        },
    ];

    return (
        <>
            <Header title="Configurações" subtitle="Configure sua empresa e preferências" />

            <div className="page-content">
                {showSuccess && (
                    <div className="mb-lg">
                        <Alert type="success" onClose={() => setShowSuccess('')}>{showSuccess}</Alert>
                    </div>
                )}
                {showError && (
                    <div className="mb-lg">
                        <Alert type="error" onClose={() => setShowError('')}>{showError}</Alert>
                    </div>
                )}

                {/* Dados da Empresa */}
                <Card title="🏢 Dados da Empresa">
                    <FormRow>
                        <Input label="Razão Social" required value={config.razao_social} onChange={(e) => updateConfig('razao_social', e.target.value)} />
                        <Input label="Nome Fantasia" value={config.nome_fantasia} onChange={(e) => updateConfig('nome_fantasia', e.target.value)} />
                    </FormRow>
                    <FormRow>
                        <Input label="CNPJ" value={config.cnpj} onChange={(e) => updateConfig('cnpj', e.target.value)} />
                        <Select
                            label="Regime Tributário"
                            value={config.regime_tributario}
                            onChange={(e) => updateConfig('regime_tributario', e.target.value)}
                            options={[
                                { value: 'simples_nacional', label: 'Simples Nacional' },
                                { value: 'lucro_presumido', label: 'Lucro Presumido' },
                                { value: 'lucro_real', label: 'Lucro Real' },
                                { value: 'mei', label: 'MEI' },
                            ]}
                        />
                    </FormRow>
                    <FormRow>
                        <Input label="Inscrição Estadual" value={config.inscricao_estadual} onChange={(e) => updateConfig('inscricao_estadual', e.target.value)} />
                        <Input label="Inscrição Municipal" value={config.inscricao_municipal} onChange={(e) => updateConfig('inscricao_municipal', e.target.value)} />
                    </FormRow>

                    <div className="divider"></div>
                    <h4 className="mb-md">Endereço</h4>

                    <FormRow>
                        <Input label="CEP" value={config.cep} onChange={(e) => updateConfig('cep', e.target.value)} />
                        <Input label="Logradouro" value={config.logradouro} onChange={(e) => updateConfig('logradouro', e.target.value)} />
                    </FormRow>
                    <FormRow>
                        <Input label="Número" style={{ maxWidth: '100px' }} value={config.numero} onChange={(e) => updateConfig('numero', e.target.value)} />
                        <Input label="Complemento" value={config.complemento} onChange={(e) => updateConfig('complemento', e.target.value)} />
                        <Input label="Bairro" value={config.bairro} onChange={(e) => updateConfig('bairro', e.target.value)} />
                    </FormRow>
                    <FormRow>
                        <Input label="Cidade" value={config.cidade} onChange={(e) => updateConfig('cidade', e.target.value)} />
                        <Select
                            label="Estado"
                            value={config.estado}
                            onChange={(e) => updateConfig('estado', e.target.value)}
                            options={[
                                { value: 'GO', label: 'Goiás' },
                                { value: 'SP', label: 'São Paulo' },
                                { value: 'RJ', label: 'Rio de Janeiro' },
                                { value: 'MG', label: 'Minas Gerais' },
                                { value: 'PR', label: 'Paraná' },
                            ]}
                        />
                    </FormRow>

                    <div className="divider"></div>
                    <h4 className="mb-md">Contato</h4>

                    <FormRow>
                        <Input label="Telefone" value={config.telefone} onChange={(e) => updateConfig('telefone', e.target.value)} />
                        <Input label="E-mail" type="email" value={config.email} onChange={(e) => updateConfig('email', e.target.value)} />
                    </FormRow>
                </Card>

                {/* Configurações NFS-e */}
                <Card title="📄 Configurações NFS-e" className="mt-lg">
                    <Alert type="info">Configure os dados para emissão de NFS-e.</Alert>
                    <FormRow>
                        <Select
                            label="Ambiente"
                            value={config.nfse_ambiente}
                            onChange={(e) => updateConfig('nfse_ambiente', e.target.value)}
                            options={[
                                { value: 'homologacao', label: '🧪 Homologação (Testes)' },
                                { value: 'producao', label: '🏭 Produção' },
                            ]}
                        />
                        <Select
                            label="Município (Código IBGE)"
                            value={config.nfse_municipio}
                            onChange={(e) => updateConfig('nfse_municipio', e.target.value)}
                            options={[
                                { value: '5208707', label: '5208707 - Goiânia' },
                                { value: '5201405', label: '5201405 - Aparecida de Goiânia' },
                            ]}
                        />
                    </FormRow>
                    <FormRow>
                        <Input label="Código do Serviço" value={config.nfse_codigo_servico} onChange={(e) => updateConfig('nfse_codigo_servico', e.target.value)} />
                        <Input label="Alíquota ISS (%)" type="number" step="0.01" value={config.nfse_aliquota_iss} onChange={(e) => updateConfig('nfse_aliquota_iss', e.target.value)} />
                    </FormRow>
                </Card>

                {/* Preferências */}
                <Card title="⚙️ Preferências" className="mt-lg">
                    <FormRow>
                        <Input label="Validade orçamentos (dias)" type="number" value={config.validade_orcamento_dias} onChange={(e) => updateConfig('validade_orcamento_dias', e.target.value)} />
                        <Input label="Estoque mínimo padrão" type="number" value={config.estoque_minimo_padrao} onChange={(e) => updateConfig('estoque_minimo_padrao', e.target.value)} />
                    </FormRow>
                    <Textarea label="Observação padrão em OS" rows={3} value={config.observacao_os_padrao} onChange={(e) => updateConfig('observacao_os_padrao', e.target.value)} />
                    <Textarea label="Termos e Condições (Orçamento)" rows={4} value={config.termos_orcamento} onChange={(e) => updateConfig('termos_orcamento', e.target.value)} />
                </Card>

                {/* Usuários */}
                <Card title="👥 Usuários" className="mt-lg" noPadding>
                    {loadingUsuarios ? (
                        <div style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>Carregando...</div>
                    ) : usuarios.length === 0 ? (
                        <div style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
                            <p className="text-muted mb-md">Nenhum usuário cadastrado</p>
                            <button className="btn btn-primary" onClick={handleNovoUsuario}>➕ Adicionar Usuário</button>
                        </div>
                    ) : (
                        <>
                            <DataTable columns={usuariosColumns} data={usuarios} keyExtractor={(item) => item.id} />
                            <div style={{ padding: 'var(--space-md)' }}>
                                <button className="btn btn-primary" onClick={handleNovoUsuario}>➕ Adicionar Usuário</button>
                            </div>
                        </>
                    )}
                </Card>

                {/* Salvar */}
                <div className="flex justify-end mt-lg">
                    <button className="btn btn-primary btn-lg" onClick={handleSalvarConfiguracoes} disabled={savingConfig}>
                        {savingConfig ? '⏳ Salvando...' : '💾 Salvar Configurações'}
                    </button>
                </div>
            </div>

            {/* Modal de Usuário */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <FormRow><Input label="Nome" required value={formNome} onChange={(e) => setFormNome(e.target.value)} /></FormRow>
                            <FormRow><Input label="E-mail" type="email" required value={formEmail} onChange={(e) => setFormEmail(e.target.value)} /></FormRow>
                            {!editingUser && (
                                <FormRow>
                                    <Input
                                        label="Senha"
                                        type="password"
                                        required
                                        value={formPassword}
                                        onChange={(e) => setFormPassword(e.target.value)}
                                        placeholder="Mínimo 6 caracteres"
                                    />
                                </FormRow>
                            )}
                            <FormRow>
                                <Select
                                    label="Perfil"
                                    value={formPerfil}
                                    onChange={(e) => setFormPerfil(e.target.value)}
                                    options={[
                                        { value: 'admin', label: 'Administrador' },
                                        { value: 'mecanico', label: 'Mecânico' },
                                        { value: 'financeiro', label: 'Financeiro' },
                                        { value: 'atendente', label: 'Atendente' },
                                    ]}
                                />
                            </FormRow>
                            <FormRow>
                                <label className="flex items-center gap-sm">
                                    <input type="checkbox" checked={formAtivo} onChange={(e) => setFormAtivo(e.target.checked)} />
                                    Usuário ativo
                                </label>
                            </FormRow>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={handleSalvarUsuario} disabled={saving}>
                                {saving ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
