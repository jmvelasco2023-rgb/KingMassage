import { Suspense } from 'react'
import TelegramCallbackContent from './telegram-callback-content'
import { Loader2 } from 'lucide-react'

function LoadingFallback() {
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
    <Suspense fallback={<LoadingFallback />}>
      <TelegramCallbackContent />
    </Suspense>
  )
}
