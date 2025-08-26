'use client'

import { useState, useEffect } from 'react'

interface Associado {
  id: string
  codigoConsumidor: string
  nome: string
  email: string
  telefone?: string
  tipoMembro: 'MEMBRO' | 'NAO_MEMBRO'
  dataCadastro: string
}

export function useAuth() {
  const [associado, setAssociado] = useState<Associado | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const codigoConsumidor = localStorage.getItem('codigoConsumidor')
      
      if (!codigoConsumidor) {
        setLoading(false)
        return
      }

      const response = await fetch(`/api/associados?codigo=${codigoConsumidor}`)
      
      if (response.ok) {
        const data = await response.json()
        setAssociado(data.associado)
        setIsAuthenticated(true)
      } else {
        // Se a resposta não for ok, limpar o localStorage
        localStorage.removeItem('codigoConsumidor')
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error)
      localStorage.removeItem('codigoConsumidor')
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  const login = async (codigoConsumidor: string, senha: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ codigoConsumidor, senha }),
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('codigoConsumidor', codigoConsumidor)
        setAssociado(data.associado)
        setIsAuthenticated(true)
        return { success: true, associado: data.associado }
      } else {
        const error = await response.json()
        return { success: false, error: error.error }
      }
    } catch (error) {
      return { success: false, error: 'Erro de conexão' }
    }
  }

  const logout = () => {
    localStorage.removeItem('codigoConsumidor')
    setAssociado(null)
    setIsAuthenticated(false)
    window.location.href = '/'
  }

  return {
    associado,
    loading,
    isAuthenticated,
    login,
    logout,
    checkAuth
  }
}