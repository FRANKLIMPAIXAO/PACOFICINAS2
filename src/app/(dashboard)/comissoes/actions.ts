'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// =====================================================
// TIPOS
// =====================================================

export type TipoCalculo = 'percentual_servicos' | 'percentual_total' | 'valor_fixo' | 'misto'
export type StatusComissao = 'pendente' | 'paga' | 'cancelada'

export interface ComissaoConfig {
    id: string
    empresa_id: string
    mecanico_id: string
    tipo_calculo: TipoCalculo
    percentual_servicos: number
    percentual_total: number
    valor_fixo: number
    ativo: boolean
}

export interface Comissao {
    id: string
    empresa_id: string
    os_id: string
    mecanico_id: string
    valor_servicos: number
    valor_total_os: number
    tipo_calculo: string
    percentual_aplicado: number
    valor_fixo_aplicado: number
    valor_comissao: number
    status: StatusComissao
    data_pagamento: string | null
    observacoes: string | null
    created_at: string
}

// =====================================================
// CONFIGURAÇÕES DE COMISSÃO
// =====================================================

export async function getComissoesConfig(empresaId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('comissoes_config')
        .select(`
            *,
            usuarios:mecanico_id (
                id,
                nome,
                email
            )
        `)
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data
}

export async function getComissaoConfigByMecanico(mecanicoId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('comissoes_config')
        .select('*')
        .eq('mecanico_id', mecanicoId)
        .eq('ativo', true)
        .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
}

export async function createOrUpdateComissaoConfig(config: Partial<ComissaoConfig>) {
    console.log('Iniciando createOrUpdateComissaoConfig', config)

    if (!config.mecanico_id || !config.empresa_id) {
        console.error('Erro: mecanico_id ou empresa_id ausentes', config)
        throw new Error('Mecânico e Empresa são obrigatórios')
    }

    const supabase = await createClient()

    try {
        // Verificar se já existe configuração para este mecânico
        const { data: existing, error: searchError } = await supabase
            .from('comissoes_config')
            .select('id')
            .eq('mecanico_id', config.mecanico_id)
            .eq('empresa_id', config.empresa_id)
            .maybeSingle() // Usar maybeSingle para evitar erro se não encontrar

        if (searchError) {
            console.error('Erro ao buscar configuração existente:', searchError)
            throw new Error(`Erro ao buscar: ${searchError.message}`)
        }

        if (existing) {
            console.log('Atualizando configuração existente:', existing.id)
            // Atualizar
            const { data, error } = await supabase
                .from('comissoes_config')
                .update(config)
                .eq('id', existing.id)
                .select()
                .single()

            if (error) {
                console.error('Erro ao atualizar config:', error)
                throw new Error(`Erro ao atualizar: ${error.message} (${error.code})`)
            }
            revalidatePath('/comissoes')
            return data
        } else {
            console.log('Criando nova configuração')
            // Criar
            const { data, error } = await supabase
                .from('comissoes_config')
                .insert(config)
                .select()
                .single()

            if (error) {
                console.error('Erro ao inserir config:', error)
                throw new Error(`Erro ao inserir: ${error.message} (${error.code})`)
            }
            revalidatePath('/comissoes')
            return data
        }
    } catch (err) {
        console.error('Erro não tratado em createOrUpdateComissaoConfig:', err)
        throw err
    }
}

export async function deleteComissaoConfig(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('comissoes_config')
        .delete()
        .eq('id', id)

    if (error) throw error
    revalidatePath('/comissoes')
}

// =====================================================
// COMISSÕES
// =====================================================

