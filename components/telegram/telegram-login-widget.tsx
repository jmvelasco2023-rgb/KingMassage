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
    // Create script element
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js'
    script.async = true
    
    // Add attributes for the widget
    script.setAttribute('data-telegram-login', botUsername)
    script.setAttribute('data-size', 'large')
    script.setAttribute('data-auth-url', redirectUrl)
    script.setAttribute('data-request-access', 'write')
    script.setAttribute('data-radius', '20')
    
    // Add to DOM
    const container = document.getElementById(containerId)
    if (container) {
      container.appendChild(script)
    }

    return () => {
      if (container && script.parentNode === container) {
        container.removeChild(script)
      }
    }
  }, [containerId, botUsername, redirectUrl])

  return (
    <div 
      id={containerId} 
      className="flex justify-center my-4"
      style={{ minHeight: '50px' }}
    />
  )
}
