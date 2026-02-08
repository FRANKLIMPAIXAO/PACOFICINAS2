const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
const envPath = path.resolve(__dirname, '../.env.local');
let envConfig = {};

try {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim();
            envConfig[key] = value;
        }
    });
} catch (err) {
    console.error('Error reading .env.local:', err);
    process.exit(1);
}

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase URL or Service Role Key in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function fixAdminPermissions() {
    const adminEmail = 'paixaoassessoriacontabil@gmail.com';

    console.log(`Checking permissions for admin: ${adminEmail}...`);

    // 1. Get user from Auth
    const { data: { users }, error: listUsersError } = await supabase.auth.admin.listUsers();

    if (listUsersError) {
        console.error('Error listing users:', listUsersError);
        return;
    }

    const adminUser = users.find(u => u.email === adminEmail);

    if (!adminUser) {
        console.error(`User ${adminEmail} not found in Auth!`);
        return;
    }

    console.log(`Found admin user in Auth: ${adminUser.id}`);

    // Check metadata for empresa_id
    let empresaId = adminUser.user_metadata?.empresa_id;

    if (!empresaId) {
        console.warn('Admin user does not have empresa_id in metadata! Fixing...');

        // Find existing empresa
        const { data: empresa, error: empresaError } = await supabase
            .from('empresas')
            .select('id')
            .limit(1)
            .single();

        if (empresa) {
            console.log(`Found an empresa: ${empresa.id}. Updating admin metadata...`);
            const { error: updateAuthError } = await supabase.auth.admin.updateUserById(adminUser.id, {
                user_metadata: { empresa_id: empresa.id }
            });

            if (updateAuthError) {
                console.error('Error updating user metadata:', updateAuthError);
                return;
            }
            console.log('Updated user metadata.');
            empresaId = empresa.id;
        } else {
            console.error('No empresa found in database! Creating one...');
            const { data: newEmpresa, error: createEmpresaError } = await supabase
                .from('empresas')
                .insert({ nome: 'PAC Oficinas', cpf_cnpj: '00000000000000' })
                .select()
                .single();

            if (createEmpresaError) {
                console.error('Error creating empresa:', createEmpresaError);
                return;
            }

            empresaId = newEmpresa.id;
            await supabase.auth.admin.updateUserById(adminUser.id, {
                user_metadata: { empresa_id: empresaId }
            });
            console.log(`Created empresa ${empresaId} and assigned to admin.`);
        }
    }

    // 2. Check user in 'usuarios' table
    const { data: existingProfile, error: profileError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', adminUser.id)
        .maybeSingle();

    if (profileError) {
        console.error('Error checking usuarios table:', profileError);
        return;
    }

    if (existingProfile) {
        console.log(`Found profile in usuarios table. Role: ${existingProfile.perfil}`);
        if (existingProfile.perfil !== 'admin') {
            console.log('Updating profile to admin...');
            const { error: updateError } = await supabase
                .from('usuarios')
                .update({ perfil: 'admin' })
                .eq('id', adminUser.id);

            if (updateError) console.error('Error updating profile:', updateError);
            else console.log('Profile updated to admin.');
        } else {
            console.log('Profile is already admin.');
        }
    } else {
        console.log('Profile not found in usuarios table. Creating...');
        const { error: insertError } = await supabase
            .from('usuarios')
            .insert({
                id: adminUser.id,
                email: adminEmail,
                nome: 'Admin',
                perfil: 'admin',
                empresa_id: empresaId,
                ativo: true
            });

        if (insertError) console.error('Error creating profile:', insertError);
        else console.log('Profile created successfully.');
    }
}

fixAdminPermissions();
