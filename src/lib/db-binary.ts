import fs from 'fs/promises';
import path from 'path';

// Interfaces para os dados
export interface Member {
  id: string;
  consumerCode: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  document: string; // Código MEC
  address?: string;
  city?: string;
  state?: string; // Província
  zipCode?: string;
  birthDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Credit {
  id: string;
  memberId: string;
  amount: number;
  type: 'ACCUMULATED' | 'BONUS' | 'REFUND' | 'ADJUSTMENT';
  description?: string;
  date: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  memberId: string;
  type: 'CREDIT' | 'DEBIT' | 'TRANSFER' | 'PAYMENT';
  amount: number;
  description?: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  date: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Database {
  members: Member[];
  credits: Credit[];
  transactions: Transaction[];
}

// Caminho do arquivo de banco de dados
const DB_PATH = path.join(process.cwd(), 'db.bin');

// Inicializar banco de dados vazio se não existir
async function initializeDatabase(): Promise<Database> {
  const emptyDb: Database = {
    members: [],
    credits: [],
    transactions: []
  };
  
  try {
    await fs.writeFile(DB_PATH, JSON.stringify(emptyDb));
    return emptyDb;
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
    throw error;
  }
}

// Ler banco de dados do arquivo
export async function readDatabase(): Promise<Database> {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // Se arquivo não existir, criar novo
    if ((error as any).code === 'ENOENT') {
      return await initializeDatabase();
    }
    console.error('Erro ao ler banco de dados:', error);
    throw error;
  }
}

// Escrever banco de dados no arquivo
export async function writeDatabase(db: Database): Promise<void> {
  try {
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
  } catch (error) {
    console.error('Erro ao escrever banco de dados:', error);
    throw error;
  }
}

// Funções para Members
export async function findMemberByEmail(email: string): Promise<Member | null> {
  const db = await readDatabase();
  return db.members.find(member => member.email === email) || null;
}

export async function findMemberByDocument(document: string): Promise<Member | null> {
  const db = await readDatabase();
  return db.members.find(member => member.document === document) || null;
}

export async function findMemberByConsumerCode(consumerCode: string): Promise<Member | null> {
  const db = await readDatabase();
  return db.members.find(member => 
    member.consumerCode === consumerCode.toUpperCase() && member.isActive
  ) || null;
}

export async function createMember(memberData: Omit<Member, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>): Promise<Member> {
  const db = await readDatabase();
  
  const newMember: Member = {
    ...memberData,
    id: generateId(),
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  db.members.push(newMember);
  await writeDatabase(db);
  
  return newMember;
}

// Funções para Credits
export async function findCreditsByMemberId(memberId: string): Promise<Credit[]> {
  const db = await readDatabase();
  return db.credits.filter(credit => credit.memberId === memberId && credit.isActive);
}

export async function createCredit(creditData: Omit<Credit, 'id' | 'createdAt' | 'updatedAt'>): Promise<Credit> {
  const db = await readDatabase();
  
  const newCredit: Credit = {
    ...creditData,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  db.credits.push(newCredit);
  await writeDatabase(db);
  
  return newCredit;
}

// Funções para Transactions
export async function findTransactionsByMemberId(memberId: string): Promise<Transaction[]> {
  const db = await readDatabase();
  return db.transactions
    .filter(transaction => transaction.memberId === memberId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function createTransaction(transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
  const db = await readDatabase();
  
  const newTransaction: Transaction = {
    ...transactionData,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  db.transactions.push(newTransaction);
  await writeDatabase(db);
  
  return newTransaction;
}

// Função utilitária para gerar IDs
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Função para calcular saldo total de um membro
export async function getMemberBalance(memberId: string): Promise<number> {
  const credits = await findCreditsByMemberId(memberId);
  return credits.reduce((sum, credit) => sum + credit.amount, 0);
}

// Função para obter dados completos do membro com saldo e transações
export async function getMemberFullData(consumerCode: string) {
  const member = await findMemberByConsumerCode(consumerCode);
  if (!member) {
    return null;
  }
  
  const [credits, transactions] = await Promise.all([
    findCreditsByMemberId(member.id),
    findTransactionsByMemberId(member.id)
  ]);
  
  const totalBalance = credits.reduce((sum, credit) => sum + credit.amount, 0);
  
  return {
    member: {
      id: member.id,
      consumerCode: member.consumerCode,
      name: member.name,
      email: member.email,
      phone: member.phone
    },
    account: {
      totalBalance,
      creditsCount: credits.length,
      recentTransactions: transactions.slice(0, 10)
    }
  };
}