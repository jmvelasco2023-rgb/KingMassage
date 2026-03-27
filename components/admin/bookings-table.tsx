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
    // Clean, edge-to-edge container to match Registered Clients list
    <div className="flex flex-col gap-4 pb-24 w-full px-0"> 
      {bookings.map(booking => {
        const isExpanded = expandedId === booking.id
        const status = (booking.status || 'pending').toLowerCase()

        return (
          <div
            key={booking.id}
            className="bg-white rounded-[2.5rem] shadow-sm ring-1 ring-slate-100 overflow-hidden w-full transition-all"
          >
            {/* 1. Header Row - Replicating your Registered Clients Layout */}
            <div
              className="p-6 flex items-center justify-between cursor-pointer active:bg-slate-50 transition-colors"
              onClick={() => setExpandedId(isExpanded ? null : booking.id)}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                  <User className="h-6 w-6 text-emerald-500" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-slate-900 text-xl leading-tight truncate">
                    {booking.service}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">
                    {booking.name} • {booking.date ? format(parseISO(`${booking.date}T00:00:00`), 'MMM d') : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge
                  className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase border-none tracking-widest",
                    status === 'pending' ? "bg-amber-100 text-amber-600" :
                    status === 'approved' ? "bg-emerald-100 text-emerald-600" :
                    status === 'completed' ? "bg-blue-100 text-blue-600" :
                    "bg-slate-100 text-slate-500"
                  )}
                >
                  {status}
                </Badge>
                {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-300" /> : <ChevronDown className="h-5 w-5 text-slate-300" />}
              </div>
            </div>

            {/* 2. Expanded Details Section */}
            {isExpanded && (
              <div className="px-6 pb-6 space-y-6 bg-white animate-in fade-in slide-in-from-top-2">
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-3xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1 tracking-widest">Pressure</span>
                    <p className="text-base font-bold text-slate-800 capitalize">{booking.pressure_preference || 'Medium'}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-3xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1 tracking-widest">Focus Area</span>
                    <p className="text-base font-bold text-slate-800 capitalize">{booking.focus_area?.replace('-', ' ') || 'Full Body'}</p>
                  </div>
                </div>

                {/* Pill-Style Active Services */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-emerald-500" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Active Services</span>
                  </div>
                  <div className="flex flex-wrap gap-2 p-4 bg-slate-50/50 rounded-3xl">
                    <Badge className="bg-white text-slate-800 border-none font-bold text-xs px-4 py-2 rounded-2xl shadow-sm">
                      {booking.service} ({booking.duration}m)
                    </Badge>
                    {booking.add_ons?.map((ao: any, i: number) => (
                      <Badge key={i} className="bg-white text-emerald-700 border-none font-bold text-xs px-4 py-2 rounded-2xl shadow-sm">
                        {ao.name} (+₱{ao.price})
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* 3. Admin Quick Actions (Floating Pill Style) */}
                {status === 'approved' && (
                  <div className="bg-slate-50 rounded-[2rem] p-5 space-y-4 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manage Session</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="relative">
                        <TimerIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                        <select
                          className="w-full bg-white border-none ring-1 ring-slate-200 rounded-2xl pl-11 pr-4 py-3 text-xs font-bold text-slate-700 shadow-sm appearance-none focus:ring-emerald-500"
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
                          <option value="60">+60m</option>
                        </select>
                      </div>
                      <select
                        className="w-full bg-white border-none ring-1 ring-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-700 shadow-sm appearance-none focus:ring-emerald-500"
                        value={selectedAddOn[booking.id] ?? ''}
                        onChange={(e) => {
                          const val = e.target.value
                          setSelectedAddOn(prev => ({ ...prev, [booking.id]: val }))
                          if (val && onAddService) onAddService(booking.id, val)
                        }}
                      >
                        <option value="">Add Service</option>
                        {ADD_ON_OPTIONS.map((opt, i) => (
                          <option key={i} value={opt.name}>{opt.name} (+₱{opt.price})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* 4. Footer Action Bar with Earnings */}
                <div className="flex items-center justify-between pt-5 border-t border-slate-50">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Earnings</span>
                    <div className="flex items-center gap-1">
                      <span className="text-emerald-600 font-black text-xl">₱</span>
                      <Input
                        type="number"
                        className="w-24 h-10 font-black text-3xl border-none bg-transparent p-0 focus-visible:ring-0 text-slate-900"
                        value={earningsInputs[booking.id] ?? ''}
                        onChange={(e) => {
                          setEarningsInputs({ ...earningsInputs, [booking.id]: Number(e.target.value) })
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {status === 'pending' && (
                      <>
                        <button
                          type="button"
                          className="text-red-500 font-bold text-sm px-2 active:opacity-50 transition-opacity"
                          onClick={(e) => { e.stopPropagation(); onReject(booking.id); }}
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          className="bg-slate-900 text-white rounded-2xl h-12 px-10 font-bold text-xs shadow-lg active:scale-95 transition-transform"
                          onClick={(e) => { e.stopPropagation(); onApprove(booking.id); }}
                        >
                          Approve
                        </button>
                      </>
                    )}
                    {status === 'approved' && (
                      <button
                        type="button"
                        className="bg-emerald-600 text-white rounded-[1.5rem] h-14 px-10 font-bold text-sm shadow-xl active:scale-95 transition-transform"
                        onClick={(e) => {
                          const finalEarnings = earningsInputs[booking.id] ?? 0
                          onComplete(booking.id, finalEarnings)
                        }}
                      >
                        Finish Session
                      </button>
                    )}
                    {status === 'completed' && (
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed</span>
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
