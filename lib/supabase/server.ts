import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Server-side Supabase client for Next.js App Router (server components/API routes)
 * Avoid global instances - create a new client per request for Fluid compute safety
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => 
              cookieStore.set(name, value, options)
            )
          } catch (error) {
            // Suppress errors from Server Components (cookies can't be set there)
            if (process.env.NODE_ENV === 'development') {
              console.warn('Could not set cookies from Server Component:', error)
            }
          }
        },
      },
    }
  )
}
