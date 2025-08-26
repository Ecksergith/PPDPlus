'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PiggyBank, DollarSign, TrendingUp, FileText, LogOut, User, Settings } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useAuth } from '@/hooks/use-auth'

interface Associado {
  id: string
  codigoConsumidor: string
  nome: string
  email: string
  telefone?: string
  tipoMembro: 'MEMBRO' | 'NAO_MEMBRO'
  dataCadastro: string
}

interface Credito {
  id: string
  valor: number
  descricao?: string
  dataCredito: string
  tipoCredito: 'ACUMULADO' | 'BONUS' | 'REEMBOLSO' | 'OUTRO'
  validade?: string
  utilizado: boolean
}

function DashboardContent() {
  const [associado, setAssociado] = useState<Associado | null>(null)
  const [creditos, setCreditos] = useState<Credito[]>([])
  const [totalCreditos, setTotalCreditos] = useState(0)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { associado: authAssociado, logout } = useAuth()

  useEffect(() => {
    if (authAssociado) {
      setAssociado(authAssociado)
      carregarDadosAssociado(authAssociado.codigoConsumidor)
    }
  }, [authAssociado])

  const carregarDadosAssociado = async (codigoConsumidor: string) => {
    try {
      // Buscar créditos do associado
      const responseCreditos = await fetch(`/api/creditos?codigo=${codigoConsumidor}`)
      if (responseCreditos.ok) {
        const data = await responseCreditos.json()
        setCreditos(data.creditos)
        
        // Calcular total de créditos disponíveis
        const total = data.creditos
          .filter((credito: Credito) => !credito.utilizado)
          .reduce((sum: number, credito: Credito) => sum + credito.valor, 0)
        setTotalCreditos(total)
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar seus dados.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
  }

  const gerarMapaCredito = async () => {
    try {
      const response = await fetch('/api/mapa-credito/gerar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          codigoConsumidor: associado?.codigoConsumidor
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Sucesso",
          description: "Mapa de crédito gerado com sucesso!",
        })
        
        // Baixar o PDF
        if (data.arquivoPdf) {
          const link = document.createElement('a')
          link.href = data.arquivoPdf
          link.download = data.fileName
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível gerar o mapa de crédito.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar mapa de crédito.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg">
                <PiggyBank className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">PPD+</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            Bem-vindo, {associado?.nome}!
          </h2>
          <p className="text-gray-300">
            Projeto Poupança Disponível (PPD)
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">
                Total de Créditos
              </CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                R$ {totalCreditos.toFixed(2)}
              </div>
              <p className="text-xs text-gray-400">
                Créditos disponíveis para uso
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">
                Tipo de Membro
              </CardTitle>
              <User className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {associado?.tipoMembro === 'MEMBRO' ? 'Membro' : 'Não Membro'}
              </div>
              <Badge variant={associado?.tipoMembro === 'MEMBRO' ? 'default' : 'secondary'} className="mt-2">
                {associado?.tipoMembro === 'MEMBRO' ? 'Ativo' : 'Regular'}
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">
                Código de Consumidor
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {associado?.codigoConsumidor}
              </div>
              <p className="text-xs text-gray-400">
                Seu código único de acesso
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="creditos" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-700">
            <TabsTrigger value="creditos" className="text-white">Meus Créditos</TabsTrigger>
            <TabsTrigger value="mapa" className="text-white">Mapa de Crédito</TabsTrigger>
          </TabsList>
          
          <TabsContent value="creditos" className="space-y-4">
            <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Créditos Acumulados</CardTitle>
                <CardDescription className="text-gray-300">
                  Histórico de créditos disponíveis em sua conta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {creditos.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">
                      Nenhum crédito encontrado
                    </p>
                  ) : (
                    creditos.map((credito) => (
                      <div
                        key={credito.id}
                        className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-emerald-500/20 rounded-lg">
                            <DollarSign className="w-5 h-5 text-emerald-500" />
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              R$ {credito.valor.toFixed(2)}
                            </p>
                            <p className="text-gray-400 text-sm">
                              {credito.descricao || 'Crédito acumulado'}
                            </p>
                            <p className="text-gray-500 text-xs">
                              {new Date(credito.dataCredito).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={credito.utilizado ? 'secondary' : 'default'}
                            className={credito.utilizado ? 'bg-gray-600' : 'bg-emerald-600'}
                          >
                            {credito.utilizado ? 'Utilizado' : 'Disponível'}
                          </Badge>
                          {credito.validade && (
                            <p className="text-gray-400 text-xs mt-1">
                              Validade: {new Date(credito.validade).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="mapa" className="space-y-4">
            <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Mapa de Crédito</CardTitle>
                <CardDescription className="text-gray-300">
                  Gere um PDF completo com todos os seus créditos e datas de vencimento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-8">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">
                    Mapa de Crédito Detalhado
                  </h3>
                  <p className="text-gray-400 mb-6">
                    Gere um documento PDF completo com todos os seus créditos acumulados,
                    datas de vencimento e informações de membros e não membros.
                  </p>
                  <Button
                    onClick={gerarMapaCredito}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Gerar Mapa de Crédito
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}