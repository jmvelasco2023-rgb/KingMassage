import { create } from 'zustand'
import type { BookingFormData, ServiceType } from './types'

export interface BookingFormData {
  name: string
  mobile: string
  location: string
  service: ServiceType
  duration: number
  extraMinutes: number
  date: string | null
  time: string
  pressurePreference: string
  focusArea: string
  additionalNeeds: string
  specialRequests: string
  addOnService: string
  addOnPrice: number
}

const initialFormData: BookingFormData = {
  name: '',
  mobile: '',
  location: '',
  service: 'Swedish' as ServiceType,
  duration: 60,
  extraMinutes: 0,
  date: null,
  time: '',
  pressurePreference: 'no-preference',
  focusArea: 'full-body',
  additionalNeeds: 'none',
  specialRequests: '',
  addOnService: 'None',
  addOnPrice: 0,
}

interface BookingStore {
  currentStep: number
  formData: BookingFormData
  setStep: (step: number) => void
  updateFormData: (data: Partial<BookingFormData>) => void
  resetForm: () => void
  calculateTotalDuration: () => number
  nextStep: () => void
  prevStep: () => void
}

export const useBookingStore = create<BookingStore>((set, get) => ({
  currentStep: 1,
  formData: initialFormData,
  
  // Updated: Limit to 1-5 steps
  setStep: (step: number) => set({ 
    currentStep: Math.max(1, Math.min(step, 5)) 
  }),
  
  updateFormData: (data: Partial<BookingFormData>) => set((state) => ({
    formData: { ...state.formData, ...data }
  })),
  
  resetForm: () => set({
    currentStep: 1,
    formData: initialFormData
  }),
  
  calculateTotalDuration: () => {
    const { duration, extraMinutes, addOnService } = get().formData
    // Ensures duration and extraMinutes are treated as numbers
    const addOnTime = addOnService !== 'None' ? 15 : 0
    return Number(duration) + Number(extraMinutes) + addOnTime
  },
  
  nextStep: () => {
    const { currentStep, formData } = get()
    
    let isStepValid = true
    switch(currentStep) {
      case 1: // Service Selection
        isStepValid = !!formData.service
        break
      case 2: // Session Preferences & Add-ons
        // Usually valid by default since they have initial values, 
        // but you can add specific checks here if needed.
        isStepValid = !!formData.pressurePreference && !!formData.focusArea
        break
      case 3: // Schedule
        isStepValid = !!formData.date && !!formData.time
        break
      case 4: // Contact Details
        isStepValid = formData.name.trim() !== '' && formData.mobile.trim() !== ''
        break
      case 5: // Review
        isStepValid = true
        break
    }

    if (isStepValid) {
      set((state) => ({
        // Updated: Cap at 5
        currentStep: Math.min(state.currentStep + 1, 5)
      }))
    } else {
      alert('Please complete all required fields to continue!')
    }
  },
  
  prevStep: () => {
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 1)
    }))
  }
}))
