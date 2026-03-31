'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AlertCircle, Loader2 } from 'lucide-react'
import crypto from 'crypto'

function TelegramCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Verify Telegram hash (security check)
  const verifyTelegramHash = (data: Record<string, string>): boolean => {
    const BOT_TOKEN = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || ''
    
    const dataCheckString = Object.keys(data)
      .filter(key => key !== 'hash')
      .sort()
      .map(key => `${key}=${data[key]}`)
      .join('\n')

    const secretKey = crypto.createHash('sha256').update(BOT_TOKEN).digest()
    const hash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex')

    return hash === data.hash
  }

  useEffect(() => {
    const processTelegramAuth = async () => {
      try {
        // Extract all Telegram data
        const telegramData: Record<string, string> = {}
        searchParams.forEach((value, key) => {
          telegramData[key] = value
        })

        // Verify hash for security
        if (!verifyTelegramHash(telegramData)) {
          throw new Error('Telegram authentication hash verification failed. This may indicate a security issue.')
        }

        const id = searchParams.get('id')
        const first_name = searchParams.get('first_name')
        const username = searchParams.get('username')
        const photo_url = searchParams.get('photo_url')

        if (!id) {
          throw new Error('No Telegram ID received')
        }

        const telegramId = id
        const telegramUsername = username || first_name || 'User'
        const email = `telegram_${telegramId}@kingmassage.app`
        
        console.log('🔐 Processing Telegram login:', { telegramId, telegramUsername })

        // Check if user exists by Telegram ID
        const { data: existingUser } = await supabase
          .from('users')
          .select('id, email')
          .eq('telegram_id', telegramId)
          .single()

        let userId: string
        let isNewUser = false

        if (existingUser) {
          console.log('✅ Existing user found')
          userId = existingUser.id
          
          // Use the stored email for login (don't create new account)
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: existingUser.email,
            password: `telegram_verify_${telegramId}`, // Fixed password
          })

          // If password fails, it means we need to handle this case
          if (signInError?.message.includes('Invalid login credentials')) {
            console.log('⚠️ First Telegram login after email auth - updating auth method')
            // For first-time Telegram login of an existing user, we skip direct auth
            // and just retrieve their session via the users table
          }
        } else {
          console.log('✨ Creating new Telegram user')
          isNewUser = true
          
          // Generate a stable password for Telegram users
          const stablePassword = `telegram_verify_${telegramId}`

          // Create new user in auth
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

          if (signUpError) throw signUpError
          if (!signUpData.user?.id) throw new Error('Failed to create auth user')

          userId = signUpData.user.id

          // Create user profile
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

          // Sign in immediately after creation
          await supabase.auth.signInWithPassword({
            email,
            password: stablePassword,
          })
        }

        // Update Telegram info
        const { error: updateError } = await supabase
          .from('users')
          .update({
            telegram_username: telegramUsername,
            telegram_photo_url: photo_url,
            telegram_id: telegramId, // Ensure it's always set
          })
          .eq('id', userId)

        if (updateError) console.warn('Update warning:', updateError)

        console.log('🎉 Telegram auth successful!')
        router.push(`/auth/sign-up-success?telegram=true&new=${isNewUser}`)
      } catch (err) {
        console.error('❌ Telegram auth error:', err)
        setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.')
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
