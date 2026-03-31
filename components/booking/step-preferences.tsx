'use client'

import { useBookingStore } from '@/lib/booking-store'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MessageSquare, Info, Sparkles, Clock } from 'lucide-react'

export function StepPreferences() {
  const { formData, updateFormData, nextStep, prevStep } = useBookingStore()

  const handleAddOnLine = (value: string) => {
    let price = 0;
    if (value === 'Ventusa') price = 150;
    if (value === 'Ear Candling') price = 150;
    if (value === 'Fire Massage') price = 150;
    if (value === 'Hot Stone') price = 150;
    
    updateFormData({ 
      addOnService: value,
      addOnPrice: price 
    });
  }

  const handleExtraTime = (minutes: number) => {
    updateFormData({ extraMinutes: minutes })
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 1. SESSION PREFERENCES */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-emerald-800 font-bold border-b border-emerald-100 pb-2">
          <MessageSquare className="w-5 h-5" />
          <h3>Session Preferences</h3>
        </div>

        <div className="grid grid-cols-1 gap-5">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">Preferred Pressure Level</Label>
            <Select 
              value={formData.pressurePreference} 
              onValueChange={(v) => updateFormData({ pressurePreference: v })}
            >
              <SelectTrigger className="h-12 bg-white rounded-xl border-slate-200">
                <SelectValue placeholder="Select pressure" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="soft">Soft / Relaxing</SelectItem>
                <SelectItem value="no-preference">No Preference (Medium)</SelectItem>
                <SelectItem value="hard">Hard / Deep Tissue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">Primary Focus Areas</Label>
            <Select 
              value={formData.focusArea} 
              onValueChange={(v) => updateFormData({ focusArea: v })}
            >
              <SelectTrigger className="h-12 bg-white rounded-xl border-slate-200">
                <SelectValue placeholder="Select focus area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full-body">Full Body (General)</SelectItem>
                <SelectItem value="upper-body">Upper Body (Back & Shoulders)</SelectItem>
                <SelectItem value="lower-body">Lower Body (Legs & Feet)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">Additional Details (Optional)</Label>
            <Textarea
              placeholder="Allergies, specific injuries, or areas to avoid..."
              value={formData.specialRequests}
              onChange={(e) => updateFormData({ specialRequests: e.target.value })}
              className="resize-none bg-white rounded-xl border-slate-200 focus:ring-emerald-500"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* 2. EXTRA TIME OPTIONS - ✅ NEW: Now shows prices */}
      <div className="space-y-4 p-5 bg-blue-50/50 rounded-2xl border border-blue-100 ring-1 ring-blue-100/50">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <Label className="text-sm font-bold text-blue-900">Extra Time (Optional)</Label>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant={formData.extraMinutes === 0 ? 'default' : 'outline'}
            className={`h-12 rounded-xl font-semibold transition-all ${
              formData.extraMinutes === 0 
                ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            onClick={() => handleExtraTime(0)}
          >
            No extra time
          </Button>
          
          <Button
            type="button"
            variant={formData.extraMinutes === 15 ? 'default' : 'outline'}
            className={`h-12 rounded-xl font-semibold transition-all flex flex-col items-center justify-center ${
              formData.extraMinutes === 15 
                ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            onClick={() => handleExtraTime(15)}
          >
            <span className="text-xs">+15 mins</span>
            <span className="text-sm font-bold">₱150</span>
          </Button>
          
          <Button
            type="button"
            variant={formData.extraMinutes === 30 ? 'default' : 'outline'}
            className={`h-12 rounded-xl font-semibold transition-all flex flex-col items-center justify-center ${
              formData.extraMinutes === 30 
                ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            onClick={() => handleExtraTime(30)}
          >
            <span className="text-xs">+30 mins</span>
            <span className="text-sm font-bold">₱250</span>
          </Button>
          
          <Button
            type="button"
            variant={formData.extraMinutes === 45 ? 'default' : 'outline'}
            className={`h-12 rounded-xl font-semibold transition-all flex flex-col items-center justify-center ${
              formData.extraMinutes === 45 
                ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            onClick={() => handleExtraTime(45)}
          >
            <span className="text-xs">+45 mins</span>
            <span className="text-sm font-bold">₱350</span>
          </Button>
        </div>
      </div>

      {/* 3. ADD-ON SERVICES DROPDOWN */}
      <div className="space-y-4 p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 ring-1 ring-emerald-100/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <Label className="text-sm font-bold text-emerald-900">Add-on Services</Label>
          </div>
          <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 border-none px-2 py-0.5 text-[10px]">
            +15 MINS
          </Badge>
        </div>
        
        <Select 
          value={formData.addOnService} 
          onValueChange={handleAddOnLine}
        >
          <SelectTrigger className="h-12 bg-white border-emerald-200 rounded-xl shadow-sm">
            <SelectValue placeholder="Enhance your session..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="None">No Add-ons</SelectItem>
            <SelectItem value="Ventusa">Ventusa (+₱150)</SelectItem>
            <SelectItem value="Ear Candling">Ear Candling (+₱150)</SelectItem>
            <SelectItem value="Fire Massage">Foot Scrub (+₱150)</SelectItem>
            <SelectItem value="Hot Stone">Foot Scrub (+₱150)</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-start gap-2 text-[11px] text-emerald-700 leading-snug">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <p className="italic font-medium">
            Note: All add-on services will have an additional 15 minutes added to your total session duration.
          </p>
        </div>
      </div>

      {/* NAVIGATION */}
      <div className="flex gap-3 pt-2">
        <Button 
          variant="outline" 
          className="flex-1 h-12 rounded-xl border-slate-200 text-slate-600 font-medium" 
          onClick={prevStep}
        >
          Back
        </Button>
        <Button 
          className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-white font-bold shadow-md shadow-emerald-200" 
          onClick={nextStep}
        >
          Next: Date & Time
        </Button>
      </div>
    </div>
  )
}
