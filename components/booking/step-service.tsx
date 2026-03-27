'use client'

import React from 'react' // ✅ Added to prevent prerender errors
import { useBookingStore } from '@/lib/booking-store'
import { SERVICES, DURATIONS, EXTRA_MINUTES, type ServiceType } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import { Sparkles, Clock, Plus, Timer, ChevronRight } from 'lucide-react'

export function StepService() {
  const { 
    formData, 
    updateFormData, 
    nextStep, 
    calculateTotalDuration 
  } = useBookingStore()
  
  // Validation: User must select a service and a base duration
  const isValid = !!formData.service && !!formData.duration

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 1. Service Selection */}
      <div className="space-y-4">
        <Label className="text-sm font-bold flex items-center gap-2 text-slate-800">
          <Sparkles className="h-4 w-4 text-emerald-600" />
          Select Your Treatment
        </Label>
        <RadioGroup 
          value={formData.service} 
          onValueChange={(value) => updateFormData({ service: value as ServiceType })}
          className="grid gap-3"
        >
          {SERVICES.map((service) => (
            <Card 
              key={service.value}
              className={cn(
                'cursor-pointer border-none shadow-sm transition-all ring-1',
                formData.service === service.value 
                  ? 'ring-emerald-600 bg-emerald-50/30' 
                  : 'ring-slate-200 hover:ring-emerald-200 bg-white'
              )}
              onClick={() => updateFormData({ service: service.value as ServiceType })}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <RadioGroupItem 
                    value={service.value} 
                    id={service.value} 
                    className="border-emerald-200 text-emerald-600"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <p className="font-bold text-slate-900">{service.label}</p>
                      <span className="text-emerald-700 font-bold text-sm">₱{service.price}</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{service.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </RadioGroup>
      </div>

      {/* 2. Duration Selection */}
      <div className="space-y-4">
        <Label className="text-sm font-bold flex items-center gap-2 text-slate-800">
          <Clock className="h-4 w-4 text-emerald-600" />
          Session Duration
        </Label>
        <div className="grid grid-cols-2 gap-3">
          {DURATIONS.map((duration) => (
            <Button
              key={duration.value}
              variant="outline"
              type="button"
              onClick={() => updateFormData({ duration: duration.value })}
              className={cn(
                "h-12 rounded-xl border-slate-200 font-medium transition-all",
                formData.duration === duration.value 
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-100" 
                  : "bg-white text-slate-600 hover:bg-slate-50"
              )}
            >
              {duration.label}
            </Button>
          ))}
        </div>
      </div>

      {/* 3. Extra Time */}
      <div className="space-y-4">
        <Label className="text-sm font-bold flex items-center gap-2 text-slate-800">
          <Plus className="h-4 w-4 text-emerald-600" />
          Extra Time (Optional)
        </Label>
        <div className="grid grid-cols-2 gap-3">
          {EXTRA_MINUTES.map((extra) => (
            <Button
              key={extra.value}
              variant="outline"
              type="button"
              onClick={() => updateFormData({ extraMinutes: extra.value })}
              className={cn(
                "h-12 rounded-xl border-slate-200 font-medium transition-all",
                formData.extraMinutes === extra.value 
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-100" 
                  : "bg-white text-slate-600 hover:bg-slate-50"
              )}
            >
              {extra.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Footer */}
      <div className="pt-4 space-y-4">
        <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-2xl shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Timer className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold opacity-60">Total Time</p>
              <p className="text-lg font-bold">{calculateTotalDuration()} Minutes</p>
            </div>
          </div>
          <Button 
            onClick={nextStep}
            disabled={!isValid}
            className="bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl px-6 h-11 font-bold group"
          >
            Continue
            <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </div>
  )
}
