import { cloneElement, type ReactElement } from 'react'
import { Label } from './label'
import { cn } from '@/lib/utils'

interface FormFieldProps {
  label?: string
  error?: string
  required?: boolean
  children: ReactElement
  className?: string
}

export function FormField({ label, error, required, children, className }: FormFieldProps) {
  const child = cloneElement(children, {
    'aria-invalid': !!error || undefined,
    'data-error': !!error || undefined,
  })

  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <Label>
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
      )}
      {child}
      {error && (
        <p className="text-destructive text-xs mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
