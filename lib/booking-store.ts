import { create } from 'zustand'
import type { BookingFormData, ServiceType } from './types'

interface BookingStore {
  currentStep: number
  formData: BookingFormData
  setStep: (step: number) => void
  updateFormData: (data: Partial<BookingFormData>) => void
  resetForm: () => void
  calculateTotalDuration: () => number
}

// Define initial form data with new add-on fields
const initialFormData: BookingFormData = {
  name: '',
  mobile: '',
  location: '',
  service: 'Swedish' as ServiceType,
  date: null,
  time: '',
  duration: 60,
  extraMinutes: 0,
  pressurePreference: 'no-preference',
  focusArea: 'full-body',
  additionalNeeds: 'none',
  specialRequests: '',
  // New add-on fields
  addOnService: 'None',
  addOnPrice: 0,
}

export const useBookingStore = create<BookingStore>((set, get) => ({
  currentStep: 1,
  formData: initialFormData,
  
  // Set current step in booking flow
  setStep: (step: number) => set({ currentStep: Math.max(1, Math.min(step, 4)) }),
  
  // Update form data (supports partial updates)
  updateFormData: (data: Partial<BookingFormData>) => set((state) => ({
    formData: { ...state.formData, ...data }
  })),
  
  // Reset form to initial state
  resetForm: () => set({
    currentStep: 1,
    formData: initialFormData
  }),
  
  // Calculate total duration including add-on time
  calculateTotalDuration: () => {
    const { duration, extraMinutes, addOnService } = get().formData
    // Add 15 mins if add-on is selected (except 'None')
    const addOnTime = addOnService !== 'None' ? 15 : 0
    return duration + extraMinutes + addOnTime
  }
}))
