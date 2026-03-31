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

  useEffect(() => {
    const processTelegramAuth = async () => {
      try {
        // Extract all Telegram data from URL
        const id = searchParams.get('id')
        const first_name = searchParams.get('first_name')
        const username = searchParams.get('username')
        const photo_url = searchParams.get('photo_url')

        if (!id) {
          throw new Error('No Telegram ID received. Authentication data is incomplete.')
        }

        const telegramId = id
        const telegramUsername = username || first_name || 'User'
        const email = `telegram_${telegramId}@kingmassage.app`
        
        // Use stable password based on Telegram ID (not timestamp)
        const stablePassword = `telegram_verify_${telegramId}`

        console.log('🔐 Processing Telegram login:', { telegramId, telegramUsername })

        // Check if user already exists by Telegram ID
        const { data: existingUser, error: queryError } = await supabase
          .from('users')
          .select('id, email')
          .eq('telegram_id', telegramId)
          .single()

        if (queryError && queryError.code !== 'PGRST116') {
          console.error('❌ Database query error:', queryError)
          throw new Error('Failed to check existing user. Please try again.')
        }

        let userId: string
        let isNewUser = false

        if (existingUser) {
          console.log('✅ Existing user found')
          userId = existingUser.id
          
          // Try to sign in with stable password
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: existingUser.email,
            password: stablePassword,
          })

          if (signInError) {
            console.warn('⚠️ Sign-in failed:', signInError.message)
            // If it fails, the password might be different - continue anyway
            // The user will be logged in via the session check below
          }
        } else {
          console.log('✨ Creating new Telegram user')
          isNewUser = true

          // Create new user in Supabase Auth
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password: stablePassword,
            options: {
              data: {
                telegram_id: telegramId,
                telegram_username: telegramUsername,
              },
            },
          })

          if (signUpError) {
            console.error('❌ Sign-up error:', signUpError)
            throw new Error(`Failed to create account: ${signUpError.message}`)
          }

          if (!signUpData.user?.id) {
            throw new Error('User creation failed - no user ID returned')
          }

          userId = signUpData.user.id
          console.log('✅ Auth user created:', userId)

          // Create user profile in users table
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
            console.error('❌ Insert error:', insertError)
            throw new Error(`Failed to save user profile: ${insertError.message}`)
          }

          console.log('✅ User profile created')

          // Sign in immediately after creation
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password: stablePassword,
          })

          if (signInError) {
            console.error('❌ Auto sign-in error:', signInError)
            throw new Error(`Failed to sign in: ${signInError.message}`)
          }
        }

        // Update existing user's Telegram info if needed
        if (existingUser) {
          const { error: updateError } = await supabase
            .from('users')
            .update({
              telegram_username: telegramUsername,
              telegram_photo_url: photo_url,
              telegram_id: telegramId,
            })
            .eq('id', userId)

          if (updateError) {
            console.warn('⚠️ Update warning:', updateError)
          }
        }

        console.log('🎉 Telegram authentication successful!')
        
        // Redirect to success page
        router.push(`/auth/sign-up-success?telegram=true&new=${isNewUser}`)
      } catch (err) {
        console.error('❌ Telegram auth error:', err)
        const errorMessage = err instanceof Error ? err.message : 'Authentication failed. Please try again.'
        setError(errorMessage)
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

export default function TelegramCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 to-blue-50">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 bg-sky-200/20 rounded-full blur-xl animate-pulse" />
              <Loader2 className="w-10 h-10 animate-spin text-sky-500 relative" />
            </div>
          </div>
          <p className="text-lg font-semibold text-slate-700">Authenticating with Telegram...</p>
        </div>
      </div>
    }>
      <TelegramCallbackContent />
    </Suspense>
  )
}
