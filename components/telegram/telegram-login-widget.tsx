'use client'

import { useEffect } from 'react'

interface TelegramLoginWidgetProps {
  containerId: string
  botUsername?: string
  redirectUrl?: string
  onAuth?: (user: any) => void
}

export function TelegramLoginWidget({
  containerId,
  botUsername = 'KingMassageBot',
  redirectUrl = 'https://kingmassage-2jw1.onrender.com/auth/telegram-callback',
  onAuth,
}: TelegramLoginWidgetProps) {
  useEffect(() => {
    // Load the Telegram widget script
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?23'
    script.async = true
    script.defer = true
    script.onload = () => {
      // @ts-ignore - Telegram is a global
      if (window.Telegram?.Login?.bind) {
        const container = document.getElementById(containerId)
        if (container) {
          // Clear any existing content
          container.innerHTML = ''
          
          // @ts-ignore
          window.Telegram.Login.bind(
            container,
            botUsername,
            {
              size: 'large',
              radius: 20,
              auth_url: redirectUrl,
              request_access: 'write',
              onAuth: onAuth,
            }
          )
        }
      }
    }
    document.head.appendChild(script)

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [containerId, botUsername, redirectUrl, onAuth])

  return <div id={containerId} className="flex justify-center my-4" />
}
