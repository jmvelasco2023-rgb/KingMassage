'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookingsTable } from './bookings-table'
import { ClientsList } from './clients-list'
import type { User } from '@/lib/types'
import { Calendar, Search, Bell, DollarSign, Flame } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface AdminDashboardProps {
  bookings: any[] 
  users: User[]
}

const formatPHP = (amount: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0
  }).format(amount || 0)
}

export function AdminDashboard({ bookings = [], users = [] }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('bookings')
  const [searchQuery, setSearchQuery] = useState('')
  const [bookingFilter, setBookingFilter] = useState('all')
  const [localBookings, setLocalBookings] = useState(bookings)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setLocalBookings(bookings)
  }, [bookings])

  const sendTelegramNotice = async (chatId: string | undefined, message: string) => {
    if (!chatId || !process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN) return;
    try {
      await fetch(`https://api.telegram.org/bot${process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
      });
    } catch (err) {
      console.error('Telegram Error:', err);
    }
  };

  async function handleApprove(id: string) {
    const booking = localBookings.find(b => b.id === id);
    const userData = Array.isArray(booking?.users) ? booking.users[0] : booking?.users;

    setLocalBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'approved' } : b))
    try {
      await supabase.from('bookings').update({ status: 'approved' }).eq('id', id)
      if (userData?.telegram_id) {
        await sendTelegramNotice(userData.telegram_id, `<b>✅ APPROVED</b>\nYour ${booking?.service} session is confirmed!`);
      }
      router.refresh()
    } catch (err) { console.error(err) }
  }

  // ✅ UPDATED: Now saves all session modifications
  async function handleComplete(id: string, finalEarnings: number, bookingData?: any) {
    const booking = localBookings.find(b => b.id === id)
    const userData = Array.isArray(booking?.users) ? booking.users[0] : booking?.users;
    
    setLocalBookings(prev => prev.map(b => b.id === id ? { 
      ...b, 
      status: 'completed', 
      earnings: finalEarnings,
      total_price: bookingData?.total_price || b.total_price,
      add_ons: bookingData?.add_ons || b.add_ons,
      extra_minutes: bookingData?.extra_minutes || b.extra_minutes
    } : b))

    try {
      const { error } = await supabase.from('bookings').update({ 
        status: 'completed', 
        earnings: finalEarnings,
        total_price: bookingData?.total_price || booking?.total_price,
        add_ons: bookingData?.add_ons || booking?.add_ons,
        extra_minutes: bookingData?.extra_minutes || booking?.extra_minutes,
        reviewed_at: new Date().toISOString()
      }).eq('id', id)

      if (error) throw error;

      if (userData?.telegram_id) {
        await sendTelegramNotice(userData.telegram_id, `<b>✨ SESSION COMPLETE</b>\nTotal: ₱${finalEarnings}\nThank you for visiting King's Massage!`);
      }
      router.refresh()
    } catch (err) {
      console.error('Complete failed:', err)
    }
  }

  const filteredBookings = (localBookings || []).filter(booking => {
    const search = searchQuery.toLowerCase().trim()
    const userData = Array.isArray(booking.users) ? booking.users[0] : booking.users;
    const telegramName = userData?.telegram_username?.toLowerCase() || ""
    const bookingName = booking.name?.toLowerCase() || ""
    const email = userData?.email?.toLowerCase() || ""

    return (search === '' || telegramName.includes(search) || bookingName.includes(search) || email.includes(search) || booking.service?.toLowerCase().includes(search)) 
           && (bookingFilter === 'all' || booking.status === bookingFilter);
  })

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Header />
      <main className="flex-1 py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Pending" value={localBookings.filter(b => b.status === 'pending').length} icon={<Bell className="w-4 h-4" />} color="text-amber-600 bg-amber-100" />
            <StatCard label="Approved" value={localBookings.filter(b => b.status === 'approved').length} icon={<Calendar className="w-4 h-4" />} color="text-emerald-600 bg-emerald-100" />
            <StatCard label="Completed" value={localBookings.filter(b => b.status === 'completed').length} icon={<Flame className="w-4 h-4" />} color="text-blue-600 bg-blue-100" />
            <StatCard label="Earnings" value={formatPHP(localBookings.reduce((s, b) => s + (b.earnings || 0), 0))} icon={<DollarSign className="w-4 h-4" />} color="text-green-600 bg-green-100" />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
              <TabsList className="bg-white border p-1 rounded-xl shadow-sm">
                <TabsTrigger value="bookings" className="px-8 rounded-lg font-bold">Bookings</TabsTrigger>
                <TabsTrigger value="clients" className="px-8 rounded-lg font-bold">Clients</TabsTrigger>
              </TabsList>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 rounded-xl bg-white border-slate-200 focus:ring-emerald-500" />
              </div>
            </div>
            <TabsContent value="bookings" className="space-y-4 outline-none">
              <div className="flex gap-2 pb-2 overflow-x-auto scrollbar-hide">
                {['all', 'pending', 'approved', 'completed'].map((f) => (
                  <Button key={f} variant={bookingFilter === f ? "default" : "outline"} size="sm" onClick={() => setBookingFilter(f)} className={cn("rounded-full px-5 font-bold capitalize", bookingFilter === f ? "bg-slate-900 text-white shadow-md" : "bg-white")}>{f}</Button>
                ))}
              </div>
              <BookingsTable bookings={filteredBookings} onApprove={handleApprove} onReject={() => {}} onComplete={handleComplete} />
            </TabsContent>
            <TabsContent value="clients" className="outline-none">
              <ClientsList users={users} bookings={localBookings} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, value, icon, color }: any) {
  return (
    <Card className="border-none shadow-sm rounded-2xl bg-white ring-1 ring-slate-100">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{value}</p>
        </div>
        <div className={cn("p-2.5 rounded-xl", color)}>{icon}</div>
      </CardContent>
    </Card>
  )
}
