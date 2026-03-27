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
  X, Loader2, Calendar, Clock, User, Info, ChevronDown, ChevronUp
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
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [earningsInputs, setEarningsInputs] = useState<Record<string, number>>({})

  useEffect(() => {
    const initialInputs: Record<string, number> = {}
    bookings.forEach(b => { 
      initialInputs[b.id] = b.earnings || b.total_price || 0 
    })
    setEarningsInputs(initialInputs)
  }, [bookings])

  // --- PREVENT BUBBLING: This makes buttons work ---
  const handleButtonClick = (e: React.MouseEvent, fn: () => void) => {
    e.preventDefault();
    e.stopPropagation(); // Prevents the card from closing
    fn();
  };

  const addExtraService = async (e: React.MouseEvent, booking: any, addOn: any) => {
    e.stopPropagation();
    setUpdatingId(booking.id)
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
    setUpdatingId(null)
  }

  return (
    <div className="flex flex-col gap-3 pb-24 px-3">
      {bookings.map(booking => {
        const isExpanded = expandedId === booking.id
        const status = booking.status?.toLowerCase() || 'pending'
        
        return (
          <Card key={booking.id} className="border-none shadow-sm ring-1 ring-slate-100 rounded-[2rem] overflow-hidden">
            <CardContent className="p-0">
              {/* SLIM HEADER */}
              <div 
                className="py-4 px-5 flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : booking.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <User className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 text-lg leading-tight">{booking.service}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">
                      {booking.name} • {booking.date ? format(parseISO(`${booking.date}T00:00:00`), 'MMM d') : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase border-none",
                    status === 'pending' ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                  )}>
                    {status}
                  </Badge>
                  {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-300" /> : <ChevronDown className="h-5 w-5 text-slate-300" />}
                </div>
              </div>

              {/* EXPANDED SECTION */}
              {isExpanded && (
                <div className="px-5 pb-6 pt-2 space-y-5 bg-white border-t border-slate-50">
                  {/* Prefs Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-2xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Pressure</span>
                      <p className="text-sm font-bold text-slate-700 capitalize">{booking.pressure_preference || 'Medium'}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Focus</span>
                      <p className="text-sm font-bold text-slate-700 capitalize">{booking.focus_area || 'Full Body'}</p>
                    </div>
                  </div>

                  {/* Active Add-ons */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-emerald-500" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Services</span>
                    </div>
                    <div className="flex flex-wrap gap-2 p-3 bg-slate-50/50 rounded-2xl min-h-[50px]">
                      {(!booking.add_ons || booking.add_ons.length === 0) ? (
                        <span className="text-xs font-medium text-slate-300 italic">No add-ons selected</span>
                      ) : (
                        booking.add_ons.map((ao: any, i: number) => (
                          <Badge key={i} className="bg-white text-emerald-700 border-none font-bold text-[11px] px-3 py-1.5 rounded-xl shadow-sm">
                            {ao.name} (₱{ao.price})
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>

                  {/* ADMIN: Add Add-ons (Restored) */}
                  {status === 'approved' && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Add Service:</span>
                      <div className="flex flex-wrap gap-2">
                        {ADD_ON_OPTIONS.map(opt => (
                          <button 
                            key={opt.name} 
                            onClick={(e) => addExtraService(e, booking, opt)}
                            className="text-[10px] px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-500 active:bg-emerald-50"
                          >
                            + {opt.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* FOOTER ACTIONS */}
                  <div className="flex items-center justify-between pt-5 border-t border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Total</span>
                      <div className="flex items-center">
                        <span className="text-emerald-600 font-bold text-xl mr-1">₱</span>
                        <Input 
                          type="number"
                          className="w-20 h-8 font-bold text-2xl border-none bg-transparent p-0 focus-visible:ring-0 text-slate-900"
                          value={earningsInputs[booking.id] || ''}
                          onChange={(e) => setEarningsInputs({...earningsInputs, [booking.id]: Number(e.target.value)})}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {status === 'pending' && (
                        <>
                          <button 
                            className="text-red-500 font-bold text-sm px-2"
                            onClick={(e) => handleButtonClick(e, () => onReject(booking.id))}
                          >
                            Reject
                          </button>
                          <Button 
                            className="bg-[#0f172a] text-white rounded-2xl h-11 px-8 font-bold shadow-lg shadow-slate-200"
                            onClick={(e) => handleButtonClick(e, () => onApprove(booking.id))}
                          >
                            Approve
                          </Button>
                        </>
                      )}
                      {status === 'approved' && (
                        <Button 
                          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl h-11 px-10 font-bold shadow-lg shadow-emerald-100"
                          onClick={(e) => handleButtonClick(e, () => onComplete(booking.id, earningsInputs[booking.id]))}
                        >
                          Finish Session
                        </Button>
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
