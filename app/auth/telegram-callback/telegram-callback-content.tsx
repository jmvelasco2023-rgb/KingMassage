'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AlertCircle } from 'lucide-react'

export default function TelegramCallbackContent() {
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

        console.log('🔐 Telegram Auth Data:', { telegramId, telegramUsername, email })

        // Check if user already exists in our database
        const { data: existingUser, error: queryError } = await supabase
          .from('users')
          .select('id')
          .eq('telegram_id', telegramId)
          .single()

        if (queryError && queryError.code !== 'PGRST116') {
          // PGRST116 means no rows found, which is fine
          console.error('Query error:', queryError)
        }

        let userId: string

        if (existingUser) {
          console.log('✅ Existing user found, signing in...')
          // User exists, try to sign in
          const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password: tempPassword,
          })

          if (signInError) {
            if (signInError.message.includes('Invalid login credentials')) {
              // Try updating password
              console.log('⚠️ Password mismatch, attempting update...')
              const { error: updateError } = await supabase.auth.updateUser({ password: tempPassword })
              if (updateError) throw updateError
            } else {
              throw signInError
            }
          }

          userId = existingUser.id
        } else {
          console.log('✨ New user detected, creating account...')
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
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: userId,
              email,
              telegram_id: telegramId,
              telegram_username: telegramUsername,
              telegram_photo_url: photo_url,
              role: 'client',
            })

          if (insertError) {
            console.error('Insert error:', insertError)
            throw insertError
          }
        }

        // Update existing user's Telegram info if needed
        if (existingUser) {
          const { error: updateError } = await supabase
            .from('users')
            .update({
              telegram_username: telegramUsername,
              telegram_photo_url: photo_url,
            })
            .eq('id', userId)

          if (updateError) console.warn('Update warning:', updateError)
        }

        // Store Telegram info in session
        sessionStorage.setItem('telegram_id', telegramId)
        sessionStorage.setItem('telegram_username', telegramUsername)

        console.log('🎉 Authentication successful! Redirecting...')

        // Redirect based on whether it was login or signup
        const isNewUser = !existingUser
        router.push(`/auth/sign-up-success?telegram=true&new=${isNewUser}`)
      } catch (err) {
        console.error('❌ Telegram auth error:', err)
        setError(err instanceof Error ? err.message : 'Authentication failed')
        setIsProcessing(false)
      }
    }

    processTelegramAuth()
  }, [router, supabase, searchParams])

  if (!isProcessing && error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
        <div className="text-center space-y-4 max-w-md p-8 bg-white rounded-2xl shadow-lg">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="text-lg font-semibold text-red-600">❌ Authentication Failed</p>
          <p className="text-sm text-slate-600 break-words">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => window.history.back()}
              className="flex-1 px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors font-medium"
            >
              Go Back
            </button>
            <button
              onClick={() => window.location.href = '/auth/login'}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
            >
              Login Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
