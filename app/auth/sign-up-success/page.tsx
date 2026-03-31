import { Suspense } from 'react'
import SignUpSuccessContent from './signup-success-content'
import { Card } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

function LoadingFallback() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
      <Card className="mobile-lock p-8 shadow-lg max-w-md w-full">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 bg-emerald-200/30 rounded-full blur-lg animate-pulse" />
              <Loader2 className="w-12 h-12 text-emerald-600 animate-spin relative" />
            </div>
          </div>
          <p className="text-lg font-semibold text-slate-700">Setting up your account...</p>
        </div>
      </Card>
    </div>
  )
}

export default function SignUpSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SignUpSuccessContent />
    </Suspense>
  )
}
