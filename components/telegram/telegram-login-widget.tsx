'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

interface TelegramLoginWidgetProps {
  containerId: string
  botUsername?: string
  redirectUrl?: string
}

export function TelegramLoginWidget({
  containerId,
  botUsername = 'KingMassageBot',
  redirectUrl = 'https://kingmassage-s6jh.onrender.com/auth/telegram-callback',
}: TelegramLoginWidgetProps) {
  const [scriptLoaded, setScriptLoaded] = useState(false)

  useEffect(() => {
    // Try to load official Telegram widget first
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js'
    script.async = true
    script.defer = true

    script.onload = () => {
      setScriptLoaded(true)
      console.log('✅ Telegram widget script loaded')
    }

    script.onerror = () => {
      console.warn('⚠️ Telegram widget script failed to load - using fallback button')
      setScriptLoaded(false)
    }

    document.body.appendChild(script)

    return () => {
      try {
        document.body.removeChild(script)
      } catch (e) {
        // Already removed
      }
    }
  }, [])

  // Fallback: Create custom Telegram login button
  const handleTelegramLogin = () => {
    // Redirect to Telegram login with callback
    const authUrl = `https://oauth.telegram.org/authorize?bot_id=${botUsername}&origin=${encodeURIComponent(window.location.origin)}&return_to=${encodeURIComponent(redirectUrl)}`
    window.location.href = authUrl
  }

  return (
    <div id={containerId} className="flex justify-center my-4">
      {/* Official Telegram Widget Container */}
      <div
        data-telegram-login={botUsername}
        data-size="large"
        data-auth-url={redirectUrl}
        data-request-access="write"
        style={{ minHeight: '50px' }}
      />

      {/* Fallback Button - Shows if widget doesn't load */}
      <div className="flex justify-center w-full">
        <Button
          onClick={handleTelegramLogin}
          className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.328-.373-.115l-6.869 4.332-2.97-.924c-.644-.213-.658-.644.136-.954l11.566-4.461c.538-.194 1.006.128.832.941z" />
          </svg>
          Login with Telegram
        </Button>
      </div>
    </div>
  )
}
