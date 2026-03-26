'use client'

import { useState } from 'react'
import type { Booking } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  MoreHorizontal, ChevronDown, ChevronUp, Sparkles, MapPin, 
  MessageCircle, Check, X 
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ChatDialog } from '@/components/chat/chat-dialog'

// Status badge helper
const getStatusBadge = (status: string) => {
  switch(status) {
    case 'pending': return <Badge className="bg-amber-100 text-amber-800">Pending</Badge>
    case 'approved': return <Badge className="bg-green-100 text-green-800">Approved</Badge>
    case 'rejected': return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
    default: return <Badge>{status}</Badge>
  }
}

// Preference summary helper
const getPreferenceSummary = (booking: Booking) => {
  const preferences = []
  if (booking.pressure_preference) preferences.push(`Pressure: ${booking.pressure_preference.replace('-', ' ')}`)
  if (booking.focus_area) preferences.push(`Focus: ${booking.focus_area.replace('-', ' ')}`)
  return preferences.length > 0 ? preferences.join(' • ') : 'No special preferences'
}

interface BookingsTableProps {
  bookings: (Booking & { users: { email: string } })[]
}

export function BookingsTable({ bookings }: BookingsTableProps) {
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [chatUserId, setChatUserId] = useState<string | null>(null)
  const supabase = createClient()

  // Update booking status function
  const updateBookingStatus = async (bookingId: string, status: 'approved' | 'rejected') => {
    setUpdating(bookingId)
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId)

      if (error) throw error

      // Refresh local state
      const updatedBookings = bookings.map(b => b.id === bookingId ? { ...b, status } : b)
      // No need to set state here - page refresh will handle it
    } catch (error) {
      console.error('Failed to update booking:', error)
    } finally {
      setUpdating(null)
      // Force page refresh to sync data
      window.location.reload()
    }
  }

  // Toggle expand function
  const toggleExpand = (id: string) => {
    setExpandedBookingId(expandedBookingId === id ? null : id)
  }

  return (
    <>
      <div className="space-y-4">
        {bookings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No bookings found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <React.Fragment key={booking.id}>
                  <TableRow className="cursor-pointer">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          {booking.users.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{booking.name}</p>
                          <p className="text-xs text-muted-foreground">{booking.users.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-muted-foreground" />
                        {booking.service}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p>{format(parseISO(booking.date), 'MMM d, yyyy')}</p>
                        <p className="text-xs text-muted-foreground">
                          {booking.time} • {booking.duration + booking.extra_minutes} mins
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{booking.location}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => toggleExpand(booking.id)}
                          disabled={updating === booking.id}
                        >
                          {expandedBookingId === booking.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          Details
                        </Button>
                        {booking.status === 'pending' && (
                          <Button 
                            variant="default" 
                            size="sm"
                            className="bg-amber-500 hover:bg-amber-600"
                            onClick={() => updateBookingStatus(booking.id, 'approved')}
                            disabled={updating === booking.id}
                          >
                            Approve
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Expanded Details Row */}
                  {expandedBookingId === booking.id && (
                    <TableRow className="bg-muted/5">
                      <TableCell colSpan={6} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Client Information</h4>
                            <div className="space-y-1 text-sm">
                              <p><strong>Name:</strong> {booking.name}</p>
                              <p><strong>Mobile:</strong> {booking.mobile}</p>
                              <p><strong>Email:</strong> {booking.users.email}</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Session Details</h4>
                            <div className="space-y-1 text-sm">
                              <p><strong>Service:</strong> {booking.service}</p>
                              <p><strong>Duration:</strong> {booking.duration + booking.extra_minutes} mins</p>
                              <p><strong>Preferences:</strong> {getPreferenceSummary(booking)}</p>
                              {booking.special_requests && (
                                <p><strong>Notes:</strong> {booking.special_requests}</p>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Admin Actions</h4>
                            <div className="flex gap-2">
                              {booking.status === 'pending' && (
                                <>
                                  <Button 
                                    size="sm" 
                                    className="bg-green-500 hover:bg-green-600"
                                    onClick={() => updateBookingStatus(booking.id, 'approved')}
                                    disabled={updating === booking.id}
                                  >
                                    <Check size={16} className="mr-1" /> Approve
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    className="bg-red-500 hover:bg-red-600"
                                    onClick={() => updateBookingStatus(booking.id, 'rejected')}
                                    disabled={updating === booking.id}
                                  >
                                    <X size={16} className="mr-1" /> Reject
                                  </Button>
                                </>
                              )}
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setChatUserId(booking.user_id)}
                            >
                              <MessageCircle size={16} className="mr-1" /> Message Client
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <ChatDialog 
        open={!!chatUserId} 
        onOpenChange={(open) => !open && setChatUserId(null)} 
        userId={chatUserId || ''}
        isAdmin
      />
    </>
  )
}
