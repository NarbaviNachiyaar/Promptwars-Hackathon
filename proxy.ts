import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => request.cookies.getAll(), setAll: (items) => { items.forEach(({ name, value }) => request.cookies.set(name, value)); response = NextResponse.next({ request }); items.forEach(({ name, value, options }) => response.cookies.set(name, value, options)) } } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user && ['/dashboard', '/patients', '/documents', '/settings'].some((path) => request.nextUrl.pathname.startsWith(path))) return NextResponse.redirect(new URL(`/auth/login?next=${encodeURIComponent(request.nextUrl.pathname)}`, request.url))
  return response
}

export const config = { matcher: ['/dashboard/:path*', '/patients/:path*', '/documents/:path*', '/settings/:path*'] }
