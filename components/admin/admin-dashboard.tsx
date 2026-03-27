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
  bookings: (Booking & { users: { email: string } })[]
  users: User[]
}

// Format Philippine Pesos currency
const formatPHP = (amount: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0
  }).format(amount)
}

// Get current month for earnings calculation
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

  // 🔑 Optimistic Handlers
  async function handleApprove(id: string) {
    setLocalBookings(prev =>
      prev.map(b => b.id === id ? { ...b, status: 'approved' } : b)
    )
    try {
      await supabase.from('bookings').update({ status: 'approved' }).eq('id', id)
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

  async function handleComplete(id: string, earnings: number) {
    setLocalBookings(prev =>
      prev.map(b => b.id === id ? { ...b, status: 'completed', earnings } : b)
    )
    try {
      await supabase.from('bookings').update({ status: 'completed', earnings }).eq('id', id)
    } catch (err) {
      console.error('Complete failed:', err)
    }
    router.refresh()
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
    return searchLower === '' || 
           booking.name.toLowerCase().includes(searchLower) ||
           booking.service.toLowerCase().includes(searchLower) ||
           booking.users.email.toLowerCase().includes(searchLower)
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
          {/* Dashboard Header */}
          {/* ... header and stats cards remain unchanged ... */}

          {/* Main Content Tabs */}
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

            {/* Bookings Tab Content */}
            <TabsContent value="bookings" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Bookings {bookingFilter !== 'all' ? `(${bookingFilter})` : ''}</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleFilterClick('all')}>All</Button>
                  <Button variant="outline" size="sm" onClick={() => handleFilterClick('pending')}>Pending</Button>
                  <Button variant="outline" size="sm" onClick={() => handleFilterClick('approved')}>Approved</Button>
                  <Button variant="outline" size="sm" onClick={() => handleFilterClick('completed')}>Completed</Button>
                </div>
              </div>
              <BookingsTable
                bookings={filteredBookings}
                onApprove={handleApprove}
                onReject={handleReject}
                onComplete={handleComplete}
              />
            </TabsContent>

            {/* Clients Tab Content */}
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
