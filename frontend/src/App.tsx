import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from './store/hooks'
import { fetchMe } from './store/slices/authSlice'
import Layout from './components/layout/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import CountryListPage from './pages/countries/CountryListPage'
import CountryFormPage from './pages/countries/CountryFormPage'
import CurrencyListPage from './pages/currencies/CurrencyListPage'
import ExchangeCorridorListPage from './pages/exchange-corridors/ExchangeCorridorListPage'
import ClientListPage from './pages/clients/ClientListPage'
import ClientFormPage from './pages/clients/ClientFormPage'
import RemittanceListPage from './pages/remittances/RemittanceListPage'
import RemittanceFormPage from './pages/remittances/RemittanceFormPage'
import UserListPage from './pages/users/UserListPage'
import CommissionRuleListPage from './pages/commission-rules/CommissionRuleListPage'
import ProfitSharingRuleListPage from './pages/profit-sharing-rules/ProfitSharingRuleListPage'
import PromoterGoalListPage from './pages/promoter-goals/PromoterGoalListPage'
import PromoterCommissionListPage from './pages/promoter-commissions/PromoterCommissionListPage'
import BankAccountListPage from './pages/bank-accounts/BankAccountListPage'
import PermissionListPage from './pages/permissions/PermissionListPage'
import WorkCycleListPage from './pages/work-cycles/WorkCycleListPage'
import ReportsPage from './pages/reports/ReportsPage'

function App() {
  const dispatch = useAppDispatch()
  const token = useAppSelector((s) => s.auth.token)

  useEffect(() => {
    if (token) dispatch(fetchMe())
  }, [])

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/countries" element={<CountryListPage />} />
        <Route path="/countries/new" element={<CountryFormPage />} />
        <Route path="/countries/:id/edit" element={<CountryFormPage />} />
        <Route path="/currencies" element={<CurrencyListPage />} />
        <Route path="/exchange-corridors" element={<ExchangeCorridorListPage />} />
        <Route path="/clients" element={<ClientListPage />} />
        <Route path="/clients/new" element={<ClientFormPage />} />
        <Route path="/clients/:id/edit" element={<ClientFormPage />} />
        <Route path="/remittances" element={<RemittanceListPage />} />
        <Route path="/remittances/new" element={<RemittanceFormPage />} />
        <Route path="/remittances/:id/edit" element={<RemittanceFormPage />} />
        <Route path="/users" element={<UserListPage />} />
        <Route path="/commission-rules" element={<CommissionRuleListPage />} />
        <Route path="/profit-sharing-rules" element={<ProfitSharingRuleListPage />} />
        <Route path="/promoter-goals" element={<PromoterGoalListPage />} />
        <Route path="/promoter-commissions" element={<PromoterCommissionListPage />} />
        <Route path="/bank-accounts" element={<BankAccountListPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/work-cycles" element={<WorkCycleListPage />} />
        <Route path="/permissions" element={<PermissionListPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
