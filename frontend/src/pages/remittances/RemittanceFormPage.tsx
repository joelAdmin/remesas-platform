import { useForm, Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { remittanceRepository } from '../../services/repositories/RemittanceRepository'
import { clientRepository } from '../../services/repositories/ClientRepository'
import { exchangeCorridorRepository } from '../../services/repositories/ExchangeCorridorRepository'
import { clientAccountRepository } from '../../services/repositories/ClientAccountRepository'
import { sourceAccountRepository } from '../../services/repositories/SourceAccountRepository'
import { userRepository } from '../../services/repositories/UserRepository'
import InlineCreateModal from '../../components/ui/InlineCreateModal'
import Modal from '../../components/ui/Modal'
import ClientFormPage from '../clients/ClientFormPage'
import type { Client, ClientAccount, ExchangeCorridor, Remittance, RemittancePromoter, SourceAccount } from '../../types/entities'
import type { User } from '../../types/auth'
import { toast } from 'sonner'
import { FormField } from '../../components/ui/FormField'
import { handleFormErrors } from '../../lib/formUtils'
import { Calculator, Loader2, Plus, RefreshCw, Trash2, Upload, UserPlus } from 'lucide-react'
import NumberInput from '../../components/ui/NumberInput'
import { fmt } from '../../lib/utils'

interface FormData {
  client_id: number
  exchange_corridor_id: number
  client_account_id: number | null
  source_account_id: number | null
  origin_amount: number
  buy_rate: number
  sell_rate: number
  tasa_publico: number
  notes: string
  registered_at: string
  status: string
  origin_receipt: string | null
  destination_receipt: string | null
}

interface CalculationResult {
  origin_commission_total: number
  origin_net_amount: number
  usdt_bought: number
  destination_gross_amount: number
  destination_commission_total: number
  destination_net_amount: number
  usdt_to_sell: number
  profit_usdt: number
  total_profit_usd: number
  tasa_formula: 'divide' | 'multiply'
}

interface Props {
  onSuccess?: (remittance: Remittance | undefined) => void
  showHeader?: boolean
  editId?: number
  modal?: boolean
}

export default function RemittanceFormPage({ onSuccess, showHeader = true, editId: propsEditId, modal = false }: Props = {}) {
  const { t } = useTranslation()
  const { id: paramsId } = useParams()
  const navigate = useNavigate()
  const entityId = propsEditId ?? (paramsId ? Number(paramsId) : undefined)
  const isEdit = entityId !== undefined
  const [clients, setClients] = useState<Client[]>([])
  const [corridors, setCorridors] = useState<ExchangeCorridor[]>([])
  const [clientAccounts, setClientAccounts] = useState<ClientAccount[]>([])
  const [sourceAccounts, setSourceAccounts] = useState<SourceAccount[]>([])
  const [calculation, setCalculation] = useState<CalculationResult | null>(null)
  const [calculating, setCalculating] = useState(false)
  const [clientModalOpen, setClientModalOpen] = useState(false)
  const [originReceiptUrl, setOriginReceiptUrl] = useState<string | null>(null)
  const [destReceiptUrl, setDestReceiptUrl] = useState<string | null>(null)
  const [uploadingOrigin, setUploadingOrigin] = useState(false)
  const [uploadingDest, setUploadingDest] = useState(false)
  const [promoters, setPromoters] = useState<{ user_id: number; profit_percent: number }[]>([])
  const [promoterUsers, setPromoterUsers] = useState<User[]>([])
  const [editClientAccountId, setEditClientAccountId] = useState<number | null>(null)
  const isEditLoading = useRef(false)

  const { register, handleSubmit, reset, setValue, watch, control, setError, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: { status: 'pending', registered_at: new Date().toISOString().split('T')[0], origin_receipt: null, destination_receipt: null, client_account_id: null },
  })

  const originAmount = watch('origin_amount')
  const buyRate = watch('buy_rate')
  const sellRate = watch('sell_rate')
  const corridorId = watch('exchange_corridor_id')
  const tasaPublico = watch('tasa_publico')
  const selectedClientId = watch('client_id')

  const selectedCorridor = corridors.find(c => c.id === corridorId)
  const originCurrency = selectedCorridor?.origin_currency
  const destCurrency = selectedCorridor?.destination_currency
  const originSym = originCurrency?.symbol ?? '$'
  const destSym = destCurrency?.symbol ?? '$'
  const originCode = originCurrency?.code ?? ''
  const destCode = destCurrency?.code ?? ''

  useEffect(() => {
    if (selectedClientId) {
      if (!isEditLoading.current) {
        setValue('client_account_id', null)
      }
      isEditLoading.current = false
      const corridor = corridors.find(c => c.id === corridorId)
      loadClientAccounts(selectedClientId, corridor?.destination_currency_id, !isEdit)
    } else {
      setClientAccounts([])
      setValue('client_account_id', null)
    }
  }, [selectedClientId])

  useEffect(() => {
    const corridor = corridors.find(c => c.id === corridorId)
    if (corridor) {
      if (selectedClientId) {
        loadClientAccounts(selectedClientId, corridor.destination_currency_id)
      }
      loadSourceAccounts(corridor.origin_currency_id)
    } else if (!corridorId) {
      if (selectedClientId) {
        loadClientAccounts(selectedClientId)
      }
      loadSourceAccounts()
    }
  }, [corridorId])

  const doCalculate = async () => {
    if (!originAmount || !buyRate || !sellRate || !corridorId || !tasaPublico) return
    setCalculating(true)
    try {
      const result = await remittanceRepository.calculate({
        origin_amount: originAmount,
        buy_rate: buyRate,
        sell_rate: sellRate,
        exchange_corridor_id: corridorId,
        tasa_publico: tasaPublico,
      } as any)
      setCalculation(result as CalculationResult)
    } finally {
      setCalculating(false)
    }
  }

  const loadClients = () => clientRepository.all().then(setClients)
  const loadCorridors = () => exchangeCorridorRepository.all().then((data) => setCorridors(data.filter((c) => c.is_active)))
  const loadClientAccounts = (clientId: number, currencyId?: number | null, autoSelect = false) => {
    const params: Record<string, any> = { client_id: clientId }
    if (currencyId) params.currency_id = currencyId
    return clientAccountRepository.all(params).then((accounts) => {
    setClientAccounts(accounts)
    if (autoSelect) {
      const defaultAccount = accounts.find((a) => a.is_default)
      if (defaultAccount) setValue('client_account_id', defaultAccount.id)
    }
  })}
  const loadSourceAccounts = (currencyId?: number | null) => {
    const params: Record<string, any> = {}
    if (currencyId) params.currency_id = currencyId
    return sourceAccountRepository.all(params).then(setSourceAccounts)
  }

  const handleReceiptUpload = async (file: File, type: 'origin' | 'destination') => {
    const setUploading = type === 'origin' ? setUploadingOrigin : setUploadingDest
    const setUrl = type === 'origin' ? setOriginReceiptUrl : setDestReceiptUrl
    const setField = type === 'origin' ? 'origin_receipt' : 'destination_receipt'
    setUploading(true)
    try {
      const url = await remittanceRepository.uploadReceipt(file)
      setUrl(URL.createObjectURL(file))
      setValue(setField, url)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveReceipt = (type: 'origin' | 'destination') => {
    const setUrl = type === 'origin' ? setOriginReceiptUrl : setDestReceiptUrl
    const setField = type === 'origin' ? 'origin_receipt' : 'destination_receipt'
    setUrl(null)
    setValue(setField, null)
  }

  useEffect(() => {
    loadClients()
    loadCorridors()
    loadSourceAccounts()
    userRepository.all({ role: 'promoter' }).then(setPromoterUsers)
    if (isEdit && entityId) {
      isEditLoading.current = true
      remittanceRepository.find(entityId).then((d) => {
        const dn = parseFloat(d.destination_net_amount)
        const isMultiply = d.exchange_corridor?.tasa_formula === 'multiply'
        setOriginReceiptUrl(d.origin_receipt_url)
        setDestReceiptUrl(d.destination_receipt_url)
        setEditClientAccountId(d.client_account_id ?? null)
        reset({
          client_id: d.client_id,
          exchange_corridor_id: d.exchange_corridor_id,
          client_account_id: d.client_account_id ?? null,
          source_account_id: d.source_account_id ?? null,
          origin_amount: parseFloat(d.origin_amount),
          buy_rate: parseFloat(d.buy_rate),
          sell_rate: parseFloat(d.sell_rate),
          tasa_publico: parseFloat(d.origin_amount) > 0
            ? parseFloat((isMultiply ? dn / parseFloat(d.origin_amount) : parseFloat(d.origin_amount) / dn).toFixed(2))
            : 0,
          notes: d.notes || '',
          registered_at: d.registered_at || new Date().toISOString().split('T')[0],
          status: d.status,
          origin_receipt: d.origin_receipt,
          destination_receipt: d.destination_receipt,
        })
        if (d.promoters) {
          setPromoters(d.promoters.map((p: RemittancePromoter) => ({
            user_id: p.user_id,
            profit_percent: Number(p.profit_percent),
          })))
        }
        setCalculation({
          origin_commission_total: parseFloat(d.origin_commission_total),
          origin_net_amount: parseFloat(d.origin_net_amount),
          usdt_bought: parseFloat(d.usdt_bought),
          destination_gross_amount: parseFloat(d.destination_gross_amount),
          destination_commission_total: parseFloat(d.destination_commission_total),
          destination_net_amount: parseFloat(d.destination_net_amount),
          usdt_to_sell: parseFloat(d.usdt_to_sell ?? 0),
          profit_usdt: parseFloat(d.profit_usdt ?? 0),
          total_profit_usd: parseFloat(d.total_profit_usd),
          tasa_formula: (d.exchange_corridor?.tasa_formula ?? 'divide') as 'divide' | 'multiply',
        })
      }).catch((err) => {
        console.error('Error loading remittance for edit:', err)
        toast.error('Error al cargar la remesa para editar')
      })
    }
  }, [entityId, isEdit, reset])

  useEffect(() => {
    if (editClientAccountId !== null && clientAccounts.length > 0) {
      setValue('client_account_id', editClientAccountId)
      setEditClientAccountId(null)
    }
  }, [clientAccounts])

  const onSubmit = async (data: FormData) => {
    try {
      const validPromoters = promoters.filter((p) => p.user_id > 0)
      const payload: Record<string, any> = {
        ...data,
        client_account_id: data.client_account_id || null,
        source_account_id: data.source_account_id || null,
        origin_receipt: data.origin_receipt || null,
        destination_receipt: data.destination_receipt || null,
      }
      if (validPromoters.length > 0) {
        payload.promoters = validPromoters
      }
      let result: Remittance | undefined
      if (isEdit) {
        result = await remittanceRepository.update(entityId!, payload)
        toast.success(t('remittance.updated_successfully'))
      } else {
        result = await remittanceRepository.create(payload)
        toast.success(t('remittance.created_successfully'))
      }
      if (onSuccess) {
        onSuccess(result)
      } else {
        navigate('/remittances')
      }
    } catch (err) {
      if (!handleFormErrors(err as any, setError)) {
        toast.error('Error saving remittance')
      }
    }
  }

  const corridorsWithDefaults = corridors.map((c) => ({
    ...c,
    parsedBuyRate: parseFloat(c.default_buy_rate),
    parsedSellRate: parseFloat(c.default_sell_rate),
  }))

  return (
    <div className={modal ? '' : 'max-w-2xl mx-auto'}>
      {showHeader && <h1 className="text-2xl font-bold text-gray-900 mb-6">{t(isEdit ? 'remittance.edit' : 'remittance.create')}</h1>}

      <form onSubmit={handleSubmit(onSubmit)} className={modal ? 'p-6 space-y-5' : 'bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5'}>
        <div className="grid grid-cols-2 gap-4">
          <FormField label={t('remittance.client')} error={errors.client_id?.message} required>
            <div className="flex gap-2">
              <select {...register('client_id', { required: 'Required', valueAsNumber: true })} className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white" aria-invalid={!!errors.client_id}>
                <option value="">Select...</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name} - {c.document_number}</option>)}
              </select>
              <button type="button" onClick={() => setClientModalOpen(true)} className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl border border-dashed border-blue-200 transition-colors">
                <Plus size={16} />
              </button>
            </div>
          </FormField>
          <FormField label={t('remittance.corridor')} error={errors.exchange_corridor_id?.message} required>
            <select {...register('exchange_corridor_id', { required: 'Required', valueAsNumber: true })}
              onChange={(e) => {
                const corr = corridorsWithDefaults.find((c) => c.id === parseInt(e.target.value))
                if (corr && !isEdit) {
                  reset((prev) => ({ ...prev, exchange_corridor_id: corr.id, buy_rate: corr.parsedBuyRate, sell_rate: corr.parsedSellRate }))
                }
              }}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white" aria-invalid={!!errors.exchange_corridor_id}>
              <option value="">Select...</option>
              {corridors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label={t('remittance.destination_account')} error={errors.client_account_id?.message}>
            <div className="flex gap-2">
              <select {...register('client_account_id', { setValueAs: (v) => v ? Number(v) : null })} className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white" aria-invalid={!!errors.client_account_id}>
                <option value="">{t('common.select')}...</option>
                {clientAccounts.map((a) => <option key={a.id} value={a.id}>{a.bank_name} - {a.account_number}</option>)}
              </select>
              <InlineCreateModal
                onCreate={(form) => clientAccountRepository.create(form)}
                title="Add Account"
                triggerClass="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl border border-dashed border-blue-200 transition-colors"
                fields={[
                  { name: 'client_id', label: 'Client ID', type: 'hidden', defaultValue: selectedClientId },
                  { name: 'country_id', label: 'Country', type: 'select', optionsEndpoint: '/countries', optionsLabelKey: 'name', optionsValueKey: 'id' },
                  { name: 'currency_id', label: 'Currency', type: 'hidden', defaultValue: selectedCorridor?.destination_currency_id },
                  { name: 'account_holder', label: 'Account Holder', required: true },
                  { name: 'bank_name', label: 'Bank Name' },
                  { name: 'account_number', label: 'Account Number', required: true },
                  { name: 'account_type', label: 'Type', defaultValue: 'bank' },
                ]}
                onCreated={(item) => {
                  setClientAccounts(prev => [item, ...prev])
                  setValue('client_account_id', item.id)
                  if (selectedClientId) loadClientAccounts(selectedClientId, selectedCorridor?.destination_currency_id)
                }}
              />
            </div>
          </FormField>
          <FormField label={t('remittance.source_account')} error={errors.source_account_id?.message}>
            <div className="flex gap-2">
              <select {...register('source_account_id', { setValueAs: (v) => v ? Number(v) : null })} className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white" aria-invalid={!!errors.source_account_id}>
                <option value="">{t('common.select')}...</option>
                {sourceAccounts.map((a) => <option key={a.id} value={a.id}>{a.bank_name} - {a.account_number}</option>)}
              </select>
              <InlineCreateModal
                onCreate={(form) => sourceAccountRepository.create(form)}
                title="Add Source Account"
                triggerClass="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl border border-dashed border-blue-200 transition-colors"
                fields={[
                  { name: 'country_id', label: 'Country', type: 'select', optionsEndpoint: '/countries', optionsLabelKey: 'name', optionsValueKey: 'id' },
                  { name: 'currency_id', label: 'Currency', type: 'hidden', defaultValue: selectedCorridor?.origin_currency_id },
                  { name: 'account_holder', label: 'Account Holder', required: true },
                  { name: 'bank_name', label: 'Bank Name' },
                  { name: 'account_number', label: 'Account Number', required: true },
                  { name: 'account_type', label: 'Type', defaultValue: 'bank' },
                ]}
                onCreated={(item) => {
                  setSourceAccounts(prev => [item, ...prev])
                  setValue('source_account_id', item.id)
                  loadSourceAccounts(selectedCorridor?.origin_currency_id)
                }}
              />
            </div>
          </FormField>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <FormField label={`${t('remittance.origin_amount')} (${originSym})`} error={errors.origin_amount?.message}>
            <Controller name="origin_amount" control={control} render={({ field }) => (
              <NumberInput {...field} decimals={2} placeholder="0.00" aria-invalid={!!errors.origin_amount} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            )} />
          </FormField>
          <FormField label={`${t('remittance.buy_rate')} (${originCode}/USDT)`} error={errors.buy_rate?.message}>
            <Controller name="buy_rate" control={control} render={({ field }) => (
              <NumberInput {...field} decimals={4} placeholder="0.0000" aria-invalid={!!errors.buy_rate} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            )} />
          </FormField>
          <FormField label={`${t('remittance.sell_rate')} (USDT/${destCode})`} error={errors.sell_rate?.message}>
            <Controller name="sell_rate" control={control} render={({ field }) => (
              <NumberInput {...field} decimals={4} placeholder="0.0000" aria-invalid={!!errors.sell_rate} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            )} />
          </FormField>
          <FormField label={`${t('remittance.tasa_publico')} (${destSym})`} error={errors.tasa_publico?.message}>
            <Controller name="tasa_publico" control={control} render={({ field }) => (
              <NumberInput {...field} decimals={2} placeholder="6,5" aria-invalid={!!errors.tasa_publico} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            )} />
          </FormField>
        </div>


        <FormField label={t('remittance.notes')} error={errors.notes?.message}>
          <textarea {...register('notes')} rows={2} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" aria-invalid={!!errors.notes} />
        </FormField>

        <FormField label={t('remittance.registered_at')} error={errors.registered_at?.message}>
          <input type="date" {...register('registered_at', { required: t('remittance.registered_at') })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" aria-invalid={!!errors.registered_at} />
        </FormField>

        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">{t('remittance.promoters')}</label>
            <button type="button" onClick={() => setPromoters((prev) => [...prev, { user_id: 0, profit_percent: 0 }])}
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium">
              <UserPlus size={14} /> {t('common.add')}
            </button>
          </div>
          {promoters.length === 0 ? (
            <p className="text-xs text-gray-400 italic">{t('remittance.no_promoters')}</p>
          ) : (
            <div className="space-y-2">
              {promoters.map((p, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">{t('remittance.promoter_user')}</label>
                    <select value={p.user_id} onChange={(e) => {
                      const newPromoters = [...promoters]
                      newPromoters[idx] = { ...newPromoters[idx], user_id: parseInt(e.target.value) } as { user_id: number; profit_percent: number }
                      setPromoters(newPromoters)
                    }} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                      <option value="0">{t('common.select')}</option>
                      {promoterUsers.filter((u) => !promoters.some((op, oi) => op.user_id === u.id && oi !== idx)).map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-28">
                    <label className="block text-xs text-gray-500 mb-1">{t('remittance.profit_percent')}</label>
                            <NumberInput value={p.profit_percent} decimals={2}
                      onChange={(val) => {
                        const newPromoters = [...promoters]
                        newPromoters[idx] = { ...newPromoters[idx], profit_percent: val ?? 0 } as { user_id: number; profit_percent: number }
                        setPromoters(newPromoters)
                      }}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <button type="button" onClick={() => setPromoters((prev) => prev.filter((_, i) => i !== idx))}
                    className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl border border-dashed border-red-200 transition-colors mb-0.5">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <div className="text-xs text-gray-500 pt-1">
                {t('remittance.total_assigned')}: {fmt(promoters.reduce((s, p) => s + p.profit_percent, 0))}% — {t('remittance.owner_share')}: {fmt(100 - promoters.reduce((s, p) => s + p.profit_percent, 0))}%
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('remittance.origin_receipt')}</label>
            {originReceiptUrl ? (
              <div className="space-y-2">
                <img src={originReceiptUrl} alt="Origin receipt" className="w-full h-32 object-cover rounded-xl border border-gray-200" />
                <div className="flex gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 cursor-pointer">
                    <Upload size={14} />
                    {t('remittance.replace_receipt')}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleReceiptUpload(e.target.files[0], 'origin')} />
                  </label>
                  <button type="button" onClick={() => handleRemoveReceipt('origin')}
                    className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700">
                    <Trash2 size={14} /> {t('remittance.remove_receipt')}
                  </button>
                </div>
              </div>
            ) : (
              <label className={`flex items-center justify-center gap-2 h-32 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors ${uploadingOrigin ? 'opacity-50 pointer-events-none' : ''}`}>
                {uploadingOrigin ? <Loader2 size={20} className="animate-spin text-gray-400" /> : <Upload size={20} className="text-gray-400" />}
                <span className="text-sm text-gray-500">{uploadingOrigin ? '...' : t('remittance.upload_receipt')}</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploadingOrigin}
                  onChange={(e) => e.target.files?.[0] && handleReceiptUpload(e.target.files[0], 'origin')} />
              </label>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('remittance.destination_receipt')}</label>
            {destReceiptUrl ? (
              <div className="space-y-2">
                <img src={destReceiptUrl} alt="Destination receipt" className="w-full h-32 object-cover rounded-xl border border-gray-200" />
                <div className="flex gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 cursor-pointer">
                    <Upload size={14} />
                    {t('remittance.replace_receipt')}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleReceiptUpload(e.target.files[0], 'destination')} />
                  </label>
                  <button type="button" onClick={() => handleRemoveReceipt('destination')}
                    className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700">
                    <Trash2 size={14} /> {t('remittance.remove_receipt')}
                  </button>
                </div>
              </div>
            ) : (
              <label className={`flex items-center justify-center gap-2 h-32 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors ${uploadingDest ? 'opacity-50 pointer-events-none' : ''}`}>
                {uploadingDest ? <Loader2 size={20} className="animate-spin text-gray-400" /> : <Upload size={20} className="text-gray-400" />}
                <span className="text-sm text-gray-500">{uploadingDest ? '...' : t('remittance.upload_receipt')}</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploadingDest}
                  onChange={(e) => e.target.files?.[0] && handleReceiptUpload(e.target.files[0], 'destination')} />
              </label>
            )}
          </div>
        </div>

        <button type="button" onClick={doCalculate} disabled={calculating}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-5 py-2.5 rounded-xl hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 text-sm font-medium shadow-sm transition-all">
          {calculating ? <RefreshCw size={16} className="animate-spin" /> : <Calculator size={16} />}
          {t('remittance.calculate')}
        </button>

        {calculation && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200 text-center">
                <span className="text-blue-600 text-xs font-medium">{t('remittance.usdt_to_buy')}</span>
                <p className="font-bold text-2xl text-blue-700 mt-1">{fmt(calculation.usdt_bought)}</p>
                <p className="text-xs text-blue-500 mt-0.5">USDT</p>
              </div>
              <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl p-4 border border-violet-200 text-center">
                <span className="text-violet-600 text-xs font-medium">{t('remittance.usdt_to_sell')}</span>
                <p className="font-bold text-2xl text-violet-700 mt-1">{fmt(calculation.usdt_to_sell)}</p>
                <p className="text-xs text-violet-500 mt-0.5">USDT</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200 text-center">
                <span className="text-emerald-600 text-xs font-medium">{t('remittance.profit_usdt')}</span>
                <p className="font-bold text-2xl text-emerald-700 mt-1">{fmt(calculation.profit_usdt)}</p>
                <p className="text-xs text-emerald-500 mt-0.5">USDT</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-3 border border-gray-200 text-center text-xs text-gray-500 space-y-1">
              <div>({fmt(originAmount ?? 0)}{originSym} - {fmt(calculation.origin_commission_total)}{originSym}) / {fmt(buyRate ?? 1, 4)} = {fmt(calculation.usdt_bought)} USDT</div>
              {calculation.tasa_formula === 'multiply' ? (
                <>
                  <div>{fmt(originAmount ?? 0)}{originSym} × {fmt(tasaPublico ?? 1, 4)} = {fmt(calculation.destination_net_amount)}{destSym} (cliente recibe)</div>
                  <div>{fmt(calculation.destination_net_amount)}{destSym} / {fmt(sellRate ?? 1, 4)} = {fmt(calculation.usdt_to_sell)} USDT (se venden)</div>
                </>
              ) : (
                <>
                  <div>{fmt(originAmount ?? 0)}{originSym} / {fmt(tasaPublico ?? 1, 4)} = {fmt(calculation.destination_net_amount)}{destSym} (cliente recibe)</div>
                  <div>{fmt(calculation.usdt_to_sell)} × {fmt(sellRate ?? 1, 4)} = {fmt(calculation.destination_gross_amount)}{destSym} → -{fmt(calculation.destination_commission_total)}{destSym} = {fmt(calculation.destination_net_amount)}{destSym}</div>
                </>
              )}
              <div className="text-emerald-600 font-medium">{fmt(calculation.usdt_bought)} - {fmt(calculation.usdt_to_sell)} = {fmt(calculation.profit_usdt)} USDT</div>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border border-gray-200">
              <div><span className="text-gray-500 text-xs">{t('remittance.origin_amount')}</span><p className="font-semibold text-gray-900 mt-0.5">{originSym}{fmt(calculation.origin_net_amount)}</p></div>
              <div><span className="text-gray-500 text-xs">{t('remittance.origin_commission')}</span><p className="font-semibold text-gray-900 mt-0.5">{originSym}{fmt(calculation.origin_commission_total)}</p></div>
              <div><span className="text-gray-500 text-xs">{t('remittance.destination_gross')}</span><p className="font-semibold text-gray-900 mt-0.5">{destSym}{fmt(calculation.destination_gross_amount)}</p></div>
              <div><span className="text-gray-500 text-xs">{t('remittance.destination_commission')}</span><p className="font-semibold text-gray-900 mt-0.5">{destSym}{fmt(calculation.destination_commission_total)}</p></div>
              <div className="md:col-span-2 bg-white rounded-lg p-3 border border-emerald-100"><span className="text-emerald-600 text-xs font-medium">{t('remittance.profit_usdt')}</span><p className="font-bold text-xl text-emerald-700 mt-0.5">{fmt(calculation.profit_usdt)} USDT</p></div>
            </div>
          </div>
        )}

        {isEdit && (
          <FormField label={t('common.status')} error={errors.status?.message}>
            <select {...register('status')} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white" aria-invalid={!!errors.status}>
              <option value="pending">{t('remittance.status_pending')}</option>
              <option value="completed">{t('remittance.status_completed')}</option>
              <option value="cancelled">{t('remittance.status_cancelled')}</option>
            </select>
          </FormField>
        )}

        <div className="flex gap-3 pt-2 border-t border-gray-100">
          <button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2.5 rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 text-sm font-medium shadow-sm transition-all">
            {t('common.save')}
          </button>
          <button type="button" onClick={() => onSuccess ? onSuccess(undefined) : navigate('/remittances')} className="bg-gray-100 text-gray-600 px-6 py-2.5 rounded-xl hover:bg-gray-200 text-sm font-medium transition-colors">
            {t('common.cancel')}
          </button>
        </div>
      </form>

      <Modal open={clientModalOpen} onClose={() => setClientModalOpen(false)} title="Quick Create Client" size="md">
        <ClientFormPage
          showHeader={false}
          onSuccess={(client) => {
            setClientModalOpen(false)
            if (client) {
              loadClients()
              setValue('client_id', client.id)
            }
          }}
        />
      </Modal>
    </div>
  )
}
