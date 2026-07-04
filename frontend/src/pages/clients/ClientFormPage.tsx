import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { clientRepository } from '../../services/repositories/ClientRepository'
import { clientAccountRepository } from '../../services/repositories/ClientAccountRepository'
import { countryRepository } from '../../services/repositories/CountryRepository'
import { currencyRepository } from '../../services/repositories/CurrencyRepository'
import InlineCreateModal from '../../components/ui/InlineCreateModal'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { FormField } from '../../components/ui/FormField'
import { handleFormErrors } from '../../lib/formUtils'
import { Badge } from '../../components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import { toast } from 'sonner'
import { Star, Loader2, Pencil, Trash2 } from 'lucide-react'
import { useConfirm } from '../../components/ui/ConfirmDialog'
import type { Client, ClientAccount, Country, Currency } from '../../types/entities'
import type { Field } from '../../components/ui/InlineCreateModal'

interface FormData {
  full_name: string
  document_number: string
  phone?: string
  email?: string
  country_id: number
  address?: string
  is_active: boolean
}

interface Props {
  clientId?: number
  onSuccess?: (client: Client | undefined) => void
  showHeader?: boolean
}

export default function ClientFormPage({ clientId: propClientId, onSuccess, showHeader = true }: Props) {
  const { t } = useTranslation()
  const { id: routeId } = useParams()
  const navigate = useNavigate()
  const effectiveId = propClientId ?? (routeId ? Number(routeId) : null)
  const isEdit = effectiveId !== null
  const [countries, setCountries] = useState<Country[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [accounts, setAccounts] = useState<ClientAccount[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const [settingDefault, setSettingDefault] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [savedClientId, setSavedClientId] = useState<number | null>(null)
  const [editAccount, setEditAccount] = useState<ClientAccount | null>(null)
  const [editForm, setEditForm] = useState<Record<string, any>>({})
  const clientId = savedClientId ?? effectiveId
  const { confirm, ConfirmDialog } = useConfirm()

  const { register, handleSubmit, reset, setValue, setError, formState: { errors, isSubmitting } } = useForm<FormData>()

  const countryFields: Field[] = [
    { name: 'name', label: t('country.name'), required: true },
    { name: 'currency_code', label: t('country.currency_code'), required: true },
    { name: 'currency_symbol', label: t('country.currency_symbol'), required: true },
    { name: 'phone_code', label: t('country.phone_code'), required: true },
    { name: 'flag_icon', label: t('country.flag_icon') },
  ]

  const accountFields: Field[] = [
    { name: 'client_id', label: 'Client ID', type: 'hidden', defaultValue: clientId },
    { name: 'country_id', label: t('client.country'), type: 'select', optionsEndpoint: '/countries', optionsLabelKey: 'name', optionsValueKey: 'id',
      onFieldChange: (value, setField, raw) => {
        if (!value) return
        const country = raw['country_id']?.find((c: any) => c.id === Number(value))
        if (!country?.currency_code) return
        const currency = raw['currency_id']?.find((c: any) => c.code === country.currency_code)
        if (currency) setField('currency_id', currency.id)
      }
    },
    { name: 'currency_id', label: t('client.currency'), type: 'select', optionsEndpoint: '/currencies', optionsLabelKey: 'name', optionsValueKey: 'id' },
    { name: 'account_holder', label: t('client.account_holder'), required: true },
    { name: 'bank_name', label: t('client.bank_name') },
    { name: 'account_number', label: t('client.account_number'), required: true },
    { name: 'account_type', label: t('client.account_type'), defaultValue: 'bank' },
  ]

  useEffect(() => {
    countryRepository.all().then(setCountries)
    currencyRepository.all().then(setCurrencies)
    if (isEdit && effectiveId) {
      clientRepository.find(effectiveId).then((d) => {
        reset({
          full_name: d.full_name,
          document_number: d.document_number,
          phone: d.phone || '',
          email: d.email || '',
          country_id: d.country_id,
          address: d.address || '',
          is_active: d.is_active,
        })
        loadAccounts(effectiveId)
      })
    }
  }, [effectiveId, isEdit, reset])

  useEffect(() => {
    if (editAccount) {
      setEditForm({
        country_id: editAccount.country_id ?? '',
        currency_id: editAccount.currency_id ?? '',
        account_holder: editAccount.account_holder,
        bank_name: editAccount.bank_name ?? '',
        account_number: editAccount.account_number,
        account_type: editAccount.account_type,
      })
    }
  }, [editAccount])

  const loadAccounts = async (clientId: number) => {
    setLoadingAccounts(true)
    try {
      const data = await clientAccountRepository.all({ client_id: clientId })
      setAccounts(data)
    } finally {
      setLoadingAccounts(false)
    }
  }

  const handleSetDefault = async (accountId: number) => {
    setSettingDefault(accountId)
    try {
      await clientAccountRepository.update(accountId, { is_default: true })
      if (clientId) loadAccounts(clientId)
    } catch {
      toast.error('Error al establecer cuenta predeterminada')
    } finally {
      setSettingDefault(null)
    }
  }

  const handleSaveEdit = async () => {
    if (!editAccount) return
    try {
      const payload = { ...editForm }
      if (!payload.country_id) delete payload.country_id
      if (!payload.currency_id) delete payload.currency_id
      await clientAccountRepository.update(editAccount.id, payload)
      toast.success('Cuenta actualizada exitosamente')
      setEditAccount(null)
      if (clientId) loadAccounts(clientId)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al actualizar la cuenta')
    }
  }

  const handleDeleteAccount = async (accountId: number) => {
    const confirmed = await confirm('¿Estás seguro de eliminar esta cuenta bancaria?')
    if (!confirmed) return
    setDeletingId(accountId)
    try {
      await clientAccountRepository.delete(accountId)
      toast.success('Cuenta eliminada exitosamente')
      if (clientId) loadAccounts(clientId)
    } catch {
      toast.error('Error al eliminar la cuenta')
    } finally {
      setDeletingId(null)
    }
  }

  const onSubmit = async (data: FormData) => {
    try {
      const payload = { ...data }
      if (!payload.phone) delete payload.phone
      if (!payload.email) delete payload.email
      if (!payload.address) delete payload.address

      if (isEdit && effectiveId) {
        await clientRepository.update(effectiveId, payload)
        toast.success('Cliente actualizado exitosamente')
        if (propClientId && onSuccess) {
          onSuccess(undefined)
          return
        }
        navigate('/clients')
      } else {
        const created = await clientRepository.create(payload)
        toast.success('Cliente creado exitosamente')
        setSavedClientId(created.id)
        loadAccounts(created.id)
      }
    } catch (err) {
      if (!handleFormErrors(err, setError)) {
        toast.error('Error al guardar cliente')
      }
    }
  }

  const showAccounts = (isEdit && clientId !== null) || (!isEdit && savedClientId !== null)
  const defaultAccount = accounts.find((a) => a.is_default)

  return (
    <Card className="max-w-lg mx-auto">
      {showHeader && (
        <CardHeader>
          <CardTitle>{t(isEdit ? 'client.edit' : 'client.create')}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label={t('client.full_name')} error={errors.full_name?.message} required>
            <Input {...register('full_name', { required: 'Required' })} aria-invalid={!!errors.full_name} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('client.document_number')} error={errors.document_number?.message} required>
              <Input {...register('document_number', { required: 'Required' })} aria-invalid={!!errors.document_number} />
            </FormField>
            <FormField label={t('client.country')} error={errors.country_id?.message} required>
              <div className="flex gap-2">
                <select {...register('country_id', { required: 'Required', valueAsNumber: true })} className="flex-1 px-3 py-2 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring outline-none bg-background" aria-invalid={!!errors.country_id}>
                  <option value="">Select...</option>
                  {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <InlineCreateModal
                  onCreate={(form) => countryRepository.create(form)}
                  fields={countryFields}
                  title={t('country.create')}
                  onCreated={(item) => {
                    setCountries((prev) => [...prev, item])
                    setValue('country_id', item.id)
                  }}
                />
              </div>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('client.phone')} error={errors.phone?.message}>
              <Input {...register('phone')} aria-invalid={!!errors.phone} />
            </FormField>
            <FormField label={t('client.email')} error={errors.email?.message}>
              <Input type="email" {...register('email')} aria-invalid={!!errors.email} />
            </FormField>
          </div>
          <FormField label={t('client.address')} error={errors.address?.message}>
            <textarea {...register('address')} rows={2} className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring outline-none bg-background" aria-invalid={!!errors.address} />
          </FormField>

          {showAccounts && (
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">{t('client.accounts')}</label>
                <span className="text-xs text-muted-foreground">{accounts.length} cuenta(s)</span>
              </div>

              {loadingAccounts ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 size={16} className="animate-spin text-muted-foreground" />
                </div>
              ) : accounts.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">{t('client.no_accounts')}</p>
              ) : (
                <div className="space-y-2">
                  {accounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-3 rounded-lg border text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="truncate">
                          <span className="font-medium">{account.bank_name || ''}</span>
                          {account.bank_name && account.account_number && <span> - </span>}
                          <span>{account.account_number}</span>
                        </div>
                        {account.is_default && (
                          <Badge variant="default" className="text-xs shrink-0">
                            <Star size={10} className="mr-0.5" />
                            {t('client.default_account')}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {!account.is_default && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={settingDefault === account.id}
                            onClick={() => handleSetDefault(account.id)}
                            className="text-xs h-7 px-2"
                          >
                            {settingDefault === account.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              t('client.set_default')
                            )}
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditAccount(account)}
                          className="text-xs h-7 px-2 text-muted-foreground hover:text-blue-600"
                        >
                          <Pencil size={12} />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={deletingId === account.id}
                          onClick={() => handleDeleteAccount(account.id)}
                          className="text-xs h-7 px-2 text-muted-foreground hover:text-red-600"
                        >
                          {deletingId === account.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Trash2 size={12} />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <InlineCreateModal
                  onCreate={(form) => clientAccountRepository.create({ ...form, client_id: clientId })}
                  fields={accountFields}
                  title={t('client.add_account')}
                  onCreated={() => loadAccounts(clientId!)}
                />
                {!defaultAccount && accounts.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {t('client.set_default')}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input type="checkbox" {...register('is_active')} className="rounded" />
            <label className="text-sm font-medium">{t('common.active')}</label>
          </div>
          <div className="flex gap-3 pt-2">
            {!savedClientId && (
              <Button type="submit" disabled={isSubmitting}>
                {t('common.save')}
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => onSuccess ? onSuccess(undefined) : navigate('/clients')}>
              {savedClientId || (isEdit && !savedClientId) ? t('common.back') : t('common.cancel')}
            </Button>
          </div>
        </form>

        <Dialog open={!!editAccount} onOpenChange={(v) => { if (!v) setEditAccount(null) }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{t('client.edit_account')}</DialogTitle>
            </DialogHeader>
            {editAccount && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{t('client.country')}</label>
                  <select
                    value={editForm.country_id ?? ''}
                    onChange={(e) => {
                      const countryId = e.target.value ? Number(e.target.value) : null
                      setEditForm((p) => ({ ...p, country_id: countryId }))
                      if (countryId) {
                        const country = countries.find((c) => c.id === countryId)
                        if (country?.currency_code) {
                          const currency = currencies.find((c) => c.code === country.currency_code)
                          if (currency) setEditForm((p) => ({ ...p, currency_id: currency.id }))
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring outline-none bg-background"
                  >
                    <option value="">Select...</option>
                    {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{t('client.currency')}</label>
                  <select
                    value={editForm.currency_id ?? ''}
                    onChange={(e) => setEditForm((p) => ({ ...p, currency_id: e.target.value ? Number(e.target.value) : null }))}
                    className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring outline-none bg-background"
                  >
                    <option value="">Select...</option>
                    {currencies.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{t('client.account_holder')}</label>
                  <Input
                    value={editForm.account_holder ?? ''}
                    onChange={(e) => setEditForm((p) => ({ ...p, account_holder: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{t('client.bank_name')}</label>
                  <Input
                    value={editForm.bank_name ?? ''}
                    onChange={(e) => setEditForm((p) => ({ ...p, bank_name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{t('client.account_number')}</label>
                  <Input
                    value={editForm.account_number ?? ''}
                    onChange={(e) => setEditForm((p) => ({ ...p, account_number: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{t('client.account_type')}</label>
                  <Input
                    value={editForm.account_type ?? ''}
                    onChange={(e) => setEditForm((p) => ({ ...p, account_type: e.target.value }))}
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button type="button" onClick={handleSaveEdit}>
                    {t('common.save')}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setEditAccount(null)}>
                    {t('common.cancel')}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <ConfirmDialog />
      </CardContent>
    </Card>
  )
}
