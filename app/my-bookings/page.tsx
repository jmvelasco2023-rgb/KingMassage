'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { BookingsList } from '@/components/bookings/bookings-list'
import { Calendar, Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
// ✅ Import your specific dialog
import { RatingDialog } from '@/components/bookings/rating-dialog'

export default function MyBookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<any[]>([])
  const [userId, setUserId] = useState<string>('')
  const [userName, setUserName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  // ✅ State to control your specific dialog props
  const [isRatingOpen, setIsRatingOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<any>(null)

  const fetchBookings = async () => {
    try {
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        router.push('/auth/login?redirect=/my-bookings')
        return
      }

      setUserId(user.id)
      setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Client')

      const { data, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      if (bookingError) throw bookingError
      setBookings(data || [])
    } catch (err: any) {
      console.error('Fetch error:', err)
      setError(err.message || 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  // ✅ Triggered by the Rate button in BookingsList
  const handleRate = (booking: any) => {
    setSelectedBooking(booking)
    setIsRatingOpen(true)
  }

  useEffect(() => {
    fetchBookings()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 py-8 px-4 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground animate-pulse">Loading your appointments...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-10 px-4">
        <div className="container mx-auto max-w-3xl">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">My Bookings</h1>
                <p className="text-sm text-muted-foreground">
                  Hello, {userName}. Here is your session history.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3 text-destructive text-sm">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}
          
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <BookingsList 
              bookings={bookings} 
              userId={userId} 
              onRate={handleRate} 
            />
          </div>

          {/* ✅ Connects your RatingDialog to the state */}
          {selectedBooking && (
            <RatingDialog
              isOpen={isRatingOpen}
              onClose={() => {
                setIsRatingOpen(false)
                fetchBookings() // Refresh the list so the Rate button disappears
              }}
              bookingId={selectedBooking.id}
              serviceName={selectedBooking.service}
              currentRating={selectedBooking.rating}
              currentComment={selectedBooking.review_comment}
            />
          )}

        </div>
      </main>
    </div>
  )
}
