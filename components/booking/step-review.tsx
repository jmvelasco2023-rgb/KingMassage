'use client'

import { useBookingStore } from '@/lib/booking-store'
import { createClient } from '@/lib/supabase/client' 
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, User, CheckCircle, AlertCircle, Loader2, MessageSquare } from 'lucide-react'
import { useState } from 'react' 
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

export function StepReview() {
  const router = useRouter()
  const { formData, resetForm, calculateTotalDuration, prevStep } = useBookingStore()
  const totalDuration = calculateTotalDuration()

  const supabase = createClient()

  // --- States ---
  const [showModal, setShowModal] = useState(false)
  const [modalText, setModalText] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // --- Pricing Logic ---
  const BASE_SERVICE_PRICES = {
    Swedish: 600,
    Shiatsu: 600,
    Thai: 600,
    Combination: 600
  }
  
  const basePrice = BASE_SERVICE_PRICES[formData.service as keyof typeof BASE_SERVICE_PRICES] || 0
  const extraTimePrice = formData.extraMinutes === 15 ? 150 : formData.extraMinutes === 30 ? 250 : formData.extraMinutes === 45 ? 350 : 0
  
  // Logic to determine add-on price based on your dropdown selection
  const getAddOnPrice = () => {
    switch (formData.addOnService) {
      case 'Ventusa': return 150;
      case 'Ear Candling': return 150;
      case 'Foot Scrub': return 150;
      default: return 0;
    }
  }

  const addOnPrice = getAddOnPrice()
  const totalPrice = basePrice + extraTimePrice + addOnPrice

  // --- Handle Submission ---
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      setModalText('Processing your booking request... please wait.')
      setShowModal(true)

      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        throw new Error('Authentication required. Please log in to complete your booking.')
      }

      // Check required fields (including new preference fields)
      if (!formData.name || !formData.mobile || !formData.date || !formData.time) {
        throw new Error('Missing information. Please ensure all details are filled.')
      }

      // Prepare JSONB for add-ons (including the 15-minute duration)
      const addOnsData = formData.addOnService !== 'None' 
        ? [{ name: formData.addOnService, price: addOnPrice, duration_minutes: 15 }]
        : []

      const { error } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          name: formData.name,
          mobile: formData.mobile,
          location: formData.location,
          service: formData.service,
          duration: formData.duration,
          extra_minutes: formData.extraMinutes,
          add_ons: addOnsData, 
          total_price: totalPrice,
          date: format(new Date(formData.date), 'yyyy-MM-dd'),
          time: formData.time,
          // Mapping the preference fields correctly to your database columns
          pressure_preference: formData.pressurePreference,
          focus_area: formData.focusArea,
          additional_needs: formData.additionalNeeds,
          special_requests: formData.specialRequests,
          status: 'pending'
        })

      if (error) throw error
      
      setIsSuccess(true)
      setModalText('Thank you! Your booking has been confirmed. We look forward to seeing you!')
      resetForm() 
      
    } catch (err: any) {
      console.error('Submission Error:', err) 
      setModalText(err.message || 'We encountered an error. Please try again.')
      setIsSuccess(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setShowModal(false)
    if (isSuccess) {
      router.push('/my-bookings')
    }
  }

  return (
    <div className="space-y-6 max-w-md mx-auto p-4 pb-20">
      <div className="text-center">
        <h3 className="text-xl font-bold text-slate-800">Review Your Booking</h3>
        <p className="text-xs text-muted-foreground italic">King's Massage • At Home Service</p>
      </div>

      <div className="space-y-4">
        {/* Client & Preferences */}
        <Card className="border-none shadow-sm bg-slate-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-700">
              <User className="h-4 w-4 text-emerald-600" /> Client & Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <span className="text-slate-500">Name:</span>
              <span className="font-medium">{formData.name}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <span className="text-slate-500">Mobile:</span>
              <span className="font-medium">{formData.mobile}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <span className="text-slate-500">Pressure:</span>
              <span className="capitalize font-medium text-emerald-700">{formData.pressurePreference.replace('-', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Focus:</span>
              <span className="capitalize font-medium text-emerald-700">{formData.focusArea.replace('-', ' ')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card className="border-none shadow-sm bg-slate-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-700">
              <Calendar className="h-4 w-4 text-emerald-600" /> Treatment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Treatment:</span>
              <span className="font-bold">{formData.service} ({totalDuration} mins)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date:</span>
              <span className="font-medium">{formData.date ? format(new Date(formData.date), 'MMMM dd, yyyy') : ''}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Time:</span>
              <span className="font-medium">{formData.time}</span>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Summary */}
        <Card className="bg-emerald-600 text-white border-none shadow-md overflow-hidden">
          <CardContent className="pt-4 space-y-2 text-xs">
            <div className="flex justify-between opacity-90">
              <span>Base Service</span>
              <span>₱{basePrice}</span>
            </div>
            {extraTimePrice > 0 && (
              <div className="flex justify-between opacity-90">
                <span>Extra Time</span>
                <span>₱{extraTimePrice}</span>
              </div>
            )}
            {formData.addOnService !== 'None' && (
              <div className="flex justify-between opacity-90">
                <span>Add-on ({formData.addOnService})</span>
                <span>₱{addOnPrice}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-white/20 mt-2">
              <span>Total PHP</span>
              <span>₱{totalPrice.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3 mt-8">
        <Button 
          variant="outline" 
          className="flex-1 h-12 rounded-xl" 
          onClick={prevStep}
          disabled={isSubmitting}
        >
          Back
        </Button>
        <Button 
          className="flex-1 bg-slate-900 hover:bg-black h-12 rounded-xl" 
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
          Confirm Booking
        </Button>
      </div>

      {/* Dynamic Feedback Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="flex justify-center mb-4">
              {isSubmitting ? (
                <Loader2 className="h-14 w-14 text-emerald-500 animate-spin" />
              ) : isSuccess ? (
                <CheckCircle className="h-14 w-14 text-emerald-500" />
              ) : (
                <AlertCircle className="h-14 w-14 text-red-500" />
              )}
            </div>
            
            <h3 className="text-xl font-bold mb-2">
              {isSubmitting ? 'Processing...' : isSuccess ? 'Success!' : 'Error'}
            </h3>
            
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">{modalText}</p>
            
            {!isSubmitting && (
              <Button 
                className={`w-full h-12 rounded-xl text-white ${isSuccess ? 'bg-emerald-600' : 'bg-red-500'}`} 
                onClick={handleClose}
              >
                {isSuccess ? 'View My Bookings' : 'Try Again'}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
