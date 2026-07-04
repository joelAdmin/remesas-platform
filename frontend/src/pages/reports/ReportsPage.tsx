import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { BarChart3, Download, TrendingUp, Users, UserCheck, Send } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import DataTable from '../../components/ui/DataTable'
import { workCycleRepository } from '../../services/repositories/WorkCycleRepository'
import { exchangeCorridorRepository } from '../../services/repositories/ExchangeCorridorRepository'
import api from '../../services/api'
import { fmt } from '../../lib/utils'
import { useConfirm } from '../../components/ui/ConfirmDialog'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import type { WorkCycle, ExchangeCorridor } from '../../types/entities'

interface SummaryData {
  total_remittances: number
  total_profit_usdt: number
  total_profit_usd: number
  total_origin_amount: number
  by_status: { status: string; count: number; profit_usdt: number; profit_usd: number }[]
  work_cycle: { id: number; name: string } | null
}

interface DailyProfit {
  date: string
  count: number
  profit_usdt: number
  profit_usd: number
  origin_amount: number
}

interface ProfitData {
  daily: DailyProfit[]
  total: { total_remittances: number; total_profit_usdt: number; total_profit_usd: number; total_origin_amount: number }
}

interface PromoterRow {
  user_id: number
  user_name: string
  total_percent_sum: number
  remittance_count: number
  total_earnings_usdt: number
}

interface ResponsibleRow {
  user_id: number
  user_name: string
  total_percent_sum: number
  remittance_count: number
  total_earnings_usd: number
}

interface RemittanceRow {
  id: number
  ref_ve: string
  client_name: string
  corridor_name: string
  origin_amount: number
  buy_rate: number
  sell_rate: number
  profit_usdt: number
  total_profit_usd: number
  status: string
  work_cycle_name: string
  promoters: { name: string; percent: number }[]
  created_at: string
}

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  in_process: 'En Proceso',
  completed: 'Completada',
  cancelled: 'Cancelada',
}

type Tab = 'summary' | 'profit' | 'promoters' | 'responsibles' | 'remittances'

