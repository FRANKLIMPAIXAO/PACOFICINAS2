import { createClient } from './client';

/**
 * Obtém o ID da empresa do usuário logado
 * Retorna o empresa_id do user_metadata ou null se não encontrado
 */
export async function getUserEmpresaId(): Promise<string | null> {
    const supabase = createClient();

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        console.error('❌ Erro ao obter usuário:', error);
        return null;
    }

    console.log('👤 Usuário logado:', user.email);
    console.log('📋 User metadata completo:', user.user_metadata);

    // Buscar empresa_id do user_metadata
    const empresaId = user.user_metadata?.empresa_id;

    if (!empresaId) {
        console.error('⚠️ PROBLEMA: Usuário sem empresa_id no metadata!');
        console.error('   Email:', user.email);
        console.error('   Metadata:', user.user_metadata);
        return null;
    }

    console.log('✅ Empresa ID encontrado:', empresaId);
    return empresaId;
}

/**
 * Obtém o perfil do usuário logado
 */
export async function getUserPerfil(): Promise<string | null> {
    const supabase = createClient();

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return null;
    }

    return user.user_metadata?.perfil || null;
}
