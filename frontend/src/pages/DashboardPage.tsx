import { useTranslation } from 'react-i18next'
import { useAppSelector } from '../store/hooks'
import type { RootState } from '../store'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Send, Users, DollarSign, Activity, TrendingUp, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import api from '../services/api'
import { fmt } from '../lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

interface DashboardData {
  remittances_today: number
  total_clients: number
  total_remittances: number
  total_profit_usd: number
  remittances_by_status: Record<string, number>
  profit_last_7_days: { date: string; profit: number }[]
  remittances_last_7_days: { date: string; count: number }[]
  recent_remittances: { id: number; ref_ve: string; client_name: string; origin_amount: number; status: string; created_at: string }[]
}

const statusColors: Record<string, string> = {
  pending: '#eab308',
  in_process: '#3b82f6',
  completed: '#10b981',
  cancelled: '#ef4444',
}

const statusBadgeColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  in_process: 'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
}

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  in_process: 'En Proceso',
  completed: 'Completada',
  cancelled: 'Cancelada',
}

const pieColors = ['#eab308', '#3b82f6', '#10b981', '#ef4444']

export default function DashboardPage() {
  const { t } = useTranslation()
  const user = useAppSelector((s: RootState) => s.auth.user)
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard').then((res) => {
      setData(res.data.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">{t('nav.dashboard')} — {user?.name}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="h-24 p-6"><div className="animate-pulse bg-gray-200 rounded h-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    )
  }

  const cards = [
    { label: 'Remesas Hoy', value: data.remittances_today, icon: Send, color: 'bg-blue-500' },
    { label: 'Clientes', value: data.total_clients, icon: Users, color: 'bg-green-500' },
    { label: 'Total Remesas', value: data.total_remittances, icon: Activity, color: 'bg-purple-500' },
    { label: 'Ganancia Total USD', value: `$${fmt(data.total_profit_usd, 0)}`, icon: DollarSign, color: 'bg-orange-500' },
  ]

  const statusPieData = Object.entries(data.remittances_by_status).map(([name, value]) => ({
    name: statusLabels[name] || name,
    value,
  }))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        {t('nav.dashboard')} — {user?.name}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`${card.color} p-3 rounded-xl text-white shrink-0`}>
                <card.icon size={22} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{card.label}</p>
                <p className="text-2xl font-bold">{card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Calendar size={18} /> Remesas por día</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.remittances_last_7_days}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ fontSize: 13, borderRadius: 8 }} labelFormatter={(v) => `Fecha: ${v}`} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Remesas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><TrendingUp size={18} /> Ganancia por día (USD)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.profit_last_7_days}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ fontSize: 13, borderRadius: 8 }} labelFormatter={(v) => `Fecha: ${v}`} formatter={(v: number) => [`$${fmt(v)}`, 'Ganancia']} />
                <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: '#10b981' }} name="Ganancia" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Remesas por Estado</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {statusPieData.map((_, idx) => <Cell key={idx} fill={pieColors[idx % pieColors.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Últimas Remesas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {data.recent_remittances.map((r) => (
                <Link key={r.id} to={`/remittances/${r.id}/edit`} className="flex items-center justify-between px-6 py-3 hover:bg-muted/50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.ref_ve}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.client_name}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-sm font-semibold">${fmt(r.origin_amount, 0)}</p>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${statusBadgeColors[r.status] || 'bg-gray-100 text-gray-700'}`}>
                      {statusLabels[r.status] || r.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Acceso Rápido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { to: '/remittances/new', label: 'Nueva Remesa' },
              { to: '/clients', label: 'Clientes' },
              { to: '/exchange-corridors', label: 'Corredores' },
              { to: '/users', label: 'Usuarios' },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-center p-4 bg-muted rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
