import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { clientAccountRepository } from '../../services/repositories/ClientAccountRepository'
import { sourceAccountRepository } from '../../services/repositories/SourceAccountRepository'
import { countryRepository } from '../../services/repositories/CountryRepository'
import { currencyRepository } from '../../services/repositories/CurrencyRepository'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { useConfirm } from '../../components/ui/ConfirmDialog'
import type { ClientAccount, SourceAccount, Country, Currency } from '../../types/entities'
import { Banknote } from 'lucide-react'

type Tab = 'client' | 'source'

export default function BankAccountListPage() {
  const { t } = useTranslation()
  const { confirm, ConfirmDialog } = useConfirm()
  const [tab, setTab] = useState<Tab>('client')

  const [clientAccounts, setClientAccounts] = useState<ClientAccount[]>([])
  const [sourceAccounts, setSourceAccounts] = useState<SourceAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [countries, setCountries] = useState<Country[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])

  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<ClientAccount | SourceAccount | null>(null)
  const [form, setForm] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)

  const fetchAll = () => {
    setLoading(true)
    Promise.all([
      clientAccountRepository.all(),
      sourceAccountRepository.all(),
      countryRepository.all(),
      currencyRepository.all(),
    ]).then(([ca, sa, co, cu]) => {
      setClientAccounts(ca)
      setSourceAccounts(sa)
      setCountries(co)
      setCurrencies(cu)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { fetchAll() }, [])

  const openEdit = (id: number) => {
    if (tab === 'client') {
      const item = clientAccounts.find((a) => a.id === id)
      if (!item) return
      setEditItem(item)
      setForm({
        country_id: item.country_id ?? '',
        currency_id: item.currency_id ?? '',
        account_holder: item.account_holder,
        bank_name: item.bank_name ?? '',
        account_number: item.account_number,
        account_type: item.account_type,
      })
    } else {
      const item = sourceAccounts.find((a) => a.id === id)
      if (!item) return
      setEditItem(item)
      setForm({
        country_id: item.country_id ?? '',
        currency_id: item.currency_id ?? '',
        account_holder: item.account_holder,
        bank_name: item.bank_name ?? '',
        account_number: item.account_number,
        account_type: item.account_type,
      })
    }
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editItem) return
    setSaving(true)
    try {
      const payload = { ...form }
      if (!payload.country_id) delete payload.country_id
      if (!payload.currency_id) delete payload.currency_id
      if (tab === 'client') {
        await clientAccountRepository.update(editItem.id, payload)
      } else {
        await sourceAccountRepository.update(editItem.id, payload)
      }
      toast.success('Cuenta actualizada exitosamente')
      setModalOpen(false)
      fetchAll()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al actualizar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!await confirm('¿Estás seguro de eliminar esta cuenta bancaria?')) return
    try {
      if (tab === 'client') {
        await clientAccountRepository.delete(id)
      } else {
        await sourceAccountRepository.delete(id)
      }
      toast.success('Cuenta eliminada exitosamente')
      fetchAll()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const handleBulkDelete = async (ids: number[]) => {
    if (!await confirm(`¿Eliminar ${ids.length} cuenta(s)?`)) return
    try {
      if (tab === 'client') {
        await Promise.all(ids.map((id) => clientAccountRepository.delete(id)))
      } else {
        await Promise.all(ids.map((id) => sourceAccountRepository.delete(id)))
      }
      toast.success(`${ids.length} cuenta(s) eliminada(s)`)
      fetchAll()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const clientTabColumns = [
    { key: 'bank_name', label: t('client.bank_name'), render: (a: any) => a.bank_name || '-' },
    { key: 'account_number', label: t('client.account_number') },
    { key: 'account_holder', label: t('client.account_holder') },
    { key: 'client', label: t('nav.clients'), render: (a: any) => a.client?.full_name || '-' },
    { key: 'country', label: t('client.country'), render: (a: any) => a.country?.name || '-' },
    { key: 'currency', label: t('client.currency'), render: (a: any) => a.currency?.code || '-' },
    {
      key: 'is_default', label: t('client.default_account'),
      render: (a: any) => a.is_default
        ? <span className="text-yellow-600 font-medium">★ {t('client.default_account')}</span>
        : <span className="text-gray-300">—</span>,
    },
  ]

  const sourceTabColumns = [
    { key: 'bank_name', label: t('client.bank_name'), render: (a: any) => a.bank_name || '-' },
    { key: 'account_number', label: t('client.account_number') },
    { key: 'account_holder', label: t('client.account_holder') },
    { key: 'country', label: t('client.country'), render: (a: any) => a.country?.name || '-' },
    { key: 'currency', label: t('client.currency'), render: (a: any) => a.currency?.code || '-' },
  ]

  const currentData = tab === 'client' ? clientAccounts : sourceAccounts

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Banknote size={24} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">{t('bank_accounts.title')}</h1>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('client')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${tab === 'client' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {t('bank_accounts.client_tab')}
        </button>
        <button
          onClick={() => setTab('source')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${tab === 'source' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {t('bank_accounts.source_tab')}
        </button>
      </div>

      <DataTable
        columns={(tab === 'client' ? clientTabColumns : sourceTabColumns) as any}
        data={currentData}
        loading={loading}
        onEdit={openEdit}
        onDelete={handleDelete}
        onBulkDelete={handleBulkDelete}
        keyExtractor={(item) => item.id}
        searchable
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('bank_accounts.edit_title')} size="sm">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('client.country')}</label>
            <select
              value={form.country_id ?? ''}
              onChange={(e) => {
                const countryId = e.target.value ? Number(e.target.value) : null
                setForm((p) => ({ ...p, country_id: countryId }))
                if (countryId) {
                  const country = countries.find((c) => c.id === countryId)
                  if (country?.currency_code) {
                    const currency = currencies.find((c) => c.code === country.currency_code)
                    if (currency) setForm((p) => ({ ...p, currency_id: currency.id }))
                  }
                }
              }}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="">{t('common.select')}...</option>
              {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('client.currency')}</label>
            <select
              value={form.currency_id ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, currency_id: e.target.value ? Number(e.target.value) : null }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="">{t('common.select')}...</option>
              {currencies.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('client.account_holder')}</label>
            <Input value={form.account_holder ?? ''} onChange={(e) => setForm((p) => ({ ...p, account_holder: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('client.bank_name')}</label>
            <Input value={form.bank_name ?? ''} onChange={(e) => setForm((p) => ({ ...p, bank_name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('client.account_number')}</label>
            <Input value={form.account_number ?? ''} onChange={(e) => setForm((p) => ({ ...p, account_number: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('client.account_type')}</label>
            <Input value={form.account_type ?? ''} onChange={(e) => setForm((p) => ({ ...p, account_type: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <Button type="submit" disabled={saving}>
              {saving ? t('common.loading') : t('common.save')}
            </Button>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog />
    </div>
  )
}
