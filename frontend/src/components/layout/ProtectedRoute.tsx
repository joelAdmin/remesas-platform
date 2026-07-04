import { Navigate } from 'react-router-dom'
import { useAppSelector } from '../../store/hooks'

interface Props {
  roles?: string[]
  children: React.ReactNode
}

export default function ProtectedRoute({ roles, children }: Props) {
  const token = useAppSelector((s) => s.auth.token)
  const user = useAppSelector((s) => s.auth.user)

  if (!token) return <Navigate to="/login" replace />
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />

  return <>{children}</>
}
