import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Se variáveis não estiverem disponíveis (durante build), apenas continua
    if (!supabaseUrl || !supabaseAnonKey) {
        return NextResponse.next({ request });
    }

    // Rotas públicas - verificar ANTES de qualquer chamada ao Supabase
    const publicRoutes = ['/login', '/signup', '/forgot-password'];
    const isPublicRoute = publicRoutes.some((route) =>
        request.nextUrl.pathname.startsWith(route)
    );

    // Import dinâmico para evitar validação durante build
    const { createServerClient } = await import('@supabase/ssr');

    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Usar getSession() para evitar chamada de rede extra (mais rápido no Edge)
    // getSession() lê do cookie JWT local - sem latência de rede
    const {
        data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user ?? null;

    // Se não está logado e não é rota pública, redireciona para login
    if (!user && !isPublicRoute) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // Se está logado e tentando acessar login ou root, redireciona para dashboard
    if (user && (isPublicRoute || request.nextUrl.pathname === '/')) {
        // Se o usuário não tem empresa_id, não redirecionar
        if (!user.user_metadata?.empresa_id) {
            return supabaseResponse;
        }
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
    }

    // Validar se usuário tem empresa_id (exceto para rotas públicas)
    if (user && !isPublicRoute && !user.user_metadata?.empresa_id) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('error', 'no_company');
        return NextResponse.redirect(url);
    }

    // Proteger rota de configurações (Apenas Admin)
    if (user && request.nextUrl.pathname.startsWith('/configuracoes')) {
        const perfil = user.user_metadata?.perfil;
        if (perfil !== 'admin') {
            const url = request.nextUrl.clone();
            url.pathname = '/dashboard';
            return NextResponse.redirect(url);
        }
    }

    return supabaseResponse;
}
