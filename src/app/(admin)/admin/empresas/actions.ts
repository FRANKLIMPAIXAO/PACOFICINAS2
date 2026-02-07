'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createCompany(formData: FormData) {
    const supabase = await createAdminClient();

    const razaoSocial = formData.get('razao_social') as string;
    const nomeFantasia = formData.get('nome_fantasia') as string;
    const cnpj = formData.get('cnpj') as string;
    const adminName = formData.get('admin_name') as string;
    const adminEmail = formData.get('admin_email') as string;
    const adminPassword = formData.get('admin_password') as string;

    // 1. Validar CNPJ (básico)
    const { data: existingCompany } = await supabase
        .from('empresas')
        .select('id')
        .eq('cnpj', cnpj)
        .single();

    if (existingCompany) {
        return { error: 'Empresa com este CNPJ já existe.' };
    }

    // 2. Criar Empresa
    const { data: company, error: companyError } = await supabase
        .from('empresas')
        .insert({
            razao_social: razaoSocial,
            nome_fantasia: nomeFantasia,
            cnpj: cnpj,
            ativo: true
        })
        .select()
        .single();

    if (companyError) {
        return { error: 'Erro ao criar empresa: ' + companyError.message };
    }

    // 3. Criar Usuário Admin vinculado à Empresa
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
            nome: adminName,
            perfil: 'admin',
            empresa_id: company.id
        }
    });

    if (authError) {
        // Rollback da empresa? Por enquanto não, mas seria ideal.
        // Vamos apenas retornar o erro.
        return { error: 'Empresa criada, mas erro ao criar usuário admin: ' + authError.message };
    }

    if (authData.user) {
        const { error: userError } = await supabase
            .from('usuarios')
            .insert({
                id: authData.user.id,
                empresa_id: company.id,
                nome: adminName,
                email: adminEmail,
                perfil: 'admin',
                ativo: true
            });

        if (userError) {
            // Tenta limpar o auth user se falhar no public schema
            await supabase.auth.admin.deleteUser(authData.user.id);
            return { error: 'Erro ao vincular perfil do admin: ' + userError.message };
        }
    }

    revalidatePath('/admin/empresas');
    return { success: true };
}
