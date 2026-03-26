// --- Updated types.ts to match StepReview component ---
export type ServiceType = 
  | 'Swedish' 
  | 'Shiatsu' 
  | 'Thai' 
  | 'Combination'

// Add-on services (separate from main treatments per StepReview)
export type AddOnType = 
  | 'Ear Candling'
  | 'Hot Stone'
  | 'Ventusa'
  | 'Fire Massage'
  | 'None' // Default option

export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'completed'
export type UserRole = 'admin' | 'client'

// Preference types (matches StepReview form fields)
export type PressurePreference = 'no-preference' | 'light' | 'medium' | 'firm'
export type FocusArea = 'full-body' | 'back-shoulders' | 'legs-feet' | 'neck-upper-back' | 'other'
export type AdditionalNeeds = 'none' | 'oil-allergy' | 'table-assistance' | 'quiet-session' | 'aromatherapy' | 'other'

// Add-on interface (for JSONB column in Supabase)
export interface AddOn {
  name: AddOnType
  price: number
  duration_minutes: number
}

// User interface (minimal for now, expand if adding auth later)
export interface User {
  id: string
  email: string
  role: UserRole
  created_at: string
}

// Booking interface (matches Supabase insert in StepReview)
export interface Booking {
  id: string
  name: string
  mobile: string
  location: string
  service: ServiceType
  date: string | Date // Supports both Date object and string format
  time: string
  duration: number
  extra_minutes: number
  add_ons: AddOn[] // JSONB column for add-ons
  total_price: number
  pressure_preference: PressurePreference
  focus_area: FocusArea
  additional_needs: AdditionalNeeds
  special_requests: string
  status: BookingStatus
  payment_proof_url: string | null // Added for future use
  created_at: string
}

// Booking Form Data interface (matches StepReview formData structure)
export interface BookingFormData {
  name: string
  mobile: string
  location: string
  service: ServiceType
  date: Date | null
  time: string
  duration: number
  extraMinutes: number
  addOnService: AddOnType // For selected add-on
  addOnPrice: number // Price of selected add-on
  pressurePreference: PressurePreference
  focusArea: FocusArea
  additionalNeeds: AdditionalNeeds
  specialRequests: string
}

// Time slot interface (for booking availability)
export interface TimeSlot {
  time: string
  available: boolean
}

// Service config (matches StepReview pricing)
export const SERVICES: { value: ServiceType; label: string; description: string; price: number }[] = [
  { value: 'Swedish', label: 'Swedish Massage', description: 'Gentle, relaxing strokes for stress relief', price: 600 },
  { value: 'Shiatsu', label: 'Shiatsu', description: 'Japanese finger pressure therapy', price: 600 },
  { value: 'Thai', label: 'Thai Massage', description: 'Stretching and pressure point therapy', price: 600 },
  { value: 'Combination', label: 'Combination Massage', description: 'Customized blend of techniques', price: 600 }
]

// Add-on config (matches StepReview add-on handling)
export const ADD_ONS: { value: AddOnType; label: string; description: string; price: number; duration: number }[] = [
  { value: 'None', label: 'No Add-On', description: 'No additional service', price: 0, duration: 0 },
  { value: 'Ear Candling', label: 'Ear Candling', description: 'Holistic ear cleansing therapy', price: 300, duration: 15 },
  { value: 'Hot Stone', label: 'Hot Stone Massage', description: 'Heated stones for deep muscle relief', price: 350, duration: 15 },
  { value: 'Ventusa', label: 'Ventusa Therapy', description: 'Cupping-based massage technique', price: 320, duration: 15 },
  { value: 'Fire Massage', label: 'Fire Massage', description: 'Warm herbal compresses with gentle heat', price: 400, duration: 15 }
]

// Duration options (matches StepReview)
export const DURATIONS = [
  { value: 60, label: '60 minutes' },
  { value: 90, label: '90 minutes' },
  { value: 120, label: '120 minutes' }
]

// Extra time options (matches StepReview)
export const EXTRA_MINUTES = [
  { value: 0, label: 'No extra time' },
  { value: 15, label: '+15 minutes' },
  { value: 30, label: '+30 minutes' }
]
