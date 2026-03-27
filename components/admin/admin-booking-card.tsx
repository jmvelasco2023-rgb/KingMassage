'use client'

import React from 'react'
import { Booking } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  User, 
  Info,
  ChevronDown
} from 'lucide-react'

interface AdminBookingCardProps {
  booking: Booking
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onComplete: (id: string) => void 
}

export function AdminBookingCard({ booking, onApprove, onReject, onComplete }: AdminBookingCardProps) {
  const status = booking.status?.toLowerCase()

  return (
    <div className="w-full bg-white rounded-[2.5rem] border-none shadow-sm ring-1 ring-slate-100 overflow-hidden mb-4">
      {/* 1. Main Header Row */}
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
            <User className="h-6 w-6 text-emerald-500" />
          </div>
          <div className="min-w-0">
            <h3 className="font-extrabold text-slate-900 text-xl leading-tight truncate">
              {booking.service}
            </h3>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">
              {booking.name} • {booking.date?.split('-').slice(1).join(' ')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge className={cn(
            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase border-none tracking-widest",
            status === 'pending' ? "bg-amber-100 text-amber-600" : 
            status === 'approved' ? "bg-emerald-100 text-emerald-600" : 
            "bg-blue-100 text-blue-600"
          )}>
            {status}
          </Badge>
          <ChevronDown className="h-5 w-5 text-slate-300" />
        </div>
      </div>

      {/* 2. Expanded Content Section */}
      <div className="px-6 pb-6 space-y-5">
        {/* Preferences Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-3xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1 tracking-widest">Pressure</span>
            <p className="text-base font-bold text-slate-800 capitalize">{booking.pressure_preference || 'Medium'}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-3xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1 tracking-widest">Focus Area</span>
            <p className="text-base font-bold text-slate-800 capitalize">{booking.focus_area?.replace('-', ' ') || 'Upper Body'}</p>
          </div>
        </div>

        {/* Active Services List */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-emerald-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Active Services</span>
          </div>
          <div className="flex flex-wrap gap-2 p-4 bg-slate-50/50 rounded-3xl">
            <Badge className="bg-white text-slate-800 border-none font-bold text-xs px-4 py-2 rounded-2xl shadow-sm">
              {booking.service} ({booking.duration}m)
            </Badge>
            {booking.add_on_service && booking.add_on_service !== 'None' && (
              <Badge className="bg-white text-emerald-700 border-none font-bold text-xs px-4 py-2 rounded-2xl shadow-sm">
                {booking.add_on_service} (+₱{booking.add_on_price})
              </Badge>
            )}
            <Badge className="bg-amber-50 text-amber-700 border-none font-bold text-xs px-4 py-2 rounded-2xl shadow-sm">
              +15m Extension
            </Badge>
          </div>
        </div>

        {/* 3. Footer Action Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Earnings</span>
            <div className="flex items-baseline gap-1">
              <span className="text-emerald-600 font-black text-xl">₱</span>
              <span className="text-slate-900 font-black text-3xl">{booking.total_price}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {status === 'pending' && (
              <>
                <button 
                  onClick={() => onReject(booking.id)}
                  className="text-red-500 font-bold text-sm px-2 active:opacity-50 transition-opacity"
                >
                  Reject
                </button>
                <button 
                  onClick={() => onApprove(booking.id)}
                  className="bg-slate-900 text-white rounded-2xl h-12 px-10 flex items-center justify-center font-bold text-xs active:scale-95 transition-transform shadow-lg shadow-slate-200"
                >
                  Approve
                </button>
              </>
            )}
            {status === 'approved' && (
              <button 
                onClick={() => onComplete(booking.id)}
                className="bg-emerald-600 text-white rounded-[1.5rem] h-14 px-12 flex items-center justify-center font-bold text-sm shadow-xl shadow-emerald-100 active:scale-95 transition-transform"
              >
                Finish Session
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
