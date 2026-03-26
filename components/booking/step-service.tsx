'use client'

import { useBookingStore } from '@/lib/booking-store'
import { SERVICES, DURATIONS, EXTRA_MINUTES, type ServiceType } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import { Sparkles, Clock, Plus, MessageSquare, Info, Timer } from 'lucide-react'

export function StepService() {
  const { 
    formData, 
    updateFormData, 
    nextStep, 
    calculateTotalDuration 
  } = useBookingStore()
  
  // **Critical Fix: Proper validity check**
  const isValid = !!formData.service && !!formData.duration

  return (
    <div className="space-y-6">
      {/* Service Selection */}
      <div className="space-y-4">
        <Label className="text-lg font-medium flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
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
                'cursor-pointer border transition-all',
                formData.service === service.value 
                  ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                  : 'hover:border-primary/50'
              )}
              onClick={() => updateFormData({ service: service.value as ServiceType })}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <RadioGroupItem 
                    value={service.value} 
                    id={service.value} 
                    checked={formData.service === service.value}
                  />
                  <div>
                    <p className="font-medium">{service.label}</p>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </RadioGroup>
      </div>

      {/* Duration Selection */}
      <div className="space-y-4">
        <Label className="text-lg font-medium flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Session Duration
        </Label>
        <div className="grid grid-cols-2 gap-3">
          {DURATIONS.map((duration) => (
            <Button
              key={duration.value}
              variant={formData.duration === duration.value ? 'default' : 'outline'}
              onClick={() => updateFormData({ duration: duration.value })}
              className="justify-start"
            >
              {duration.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Extra Time */}
      <div className="space-y-4">
        <Label className="text-lg font-medium flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          Extra Minutes (Optional)
        </Label>
        <div className="grid grid-cols-2 gap-3">
          {EXTRA_MINUTES.map((extra) => (
            <Button
              key={extra.value}
              variant={formData.extraMinutes === extra.value ? 'default' : 'outline'}
              onClick={() => updateFormData({ extraMinutes: extra.value })}
              className="justify-start"
            >
              {extra.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Add-On Services */}
      <div className="space-y-4 border-t pt-4">
        <Label className="text-lg font-medium flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          Add-On Services
        </Label>
        <div className="space-y-3">
          {[
            { name: 'Ear Candling', price: 150 },
            { name: 'Hot Stone', price: 150 },
            { name: 'Ventusa', price: 150 },
            { name: 'Fire Massage', price: 150 }
          ].map((addOn) => (
            <Card
              key={addOn.name}
              className={cn(
                'cursor-pointer border transition-all',
                formData.addOnService === addOn.name 
                  ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                  : 'hover:border-primary/50'
              )}
              onClick={() => updateFormData({ 
                addOnService: addOn.name, 
                addOnPrice: addOn.price 
              })}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <span>{addOn.name}</span>
                  <span className="font-medium">+₱{addOn.price}</span>
                </div>
                <p className="text-sm text-muted-foreground">+15 minutes</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Total Duration Display */}
      <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-md">
        <Timer className="h-5 w-5 text-primary" />
        <span className="font-medium">Total Duration: {calculateTotalDuration()} minutes</span>
      </div>

      {/* **Fixed Button: Now Triggers nextStep & Validates** */}
      <Button 
        className="w-full py-6 text-lg font-medium"
        onClick={nextStep}
        disabled={!isValid} // Only enable if required fields are filled
      >
        Continue to Schedule
      </Button>
    </div>
  )
}
