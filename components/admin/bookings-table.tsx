'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { 
  User, ChevronDown, ChevronUp, Info, Star, MessageSquare
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { calculateTotalPrice } from '@/lib/pricing'

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

export function BookingsTable({
  bookings,
  onApprove,
  onReject,
  onComplete
}: BookingsTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedExtend, setSelectedExtend] = useState<Record<string, string>>({})
  const [selectedAddOn, setSelectedAddOn] = useState<Record<string, string>>({})
  
  const [bookingModifications, setBookingModifications] = useState<Record<string, {
    extra_minutes: number
    added_ons: any[]
  }>>({})

  useEffect(() => {
    const initialMods: Record<string, any> = {}
    bookings.forEach(b => {
      if (!bookingModifications[b.id]) {
        initialMods[b.id] = {
          extra_minutes: 0,
          added_ons: []
        }
      }
    })
    if (Object.keys(initialMods).length > 0) {
      setBookingModifications(prev => ({ ...prev, ...initialMods }))
    }
  }, [bookings])

  return (
    <div className="flex flex-col gap-3 pb-24 w-full px-0"> 
      {bookings.map(booking => {
        const isExpanded = expandedId === booking.id
        const status = (booking.status || 'pending').toLowerCase()
        
        const modifications = bookingModifications[booking.id] || {
          extra_minutes: 0,
          added_ons: []
        }
        
        const allAddOns = useMemo(() => {
          const existing = booking.add_ons || []
          const newly = modifications.added_ons || []
          const uniqueAdded = newly.filter(newItem => 
            !existing.some(existingItem => 
              existingItem.name === newItem.name && existingItem.price === newItem.price
            )
          )
          return [...existing, ...uniqueAdded]
        }, [booking.add_ons, modifications.added_ons])
        
        // ✅ FIX: Calculate display duration correctly
        // booking.extra_minutes = client added before booking + admin added during approval
        // session_extra_minutes = client added during session (if any)
        const baseMinutes = booking.duration || 60
        const priorExtraMinutes = booking.extra_minutes || 0
        const sessionExtraMinutes = booking.session_extra_minutes || 0
        const adminAddedMinutes = modifications.extra_minutes || 0
        
        const displayDuration = baseMinutes + priorExtraMinutes + sessionExtraMinutes + adminAddedMinutes
        
        const calculatedTotal = useMemo(() => {
          const basePrice = booking.total_price || 600
          const totalExtraMinutes = priorExtraMinutes + sessionExtraMinutes + (modifications.extra_minutes || 0)
          const addOnsCount = (modifications.added_ons || []).length
          return calculateTotalPrice(basePrice, totalExtraMinutes, addOnsCount)
        }, [modifications.extra_minutes, modifications.added_ons, booking.total_price, priorExtraMinutes, sessionExtraMinutes])

        const handleExtendTime = (minutes: number) => {
          const validMinutes = parseInt(String(minutes), 10) || 0
          setBookingModifications(prev => {
            const current = prev[booking.id] || { extra_minutes: 0, added_ons: [] }
            return {
              ...prev,
              [booking.id]: {
                ...current,
                extra_minutes: (current.extra_minutes || 0) + validMinutes
              }
            }
          })
          setSelectedExtend(prev => ({ ...prev, [booking.id]: '' }))
        }

        const handleAddService = (service: { name: string, price: number }) => {
          setBookingModifications(prev => {
            const current = prev[booking.id] || { extra_minutes: 0, added_ons: [] }
            return {
              ...prev,
              [booking.id]: {
                ...current,
                added_ons: [...(current.added_ons || []), service]
              }
            }
          })
          setSelectedAddOn(prev => ({ ...prev, [booking.id]: '' }))
        }

        const basePrice = 600
        const totalExtraMinutes = priorExtraMinutes + sessionExtraMinutes + adminAddedMinutes
        const extraTimePrice = calculatedTotal - basePrice - ((modifications.added_ons?.length || 0) * 150)
        const addOnsPrice = (modifications.added_ons?.length || 0) * 150

        return (
          <div
            key={booking.id}
            className="bg-white rounded-[2rem] shadow-sm ring-1 ring-slate-100 overflow-hidden w-full transition-all"
          >
            {/* Header Row */}
            <div
              className="p-5 flex items-center justify-between cursor-pointer active:bg-slate-50"
              onClick={() => setExpandedId(isExpanded ? null : booking.id)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-base leading-tight truncate">
                    {booking.service} ({displayDuration}m)
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

            {/* Expanded Content */}
            {isExpanded && (
              <div className="px-5 pb-5 space-y-5 bg-white animate-in fade-in slide-in-from-top-1">
                
                {/* Stats Grid */}
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

                {/* ✅ Duration Breakdown - Shows all sources of extra time */}
                {(priorExtraMinutes || sessionExtraMinutes || adminAddedMinutes) > 0 && (
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs space-y-1">
                    <p className="font-bold text-blue-900 mb-2">Duration Breakdown</p>
                    <div className="flex justify-between text-slate-600">
                      <span>Base:</span>
                      <span className="font-bold">{baseMinutes}m</span>
                    </div>
                    {priorExtraMinutes > 0 && (
                      <div className="flex justify-between text-amber-700">
                        <span>Client added before:</span>
                        <span className="font-bold">+{priorExtraMinutes}m</span>
                      </div>
                    )}
                    {sessionExtraMinutes > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Client added during session:</span>
                        <span className="font-bold">+{sessionExtraMinutes}m</span>
                      </div>
                    )}
                    {adminAddedMinutes > 0 && (
                      <div className="flex justify-between text-indigo-700">
                        <span>You added:</span>
                        <span className="font-bold">+{adminAddedMinutes}m</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Active Services */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 px-1">
                    <Info className="h-3 w-3 text-emerald-500" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Active Services</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50/50 rounded-2xl">
                    <Badge className="bg-white text-slate-700 border-none font-bold text-[10px] px-3 py-1.5 rounded-xl shadow-sm">
                      {booking.service} ({displayDuration}m)
                    </Badge>
                    {allAddOns?.map((ao: any, i: number) => (
                      <Badge key={i} className="bg-white text-emerald-600 border-none font-bold text-[10px] px-3 py-1.5 rounded-xl shadow-sm">
                        {ao.name} (+₱{ao.price})
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Client Rating */}
                {booking.status === 'completed' && booking.rating ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 px-1">
                      <Star className="h-3 w-3 text-amber-500" />
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Client Rating</span>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                      <div className="flex items-center gap-2 mb-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star}
                            className={cn(
                              "w-4 h-4",
                              star <= (booking.rating || 0)
                                ? "fill-amber-400 text-amber-400" 
                                : "text-amber-200"
                            )}
                          />
                        ))}
                        <span className="text-sm font-bold text-amber-900 ml-2">{booking.rating}/5</span>
                      </div>
                      {booking.review_comment && (
                        <div className="flex gap-2">
                          <MessageSquare className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-800 italic">"{booking.review_comment}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Manage Session - Only for Approved */}
                {status === 'approved' && (
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      className="bg-slate-50 border-none ring-1 ring-slate-100 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-600 appearance-none focus:ring-emerald-500 cursor-pointer hover:bg-slate-100"
                      value={selectedExtend[booking.id] ?? ''}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val) {
                          handleExtendTime(parseInt(val, 10))
                        }
                      }}
                    >
                      <option value="">Extend Time</option>
                      <option value="15">+15m (₱150)</option>
                      <option value="30">+30m (₱250)</option>
                      <option value="45">+45m (₱350)</option>
                    </select>
                    <select
                      className="bg-slate-50 border-none ring-1 ring-slate-100 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-600 appearance-none focus:ring-emerald-500 cursor-pointer hover:bg-slate-100"
                      value={selectedAddOn[booking.id] ?? ''}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val) {
                          const service = ADD_ON_OPTIONS.find(s => s.name === val)
                          if (service) handleAddService(service)
                        }
                      }}
                    >
                      <option value="">Add Service</option>
                      {ADD_ON_OPTIONS.map((opt, i) => (
                        <option key={i} value={opt.name}>{opt.name} (+₱{opt.price})</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Price Breakdown */}
                {status === 'approved' && (modifications.extra_minutes > 0 || (modifications.added_ons && modifications.added_ons.length > 0)) && (
                  <div className="bg-emerald-50 rounded-xl p-3 text-xs space-y-1.5 border border-emerald-100">
                    <p className="font-bold text-emerald-900">Price Breakdown</p>
                    <div className="flex justify-between text-slate-600">
                      <span>Base:</span>
                      <span className="font-bold">₱{basePrice}</span>
                    </div>
                    {totalExtraMinutes > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Extra Time (+{totalExtraMinutes}m):</span>
                        <span className="font-bold">₱{extraTimePrice}</span>
                      </div>
                    )}
                    {modifications.added_ons && modifications.added_ons.length > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Add-ons ({modifications.added_ons.length} × ₱150):</span>
                        <span className="font-bold">₱{addOnsPrice}</span>
                      </div>
                    )}
                    <div className="pt-1.5 border-t border-emerald-200 flex justify-between font-bold text-emerald-900">
                      <span>Total:</span>
                      <span>₱{calculatedTotal}</span>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Earnings</span>
                    <div className="flex items-center gap-0.5">
                      <span className="text-emerald-600 font-bold text-sm">₱</span>
                      <span className="text-xl font-extrabold text-slate-900 min-w-12">
                        {calculatedTotal}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {status === 'pending' && (
                      <>
                        <button
                          type="button"
                          className="text-red-500 font-bold text-[11px] px-2 active:opacity-50 transition-opacity"
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
                          e.stopPropagation()
                          const existingAddOns = booking.add_ons || []
                          const newAddOns = modifications.added_ons || []
                          const finalAddOns = [...existingAddOns, ...newAddOns]
                          
                          onComplete(booking.id, calculatedTotal, {
                            add_ons: finalAddOns,
                            extra_minutes: adminAddedMinutes || 0,
                            total_price: calculatedTotal
                          })
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
