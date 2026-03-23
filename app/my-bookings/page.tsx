import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { BookingsList } from '@/components/bookings/bookings-list'
import { Calendar } from 'lucide-react'

export const metadata = {
  title: 'My Bookings | King Massage Therapy',
  description: 'View and manage your massage therapy bookings.',
}

export default async function MyBookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?redirect=/my-bookings')
  }

  console.log('Current user ID:', user.id)

  // Fetch ALL bookings first to debug
  const { data: allBookings, error: allError } = await supabase
    .from('bookings')
    .select('*')

  console.log('All bookings in database:', allBookings)
  console.log('Error fetching all bookings:', allError)

  // Fetch user's bookings
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  console.log('User bookings:', bookings)
  console.log('Error fetching user bookings:', error)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-8 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">My Bookings</h1>
              <p className="text-sm text-muted-foreground">View and manage your appointments</p>
            </div>
          </div>

          {/* Debug info */}
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm">
            <p><strong>Your User ID:</strong> {user.id}</p>
            <p><strong>Total bookings found:</strong> {bookings?.length || 0}</p>
            {error && <p className="text-red-600"><strong>Error:</strong> {error.message}</p>}
          </div>
          
          <BookingsList bookings={bookings || []} userId={user.id} />
        </div>
      </main>
    </div>
  )
}
