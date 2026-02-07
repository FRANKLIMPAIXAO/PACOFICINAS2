'use client'

import { useEffect, useState } from 'react'
import { getUserEmpresaId } from '@/lib/supabase/helpers'
import {
    getComissoes,
    getResumoComissoes,
    marcarComissaoPaga,
    cancelarComissao,
    updateComissao
} from './actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/commission-ui'
import { Button } from '@/components/ui/commission-ui'
import { Badge } from '@/components/ui/commission-ui'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/commission-ui'
import { DollarSign, CheckCircle, XCircle, Clock } from 'lucide-react'
import Link from 'next/link'

export default function ComissoesPage() {
    const [empresaId, setEmpresaId] = useState<string | null>(null)
    const [comissoes, setComissoes] = useState<any[]>([])
    const [resumo, setResumo] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('pendentes')

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
    }, [empresaId, activeTab])

    async function loadData() {
        if (!empresaId) return
        setLoading(true)
        try {
            const status = activeTab === 'pendentes' ? 'pendente' : activeTab === 'pagas' ? 'paga' : undefined
            const [comissoesData, resumoData] = await Promise.all([
                getComissoes(empresaId, status as any),
                getResumoComissoes(empresaId)
            ])
            setComissoes(comissoesData || [])
            setResumo(resumoData)
        } catch (error) {
            console.error('Erro ao carregar comissões:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleMarcarPaga(id: string) {
        if (!confirm('Confirma o pagamento desta comissão?')) return
        try {
            const hoje = new Date().toISOString().split('T')[0]
            await marcarComissaoPaga(id, hoje)
            loadData()
        } catch (error) {
            console.error('Erro ao marcar como paga:', error)
            alert('Erro ao marcar comissão como paga')
        }
    }

    async function handleCancelar(id: string) {
        const motivo = prompt('Motivo do cancelamento:')
        if (!motivo) return
        try {
            await cancelarComissao(id, motivo)
            loadData()
        } catch (error) {
            console.error('Erro ao cancelar:', error)
            alert('Erro ao cancelar comissão')
        }
    }

    function formatCurrency(value: number) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value)
    }

    function formatDate(date: string) {
        return new Date(date).toLocaleDateString('pt-BR')
    }

    if (loading && !empresaId) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Carregando...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Comissões</h1>
                    <p className="text-gray-600">Gerencie as comissões dos mecânicos</p>
                </div>
                <Link href="/comissoes/config">
                    <Button>Configurar Comissões</Button>
                </Link>
            </div>

            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Pendentes
                        </CardTitle>
                        <Clock className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">
                            {formatCurrency(resumo?.total_pendente || 0)}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                            {resumo?.quantidade_pendente || 0} comissões
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Pagas
                        </CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(resumo?.total_pago || 0)}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                            {resumo?.quantidade_paga || 0} comissões
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Canceladas
                        </CardTitle>
                        <XCircle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {formatCurrency(resumo?.total_cancelado || 0)}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                            {resumo?.quantidade_cancelada || 0} comissões
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs de Comissões */}
            <Card>
                <CardContent className="pt-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
                            <TabsTrigger value="pagas">Pagas</TabsTrigger>
                            <TabsTrigger value="todas">Todas</TabsTrigger>
                        </TabsList>

                        <TabsContent value={activeTab} className="mt-6">
                            {loading ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                                </div>
                            ) : comissoes.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    Nenhuma comissão encontrada
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {comissoes.map((comissao) => (
                                        <div
                                            key={comissao.id}
                                            className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="font-semibold text-lg">
                                                            {comissao.usuarios?.nome || 'Mecânico'}
                                                        </h3>
                                                        <Badge
                                                            variant={
                                                                comissao.status === 'paga'
                                                                    ? 'default'
                                                                    : comissao.status === 'pendente'
                                                                        ? 'secondary'
                                                                        : 'destructive'
                                                            }
                                                        >
                                                            {comissao.status}
                                                        </Badge>
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                                                        <div>
                                                            <span className="font-medium">OS:</span> #{comissao.ordens_servico?.numero}
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">Tipo:</span>{' '}
                                                            {comissao.tipo_calculo?.replace('_', ' ')}
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">Valor OS:</span>{' '}
                                                            {formatCurrency(comissao.valor_total_os)}
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">Data:</span>{' '}
                                                            {formatDate(comissao.created_at)}
                                                        </div>
                                                    </div>
                                                    {comissao.observacoes && (
                                                        <p className="text-sm text-gray-500 mt-2">
                                                            <span className="font-medium">Obs:</span> {comissao.observacoes}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-right ml-4">
                                                    <div className="text-2xl font-bold text-green-600 mb-2">
                                                        {formatCurrency(comissao.valor_comissao)}
                                                    </div>
                                                    {comissao.status === 'pendente' && (
                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleMarcarPaga(comissao.id)}
                                                            >
                                                                Marcar Paga
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleCancelar(comissao.id)}
                                                            >
                                                                Cancelar
                                                            </Button>
                                                        </div>
                                                    )}
                                                    {comissao.status === 'paga' && comissao.data_pagamento && (
                                                        <p className="text-xs text-gray-500">
                                                            Pago em {formatDate(comissao.data_pagamento)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}