export async function getComissoes(empresaId: string, status?: StatusComissao) {
    const supabase = await createClient()

    let query = supabase
        .from('comissoes')
        .select(`
            *,
            ordens_servico:os_id (
                numero,
                data_abertura,
                status
            ),
            usuarios:mecanico_id (
                nome,
                email
            )
        `)
        .eq('empresa_id', empresaId)

    if (status) {
        query = query.eq('status', status)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data
}

export async function getComissoesByMecanico(mecanicoId: string, status?: StatusComissao) {
    const supabase = await createClient()

    let query = supabase
        .from('comissoes')
        .select(`
            *,
            ordens_servico:os_id (
                numero,
                data_abertura,
                status,
                valor_total
            )
        `)
        .eq('mecanico_id', mecanicoId)

    if (status) {
        query = query.eq('status', status)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data
}

export async function createComissao(osId: string, mecanicoId: string, empresaId: string) {
    const supabase = await createClient()

    // Buscar dados da OS
    const { data: os, error: osError } = await supabase
        .from('ordens_servico')
        .select('valor_total, valor_servicos, valor_pecas')
        .eq('id', osId)
        .single()

    if (osError) throw osError

    // Buscar configuração do mecânico
    const { data: config, error: configError } = await supabase
        .from('comissoes_config')
        .select('*')
        .eq('mecanico_id', mecanicoId)
        .eq('empresa_id', empresaId)
        .eq('ativo', true)
        .single()

    // Se não tem configuração, não cria comissão
    if (configError || !config) {
        return null
    }

    // Calcular comissão
    const valorServicos = os.valor_servicos || 0
    const valorTotal = os.valor_total || 0
    let valorComissao = 0
    let percentualAplicado = 0
    let valorFixoAplicado = 0

    switch (config.tipo_calculo) {
        case 'percentual_servicos':
            valorComissao = valorServicos * (config.percentual_servicos / 100)
            percentualAplicado = config.percentual_servicos
            break

        case 'percentual_total':
            valorComissao = valorTotal * (config.percentual_total / 100)
            percentualAplicado = config.percentual_total
            break

        case 'valor_fixo':
            valorComissao = config.valor_fixo
            valorFixoAplicado = config.valor_fixo
            break

        case 'misto':
            valorComissao = (valorServicos * (config.percentual_servicos / 100)) + config.valor_fixo
            percentualAplicado = config.percentual_servicos
            valorFixoAplicado = config.valor_fixo
            break
    }

    // Criar comissão
    const { data, error } = await supabase
        .from('comissoes')
        .insert({
            empresa_id: empresaId,
            os_id: osId,
            mecanico_id: mecanicoId,
            valor_servicos: valorServicos,
            valor_total_os: valorTotal,
            tipo_calculo: config.tipo_calculo,
            percentual_aplicado: percentualAplicado,
            valor_fixo_aplicado: valorFixoAplicado,
            valor_comissao: valorComissao,
            status: 'pendente'
        })
        .select()
        .single()

    if (error) throw error
    revalidatePath('/comissoes')
    return data
}

export async function updateComissao(id: string, updates: Partial<Comissao>) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('comissoes')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) throw error
    revalidatePath('/comissoes')
    return data
}

export async function marcarComissaoPaga(id: string, dataPagamento: string, observacoes?: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('comissoes')
        .update({
            status: 'paga',
            data_pagamento: dataPagamento,
            observacoes: observacoes
        })
        .eq('id', id)
        .select()
        .single()

    if (error) throw error
    revalidatePath('/comissoes')
    return data
}

export async function cancelarComissao(id: string, observacoes?: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('comissoes')
        .update({
            status: 'cancelada',
            observacoes: observacoes
        })
        .eq('id', id)
        .select()
        .single()

    if (error) throw error
    revalidatePath('/comissoes')
    return data
}

export async function deleteComissao(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('comissoes')
        .delete()
        .eq('id', id)

    if (error) throw error
    revalidatePath('/comissoes')
}

// =====================================================
// RELATÓRIOS
// =====================================================

export async function getResumoComissoes(empresaId: string, mecanicoId?: string) {
    const supabase = await createClient()

    let query = supabase
        .from('comissoes')
        .select('status, valor_comissao')
        .eq('empresa_id', empresaId)

    if (mecanicoId) {
        query = query.eq('mecanico_id', mecanicoId)
    }

    const { data, error } = await query

    if (error) throw error

    // Calcular totais
    const resumo = {
        total_pendente: 0,
        total_pago: 0,
        total_cancelado: 0,
        quantidade_pendente: 0,
        quantidade_paga: 0,
        quantidade_cancelada: 0
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?.forEach((comissao: any) => {
        if (comissao.status === 'pendente') {
            resumo.total_pendente += Number(comissao.valor_comissao)
            resumo.quantidade_pendente++
        } else if (comissao.status === 'paga') {
            resumo.total_pago += Number(comissao.valor_comissao)
            resumo.quantidade_paga++
        } else if (comissao.status === 'cancelada') {
            resumo.total_cancelado += Number(comissao.valor_comissao)
            resumo.quantidade_cancelada++
        }
    })

    return resumo
}

