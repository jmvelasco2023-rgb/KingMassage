'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function Page() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // ✅ Load Telegram widget
  useEffect(() => {
    const loadTelegramWidget = () => {
      const script = document.createElement('script')
      script.src = 'https://telegram.org/js/telegram-widget.js?23'
      script.async = true
      script.onload = () => {
        // @ts-ignore - Telegram is injected globally
        if (window.Telegram?.Login?.bind) {
          // @ts-ignore
          window.Telegram.Login.bind(
            document.getElementById('telegram-signup-widget'),
            'KingMassageBot',
            {
              size: 'large',
              onAuth: (user: any) => handleTelegramSignUp(user),
              requestAccess: 'write',
            }
          )
        }
      }
      document.body.appendChild(script)
    }

    loadTelegramWidget()
  }, [])

  // ✅ Handle Telegram signup
  const handleTelegramSignUp = async (telegramUser: any) => {
    try {
      setIsLoading(true)
      setError(null)

      const telegramId = telegramUser.id
      const telegramUsername = telegramUser.username || telegramUser.first_name
      const email = `telegram_${telegramId}@kingmassage.app`
      const tempPassword = `telegram_${telegramId}_${Date.now()}`

      // Create new user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: tempPassword,
        options: {
          data: {
            telegram_id: telegramId,
            telegram_username: telegramUsername,
          },
          emailRedirectTo:
            process.env.NEXT_PUBLIC_SIGNUP_REDIRECT_URL ||
            `${window.location.origin}/auth/sign-up-success?telegram=true`,
        },
      })

      if (signUpError) throw signUpError

      if (signUpData.user) {
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: signUpData.user.id,
            email,
            telegram_id: telegramId,
            telegram_username: telegramUsername,
            role: 'client',
          })

        if (insertError) throw insertError
      }

      router.push('/auth/sign-up-success?telegram=true')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Telegram sign-up failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setIsLoading(false)
      return
    }

    if (password !== repeatPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_SIGNUP_REDIRECT_URL ||
            `${window.location.origin}/auth/sign-up-success?mobile=true`,
        },
      })
      if (error) throw error
      router.push('/auth/sign-up-success?mobile=true')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during sign-up')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo:
            process.env.NEXT_PUBLIC_SIGNUP_REDIRECT_URL ||
            `${window.location.origin}/auth/sign-up-success?mobile=true`,
          pkceVerifierStorage: 'cookie',
          flowType: 'pkce',
        },
      })
      if (error) throw error
      if (data?.url) window.location.replace(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-up failed - try clearing cache')
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-4 sm:p-6 bg-gray-50">
      <div className="w-full max-w-xs sm:max-w-sm">
        <Card className="shadow-md w-full">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl font-bold text-center">Sign up</CardTitle>
            <CardDescription className="text-center text-sm">
              Create a new account to book appointments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="w-full text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="repeat-password" className="text-sm font-medium">Repeat Password</Label>
                <Input
                  id="repeat-password"
                  type="password"
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full text-sm"
                />
              </div>

              {error && <p className="text-red-500 text-xs sm:text-sm font-medium text-center">{error}</p>}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-white font-medium text-sm py-3 rounded-xl transition-all hover:scale-105"
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Sign up'}
              </Button>

              <div className="flex items-center gap-2 py-3">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-xs sm:text-sm text-gray-500">Or continue with</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              {/* Google Button */}
              <Button
                type="button"
                onClick={handleGoogleSignUp}
                className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-medium text-sm py-3 rounded-xl transition-all"
                disabled={isGoogleLoading}
              >
                <svg className="mr-2 h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {isGoogleLoading ? 'Processing...' : 'Continue with Google'}
              </Button>

              {/* ✅ TELEGRAM WIDGET - FIXED */}
              <div className="flex items-center gap-2 py-3">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-xs sm:text-sm text-gray-500">Or</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              {/* Telegram Widget Container - INLINE SCRIPT */}
              <div className="flex justify-center">
                <div id="telegram-signup-widget"></div>
                <script
                  async
                  src="https://telegram.org/js/telegram-widget.js?23"
                  data-telegram-login="KingMassageBot"
                  data-size="large"
                  data-auth-url="https://kingmassage-2jw1.onrender.com/auth/telegram-callback"
                  data-request-access="write"
                ></script>
              </div>

              <div className="mt-4 text-center text-xs sm:text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/auth/login" className="underline text-primary font-medium">
                  Login here
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
