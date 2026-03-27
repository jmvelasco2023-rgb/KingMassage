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
  Plus, X, Loader2, Calendar, Clock, User, CheckCircle2 
} from 'lucide-react'

const ADD_ON_OPTIONS = [
  { name: 'Ear Candling', price: 150, duration: 15 },
  { name: 'Ventusa', price: 200, duration: 15 },
  { name: 'Hot Stone', price: 200, duration: 15 },
  { name: 'Fire Massage', price: 200, duration: 15 }
]

export function BookingsTable({ bookings }: { bookings: any[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [earningsInputs, setEarningsInputs] = useState<Record<string, number>>({})

  useEffect(() => {
    const initialInputs: Record<string, number> = {}
    bookings.forEach(b => { 
      initialInputs[b.id] = b.total_price || b.earnings || 0 
    })
    setEarningsInputs(initialInputs)
  }, [bookings])

  // --- ADD ADD-ON LOGIC ---
  const addExtraService = async (booking: any, addOn: typeof ADD_ON_OPTIONS[0]) => {
    setUpdatingId(booking.id)
    const currentAddOns = Array.isArray(booking.add_ons) ? booking.add_ons : []
    const updatedAddOns = [...currentAddOns, { 
      name: addOn.name, 
      price: addOn.price, 
      duration_minutes: addOn.duration 
    }]
    
    const newTotal = (earningsInputs[booking.id] || 0) + addOn.price
    const newDuration = (booking.duration || 60) + addOn.duration

    const { error } = await supabase.from('bookings').update({ 
      add_ons: updatedAddOns, 
      total_price: newTotal, 
      duration: newDuration 
    }).eq('id', booking.id)

    if (!error) router.refresh()
    setUpdatingId(null)
  }

  const completeBooking = async (id: string) => {
    setUpdatingId(id)
    const { error } = await supabase.from('bookings')
      .update({ status: 'completed', earnings: earningsInputs[id] })
      .eq('id', id)
    
    if (error) {
        console.error("Complete Error:", error.message)
        alert("Database error: " + error.message)
    } else {
        router.refresh()
    }
    setUpdatingId(null)
  }

  return (
    <div className="flex flex-col gap-4 pb-24">
      {bookings.map(booking => (
        <Card key={booking.id} className="overflow-hidden border-none shadow-md ring-1 ring-slate-200">
          <CardContent className="p-0">
            <div className="p-4 flex justify-between items-start bg-slate-50/50 border-b">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{booking.service}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <User className="h-3 w-3" /> {booking.name}
                </p>
              </div>
              <Badge variant={booking.status === 'completed' ? 'default' : 'secondary'}>
                {booking.status}
              </Badge>
            </div>

            <div className="p-4 grid grid-cols-2 gap-4 bg-white border-b">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Date</span>
                <div className="flex items-center text-sm font-semibold">
                  <Calendar className="h-4 w-4 mr-2 text-emerald-500" />
                  {booking.date ? format(parseISO(`${booking.date}T00:00:00`), 'MMM dd') : 'N/A'}
                </div>
              </div>
              <div className="space-y-1 border-l pl-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Time</span>
                <div className="flex items-center text-sm font-semibold">
                  <Clock className="h-4 w-4 mr-2 text-emerald-500" />
                  {booking.time} ({booking.duration || 60}m)
                </div>
              </div>
            </div>

            {/* ADD-ONS AREA */}
            <div className="p-4 bg-white space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Services & Add-ons</span>
              <div className="flex flex-wrap gap-1.5">
                {(!booking.add_ons || booking.add_ons.length === 0) ? (
                  <span className="text-xs text-slate-400 italic">No extra services</span>
                ) : (
                  booking.add_ons.map((ao: any, i: number) => (
                    <Badge key={i} variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                      {ao.name}
                    </Badge>
                  ))
                )}
              </div>
              
              {booking.status !== 'completed' && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {ADD_ON_OPTIONS.map(opt => (
                    <Button 
                      key={opt.name} 
                      variant="ghost" 
                      className="h-7 px-2 text-[10px] border border-dashed rounded-md hover:bg-emerald-50"
                      onClick={() => addExtraService(booking, opt)}
                      disabled={updatingId === booking.id}
                    >
                      + {opt.name}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Total PHP</span>
                <div className="flex items-center">
                  <span className="text-emerald-600 font-bold mr-1">₱</span>
                  <Input 
                    type="number"
                    className="w-20 h-9 font-black text-xl border-none bg-transparent p-0 focus-visible:ring-0"
                    value={earningsInputs[booking.id] || ''}
                    onChange={(e) => setEarningsInputs({...earningsInputs, [booking.id]: Number(e.target.value)})}
                  />
                </div>
              </div>

              {booking.status === 'approved' && (
                <Button 
                  className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-100"
                  onClick={() => completeBooking(booking.id)}
                  disabled={updatingId === booking.id}
                >
                  {updatingId === booking.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Complete Session'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
