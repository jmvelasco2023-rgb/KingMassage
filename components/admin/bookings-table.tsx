'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  User, Info, ChevronDown, ChevronUp, Timer
} from 'lucide-react'
import { cn } from '@/lib/utils'

const ADD_ON_OPTIONS = [
  { name: 'Ear Candling', price: 150 },
  { name: 'Ventusa', price: 150 },
  { name: 'Hot Stone', price: 150 },
  { name: 'Fire Massage', price: 150 }
]

interface BookingsTableProps {
  bookings: any[]
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onComplete: (id: string, finalEarnings: number) => void
}

export function BookingsTable({ bookings, onApprove, onReject, onComplete }: BookingsTableProps) {
  const router = useRouter()
  const supabase = createClient()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [earningsInputs, setEarningsInputs] = useState<Record<string, number>>({})

  useEffect(() => {
    const initialInputs: Record<string, number> = {}
    bookings.forEach(b => { 
      initialInputs[b.id] = b.earnings || b.total_price || 0 
    })
    setEarningsInputs(initialInputs)
  }, [bookings])

  const handleAddService = async (e: React.MouseEvent, booking: any, addOn: any) => {
    e.stopPropagation();
    const currentAddOns = Array.isArray(booking.add_ons) ? booking.add_ons : []
    const updatedAddOns = [...currentAddOns, { name: addOn.name, price: addOn.price }]
    const newTotal = (booking.total_price || 0) + addOn.price

    const { error } = await supabase.from('bookings').update({ 
      add_ons: updatedAddOns, 
      total_price: newTotal, 
      earnings: newTotal 
    }).eq('id', booking.id)

    if (!error) {
      setEarningsInputs(prev => ({ ...prev, [booking.id]: newTotal }))
      router.refresh()
    }
  }

  const handleAddTime = async (e: React.MouseEvent, booking: any) => {
    e.stopPropagation();
    const newMinutes = (booking.extra_minutes || 0) + 15
    const newTotal = (booking.total_price || 0) + 150 

    const { error } = await supabase.from('bookings').update({ 
      extra_minutes: newMinutes,
      total_price: newTotal,
      earnings: newTotal
    }).eq('id', booking.id)

    if (!error) {
      setEarningsInputs(prev => ({ ...prev, [booking.id]: newTotal }))
      router.refresh()
    }
  }

  return (
    <div className="flex flex-col gap-4 pb-24 w-full px-1"> {/* Wider container */}
      {bookings.map(booking => {
        const isExpanded = expandedId === booking.id
        const status = booking.status?.toLowerCase() || 'pending'
        
        return (
          <Card key={booking.id} className="border-none shadow-md ring-1 ring-slate-100 rounded-[2.5rem] overflow-hidden w-full">
            <CardContent className="p-0">
              {/* Header / Clickable Area */}
              <div 
                className="py-5 px-6 flex items-center justify-between cursor-pointer active:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : booking.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <User className="h-7 w-7 text-emerald-500" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-slate-900 text-xl leading-tight">{booking.service}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">
                      {booking.name} • {booking.date ? format(parseISO(`${booking.date}T00:00:00`), 'MMM d') : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase border-none tracking-widest",
                    status === 'pending' ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                  )}>
                    {status}
                  </Badge>
                  {isExpanded ? <ChevronUp className="h-6 w-6 text-slate-300" /> : <ChevronDown className="h-6 w-6 text-slate-300" />}
                </div>
              </div>

              {isExpanded && (
                <div className="px-6 pb-8 pt-2 space-y-6 bg-white border-t border-slate-50">
                  {/* Preferences Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-3xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1 tracking-widest">Pressure</span>
                      <p className="text-base font-bold text-slate-800">{booking.pressure_preference || 'Medium'}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-3xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1 tracking-widest">Focus Area</span>
                      <p className="text-base font-bold text-slate-800">{booking.focus_area || 'Full Body'}</p>
                    </div>
                  </div>

                  {/* Active Services List */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-emerald-500" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Active Services</span>
                    </div>
                    <div className="flex flex-wrap gap-2 p-4 bg-slate-50/50 rounded-3xl min-h-[60px]">
                      <Badge className="bg-white text-slate-800 border-none font-bold text-xs px-4 py-2 rounded-2xl shadow-sm">
                        {booking.service} ({booking.duration}m)
                      </Badge>
                      {booking.add_ons?.map((ao: any, i: number) => (
                        <Badge key={i} className="bg-white text-emerald-700 border-none font-bold text-xs px-4 py-2 rounded-2xl shadow-sm">
                          {ao.name} (+₱{ao.price})
                        </Badge>
                      ))}
                      {booking.extra_minutes > 0 && (
                        <Badge className="bg-amber-50 text-amber-700 border-none font-bold text-xs px-4 py-2 rounded-2xl shadow-sm">
                          +{booking.extra_minutes}m Extension
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons for Approved Bookings */}
                  {status === 'approved' && (
                    <div className="space-y-3 pt-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-widest">Add Extras:</span>
                      <div className="flex flex-wrap gap-2">
                        <button 
                          onClick={(e) => handleAddTime(e, booking)}
                          className="flex items-center gap-1.5 text-[10px] px-4 py-2.5 rounded-2xl border border-amber-200 bg-amber-50 text-amber-700 font-bold active:scale-95 transition-transform"
                        >
                          <Timer className="h-3 w-3" /> +15m (₱150)
                        </button>
                        {ADD_ON_OPTIONS.map(opt => (
                          <button 
                            key={opt.name}
                            onClick={(e) => handleAddService(e, booking, opt)}
                            className="text-[10px] px-4 py-2.5 rounded-2xl border border-slate-200 font-bold text-slate-500 active:bg-emerald-50 active:scale-95 transition-all"
                          >
                            + {opt.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer Action Bar */}
                  <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Earnings</span>
                      <div className="flex items-center">
                        <span className="text-emerald-600 font-black text-2xl mr-1">₱</span>
                        <Input 
                          type="number"
                          className="w-24 h-10 font-black text-3xl border-none bg-transparent p-0 focus-visible:ring-0 text-slate-900"
                          value={earningsInputs[booking.id] || ''}
                          onChange={(e) => setEarningsInputs({...earningsInputs, [booking.id]: Number(e.target.value)})}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {status === 'pending' && (
                        <>
                          <button 
                            className="text-red-500 font-bold text-sm px-3 py-2 active:opacity-50"
                            onClick={(e) => { e.stopPropagation(); onReject(booking.id); }}
                          >
                            Reject
                          </button>
                          <button 
                            className="bg-slate-900 text-white rounded-2xl h-12 px-10 flex items-center justify-center font-bold text-xs active:scale-95 shadow-lg shadow-slate-200"
                            onClick={(e) => { e.stopPropagation(); onApprove(booking.id); }}
                          >
                            Approve
                          </button>
                        </>
                      )}
                      {status === 'approved' && (
                        <button 
                          className="bg-emerald-600 text-white rounded-[1.5rem] h-14 px-12 flex items-center justify-center font-bold text-sm shadow-xl shadow-emerald-100 active:scale-95 transition-transform"
                          onClick={(e) => { e.stopPropagation(); onComplete(booking.id, earningsInputs[booking.id]); }}
                        >
                          Finish Session
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
