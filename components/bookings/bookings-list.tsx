'use client'

import React, { useState } from 'react' 
import type { Booking } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Empty } from '@/components/ui/empty'
import { format, parseISO, startOfDay, isBefore, isSameDay } from 'date-fns'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Sparkles, 
  MessageCircle, 
  CheckCircle, 
  Clock3, 
  XCircle, 
  Star,
  Activity, 
  Target,
  Plus,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { ChatDialog } from '@/components/chat/chat-dialog'
import { CancelDialog } from './cancel-dialog' 
import { RatingDialog } from './rating-dialog' 
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface BookingsListProps {
  bookings: Booking[]
  userId: string
}

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800', 
  rejected: 'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-slate-100 text-slate-800',
}

const STATUS_LABELS = {
  pending: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export function BookingsList({ bookings, userId }: BookingsListProps) {
  const [chatOpen, setChatOpen] = useState(false)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  const safeParseDate = (dateStr: string) => {
    const normalized = dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`
    return parseISO(normalized)
  }

  const handleConfirmCancel = async () => {
    if (!selectedBooking) return
    try {
      setIsSubmitting(true)
      const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', selectedBooking.id)
      if (error) throw error
      setIsCancelModalOpen(false)
      router.refresh()
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setIsSubmitting(false)
      setSelectedBooking(null)
    }
  }

  const today = startOfDay(new Date())
  const upcomingBookings = bookings.filter(b => !['cancelled', 'completed'].includes(b.status) && (isSameDay(safeParseDate(b.date), today) || !isBefore(safeParseDate(b.date), today)))
  const pastBookings = bookings.filter(b => ['cancelled', 'completed'].includes(b.status) || (isBefore(safeParseDate(b.date), today) && !isSameDay(safeParseDate(b.date), today)))

  if (bookings.length === 0) {
    return (
      <Empty icon={Calendar} title="No bookings yet" description="Book your first massage session to get started">
        <Button asChild><a href="/book">Book Now</a></Button>
      </Empty>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pb-20 pt-4">
      {/* Upcoming Sessions */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-6">
          <div className="bg-emerald-100 p-2.5 rounded-full">
            <Clock3 className="w-5 h-5 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Upcoming Sessions</h2>
        </div>
        
        {upcomingBookings.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No upcoming sessions scheduled</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingBookings.map((booking) => (
              <BookingCard 
                key={booking.id} 
                booking={booking} 
                isExpanded={expandedId === booking.id}
                onToggleExpand={() => setExpandedId(expandedId === booking.id ? null : booking.id)}
                onChatOpen={() => { setSelectedBooking(booking); setChatOpen(true); }} 
                onCancel={() => { setSelectedBooking(booking); setIsCancelModalOpen(true); }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Past Activity */}
      {pastBookings.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-6 opacity-60">
            <div className="bg-slate-100 p-2.5 rounded-full">
              <CheckCircle className="w-5 h-5 text-slate-600" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-700">Past Activity</h2>
          </div>
          <div className="space-y-4">
            {pastBookings.map((booking) => (
              <BookingCard 
                key={booking.id} 
                booking={booking} 
                isExpanded={expandedId === booking.id}
                onToggleExpand={() => setExpandedId(expandedId === booking.id ? null : booking.id)}
                onChatOpen={() => { setSelectedBooking(booking); setChatOpen(true); }} 
                onRate={() => { setSelectedBooking(booking); setIsRatingModalOpen(true); }}
                isPast 
              />
            ))}
          </div>
        </section>
      )}

      <ChatDialog open={chatOpen} onOpenChange={setChatOpen} userId={userId} bookingId={selectedBooking?.id || null} serviceName={selectedBooking?.service || "Support"} />
      <CancelDialog isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} onConfirm={handleConfirmCancel} isLoading={isSubmitting} />
      {selectedBooking && <RatingDialog isOpen={isRatingModalOpen} onClose={() => { setIsRatingModalOpen(false); router.refresh(); }} bookingId={selectedBooking.id} serviceName={selectedBooking.service} />}
    </div>
  )
}

function BookingCard({ booking, isExpanded, onToggleExpand, onChatOpen, onCancel, onRate, isPast = false }: any) {
  const canCancel = !isPast && (booking.status === 'pending' || booking.status === 'approved')
  const canRate = booking.status === 'completed' && !booking.rating
  const isCompleted = booking.status === 'completed'
  const isRated = booking.rating !== null && booking.rating !== undefined

  // ✅ FIX: Calculate total duration including admin-added extra_minutes
  const totalDuration = (booking.duration || 60) + (booking.extra_minutes || 0)
  const hasAdminAddedTime = (booking.extra_minutes || 0) > 0
  const hasAddOns = booking.add_ons && booking.add_ons.length > 0

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300 border-none rounded-[2rem]",
      isPast ? "bg-slate-50/50 opacity-80" : "bg-white shadow-lg shadow-slate-200/30 ring-1 ring-slate-100/50"
    )}>
      {/* Status Bar */}
      {!isPast && <div className={cn("h-1.5 w-full", isCompleted ? "bg-blue-500" : "bg-emerald-500")} />}
      
      <CardContent className="p-0">
        {/* ✅ FIXED: Better Collapsible Header Layout - No Overlap */}
        <div
          className="p-6 cursor-pointer hover:bg-slate-50/50 transition-colors space-y-3"
          onClick={onToggleExpand}
        >
          {/* Top Row: Icon + Service Name + Chevron */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={cn("p-3 rounded-2xl shrink-0", isPast ? "bg-slate-100" : isCompleted ? "bg-blue-50" : "bg-emerald-50")}>
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                ) : (
                  <Sparkles className={cn("w-5 h-5", isPast ? "text-slate-400" : "text-emerald-600")} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-lg text-slate-900 leading-tight truncate">{booking.service}</h3>
              </div>
            </div>
            
            {/* Chevron Icon */}
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-slate-400 shrink-0 mt-1" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400 shrink-0 mt-1" />
            )}
          </div>

          {/* Bottom Row: Location + Badge (Separated) */}
          <div className="flex items-center justify-between gap-3 pl-12">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium min-w-0">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{booking.location}</span>
            </div>
            
            <Badge className={cn(
              STATUS_STYLES[booking.status as keyof typeof STATUS_STYLES],
              "border-none px-3 py-1.5 rounded-full text-[9px] uppercase tracking-wider font-bold whitespace-nowrap shrink-0"
            )}>
              {STATUS_LABELS[booking.status as keyof typeof STATUS_LABELS]}
            </Badge>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="px-6 pb-6 space-y-5 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
            
            {/* Session Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2.5">
                <Activity className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Pressure</p>
                  <p className="text-sm font-bold text-slate-700 capitalize mt-0.5">{booking.pressure_preference || 'Medium'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Target className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Focus</p>
                  <p className="text-sm font-bold text-slate-700 capitalize mt-0.5">{booking.focus_area?.replace('-', ' ') || 'Full Body'}</p>
                </div>
              </div>
            </div>

            {/* Add-ons */}
            {hasAddOns && (
              <div className="flex items-start gap-2.5 p-3 bg-emerald-50/50 rounded-2xl">
                <Plus className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[9px] text-emerald-600 uppercase font-bold tracking-wider mb-2">Add-ons</p>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(booking.add_ons) ? booking.add_ons.map((addon: any, idx: number) => (
                      <Badge key={idx} variant="secondary" className="bg-white text-emerald-700 hover:bg-white border-none font-bold text-[11px]">
                        {addon.name} (+₱{addon.price})
                      </Badge>
                    )) : null}
                  </div>
                </div>
              </div>
            )}

            {/* Date & Time */}
            <div className={cn("grid grid-cols-3 gap-3 p-4 rounded-2xl", isPast ? "bg-slate-100/50" : "bg-slate-50")}>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-[9px] text-slate-400 uppercase font-bold">Date</p>
                  <p className="text-sm font-bold text-slate-700">{format(parseISO(booking.date.includes('T') ? booking.date : `${booking.date}T00:00:00`), 'MMM d')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-[9px] text-slate-400 uppercase font-bold">Time</p>
                  <p className="text-sm font-bold text-slate-700">{booking.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock3 className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-[9px] text-slate-400 uppercase font-bold">Duration</p>
                  <div>
                    <p className="text-sm font-bold text-slate-700">{totalDuration}m</p>
                    {hasAdminAddedTime && (
                      <p className="text-[10px] text-emerald-600 font-semibold">+{booking.extra_minutes}m added</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Price Display */}
            {booking.total_price && (
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                <p className="text-[9px] text-emerald-600 uppercase font-bold tracking-wider mb-1">Total Price</p>
                <p className="text-2xl font-bold text-emerald-700">₱{booking.total_price}</p>
              </div>
            )}

            {/* Rating Display */}
            {isCompleted && isRated && (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <div className="flex items-start gap-3">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star}
                        className={cn(
                          "w-4 h-4",
                          star <= (booking.rating || 0) 
                            ? "fill-amber-400 text-amber-400" 
                            : "text-amber-200"
                        )}
                      />
                    ))}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-amber-900">Your Review</p>
                    {booking.review_comment && (
                      <p className="text-xs text-amber-800 mt-1">{booking.review_comment}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap pt-4 border-t border-slate-100">
              <Button 
                variant="secondary" 
                className="flex-1 min-w-[120px] rounded-2xl font-bold bg-slate-100 hover:bg-slate-200 h-11 text-slate-700" 
                onClick={onChatOpen}
              >
                <MessageCircle className="w-4 h-4 mr-2" /> Chat
              </Button>

              {canRate && (
                <Button 
                  className="flex-1 min-w-[120px] rounded-2xl font-bold bg-amber-400 hover:bg-amber-500 text-amber-950 h-11" 
                  onClick={onRate}
                >
                  <Star className="w-4 h-4 mr-2" /> Rate
                </Button>
              )}

              {canCancel && (
                <Button 
                  variant="ghost" 
                  className="flex-1 min-w-[120px] text-red-500 hover:text-red-600 hover:bg-red-50 rounded-2xl font-bold h-11" 
                  onClick={onCancel}
                >
                  <XCircle className="w-4 h-4 mr-2" /> Cancel
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
