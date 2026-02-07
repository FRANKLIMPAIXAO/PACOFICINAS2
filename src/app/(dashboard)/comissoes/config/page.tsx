'use client'

import { useEffect, useState } from 'react'
import { getUserEmpresaId } from '@/lib/supabase/helpers'
import { getComissoesConfig, createOrUpdateComissaoConfig, deleteComissaoConfig, TipoCalculo } from '../actions'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/CommissionUI'
import { Button } from '../../../../components/ui/CommissionUI'
import { Input } from '../../../../components/ui/CommissionUI'
import { Label } from '../../../../components/ui/CommissionUI'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/CommissionUI'
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react'
import Link from 'next/link'

export default function ConfigComissoesPage() {
    const [empresaId, setEmpresaId] = useState<string | null>(null)
    const [configs, setConfigs] = useState<any[]>([])
    const [mecanicos, setMecanicos] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState<{
        mecanico_id: string;
        tipo_calculo: TipoCalculo;
        percentual_servicos: number;
        percentual_total: number;
        valor_fixo: number;
        ativo: boolean;
    }>({
        mecanico_id: '',
        tipo_calculo: 'percentual_servicos',
        percentual_servicos: 0,
        percentual_total: 0,
        valor_fixo: 0,
        ativo: true
    })

    useEffect(() => {
        async function loadEmpresaId() {
            const id = await getUserEmpresaId()
            setEmpresaId(id)
        }
        loadEmpresaId()
    }, [])

    useEffect(() => {
        if (!empresaId) return
        loadData()
    }, [empresaId])

    async function loadData() {
        if (!empresaId) return
        setLoading(true)
        try {
            const supabase = createClient()

            // Carregar configurações
            const configsData = await getComissoesConfig(empresaId)
            setConfigs(configsData || [])

            // Carregar mecânicos
            const { data: mecanicosData } = await supabase
                .from('usuarios')
                .select('id, nome, email')
                .eq('empresa_id', empresaId)
                .eq('perfil', 'mecanico')
                .eq('ativo', true)
                .order('nome')

            setMecanicos(mecanicosData || [])
        } catch (error) {
            console.error('Erro ao carregar dados:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!empresaId) return

        try {
            await createOrUpdateComissaoConfig({
                ...formData,
                empresa_id: empresaId
            })

            // Reset form
            setFormData({
                mecanico_id: '',
                tipo_calculo: 'percentual_servicos',
                percentual_servicos: 0,
                percentual_total: 0,
                valor_fixo: 0,
                ativo: true
            })
            setEditingId(null)
            loadData()
        } catch (error) {
            console.error('Erro ao salvar configuração:', error)
            alert('Erro ao salvar configuração')
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Deseja realmente excluir esta configuração?')) return
        try {
            await deleteComissaoConfig(id)
            loadData()
        } catch (error) {
            console.error('Erro ao excluir:', error)
            alert('Erro ao excluir configuração')
        }
    }

    function handleEdit(config: any) {
        setEditingId(config.id)
        setFormData({
            mecanico_id: config.mecanico_id,
            tipo_calculo: config.tipo_calculo,
            percentual_servicos: config.percentual_servicos,
            percentual_total: config.percentual_total,
            valor_fixo: config.valor_fixo,
            ativo: config.ativo
        })
    }

    if (loading && !empresaId) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/comissoes">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">Configurar Comissões</h1>
                    <p className="text-gray-600">Defina como cada mecânico será comissionado</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Formulário */}
                <Card>
                    <CardHeader>
                        <CardTitle>{editingId ? 'Editar' : 'Nova'} Configuração</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="mecanico">Mecânico</Label>
                                <Select
                                    value={formData.mecanico_id}
                                    onValueChange={(value: string) => setFormData({ ...formData, mecanico_id: value })}
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um mecânico" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {mecanicos.map((mec) => (
                                            <SelectItem key={mec.id} value={mec.id}>
                                                {mec.nome}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="tipo">Tipo de Cálculo</Label>
                                <Select
                                    value={formData.tipo_calculo}
                                    onValueChange={(value: string) => setFormData({ ...formData, tipo_calculo: value as any })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentual_servicos">% sobre Serviços</SelectItem>
                                        <SelectItem value="percentual_total">% sobre Total da OS</SelectItem>
                                        <SelectItem value="valor_fixo">Valor Fixo por OS</SelectItem>
                                        <SelectItem value="misto">Misto (% + Fixo)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {(formData.tipo_calculo === 'percentual_servicos' || formData.tipo_calculo === 'misto') && (
                                <div>
                                    <Label htmlFor="perc_servicos">% sobre Serviços</Label>
                                    <Input
                                        id="perc_servicos"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        value={formData.percentual_servicos}
                                        onChange={(e) => setFormData({ ...formData, percentual_servicos: parseFloat(e.target.value) })}
                                        placeholder="Ex: 10.00"
                                    />
                                </div>
                            )}

                            {formData.tipo_calculo === 'percentual_total' && (
                                <div>
                                    <Label htmlFor="perc_total">% sobre Total</Label>
                                    <Input
                                        id="perc_total"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        value={formData.percentual_total}
                                        onChange={(e) => setFormData({ ...formData, percentual_total: parseFloat(e.target.value) })}
                                        placeholder="Ex: 5.00"
                                    />
                                </div>
                            )}

                            {(formData.tipo_calculo === 'valor_fixo' || formData.tipo_calculo === 'misto') && (
                                <div>
                                    <Label htmlFor="valor_fixo">Valor Fixo (R$)</Label>
                                    <Input
                                        id="valor_fixo"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.valor_fixo}
                                        onChange={(e) => setFormData({ ...formData, valor_fixo: parseFloat(e.target.value) })}
                                        placeholder="Ex: 50.00"
                                    />
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button type="submit" className="flex-1">
                                    <Save className="h-4 w-4 mr-2" />
                                    {editingId ? 'Atualizar' : 'Salvar'}
                                </Button>
                                {editingId && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setEditingId(null)
                                            setFormData({
                                                mecanico_id: '',
                                                tipo_calculo: 'percentual_servicos',
                                                percentual_servicos: 0,
                                                percentual_total: 0,
                                                valor_fixo: 0,
                                                ativo: true
                                            })
                                        }}
                                    >
                                        Cancelar
                                    </Button>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Lista de Configurações */}
                <Card>
                    <CardHeader>
                        <CardTitle>Configurações Ativas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                            </div>
                        ) : configs.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                Nenhuma configuração cadastrada
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {configs.map((config) => (
                                    <div
                                        key={config.id}
                                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h3 className="font-semibold">{config.usuarios?.nome}</h3>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {config.tipo_calculo === 'percentual_servicos' && `${config.percentual_servicos}% sobre serviços`}
                                                    {config.tipo_calculo === 'percentual_total' && `${config.percentual_total}% sobre total`}
                                                    {config.tipo_calculo === 'valor_fixo' && `R$ ${config.valor_fixo.toFixed(2)} fixo`}
                                                    {config.tipo_calculo === 'misto' && `${config.percentual_servicos}% + R$ ${config.valor_fixo.toFixed(2)}`}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleEdit(config)}
                                                >
                                                    Editar
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDelete(config.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
