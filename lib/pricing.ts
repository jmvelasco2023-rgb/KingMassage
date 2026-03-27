/**
 * Pricing constants and calculation utilities
 */

export const PRICING = {
  // Base rate (60 min) - adjust as needed for your business
  BASE_SESSION: 600,
  
  // Extra time pricing structure
  EXTRA_TIME: {
    15: 150,  // +15 min = ₱150
    30: 250,  // +30 min = ₱250
    45: 350,  // +45 min = ₱350
  },
  
  // Add-on services (all ₱150)
  ADD_ONS: {
    'Ear Candling': 150,
    'Ventusa': 150,
    'Hot Stone': 150,
    'Fire Massage': 150,
    'Aromatherapy': 150,
  }
}

/**
 * Calculate total price based on extra minutes and add-ons
 */
export function calculateTotalPrice(
  basePrice: number,
  extraMinutes: number = 0,
  addOnsCount: number = 0
): number {
  let total = basePrice

  // Add extra time cost
  if (extraMinutes >= 45) {
    total += PRICING.EXTRA_TIME[45]
  } else if (extraMinutes >= 30) {
    total += PRICING.EXTRA_TIME[30]
  } else if (extraMinutes >= 15) {
    total += PRICING.EXTRA_TIME[15]
  }

  // Add add-on services (₱150 each)
  total += addOnsCount * 150

  return total
}

/**
 * Get the cost for extra minutes
 */
export function getExtraTimeCost(minutes: number): number {
  if (minutes >= 45) return PRICING.EXTRA_TIME[45]
  if (minutes >= 30) return PRICING.EXTRA_TIME[30]
  if (minutes >= 15) return PRICING.EXTRA_TIME[15]
  return 0
}
