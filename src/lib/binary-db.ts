import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'

// Interfaces dos dados
export interface Associado {
  id: string
  codigoConsumidor: string
  nome: string
  email: string
  senha: string
  telefone?: string
  cpf: string
  dataNascimento?: string
  endereco?: string
  cep?: string
  cidade?: string
  estado?: string
  tipoMembro: 'MEMBRO' | 'NAO_MEMBRO'
  dataCadastro: string
  updatedAt: string
  ativo: boolean
}

export interface Credito {
  id: string
  associadoId: string
  valor: number
  descricao?: string
  dataCredito: string
  tipoCredito: 'ACUMULADO' | 'BONUS' | 'REEMBOLSO' | 'OUTRO'
  validade?: string
  utilizado: boolean
  createdAt: string
  updatedAt: string
}

export interface Transacao {
  id: string
  associadoId: string
  creditoId?: string
  tipo: 'CREDITO' | 'DEBITO' | 'TRANSFERENCIA' | 'AJUSTE'
  valor: number
  descricao?: string
  dataTransacao: string
  referencia?: string
}

export interface MapaCredito {
  id: string
  associadoId: string
  titulo: string
  descricao?: string
  dataGeracao: string
  dataValidade?: string
  arquivoPdf?: string
  totalCreditos: number
  creditosDetalhes: string
}

export interface Database {
  associados: Associado[]
  creditos: Credito[]
  transacoes: Transacao[]
  mapasCredito: MapaCredito[]
}

// Classe para gerenciar o banco de dados binário
export class BinaryDatabase {
  private dbPath: string
  private data: Database

  constructor(dbPath: string = './data.bin') {
    this.dbPath = dbPath
    console.log('Inicializando BinaryDatabase...')
    console.log('Caminho do banco de dados:', this.dbPath)
    this.data = this.loadDatabase()
    console.log('Banco de dados carregado. Total de associados:', this.data.associados.length)
    this.ensureAdminUser()
    console.log('BinaryDatabase inicializado com sucesso!')
  }

  private loadDatabase(): Database {
    try {
      if (fs.existsSync(this.dbPath)) {
        const buffer = fs.readFileSync(this.dbPath)
        const jsonString = buffer.toString('utf-8')
        return JSON.parse(jsonString)
      }
    } catch (error) {
      console.error('Erro ao carregar banco de dados:', error)
    }

    // Retornar banco de dados vazio se não existir
    return {
      associados: [],
      creditos: [],
      transacoes: [],
      mapasCredito: []
    }
  }

