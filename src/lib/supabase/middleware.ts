import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Se variáveis não estiverem disponíveis (durante build), apenas continua
    if (!supabaseUrl || !supabaseAnonKey) {
        return NextResponse.next({ request });
    }

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

    // Refresh session if expired
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Rotas públicas
    const publicRoutes = ['/login', '/signup', '/forgot-password'];
    const isPublicRoute = publicRoutes.some((route) =>
        request.nextUrl.pathname.startsWith(route)
    );

    // Se não está logado e não é rota pública, redireciona para login
    if (!user && !isPublicRoute) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // Se está logado e tentando acessar login ou root, redireciona para dashboard
    // MAS apenas se o usuário tiver empresa_id (para evitar loop de redirecionamento)
    if (user && (isPublicRoute || request.nextUrl.pathname === '/')) {
        // Se o usuário não tem empresa_id, permite ficar na página de login
        if (!user.user_metadata?.empresa_id) {
            // Não redirecionar - deixar o usuário na página de login
            return supabaseResponse;
        }
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
    }

    // Validar se usuário tem empresa_id (exceto para rotas públicas)
    if (user && !isPublicRoute && !user.user_metadata?.empresa_id) {
        console.error('⚠️ SEGURANÇA: Usuário sem empresa_id tentou acessar:', {
            email: user.email,
            path: request.nextUrl.pathname,
            metadata: user.user_metadata
        });
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

