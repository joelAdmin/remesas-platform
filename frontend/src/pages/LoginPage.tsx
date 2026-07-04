import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { loginThunk } from '../store/slices/authSlice'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import type { LoginCredentials } from '../types/auth'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { FormField } from '../components/ui/FormField'
import { handleFormErrors } from '../lib/formUtils'
import { toast } from 'sonner'
import { ArrowRight, Globe } from 'lucide-react'

const currencySymbols = ['$', '€', '£', '¥', '₿', '₽', '₹', '₩', '₫', '₴', '₪', '₦']

export default function LoginPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const token = useAppSelector((s) => s.auth.token)
  const navigate = useNavigate()
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<LoginCredentials>({
    defaultValues: {
      email: 'owner@sistemaremesas.com',
      password: 'password',
    },
  })

  useEffect(() => {
    if (token) navigate('/dashboard', { replace: true })
  }, [token, navigate])

  const onSubmit = async (data: LoginCredentials) => {
    try {
      await dispatch(loginThunk(data)).unwrap()
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      if (!handleFormErrors(err, setError)) {
        toast.error(err.response?.data?.error || 'Error al iniciar sesión')
      }
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left - Brand Panel */}
      <div className="relative hidden lg:flex flex-col items-center justify-center bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 p-12 overflow-hidden">
        {/* Floating orbs */}
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 -right-10 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse [animation-delay:2s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse [animation-delay:4s]" />

        {/* Currency symbols grid */}
        <div className="absolute inset-0 opacity-[0.04] text-white select-none pointer-events-none">
          <div className="grid grid-cols-6 gap-12 p-12 text-4xl font-bold">
            {Array.from({ length: 30 }).map((_, i) => (
              <span key={i}>{currencySymbols[i % currencySymbols.length]}</span>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 mb-8">
            <Globe className="w-10 h-10 text-blue-200" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            Remesas
          </h1>
          <p className="text-xl text-blue-100/80 font-medium mb-2">
            Casa de Cambio
          </p>
          <p className="text-sm text-blue-200/60 max-w-xs mx-auto leading-relaxed">
            Sistema integral de gestión de remesas internacionales, corredores de cambio y comisiones
          </p>

          {/* Decorative line */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-blue-400/50" />
            <div className="w-2 h-2 rounded-full bg-blue-400/50" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-blue-400/50" />
          </div>
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="flex items-center justify-center bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 p-8">
        <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          {/* Mobile-only brand header */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 mb-4">
              <Globe className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Remesas</h1>
            <p className="text-sm text-muted-foreground">Casa de Cambio</p>
          </div>

          <Card className="border-0 shadow-lg dark:shadow-2xl dark:shadow-black/20 bg-white dark:bg-gray-900">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">{t('auth.login_title')}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{t('auth.login_subtitle')}</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <FormField label={t('auth.email')} error={errors.email?.message} required>
                  <Input type="email" {...register('email', { required: 'Required' })} aria-invalid={!!errors.email} autoFocus className="h-11" />
                </FormField>

                <FormField label={t('auth.password')} error={errors.password?.message} required>
                  <Input type="password" {...register('password', { required: 'Required' })} aria-invalid={!!errors.password} className="h-11" />
                </FormField>

                <Button type="submit" disabled={isSubmitting} className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all">
                  {isSubmitting ? t('common.loading') : t('auth.login')}
                  {!isSubmitting && <ArrowRight className="w-4 h-4 ml-1" />}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-6">
            &copy; {new Date().getFullYear()} Remesas Casa de Cambio. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  )
}
