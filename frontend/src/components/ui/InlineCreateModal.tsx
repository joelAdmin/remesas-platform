import { useState, useEffect, useRef } from 'react'
import { Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './dialog'
import { Button } from './button'
import { Input } from './input'
import api from '../../services/api'
import { toast } from 'sonner'

export interface Field {
  name: string
  label: string
  type?: 'text' | 'number' | 'select' | 'email' | 'tel' | 'hidden'
  required?: boolean
  defaultValue?: any
  options?: { value: string | number; label: string }[]
  optionsEndpoint?: string
  optionsLabelKey?: string
  optionsValueKey?: string
  onFieldChange?: (value: any, setFieldValue: (name: string, value: any) => void, rawItems: Record<string, any[]>) => void
}

interface Props {
  onCreate: (form: Record<string, any>) => Promise<any>
  fields: Field[]
  title: string
  onCreated: (item: any) => void
  triggerClass?: string
}

export default function InlineCreateModal({ onCreate, fields, title, onCreated, triggerClass }: Props) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  const [options, setOptions] = useState<Record<string, { value: string | number; label: string }[]>>({})
  const [rawItems, setRawItems] = useState<Record<string, any[]>>({})
  const initializedRef = useRef(false)

  const setFieldValue = (name: string, value: any) => {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  useEffect(() => {
    if (!open) {
      initializedRef.current = false
      return
    }
    if (initializedRef.current) return
    initializedRef.current = true

    setForm(
      Object.fromEntries(fields.filter((f) => f.defaultValue !== undefined).map((f) => [f.name, f.defaultValue]))
    )

    fields.forEach(async (f) => {
      if (f.optionsEndpoint) {
        try {
          const { data } = await api.get(f.optionsEndpoint)
          const items = Array.isArray(data.data) ? data.data : []
          setRawItems((prev) => ({ ...prev, [f.name]: items }))
          setOptions((prev) => ({
            ...prev,
            [f.name]: items.map((item: any) => ({
              value: item[f.optionsValueKey || 'id'],
              label: item[f.optionsLabelKey || 'name'],
            })),
          }))
        } catch {
          toast.error('Error al cargar opciones')
        }
      }
    })
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setLoading(true)
    try {
      const result = await onCreate(form)
      toast.success('Creado exitosamente')
      onCreated(result)
      setOpen(false)
      setForm({})
    } catch (err: any) {
      const msg = err.response?.data?.message
        || err.response?.data?.error
        || (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join('. ')
          : null)
        || 'Error creating record'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={triggerClass || 'p-1.5 text-primary hover:bg-accent rounded-lg transition-colors'}>
        <Plus size={16} />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            {fields.filter((f) => f.type !== 'hidden').map((f) => (
              <div key={f.name}>
                <label className="block text-xs font-medium text-muted-foreground mb-1">{f.label}</label>
                {f.type === 'select' || f.optionsEndpoint ? (
                  <select
                    value={form[f.name] ?? ''}
                    onChange={(e) => {
                      const val = f.type === 'number' ? parseFloat(e.target.value) : e.target.value
                      setForm((p) => ({ ...p, [f.name]: val }))
                      f.onFieldChange?.(val, setFieldValue, rawItems)
                    }}
                    required={f.required}
                    className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring outline-none bg-background"
                  >
                    <option value="">Select...</option>
                    {(f.options || options[f.name] || []).map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : (
                  <Input
                    type={f.type || 'text'}
                    value={form[f.name] ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, [f.name]: f.type === 'number' ? parseFloat(e.target.value) || '' : e.target.value }))}
                    required={f.required}
                  />
                )}
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
