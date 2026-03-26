'use client'

import { useState } from 'react'
import type { Booking } from '@/lib/types'
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, ChevronDown, ChevronUp, Sparkles, MapPin, Phone } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ChatDialog } from '@/components/chat/chat-dialog'

// Status style mapping
const getStatusBadge = (status: string) => {
  switch(status) {
    case 'pending': return <Badge className="bg-amber-100 text-amber-800">Pending</Badge>
    case 'approved': return <Badge className="bg-green-100 text-green-800">Approved</Badge>
    case 'rejected': return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
    default: return <Badge>{status}</Badge>
  }
}

// Get booking preferences summary
const getPreferenceSummary = (booking: Booking) => {
  const preferences = []
  if (booking.pressure_preference) preferences.push(`Pressure: ${booking.pressure_preference.replace('-', ' ')}`)
  if (booking.focus_area) preferences.push(`Focus: ${booking.focus_area.replace('-', ' ')}`)
  if (booking.special_requests) preferences.push(`Notes: ${booking.special_requests}`)
  return preferences.length > 0 ? preferences.join(' • ') : 'No special preferences'
}

interface BookingsTableProps {
  bookings: (Booking & { users: { email: string } })[]
}

export function BookingsTable({ bookings }: BookingsTableProps) {
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null)

  // Toggle expanded details view
  const toggleExpand = (id: string) => {
    setExpandedBookingId(expandedBookingId === id ? null : id)
  }

  return (
    <div className="space-y-4">
      {bookings.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No bookings found
        </div>
      ) : (
        <div className="divide-y divide-muted-100">
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
                <div key={booking.id} className="group">
                  <TableRow className="cursor-pointer">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          {booking.email?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p>{booking.users.email}</p>
                          <p className="text-xs text-muted-foreground">{booking.name}</p>
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
                        <p className="text-xs text-muted-foreground">{booking.time} • {booking.duration + booking.extra_minutes} mins</p>
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
                        >
                          Approve
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>

                  {/* Expanded Details */}
                  {expandedBookingId === booking.id && (
                    <TableRow className="bg-muted/5">
                      <TableCell colSpan={6} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Booking Details</h4>
                            <div className="space-y-1 text-sm">
                              <p><strong>Name:</strong> {booking.name}</p>
                              <p><strong>Mobile:</strong> {booking.mobile}</p>
                              <p><strong>Joined:</strong> {format(parseISO(booking.users?.created_at || ''), 'MMM d, yyyy')}</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Session Preferences</h4>
                            <p>{getPreferenceSummary(booking)}</p>
                            {booking.special_requests && (
                              <div className="mt-2">
                                <p className="text-xs text-muted-foreground">Special Requests:</p>
                                <p className="text-sm">{booking.special_requests}</p>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Admin Actions</h4>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                className="bg-green-500 hover:bg-green-600"
                                onClick={() => updateBookingStatus(booking.id, 'approved')}
                              >
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                className="bg-red-500 hover:bg-red-600"
                                onClick={() => updateBookingStatus(booking.id, 'rejected')}
                              >
                                Reject
                              </Button>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setChatUserId(booking.user_id)}
                            >
                              <ChatDialog size={16} className="mr-2" /> Message Client
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </div>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
