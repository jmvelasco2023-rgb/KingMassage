'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle2, 
  Sparkles, 
  Activity, 
  MapPin, 
  Clock as Clock3, 
  ChevronDown, 
  ChevronUp,
  MessageCircle,
  Trash2,
  AlertCircle,
  Star,
  Gift
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'

const STATUS_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

// ✅ Added proper prop types for the handlers
interface BookingsListProps {
  bookings: any[]
  onRate: (booking: any) => void
  onCancel: (booking: any) => void
  onChatOpen: (booking: any) => void
}

export function BookingsList({ bookings, onRate, onCancel, onChatOpen }: BookingsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      {bookings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500">No bookings yet</p>
        </div>
      ) : (
        bookings.map((booking: any) => (
          <BookingCard
            key={booking.id}
            booking={booking}
            isExpanded={expandedId === booking.id}
            onToggleExpand={() => setExpandedId(expandedId === booking.id ? null : booking.id)}
            onChatOpen={() => onChatOpen(booking)}
            onCancel={() => onCancel(booking)}
            onRate={() => onRate(booking)}
            isPast={new Date(booking.date) < new Date()}
          />
        ))
      )}
    </div>
  )
}

function BookingCard({ booking, isExpanded, onToggleExpand, onChatOpen, onCancel, onRate, isPast = false }: any) {
  const canCancel = !isPast && (booking.status === 'pending' || booking.status === 'approved')
  const canRate = booking.status === 'completed' && !booking.rating
  const isCompleted = booking.status === 'completed'
  const isRated = booking.rating !== null && booking.rating !== undefined

  // ✅ Total duration logic
  const baseDuration = booking.duration || 60
  const adminAddedMinutes = (booking.extra_minutes || 0) + (booking.session_extra_minutes || 0)
  const totalDuration = baseDuration + adminAddedMinutes
  const hasAdminAddedTime = adminAddedMinutes > 0

  // ✅ Add-ons logic: Correctly handling the array from Supabase
  const allAddOns = booking.add_ons || []
  // Logic to distinguish session-added items (based on your 'isSessionAdded' flag)
  const baseAddOns = allAddOns.filter((addon: any) => !addon.isSessionAdded)
  const sessionAddedAddOns = allAddOns.filter((addon: any) => addon.isSessionAdded)

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300 border-none rounded-[2rem]",
      isExpanded ? "shadow-lg ring-2 ring-emerald-200" : "shadow-sm hover:shadow-md"
    )}>
      {/* HEADER */}
      <div 
        className={cn(
          "p-5 cursor-pointer transition-colors",
          isCompleted && !isRated ? "bg-gradient-to-r from-blue-50 to-blue-25" : 
          isPast ? "bg-slate-50" : "bg-white hover:bg-slate-50"
        )}
        onClick={onToggleExpand}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className={cn("p-3 rounded-2xl shrink-0", isPast ? "bg-slate-100" : isCompleted ? "bg-blue-50" : "bg-emerald-50")}>
              {isCompleted ? <CheckCircle2 className="w-5 h-5 text-blue-600" /> : <Sparkles className={cn("w-5 h-5", isPast ? "text-slate-400" : "text-emerald-600")} />}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-lg text-slate-900 leading-tight truncate">{booking.service} ({totalDuration}m)</h3>
              <p className="text-sm text-slate-500 mt-1">
                {booking.date ? format(parseISO(booking.date), 'MMM d') : 'No Date'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Badge className={cn(
              "border-none px-3 py-1.5 rounded-full text-[9px] uppercase tracking-wider font-bold",
              booking.status === 'completed' ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
            )}>
              {STATUS_LABELS[booking.status as keyof typeof STATUS_LABELS] || booking.status}
            </Badge>
            {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </div>
        </div>
      </div>

      {/* EXPANDED CONTENT */}
      {isExpanded && (
        <div className="px-6 pb-6 space-y-5 border-t border-slate-100">
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="flex items-center gap-2.5">
              <Clock3 className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Duration</p>
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-slate-900">{totalDuration}m total</p>
                  {hasAdminAddedTime && (
                    <p className="text-[10px] text-emerald-600 font-bold">+{adminAddedMinutes}m added</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Location</p>
                <p className="text-sm font-bold text-slate-900 truncate">{booking.location || 'Mobile Service'}</p>
              </div>
            </div>
          </div>

          {/* Add-ons Section */}
          {(allAddOns.length > 0) && (
            <div className="bg-emerald-50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-emerald-600" />
                <p className="text-xs font-bold text-emerald-900 uppercase">Services & Add-ons</p>
              </div>
              <div className="space-y-2">
                {allAddOns.map((addon: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className={cn("font-medium", addon.isSessionAdded ? "text-emerald-700" : "text-slate-700")}>
                      {addon.name || addon}
                    </span>
                    {addon.isSessionAdded && (
                      <Badge className="bg-emerald-600 text-white text-[8px] h-4">ADDED</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pricing Breakdown */}
          {booking.total_price && (
            <div className="bg-blue-50 rounded-2xl p-4 border-l-4 border-blue-400">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[9px] text-blue-600 uppercase font-bold tracking-wider">Final Price</p>
                  <p className="text-2xl font-black text-blue-900">₱{booking.total_price.toLocaleString()}</p>
                </div>
                <AlertCircle className="w-5 h-5 text-blue-400 mb-1" />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t border-slate-100">
            {canCancel && (
              <Button variant="outline" className="flex-1 text-red-600 border-red-100 hover:bg-red-50 rounded-xl" onClick={onCancel}>
                <Trash2 className="w-4 h-4 mr-2" /> Cancel
              </Button>
            )}

            {canRate && (
              <Button className="flex-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-md" onClick={onRate}>
                <Star className="w-4 h-4 mr-2 fill-current" /> Rate
              </Button>
            )}

            <Button variant="outline" className="flex-1 rounded-xl" onClick={onChatOpen}>
              <MessageCircle className="w-4 h-4 mr-2" /> Message
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
