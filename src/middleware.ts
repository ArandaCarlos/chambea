import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: any) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: any) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Protected routes that require authentication
    const protectedPaths = ['/client', '/pro', '/admin', '/profile']
    const isProtectedPath = protectedPaths.some(path =>
        request.nextUrl.pathname.startsWith(path)
    )

    // Auth pages (login, register)
    const authPaths = ['/login', '/register']
    const isAuthPath = authPaths.some(path =>
        request.nextUrl.pathname.startsWith(path)
    )

    // If trying to access protected route without auth, redirect to login
    if (isProtectedPath && !user) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Role-based access control
    if (user && isProtectedPath) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('user_type')
            .eq('user_id', user.id)
            .single()

        const userType = profile?.user_type

        // Prevent professionals from accessing client routes
        if (userType === 'professional' && request.nextUrl.pathname.startsWith('/client')) {
            return NextResponse.redirect(new URL('/pro/dashboard', request.url))
        }

        // Prevent clients from accessing professional routes
        if (userType === 'client' && request.nextUrl.pathname.startsWith('/pro')) {
            return NextResponse.redirect(new URL('/client/dashboard', request.url))
        }

        // Prevent non-admins from accessing admin routes
        if (userType !== 'admin' && request.nextUrl.pathname.startsWith('/admin')) {
            if (userType === 'professional') {
                return NextResponse.redirect(new URL('/pro/dashboard', request.url))
            } else {
                return NextResponse.redirect(new URL('/client/dashboard', request.url))
            }
        }
    }

    // If already logged in and trying to access auth pages, redirect to dashboard
    if (isAuthPath && user) {
        // Get user profile to determine which dashboard
        const { data: profile } = await supabase
            .from('profiles')
            .select('user_type')
            .eq('user_id', user.id)
            .single()

        if (profile?.user_type === 'professional') {
            return NextResponse.redirect(new URL('/pro/dashboard', request.url))
        } else if (profile?.user_type === 'admin') {
            return NextResponse.redirect(new URL('/admin/dashboard', request.url))
        } else {
            return NextResponse.redirect(new URL('/client/dashboard', request.url))
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
