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
  Gift,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

const STATUS_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const STATUS_COLORS = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  completed: 'bg-blue-50 text-blue-700 border-blue-200',
  cancelled: 'bg-slate-50 text-slate-700 border-slate-200',
}

// ✅ UPDATE: Added onRate, onChatOpen, and onCancel to the props
export function BookingsList({ bookings, userId, onRate, onChatOpen, onCancel }: any) {
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
            // ✅ UPDATE: Passing the actual functions instead of empty ones
            onChatOpen={() => onChatOpen?.(booking)}
            onCancel={() => onCancel?.(booking)}
            onRate={() => onRate?.(booking)}
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

  const baseDuration = booking.duration || 60
  const adminAddedMinutes = (booking.extra_minutes || 0) + (booking.session_extra_minutes || 0)
  const totalDuration = baseDuration + adminAddedMinutes
  const hasAdminAddedTime = adminAddedMinutes > 0

  const hasAddOns = booking.add_ons && booking.add_ons.length > 0
  const baseAddOns = booking.add_ons?.filter((addon: any) => !addon.isSessionAdded) || []
  const sessionAddedAddOns = booking.add_ons?.filter((addon: any) => addon.isSessionAdded) || []

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300 border-none rounded-[2rem]",
      isExpanded ? "shadow-lg ring-2 ring-emerald-200" : "shadow-sm hover:shadow-md"
    )}>
      {/* HEADER - Always Visible */}
      <div 
        className={cn(
          "p-5 cursor-pointer transition-colors",
          isCompleted && !isRated ? "bg-gradient-to-r from-blue-50 to-blue-25" : 
          isPast ? "bg-slate-50" : 
          "bg-white hover:bg-slate-50"
        )}
        onClick={onToggleExpand}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className={cn("p-3 rounded-2xl shrink-0", isPast ? "bg-slate-100" : isCompleted ? "bg-blue-50" : "bg-emerald-50")}>
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
              ) : (
                <Sparkles className={cn("w-5 h-5", isPast ? "text-slate-400" : "text-emerald-600")} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-lg text-slate-900 leading-tight truncate">{booking.service}</h3>
              <p className="text-sm text-slate-500 mt-1">
                {booking.name} • {format(new Date(booking.date), 'MMM d')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Badge className={cn(
              "border-none px-3 py-1.5 rounded-full text-[9px] uppercase tracking-wider font-bold whitespace-nowrap shrink-0",
              STATUS_COLORS[booking.status as keyof typeof STATUS_COLORS]
            )}>
              {STATUS_LABELS[booking.status as keyof typeof STATUS_LABELS]}
            </Badge>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </div>
      </div>

      {/* EXPANDED CONTENT */}
      {isExpanded && (
        <div className="px-6 pb-6 space-y-5 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="flex items-center gap-2.5">
              <Clock3 className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Duration</p>
                <div className="space-y-1 mt-1">
                  <p className="text-sm font-bold text-slate-900">{totalDuration}m total</p>
                  {hasAdminAddedTime && (
                    <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                      +{adminAddedMinutes}m added by admin
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Location</p>
                <p className="text-sm font-bold text-slate-900 mt-1">{booking.location}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Clock3 className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Time</p>
              <p className="text-sm font-bold text-slate-900 mt-1">{booking.time}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2.5">
              <Activity className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Pressure</p>
                <p className="text-sm font-bold text-slate-900 mt-1">{booking.pressure_preference || 'No Preference'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Focus Area</p>
                <p className="text-sm font-bold text-slate-900 mt-1">{booking.focus_area || 'Full Body'}</p>
              </div>
            </div>
          </div>

          {/* Add-ons Breakdown */}
          {(baseAddOns.length > 0 || sessionAddedAddOns.length > 0) && (
            <div className="bg-emerald-50 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Gift className="w-4 h-4 text-emerald-600" />
                <p className="text-sm font-bold text-emerald-900">Services & Add-ons</p>
              </div>
              <div className="space-y-2">
                {baseAddOns.map((addon: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-slate-700">{addon}</span>
                    <span className="text-[11px] text-slate-500 font-medium">(Original)</span>
                  </div>
                ))}
                {sessionAddedAddOns.length > 0 && (
                  <div className="border-t border-emerald-200 pt-2">
                    <p className="text-[10px] font-bold text-emerald-600 mb-2">✨ Added During Session:</p>
                    {sessionAddedAddOns.map((addon: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span className="text-emerald-700 font-medium">{addon}</span>
                        <span className="inline-block px-2 py-0.5 bg-emerald-600 text-white text-[9px] rounded-full font-bold">Added</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Special Requests */}
          {booking.special_requests && (
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-2">Special Requests</p>
              <p className="text-sm text-slate-700">{booking.special_requests}</p>
            </div>
          )}

          {/* Pricing Breakdown */}
          {booking.total_price && (
            <div className="bg-blue-50 rounded-xl p-4 space-y-2 border-l-4 border-blue-400">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <p className="text-sm font-bold text-blue-900">Final Price Breakdown</p>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Base Service ({baseDuration}m):</span>
                  <span className="font-medium text-slate-900">₱{booking.total_price - (hasAdminAddedTime ? (adminAddedMinutes / 15) * 150 : 0) - (sessionAddedAddOns.length * 150)}</span>
                </div>
                {hasAdminAddedTime && (
                  <div className="flex justify-between bg-emerald-100 px-2 py-1 rounded">
                    <span className="text-emerald-700 font-medium">Extra Time (+{adminAddedMinutes}m) ✨:</span>
                    <span className="font-bold text-emerald-700">₱{(adminAddedMinutes / 15) * 150}</span>
                  </div>
                )}
                {sessionAddedAddOns.length > 0 && (
                  <div className="flex justify-between bg-emerald-100 px-2 py-1 rounded">
                    <span className="text-emerald-700 font-medium">Add-ons Added (+{sessionAddedAddOns.length}) ✨:</span>
                    <span className="font-bold text-emerald-700">₱{sessionAddedAddOns.length * 150}</span>
                  </div>
                )}
                <div className="border-t border-blue-200 pt-2 flex justify-between font-bold text-lg text-blue-900">
                  <span>Total Price:</span>
                  <span>₱{booking.total_price?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t border-slate-100">
            {canCancel && (
              <Button
                variant="outline"
                className="flex-1 text-red-600 hover:text-red-700 rounded-xl"
                onClick={onCancel}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            )}

            {canRate && (
              <Button
                variant="outline"
                className="flex-1 text-amber-600 hover:text-amber-700 border-amber-200 hover:bg-amber-50 rounded-xl"
                onClick={onRate} // ✅ This is now connected to the actual function
              >
                <Star className="w-4 h-4 mr-2 fill-amber-500" />
                Rate
              </Button>
            )}

            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={onChatOpen}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Message
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
