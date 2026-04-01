'use client'

import React, { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronUp, User, Gift, Clock, AlertCircle, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BookingsTableProps {
  bookings: any[]
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onComplete: (id: string, finalEarnings: number, bookingData?: any) => void
}

const ADD_ON_OPTIONS = [
  { name: 'Hot Stone', price: 150 },
  { name: 'Ear Candling', price: 150 },
  { name: 'Ventusa', price: 150 },
  { name: 'Fire Massage', price: 150 }
]

export function BookingsTable({ bookings, onApprove, onReject, onComplete }: BookingsTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [bookingModifications, setBookingModifications] = useState<Record<string, any>>({})
  const [selectedExtend, setSelectedExtend] = useState<Record<string, string>>({})
  const [selectedAddOn, setSelectedAddOn] = useState<Record<string, string>>({})

  return (
    <div className="space-y-3">
      {bookings.map(booking => {
        const isExpanded = expandedId === booking.id
        const status = (booking.status || 'pending').toLowerCase()
        const mods = bookingModifications[booking.id] || { extra_minutes: 0, added_ons: [] }
        
        // ✅ START FROM DB PRICE: Ensures original price + additions = final total
        const calculatedTotal = useMemo(() => {
          const startingPrice = booking.total_price || 600
          const adminMinutesCost = (mods.extra_minutes / 15) * 150
          const adminAddOnsCost = (mods.added_ons?.length || 0) * 150
          return startingPrice + adminMinutesCost + adminAddOnsCost
        }, [booking.total_price, mods.extra_minutes, mods.added_ons])

        // ✅ TRANSPARENCY: Calculate display duration
        const baseDuration = booking.duration || 60
        const displayDuration = baseDuration + (booking.extra_minutes || 0) + mods.extra_minutes

        return (
          <Card key={booking.id} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all">
            <div 
              className="p-5 flex items-center justify-between cursor-pointer bg-white hover:bg-slate-50"
              onClick={() => setExpandedId(isExpanded ? null : booking.id)}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                  <User className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-slate-900 text-base">{booking.service} ({displayDuration}m)</h3>
                  <p className="text-sm text-slate-500">{booking.name} • {booking.date}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant="outline" className={cn(
                  "text-[10px] font-bold uppercase",
                  status === 'pending' ? "bg-yellow-50 text-yellow-700" :
                  status === 'approved' ? "bg-emerald-50 text-emerald-700" :
                  "bg-blue-50 text-blue-700"
                )}>
                  {status}
                </Badge>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </div>

            {isExpanded && (
              <div className="border-t border-slate-100 p-5 space-y-4 bg-slate-50/50 animate-in fade-in">
                {/* Client Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase font-bold">Client</p>
                    <p className="text-sm font-bold text-slate-900 mt-1">{booking.name}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase font-bold">Mobile</p>
                    <p className="text-sm font-bold text-slate-900 mt-1">{booking.mobile}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase font-bold">Location</p>
                    <p className="text-sm font-bold text-slate-900 mt-1">{booking.location}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase font-bold">Time</p>
                    <p className="text-sm font-bold text-slate-900 mt-1">{booking.time}</p>
                  </div>
                </div>

                {/* ✅ TRANSPARENCY: Duration Breakdown */}
                <div className="bg-white rounded-xl p-4 space-y-2 border border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-slate-600" />
                    <p className="text-sm font-bold text-slate-900">Duration Breakdown</p>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Base Duration:</span>
                      <span className="font-bold">{baseDuration}m</span>
                    </div>
                    {booking.extra_minutes > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Original Extra:</span>
                        <span className="font-bold">+{booking.extra_minutes}m</span>
                      </div>
                    )}
                    {mods.extra_minutes > 0 && (
                      <div className="flex justify-between bg-emerald-100 px-2 py-1 rounded">
                        <span className="text-emerald-700 font-medium">Session Addition:</span>
                        <span className="font-bold text-emerald-700">+{mods.extra_minutes}m</span>
                      </div>
                    )}
                    <div className="border-t border-slate-200 pt-1 flex justify-between font-bold">
                      <span>Total Duration:</span>
                      <span>{displayDuration}m</span>
                    </div>
                  </div>
                </div>

                {/* ✅ TRANSPARENCY: Add-ons Breakdown */}
                {(booking.add_ons?.length > 0 || mods.added_ons.length > 0) && (
                  <div className="bg-white rounded-xl p-4 space-y-2 border border-slate-100">
                    <div className="flex items-center gap-2 mb-3">
                      <Gift className="w-4 h-4 text-emerald-600" />
                      <p className="text-sm font-bold text-emerald-900">Services & Add-ons</p>
                    </div>

                    <div className="space-y-2">
                      {booking.add_ons?.map((addon: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span className="text-slate-700">{addon}</span>
                          <span className="text-[10px] text-slate-500 font-medium">(Original)</span>
                        </div>
                      ))}

                      {mods.added_ons.length > 0 && (
                        <>
                          <div className="border-t border-emerald-200 pt-2">
                            <p className="text-[10px] font-bold text-emerald-600 mb-2">✨ Adding During Session:</p>
                            {mods.added_ons.map((addon: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center text-sm mb-1">
                                <span className="text-emerald-700 font-medium">{addon.name}</span>
                                <span className="inline-block px-2 py-0.5 bg-emerald-600 text-white text-[9px] rounded-full font-bold">
                                  +₱{addon.price}
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* ✅ Modify Session (Only for Approved) */}
                {status === 'approved' && (
                  <div className="bg-blue-50 rounded-xl p-4 space-y-3 border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Plus className="w-4 h-4 text-blue-600" />
                      <p className="text-sm font-bold text-blue-900">Add to This Session</p>
                    </div>

                    <div className="flex gap-2">
                      <select 
                        className="flex-1 bg-white rounded-lg px-3 py-2 text-xs font-bold text-slate-600 border border-blue-200"
                        value={selectedExtend[booking.id] || ''}
                        onChange={(e) => {
                          const minutes = parseInt(e.target.value);
                          if (minutes > 0) {
                            setBookingModifications(prev => ({
                              ...prev,
                              [booking.id]: { ...mods, extra_minutes: (mods.extra_minutes || 0) + minutes }
                            }));
                            setSelectedExtend(prev => ({ ...prev, [booking.id]: '' }));
                          }
                        }}
                      >
                        <option value="">+ Add Extra Time</option>
                        <option value="15">+15m (₱150)</option>
                        <option value="30">+30m (₱250)</option>
                        <option value="45">+45m (₱350)</option>
                      </select>

                      <select 
                        className="flex-1 bg-white rounded-lg px-3 py-2 text-xs font-bold text-slate-600 border border-blue-200"
                        value={selectedAddOn[booking.id] || ''}
                        onChange={(e) => {
                          const service = ADD_ON_OPTIONS.find(s => s.name === e.target.value);
                          if (service) {
                            setBookingModifications(prev => ({
                              ...prev,
                              [booking.id]: { ...mods, added_ons: [...mods.added_ons, service] }
                            }));
                            setSelectedAddOn(prev => ({ ...prev, [booking.id]: '' }));
                          }
                        }}
                      >
                        <option value="">+ Add Service</option>
                        {ADD_ON_OPTIONS.map((opt, i) => (
                          <option key={i} value={opt.name}>{opt.name} (+₱{opt.price})</option>
                        ))}
                      </select>
                    </div>

                    {/* Remove Last Added Item */}
                    {mods.added_ons.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-red-600 hover:text-red-700"
                        onClick={() => {
                          setBookingModifications(prev => ({
                            ...prev,
                            [booking.id]: { ...mods, added_ons: mods.added_ons.slice(0, -1) }
                          }));
                        }}
                      >
                        <Trash2 className="w-3 h-3 mr-2" />
                        Remove Last Add-on
                      </Button>
                    )}
                  </div>
                )}

                {/* ✅ TRANSPARENCY: Price Breakdown */}
                <div className="bg-emerald-50 rounded-xl p-4 space-y-2 border border-emerald-100">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-emerald-700" />
                    <p className="text-sm font-bold text-emerald-900">Pricing Breakdown</p>
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Original Booking:</span>
                      <span className="font-bold">₱{booking.total_price}</span>
                    </div>

                    {mods.extra_minutes > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>+ Extra Time (+{mods.extra_minutes}m):</span>
                        <span className="font-bold">₱{(mods.extra_minutes / 15) * 150}</span>
                      </div>
                    )}

                    {mods.added_ons.length > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>+ Add-ons ({mods.added_ons.length}):</span>
                        <span className="font-bold">₱{mods.added_ons.length * 150}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-emerald-200 flex justify-between font-bold text-lg text-emerald-900">
                      <span>Final Total:</span>
                      <span>₱{calculatedTotal}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  {status === 'pending' && (
                    <>
                      <Button
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => onApprove(booking.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 text-red-600 hover:text-red-700"
                        onClick={() => onReject(booking.id)}
                      >
                        Reject
                      </Button>
                    </>
                  )}

                  {status === 'approved' && (
                    <Button
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => {
                        onComplete(booking.id, calculatedTotal, {
                          add_ons: [...(booking.add_ons || []), ...mods.added_ons.map(a => a.name)],
                          extra_minutes: (booking.extra_minutes || 0) + mods.extra_minutes,
                          total_price: calculatedTotal
                        });
                      }}
                    >
                      ✅ Finish Session
                    </Button>
                  )}
                </div>
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}
