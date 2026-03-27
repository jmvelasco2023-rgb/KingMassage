'use client'

import React, { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  User, ChevronDown, ChevronUp, Info, Clock as TimerIcon 
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
  onExtendTime?: (id: string, minutes: number) => void
  onAddService?: (id: string, service: string) => void
}

export function BookingsTable({
  bookings,
  onApprove,
  onReject,
  onComplete,
  onExtendTime,
  onAddService
}: BookingsTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [earningsInputs, setEarningsInputs] = useState<Record<string, number>>({})
  const [selectedExtend, setSelectedExtend] = useState<Record<string, string>>({})
  const [selectedAddOn, setSelectedAddOn] = useState<Record<string, string>>({})

  useEffect(() => {
    const initialInputs: Record<string, number> = {}
    bookings.forEach(b => {
      initialInputs[b.id] = b.earnings ?? b.total_price ?? 0
    })
    setEarningsInputs(initialInputs)
  }, [bookings])

  return (
    <div className="flex flex-col gap-3 pb-24 w-full px-0"> 
      {bookings.map(booking => {
        const isExpanded = expandedId === booking.id
        const status = (booking.status || 'pending').toLowerCase()

        return (
          <div
            key={booking.id}
            className="bg-white rounded-[2rem] shadow-sm ring-1 ring-slate-100 overflow-hidden w-full transition-all"
          >
            {/* 1. Header Row - Scaled down font sizes */}
            <div
              className="p-5 flex items-center justify-between cursor-pointer active:bg-slate-50"
              onClick={() => setExpandedId(isExpanded ? null : booking.id)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="min-w-0">
                  {/* Reduced from text-xl to text-base */}
                  <h3 className="font-bold text-slate-900 text-base leading-tight truncate">
                    {booking.service}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">
                    {booking.name} • {booking.date ? format(parseISO(`${booking.date}T00:00:00`), 'MMM d') : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  className={cn(
                    "px-3 py-1 rounded-full text-[9px] font-bold uppercase border-none tracking-wider",
                    status === 'pending' ? "bg-amber-100 text-amber-600" :
                    status === 'approved' ? "bg-emerald-100 text-emerald-600" :
                    status === 'completed' ? "bg-blue-100 text-blue-600" :
                    "bg-slate-100 text-slate-500"
                  )}
                >
                  {status}
                </Badge>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-300" /> : <ChevronDown className="h-4 w-4 text-slate-300" />}
              </div>
            </div>

            {/* 2. Expanded Content */}
            {isExpanded && (
              <div className="px-5 pb-5 space-y-5 bg-white animate-in fade-in slide-in-from-top-1">
                
                {/* Stats Grid - Smaller text */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-2xl">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5 tracking-tight">Pressure</span>
                    <p className="text-xs font-bold text-slate-700 capitalize">{booking.pressure_preference || 'Medium'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5 tracking-tight">Focus Area</span>
                    <p className="text-xs font-bold text-slate-700 capitalize">{booking.focus_area?.replace('-', ' ') || 'Full Body'}</p>
                  </div>
                </div>

                {/* Active Services */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 px-1">
                    <Info className="h-3 w-3 text-emerald-500" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Active Services</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50/50 rounded-2xl">
                    <Badge className="bg-white text-slate-700 border-none font-bold text-[10px] px-3 py-1.5 rounded-xl shadow-sm">
                      {booking.service} ({booking.duration}m)
                    </Badge>
                    {booking.add_ons?.map((ao: any, i: number) => (
                      <Badge key={i} className="bg-white text-emerald-600 border-none font-bold text-[10px] px-3 py-1.5 rounded-xl shadow-sm">
                        {ao.name} (+₱{ao.price})
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* 3. Manage Session Dropdowns - More compact */}
                {status === 'approved' && (
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      className="bg-slate-50 border-none ring-1 ring-slate-100 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-600 appearance-none focus:ring-emerald-500"
                      value={selectedExtend[booking.id] ?? ''}
                      onChange={(e) => {
                        const val = e.target.value
                        setSelectedExtend(prev => ({ ...prev, [booking.id]: val }))
                        const minutes = val ? parseInt(val, 10) : 0
                        if (minutes && onExtendTime) onExtendTime(booking.id, minutes)
                      }}
                    >
                      <option value="">Extend Time</option>
                      <option value="15">+15m</option>
                      <option value="30">+30m</option>
                    </select>
                    <select
                      className="bg-slate-50 border-none ring-1 ring-slate-100 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-600 appearance-none focus:ring-emerald-500"
                      value={selectedAddOn[booking.id] ?? ''}
                      onChange={(e) => {
                        const val = e.target.value
                        setSelectedAddOn(prev => ({ ...prev, [booking.id]: val }))
                        if (val && onAddService) onAddService(booking.id, val)
                      }}
                    >
                      <option value="">Add Service</option>
                      {ADD_ON_OPTIONS.map((opt, i) => (
                        <option key={i} value={opt.name}>{opt.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 4. Footer - Refined earnings font */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Earnings</span>
                    <div className="flex items-center gap-0.5">
                      <span className="text-emerald-600 font-bold text-sm">₱</span>
                      <Input
                        type="number"
                        className="w-16 h-8 font-extrabold text-lg border-none bg-transparent p-0 focus-visible:ring-0 text-slate-900"
                        value={earningsInputs[booking.id] ?? ''}
                        onChange={(e) => setEarningsInputs({ ...earningsInputs, [booking.id]: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {status === 'pending' && (
                      <>
                        <button
                          type="button"
                          className="text-red-500 font-bold text-[11px] px-2"
                          onClick={(e) => { e.stopPropagation(); onReject(booking.id); }}
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          className="bg-slate-900 text-white rounded-xl h-10 px-6 font-bold text-[11px] active:scale-95 transition-transform"
                          onClick={(e) => { e.stopPropagation(); onApprove(booking.id); }}
                        >
                          Approve
                        </button>
                      </>
                    )}
                    {status === 'approved' && (
                      <button
                        type="button"
                        className="bg-emerald-600 text-white rounded-xl h-11 px-8 font-bold text-xs shadow-md active:scale-95 transition-transform"
                        onClick={(e) => {
                          const finalEarnings = earningsInputs[booking.id] ?? 0
                          onComplete(booking.id, finalEarnings)
                        }}
                      >
                        Finish Session
                      </button>
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
