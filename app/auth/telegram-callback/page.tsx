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

  // --- HELPER: LOGIN FLOW ---
  const handleExistingUser = async (email, password, username, photo, userId) => {
    console.log('🔄 Running Login Flow for:', username)
    const { error: signInError } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    })
    
    if (signInError) throw signInError

    // Sync latest Telegram info to the public profile
    await supabase
      .from('users')
      .update({ telegram_username: username, telegram_photo_url: photo })
      .eq('id', userId)

    router.push(`/auth/sign-up-success?telegram=true&new=false`)
  }

  // --- HELPER: SIGNUP FLOW ---
  const handleNewUser = async (email, password, tgId, tgName) => {
    console.log('✨ Running Signup Flow for:', tgName)
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { telegram_id: tgId, telegram_username: tgName }
      }
    })

    if (signUpError) throw signUpError

    // Wait for SQL Trigger to finish creating the row
    await new Promise(resolve => setTimeout(resolve, 2000))
    router.push(`/auth/sign-up-success?telegram=true&new=true`)
  }

  useEffect(() => {
    const processTelegramAuth = async () => {
      try {
        const id = searchParams.get('id')
        const first_name = searchParams.get('first_name')
        const username = searchParams.get('username')
        const photo_url = searchParams.get('photo_url')

        if (!id) throw new Error('No Telegram ID found in URL.')

        const telegramId = id
        const telegramUsername = username || first_name || 'User'
        const email = `telegram_${telegramId}@kingmassage.app`
        const stablePassword = `telegram_verify_${telegramId}`

        // Check database to see if user exists
        const { data: profile } = await supabase
          .from('users')
          .select('id')
          .eq('telegram_id', telegramId)
          .single()

        if (profile) {
          await handleExistingUser(email, stablePassword, telegramUsername, photo_url, profile.id)
        } else {
          await handleNewUser(email, stablePassword, telegramId, telegramUsername)
        }

      } catch (err: any) {
        console.error('❌ Auth failure:', err)
        setError(err.message || 'Authentication failed.')
        setIsProcessing(false)
      }
    }

    processTelegramAuth()
  }, [router, supabase, searchParams])

  if (!isProcessing && error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="text-center space-y-4 max-w-md p-8 bg-white rounded-2xl shadow-xl border border-red-100">
          <AlertCircle className="w-14 h-14 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-800">Authentication Error</h2>
          <p className="text-sm text-slate-500 font-mono bg-slate-50 p-2 rounded">{error}</p>
          <div className="flex gap-2 pt-4">
            <button
              onClick={() => window.location.href = '/auth/login'}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 active:scale-95 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-400/20 blur-2xl rounded-full animate-pulse" />
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto relative" />
        </div>
        <div>
          <p className="text-xl font-bold text-slate-800">King's Massage</p>
          <p className="text-slate-500 animate-pulse">Securing your session...</p>
        </div>
      </div>
    </div>
  )
}

export default function TelegramCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-500" /></div>}>
      <TelegramCallbackContent />
    </Suspense>
  )
}
