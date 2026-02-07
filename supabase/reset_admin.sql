-- 1. Atualiza a senha do usuário existente para 'pac123'
UPDATE auth.users
SET encrypted_password = crypt('pac123', gen_salt('bf')),
    email_confirmed_at = now(),
    raw_user_meta_data = '{"nome": "Admin PAC", "perfil": "admin"}'
WHERE email = 'paixaoassessoriacontabil@gmail.com';

-- 2. Garante que o usuário existe na tabela pública e está vinculado à empresa
INSERT INTO public.usuarios (id, empresa_id, nome, email, perfil, ativo)
SELECT 
    id, 
    '00000000-0000-0000-0000-000000000001', -- ID da empresa padrão
    'Admin PAC', 
    email, 
    'admin', 
    true
FROM auth.users 
WHERE email = 'paixaoassessoriacontabil@gmail.com'
ON CONFLICT (id) DO 
UPDATE SET 
    empresa_id = '00000000-0000-0000-0000-000000000001',
    perfil = 'admin',
    ativo = true;
