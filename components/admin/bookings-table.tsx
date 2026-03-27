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

  const handleAction = async (e: React.MouseEvent, actionFn: (id: string) => void, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Action triggered for ID:", id); // Debug log
    actionFn(id);
  };

  return (
    <div className="flex flex-col gap-3 pb-24 w-full px-2">
      {bookings.map(booking => {
        const isExpanded = expandedId === booking.id
        const status = booking.status?.toLowerCase() || 'pending'
        
        return (
          <Card key={booking.id} className="border border-slate-100 shadow-sm rounded-3xl overflow-hidden w-full bg-white">
            <CardContent className="p-0">
              {/* Header - Matches Client Tile Style */}
              <div 
                className="py-4 px-5 flex items-center justify-between cursor-pointer active:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : booking.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <User className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-800 text-lg leading-tight truncate">
                      {booking.service}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium truncate uppercase tracking-tight">
                      {booking.name} • {booking.date ? format(parseISO(`${booking.date}T00:00:00`), 'MMM d') : ''}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase border-none",
                    status === 'pending' ? "bg-amber-100 text-amber-600" : 
                    status === 'approved' ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"
                  )}>
                    {status}
                  </Badge>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                </div>
              </div>

              {isExpanded && (
                <div className="px-5 pb-6 pt-2 space-y-5 bg-white border-t border-slate-50">
                  {/* Info Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-2xl">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5 tracking-wider">Pressure</span>
                      <p className="text-sm font-bold text-slate-700">{booking.pressure_preference || 'Medium'}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5 tracking-wider">Focus Area</span>
                      <p className="text-sm font-bold text-slate-700">{booking.focus_area || 'Full Body'}</p>
                    </div>
                  </div>

                  {/* Buttons Section */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Earnings</span>
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

                    <div className="flex items-center gap-2">
                      {status === 'pending' && (
                        <>
                          <button 
                            type="button"
                            className="text-red-500 font-bold text-sm px-4 py-2 active:opacity-50"
                            onClick={(e) => handleAction(e, onReject, booking.id)}
                          >
                            Reject
                          </button>
                          <button 
                            type="button"
                            className="bg-slate-900 text-white rounded-xl h-10 px-6 flex items-center justify-center font-bold text-xs active:scale-95 transition-transform"
                            onClick={(e) => handleAction(e, onApprove, booking.id)}
                          >
                            Approve
                          </button>
                        </>
                      )}
                      {status === 'approved' && (
                        <button 
                          type="button"
                          className="bg-emerald-600 text-white rounded-xl h-11 px-8 flex items-center justify-center font-bold text-xs shadow-lg active:scale-95 transition-transform"
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
