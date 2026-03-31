import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-red-50 to-orange-50">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card className="shadow-lg border-red-200">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <CardTitle className="text-2xl text-red-600">
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {params?.error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700 font-mono break-words">
                    {params.error}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-600">
                  An unspecified error occurred.
                </p>
              )}
              
              <div className="space-y-2 pt-4">
                <Link href="/auth/login" className="block">
                  <button className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors">
                    Try Again
                  </button>
                </Link>
                <Link href="/" className="block">
                  <button className="w-full px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-medium transition-colors">
                    Go Home
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
