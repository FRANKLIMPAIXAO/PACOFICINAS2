import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
    if (user && (isPublicRoute || request.nextUrl.pathname === '/')) {
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
