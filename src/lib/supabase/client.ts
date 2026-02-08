import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        // Durante build/prerender, retorna um client dummy que não faz nada
        // Isso evita erros de build no Vercel
        if (typeof window === 'undefined') {
            return {
                auth: {
                    getUser: async () => ({ data: { user: null }, error: null }),
                    getSession: async () => ({ data: { session: null }, error: null }),
                },
                from: () => ({
                    select: () => ({ data: null, error: null }),
                    insert: () => ({ data: null, error: null }),
                    update: () => ({ data: null, error: null }),
                    delete: () => ({ data: null, error: null }),
                }),
            } as any;
        }
        throw new Error('Supabase URL and Anon Key are required');
    }

    return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
