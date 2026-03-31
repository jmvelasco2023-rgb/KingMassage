'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function TelegramCallbackPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const processTelegramAuth = async () => {
      try {
        // Get data from Telegram Bot API
        const params = new URLSearchParams(window.location.search)
        const data = params.get('data')
        
        if (!data) {
          throw new Error('No Telegram data received')
        }

        // Parse Telegram data
        const telegramData = JSON.parse(decodeURIComponent(data))
        const telegramId = telegramData.id
        const telegramUsername = telegramData.username || telegramData.first_name
        const email = `telegram_${telegramId}@kingmassage.app`

        // Check if user already exists
        const { data: existingUser, error: existingError } = await supabase
          .from('users')
          .select('id')
          .eq('telegram_id', telegramId)
          .single()

        if (!existingError && existingUser) {
          // User exists, sign them in
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password: `telegram_${telegramId}_password`,
          })
          if (!signInError) {
            router.push('/book')
            return
          }
        }

        // Create new user
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password: `telegram_${telegramId}_password`,
          options: {
            data: {
              telegram_id: telegramId,
              telegram_username: telegramUsername,
            },
          },
        })

        if (signUpError) throw signUpError

        // Save Telegram ID to users table
        if (signUpData.user) {
          await supabase
            .from('users')
            .insert({
              id: signUpData.user.id,
              email,
              telegram_id: telegramId,
              telegram_username: telegramUsername,
              role: 'client',
            })
        }

        // Store telegram info in session
        sessionStorage.setItem('telegram_id', telegramId)
        sessionStorage.setItem('telegram_username', telegramUsername)

        router.push('/auth/sign-up-success?telegram=true')
      } catch (err) {
        console.error('Telegram auth error:', err)
        setError(err instanceof Error ? err.message : 'Authentication failed')
        setIsProcessing(false)
      }
    }

    processTelegramAuth()
  }, [router, supabase])

  if (isProcessing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-sky-500 mx-auto" />
          <p className="text-lg font-semibold text-slate-700">Authenticating with Telegram...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md p-6 bg-white rounded-lg shadow-lg">
          <p className="text-lg font-semibold text-red-600">Authentication Failed</p>
          <p className="text-sm text-slate-600">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-sky-500 text-white rounded hover:bg-sky-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return null
}