export default function ReportsPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { confirm, ConfirmDialog } = useConfirm()

  const [activeTab, setActiveTab] = useState<Tab>('summary')
  const [workCycles, setWorkCycles] = useState<WorkCycle[]>([])
  const [corridors, setCorridors] = useState<ExchangeCorridor[]>([])

  const [filters, setFilters] = useState({
    work_cycle_id: searchParams.get('work_cycle_id') || '',
    exchange_corridor_id: '',
    status: '',
    date_from: '',
    date_to: '',
  })

  const [summaryData, setSummaryData] = useState<SummaryData | null>(null)
  const [profitData, setProfitData] = useState<ProfitData | null>(null)
  const [promoters, setPromoters] = useState<PromoterRow[]>([])
  const [responsibles, setResponsibles] = useState<ResponsibleRow[]>([])
  const [remittances, setRemittances] = useState<RemittanceRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      workCycleRepository.all(),
      exchangeCorridorRepository.all(),
    ]).then(([cycles, cors]) => {
      setWorkCycles(cycles)
      setCorridors(cors)
    })
  }, [])

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v) })
    return params.toString()
  }, [filters])

  const fetchSummary = useCallback(async () => {
    const res = await api.get(`/reports/summary?${buildQuery()}`)
    setSummaryData(res.data.data)
  }, [buildQuery])

  const fetchProfit = useCallback(async () => {
    const res = await api.get(`/reports/profit?${buildQuery()}`)
    setProfitData(res.data.data)
  }, [buildQuery])

  const fetchPromoters = useCallback(async () => {
    const res = await api.get(`/reports/promoters?${buildQuery()}`)
    setPromoters(res.data.data)
  }, [buildQuery])

  const fetchResponsibles = useCallback(async () => {
    const res = await api.get(`/reports/responsibles?${buildQuery()}`)
    setResponsibles(res.data.data)
  }, [buildQuery])

  const fetchRemittances = useCallback(async () => {
    const res = await api.get(`/reports/remittances?${buildQuery()}`)
    const data = res.data.data
    setRemittances(Array.isArray(data) ? data : data.data ?? [])
  }, [buildQuery])

  useEffect(() => {
    setLoading(true)
    const queries = [fetchSummary()]
    if (activeTab === 'profit') queries.push(fetchProfit())
    if (activeTab === 'promoters') queries.push(fetchPromoters())
    if (activeTab === 'responsibles') queries.push(fetchResponsibles())
    if (activeTab === 'remittances') queries.push(fetchRemittances())
    Promise.all(queries).finally(() => setLoading(false))
  }, [activeTab, fetchSummary, fetchProfit, fetchPromoters, fetchResponsibles, fetchRemittances])

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleExport = async (type: string) => {
    const token = localStorage.getItem('token')
    const query = buildQuery()
    window.open(`/api/reports/${type}/export?${query}`, '_blank')
  }

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'summary', label: 'Resumen', icon: BarChart3 },
    { key: 'profit', label: 'Ganancia', icon: TrendingUp },
    { key: 'promoters', label: 'Promotores', icon: Users },
    { key: 'responsibles', label: 'Responsables', icon: UserCheck },
    { key: 'remittances', label: 'Remesas', icon: Send },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Reportes</h1>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Ciclo</label>
              <select
                value={filters.work_cycle_id}
                onChange={(e) => handleFilterChange('work_cycle_id', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Todos</option>
                {workCycles.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.status === 'open' ? 'Abierto' : 'Cerrado'})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Corredor</label>
              <select
                value={filters.exchange_corridor_id}
                onChange={(e) => handleFilterChange('exchange_corridor_id', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Todos</option>
                {corridors.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Estado</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Todos</option>
                {Object.entries(statusLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Desde</label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Hasta</label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-12 text-gray-400">Cargando...</div>}

      {!loading && activeTab === 'summary' && summaryData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Total Remesas</p><p className="text-2xl font-bold">{summaryData.total_remittances}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Ganancia USDT</p><p className="text-2xl font-bold text-green-600">${fmt(summaryData.total_profit_usdt)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Ganancia USD</p><p className="text-2xl font-bold text-blue-600">${fmt(summaryData.total_profit_usd)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Monto Origen</p><p className="text-2xl font-bold">${fmt(summaryData.total_origin_amount, 0)}</p></CardContent></Card>
          </div>

          {summaryData.work_cycle && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm">
              Filtrando por ciclo: <strong>{summaryData.work_cycle.name}</strong>
            </div>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base">Remesas por Estado</CardTitle></CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2 font-medium">Estado</th>
                    <th className="pb-2 font-medium">Cantidad</th>
                    <th className="pb-2 font-medium">Ganancia USDT</th>
                    <th className="pb-2 font-medium">Ganancia USD</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryData.by_status.map((s) => (
                    <tr key={s.status} className="border-b last:border-0">
                      <td className="py-2">{statusLabels[s.status] || s.status}</td>
                      <td className="py-2">{s.count}</td>
                      <td className="py-2">${fmt(s.profit_usdt)}</td>
                      <td className="py-2">${fmt(s.profit_usd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {!loading && activeTab === 'profit' && profitData && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
              <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Total Remesas</p><p className="text-2xl font-bold">{profitData.total.total_remittances}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Ganancia USDT</p><p className="text-2xl font-bold text-green-600">${fmt(profitData.total.total_profit_usdt)}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Ganancia USD</p><p className="text-2xl font-bold text-blue-600">${fmt(profitData.total.total_profit_usd)}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Monto Origen</p><p className="text-2xl font-bold">${fmt(profitData.total.total_origin_amount, 0)}</p></CardContent></Card>
            </div>
            <Button variant="outline" size="sm" onClick={() => handleExport('profit')} className="ml-4 shrink-0">
              <Download size={14} className="mr-1" /> Excel
            </Button>
          </div>

          <Card>
            <CardContent className="p-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={profitData.daily.slice().reverse()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ fontSize: 13, borderRadius: 8 }} />
                  <Bar dataKey="profit_usdt" fill="#10b981" radius={[4, 4, 0, 0]} name="Ganancia USDT" />
                  <Bar dataKey="profit_usd" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Ganancia USD" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <DataTable<any>
            columns={[
              { key: 'date', label: 'Fecha' },
              { key: 'count', label: 'Remesas' },
              { key: 'profit_usdt', label: 'Ganancia USDT', render: (item: any) => `$${fmt(item.profit_usdt)}` },
              { key: 'profit_usd', label: 'Ganancia USD', render: (item: any) => `$${fmt(item.profit_usd)}` },
              { key: 'origin_amount', label: 'Monto Origen', render: (item: any) => `$${fmt(item.origin_amount, 0)}` },
            ]}
            data={profitData.daily}
            loading={false}
            keyExtractor={(item: any) => item.date}
            searchable
          />
        </div>
      )}

      {!loading && activeTab === 'promoters' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => handleExport('promoters')}>
              <Download size={14} className="mr-1" /> Excel
            </Button>
          </div>
          <DataTable<PromoterRow>
            columns={[
              { key: 'user_name', label: 'Promotor' },
              { key: 'remittance_count', label: 'Remesas' },
              { key: 'total_percent_sum', label: '% Total', render: (item) => `${item.total_percent_sum}%` },
              { key: 'total_earnings_usdt', label: 'Ganancia USDT', render: (item) => `$${fmt(item.total_earnings_usdt)}` },
            ]}
            data={promoters}
            loading={false}
            keyExtractor={(item) => item.user_id}
            searchable
          />
        </div>
      )}

      {!loading && activeTab === 'responsibles' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => handleExport('responsibles')}>
              <Download size={14} className="mr-1" /> Excel
            </Button>
          </div>
          <DataTable<ResponsibleRow>
            columns={[
              { key: 'user_name', label: 'Responsable' },
              { key: 'remittance_count', label: 'Remesas' },
              { key: 'total_percent_sum', label: '% Total', render: (item) => `${item.total_percent_sum}%` },
              { key: 'total_earnings_usd', label: 'Ganancia USD', render: (item) => `$${fmt(item.total_earnings_usd)}` },
            ]}
            data={responsibles}
            loading={false}
            keyExtractor={(item) => item.user_id}
            searchable
          />
        </div>
      )}

      {!loading && activeTab === 'remittances' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => handleExport('remittances')}>
              <Download size={14} className="mr-1" /> Excel
            </Button>
          </div>
          <DataTable<RemittanceRow>
            columns={[
              { key: 'ref_ve', label: 'Referencia' },
              { key: 'client_name', label: 'Cliente' },
              { key: 'corridor_name', label: 'Corredor' },
              { key: 'origin_amount', label: 'Monto', render: (item) => `$${fmt(item.origin_amount)}` },
              { key: 'profit_usdt', label: 'Ganancia USDT', render: (item) => `$${fmt(item.profit_usdt)}` },
              { key: 'total_profit_usd', label: 'Ganancia USD', render: (item) => `$${fmt(item.total_profit_usd)}` },
              { key: 'status', label: 'Estado', render: (item) => statusLabels[item.status] || item.status },
            ]}
            data={remittances}
            loading={false}
            keyExtractor={(item) => item.id}
            searchable
          />
        </div>
      )}

      <ConfirmDialog />
    </div>
  )
}
