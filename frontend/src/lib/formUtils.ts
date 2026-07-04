import type { UseFormSetError, Path, FieldValues } from 'react-hook-form'

export function handleFormErrors<T extends FieldValues>(
  err: unknown,
  setError: UseFormSetError<T>,
): boolean {
  const errors = (err as any)?.response?.data?.errors as Record<string, string | string[]> | undefined
  if (!errors) return false

  for (const [field, messages] of Object.entries(errors)) {
    const message = Array.isArray(messages) ? messages[0] : messages
    setError(field as Path<T>, { type: 'server', message })
  }
  return true
}
