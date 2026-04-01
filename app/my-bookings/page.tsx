'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { BookingsList } from '@/components/bookings/bookings-list'
import { Calendar, Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
// ✅ IMPORT: If you have a Rating Modal component, import it here
// import { RatingModal } from '@/components/modals/rating-modal' 

export default function MyBookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<any[]>([])
  const [userId, setUserId] = useState<string>('')
  const [userName, setUserName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  // ✅ ADDED: State to track which booking is being rated
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false)
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

  // ✅ ADDED: Handlers for the buttons
  const handleRate = (booking: any) => {
    console.log("Rate button clicked for:", booking.id)
    setSelectedBooking(booking)
    setIsRatingModalOpen(true)
    // If you don't have a modal yet, you could alert for testing:
    // alert(`Rating session for ${booking.service}`)
  }

  const handleChat = (booking: any) => {
    router.push(`/messages?bookingId=${booking.id}`)
  }

  const handleCancel = async (booking: any) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      // Logic to update Supabase status to 'cancelled' would go here
      console.log("Cancelling:", booking.id)
    }
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
            {/* ✅ FIXED: Passed the handlers into the component */}
            <BookingsList 
              bookings={bookings} 
              userId={userId} 
              onRate={handleRate}
              onChatOpen={handleChat}
              onCancel={handleCancel}
            />
          </div>

          {/* ✅ PLACEHOLDER: Your Rating Modal would go here */}
          {/* isRatingModalOpen && (
            <RatingModal 
              booking={selectedBooking} 
              onClose={() => setIsRatingModalOpen(false)} 
            />
          )*/}

        </div>
      </main>
    </div>
  )
}
