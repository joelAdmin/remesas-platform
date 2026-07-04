export interface User {
  id: number
  name: string
  email: string
  role: string
  is_default_owner: boolean | null
  permissions: string[]
  created_at: string | null
  updated_at: string | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export interface RegisterData {
  name: string
  email: string
  password: string
}
