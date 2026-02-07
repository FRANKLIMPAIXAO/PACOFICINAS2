-- Cria ou atualiza o usuário admin na tabela de autenticação e na tabela pública
DO $$
DECLARE
    v_user_id uuid;
    v_email text := 'paixaoassessoriacontabil@gmail.com';
    v_password text := 'pac123';
    v_empresa_id uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- 1. Verifica se o usuário já existe em auth.users
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

    IF v_user_id IS NULL THEN
        -- Se não existe, cria um novo ID
        v_user_id := uuid_generate_v4();
        
        -- Insere no auth.users
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, 
            email_confirmed_at, recovery_sent_at, last_sign_in_at, 
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            v_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(), now(), now(),
            '{"provider":"email","providers":["email"]}',
            '{"nome":"Admin PAC", "perfil": "admin"}',
            now(), now()
        );
        
        RAISE NOTICE 'Usuário admin criado com ID: %', v_user_id;
    ELSE
        -- Se existe, atualiza a senha e metadados
        UPDATE auth.users
        SET encrypted_password = crypt(v_password, gen_salt('bf')),
            email_confirmed_at = now(),
            raw_user_meta_data = '{"nome": "Admin PAC", "perfil": "admin"}'::jsonb,
            updated_at = now()
        WHERE id = v_user_id;
        
        RAISE NOTICE 'Usuário admin existente atualizado. ID: %', v_user_id;
    END IF;

    -- 2. Garante que o usuário existe na tabela publice e está vinculado à empresa
    INSERT INTO public.usuarios (id, empresa_id, nome, email, perfil, ativo)
    VALUES (v_user_id, v_empresa_id, 'Admin PAC', v_email, 'admin', true)
    ON CONFLICT (id) DO UPDATE SET
        empresa_id = EXCLUDED.empresa_id,
        perfil = 'admin',
        ativo = true,
        nome = 'Admin PAC';
        
    RAISE NOTICE 'Permissões e vínculo com empresa garantidos para o usuário admin.';
END $$;
