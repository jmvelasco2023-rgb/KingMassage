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
          throw new Error('No Telegram ID received.')
        }

        const telegramId = id
        const telegramUsername = username || first_name || 'User'
        const email = `telegram_${telegramId}@kingmassage.app`
        const stablePassword = `telegram_verify_${telegramId}`

        console.log('🔐 Processing Telegram login:', { telegramId, telegramUsername, email })

        // STEP 1: Check if user already exists in users table
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('telegram_id', telegramId)
          .single()

        if (existingUser) {
          // EXISTING USER - Just sign in
          console.log('✅ Existing Telegram user found')
          
          // Try to sign in with stable password
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password: stablePassword,
          })

          if (!signInError) {
            console.log('✅ Existing user signed in')
          } else {
            console.warn('⚠️ Sign-in failed, but continuing...', signInError.message)
          }

          // Update user info
          await supabase
            .from('users')
            .update({
              telegram_username: telegramUsername,
              telegram_photo_url: photo_url,
            })
            .eq('id', existingUser.id)

          console.log('🎉 Existing user authenticated!')
          setTimeout(() => {
            router.push(`/auth/sign-up-success?telegram=true&new=false`)
          }, 500)
          return
        }

        // NEW USER - Create auth account first
        console.log('✨ Creating new Telegram user...')

        // STEP 2: Create auth user in Supabase Auth
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
          console.error('❌ Auth signup error:', signUpError)
          throw new Error(`Auth signup failed: ${signUpError.message}`)
        }

        if (!signUpData.user?.id) {
          throw new Error('User creation failed')
        }

        const userId = signUpData.user.id
        console.log('✅ Auth user created with ID:', userId)

        // STEP 3: Verify auth user exists before creating profile
        const { data: authCheck } = await supabase.auth.getUser()
        console.log('Auth check result:', authCheck.user?.id)

        // STEP 4: Wait longer for database sync (2 seconds)
        await new Promise(resolve => setTimeout(resolve, 2000))

        // STEP 5: Create user profile with retry logic
        let insertSuccess = false
        let retries = 0
        const maxRetries = 3

        while (!insertSuccess && retries < maxRetries) {
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

          if (!insertError) {
            insertSuccess = true
            console.log('✅ User profile created successfully')
          } else {
            retries++
            console.warn(`⚠️ Insert attempt ${retries} failed:`, insertError.message)
            
            if (retries < maxRetries) {
              // Wait before retrying
              await new Promise(resolve => setTimeout(resolve, 1000))
            } else {
              throw new Error(`Failed to create profile after ${maxRetries} attempts: ${insertError.message}`)
            }
          }
        }

        // STEP 6: Sign in the new user
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: stablePassword,
        })

        if (signInError) {
          console.error('❌ Auto sign-in error:', signInError)
          throw new Error(`Sign-in failed: ${signInError.message}`)
        }

        console.log('✅ New user signed in successfully')
        console.log('🎉 Telegram authentication complete!')

        setTimeout(() => {
          router.push(`/auth/sign-up-success?telegram=true&new=true`)
        }, 500)

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
