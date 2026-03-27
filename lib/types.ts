// --- Service & Add-On Types ---

export type ServiceType = 
  | 'Swedish' 
  | 'Shiatsu' 
  | 'Thai' 
  | 'Combination'

export type AddOnType = 
  | 'Ear Candling'
  | 'Hot Stone'
  | 'Ventusa'
  | 'Fire Massage'
  | 'None'

export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'
export type UserRole = 'admin' | 'client'

export type PressurePreference = 'no-preference' | 'soft' | 'medium' | 'hard'
export type FocusArea = 'full-body' | 'upper-body' | 'lower-body' | 'other'
export type AdditionalNeeds = 'none' | 'oil-allergy' | 'injuries' | 'quiet-session' | 'other'

export interface User {
  id: string
  email: string
  role: UserRole
  created_at: string
}

// --- Booking Interface (Database Schema) ---
export interface Booking {
  id: string
  user_id: string 
  name: string
  mobile: string
  location: string
  service: ServiceType
  date: string 
  time: string
  duration: number
  extra_minutes: number
  // ✅ Added these to match your new form submission and Admin UI
  add_on_service: AddOnType 
  add_on_price: number
  total_price: number
  pressure_preference: PressurePreference
  focus_area: FocusArea
  additional_needs: AdditionalNeeds
  special_requests: string
  status: BookingStatus
  payment_proof_url: string | null
  created_at: string
  // ✅ NEW: Rating fields
  rating: number | null
  review_comment: string | null
  reviewed_at: string | null
}

// --- Form State Interface (Zustand) ---
export interface BookingFormData {
  name: string
  mobile: string
  location: string
  service: ServiceType
  date: Date | null
  time: string
  duration: number
  extraMinutes: number
  addOnService: AddOnType
  addOnPrice: number
  pressurePreference: PressurePreference
  focusArea: FocusArea
  additionalNeeds: AdditionalNeeds
  specialRequests: string
}

export interface TimeSlot {
  time: string
  available: boolean
}

// --- Constants ---

export const SERVICES: { value: ServiceType; label: string; description: string; price: number }[] = [
  { value: 'Swedish', label: 'Swedish Massage', description: 'Gentle, relaxing strokes for stress relief', price: 600 },
  { value: 'Shiatsu', label: 'Shiatsu', description: 'Japanese finger pressure therapy', price: 600 },
  { value: 'Thai', label: 'Thai Massage', description: 'Stretching and pressure point therapy', price: 600 },
  { value: 'Combination', label: 'Combination Massage', description: 'Customized blend of techniques', price: 600 }
]

export const ADD_ONS: { value: AddOnType; label: string; description: string; price: number; duration: number }[] = [
  { value: 'None', label: 'No Add-On', description: 'No additional service', price: 0, duration: 0 },
  { value: 'Ear Candling', label: 'Ear Candling', description: 'Holistic ear cleansing therapy', price: 150, duration: 15 },
  { value: 'Hot Stone', label: 'Hot Stone Massage', description: 'Heated stones for deep muscle relief', price: 150, duration: 15 },
  { value: 'Ventusa', label: 'Ventusa Therapy', description: 'Cupping-based massage technique', price: 150, duration: 15 },
  { value: 'Fire Massage', label: 'Fire Massage', description: 'Warm herbal compresses with gentle heat', price: 150, duration: 15 },
]

export const DURATIONS = [
  { value: 60, label: '60 minutes' }
]

export const EXTRA_MINUTES = [
  { value: 0, label: 'No extra time' },
  { value: 15, label: '+15 minutes' },
  { value: 30, label: '+30 minutes' },
  { value: 45, label: '+45 minutes' }
]
