export interface Country {
  id: number
  name: string
  currency_code: string
  currency_symbol: string
  phone_code: string
  flag_icon: string | null
  created_at: string | null
  updated_at: string | null
}

export interface Currency {
  id: number
  code: string
  name: string
  symbol: string
  decimals: number
  is_crypto: boolean
  created_at: string | null
  updated_at: string | null
}

export interface ExchangeCorridor {
  id: number
  origin_currency_id: number
  destination_currency_id: number
  name: string
  is_active: boolean
  tasa_formula: 'divide' | 'multiply'
  default_buy_rate: string
  default_sell_rate: string
  origin_currency?: Currency
  destination_currency?: Currency
  created_at: string | null
  updated_at: string | null
}

export interface ClientAccount {
  id: number
  client_id: number
  country_id: number | null
  currency_id: number | null
  account_holder: string
  bank_name: string | null
  account_number: string
  account_type: string
  is_active: boolean
  is_default: boolean
  created_at: string | null
  updated_at: string | null
}

export interface Client {
  id: number
  full_name: string
  document_number: string
  phone: string | null
  email: string | null
  country_id: number
  preferred_bank: string | null
  address: string | null
  is_active: boolean
  country?: Country
  created_at: string | null
  updated_at: string | null
}

export interface SourceAccount {
  id: number
  country_id: number | null
  currency_id: number | null
  account_holder: string
  bank_name: string | null
  account_number: string
  account_type: string
  is_active: boolean
  created_at: string | null
  updated_at: string | null
}

export interface Remittance {
  id: number
  client_id: number
  exchange_corridor_id: number
  client_account_id: number | null
  source_account_id: number | null
  ref_ve: string
  origin_amount: string
  buy_rate: string
  sell_rate: string
  origin_commission_percent: string
  origin_commission_fixed: string
  origin_commission_total: string
  origin_net_amount: string
  usdt_bought: string
  destination_commission_percent: string
  destination_commission_fixed: string
  destination_commission_total: string
  destination_gross_amount: string
  destination_net_amount: string
  usdt_to_sell: string
  profit_usdt: string
  total_profit_usd: string
  has_responsible_assignment: boolean
  total_assigned_percent: string
  status: string
  process_steps: string[] | null
  notes: string | null
  registered_at: string | null
  origin_receipt: string | null
  destination_receipt: string | null
  origin_receipt_url: string | null
  destination_receipt_url: string | null
  promoters?: RemittancePromoter[]
  client?: Client
  exchange_corridor?: ExchangeCorridor
  created_at: string | null
  updated_at: string | null
}

export interface CommissionRule {
  id: number
  exchange_corridor_id: number
  commission_type: string
  percent: string
  fixed_amount: string
  fixed_currency_id: number | null
  applies_to: string
  is_active: boolean
  exchange_corridor?: ExchangeCorridor
  fixed_currency?: Currency
  created_at: string | null
  updated_at: string | null
}

export interface ProfitSharingRule {
  id: number
  exchange_corridor_id: number
  partner_name: string
  percent: string
  bonus_fixed: string
  bonus_currency_id: number | null
  is_active: boolean
  exchange_corridor?: ExchangeCorridor
  bonus_currency?: Currency
  created_at: string | null
  updated_at: string | null
}

export interface PromoterGoal {
  id: number
  user_id: number
  year: number
  month: number
  goal_amount_usd: string
  achieved_amount_usd: string | null
  bonus_percent: string | null
  status: string | null
  user?: import('./auth').User
  created_at: string | null
  updated_at: string | null
}

export interface PromoterCommission {
  id: number
  promoter_goal_id: number
  commission_rate_override: string
  valid_from: string | null
  valid_until: string | null
  promoter_goal?: PromoterGoal
  created_at: string | null
  updated_at: string | null
}

export interface RemittancePromoter {
  id: number
  remittance_id: number
  user_id: number
  profit_percent: number
  user?: import('./auth').User
  created_at: string | null
  updated_at: string | null
}

export interface WorkCycle {
  id: number
  name: string
  start_date: string
  end_date: string | null
  status: 'open' | 'closed'
  total_remittances: number
  total_profit_usdt: number
  total_profit_usd: number
  notes: string | null
  created_by: number
  closed_by: number | null
  closed_at: string | null
  created_at: string | null
  updated_at: string | null
}

export interface Permission {
  id: number
  name: string
  label: string
  module: string
}

export interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}
