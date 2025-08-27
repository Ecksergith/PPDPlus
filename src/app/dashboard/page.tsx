"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  Users, 
  LogOut, 
  Plus,
  Calendar,
  AlertCircle,
  CheckCircle,
  Download
} from "lucide-react"

interface Credit {
  id: string
  valor: number
  juros: number
  valorTotal: number
  status: string
  dataSolicitacao: string
  dataAprovacao?: string
  dataVencimento?: string
  descricao?: string
}

interface Payment {
  id: string
  valor: number
  dataPagamento: string
  status: string
  metodo?: string
  descricao?: string
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  const [credits, setCredits] = useState<Credit[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false)
  const [creditForm, setCreditForm] = useState({
    valor: '',
    descricao: ''
  })
  const [paymentForm, setPaymentForm] = useState({
    creditId: '',
    valor: '',
    metodo: 'transferencia',
    descricao: ''
  })

  const calcularJuros = (valor: number) => {
    if (!user) return 0
    const taxaJuros = user.isMembro ? 0.15 : 0.25
    return valor * taxaJuros
  }

  const handleCreditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          valor: Number(creditForm.valor),
          descricao: creditForm.descricao,
          userId: user?.id
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Solicitação enviada!",
          description: "Seu pedido de crédito foi enviado para análise",
        })
        
        // Reset form
        setCreditForm({ valor: '', descricao: '' })
        
        // Refresh credits list
        const newCredit = {
          id: data.credit.id,
          valor: data.credit.valor,
          juros: data.credit.juros,
          valorTotal: data.credit.valorTotal,
          status: data.credit.status,
          dataSolicitacao: data.credit.dataSolicitacao,
          dataVencimento: data.credit.dataVencimento,
          descricao: creditForm.descricao
        }
        setCredits([newCredit, ...credits])
      } else {
        toast({
          title: "Erro na solicitação",
          description: data.error || "Não foi possível enviar sua solicitação",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro na solicitação",
        description: "Ocorreu um erro ao tentar enviar sua solicitação",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingPayment(true)

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creditId: paymentForm.creditId,
          userId: user?.id,
          valor: Number(paymentForm.valor),
          metodo: paymentForm.metodo,
          descricao: paymentForm.descricao
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Pagamento registrado!",
          description: "Seu pagamento foi registrado e aguarda confirmação",
        })
        
        // Reset form
        setPaymentForm({
          creditId: '',
          valor: '',
          metodo: 'transferencia',
          descricao: ''
        })
        
        // Refresh payments list
        const newPayment = {
          id: data.payment.id,
          valor: data.payment.valor,
          dataPagamento: data.payment.dataPagamento,
          status: data.payment.status,
          metodo: data.payment.metodo,
          descricao: data.payment.descricao
        }
        setPayments([newPayment, ...payments])
      } else {
        toast({
          title: "Erro no pagamento",
          description: data.error || "Não foi possível registrar seu pagamento",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro no pagamento",
        description: "Ocorreu um erro ao tentar registrar seu pagamento",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingPayment(false)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch('/api/reports/credit-map', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `mapa-credito-${user?.codigoConsumidor}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast({
          title: "PDF gerado!",
          description: "Seu mapa de crédito foi baixado com sucesso",
        })
      } else {
        const data = await response.json()
        toast({
          title: "Erro ao gerar PDF",
          description: data.error || "Não foi possível gerar o PDF",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro ao gerar PDF",
        description: "Ocorreu um erro ao tentar gerar o PDF",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }
    
    // Mock data for now - in real app, fetch from API
    const mockCredits: Credit[] = [
      {
        id: "1",
        valor: 1000,
        juros: user.isMembro ? 150 : 250,
        valorTotal: user.isMembro ? 1150 : 1250,
        status: "aprovado",
        dataSolicitacao: "2024-01-15",
        dataAprovacao: "2024-01-16",
        dataVencimento: "2024-02-15",
        descricao: "Empréstimo para investimento"
      },
      {
        id: "2",
        valor: 500,
        juros: user.isMembro ? 75 : 125,
        valorTotal: user.isMembro ? 575 : 625,
        status: "pendente",
        dataSolicitacao: "2024-01-20",
        descricao: "Empréstimo pessoal"
      }
    ]

    const mockPayments: Payment[] = [
      {
        id: "1",
        valor: 200,
        dataPagamento: "2024-01-10",
        status: "confirmado",
        metodo: "transferencia",
        descricao: "Pagamento parcial"
      },
      {
        id: "2",
        valor: 150,
        dataPagamento: "2024-01-05",
        status: "confirmado",
        metodo: "dinheiro",
        descricao: "Pagamento mensal"
      }
    ]

    setCredits(mockCredits)
    setPayments(mockPayments)
    setIsLoading(false)
  }, [user, router])

  const handleLogout = () => {
    logout()
    toast({
      title: "Logout realizado",
      description: "Você saiu do sistema com sucesso",
    })
    router.push("/")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aprovado":
      case "confirmado":
        return "bg-green-500"
      case "pendente":
        return "bg-yellow-500"
      case "rejeitado":
      case "falhou":
        return "bg-red-500"
      case "pago":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "aprovado":
      case "confirmado":
      case "pago":
        return <CheckCircle className="h-4 w-4" />
      case "pendente":
        return <Calendar className="h-4 w-4" />
      case "rejeitado":
      case "falhou":
        return <AlertCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  const totalCredit = credits.reduce((sum, credit) => sum + credit.valor, 0)
  const totalPaid = payments.reduce((sum, payment) => sum + payment.valor, 0)
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
              <h1 className="text-xl font-bold text-white">PPD+ Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-white font-medium">{user?.nome}</p>
                <p className="text-blue-200 text-sm">
                  {user?.isMembro ? "Membro" : "Não-membro"} • {user?.codigoConsumidor}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
                className="text-blue-200 border-blue-400 hover:bg-blue-700"
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
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
                Total Crédito
              </CardTitle>
              <CreditCard className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                AOA {totalCredit.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-200">
                Total Pago
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                AOA {totalPaid.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-200">
                Pendentes
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {pendingCredits}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-200">
                Taxa de Juros
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {user?.isMembro ? "15%" : "25%"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="credits" className="space-y-6">
          <TabsList className="bg-blue-800/50 border-blue-700">
            <TabsTrigger value="credits" className="text-blue-200 data-[state=active]:bg-blue-700">
              Meus Créditos
            </TabsTrigger>
            <TabsTrigger value="payments" className="text-blue-200 data-[state=active]:bg-blue-700">
              Pagamentos
            </TabsTrigger>
            <TabsTrigger value="new-credit" className="text-blue-200 data-[state=active]:bg-blue-700">
              Novo Crédito
            </TabsTrigger>
          </TabsList>

          <TabsContent value="credits" className="space-y-4">
            <div className="grid gap-4">
              {credits.map((credit) => (
                <Card key={credit.id} className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white">
                          AOA {credit.valor.toLocaleString()}
                        </CardTitle>
                        <CardDescription className="text-blue-200">
                          {credit.descricao || "Sem descrição"}
                        </CardDescription>
                      </div>
                      <Badge className={`${getStatusColor(credit.status)} text-white`}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(credit.status)}
                          <span className="capitalize">{credit.status}</span>
                        </div>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-blue-200">Juros</p>
                        <p className="text-white font-medium">AOA {credit.juros.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-blue-200">Total</p>
                        <p className="text-white font-medium">AOA {credit.valorTotal.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-blue-200">Solicitado</p>
                        <p className="text-white font-medium">{new Date(credit.dataSolicitacao).toLocaleDateString()}</p>
                      </div>
                      {credit.dataVencimento && (
                        <div>
                          <p className="text-blue-200">Vencimento</p>
                          <p className="text-white font-medium">{new Date(credit.dataVencimento).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <div className="grid gap-4">
              {payments.map((payment) => (
                <Card key={payment.id} className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white">
                          AOA {payment.valor.toLocaleString()}
                        </CardTitle>
                        <CardDescription className="text-blue-200">
                          {payment.descricao || "Pagamento"}
                        </CardDescription>
                      </div>
                      <Badge className={`${getStatusColor(payment.status)} text-white`}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(payment.status)}
                          <span className="capitalize">{payment.status}</span>
                        </div>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-blue-200">Data</p>
                        <p className="text-white font-medium">{new Date(payment.dataPagamento).toLocaleDateString()}</p>
                      </div>
                      {payment.metodo && (
                        <div>
                          <p className="text-blue-200">Método</p>
                          <p className="text-white font-medium capitalize">{payment.metodo}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Payment Form */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Novo Pagamento</CardTitle>
                  <CardDescription className="text-blue-200">
                    Registre um novo pagamento para seus créditos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePaymentSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white font-medium">Crédito</Label>
                        <select
                          value={paymentForm.creditId}
                          onChange={(e) => setPaymentForm({...paymentForm, creditId: e.target.value})}
                          className="w-full bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:border-blue-400 focus:ring-blue-400 rounded-md p-2"
                          required
                        >
                          <option value="">Selecione um crédito</option>
                          {credits.filter(c => c.status === 'aprovado').map((credit) => (
                            <option key={credit.id} value={credit.id}>
                              Crédito #{credit.id} - AOA {credit.valor.toLocaleString()}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="valor" className="text-white font-medium">Valor (AOA)</Label>
                        <Input
                          id="valor"
                          type="number"
                          placeholder="Valor do pagamento"
                          value={paymentForm.valor}
                          onChange={(e) => setPaymentForm({...paymentForm, valor: e.target.value})}
                          className="bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:border-blue-400 focus:ring-blue-400"
                          min="100"
                          step="50"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white font-medium">Método de Pagamento</Label>
                        <select
                          value={paymentForm.metodo}
                          onChange={(e) => setPaymentForm({...paymentForm, metodo: e.target.value})}
                          className="w-full bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:border-blue-400 focus:ring-blue-400 rounded-md p-2"
                          required
                        >
                          <option value="transferencia">Transferência Bancária</option>
                          <option value="dinheiro">Dinheiro</option>
                          <option value="cheque">Cheque</option>
                          <option value="outro">Outro</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="descricao" className="text-white font-medium">Descrição</Label>
                        <Input
                          id="descricao"
                          type="text"
                          placeholder="Descrição do pagamento"
                          value={paymentForm.descricao}
                          onChange={(e) => setPaymentForm({...paymentForm, descricao: e.target.value})}
                          className="bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:border-blue-400 focus:ring-blue-400"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={isSubmittingPayment || !paymentForm.creditId || !paymentForm.valor}
                        className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                      >
                        {isSubmittingPayment ? "Registrando..." : "Registrar Pagamento"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="new-credit" className="space-y-4">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Solicitar Novo Crédito</CardTitle>
                <CardDescription className="text-blue-200">
                  Preencha o formulário para solicitar um novo crédito
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleCreditSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="valor" className="text-white font-medium">
                      Valor do Crédito (AOA)
                    </Label>
                    <Input
                      id="valor"
                      type="number"
                      placeholder="Digite o valor desejado"
                      value={creditForm.valor}
                      onChange={(e) => setCreditForm({...creditForm, valor: e.target.value})}
                      className="bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:border-blue-400 focus:ring-blue-400"
                      min="1000"
                      step="100"
                      required
                    />
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
                      className="w-full bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:border-blue-400 focus:ring-blue-400 rounded-md p-3 min-h-[100px] resize-none"
                    />
                  </div>

                  {/* Interest Rate Preview */}
                  {creditForm.valor && (
                    <Card className="bg-blue-800/30 border-blue-600">
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-blue-200">Valor Solicitado</p>
                            <p className="text-white font-medium">AOA {Number(creditForm.valor).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-blue-200">Taxa de Juros</p>
                            <p className="text-white font-medium">{user?.isMembro ? '15%' : '25%'}</p>
                          </div>
                          <div>
                            <p className="text-blue-200">Valor dos Juros</p>
                            <p className="text-white font-medium">
                              AOA {calcularJuros(Number(creditForm.valor)).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-blue-200">Total a Pagar</p>
                            <p className="text-white font-medium">
                              AOA {(Number(creditForm.valor) + calcularJuros(Number(creditForm.valor))).toLocaleString()}
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
                      className="text-blue-200 border-blue-400"
                      onClick={() => setCreditForm({valor: '', descricao: ''})}
                    >
                      Limpar
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || !creditForm.valor}
                      className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                    >
                      {isSubmitting ? "Enviando..." : "Solicitar Crédito"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}