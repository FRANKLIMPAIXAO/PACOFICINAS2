// Lazy loading do Supabase client para evitar validação durante build

let cachedClient: any = null;

export function createClient() {
    // Em ambiente de build/prerender sem variáveis, retorna mock
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        // Mock client para build time
        const chainable: any = () => chainable;
        Object.assign(chainable, {
            eq: chainable, neq: chainable, gt: chainable, gte: chainable,
            lt: chainable, lte: chainable, like: chainable, ilike: chainable,
            is: chainable, in: chainable, order: chainable, limit: chainable,
            single: chainable, maybeSingle: chainable, select: chainable,
            insert: chainable, update: chainable, delete: chainable, upsert: chainable,
            then: (resolve: any) => resolve({ data: null, error: null }),
        });
        return {
            auth: {
                getUser: async () => ({ data: { user: null }, error: null }),
                getSession: async () => ({ data: { session: null }, error: null }),
                onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
            },
            from: () => chainable,
        } as any;
    }

    // Usa client em cache se disponível
    if (cachedClient) return cachedClient;

    // Import dinâmico para evitar avaliação durante build
    const { createBrowserClient } = require('@supabase/ssr');
    cachedClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
    return cachedClient;
}

