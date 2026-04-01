'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookingsTable } from './bookings-table'
import { ClientsList } from './clients-list'
import type { Booking, User } from '@/lib/types'
import { Calendar, Users, LayoutDashboard, Search, Filter, Download, Bell, DollarSign, Flame } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface AdminDashboardProps {
  bookings: any[] // Using any here to allow for the joined 'users' object
  users: User[]
}

const formatPHP = (amount: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0
  }).format(amount)
}

const getCurrentMonthRange = () => {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { 
    start, 
    end,
    label: `${now.toLocaleDateString('en-PH', { month: 'long' })} ${now.getFullYear()}`
  }
}

export function AdminDashboard({ bookings, users }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('bookings')
  const [searchQuery, setSearchQuery] = useState('')
  const [bookingFilter, setBookingFilter] = useState('all')
  const [localBookings, setLocalBookings] = useState(bookings)

  const router = useRouter()
  const supabase = createClient()

  // --- HELPER: TELEGRAM NOTIFIER (UPDATED) ---
  const sendTelegramNotice = async (chatId: string | undefined, message: string) => {
    if (!chatId) {
      console.warn("⚠️ Notification Skipped: No Telegram ID found for this client.");
      return;
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML' // Allows <b>Bold</b> and <i>Italic</i>
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Telegram API Error:', errorData);
      } else {
        console.log("✅ Telegram message sent to:", chatId);
      }
    } catch (err) {
      console.error('Network Error calling Telegram:', err);
    }
  };

  // --- HANDLERS (UPDATED WITH DATA SAFETY) ---
  async function handleApprove(id: string) {
    const booking = localBookings.find(b => b.id === id);
    
    // Safety check: Supabase joins can return an object OR an array [0]
    const userData = Array.isArray(booking?.users) ? booking.users[0] : booking?.users;
    const chatId = userData?.telegram_id;

    setLocalBookings(prev =>
      prev.map(b => b.id === id ? { ...b, status: 'approved' } : b)
    )
    
    try {
      await supabase.from('bookings').update({ status: 'approved' }).eq('id', id)
      
      if (chatId) {
        await sendTelegramNotice(
          chatId, 
          `<b>✅ BOOKING APPROVED</b>\n\nYour session for <b>${booking?.service}</b> has been approved! We look forward to seeing you at King's Massage.`
        );
      }
    } catch (err) {
      console.error('Approve failed:', err)
    }
    router.refresh()
  }

  async function handleReject(id: string) {
    setLocalBookings(prev =>
      prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b)
    )
    try {
      await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id)
    } catch (err) {
      console.error('Reject failed:', err)
    }
    router.refresh()
  }

  async function handleComplete(id: string, earnings: number, bookingData?: any) {
    const booking = localBookings.find(b => b.id === id)
    const userData = Array.isArray(booking?.users) ? booking.users[0] : booking?.users;
    const chatId = userData?.telegram_id;
    
    setLocalBookings(prev =>
      prev.map(b => b.id === id ? { 
        ...b, 
        status: 'completed', 
        earnings,
        add_ons: bookingData?.add_ons || b.add_ons || [],
        extra_minutes: bookingData?.extra_minutes || 0,
        total_price: bookingData?.total_price || b.total_price
      } : b)
    )
    
    try {
      await supabase.from('bookings').update({ 
        status: 'completed', 
        earnings,
        add_ons: bookingData?.add_ons || booking?.add_ons || [],
        extra_minutes: bookingData?.extra_minutes || 0,
        total_price: bookingData?.total_price || booking?.total_price
      }).eq('id', id)
      
      if (chatId) {
        await sendTelegramNotice(
          chatId, 
          `<b>✨ SESSION COMPLETE</b>\n\nThank you for choosing King's Massage! Your session is now complete. We hope you enjoyed it! Please visit our website to leave a review.`
        );
      }
      
      router.refresh()
    } catch (err) {
      console.error('Complete failed:', err)
    }
  }

  // Stats
  const pendingCount = localBookings.filter((b) => b.status === 'pending').length
  const approvedCount = localBookings.filter((b) => b.status === 'approved').length
  const completedCount = localBookings.filter((b) => b.status === 'completed').length
  const totalClients = users.length
  
  const { label: monthLabel, start: monthStart, end: monthEnd } = getCurrentMonthRange()
  const monthlyEarnings = localBookings
    .filter(b => b.status === 'completed' && new Date(b.created_at) >= monthStart && new Date(b.created_at) <= monthEnd)
    .reduce((sum, b) => sum + (b.earnings || 0), 0)

  // Filters
  const filteredBookings = localBookings.filter(booking => {
    const searchLower = searchQuery.toLowerCase().trim()
    const userData = Array.isArray(booking.users) ? booking.users[0] : booking.users;
    const telegramName = userData?.telegram_username?.toLowerCase() || ""
    
    return searchLower === '' || 
           booking.name.toLowerCase().includes(searchLower) ||
           booking.service.toLowerCase().includes(searchLower) ||
           userData?.email?.toLowerCase().includes(searchLower) ||
           telegramName.includes(searchLower)
  }).filter(booking => bookingFilter === 'all' || booking.status === bookingFilter)

  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase().trim()
    return searchLower === '' || 
           user.email.toLowerCase().includes(searchLower) ||
           user.id.includes(searchLower)
  })

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/30">
      <Header />
      
      <main className="flex-1 py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Pending" value={pendingCount} icon={<Bell className="w-5 h-5 text-amber-600" />} color="bg-amber-100" />
            <StatCard label="Approved" value={approvedCount} icon={<Calendar className="w-5 h-5 text-emerald-600" />} color="bg-emerald-100" />
            <StatCard label="Completed" value={completedCount} icon={<Flame className="w-5 h-5 text-blue-600" />} color="bg-blue-100" />
            <StatCard label={monthLabel} value={formatPHP(monthlyEarnings)} icon={<DollarSign className="w-5 h-5 text-green-600" />} color="bg-green-100" />
          </div>

          <Tabs defaultValue="bookings" value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <TabsList className="bg-white border border-slate-200 p-1 rounded-xl">
                <TabsTrigger value="bookings" className="rounded-lg px-6">Bookings</TabsTrigger>
                <TabsTrigger value="clients" className="rounded-lg px-6">Clients</TabsTrigger>
              </TabsList>

              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search name or service..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-xl border-slate-200 focus:ring-emerald-500"
                />
              </div>
            </div>

            <TabsContent value="bookings" className="space-y-4 focus-visible:outline-none">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {['all', 'pending', 'approved', 'completed'].map((f) => (
                  <Button 
                    key={f}
                    variant={bookingFilter === f ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => setBookingFilter(f)}
                    className={cn(
                      "rounded-full px-5 font-bold capitalize",
                      bookingFilter === f && "bg-slate-900 text-white"
                    )}
                  >
                    {f}
                  </Button>
                ))}
              </div>
              <BookingsTable
                bookings={filteredBookings}
                onApprove={handleApprove}
                onReject={handleReject}
                onComplete={handleComplete}
              />
            </TabsContent>

            <TabsContent value="clients" className="focus-visible:outline-none">
              <ClientsList users={filteredUsers} bookings={localBookings} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, value, icon, color }: { label: string, value: string | number, icon: React.ReactNode, color: string }) {
  return (
    <Card className="bg-white border-none shadow-sm ring-1 ring-slate-200/60 rounded-2xl">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          </div>
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", color)}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
