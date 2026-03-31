'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export default function TelegramCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const processTelegramAuth = async () => {
      try {
        // Extract Telegram data from URL
        const id = searchParams.get('id')
        const first_name = searchParams.get('first_name')
        const last_name = searchParams.get('last_name')
        const username = searchParams.get('username')
        const photo_url = searchParams.get('photo_url')
        const auth_date = searchParams.get('auth_date')
        const hash = searchParams.get('hash')

        if (!id) {
          throw new Error('No Telegram authentication data received')
        }

        const telegramId = id
        const telegramUsername = username || first_name || 'User'
        const email = `telegram_${telegramId}@kingmassage.app`
        const tempPassword = `telegram_${telegramId}_${Date.now()}`

        // Check if user already exists in our database
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('telegram_id', telegramId)
          .single()

        let userId: string

        if (existingUser) {
          // User exists, try to sign in
          const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password: tempPassword,
          })

          if (signInError && signInError.message.includes('Invalid login credentials')) {
            // Update password if it changed
            await supabase.auth.updateUser({ password: tempPassword })
          } else if (signInError) {
            throw signInError
          }

          userId = existingUser.id
        } else {
          // Create new user
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password: tempPassword,
            options: {
              data: {
                telegram_id: telegramId,
                telegram_username: telegramUsername,
              },
            },
          })

          if (signUpError) throw signUpError
          if (!signUpData.user?.id) throw new Error('Failed to create user')

          userId = signUpData.user.id

          // Save to users table
          await supabase
            .from('users')
            .insert({
              id: userId,
              email,
              telegram_id: telegramId,
              telegram_username: telegramUsername,
              telegram_photo_url: photo_url,
              role: 'client',
            })
        }

        // Update existing user's Telegram info if needed
        if (existingUser) {
          await supabase
            .from('users')
            .update({
              telegram_username: telegramUsername,
              telegram_photo_url: photo_url,
            })
            .eq('id', userId)
        }

        // Store Telegram info in session
        sessionStorage.setItem('telegram_id', telegramId)
        sessionStorage.setItem('telegram_username', telegramUsername)

        // Redirect based on whether it was login or signup
        const isNewUser = !existingUser
        router.push(`/auth/sign-up-success?telegram=true&new=${isNewUser}`)
      } catch (err) {
        console.error('Telegram auth error:', err)
        setError(err instanceof Error ? err.message : 'Authentication failed')
        setIsProcessing(false)
      }
    }

    processTelegramAuth()
  }, [router, supabase, searchParams])

  if (isProcessing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 to-blue-50">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 bg-sky-200/20 rounded-full blur-xl animate-pulse" />
              <Loader2 className="w-10 h-10 animate-spin text-sky-500 relative" />
            </div>
          </div>
          <p className="text-lg font-semibold text-slate-700">Authenticating with Telegram...</p>
          <p className="text-sm text-slate-500">Please wait while we set up your account</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="text-center space-y-4 max-w-md p-8 bg-white rounded-2xl shadow-lg">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="text-lg font-semibold text-red-600">Authentication Failed</p>
          <p className="text-sm text-slate-600">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return null
}
