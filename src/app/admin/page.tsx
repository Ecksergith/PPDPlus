"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  ShieldOff,
  Download,
  FileText,
  Calendar,
  Plus
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [creditForm, setCreditForm] = useState({
    userId: '',
    valor: '',
    descricao: ''
  })
  const [monthlyPayments, setMonthlyPayments] = useState<any[]>([])
  const [paymentForm, setPaymentForm] = useState({
    userId: '',
    valor: '',
    metodo: 'mensalidade',
    descricao: ''
  })

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

  const handleCreateCredit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...creditForm,
          valor: Number(creditForm.valor),
          adminId: user?.id
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Crédito criado com sucesso!",
          description: `Crédito de AOA ${Number(creditForm.valor).toLocaleString()} criado e aprovado`,
        })
        
        // Reset form
        setCreditForm({ userId: '', valor: '', descricao: '' })
        
        // Refresh credits list
        const newCredit = {
          id: data.credit.id,
          valor: data.credit.valor,
          juros: data.credit.juros,
          valorTotal: data.credit.valorTotal,
          status: data.credit.status,
          dataSolicitacao: data.credit.dataSolicitacao,
          dataVencimento: data.credit.dataVencimento,
          user: {
            nome: users.find(u => u.id === creditForm.userId)?.nome || 'N/A',
            codigoConsumidor: users.find(u => u.id === creditForm.userId)?.codigoConsumidor || 'N/A'
          }
        }
        setCredits([newCredit, ...credits])
      } else {
        toast({
          title: "Erro ao criar crédito",
          description: data.error || "Não foi possível criar o crédito",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro ao criar crédito",
        description: "Ocorreu um erro ao tentar criar o crédito",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreditApproval = async (creditId: string, approved: boolean) => {
    try {
      const response = await fetch('/api/credits/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creditId,
          approved,
          adminId: user?.id
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: `Crédito ${approved ? 'aprovado' : 'rejeitado'}!`,
          description: `O crédito foi ${approved ? 'aprovado' : 'rejeitado'} com sucesso`,
        })
        
        // Refresh credits list
        setCredits(credits.map(credit => 
          credit.id === creditId 
            ? { ...credit, status: approved ? 'aprovado' : 'rejeitado' }
            : credit
        ))
      } else {
        toast({
          title: "Erro ao processar crédito",
          description: data.error || "Não foi possível processar o crédito",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro ao processar crédito",
        description: "Ocorreu um erro ao tentar processar o crédito",
        variant: "destructive",
      })
    }
  }

  const handleDownloadCreditMap = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch(`/api/admin/credit-map?adminId=${user?.id}&format=${format}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `mapa_credito_ppd.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        
        toast({
          title: "Mapa de crédito baixado!",
          description: `O mapa de crédito foi baixado em formato ${format.toUpperCase()}`,
        })
      } else {
        const data = await response.json()
        toast({
          title: "Erro ao baixar mapa",
          description: data.error || "Não foi possível baixar o mapa de crédito",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro ao baixar mapa",
        description: "Ocorreu um erro ao tentar baixar o mapa de crédito",
        variant: "destructive",
      })
    }
  }

  const handleDownloadReport = async (type: string, format: 'json' | 'csv') => {
    try {
      const response = await fetch(`/api/admin/reports?adminId=${user?.id}&type=${type}&format=${format}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `relatorio_${type}_ppd.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        
        toast({
          title: "Relatório baixado!",
          description: `O relatório foi baixado em formato ${format.toUpperCase()}`,
        })
      } else {
        const data = await response.json()
        toast({
          title: "Erro ao baixar relatório",
          description: data.error || "Não foi possível baixar o relatório",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro ao baixar relatório",
        description: "Ocorreu um erro ao tentar baixar o relatório",
        variant: "destructive",
      })
    }
  }

  const handleMonthlyPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/payments/monthly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...paymentForm,
          valor: Number(paymentForm.valor),
          adminId: user?.id
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Pagamento registrado!",
          description: `Pagamento mensal de AOA ${Number(paymentForm.valor).toLocaleString()} registrado com sucesso`,
        })
        
        // Reset form
        setPaymentForm({ userId: '', valor: '', metodo: 'mensalidade', descricao: '' })
        
        // Refresh monthly payments
        loadMonthlyPayments()
      } else {
        toast({
          title: "Erro ao registrar pagamento",
          description: data.error || "Não foi possível registrar o pagamento",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro ao registrar pagamento",
        description: "Ocorreu um erro ao tentar registrar o pagamento",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const loadMonthlyPayments = async () => {
    try {
      const response = await fetch(`/api/payments/monthly?adminId=${user?.id}`)
      const data = await response.json()
      
      if (response.ok) {
        setMonthlyPayments(data.members)
      }
    } catch (error) {
      console.error('Error loading monthly payments:', error)
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
    loadMonthlyPayments()
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
          <TabsList className="bg-purple-800/50 border-purple-700">
            <TabsTrigger value="users" className="text-purple-200 data-[state=active]:bg-purple-700">
              Usuários
            </TabsTrigger>
            <TabsTrigger value="credits" className="text-purple-200 data-[state=active]:bg-purple-700">
              Créditos
            </TabsTrigger>
            <TabsTrigger value="create-credit" className="text-purple-200 data-[state=active]:bg-purple-700">
              Criar Crédito
            </TabsTrigger>
            <TabsTrigger value="credit-map" className="text-purple-200 data-[state=active]:bg-purple-700">
              Mapa de Crédito
            </TabsTrigger>
            <TabsTrigger value="reports" className="text-purple-200 data-[state=active]:bg-purple-700">
              Relatórios
            </TabsTrigger>
            <TabsTrigger value="monthly-payments" className="text-purple-200 data-[state=active]:bg-purple-700">
              Pagamentos Mensais
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-purple-200 data-[state=active]:bg-purple-700">
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

          <TabsContent value="create-credit" className="space-y-4">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Criar Novo Crédito</CardTitle>
                <CardDescription className="text-purple-200">
                  Crie e aprove créditos diretamente para os usuários
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateCredit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="userId" className="text-white font-medium">
                        Usuário
                      </Label>
                      <Select value={creditForm.userId} onValueChange={(value) => setCreditForm({...creditForm, userId: value})}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="Selecione um usuário" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.nome} ({user.codigoConsumidor})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="valor" className="text-white font-medium">
                        Valor do Crédito (AOA)
                      </Label>
                      <Input
                        id="valor"
                        type="number"
                        placeholder="Digite o valor"
                        value={creditForm.valor}
                        onChange={(e) => setCreditForm({...creditForm, valor: e.target.value})}
                        className="bg-white/10 border-white/20 text-white placeholder:text-purple-200 focus:border-purple-400 focus:ring-purple-400"
                        min="1000"
                        step="100"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descricao" className="text-white font-medium">
                      Descrição
                    </Label>
                    <textarea
                      id="descricao"
                      placeholder="Descreva o propósito do crédito"
                      value={creditForm.descricao}
                      onChange={(e) => setCreditForm({...creditForm, descricao: e.target.value})}
                      className="w-full bg-white/10 border-white/20 text-white placeholder:text-purple-200 focus:border-purple-400 focus:ring-purple-400 rounded-md p-3 min-h-[100px] resize-none"
                    />
                  </div>

                  {/* Interest Rate Preview */}
                  {creditForm.userId && creditForm.valor && (
                    <Card className="bg-purple-800/30 border-purple-600">
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-purple-200">Valor Solicitado</p>
                            <p className="text-white font-medium">AOA {Number(creditForm.valor).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-purple-200">Taxa de Juros</p>
                            <p className="text-white font-medium">
                              {users.find(u => u.id === creditForm.userId)?.isMembro ? '15%' : '25%'}
                            </p>
                          </div>
                          <div>
                            <p className="text-purple-200">Valor dos Juros</p>
                            <p className="text-white font-medium">
                              AOA {(Number(creditForm.valor) * (users.find(u => u.id === creditForm.userId)?.isMembro ? 0.15 : 0.25)).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-purple-200">Total a Pagar</p>
                            <p className="text-white font-medium">
                              AOA {(Number(creditForm.valor) + (Number(creditForm.valor) * (users.find(u => u.id === creditForm.userId)?.isMembro ? 0.15 : 0.25))).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="flex justify-end space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="text-purple-200 border-purple-400"
                      onClick={() => setCreditForm({ userId: '', valor: '', descricao: '' })}
                    >
                      Limpar
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || !creditForm.userId || !creditForm.valor}
                      className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
                    >
                      {isSubmitting ? "Criando..." : "Criar Crédito"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="credit-map" className="space-y-4">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Mapa de Crédito</CardTitle>
                <CardDescription className="text-purple-200">
                  Baixe o mapa completo de créditos do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-purple-800/30 border-purple-600">
                    <CardContent className="pt-6">
                      <div className="text-center space-y-4">
                        <Download className="h-12 w-12 text-purple-400 mx-auto" />
                        <div>
                          <h3 className="text-lg font-medium text-white">Formato JSON</h3>
                          <p className="text-purple-200 text-sm">
                            Dados estruturados para integração
                          </p>
                        </div>
                        <Button
                          onClick={() => handleDownloadCreditMap('json')}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          Baixar JSON
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-purple-800/30 border-purple-600">
                    <CardContent className="pt-6">
                      <div className="text-center space-y-4">
                        <FileText className="h-12 w-12 text-purple-400 mx-auto" />
                        <div>
                          <h3 className="text-lg font-medium text-white">Formato CSV</h3>
                          <p className="text-purple-200 text-sm">
                            Planilha para análise em Excel
                          </p>
                        </div>
                        <Button
                          onClick={() => handleDownloadCreditMap('csv')}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          Baixar CSV
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-purple-800/30 border-purple-600 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-2">Informações do Mapa</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-purple-200">Total Usuários</p>
                      <p className="text-white font-medium">{totalUsers}</p>
                    </div>
                    <div>
                      <p className="text-purple-200">Total Créditos</p>
                      <p className="text-white font-medium">{credits.length}</p>
                    </div>
                    <div>
                      <p className="text-purple-200">Valor Total</p>
                      <p className="text-white font-medium">AOA {credits.reduce((sum, c) => sum + c.valor, 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-purple-200">Saldo em Aberto</p>
                      <p className="text-white font-medium">AOA {credits.reduce((sum, c) => sum + c.valorTotal, 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Relatórios do Sistema</CardTitle>
                <CardDescription className="text-purple-200">
                  Gere relatórios detalhados do sistema PPD+
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-purple-800/30 border-purple-600">
                    <CardContent className="pt-6">
                      <div className="text-center space-y-4">
                        <TrendingUp className="h-8 w-8 text-purple-400 mx-auto" />
                        <div>
                          <h3 className="text-md font-medium text-white">Geral</h3>
                          <p className="text-purple-200 text-xs">
                            Visão geral do sistema
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Button
                            onClick={() => handleDownloadReport('general', 'json')}
                            size="sm"
                            variant="outline"
                            className="w-full text-purple-200 border-purple-400"
                          >
                            JSON
                          </Button>
                          <Button
                            onClick={() => handleDownloadReport('general', 'csv')}
                            size="sm"
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            CSV
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-purple-800/30 border-purple-600">
                    <CardContent className="pt-6">
                      <div className="text-center space-y-4">
                        <CreditCard className="h-8 w-8 text-purple-400 mx-auto" />
                        <div>
                          <h3 className="text-md font-medium text-white">Créditos</h3>
                          <p className="text-purple-200 text-xs">
                            Detalhe de todos os créditos
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Button
                            onClick={() => handleDownloadReport('credits', 'json')}
                            size="sm"
                            variant="outline"
                            className="w-full text-purple-200 border-purple-400"
                          >
                            JSON
                          </Button>
                          <Button
                            onClick={() => handleDownloadReport('credits', 'csv')}
                            size="sm"
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            CSV
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-purple-800/30 border-purple-600">
                    <CardContent className="pt-6">
                      <div className="text-center space-y-4">
                        <DollarSign className="h-8 w-8 text-purple-400 mx-auto" />
                        <div>
                          <h3 className="text-md font-medium text-white">Pagamentos</h3>
                          <p className="text-purple-200 text-xs">
                            Histórico de pagamentos
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Button
                            onClick={() => handleDownloadReport('payments', 'json')}
                            size="sm"
                            variant="outline"
                            className="w-full text-purple-200 border-purple-400"
                          >
                            JSON
                          </Button>
                          <Button
                            onClick={() => handleDownloadReport('payments', 'csv')}
                            size="sm"
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            CSV
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-purple-800/30 border-purple-600">
                    <CardContent className="pt-6">
                      <div className="text-center space-y-4">
                        <Users className="h-8 w-8 text-purple-400 mx-auto" />
                        <div>
                          <h3 className="text-md font-medium text-white">Usuários</h3>
                          <p className="text-purple-200 text-xs">
                            Lista de todos os usuários
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Button
                            onClick={() => handleDownloadReport('users', 'json')}
                            size="sm"
                            variant="outline"
                            className="w-full text-purple-200 border-purple-400"
                          >
                            JSON
                          </Button>
                          <Button
                            onClick={() => handleDownloadReport('users', 'csv')}
                            size="sm"
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            CSV
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-purple-800/30 border-purple-600 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-4">Resumo para Relatórios</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-purple-200">Total Usuários</p>
                      <p className="text-white font-medium">{totalUsers}</p>
                    </div>
                    <div>
                      <p className="text-purple-200">Membros</p>
                      <p className="text-white font-medium">{totalMembers}</p>
                    </div>
                    <div>
                      <p className="text-purple-200">Créditos Ativos</p>
                      <p className="text-white font-medium">{credits.filter(c => c.status === 'aprovado').length}</p>
                    </div>
                    <div>
                      <p className="text-purple-200">Valor Total</p>
                      <p className="text-white font-medium">AOA {credits.reduce((sum, c) => sum + c.valor, 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monthly-payments" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Registrar Pagamento Mensal</CardTitle>
                  <CardDescription className="text-purple-200">
                    Registre pagamentos mensais para membros
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleMonthlyPayment} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="paymentUserId" className="text-white font-medium">
                        Membro
                      </Label>
                      <Select value={paymentForm.userId} onValueChange={(value) => setPaymentForm({...paymentForm, userId: value})}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="Selecione um membro" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.filter(u => u.isMembro).map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.nome} ({user.codigoConsumidor})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="paymentValor" className="text-white font-medium">
                        Valor do Pagamento (AOA)
                      </Label>
                      <Input
                        id="paymentValor"
                        type="number"
                        placeholder="Digite o valor"
                        value={paymentForm.valor}
                        onChange={(e) => setPaymentForm({...paymentForm, valor: e.target.value})}
                        className="bg-white/10 border-white/20 text-white placeholder:text-purple-200 focus:border-purple-400 focus:ring-purple-400"
                        min="100"
                        step="50"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="paymentMetodo" className="text-white font-medium">
                        Método de Pagamento
                      </Label>
                      <Select value={paymentForm.metodo} onValueChange={(value) => setPaymentForm({...paymentForm, metodo: value})}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mensalidade">Mensalidade</SelectItem>
                          <SelectItem value="transferencia">Transferência</SelectItem>
                          <SelectItem value="dinheiro">Dinheiro</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="paymentDescricao" className="text-white font-medium">
                        Descrição
                      </Label>
                      <Input
                        id="paymentDescricao"
                        placeholder="Descrição do pagamento"
                        value={paymentForm.descricao}
                        onChange={(e) => setPaymentForm({...paymentForm, descricao: e.target.value})}
                        className="bg-white/10 border-white/20 text-white placeholder:text-purple-200 focus:border-purple-400 focus:ring-purple-400"
                      />
                    </div>

                    <div className="flex justify-end space-x-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="text-purple-200 border-purple-400"
                        onClick={() => setPaymentForm({ userId: '', valor: '', metodo: 'mensalidade', descricao: '' })}
                      >
                        Limpar
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting || !paymentForm.userId || !paymentForm.valor}
                        className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
                      >
                        {isSubmitting ? "Registrando..." : "Registrar Pagamento"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Pagamentos Mensais</CardTitle>
                  <CardDescription className="text-purple-200">
                    Status dos pagamentos mensais dos membros
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {monthlyPayments.length > 0 ? (
                      monthlyPayments.map((payment) => (
                        <div key={payment.userId} className="bg-purple-800/30 border-purple-600 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="text-white font-medium">{payment.nome}</p>
                              <p className="text-purple-200 text-sm">{payment.codigoConsumidor}</p>
                            </div>
                            <Badge className={payment.saldoDevedor > 0 ? "bg-red-500" : "bg-green-500"}>
                              {payment.saldoDevedor > 0 ? "Em débito" : "Quitado"}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-purple-200">Total Devido</p>
                              <p className="text-white font-medium">AOA {payment.totalDevido.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-purple-200">Total Pago</p>
                              <p className="text-white font-medium">AOA {payment.totalPago.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-purple-200">Saldo Devedor</p>
                              <p className="text-white font-medium">AOA {payment.saldoDevedor.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-purple-200">Pagamentos</p>
                              <p className="text-white font-medium">{payment.pagamentosMensais}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                        <p className="text-purple-200">Nenhum pagamento mensal registrado</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
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