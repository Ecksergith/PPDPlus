import fs from 'fs'
import path from 'path'

// Interfaces para os dados
export interface User {
  id: string
  codigoConsumidor: string
  nome: string
  email?: string
  senha: string
  isMembro: boolean
  isAdmin: boolean
  telefone?: string
  endereco?: string
  createdAt: string
  updatedAt: string
}

export interface Credit {
  id: string
  userId: string
  valor: number
  juros: number
  valorTotal: number
  status: string // pendente, aprovado, rejeitado, pago
  dataSolicitacao: string
  dataAprovacao?: string
  dataVencimento?: string
  descricao?: string
}

export interface Payment {
  id: string
  creditId: string
  userId: string
  valor: number
  dataPagamento: string
  status: string // pendente, confirmado, falhou
  metodo?: string // transferencia, dinheiro, etc.
  descricao?: string
}

export interface Solicitacao {
  id: string
  userId: string
  tipo: string // emprestimo, pagamento, etc.
  descricao: string
  status: string // pendente, aprovado, rejeitado
  dataSolicitacao: string
  dataResposta?: string
  resposta?: string
}

export interface AdminSettings {
  id: string
  chave: string
  valor: string
  descricao?: string
  updatedAt: string
}

export interface Database {
  users: User[]
  credits: Credit[]
  payments: Payment[]
  solicitacoes: Solicitacao[]
  adminSettings: AdminSettings[]
}

class BinaryDatabase {
  private dbPath: string
  private data: Database

  constructor() {
    this.dbPath = path.join(process.cwd(), 'db', 'db.bin')
    this.data = this.loadDatabase()
  }

