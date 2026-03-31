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
    // Load Telegram script
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.async = true
    document.body.appendChild(script)

    // Initialize the widget after script loads
    script.onload = () => {
      if (window.Telegram?.Login) {
        window.Telegram.Login.init({
          bot_id: botUsername.replace('@', ''),
          request_access: 'write',
        })
      }
    }

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [botUsername])

  return (
    <div
      id={containerId}
      data-telegram-login={botUsername}
      data-size="large"
      data-auth-url={redirectUrl}
      data-request-access="write"
      style={{
        display: 'flex',
        justifyContent: 'center',
      }}
    />
  )
}
