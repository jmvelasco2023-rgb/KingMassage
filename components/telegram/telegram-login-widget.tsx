'use client'

import { useEffect } from 'react'

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
  useEffect(() => {
    // Load Telegram Login Widget script
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.async = true
    script.onload = () => {
      // Script loaded successfully
      console.log('Telegram widget script loaded')
    }
    script.onerror = () => {
      console.error('Failed to load Telegram widget script')
    }
    document.body.appendChild(script)

    return () => {
      // Cleanup is optional but safe
      try {
        document.body.removeChild(script)
      } catch (e) {
        // Script already removed
      }
    }
  }, [])

  return (
    <div className="flex justify-center my-4">
      <div
        id={containerId}
        data-telegram-login={botUsername}
        data-size="large"
        data-auth-url={redirectUrl}
        data-request-access="write"
        data-radius="20"
        style={{ minHeight: '50px' }}
      />
    </div>
  )
}
