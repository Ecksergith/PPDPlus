'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'MEMBRO' | 'NAO_MEMBRO'
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, loading, associado } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/')
        return
      }

      // Se houver um papel requerido, verificar se o associado tem esse papel
      if (requiredRole && associado && associado.tipoMembro !== requiredRole) {
        router.push('/unauthorized')
        return
      }
    }
  }, [isAuthenticated, loading, associado, requiredRole, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // O useEffect vai redirecionar
  }

  if (requiredRole && associado && associado.tipoMembro !== requiredRole) {
    return null // O useEffect vai redirecionar
  }

  return <>{children}</>
}