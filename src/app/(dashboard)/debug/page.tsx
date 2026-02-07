'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getUserEmpresaId } from '@/lib/supabase/helpers';

export default function DebugPage() {
    const [userInfo, setUserInfo] = useState<any>(null);
    const [empresaId, setEmpresaId] = useState<string | null>(null);

    useEffect(() => {
        async function loadDebugInfo() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            setUserInfo(user);

            const id = await getUserEmpresaId();
            setEmpresaId(id);
        }
        loadDebugInfo();
    }, []);

    return (
        <div style={{ padding: '2rem' }}>
            <h1>Debug - Informações do Usuário</h1>

            <div style={{ marginTop: '2rem', background: '#f5f5f5', padding: '1rem', borderRadius: '8px' }}>
                <h2>Email:</h2>
                <p>{userInfo?.email}</p>

                <h2>User Metadata:</h2>
                <pre>{JSON.stringify(userInfo?.user_metadata, null, 2)}</pre>

                <h2>Empresa ID (via getUserEmpresaId):</h2>
                <p><strong>{empresaId || 'NULL'}</strong></p>
            </div>
        </div>
    );
}
