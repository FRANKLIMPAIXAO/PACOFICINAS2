// Lazy loading do Supabase server client para evitar validação durante build

// Mock client para uso durante build/prerender
function createMockClient() {
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
        },
        from: () => chainable,
    } as any;
}

export async function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Durante build, retorna mock para evitar erro de prerender
    if (!supabaseUrl || !supabaseAnonKey) {
        return createMockClient();
    }

    // Import dinâmico para evitar avaliação durante build
    const { cookies } = await import('next/headers');
    const { createServerClient } = await import('@supabase/ssr');

    const cookieStore = await cookies();

    return createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // Ignorado em Server Components
                    }
                },
            },
        }
    );
}

export async function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Durante build, retorna mock para evitar erro de prerender
    if (!supabaseUrl || !serviceRoleKey) {
        return createMockClient();
    }

    // Import dinâmico para evitar avaliação durante build
    const { cookies } = await import('next/headers');
    const { createServerClient } = await import('@supabase/ssr');

    const cookieStore = await cookies();

    return createServerClient(
        supabaseUrl,
        serviceRoleKey,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // Ignorado em Server Components
                    }
                },
            },
        }
    );
}

