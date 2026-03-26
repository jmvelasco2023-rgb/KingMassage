'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useBookingStore } from '@/lib/booking-store'
import { SERVICES, type PressurePreference, type FocusArea, type AdditionalNeeds } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { format } from 'date-fns'
import { Sparkles, CalendarDays, Clock, User, Phone, MapPin, Check, MessageSquare, Flame, Droplets, Wind, Lungs } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Helper to map values to friendly labels
const getFriendlyLabel = (type: string, value: string) => {
  const mappings = {
    pressure: {
      'no-preference': 'No Preference',
      'light': 'Light',
      'medium': 'Medium',
      'firm': 'Firm/Deep'
    },
    focus: {
      'full-body': 'Full Body (Even Distribution)',
      'back-shoulders': 'Back & Shoulders',
      'legs-feet': 'Legs & Feet',
      'neck-upper-back': 'Neck & Upper Back',
      'other': 'Other'
    },
    needs: {
      'none': 'No Special Needs',
      'oil-allergy': 'Oil Allergy',
      'table-assistance': 'Needs Table Setup Help',
      'quiet-session': 'Quiet Session (No Conversation)',
      'aromatherapy': 'Aromatherapy Preferred',
      'other': 'Other'
    }
  }

  switch(type) {
    case 'pressure': return mappings.pressure[value as keyof typeof mappings.pressure]
    case 'focus': return mappings.focus[value as keyof typeof mappings.focus]
    case 'needs': return mappings.needs[value as keyof typeof mappings.needs]
    default: return value
  }
}

// Get service-specific icon
const getServiceIcon = (service: string | undefined) => {
  switch(service) {
    case 'Ear Candling': return <Lungs className="w-5 h-5 text-primary mt-0.5" />
    case 'Hot Stone': return <Droplets className="w-5 h-5 text-primary mt-0.5" />
    case 'Ventusa': return <Wind className="w-5 h-5 text-primary mt-0.5" />
    case 'Fire Massage': return <Flame className="w-5 h-5 text-primary mt-0.5" />
    default: return <Sparkles className="w-5 h-5 text-primary mt-0.5" />
  }
}

export function StepReview() {
  const router = useRouter()
  const { formData, prevStep, resetForm } = useBookingStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const service = SERVICES.find((s) => s.value === formData.service)
  const totalMinutes = formData.duration + formData.extraMinutes

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login?redirect=/book')
        return
      }

      // Updated with all service types supported
      const { error: bookingError } = await supabase.from('bookings').insert({
        user_id: user.id,
        name: formData.name,
        mobile: formData.mobile,
        location: formData.location,
        service: formData.service,
        date: formData.date ? format(formData.date, 'yyyy-MM-dd') : null,
        time: formData.time,
        duration: formData.duration,
        extra_minutes: formData.extraMinutes,
        pressure_preference: formData.pressurePreference as PressurePreference,
        focus_area: formData.focusArea as FocusArea,
        additional_needs: formData.additionalNeeds as AdditionalNeeds,
        special_requests: formData.specialRequests,
        status: 'pending',
      })

      if (bookingError) throw bookingError

      resetForm()
      router.push('/booking-success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="bg-primary/5 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <Check className="w-5 h-5 text-primary" />
            Booking Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {/* Treatment Section with Service-Specific Icon */}
            <div className="flex items-start gap-4 p-4">
              {getServiceIcon(formData.service)}
              <div>
                <p className="text-sm text-muted-foreground">Treatment</p>
                <p className="font-medium">{service?.label}</p>
                <p className="text-sm text-muted-foreground">{service?.description}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4">
              <CalendarDays className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">
                  {formData.date ? format(formData.date, 'EEEE, MMMM d, yyyy') : '-'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4">
              <Clock className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Time & Duration</p>
                <p className="font-medium">
                  {formData.time} ({totalMinutes} minutes total)
                </p>
                {formData.extraMinutes > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Includes +{formData.extraMinutes} min extra
                  </p>
                )}
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-4 p-4">
              <User className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{formData.name}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4">
              <Phone className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Mobile</p>
                <p className="font-medium">{formData.mobile}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4">
              <MapPin className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium">{formData.location}</p>
              </div>
            </div>

            {/* Special Requests Section */}
            <Separator />
            <div className="flex items-start gap-4 p-4">
              <MessageSquare className="w-5 h-5 text-primary mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Session Preferences</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Pressure Preference</p>
                    <p className="font-medium">{getFriendlyLabel('pressure', formData.pressurePreference || 'no-preference')}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground">Focus Area</p>
                    <p className="font-medium">{getFriendlyLabel('focus', formData.focusArea || 'full-body')}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground">Additional Needs</p>
                    <p className="font-medium">{getFriendlyLabel('needs', formData.additionalNeeds || 'none')}</p>
                  </div>
                </div>

                {formData.specialRequests && (
                  <div className="mt-2 p-3 bg-muted/50 rounded-md">
                    <p className="text-xs text-muted-foreground font-medium">Additional Details</p>
                    <p className="text-sm">{formData.specialRequests}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button 
          variant="outline" 
          className="flex-1" 
          size="lg" 
          onClick={prevStep}
          disabled={isSubmitting}
        >
          Back
        </Button>
        <Button 
          className="flex-1" 
          size="lg"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Submitting...
            </>
          ) : (
            'Confirm Booking'
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        By confirming, you agree to our booking terms. Payment details will be sent after approval.
      </p>
    </div>
  )
}
