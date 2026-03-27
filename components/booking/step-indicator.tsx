'use client'

import React from 'react' // ✅ Fixed: Added React import to resolve "React is not defined"
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface StepIndicatorProps {
  currentStep: number
  steps: { number: number; label: string }[]
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between w-full max-w-lg mx-auto mb-6 px-2">
      {steps.map((step, index) => (
        // Using React.Fragment requires the 'React' import above
        <React.Fragment key={step.number}>
          <div className="flex flex-col items-center z-10">
            <div
              className={cn(
                'w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs md:text-sm font-bold transition-all duration-500',
                currentStep > step.number
                  ? 'bg-emerald-600 text-white' 
                  : currentStep === step.number
                  ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                  : 'bg-slate-100 text-slate-400'
              )}
            >
              {currentStep > step.number ? (
                <Check className="w-4 h-4 md:w-5 md:h-5" />
              ) : (
                step.number
              )}
            </div>
            <span
              className={cn(
                'mt-2 text-[10px] md:text-xs font-bold text-center whitespace-nowrap',
                currentStep >= step.number
                  ? 'text-slate-800'
                  : 'text-slate-400'
              )}
            >
              {step.label}
            </span>
          </div>
          
          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div className="flex-1 px-1 -mt-5 md:-mt-6"> 
              <div
                className={cn(
                  'h-0.5 w-full transition-all duration-700 ease-in-out',
                  currentStep > step.number ? 'bg-emerald-600' : 'bg-slate-100'
                )}
              />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}
