import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard, Send, Users, MapPin, Coins,
  RefreshCw, UserCog, Percent, Share2, Target, BadgePercent,
  ChevronLeft, ChevronRight, LogOut, Globe, Banknote, Shield, Calendar, BarChart3,
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { logoutThunk } from '../../store/slices/authSlice'
import { useState } from 'react'

const navItems = [
  { to: '/dashboard', label: 'nav.dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
  { to: '/remittances', label: 'nav.remittances', icon: Send, permission: 'remittances.view' },
  { to: '/clients', label: 'nav.clients', icon: Users, permission: 'clients.view' },
  { to: '/countries', label: 'nav.countries', icon: MapPin, permission: 'countries.view' },
  { to: '/currencies', label: 'nav.currencies', icon: Coins, permission: 'currencies.view' },
  { to: '/exchange-corridors', label: 'nav.exchange_corridors', icon: RefreshCw, permission: 'exchange-corridors.view' },
  { to: '/users', label: 'nav.users', icon: UserCog, permission: 'users.view' },
  { to: '/commission-rules', label: 'nav.commission_rules', icon: Percent, permission: 'commission-rules.view' },
  { to: '/profit-sharing-rules', label: 'nav.profit_sharing_rules', icon: Share2, permission: 'profit-sharing-rules.view' },
  { to: '/promoter-goals', label: 'nav.promoter_goals', icon: Target, permission: 'promoter-goals.view' },
  { to: '/promoter-commissions', label: 'nav.promoter_commissions', icon: BadgePercent, permission: 'promoter-commissions.view' },
  { to: '/bank-accounts', label: 'nav.bank_accounts', icon: Banknote, permission: 'bank-accounts.view' },
  { to: '/reports', label: 'nav.reports', icon: BarChart3, permission: 'dashboard.view' },
  { to: '/work-cycles', label: 'nav.work_cycles', icon: Calendar, permission: 'remittances.view' },
  { to: '/permissions', label: 'nav.permissions', icon: Shield, permission: 'permissions.manage' },
]

export default function Sidebar() {
  const { t, i18n } = useTranslation()
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const [collapsed, setCollapsed] = useState(false)

  const toggleLang = () => {
    const newLang = i18n.language === 'es' ? 'en' : 'es'
    i18n.changeLanguage(newLang)
    localStorage.setItem('lang', newLang)
  }

  const handleLogout = () => {
    dispatch(logoutThunk())
  }

  return (
    <aside className={`bg-slate-900 text-white flex flex-col transition-all duration-200 ${collapsed ? 'w-16' : 'w-64'}`}>
      <div className="p-4 border-b border-slate-700 flex items-center gap-2">
        {!collapsed && <span className="font-bold text-lg truncate">Remesas</span>}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1 hover:bg-slate-700 rounded ml-auto">
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {navItems
          .filter((item) => user?.permissions?.includes(item.permission))
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`
              }
            >
              <item.icon size={18} />
              {!collapsed && t(item.label)}
            </NavLink>
          ))}
      </nav>

      <div className="border-t border-slate-700 p-3 space-y-2">
        <button onClick={toggleLang} className="flex items-center gap-2 text-sm text-slate-300 hover:text-white w-full px-2 py-1.5">
          <Globe size={16} />
          {!collapsed && (i18n.language === 'es' ? 'English' : 'Español')}
        </button>
        {!collapsed && user && (
          <div className="px-2 text-xs text-slate-400 truncate">{user.name} ({user.role})</div>
        )}
        <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 w-full px-2 py-1.5">
          <LogOut size={16} />
          {!collapsed && t('auth.logout')}
        </button>
      </div>
    </aside>
  )
}
