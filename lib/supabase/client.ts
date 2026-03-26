import { createBrowserClient, type SupabaseClient } from '@supabase/ssr'

// ❌ Do NOT use a singleton - creates conflicts in prerendering
// ✅ Create a NEW client instance every time
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    console.error('[Supabase Client] Missing environment variables')
    throw new Error('Supabase not configured')
  }

  // ✅ Explicitly configure cookie methods to fix prerender error
  return createBrowserClient(url, key, {
    cookies: {
      getAll() {
        if (typeof document === 'undefined') return []
        return document.cookie.split('; ').map(c => {
          const [name, value] = c.split('=')
          return { name, value }
        })
      },
      setAll(cookiesToSet) {
        if (typeof document === 'undefined') return
        cookiesToSet.forEach(({ name, value, options }) => {
          document.cookie = `${name}=${value}; path=/; secure=${process.env.NODE_ENV === 'production'}`
        })
      },
    },
  })
}
