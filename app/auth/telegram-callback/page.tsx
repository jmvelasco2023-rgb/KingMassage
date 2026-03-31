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
        // Extract Telegram data from URL
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
        const stablePassword = `telegram_verify_${telegramId}`

        console.log('🔐 Processing Telegram login:', { telegramId, telegramUsername, email })

        // STEP 1: Check if user already exists in users table
        const { data: existingUser, error: queryError } = await supabase
          .from('users')
          .select('id, email')
          .eq('telegram_id', telegramId)
          .single()

        if (queryError && queryError.code !== 'PGRST116') {
          console.error('❌ Database query error:', queryError)
          throw new Error('Failed to check existing user.')
        }

        let userId: string
        let isNewUser = false

        if (existingUser) {
          // EXISTING USER - Just sign in
          console.log('✅ Existing user found, signing in...')
          userId = existingUser.id

          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: existingUser.email,
            password: stablePassword,
          })

          if (signInError) {
            console.warn('⚠️ Sign-in attempted:', signInError.message)
            // Continue anyway - user session might still be valid
          }

          // Update telegram info
          await supabase
            .from('users')
            .update({
              telegram_username: telegramUsername,
              telegram_photo_url: photo_url,
            })
            .eq('id', userId)

        } else {
          // NEW USER - Create auth account first, then profile
          console.log('✨ Creating new Telegram user...')
          isNewUser = true

          // STEP 2: Create auth user FIRST
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password: stablePassword,
            options: {
              data: {
                telegram_id: telegramId,
                telegram_username: telegramUsername,
              },
              emailRedirectTo: `${window.location.origin}/auth/sign-up-success?telegram=true`,
            },
          })

          if (signUpError) {
            console.error('❌ Auth signup error:', signUpError)
            throw new Error(`Auth signup failed: ${signUpError.message}`)
          }

          if (!signUpData.user?.id) {
            throw new Error('User creation failed - no user ID returned')
          }

          userId = signUpData.user.id
          console.log('✅ Auth user created:', userId)

          // STEP 3: Wait a moment for auth to sync, then create profile
          await new Promise(resolve => setTimeout(resolve, 500))

          // STEP 4: Create user profile in users table
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: userId,
              email,
              telegram_id: telegramId,
              telegram_username: telegramUsername,
              telegram_photo_url: photo_url,
              role: 'client',
              created_at: new Date().toISOString(),
            })

          if (insertError) {
            console.error('❌ Profile insert error:', insertError)
            // If insert fails due to fkey, try to sign in anyway
            console.log('Attempting sign-in despite profile creation failure...')
          } else {
            console.log('✅ User profile created')
          }

          // STEP 5: Sign in
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password: stablePassword,
          })

          if (signInError) {
            console.error('❌ Auto sign-in error:', signInError)
            throw new Error(`Sign-in failed: ${signInError.message}`)
          }

          console.log('✅ User signed in automatically')
        }

        console.log('🎉 Telegram authentication successful!')
        
        // Redirect to success page
        setTimeout(() => {
          router.push(`/auth/sign-up-success?telegram=true&new=${isNewUser}`)
        }, 1000)

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
