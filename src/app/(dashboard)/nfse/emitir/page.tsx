'use client';

import { useState, useEffect, Suspense } from 'react';
import { Header } from '@/components/layout';
import { Card, Alert, Modal } from '@/components/ui';
import { Input, Select, FormRow, MoneyInput, Textarea } from '@/components/ui';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getUserEmpresaId } from '@/lib/supabase/helpers';

interface OSData {
    id: string;
    numero: number;
    cliente_id: string;
    cliente_nome: string;
    cliente_cpf_cnpj?: string;
    cliente_email?: string;
    cliente_telefone?: string;
    cliente_endereco?: string;
    valor_servicos: number;
    valor_total: number;
    diagnostico?: string;
}

interface ItemServico {
    descricao: string;
    valor: number;
}

function EmitirNFSeContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const osId = searchParams.get('os');
    const [empresaId, setEmpresaId] = useState<string | null>(null);

    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [emitindo, setEmitindo] = useState(false);
    const [showError, setShowError] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    const [osData, setOsData] = useState<OSData | null>(null);
    const [servicos, setServicos] = useState<ItemServico[]>([]);

    // Dados da NFS-e
    const [discriminacao, setDiscriminacao] = useState('');
    const [codigoServico, setCodigoServico] = useState('');
    const [aliquotaIss, setAliquotaIss] = useState(5);
    const [valorServicos, setValorServicos] = useState(0);
    const [valorDeducoes, setValorDeducoes] = useState(0);
    const [issRetido, setIssRetido] = useState(false);

    // Dados do tomador
    const [tomadorNome, setTomadorNome] = useState('');
    const [tomadorCpfCnpj, setTomadorCpfCnpj] = useState('');
    const [tomadorEmail, setTomadorEmail] = useState('');
    const [tomadorTelefone, setTomadorTelefone] = useState('');

    useEffect(() => {
        async function loadEmpresaId() {
            const id = await getUserEmpresaId();
            setEmpresaId(id);
        }
        loadEmpresaId();
    }, []);


    useEffect(() => {
        if (osId) {
            loadOSData(osId);
        } else {
            setLoading(false);
        }
    }, [osId]);

    const loadOSData = async (id: string) => {
        setLoading(true);
        try {
            // Buscar OS com cliente e itens
            const { data: os, error: osError } = await supabase
                .from('ordens_servico')
                .select(`
                    *,
                    clientes(nome, cpf_cnpj, email, telefone, logradouro, numero, bairro, cidade, uf),
                    os_itens(tipo, descricao, valor_total)
                `)
                .eq('id', id)
                .single();

            if (osError) throw osError;

            // Preencher dados
            const cliente = os.clientes;
            const endereco = cliente ? `${cliente.logradouro || ''}, ${cliente.numero || ''} - ${cliente.bairro || ''}, ${cliente.cidade || ''}/${cliente.uf || ''}` : '';

            setOsData({
                id: os.id,
                numero: os.numero,
                cliente_id: os.cliente_id,
                cliente_nome: cliente?.nome || 'Cliente não informado',
                cliente_cpf_cnpj: cliente?.cpf_cnpj,
                cliente_email: cliente?.email,
                cliente_telefone: cliente?.telefone,
                cliente_endereco: endereco,
                valor_servicos: os.valor_servicos || 0,
                valor_total: os.valor_total || 0,
                diagnostico: os.diagnostico,
            });

            // Filtrar apenas serviços
            const itensServico = (os.os_itens || [])
                .filter((i: any) => i.tipo === 'servico')
                .map((i: any) => ({
                    descricao: i.descricao,
                    valor: i.valor_total,
                }));
            setServicos(itensServico);

            // Preencher campos do formulário
            setTomadorNome(cliente?.nome || '');
            setTomadorCpfCnpj(cliente?.cpf_cnpj || '');
            setTomadorEmail(cliente?.email || '');
            setTomadorTelefone(cliente?.telefone || '');
            setValorServicos(os.valor_servicos || 0);

            // Gerar discriminação automática
            const descricaoServicos = itensServico.map((s: ItemServico) => `- ${s.descricao}: R$ ${s.valor.toFixed(2)}`).join('\n');
            setDiscriminacao(`Serviços prestados conforme OS #${os.numero}:\n${descricaoServicos}\n\n${os.diagnostico || ''}`);

        } catch (err: any) {
            console.error('Erro ao carregar OS:', err);
            setShowError('Erro ao carregar dados da OS: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatMoney = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const valorIss = valorServicos * (aliquotaIss / 100);
    const valorLiquido = valorServicos - valorDeducoes - (issRetido ? valorIss : 0);

    const handleEmitir = async () => {
        if (!discriminacao.trim()) {
            setShowError('Informe a discriminação dos serviços');
            return;
        }
        if (!tomadorNome.trim()) {
            setShowError('Informe o nome do tomador');
            return;
        }
        if (valorServicos <= 0) {
            setShowError('O valor dos serviços deve ser maior que zero');
            return;
        }

        setEmitindo(true);
        setShowError('');

        try {
            // Criar registro da NFS-e
            const { data: nfse, error: nfseError } = await supabase
                .from('nfse')
                .insert({
                    empresa_id: empresaId,
                    os_id: osData?.id || null,
                    valor_servicos: valorServicos,
                    valor_deducoes: valorDeducoes,
                    valor_iss: valorIss,
                    aliquota_iss: aliquotaIss,
                    valor_liquido: valorLiquido,
                    iss_retido: issRetido,
                    tomador_nome: tomadorNome,
                    tomador_cpf_cnpj: tomadorCpfCnpj || null,
                    tomador_email: tomadorEmail || null,
                    tomador_telefone: tomadorTelefone || null,
                    codigo_servico: codigoServico || null,
                    discriminacao: discriminacao,
                    status: 'pendente',
                    ambiente: 'homologacao',
                })
                .select()
                .single();

            if (nfseError) throw nfseError;

            setShowSuccess(true);
            setTimeout(() => {
                router.push('/nfse');
            }, 2000);

        } catch (err: any) {
            console.error('Erro ao emitir NFS-e:', err);
            setShowError('Erro ao criar NFS-e: ' + err.message);
        } finally {
            setEmitindo(false);
        }
    };

    if (loading) {
        return (
            <>
                <Header title="Emitir NFS-e" subtitle="Carregando..." />
                <div className="page-content">
                    <Card>
                        <div style={{ padding: '2rem', textAlign: 'center' }}>
                            Carregando dados...
                        </div>
                    </Card>
                </div>
            </>
        );
    }

    return (
        <>
            <Header
                title="Emitir NFS-e"
                subtitle={osData ? `OS #${osData.numero} - ${osData.cliente_nome}` : 'Nova Nota Fiscal de Serviço'}
            />

            <div className="page-content">
                {showSuccess && (
                    <div className="mb-lg">
                        <Alert type="success">
                            NFS-e criada com sucesso! Redirecionando...
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

                {!osId && (
                    <Alert type="warning">
                        Nenhuma OS selecionada. Você pode emitir uma NFS-e avulsa ou{' '}
                        <Link href="/os" className="action-link">selecionar uma OS</Link>.
                    </Alert>
                )}

                {/* Dados da OS */}
                {osData && (
                    <Card title="Dados da Ordem de Serviço">
                        <div className="grid grid-cols-3">
                            <div>
                                <strong>OS:</strong> #{osData.numero}
                            </div>
                            <div>
                                <strong>Valor Serviços:</strong> {formatMoney(osData.valor_servicos)}
                            </div>
                            <div>
                                <strong>Valor Total:</strong> {formatMoney(osData.valor_total)}
                            </div>
                        </div>
                    </Card>
                )}

                {/* Tomador */}
                <Card title="Dados do Tomador">
                    <FormRow>
                        <Input
                            label="Nome / Razão Social"
                            required
                            value={tomadorNome}
                            onChange={(e) => setTomadorNome(e.target.value)}
                            placeholder="Nome do cliente"
                        />
                        <Input
                            label="CPF / CNPJ"
                            value={tomadorCpfCnpj}
                            onChange={(e) => setTomadorCpfCnpj(e.target.value)}
                            placeholder="000.000.000-00"
                        />
                    </FormRow>
                    <FormRow>
                        <Input
                            label="E-mail"
                            type="email"
                            value={tomadorEmail}
                            onChange={(e) => setTomadorEmail(e.target.value)}
                            placeholder="email@exemplo.com"
                        />
                        <Input
                            label="Telefone"
                            value={tomadorTelefone}
                            onChange={(e) => setTomadorTelefone(e.target.value)}
                            placeholder="(00) 00000-0000"
                        />
                    </FormRow>
                </Card>

                {/* Serviço */}
                <Card title="Dados do Serviço">
                    <FormRow>
                        <Input
                            label="Código do Serviço (LC 116)"
                            value={codigoServico}
                            onChange={(e) => setCodigoServico(e.target.value)}
                            placeholder="Ex: 14.01"
                        />
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                            <div style={{ flex: 1 }}>
                                <Input
                                    label="Alíquota ISS (%)"
                                    type="number"
                                    value={aliquotaIss.toString()}
                                    onChange={(e) => setAliquotaIss(parseFloat(e.target.value) || 0)}
                                />
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <input
                                    type="checkbox"
                                    checked={issRetido}
                                    onChange={(e) => setIssRetido(e.target.checked)}
                                />
                                ISS Retido
                            </label>
                        </div>
                    </FormRow>

                    <Textarea
                        label="Discriminação dos Serviços"
                        required
                        rows={6}
                        value={discriminacao}
                        onChange={(e) => setDiscriminacao(e.target.value)}
                        placeholder="Descreva detalhadamente os serviços prestados..."
                    />
                </Card>

                {/* Valores */}
                <Card title="Valores">
                    <div className="grid grid-cols-2">
                        <div>
                            <FormRow>
                                <MoneyInput
                                    label="Valor dos Serviços"
                                    value={valorServicos}
                                    onChange={setValorServicos}
                                />
                                <MoneyInput
                                    label="Valor das Deduções"
                                    value={valorDeducoes}
                                    onChange={setValorDeducoes}
                                />
                            </FormRow>
                        </div>
                        <div style={{ paddingLeft: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span>Base de Cálculo:</span>
                                <span>{formatMoney(valorServicos - valorDeducoes)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span>ISS ({aliquotaIss}%):</span>
                                <span>{formatMoney(valorIss)}</span>
                            </div>
                            {issRetido && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--warning-600)' }}>
                                    <span>ISS Retido:</span>
                                    <span>- {formatMoney(valorIss)}</span>
                                </div>
                            )}
                            <hr style={{ margin: '1rem 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700 }}>
                                <span>Valor Líquido:</span>
                                <span style={{ color: 'var(--success-600)' }}>{formatMoney(valorLiquido)}</span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Ambiente */}
                <Card>
                    <Alert type="warning">
                        <strong>Ambiente de Homologação</strong><br />
                        Esta NFS-e será criada em ambiente de teste. Para emissão em produção, configure o certificado digital e altere o ambiente nas configurações.
                    </Alert>
                </Card>

                {/* Botões */}
                <div className="flex gap-md" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button className="btn btn-secondary" onClick={() => router.back()}>
                        Cancelar
                    </button>
                    <button className="btn btn-primary" onClick={handleEmitir} disabled={emitindo}>
                        {emitindo ? 'Emitindo...' : '📄 Emitir NFS-e'}
                    </button>
                </div>
            </div>
        </>
    );
}

export default function EmitirNFSePage() {
    return (
        <Suspense fallback={
            <>
                <Header title="Emitir NFS-e" subtitle="Carregando..." />
                <div className="page-content">
                    <Card>
                        <div style={{ padding: '2rem', textAlign: 'center' }}>
                            Carregando...
                        </div>
                    </Card>
                </div>
            </>
        }>
            <EmitirNFSeContent />
        </Suspense>
    );
}
