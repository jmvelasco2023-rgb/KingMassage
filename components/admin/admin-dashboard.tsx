'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookingsTable } from './bookings-table'
import { ClientsList } from './clients-list'
import type { Booking, User } from '@/lib/types'
import { Calendar, Users, LayoutDashboard, DollarSign, Flame } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface AdminDashboardProps {
  bookings: any[]
  users: User[]
}

const formatPHP = (amount: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0
  }).format(amount)
}

export function AdminDashboard({ bookings = [], users = [] }: AdminDashboardProps) {
  const router = useRouter()
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState('bookings')

  const sendTelegramNotice = async (chatId: string | undefined, message: string) => {
    if (!chatId) return
    try {
      await fetch('/api/notify-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: chatId, message })
      })
    } catch (error) {
      console.error('Telegram notification error:', error)
    }
  }

  // ✅ FIXED: Removed updated_at which caused the "column not found" error
  async function handleComplete(id: string, finalEarnings: number, bookingData?: any) {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'completed',
          earnings: Math.round(Number(finalEarnings)),
          total_price: Math.round(Number(bookingData?.total_price || finalEarnings)),
          session_extra_minutes: Math.round(Number(bookingData?.session_extra_minutes || 0)),
          session_add_ons: bookingData?.session_add_ons || [],
          // updated_at was removed because it is missing from your Supabase table
        })
        .eq('id', id)

      if (error) throw error

      const booking = bookings.find(b => b.id === id)
      if (booking) {
        const clientProfile = users.find(u => u.id === booking.user_id)
        const telegramId = clientProfile?.telegram_chat_id || clientProfile?.telegram_id

        if (telegramId) {
          await sendTelegramNotice(
            telegramId,
            `✅ Session Completed!\n\nYour massage session has been completed.\nFinal Amount: ₱${finalEarnings}\n\nThank you for choosing King's Massage! 🙏`
          )
        }
      }

      router.refresh()
    } catch (error: any) {
      console.error('Error completing booking:', error)
      alert(`Failed to complete: ${error.message || 'Check database connection'}`)
    }
  }

  async function handleApprove(id: string) {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'approved' })
        .eq('id', id)

      if (error) throw error

      const booking = bookings.find(b => b.id === id)
      if (booking) {
        const clientProfile = users.find(u => u.id === booking.user_id)
        const telegramId = clientProfile?.telegram_chat_id || clientProfile?.telegram_id

        await sendTelegramNotice(
          telegramId,
          `✅ Your booking has been approved!\n\nService: ${booking.service}\nDate: ${booking.date}\nTime: ${booking.time}\n\nPlease send payment proof. Thank you! 🙏`
        )
      }

      router.refresh()
    } catch (error) {
      console.error('Error approving booking:', error)
      alert('Failed to approve booking')
    }
  }

  async function handleReject(id: string) {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'rejected' })
        .eq('id', id)

      if (error) throw error

      const booking = bookings.find(b => b.id === id)
      if (booking) {
        const clientProfile = users.find(u => u.id === booking.user_id)
        const telegramId = clientProfile?.telegram_chat_id || clientProfile?.telegram_id

        await sendTelegramNotice(
          telegramId,
          `❌ Your booking request has been declined.\n\nPlease try booking another time. If you have questions, feel free to message us. 💬`
        )
      }

      router.refresh()
    } catch (error) {
      console.error('Error rejecting booking:', error)
      alert('Failed to reject booking')
    }
  }

  const pendingCount = bookings.filter(b => b.status === 'pending').length
  const approvedCount = bookings.filter(b => b.status === 'approved').length
  const completedCount = bookings.filter(b => b.status === 'completed').length
  const totalEarnings = bookings
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + (b.earnings || b.total_price || 0), 0)

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Header />

      <main className="py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3 mb-2">
              <LayoutDashboard className="w-8 h-8 text-emerald-600" />
              Admin Dashboard
            </h1>
            <p className="text-slate-600">Manage bookings and clients</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Pending" value={pendingCount} icon={Calendar} color="amber" />
            <StatCard label="Approved" value={approvedCount} icon={Calendar} color="emerald" />
            <StatCard label="Completed" value={completedCount} icon={Flame} color="blue" />
            <StatCard label="Earnings" value={formatPHP(totalEarnings)} icon={DollarSign} color="green" />
          </div>

          <Tabs defaultValue="bookings" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-white border border-slate-200 rounded-xl p-1">
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="clients">Clients</TabsTrigger>
            </TabsList>

            <TabsContent value="bookings" className="space-y-4">
              <BookingsTable
                bookings={bookings}
                onApprove={handleApprove}
                onReject={handleReject}
                onComplete={handleComplete}
              />
            </TabsContent>

            <TabsContent value="clients">
              <ClientsList users={users} bookings={bookings} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color }: any) {
  const colorClasses = {
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
  }

  return (
    <Card className="border-none shadow-sm">
      <CardContent className={`p-4 ${colorClasses[color as keyof typeof colorClasses] || colorClasses.emerald}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase opacity-70">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <Icon className="w-8 h-8 opacity-50" />
        </div>
      </CardContent>
    </Card>
  )
}