  private loadDatabase(): Database {
    try {
      if (fs.existsSync(this.dbPath)) {
        const buffer = fs.readFileSync(this.dbPath)
        const jsonString = buffer.toString('utf-8')
        return JSON.parse(jsonString)
      } else {
        // Criar banco de dados inicial com admin padrão
        const initialData: Database = {
          users: [
            {
              id: 'admin-001',
              codigoConsumidor: 'ADMIN001',
              nome: 'Administrador PPD+',
              email: 'admin@ppdplus.ao',
              senha: this.hashPassword('admin123'),
              isMembro: true,
              isAdmin: true,
              telefone: '+244 900 000 000',
              endereco: 'Luanda, Angola',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ],
          credits: [],
          payments: [],
          solicitacoes: [],
          adminSettings: [
            {
              id: 'settings-001',
              chave: 'taxa_juros_membros',
              valor: '0.15',
              descricao: 'Taxa de juros para membros (15%)',
              updatedAt: new Date().toISOString()
            },
            {
              id: 'settings-002',
              chave: 'taxa_juros_nao_membros',
              valor: '0.25',
              descricao: 'Taxa de juros para não-membros (25%)',
              updatedAt: new Date().toISOString()
            },
            {
              id: 'settings-003',
              chave: 'limite_credito_membros',
              valor: '50000',
              descricao: 'Limite máximo de crédito para membros',
              updatedAt: new Date().toISOString()
            },
            {
              id: 'settings-004',
              chave: 'limite_credito_nao_membros',
              valor: '20000',
              descricao: 'Limite máximo de crédito para não-membros',
              updatedAt: new Date().toISOString()
            }
          ]
        }
        this.saveDatabase(initialData)
        return initialData
      }
    } catch (error) {
      console.error('Erro ao carregar banco de dados:', error)
      // Retornar estrutura vazia em caso de erro
      return {
        users: [],
        credits: [],
        payments: [],
        solicitacoes: [],
        adminSettings: []
      }
    }
  }

  private saveDatabase(data?: Database): void {
    try {
      const dataToSave = data || this.data
      const jsonString = JSON.stringify(dataToSave, null, 2)
      fs.writeFileSync(this.dbPath, jsonString, 'utf-8')
    } catch (error) {
      console.error('Erro ao salvar banco de dados:', error)
      throw error
    }
  }

  private hashPassword(password: string): string {
    // Hash simples para demonstração - em produção use bcrypt
    return Buffer.from(password + 'salt_ppd+').toString('base64')
  }

  private verifyPassword(password: string, hashedPassword: string): boolean {
    return this.hashPassword(password) === hashedPassword
  }

  // Métodos para Users
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const user: User = {
      ...userData,
      id: 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      senha: this.hashPassword(userData.senha),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    this.data.users.push(user)
    this.saveDatabase()
    return user
  }

  async findUserByCodigo(codigoConsumidor: string): Promise<User | null> {
    return this.data.users.find(user => user.codigoConsumidor === codigoConsumidor) || null
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.data.users.find(user => user.email === email) || null
  }

  async findUserById(id: string): Promise<User | null> {
    return this.data.users.find(user => user.id === id) || null
  }

  async getAllUsers(): Promise<User[]> {
    return this.data.users
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const userIndex = this.data.users.findIndex(user => user.id === id)
    if (userIndex === -1) return null

    this.data.users[userIndex] = {
      ...this.data.users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    }

    this.saveDatabase()
    return this.data.users[userIndex]
  }

  // Métodos para Credits
  async createCredit(creditData: Omit<Credit, 'id' | 'dataSolicitacao'>): Promise<Credit> {
    const credit: Credit = {
      ...creditData,
      id: 'credit-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      dataSolicitacao: new Date().toISOString()
    }

    this.data.credits.push(credit)
    this.saveDatabase()
    return credit
  }

  async getCreditsByUserId(userId: string): Promise<Credit[]> {
    return this.data.credits.filter(credit => credit.userId === userId)
  }

  async getCreditById(id: string): Promise<Credit | null> {
    return this.data.credits.find(credit => credit.id === id) || null
  }

  async getAllCredits(): Promise<Credit[]> {
    return this.data.credits
  }

  async updateCredit(id: string, updates: Partial<Credit>): Promise<Credit | null> {
    const creditIndex = this.data.credits.findIndex(credit => credit.id === id)
    if (creditIndex === -1) return null

    this.data.credits[creditIndex] = {
      ...this.data.credits[creditIndex],
      ...updates
    }

    this.saveDatabase()
    return this.data.credits[creditIndex]
  }

  // Métodos para Payments
  async createPayment(paymentData: Omit<Payment, 'id' | 'dataPagamento'>): Promise<Payment> {
    const payment: Payment = {
      ...paymentData,
      id: 'payment-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      dataPagamento: new Date().toISOString()
    }

    this.data.payments.push(payment)
    this.saveDatabase()
    return payment
  }

  async getPaymentsByUserId(userId: string): Promise<Payment[]> {
    return this.data.payments.filter(payment => payment.userId === userId)
  }

  async getPaymentsByCreditId(creditId: string): Promise<Payment[]> {
    return this.data.payments.filter(payment => payment.creditId === creditId)
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | null> {
    const paymentIndex = this.data.payments.findIndex(payment => payment.id === id)
    if (paymentIndex === -1) return null

    this.data.payments[paymentIndex] = {
      ...this.data.payments[paymentIndex],
      ...updates
    }

    this.saveDatabase()
    return this.data.payments[paymentIndex]
  }

  // Métodos para Solicitacoes
  async createSolicitacao(solicitacaoData: Omit<Solicitacao, 'id' | 'dataSolicitacao'>): Promise<Solicitacao> {
    const solicitacao: Solicitacao = {
      ...solicitacaoData,
      id: 'solicitacao-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      dataSolicitacao: new Date().toISOString()
    }

    this.data.solicitacoes.push(solicitacao)
    this.saveDatabase()
    return solicitacao
  }

  async getSolicitacoesByUserId(userId: string): Promise<Solicitacao[]> {
    return this.data.solicitacoes.filter(solicitacao => solicitacao.userId === userId)
  }

  // Métodos para AdminSettings
  async getSetting(chave: string): Promise<string | null> {
    const setting = this.data.adminSettings.find(s => s.chave === chave)
    return setting ? setting.valor : null
  }

  async updateSetting(chave: string, valor: string, descricao?: string): Promise<AdminSettings | null> {
    const settingIndex = this.data.adminSettings.findIndex(s => s.chave === chave)
    if (settingIndex === -1) return null

    this.data.adminSettings[settingIndex] = {
      ...this.data.adminSettings[settingIndex],
      valor,
      descricao: descricao || this.data.adminSettings[settingIndex].descricao,
      updatedAt: new Date().toISOString()
    }

    this.saveDatabase()
    return this.data.adminSettings[settingIndex]
  }

  async getAllSettings(): Promise<AdminSettings[]> {
    return this.data.adminSettings
  }

  // Método de autenticação
  async authenticateUser(codigoConsumidor: string, senha: string): Promise<User | null> {
    const user = await this.findUserByCodigo(codigoConsumidor)
    if (!user) return null

    if (this.verifyPassword(senha, user.senha)) {
      return user
    }

    return null
  }

  // Estatísticas
  async getStats() {
    return {
      totalUsers: this.data.users.length,
      totalMembers: this.data.users.filter(u => u.isMembro).length,
      totalAdmins: this.data.users.filter(u => u.isAdmin).length,
      totalCredits: this.data.credits.length,
      approvedCredits: this.data.credits.filter(c => c.status === 'aprovado').length,
      pendingCredits: this.data.credits.filter(c => c.status === 'pendente').length,
      rejectedCredits: this.data.credits.filter(c => c.status === 'rejeitado').length,
      totalCreditValue: this.data.credits.reduce((sum, credit) => sum + credit.valor, 0),
      totalPayments: this.data.payments.length,
      confirmedPayments: this.data.payments.filter(p => p.status === 'confirmado').length
    }
  }
}

// Exportar instância única do banco de dados
export const db = new BinaryDatabase()