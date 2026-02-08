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
import {
    CommissionCard as Card,
    CardContent,
    CardHeader,
    CardTitle,
    CommissionButton as Button,
    Badge,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui'
import { DollarSign, CheckCircle, XCircle, Clock } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

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
            <div className="flex items-center justify-center" style={{ height: '400px' }}>
                <div className="text-center">
                    <div className="spinner mx-auto"></div>
                    <p className="mt-md text-muted">Carregando...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="page-content">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Comissões</h1>
                    <p className="page-subtitle">Gerencie as comissões dos mecânicos</p>
                </div>
                <Link href="/comissoes/config">
                    <Button>Configurar Comissões</Button>
                </Link>
            </div>

            {/* Cards de Resumo */}
            <div className="grid grid-cols-3 mb-xl">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted">
                            Pendentes
                        </CardTitle>
                        <Clock className="h-4 w-4 text-warning" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-warning">
                            {formatCurrency(resumo?.total_pendente || 0)}
                        </div>
                        <p className="text-xs text-muted mt-1">
                            {resumo?.quantidade_pendente || 0} comissões
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted">
                            Pagas
                        </CardTitle>
                        <CheckCircle className="h-4 w-4 text-success" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-success">
                            {formatCurrency(resumo?.total_pago || 0)}
                        </div>
                        <p className="text-xs text-muted mt-1">
                            {resumo?.quantidade_paga || 0} comissões
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted">
                            Canceladas
                        </CardTitle>
                        <XCircle className="h-4 w-4 text-error" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-error">
                            {formatCurrency(resumo?.total_cancelado || 0)}
                        </div>
                        <p className="text-xs text-muted mt-1">
                            {resumo?.quantidade_cancelada || 0} comissões
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs de Comissões */}
            <Card>
                <CardContent className="pt-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid grid-cols-3 w-full mb-lg">
                            <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
                            <TabsTrigger value="pagas">Pagas</TabsTrigger>
                            <TabsTrigger value="todas">Todas</TabsTrigger>
                        </TabsList>

                        <TabsContent value={activeTab}>
                            {loading ? (
                                <div className="text-center py-12">
                                    <div className="spinner mx-auto"></div>
                                </div>
                            ) : comissoes.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-state-text">
                                        Nenhuma comissão encontrada
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-md">
                                    {comissoes.map((comissao) => (
                                        <div
                                            key={comissao.id}
                                            className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                                            style={{ borderColor: 'var(--border)' }}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-md mb-sm">
                                                        <h3 className="font-semibold text-lg">
                                                            {comissao.usuarios?.nome || 'Mecânico'}
                                                        </h3>
                                                        <Badge
                                                            variant={
                                                                comissao.status === 'paga'
                                                                    ? 'success'
                                                                    : comissao.status === 'pendente'
                                                                        ? 'warning'
                                                                        : 'destructive'
                                                            }
                                                        >
                                                            {comissao.status}
                                                        </Badge>
                                                    </div>
                                                    <div className="grid grid-cols-4 gap-md text-sm text-muted">
                                                        <div>
                                                            <span className="font-medium text-foreground">OS:</span> #{comissao.ordens_servico?.numero}
                                                        </div>
                                                        <div>
                                                            <span className="font-medium text-foreground">Tipo:</span>{' '}
                                                            {comissao.tipo_calculo?.replace('_', ' ')}
                                                        </div>
                                                        <div>
                                                            <span className="font-medium text-foreground">Valor OS:</span>{' '}
                                                            {formatCurrency(comissao.valor_total_os)}
                                                        </div>
                                                        <div>
                                                            <span className="font-medium text-foreground">Data:</span>{' '}
                                                            {formatDate(comissao.created_at)}
                                                        </div>
                                                    </div>
                                                    {comissao.observacoes && (
                                                        <p className="text-sm text-muted mt-sm">
                                                            <span className="font-medium">Obs:</span> {comissao.observacoes}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-right ml-lg" style={{ minWidth: '150px' }}>
                                                    <div className="text-2xl font-bold text-success mb-sm">
                                                        {formatCurrency(comissao.valor_comissao)}
                                                    </div>
                                                    {comissao.status === 'pendente' && (
                                                        <div className="flex gap-sm justify-end">
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleMarcarPaga(comissao.id)}
                                                                className="btn-success"
                                                            >
                                                                Pagar
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleCancelar(comissao.id)}
                                                                className="btn-danger"
                                                            >
                                                                Cancelar
                                                            </Button>
                                                        </div>
                                                    )}
                                                    {comissao.status === 'paga' && comissao.data_pagamento && (
                                                        <p className="text-xs text-muted">
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

