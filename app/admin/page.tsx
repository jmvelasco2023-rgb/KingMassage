import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminDashboard } from '@/components/admin/admin-dashboard'
import { Suspense } from 'react'

export const metadata = {
  title: "Admin Dashboard | King's Massage",
  description: 'Manage professional massage bookings and client requests.',
}

export default async function AdminPage() {
  const supabase = await createClient()
  
  // 1. Verify Authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login?redirect=/admin')
  }

  // 2. Verify Admin Role
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'admin') {
    redirect('/')
  }

  /**
   * 3. Fetch Bookings with JOINED User Data
   * We pull the telegram_id and telegram_username from the 'users' table 
   * so the AdminDashboard can send Telegram notifications.
   */
  const { data: bookings, error: bookingError } = await supabase
    .from('bookings')
    .select(`
      *,
      users (
        email,
        telegram_id,
        telegram_username
      )
    `)
    .order('created_at', { ascending: false })

  if (bookingError) {
    console.error('❌ Database Fetch Error:', bookingError.message)
  }

  // 4. Fetch Client list
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'client')
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-slate-50/50">
      <Suspense fallback={<AdminLoading />}>
        <AdminDashboard 
          bookings={(bookings as any) || []} 
          users={users || []} 
        />
      </Suspense>
    </main>
  )
}

function AdminLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin mb-4" />
      <p className="text-slate-500 font-bold animate-pulse text-sm uppercase tracking-widest">
        Loading King's Massage Dashboard...
      </p>
    </div>
  )
}
