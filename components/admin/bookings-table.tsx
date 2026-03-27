'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  Plus, X, Loader2, Calendar, Clock, User, CheckCircle2, XCircle, Info
} from 'lucide-react'
import { cn } from '@/lib/utils'

const ADD_ON_OPTIONS = [
  { name: 'Ear Candling', price: 150, duration: 15 },
  { name: 'Ventusa', price: 150, duration: 15 },
  { name: 'Hot Stone', price: 150, duration: 15 },
  { name: 'Fire Massage', price: 150, duration: 15 }
]

interface BookingsTableProps {
  bookings: any[]
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onComplete: (id: string, finalEarnings: number) => void // Updated to accept final price
}

export function BookingsTable({ bookings, onApprove, onReject, onComplete }: BookingsTableProps) {
  const router = useRouter()
  const supabase = createClient()
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [earningsInputs, setEarningsInputs] = useState<Record<string, number>>({})

  // Initialize inputs with the current total price or existing earnings
  useEffect(() => {
    const initialInputs: Record<string, number> = {}
    bookings.forEach(b => { 
      initialInputs[b.id] = b.earnings || b.total_price || 0 
    })
    setEarningsInputs(initialInputs)
  }, [bookings])

  const addExtraService = async (booking: any, addOn: typeof ADD_ON_OPTIONS[0]) => {
    setUpdatingId(booking.id)
    const currentAddOns = Array.isArray(booking.add_ons) ? booking.add_ons : []
    const updatedAddOns = [...currentAddOns, { 
      name: addOn.name, 
      price: addOn.price, 
      duration_minutes: addOn.duration 
    }]
    
    const newTotal = (booking.total_price || 0) + addOn.price
    const newDuration = (booking.duration || 60) + addOn.duration

    const { error } = await supabase.from('bookings').update({ 
      add_ons: updatedAddOns, 
      total_price: newTotal, 
      duration: newDuration,
      earnings: newTotal // Keep earnings synced during add-on phase
    }).eq('id', booking.id)

    if (!error) {
      // Update local input state so it doesn't "jump" back to old value
      setEarningsInputs(prev => ({ ...prev, [booking.id]: newTotal }))
      router.refresh()
    }
    setUpdatingId(null)
  }

  const removeAddOn = async (booking: any, indexToRemove: number) => {
    setUpdatingId(booking.id)
    const currentAddOns = [...booking.add_ons]
    const removedItem = currentAddOns[indexToRemove]
    currentAddOns.splice(indexToRemove, 1)

    const newTotal = Math.max(0, (booking.total_price || 0) - (removedItem.price || 0))
    const newDuration = Math.max(60, (booking.duration || 60) - (removedItem.duration_minutes || 0))

    const { error } = await supabase.from('bookings').update({
      add_ons: currentAddOns,
      total_price: newTotal,
      duration: newDuration,
      earnings: newTotal
    }).eq('id', booking.id)

    if (!error) {
      setEarningsInputs(prev => ({ ...prev, [booking.id]: newTotal }))
      router.refresh()
    }
    setUpdatingId(null)
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      {bookings.map(booking => {
        // Safe status check for button visibility
        const status = booking.status?.toLowerCase() || 'pending'
        
        return (
          <Card key={booking.id} className="overflow-hidden border-none shadow-xl ring-1 ring-slate-100 rounded-[2rem]">
            <CardContent className="p-0">
              {/* Header */}
              <div className="p-6 flex justify-between items-start bg-white border-b border-slate-50">
                <div>
                  <h3 className="font-black text-slate-900 text-xl tracking-tight">{booking.service}</h3>
                  <p className="text-sm text-slate-500 font-bold flex items-center gap-1.5 mt-1">
                    <User className="h-4 w-4 text-emerald-500" /> {booking.name}
                  </p>
                </div>
                <Badge className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-none",
                  status === 'pending' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                )}>
                  {booking.status}
                </Badge>
              </div>

              {/* Date/Time Row */}
              <div className="grid grid-cols-2 border-b border-slate-50 bg-slate-50/30">
                <div className="p-5 border-r border-slate-50 flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-emerald-500" />
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase block">Date</span>
                    <span className="text-sm font-black text-slate-800">
                      {booking.date ? format(parseISO(`${booking.date}T00:00:00`), 'MMM dd, yyyy') : 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="p-5 flex items-center gap-3">
                  <Clock className="h-5 w-5 text-emerald-500" />
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase block">Time Slot</span>
                    <span className="text-sm font-black text-slate-800">{booking.time} ({booking.duration || 60}m)</span>
                  </div>
                </div>
              </div>

              {/* Add-ons Section */}
              <div className="p-6 bg-white space-y-4">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-emerald-500" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Services & Add-ons</span>
                </div>
                
                <div className="flex flex-wrap gap-2 min-h-[32px]">
                  {(!booking.add_ons || booking.add_ons.length === 0) ? (
                    <span className="text-xs font-bold text-slate-300 italic px-1">Standard Session</span>
                  ) : (
                    booking.add_ons.map((ao: any, i: number) => (
                      <Badge key={i} variant="secondary" className="bg-emerald-50 text-emerald-700 border-none font-black text-[11px] pr-1.5 py-1 gap-1.5 rounded-xl">
                        {ao.name}
                        {status !== 'completed' && (
                          <button 
                            onClick={() => removeAddOn(booking, i)}
                            className="bg-emerald-100 hover:bg-emerald-200 rounded-full p-0.5 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))
                  )}
                </div>
                
                {status === 'approved' && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50">
                    {ADD_ON_OPTIONS.map(opt => (
                      <button 
                        key={opt.name} 
                        onClick={() => addExtraService(booking, opt)}
                        disabled={updatingId === booking.id}
                        className="text-[10px] px-3 py-1.5 rounded-xl border border-slate-200 font-bold hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-all disabled:opacity-50"
                      >
                        + {opt.name} (₱{opt.price})
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* FOOTER ACTIONS */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-6">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Earnings</span>
                  <div className="flex items-center">
                    <span className="text-emerald-600 font-black text-xl mr-1.5">₱</span>
                    <Input 
                      type="number"
                      className="w-24 h-10 font-black text-2xl border-none bg-transparent p-0 focus-visible:ring-0 text-slate-900"
                      value={earningsInputs[booking.id] || ''}
                      onChange={(e) => setEarningsInputs({...earningsInputs, [booking.id]: Number(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="flex-1 flex gap-3">
                  {status === 'pending' && (
                    <>
                      <Button 
                        variant="outline"
                        className="flex-1 h-14 border-red-100 text-red-600 font-black rounded-[1.25rem] hover:bg-red-50"
                        onClick={() => onReject(booking.id)}
                      >
                        <XCircle className="w-5 h-5 mr-2" /> Reject
                      </Button>
                      <Button 
                        className="flex-1 h-14 bg-slate-900 text-white font-black rounded-[1.25rem] hover:bg-slate-800 shadow-lg"
                        onClick={() => onApprove(booking.id)}
                      >
                        <CheckCircle2 className="w-5 h-5 mr-2" /> Approve
                      </Button>
                    </>
                  )}

                  {status === 'approved' && (
                    <Button 
                      className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-[1.25rem] shadow-lg"
                      onClick={() => onComplete(booking.id, earningsInputs[booking.id])}
                      disabled={updatingId === booking.id}
                    >
                      {updatingId === booking.id ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Finish Session'}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
