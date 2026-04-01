'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { User, ChevronDown, ChevronUp, Info, Star, MessageSquare } from 'lucide-react'
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
  onComplete: (id: string, finalEarnings: number, bookingData?: any) => void
}

export function BookingsTable({ bookings, onApprove, onReject, onComplete }: BookingsTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedExtend, setSelectedExtend] = useState<Record<string, string>>({})
  const [selectedAddOn, setSelectedAddOn] = useState<Record<string, string>>({})
  const [bookingModifications, setBookingModifications] = useState<Record<string, { extra_minutes: number, added_ons: any[] }>>({})

  useEffect(() => {
    const initialMods: Record<string, any> = {}
    bookings.forEach(b => {
      if (!bookingModifications[b.id]) {
        initialMods[b.id] = { extra_minutes: 0, added_ons: [] }
      }
    })
    if (Object.keys(initialMods).length > 0) setBookingModifications(prev => ({ ...prev, ...initialMods }))
  }, [bookings])

  return (
    <div className="flex flex-col gap-3 pb-24 w-full"> 
      {bookings.map(booking => {
        const isExpanded = expandedId === booking.id
        const status = (booking.status || 'pending').toLowerCase()
        const mods = bookingModifications[booking.id] || { extra_minutes: 0, added_ons: [] }
        
        // ✅ START FROM DB PRICE: Ensures 750 + additions = 900+
        const calculatedTotal = useMemo(() => {
          const startingPrice = booking.total_price || 600
          const adminMinutesCost = (mods.extra_minutes / 15) * 150
          const adminAddOnsCost = (mods.added_ons?.length || 0) * 150
          return startingPrice + adminMinutesCost + adminAddOnsCost
        }, [booking.total_price, mods.extra_minutes, mods.added_ons])

        const displayDuration = (booking.duration || 60) + (booking.extra_minutes || 0) + (booking.session_extra_minutes || 0) + mods.extra_minutes

        return (
          <div key={booking.id} className="bg-white rounded-[2rem] shadow-sm ring-1 ring-slate-100 overflow-hidden w-full transition-all">
            <div className="p-5 flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : booking.id)}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center"><User className="h-5 w-5 text-emerald-500" /></div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{booking.service} ({displayDuration}m)</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{booking.name} • {booking.date ? format(parseISO(`${booking.date}T00:00:00`), 'MMM d') : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={cn("px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider", status === 'pending' ? "bg-amber-100 text-amber-600" : status === 'approved' ? "bg-emerald-100 text-emerald-600" : status === 'completed' ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500")}>{status}</Badge>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-300" /> : <ChevronDown className="h-4 w-4 text-slate-300" />}
              </div>
            </div>

            {isExpanded && (
              <div className="px-5 pb-5 space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-2xl"><span className="text-[9px] font-bold text-slate-400 uppercase">Pressure</span><p className="text-xs font-bold text-slate-700 capitalize">{booking.pressure_preference || 'Medium'}</p></div>
                  <div className="p-3 bg-slate-50 rounded-2xl"><span className="text-[9px] font-bold text-slate-400 uppercase">Focus Area</span><p className="text-xs font-bold text-slate-700 capitalize">{booking.focus_area?.replace('-', ' ') || 'Full Body'}</p></div>
                </div>

                {status === 'approved' && (
                  <div className="grid grid-cols-2 gap-2">
                    <select className="bg-slate-50 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-600 appearance-none" value={selectedExtend[booking.id] || ''} onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (val) setBookingModifications(prev => ({ ...prev, [booking.id]: { ...mods, extra_minutes: mods.extra_minutes + val } }));
                      setSelectedExtend(prev => ({ ...prev, [booking.id]: '' }));
                    }}>
                      <option value="">Extend Time</option>
                      <option value="15">+15m (₱150)</option>
                      <option value="30">+30m (₱250)</option>
                    </select>
                    <select className="bg-slate-50 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-600 appearance-none" value={selectedAddOn[booking.id] || ''} onChange={(e) => {
                      const service = ADD_ON_OPTIONS.find(s => s.name === e.target.value);
                      if (service) setBookingModifications(prev => ({ ...prev, [booking.id]: { ...mods, added_ons: [...mods.added_ons, service] } }));
                      setSelectedAddOn(prev => ({ ...prev, [booking.id]: '' }));
                    }}>
                      <option value="">Add Service</option>
                      {ADD_ON_OPTIONS.map((opt, i) => <option key={i} value={opt.name}>{opt.name} (+₱{opt.price})</option>)}
                    </select>
                  </div>
                )}

                {/* ✅ UPDATED PRICE BREAKDOWN */}
                {status === 'approved' && (mods.extra_minutes > 0 || mods.added_ons.length > 0) && (
                  <div className="bg-emerald-50 rounded-xl p-3 text-xs space-y-1.5 border border-emerald-100">
                    <p className="font-bold text-emerald-900">Session Updates</p>
                    <div className="flex justify-between text-slate-600"><span>Initial Booking Total:</span><span className="font-bold">₱{booking.total_price}</span></div>
                    {mods.extra_minutes > 0 && <div className="flex justify-between text-emerald-700"><span>Extra Time (+{mods.extra_minutes}m):</span><span className="font-bold">₱{(mods.extra_minutes / 15) * 150}</span></div>}
                    {mods.added_ons.length > 0 && <div className="flex justify-between text-emerald-700"><span>Add-ons:</span><span className="font-bold">₱{mods.added_ons.length * 150}</span></div>}
                    <div className="pt-1.5 border-t border-emerald-200 flex justify-between font-bold text-emerald-900"><span>Final Total:</span><span>₱{calculatedTotal}</span></div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Earnings</span>
                    <div className="flex items-center gap-0.5"><span className="text-emerald-600 font-bold text-sm">₱</span><span className="text-xl font-extrabold text-slate-900">{calculatedTotal}</span></div>
                  </div>
                  <div className="flex items-center gap-3">
                    {status === 'pending' && <button className="bg-slate-900 text-white rounded-xl h-10 px-6 font-bold text-[11px]" onClick={() => onApprove(booking.id)}>Approve</button>}
                    {status === 'approved' && (
                      <button className="bg-emerald-600 text-white rounded-xl h-11 px-8 font-bold text-xs" onClick={() => {
                        // ✅ MERGE DATA CORRECTLY
                        onComplete(booking.id, calculatedTotal, {
                          add_ons: [...(booking.add_ons || []), ...mods.added_ons],
                          extra_minutes: (booking.extra_minutes || 0) + mods.extra_minutes,
                          total_price: calculatedTotal
                        })
                      }}>Finish Session</button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
