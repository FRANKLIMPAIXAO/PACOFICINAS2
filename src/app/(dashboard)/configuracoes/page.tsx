'use client';

import { Header } from '@/components/layout';
import { Card, Alert } from '@/components/ui';
import { Input, Select, FormRow, Textarea } from '@/components/ui';

export default function ConfiguracoesPage() {
    return (
        <>
            <Header title="Configurações" subtitle="Configure sua empresa e preferências" />

            <div className="page-content">
                {/* Dados da Empresa */}
                <Card title="🏢 Dados da Empresa">
                    <FormRow>
                        <Input label="Razão Social" required defaultValue="Oficina Mecânica Exemplo Ltda" />
                        <Input label="Nome Fantasia" defaultValue="Oficina do João" />
                    </FormRow>

                    <FormRow>
                        <Input label="CNPJ" defaultValue="12.345.678/0001-90" />
                        <Select
                            label="Regime Tributário"
                            options={[
                                { value: 'simples_nacional', label: 'Simples Nacional' },
                                { value: 'lucro_presumido', label: 'Lucro Presumido' },
                                { value: 'lucro_real', label: 'Lucro Real' },
                                { value: 'mei', label: 'MEI' },
                            ]}
                        />
                    </FormRow>

                    <FormRow>
                        <Input label="Inscrição Estadual" placeholder="Opcional" />
                        <Input label="Inscrição Municipal" placeholder="Opcional" />
                    </FormRow>

                    <div className="divider"></div>

                    <h4 className="mb-md">Endereço</h4>

                    <FormRow>
                        <Input label="CEP" placeholder="00000-000" />
                        <Input label="Logradouro" placeholder="Rua, Avenida..." />
                    </FormRow>

                    <FormRow>
                        <Input label="Número" placeholder="123" style={{ maxWidth: '100px' }} />
                        <Input label="Complemento" placeholder="Sala, Galpão..." />
                        <Input label="Bairro" />
                    </FormRow>

                    <FormRow>
                        <Input label="Cidade" />
                        <Select
                            label="Estado"
                            options={[
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
                        <Input label="Telefone" placeholder="(00) 0000-0000" />
                        <Input label="E-mail" type="email" placeholder="contato@empresa.com" />
                    </FormRow>
                </Card>

                {/* Configurações NFS-e */}
                <Card title="📄 Configurações NFS-e" className="mt-lg">
                    <Alert type="info">
                        Configure os dados necessários para emissão de NFS-e via Sistema Nacional.
                    </Alert>

                    <FormRow>
                        <Select
                            label="Ambiente"
                            options={[
                                { value: 'homologacao', label: '🧪 Homologação (Testes)' },
                                { value: 'producao', label: '🏭 Produção' },
                            ]}
                            defaultValue="homologacao"
                        />
                        <Select
                            label="Município (Código IBGE)"
                            options={[
                                { value: '5208707', label: '5208707 - Goiânia' },
                                { value: '5201405', label: '5201405 - Aparecida de Goiânia' },
                            ]}
                        />
                    </FormRow>

                    <FormRow>
                        <Input
                            label="Código do Serviço Padrão"
                            placeholder="Ex: 14.01"
                            defaultValue="14.01"
                        />
                        <Input
                            label="Alíquota ISS Padrão (%)"
                            type="number"
                            step="0.01"
                            defaultValue="5.00"
                        />
                    </FormRow>
                </Card>

                {/* Certificado Digital */}
                <Card title="🔐 Certificado Digital A1" className="mt-lg">
                    <Alert type="warning">
                        O certificado digital A1 (.pfx) é obrigatório para assinar as notas fiscais.
                    </Alert>

                    <div className="mt-lg" style={{
                        padding: 'var(--space-lg)',
                        border: '2px dashed var(--gray-300)',
                        borderRadius: 'var(--radius-md)',
                        textAlign: 'center',
                        background: 'var(--gray-50)'
                    }}>
                        <div style={{ fontSize: '2rem', marginBottom: 'var(--space-sm)' }}>📁</div>
                        <p className="mb-md">Arraste o arquivo .pfx aqui ou clique para selecionar</p>
                        <button className="btn btn-secondary">📤 Selecionar Certificado</button>
                    </div>

                    <FormRow>
                        <Input
                            label="Senha do Certificado"
                            type="password"
                            placeholder="Digite a senha do certificado"
                        />
                        <div>
                            <label className="form-label">Status</label>
                            <div className="flex items-center gap-sm" style={{ paddingTop: 'var(--space-sm)' }}>
                                <span className="badge badge-warning">⚠️ Não configurado</span>
                            </div>
                        </div>
                    </FormRow>
                </Card>

                {/* Preferências */}
                <Card title="⚙️ Preferências" className="mt-lg">
                    <FormRow>
                        <Input
                            label="Validade padrão de orçamentos (dias)"
                            type="number"
                            defaultValue="7"
                        />
                        <Input
                            label="Estoque mínimo padrão"
                            type="number"
                            defaultValue="5"
                        />
                    </FormRow>

                    <Textarea
                        label="Observação padrão em OS"
                        placeholder="Texto que aparecerá automaticamente nas OS..."
                        rows={3}
                    />

                    <Textarea
                        label="Termos e Condições (Orçamento)"
                        placeholder="Termos que aparecem no final do orçamento..."
                        rows={4}
                    />
                </Card>

                {/* Usuários */}
                <Card title="👥 Usuários" className="mt-lg">
                    <div className="table-wrapper" style={{ border: 'none' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>E-mail</th>
                                    <th>Perfil</th>
                                    <th>Status</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ fontWeight: 500 }}>Administrador</td>
                                    <td>admin@oficina.com</td>
                                    <td><span className="badge badge-info">Admin</span></td>
                                    <td><span className="badge badge-success">Ativo</span></td>
                                    <td><button className="btn btn-ghost btn-sm">✏️</button></td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: 500 }}>Carlos Mecânico</td>
                                    <td>carlos@oficina.com</td>
                                    <td><span className="badge badge-gray">Mecânico</span></td>
                                    <td><span className="badge badge-success">Ativo</span></td>
                                    <td><button className="btn btn-ghost btn-sm">✏️</button></td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: 500 }}>Maria Financeiro</td>
                                    <td>maria@oficina.com</td>
                                    <td><span className="badge badge-warning">Financeiro</span></td>
                                    <td><span className="badge badge-success">Ativo</span></td>
                                    <td><button className="btn btn-ghost btn-sm">✏️</button></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-lg">
                        <button className="btn btn-primary">➕ Adicionar Usuário</button>
                    </div>
                </Card>

                {/* Salvar */}
                <div className="flex justify-end mt-lg">
                    <button className="btn btn-primary btn-lg">💾 Salvar Configurações</button>
                </div>
            </div>
        </>
    );
}
