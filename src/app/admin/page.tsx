"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { 
  Users, 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  Settings, 
  LogOut,
  CheckCircle,
  XCircle,
  Clock,
  UserPlus,
  UserCheck,
  UserX,
  Shield,
  ShieldOff
} from "lucide-react"

interface AdminUser {
  id: string
  codigoConsumidor: string
  nome: string
  email?: string
  isMembro: boolean
  isAdmin: boolean
  telefone?: string
  createdAt: string
}

interface AdminCredit {
  id: string
  valor: number
  juros: number
  valorTotal: number
  status: string
  dataSolicitacao: string
  dataVencimento?: string
  user: {
    nome: string
    codigoConsumidor: string
  }
}

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const { toast } = useToast()
  
  const [users, setUsers] = useState<AdminUser[]>([])
  const [credits, setCredits] = useState<AdminCredit[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const toggleUserStatus = async (userId: string, field: 'isMembro' | 'isAdmin', currentValue: boolean) => {
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          adminId: user?.id,
          [field]: !currentValue
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Update users list
        setUsers(users.map(u => 
          u.id === userId 
            ? { ...u, [field]: !currentValue }
            : u
        ))
        
        toast({
          title: "Usuário atualizado!",
          description: `Status ${field === 'isMembro' ? 'de membro' : 'administrativo'} atualizado com sucesso`,
        })
      } else {
        toast({
          title: "Erro ao atualizar usuário",
          description: data.error || "Não foi possível atualizar o usuário",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro ao atualizar usuário",
        description: "Ocorreu um erro ao tentar atualizar o usuário",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    // Check admin session
    const savedAdminUser = localStorage.getItem('ppd_admin_user')
    if (!savedAdminUser) {
      toast({
        title: "Acesso negado",
        description: "Você precisa fazer login como administrador",
        variant: "destructive",
      })
      router.push("/admin-login")
      return
    }

    try {
      const adminUser = JSON.parse(savedAdminUser)
      if (!adminUser.isAdmin) {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para acessar esta área",
          variant: "destructive",
        })
        router.push("/")
        return
      }
      setUser(adminUser)
    } catch (error) {
      localStorage.removeItem('ppd_admin_user')
      router.push("/admin-login")
      return
    }
    
    // Mock data for now - in real app, fetch from API
    const mockUsers: AdminUser[] = [
      {
        id: "1",
        codigoConsumidor: "CONS001",
        nome: "João Silva",
        email: "joao@email.com",
        isMembro: true,
        isAdmin: false,
        telefone: "+244 900 000 000",
        createdAt: "2024-01-01"
      },
      {
        id: "2",
        codigoConsumidor: "CONS002",
        nome: "Maria Santos",
        email: "maria@email.com",
        isMembro: false,
        isAdmin: false,
        telefone: "+244 900 000 001",
        createdAt: "2024-01-05"
      },
      {
        id: "3",
        codigoConsumidor: "CONS003",
        nome: "Pedro Costa",
        email: "pedro@email.com",
        isMembro: true,
        isAdmin: true,
        telefone: "+244 900 000 002",
        createdAt: "2024-01-10"
      }
    ]

    const mockCredits: AdminCredit[] = [
      {
        id: "1",
        valor: 1000,
        juros: 150,
        valorTotal: 1150,
        status: "aprovado",
        dataSolicitacao: "2024-01-15",
        dataVencimento: "2024-02-15",
        user: {
          nome: "João Silva",
          codigoConsumidor: "CONS001"
        }
      },
      {
        id: "2",
        valor: 500,
        juros: 125,
        valorTotal: 625,
        status: "pendente",
        dataSolicitacao: "2024-01-20",
        user: {
          nome: "Maria Santos",
          codigoConsumidor: "CONS002"
        }
      },
      {
        id: "3",
        valor: 2000,
        juros: 300,
        valorTotal: 2300,
        status: "rejeitado",
        dataSolicitacao: "2024-01-18",
        user: {
          nome: "Pedro Costa",
          codigoConsumidor: "CONS003"
        }
      }
    ]

    setUsers(mockUsers)
    setCredits(mockCredits)
    setIsLoading(false)
  }, [user, router, toast])

  const handleLogout = () => {
    localStorage.removeItem('ppd_admin_user')
    toast({
      title: "Logout realizado",
      description: "Você saiu do painel de administração",
    })
    router.push("/admin-login")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aprovado":
        return "bg-green-500"
      case "pendente":
        return "bg-yellow-500"
      case "rejeitado":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "aprovado":
        return <CheckCircle className="h-4 w-4" />
      case "pendente":
        return <Clock className="h-4 w-4" />
      case "rejeitado":
        return <XCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  const totalUsers = users.length
  const totalMembers = users.filter(u => u.isMembro).length
  const totalCredits = credits.reduce((sum, credit) => sum + credit.valor, 0)
  const pendingCredits = credits.filter(c => c.status === "pendente").length

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
      {/* Header */}
      <header className="bg-blue-800/50 backdrop-blur-sm border-b border-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <img src="/ppd-logo.png" alt="PPD+ Logo" className="h-8 w-8" />
              <div>
                <h1 className="text-xl font-bold text-white">PPD+ Admin</h1>
                <p className="text-blue-200 text-sm">Painel de Administração</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-white font-medium">{user?.nome}</p>
                <p className="text-blue-200 text-sm">Administrador</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-blue-200 border-blue-400 hover:bg-blue-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-200">
                Total Usuários
              </CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalUsers}</div>
              <p className="text-xs text-blue-200">
                {totalMembers} membros
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-200">
                Total Créditos
              </CardTitle>
              <CreditCard className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                AOA {totalCredits.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-200">
                Pendentes
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{pendingCredits}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-200">
                Taxa Média
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">18%</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-blue-800/50 border-blue-700">
            <TabsTrigger value="users" className="text-blue-200 data-[state=active]:bg-blue-700">
              Usuários
            </TabsTrigger>
            <TabsTrigger value="credits" className="text-blue-200 data-[state=active]:bg-blue-700">
              Créditos
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-blue-200 data-[state=active]:bg-blue-700">
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Gerenciamento de Usuários</CardTitle>
                <CardDescription className="text-blue-200">
                  Visualize e gerencie todos os usuários do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-blue-200">Código</TableHead>
                      <TableHead className="text-blue-200">Nome</TableHead>
                      <TableHead className="text-blue-200">Email</TableHead>
                      <TableHead className="text-blue-200">Telefone</TableHead>
                      <TableHead className="text-blue-200">Status</TableHead>
                      <TableHead className="text-blue-200">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="text-white font-medium">{user.codigoConsumidor}</TableCell>
                        <TableCell className="text-white">{user.nome}</TableCell>
                        <TableCell className="text-blue-200">{user.email || "-"}</TableCell>
                        <TableCell className="text-blue-200">{user.telefone || "-"}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Badge className={user.isMembro ? "bg-green-500" : "bg-gray-500"}>
                              {user.isMembro ? "Membro" : "Não-membro"}
                            </Badge>
                            {user.isAdmin && (
                              <Badge className="bg-purple-500">Admin</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => toggleUserStatus(user.id, 'isMembro', user.isMembro)}
                              className={user.isMembro ? "text-green-400 border-green-400 hover:bg-green-700" : "text-gray-400 border-gray-400 hover:bg-gray-700"}
                              title={user.isMembro ? "Remover status de membro" : "Conceder status de membro"}
                            >
                              {user.isMembro ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => toggleUserStatus(user.id, 'isAdmin', user.isAdmin)}
                              className={user.isAdmin ? "text-purple-400 border-purple-400 hover:bg-purple-700" : "text-gray-400 border-gray-400 hover:bg-gray-700"}
                              title={user.isAdmin ? "Remover status de administrador" : "Conceder status de administrador"}
                            >
                              {user.isAdmin ? <Shield className="h-3 w-3" /> : <ShieldOff className="h-3 w-3" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="credits" className="space-y-4">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Gerenciamento de Créditos</CardTitle>
                <CardDescription className="text-blue-200">
                  Visualize e gerencie todas as solicitações de crédito
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-blue-200">ID</TableHead>
                      <TableHead className="text-blue-200">Usuário</TableHead>
                      <TableHead className="text-blue-200">Valor</TableHead>
                      <TableHead className="text-blue-200">Juros</TableHead>
                      <TableHead className="text-blue-200">Total</TableHead>
                      <TableHead className="text-blue-200">Status</TableHead>
                      <TableHead className="text-blue-200">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {credits.map((credit) => (
                      <TableRow key={credit.id}>
                        <TableCell className="text-white font-medium">{credit.id}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-white">{credit.user.nome}</p>
                            <p className="text-blue-200 text-sm">{credit.user.codigoConsumidor}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-white">AOA {credit.valor.toLocaleString()}</TableCell>
                        <TableCell className="text-white">AOA {credit.juros.toLocaleString()}</TableCell>
                        <TableCell className="text-white font-medium">AOA {credit.valorTotal.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(credit.status)} text-white`}>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(credit.status)}
                              <span className="capitalize">{credit.status}</span>
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {credit.status === "pendente" && (
                              <>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                  Aprovar
                                </Button>
                                <Button size="sm" variant="outline" className="text-red-400 border-red-400">
                                  Rejeitar
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Configurações do Sistema</CardTitle>
                <CardDescription className="text-blue-200">
                  Gerencie as configurações do sistema PPD+
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white">Taxas de Juros</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-blue-800/30 rounded-lg">
                        <div>
                          <p className="text-white font-medium">Membros</p>
                          <p className="text-blue-200 text-sm">Taxa de juros para membros</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">15%</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-800/30 rounded-lg">
                        <div>
                          <p className="text-white font-medium">Não-membros</p>
                          <p className="text-blue-200 text-sm">Taxa de juros para não-membros</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">25%</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white">Limites de Crédito</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-blue-800/30 rounded-lg">
                        <div>
                          <p className="text-white font-medium">Membros</p>
                          <p className="text-blue-200 text-sm">Limite máximo de crédito</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">AOA 50.000</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-800/30 rounded-lg">
                        <div>
                          <p className="text-white font-medium">Não-membros</p>
                          <p className="text-blue-200 text-sm">Limite máximo de crédito</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">AOA 20.000</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button variant="outline" className="text-blue-200 border-blue-400">
                    Cancelar
                  </Button>
                  <Button className="bg-green-600 hover:bg-green-700">
                    Salvar Configurações
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