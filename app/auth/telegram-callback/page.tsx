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

        // STEP 1: Check if user already exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('telegram_id', telegramId)
          .single()

        if (existingUser) {
          console.log('✅ Existing Telegram user found')
          
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

        // NEW USER - Create auth account
        console.log('✨ Creating new Telegram user...')

        // STEP 2: Create auth user
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
          throw new Error('User creation failed - no ID returned')
        }

        const userId = signUpData.user.id
        console.log('✅ Auth user created:', userId)

        // STEP 3: Sign in to get authenticated session
        console.log('🔑 Signing in...')
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: stablePassword,
        })

        if (signInError) {
          console.error('❌ Sign-in error:', signInError)
          throw new Error(`Sign-in failed: ${signInError.message}`)
        }

        console.log('✅ User signed in - session established')

        // STEP 4: Wait a bit
        await new Promise(resolve => setTimeout(resolve, 2000))

        // STEP 5: Get current user to verify session
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        console.log('✅ Current user session verified:', currentUser?.id)

        if (!currentUser) {
          throw new Error('Session verification failed - user not authenticated')
        }

        // STEP 6: Create user profile using authenticated session
        console.log('📝 Creating user profile...')
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: currentUser.id, // Use the authenticated user ID
            email: currentUser.email || email,
            telegram_id: telegramId,
            telegram_username: telegramUsername,
            telegram_photo_url: photo_url,
            role: 'client',
            created_at: new Date().toISOString(),
          })

        if (insertError) {
          console.error('❌ Insert error:', insertError)
          throw new Error(`Profile creation failed: ${insertError.message}`)
        }

        console.log('✅ User profile created successfully')
        console.log('🎉 Telegram authentication complete!')

        setTimeout(() => {
          router.push(`/auth/sign-up-success?telegram=true&new=true`)
        }, 500)

      } catch (err) {
        console.error('❌ Telegram auth error:', err)
        const errorMessage = err instanceof Error ? err.message : 'Authentication failed.'
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
              className="flex-1 px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 font-medium"
            >
              Go Back
            </button>
            <button
              onClick={() => window.location.href = '/auth/login'}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
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
        <p className="text-sm text-slate-500">Setting up your profile...</p>
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
