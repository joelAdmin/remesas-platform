import { useState, useCallback, useRef, useEffect } from 'react'
import { Input } from './input'
import { fmt } from '../../lib/utils'

interface NumberInputProps {
  value?: number | null
  onChange?: (value: number | undefined) => void
  onBlur?: () => void
  decimals?: number
  placeholder?: string
  className?: string
  disabled?: boolean
  'aria-invalid'?: boolean
  'data-error'?: boolean
}

function parseSpanishNumber(raw: string): number | undefined {
  const cleaned = raw
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^0-9.\-]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? undefined : num
}

export default function NumberInput({
  value,
  onChange,
  onBlur: outerBlur,
  decimals = 2,
  placeholder,
  className,
  disabled,
  'aria-invalid': ariaInvalid,
  'data-error': dataError,
  ...rest
}: NumberInputProps & Record<string, any>) {
  const [focused, setFocused] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const displayValue = focused
    ? draft
    : (value !== null && value !== undefined ? fmt(value, decimals) : '')

  useEffect(() => {
    if (!focused) setDraft('')
  }, [focused, value])

  const handleFocus = useCallback(() => {
    setDraft(value !== null && value !== undefined ? String(value).replace('.', ',') : '')
    setFocused(true)
  }, [value])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const rawClean = raw.replace(/[^0-9.,\-]/g, '')
    setDraft(rawClean)
    const parsed = parseSpanishNumber(rawClean)
    if (parsed !== undefined && onChange) {
      onChange(parsed)
    }
    if (parsed === undefined && !rawClean) {
      onChange?.(undefined)
    }
  }, [onChange])

  const handleBlur = useCallback(() => {
    setFocused(false)
    setDraft('')
    outerBlur?.()
  }, [outerBlur])

  return (
    <Input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      value={displayValue}
      onFocus={handleFocus}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      aria-invalid={ariaInvalid}
      data-error={dataError}
      {...rest}
    />
  )
}
