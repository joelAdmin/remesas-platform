import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'
import type { User, LoginCredentials } from '../../types/auth'

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: false,
}

export const loginThunk = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials) => {
    const { data } = await api.post('/auth/login', credentials)
    localStorage.setItem('token', data.access_token)
    const meRes = await api.get('/auth/me')
    return { token: data.access_token as string, user: meRes.data.data as User }
  },
)

export const fetchMe = createAsyncThunk('auth/me', async () => {
  const { data } = await api.get('/auth/me')
  return data.data as User
})

export const logoutThunk = createAsyncThunk('auth/logout', async () => {
  try {
    await api.post('/auth/logout')
  } catch {
    // ignore 401 on logout
  }
  localStorage.removeItem('token')
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false
        state.token = action.payload.token
        state.user = action.payload.user
      })
      .addCase(loginThunk.rejected, (state) => {
        state.loading = false
      })
      .addCase(fetchMe.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
      })
      .addCase(fetchMe.rejected, (state) => {
        state.loading = false
        state.user = null
        state.token = null
        localStorage.removeItem('token')
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null
        state.token = null
      })
  },
})

export default authSlice.reducer