  private saveDatabase(): void {
    try {
      const jsonString = JSON.stringify(this.data, null, 2)
      const buffer = Buffer.from(jsonString, 'utf-8')
      
      // Garantir que o diretório existe
      const dir = path.dirname(this.dbPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      
      fs.writeFileSync(this.dbPath, buffer)
    } catch (error) {
      console.error('Erro ao salvar banco de dados:', error)
    }
  }

  private ensureAdminUser(): void {
    // Verificar se já existe um usuário admin
    const adminExists = this.data.associados.some(a => 
      a.email === 'admin@poupa.com.br' || a.codigoConsumidor === 'ADMIN001'
    )

    console.log('Verificando usuário admin...')
    console.log('Total de associados:', this.data.associados.length)
    console.log('Admin existe?', adminExists)

    if (!adminExists) {
      // Criar usuário admin
      const adminPassword = bcrypt.hashSync('admin123', 10)
      const admin: Associado = {
        id: this.generateId(),
        codigoConsumidor: 'ADMIN001',
        nome: 'Administrador',
        email: 'admin@poupa.com.br',
        senha: adminPassword,
        cpf: '00000000000',
        tipoMembro: 'MEMBRO',
        dataCadastro: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ativo: true
      }

      this.data.associados.push(admin)
      this.saveDatabase()
      console.log('Usuário admin criado com sucesso!')
      console.log('Email: admin@poupa.com.br')
      console.log('Senha: admin123')
      console.log('Código: ADMIN001')
    } else {
      // Verificar se o admin existe e está ativo
      const admin = this.data.associados.find(a => 
        a.codigoConsumidor === 'ADMIN001' && a.ativo
      )
      if (admin) {
        console.log('Usuário admin encontrado:', admin.codigoConsumidor)
        console.log('Email:', admin.email)
        console.log('Ativo:', admin.ativo)
      } else {
        console.log('Usuário admin não encontrado ou inativo')
      }
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // Métodos para Associados
  async createAssociado(data: Omit<Associado, 'id' | 'dataCadastro' | 'updatedAt'>): Promise<Associado> {
    const associado: Associado = {
      ...data,
      id: this.generateId(),
      dataCadastro: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    this.data.associados.push(associado)
    this.saveDatabase()
    return associado
  }

  async findAssociadoByEmail(email: string): Promise<Associado | null> {
    return this.data.associados.find(a => a.email === email && a.ativo) || null
  }

  async findAssociadoByCodigo(codigoConsumidor: string): Promise<Associado | null> {
    return this.data.associados.find(a => a.codigoConsumidor === codigoConsumidor && a.ativo) || null
  }

  async findAssociadoByCpf(cpf: string): Promise<Associado | null> {
    return this.data.associados.find(a => a.cpf === cpf && a.ativo) || null
  }

  async getAllAssociados(): Promise<Associado[]> {
    return this.data.associados.filter(a => a.ativo)
  }

  // Métodos para Créditos
  async createCredito(data: Omit<Credito, 'id' | 'createdAt' | 'updatedAt'>): Promise<Credito> {
    const credito: Credito = {
      ...data,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    this.data.creditos.push(credito)
    this.saveDatabase()
    return credito
  }

  async getCreditosByAssociado(associadoId: string): Promise<Credito[]> {
    return this.data.creditos.filter(c => c.associadoId === associadoId)
  }

  // Métodos para Transações
  async createTransacao(data: Omit<Transacao, 'id' | 'dataTransacao'>): Promise<Transacao> {
    const transacao: Transacao = {
      ...data,
      id: this.generateId(),
      dataTransacao: new Date().toISOString()
    }

    this.data.transacoes.push(transacao)
    this.saveDatabase()
    return transacao
  }

  async getTransacoesByAssociado(associadoId: string): Promise<Transacao[]> {
    return this.data.transacoes.filter(t => t.associadoId === associadoId)
  }

  // Métodos para Mapas de Crédito
  async createMapaCredito(data: Omit<MapaCredito, 'id' | 'dataGeracao'>): Promise<MapaCredito> {
    const mapaCredito: MapaCredito = {
      ...data,
      id: this.generateId(),
      dataGeracao: new Date().toISOString()
    }

    this.data.mapasCredito.push(mapaCredito)
    this.saveDatabase()
    return mapaCredito
  }

  async getMapasCreditoByAssociado(associadoId: string): Promise<MapaCredito[]> {
    return this.data.mapasCredito.filter(m => m.associadoId === associadoId)
  }

  // Utilitários
  async resetDatabase(): Promise<void> {
    try {
      // Remover arquivo de dados existente
      if (fs.existsSync(this.dbPath)) {
        fs.unlinkSync(this.dbPath)
        console.log('Arquivo de banco de dados removido')
      }
      
      // Recarregar banco de dados vazio
      this.data = {
        associados: [],
        creditos: [],
        transacoes: [],
        mapasCredito: []
      }
      
      // Recriar usuário admin
      this.ensureAdminUser()
      
      console.log('Banco de dados resetado com sucesso!')
    } catch (error) {
      console.error('Erro ao resetar banco de dados:', error)
    }
  }

  async backup(): Promise<string> {
    const backupPath = `./backup_${Date.now()}.bin`
    const jsonString = JSON.stringify(this.data, null, 2)
    const buffer = Buffer.from(jsonString, 'utf-8')
    fs.writeFileSync(backupPath, buffer)
    return backupPath
  }

  async restore(backupPath: string): Promise<void> {
    if (fs.existsSync(backupPath)) {
      const buffer = fs.readFileSync(backupPath)
      const jsonString = buffer.toString('utf-8')
      this.data = JSON.parse(jsonString)
      this.saveDatabase()
    } else {
      throw new Error('Arquivo de backup não encontrado')
    }
  }

  getStats(): {
    totalAssociados: number
    totalCreditos: number
    totalTransacoes: number
    totalMapas: number
  } {
    return {
      totalAssociados: this.data.associados.filter(a => a.ativo).length,
      totalCreditos: this.data.creditos.length,
      totalTransacoes: this.data.transacoes.length,
      totalMapas: this.data.mapasCredito.length
    }
  }

  // Método para debug - listar todos os associados
  debugListAssociados(): void {
    console.log('=== LISTA DE ASSOCIADOS ===')
    this.data.associados.forEach((associado, index) => {
      console.log(`${index + 1}. Código: ${associado.codigoConsumidor}`)
      console.log(`   Nome: ${associado.nome}`)
      console.log(`   Email: ${associado.email}`)
      console.log(`   Ativo: ${associado.ativo}`)
      console.log('---')
    })
    console.log('==========================')
  }
}

// Instância global do banco de dados
let dbInstance: BinaryDatabase | null = null

export function getDatabase(): BinaryDatabase {
  if (!dbInstance) {
    dbInstance = new BinaryDatabase()
  }
  return dbInstance
}