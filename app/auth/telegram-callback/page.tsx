'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AlertCircle, Loader2 } from 'lucide-react'

function TelegramCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // PATH A: User exists, just log them in
  const handleLogin = async (email, password, username, photo, userId) => {
    console.log('🔄 User found. Logging in...')
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) throw signInError

    // Update their photo/username in case they changed it on Telegram
    await supabase.from('users').update({ 
      telegram_username: username, 
      telegram_photo_url: photo 
    }).eq('id', userId)

    router.push(`/auth/sign-up-success?telegram=true&new=false`)
  }

  // PATH B: User is new, create account
  const handleSignup = async (email, password, tgId, tgName) => {
    console.log('✨ New user. Signing up...')
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { telegram_id: tgId, telegram_username: tgName }
      }
    })
    
    if (signUpError) throw signUpError

    // Wait for trigger to create profile row
    await new Promise(resolve => setTimeout(resolve, 2000))
    router.push(`/auth/sign-up-success?telegram=true&new=true`)
  }

  useEffect(() => {
    const processAuth = async () => {
      try {
        const id = searchParams.get('id')
        const first_name = searchParams.get('first_name')
        const username = searchParams.get('username')
        const photo_url = searchParams.get('photo_url')

        if (!id) throw new Error('Missing Telegram ID')

        const telegramId = id
        const telegramUsername = username || first_name || 'User'
        const email = `telegram_${telegramId}@kingmassage.app`
        const stablePassword = `telegram_verify_${telegramId}`

        // Check if user exists in your public table
        const { data: profile } = await supabase
          .from('users')
          .select('id')
          .eq('telegram_id', telegramId)
          .single()

        if (profile) {
          await handleLogin(email, stablePassword, telegramUsername, photo_url, profile.id)
        } else {
          await handleSignup(email, stablePassword, telegramId, telegramUsername)
        }

      } catch (err: any) {
        console.error('Auth Error:', err)
        setError(err.message)
        setIsProcessing(false)
      }
    }
    processAuth()
  }, [router, supabase, searchParams])

  if (!isProcessing && error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-slate-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-sm w-full border border-red-100">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Authentication Failed</h2>
          <p className="text-sm text-slate-500 mb-6">{error}</p>
          <button onClick={() => window.location.href = '/auth/login'} className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-slate-600 font-medium">Setting up King's Massage account...</p>
      </div>
    </div>
  )
}

export default function TelegramCallbackPage() {
  return (
    <Suspense fallback={null}>
      <TelegramCallbackContent />
    </Suspense>
  )
}
