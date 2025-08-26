"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  PiggyBank, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  DollarSign,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  LogOut,
  User,
  Settings,
  Bell,
  HelpCircle,
  RefreshCw,
  Eye,
  Download
} from "lucide-react";

interface Member {
  id: string;
  consumerCode: string;
  name: string;
  email: string;
  phone?: string;
}

interface Credit {
  id: string;
  amount: number;
  type: string;
  description?: string;
  date: string;
  isActive: boolean;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description?: string;
  status: string;
  date: string;
  processedAt?: string;
}

interface AccountData {
  totalBalance: number;
  creditsCount: number;
  recentTransactions: Transaction[];
}

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [member, setMember] = useState<Member | null>(null);
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [credits, setCredits] = useState<Credit[]>([]);

  useEffect(() => {
    // Simular carregamento de dados do usuário
    // Em um sistema real, isso viria de uma API com autenticação
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setIsLoading(true);
    
    try {
      // Simulação de dados - em produção, buscar da API
      setTimeout(() => {
        const mockMember: Member = {
          id: "1",
          consumerCode: "PPDABC123XYZ",
          name: "João Silva",
          email: "joao.silva@email.com",
          phone: "+244 927 000 000"
        };

        const mockAccountData: AccountData = {
          totalBalance: 258050.50,
          creditsCount: 15,
          recentTransactions: [
            {
              id: "1",
              type: "CREDIT",
              amount: 50000.00,
              description: "Crédito mensal",
              status: "COMPLETED",
              date: "2024-01-15T10:30:00Z",
              processedAt: "2024-01-15T10:30:00Z"
            },
            {
              id: "2",
              type: "DEBIT",
              amount: 15000.00,
              description: "Pagamento de serviço",
              status: "COMPLETED",
              date: "2024-01-10T14:20:00Z",
              processedAt: "2024-01-10T14:20:00Z"
            },
            {
              id: "3",
              type: "CREDIT",
              amount: 20000.00,
              description: "Bônus de indicação",
              status: "COMPLETED",
              date: "2024-01-05T09:15:00Z",
              processedAt: "2024-01-05T09:15:00Z"
            },
            {
              id: "4",
              type: "PAYMENT",
              amount: 7550.50,
              description: "Pagamento pendente",
              status: "PENDING",
              date: "2024-01-20T16:45:00Z"
            }
          ]
        };

        const mockCredits: Credit[] = [
          {
            id: "1",
            amount: 50000.00,
            type: "ACCUMULATED",
            description: "Crédito mensal - Janeiro",
            date: "2024-01-15T10:30:00Z",
            isActive: true
          },
          {
            id: "2",
            amount: 20000.00,
            type: "BONUS",
            description: "Bônus de indicação",
            date: "2024-01-05T09:15:00Z",
            isActive: true
          },
          {
            id: "3",
            amount: 100000.00,
            type: "ACCUMULATED",
            description: "Crédito mensal - Dezembro",
            date: "2023-12-15T10:30:00Z",
            isActive: true
          },
          {
            id: "4",
            amount: 88050.50,
            type: "ACCUMULATED",
            description: "Crédito mensal - Novembro",
            date: "2023-11-15T10:30:00Z",
            isActive: true
          }
        ];

        setMember(mockMember);
        setAccountData(mockAccountData);
        setCredits(mockCredits);
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar seus dados. Tente novamente.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    toast({
      title: "Sessão encerrada",
      description: "Você foi desconectado com sucesso.",
    });
    router.push('/');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'CREDIT':
        return <ArrowUpRight className="h-4 w-4 text-emerald-400" />;
      case 'DEBIT':
        return <ArrowDownRight className="h-4 w-4 text-red-400" />;
      case 'PAYMENT':
        return <CreditCard className="h-4 w-4 text-blue-400" />;
      default:
        return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-emerald-400" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case 'CANCELLED':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'FAILED':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Concluído';
      case 'PENDING':
        return 'Pendente';
      case 'CANCELLED':
        return 'Cancelado';
      case 'FAILED':
        return 'Falhou';
      default:
        return status;
    }
  };

  const getCreditTypeText = (type: string) => {
    switch (type) {
      case 'ACCUMULATED':
        return 'Acumulado';
      case 'BONUS':
        return 'Bônus';
      case 'REFUND':
        return 'Reembolso';
      case 'ADJUSTMENT':
        return 'Ajuste';
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-emerald-400" />
          <p className="text-lg">Carregando seus dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-500 rounded-lg">
                <PiggyBank className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">PPD+</h1>
                <p className="text-xs text-slate-400">Projeto Poupança Disponível</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="font-semibold">{member?.name}</p>
                <p className="text-xs text-slate-400">{member?.consumerCode}</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon">
                  <Bell className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">Bem-vindo, {member?.name}!</h2>
            <p className="text-slate-300">Aqui você pode consultar seus créditos e transações</p>
          </div>

          {/* Balance Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Saldo Total</p>
                    <p className="text-3xl font-bold text-emerald-400">
                      {formatCurrency(accountData?.totalBalance || 0)}
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-500/20 rounded-lg">
                    <DollarSign className="h-6 w-6 text-emerald-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-emerald-400">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span>+12.5% este mês</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Total de Créditos</p>
                    <p className="text-3xl font-bold text-blue-400">
                      {accountData?.creditsCount || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-500/20 rounded-lg">
                    <CreditCard className="h-6 w-6 text-blue-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-blue-400">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span>+3 este mês</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Código de Consumidor</p>
                    <p className="text-xl font-bold text-cyan-400 font-mono">
                      {member?.consumerCode}
                    </p>
                  </div>
                  <div className="p-3 bg-cyan-500/20 rounded-lg">
                    <User className="h-6 w-6 text-cyan-400" />
                  </div>
                </div>
                <div className="mt-4">
                  <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                    Associado Ativo
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Information */}
          <Tabs defaultValue="credits" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="credits">Meus Créditos</TabsTrigger>
              <TabsTrigger value="transactions">Transações</TabsTrigger>
              <TabsTrigger value="extract">Extrato</TabsTrigger>
            </TabsList>

            <TabsContent value="credits" className="space-y-4">
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2 text-emerald-400" />
                    Créditos Acumulados
                  </CardTitle>
                  <CardDescription>
                    Todos os seus créditos disponíveis no sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {credits.map((credit) => (
                        <div key={credit.id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold">{getCreditTypeText(credit.type)}</h4>
                              {credit.isActive && (
                                <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                  Ativo
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-400">{credit.description}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              {formatDate(credit.date)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-emerald-400">
                              {formatCurrency(credit.amount)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transactions" className="space-y-4">
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-blue-400" />
                    Transações Recentes
                  </CardTitle>
                  <CardDescription>
                    Suas últimas transações no sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {accountData?.recentTransactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            {getTransactionIcon(transaction.type)}
                            <div>
                              <h4 className="font-semibold">{transaction.description}</h4>
                              <div className="flex items-center space-x-2 mt-1">
                                <div className="flex items-center space-x-1">
                                  {getStatusIcon(transaction.status)}
                                  <span className="text-xs text-slate-400">
                                    {getStatusText(transaction.status)}
                                  </span>
                                </div>
                                <span className="text-xs text-slate-500">
                                  • {formatDate(transaction.date)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${
                              transaction.type === 'CREDIT' ? 'text-emerald-400' : 
                              transaction.type === 'DEBIT' ? 'text-red-400' : 'text-blue-400'
                            }`}>
                              {transaction.type === 'CREDIT' ? '+' : 
                               transaction.type === 'DEBIT' ? '-' : ''}
                              {formatCurrency(transaction.amount)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="extract" className="space-y-4">
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-purple-400" />
                      Extrato Completo
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Baixar PDF
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Histórico completo de todas as operações
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert className="bg-slate-800 border-slate-600">
                    <AlertDescription className="text-slate-300">
                      O extrato completo mostra todas as suas operações de crédito, débito e pagamentos 
                      realizados no sistema PPD+. Você pode filtrar por período e tipo de operação.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="mt-6 text-center">
                    <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Extrato Detalhado
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}