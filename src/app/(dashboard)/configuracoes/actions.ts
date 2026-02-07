'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createUser(formData: FormData) {
    const supabase = await createAdminClient();

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const nome = formData.get('nome') as string;
    const perfil = formData.get('perfil') as string;
    const empresa_id = formData.get('empresa_id') as string;
    const ativo = formData.get('ativo') === 'true';

    // 1. Criar usuário no Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { nome, perfil, empresa_id }
    });

    if (authError) {
        return { error: authError.message };
    }

    if (!authData.user) {
        return { error: 'Erro ao criar usuário de autenticação' };
    }

    // 2. Criar registro na tabela pública
    const { error: dbError } = await supabase
        .from('usuarios')
        .insert({
            id: authData.user.id,
            empresa_id,
            nome,
            email,
            perfil,
            ativo
        });

    if (dbError) {
        // Se falhar no banco, tenta remover do Auth para não ficar órfão
        await supabase.auth.admin.deleteUser(authData.user.id);
        return { error: 'Erro ao criar perfil do usuário: ' + dbError.message };
    }

    revalidatePath('/configuracoes');
    return { success: true };
}
