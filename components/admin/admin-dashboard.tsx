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
  // Updated type to include telegram info from the joined users table
  bookings: (Booking & { 
    users: { 
      email: string, 
      telegram_id?: string, 
      telegram_username?: string 
    } 
  })[]
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

  // --- HELPER: TELEGRAM NOTIFIER ---
  const sendTelegramNotice = async (chatId: string | undefined, message: string) => {
    if (!chatId) {
      console.warn("Skipping notification: No Telegram ID found for this user.");
      return;
    }
    try {
      await fetch(`https://api.telegram.org/bot${process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
        }),
      });
      console.log("Telegram notification sent successfully");
    } catch (err) {
      console.error('Telegram Notification Error:', err);
    }
  };

  // --- HANDLERS ---
  async function handleApprove(id: string) {
    const bookingToApprove = localBookings.find(b => b.id === id);
    
    setLocalBookings(prev =>
      prev.map(b => b.id === id ? { ...b, status: 'approved' } : b)
    )
    
    try {
      await supabase.from('bookings').update({ status: 'approved' }).eq('id', id)
      
      // Notify Client
      if (bookingToApprove?.users?.telegram_id) {
        await sendTelegramNotice(
          bookingToApprove.users.telegram_id, 
          `✅ Your booking for ${bookingToApprove.service} has been APPROVED! See you soon at King's Massage.`
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
    const bookingToUpdate = localBookings.find(b => b.id === id)
    
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
        add_ons: bookingData?.add_ons || bookingToUpdate?.add_ons || [],
        extra_minutes: bookingData?.extra_minutes || 0,
        total_price: bookingData?.total_price || bookingToUpdate?.total_price
      }).eq('id', id)
      
      // Notify Client
      if (bookingToUpdate?.users?.telegram_id) {
        await sendTelegramNotice(
          bookingToUpdate.users.telegram_id, 
          `✨ Your session at King's Massage is complete. Thank you for choosing us! Please visit the website to leave a review.`
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

  // Filters with improved name logic
  const filteredBookings = localBookings.filter(booking => {
    const searchLower = searchQuery.toLowerCase().trim()
    const telegramName = booking.users?.telegram_username?.toLowerCase() || ""
    
    return searchLower === '' || 
           booking.name.toLowerCase().includes(searchLower) ||
           booking.service.toLowerCase().includes(searchLower) ||
           booking.users.email.toLowerCase().includes(searchLower) ||
           telegramName.includes(searchLower)
  }).filter(booking => bookingFilter === 'all' || booking.status === bookingFilter)

  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase().trim()
    return searchLower === '' || 
           user.email.toLowerCase().includes(searchLower) ||
           user.id.includes(searchLower)
  })

  const handleFilterClick = (filter: string) => {
    setBookingFilter(filter)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Dashboard Stats Header */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{pendingCount}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Approved</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{approvedCount}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{completedCount}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Flame className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm ring-1 ring-slate-100 rounded-2xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{monthLabel}</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">{formatPHP(monthlyEarnings)}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="bookings" value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid w-full md:w-auto grid-cols-2 mb-6">
              <TabsTrigger value="bookings" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Bookings
                {pendingCount > 0 && (
                  <Badge className="ml-2 bg-amber-100 text-amber-700">
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="clients" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Clients
                <Badge className="ml-2 bg-blue-100 text-blue-700">
                  {totalClients}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bookings" className="space-y-4">
              <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                <h3 className="text-lg font-semibold">Bookings {bookingFilter !== 'all' ? `(${bookingFilter})` : ''}</h3>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => handleFilterClick('all')} className={bookingFilter === 'all' ? 'bg-slate-100' : ''}>All</Button>
                  <Button variant="outline" size="sm" onClick={() => handleFilterClick('pending')} className={bookingFilter === 'pending' ? 'bg-amber-100' : ''}>Pending</Button>
                  <Button variant="outline" size="sm" onClick={() => handleFilterClick('approved')} className={bookingFilter === 'approved' ? 'bg-emerald-100' : ''}>Approved</Button>
                  <Button variant="outline" size="sm" onClick={() => handleFilterClick('completed')} className={bookingFilter === 'completed' ? 'bg-blue-100' : ''}>Completed</Button>
                </div>
              </div>
              <BookingsTable
                bookings={filteredBookings}
                onApprove={handleApprove}
                onReject={handleReject}
                onComplete={handleComplete}
              />
            </TabsContent>

            <TabsContent value="clients">
              <h3 className="text-lg font-semibold mb-4">Registered Clients ({totalClients})</h3>
              <ClientsList users={filteredUsers} bookings={localBookings} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
