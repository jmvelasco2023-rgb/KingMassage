'use client'

import React from 'react' // ✅ Added to resolve ReferenceError during build
import { Booking } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  CheckCircle2, 
  XCircle, 
  User, 
  Clock, 
  Calendar, 
  Activity, 
  Target,
  PlusCircle
} from 'lucide-react'

interface AdminBookingCardProps {
  booking: Booking
  onApprove: (id: string) => void
  onReject: (id: string) => void
}

export function AdminBookingCard({ booking, onApprove, onReject }: AdminBookingCardProps) {
  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden mb-6">
      {/* 1. Header: Service and Client Name */}
      <div className="p-6 flex justify-between items-start">
        <div>
          <h3 className="text-2xl font-black text-slate-900 leading-tight">{booking.service}</h3>
          <div className="flex items-center gap-2 mt-1 text-slate-500 font-bold">
            <User className="w-4 h-4" />
            <span className="text-sm">{booking.name}</span>
          </div>
        </div>
        <Badge className={cn(
          "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
          booking.status === 'pending' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
        )}>
          {booking.status}
        </Badge>
      </div>

      {/* 2. Date & Time Slot */}
      <div className="grid grid-cols-2 border-y border-slate-50">
        <div className="p-5 border-r border-slate-50 flex items-center gap-4">
          <div className="bg-emerald-50 p-2 rounded-xl">
            <Calendar className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black">Date</p>
            <p className="text-sm font-black text-slate-800">{booking.date}</p>
          </div>
        </div>
        <div className="p-5 flex items-center gap-4">
          <div className="bg-emerald-50 p-2 rounded-xl">
            <Clock className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black">Time</p>
            <p className="text-sm font-black text-slate-800">{booking.time} ({booking.duration}m)</p>
          </div>
        </div>
      </div>

      {/* 3. Session Preferences (Captures Step 2 Data) */}
      <div className="p-6 space-y-4 bg-slate-50/30">
        <div className="flex items-center gap-2 mb-1">
          <PlusCircle className="w-4 h-4 text-emerald-600" />
          <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Session Details</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Activity className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-[9px] text-slate-400 uppercase font-bold">Pressure</p>
              <p className="text-xs font-black text-slate-700 capitalize">{booking.pressure_preference || 'No Preference'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Target className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-[9px] text-slate-400 uppercase font-bold">Focus Area</p>
              <p className="text-xs font-black text-slate-700 capitalize">{booking.focus_area?.replace('-', ' ') || 'Full Body'}</p>
            </div>
          </div>
        </div>

        {booking.special_requests && (
          <div className="mt-2 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[9px] text-slate-400 uppercase font-bold mb-1">Special Requests</p>
            <p className="text-xs text-slate-600 italic leading-relaxed font-medium">"{booking.special_requests}"</p>
          </div>
        )}
      </div>

      {/* 4. Action Buttons: Restored for Pending Status */}
      {booking.status === 'pending' && (
        <div className="p-6 bg-white flex gap-4 border-t border-slate-50">
          <Button 
            variant="outline" 
            className="flex-1 h-14 border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-2xl font-black transition-all"
            onClick={() => onReject(booking.id)}
          >
            <XCircle className="w-5 h-5 mr-2" />
            Reject
          </Button>
          <Button 
            className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black shadow-lg shadow-emerald-100 transition-all"
            onClick={() => onApprove(booking.id)}
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Approve
          </Button>
        </div>
      )}

      {/* 5. Pricing Footer */}
      <div className="p-6 bg-slate-900 flex justify-between items-center">
        <p className="text-[10px] text-white/50 uppercase font-black">Total Payment</p>
        <p className="text-xl font-black text-white">₱{booking.total_price}</p>
      </div>
    </div>
  )
}
