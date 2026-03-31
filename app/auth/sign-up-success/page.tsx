'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Zap } from 'lucide-react'

export default function Page() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isTelegram, setIsTelegram] = useState(false)
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setIsLoggedIn(true)
    }
    
    const telegramParam = searchParams.get('telegram')
    if (telegramParam === 'true') {
      setIsTelegram(true)
    }
    
    checkSession()
  }, [supabase, searchParams])

  return (
    <div className="flex min-h-svh items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
      <Card className="mobile-lock p-8 shadow-lg max-w-md w-full">
        <div className="text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 bg-emerald-200/30 rounded-full blur-lg animate-pulse" />
              <CheckCircle className="w-12 h-12 text-emerald-600 relative" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-slate-900">Thank you for signing up!</h2>

          {/* Telegram Badge */}
          {isTelegram && (
            <div className="flex justify-center">
              <Badge className="bg-sky-100 text-sky-800 px-4 py-2 border border-sky-300 text-sm font-bold gap-2 flex items-center">
                <Zap className="w-4 h-4" />
                Telegram Connected ✓
              </Badge>
            </div>
          )}

          {/* Description */}
          <p className="text-slate-600 text-sm leading-relaxed">
            {isTelegram 
              ? "Your account is ready! You'll receive booking confirmations directly on Telegram."
              : "Your account is ready! Let's get started with your first booking."}
          </p>

          {/* Button */}
          <Link href="/book" className="block w-full pt-2">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 font-bold text-base rounded-xl transition-all hover:scale-105">
              {isLoggedIn ? '🎉 Go to Bookings' : '📅 Proceed to Booking'}
            </Button>
          </Link>

          {/* Support Links */}
          <div className="text-xs text-slate-500 space-y-2 pt-4 border-t border-slate-200">
            <p>Questions? <Link href="/" className="text-emerald-600 font-semibold hover:underline">Contact Support</Link></p>
          </div>
        </div>
      </Card>
    </div>
  )
}
