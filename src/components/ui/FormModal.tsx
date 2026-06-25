import { useEffect, useState } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'
import { Input, Textarea, Select } from './primitives'

export type FieldType = 'text' | 'number' | 'textarea' | 'select' | 'time' | 'range'

export interface FormField {
  name: string
  label: string
  type: FieldType
  placeholder?: string
  options?: { label: string; value: string }[]
  min?: number
  max?: number
  step?: number
  defaultValue?: string | number
  required?: boolean
  full?: boolean // span both columns
}

interface Props {
  open: boolean
  onClose: () => void
  title: string
  fields: FormField[]
  submitLabel?: string
  wide?: boolean
  onSubmit: (values: Record<string, string>) => void
}

// Declarative modal form. Eliminates the repeated useState + Modal + Input + submit
// boilerplate across feature "add/edit" dialogs.
export function FormModal({ open, onClose, title, fields, submitLabel = 'Save', wide, onSubmit }: Props) {
  const initial = () =>
    Object.fromEntries(fields.map((f) => [f.name, String(f.defaultValue ?? '')])) as Record<string, string>
  const [values, setValues] = useState<Record<string, string>>(initial)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setValues(initial())
      setError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const set = (name: string, v: string) => setValues((p) => ({ ...p, [name]: v }))

  const submit = () => {
    const missing = fields.find((f) => f.required && !values[f.name]?.trim())
    if (missing) {
      setError(`${missing.label} is required.`)
      return
    }
    onSubmit(values)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={title} wide={wide}>
      <div className="grid grid-cols-2 gap-3">
        {fields.map((f) => (
          <div key={f.name} className={f.full || f.type === 'textarea' || f.type === 'range' ? 'col-span-2' : ''}>
            <label htmlFor={`fm-${f.name}`} className="mb-1.5 block text-xs text-white/40">
              {f.label}
              {f.type === 'range' ? `: ${values[f.name]}` : ''}
            </label>
            {f.type === 'textarea' ? (
              <Textarea id={`fm-${f.name}`} rows={2} placeholder={f.placeholder} value={values[f.name]} onChange={(e) => set(f.name, e.target.value)} />
            ) : f.type === 'select' ? (
              <Select id={`fm-${f.name}`} value={values[f.name]} onChange={(e) => set(f.name, e.target.value)}>
                {f.options?.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            ) : f.type === 'range' ? (
              <input id={`fm-${f.name}`} type="range" min={f.min} max={f.max} step={f.step} value={values[f.name]} onChange={(e) => set(f.name, e.target.value)} className="w-full accent-accent" />
            ) : (
              <Input id={`fm-${f.name}`} type={f.type === 'number' ? 'number' : f.type === 'time' ? 'time' : 'text'} min={f.min} max={f.max} step={f.step} placeholder={f.placeholder} value={values[f.name]} onChange={(e) => set(f.name, e.target.value)} />
            )}
          </div>
        ))}
      </div>
      {error && <p className="mt-3 text-sm text-bad">{error}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={submit}>{submitLabel}</Button>
      </div>
    </Modal>
  )
}
