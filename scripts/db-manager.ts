#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';
import { readDatabase, writeDatabase, Member, Credit, Transaction } from '../src/lib/db-binary';

const DB_PATH = path.join(process.cwd(), 'db.bin');

async function showHelp() {
  console.log(`
Gerenciador de Banco de Dados Binário PPD+

Uso: npm run db:manager <comando> [opções]

Comandos:
  show                    Mostra todos os dados do banco de dados
  show-members            Mostra apenas os membros
  show-credits            Mostra apenas os créditos
  show-transactions       Mostra apenas as transações
  add-member              Adiciona um novo membro
  add-credit              Adiciona um crédito para um membro
  add-transaction         Adiciona uma transação
  clear                   Limpa todo o banco de dados
  reset                   Reseta o banco de dados para estado vazio
  export <arquivo>        Exporta dados para um arquivo JSON
  import <arquivo>        Importa dados de um arquivo JSON

Exemplos:
  npm run db:manager show
  npm run db:manager add-member
  npm run db:manager export backup.json
  npm run db:manager import backup.json
`);
}

async function showData(type?: string) {
  try {
    const db = await readDatabase();
    
    switch (type) {
      case 'members':
        console.log(JSON.stringify(db.members, null, 2));
        break;
      case 'credits':
        console.log(JSON.stringify(db.credits, null, 2));
        break;
      case 'transactions':
        console.log(JSON.stringify(db.transactions, null, 2));
        break;
      default:
        console.log(JSON.stringify(db, null, 2));
    }
  } catch (error) {
    console.error('Erro ao ler dados:', error);
  }
}

async function addMember() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    console.log('\nAdicionar novo membro\n');
    
    const name = await question(rl, 'Nome completo: ');
    const email = await question(rl, 'Email: ');
    const password = await question(rl, 'Senha: ', true);
    const phone = await question(rl, 'Telefone (+244 XXX XXX XXX): ');
    const document = await question(rl, 'Código MEC (6 dígitos): ');
    const address = await question(rl, 'Endereço: ');
    const city = await question(rl, 'Cidade: ');
    const state = await question(rl, 'Província: ');
    const birthDate = await question(rl, 'Data de nascimento (YYYY-MM-DD): ');

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const { createMember } = require('../src/lib/db-binary');
    
    const newMember = await createMember({
      name,
      email,
      password: hashedPassword,
      phone: phone || undefined,
      document,
      address: address || undefined,
      city: city || undefined,
      state: state || undefined,
      birthDate: birthDate || undefined,
    });

    console.log('\n✅ Membro criado com sucesso!');
    console.log('Código de consumidor:', newMember.consumerCode);
    console.log('ID:', newMember.id);
    
  } catch (error) {
    console.error('Erro ao adicionar membro:', error);
  } finally {
    rl.close();
  }
}

async function addCredit() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    console.log('\nAdicionar crédito\n');
    
    const consumerCode = await question(rl, 'Código de consumidor: ');
    const amount = parseFloat(await question(rl, 'Valor do crédito: '));
    const type = await question(rl, 'Tipo (ACCUMULATED/BONUS/REFUND/ADJUSTMENT): ');
    const description = await question(rl, 'Descrição: ');

    const { findMemberByConsumerCode, createCredit } = require('../src/lib/db-binary');
    
    const member = await findMemberByConsumerCode(consumerCode.toUpperCase());
    if (!member) {
      console.log('❌ Membro não encontrado!');
      return;
    }

    const newCredit = await createCredit({
      memberId: member.id,
      amount,
      type: type as any,
      description: description || undefined,
      date: new Date().toISOString(),
      isActive: true,
    });

    console.log('\n✅ Crédito adicionado com sucesso!');
    console.log('ID do crédito:', newCredit.id);
    
  } catch (error) {
    console.error('Erro ao adicionar crédito:', error);
  } finally {
    rl.close();
  }
}

async function addTransaction() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    console.log('\nAdicionar transação\n');
    
    const consumerCode = await question(rl, 'Código de consumidor: ');
    const amount = parseFloat(await question(rl, 'Valor: '));
    const type = await question(rl, 'Tipo (CREDIT/DEBIT/TRANSFER/PAYMENT): ');
    const description = await question(rl, 'Descrição: ');
    const status = await question(rl, 'Status (PENDING/COMPLETED/CANCELLED/FAILED): ');

    const { findMemberByConsumerCode, createTransaction } = require('../src/lib/db-binary');
    
    const member = await findMemberByConsumerCode(consumerCode.toUpperCase());
    if (!member) {
      console.log('❌ Membro não encontrado!');
      return;
    }

    const newTransaction = await createTransaction({
      memberId: member.id,
      amount,
      type: type as any,
      description: description || undefined,
      status: status as any,
      date: new Date().toISOString(),
    });

    console.log('\n✅ Transação adicionada com sucesso!');
    console.log('ID da transação:', newTransaction.id);
    
  } catch (error) {
    console.error('Erro ao adicionar transação:', error);
  } finally {
    rl.close();
  }
}

async function clearDatabase() {
  try {
    const emptyDb = {
      members: [],
      credits: [],
      transactions: []
    };
    await writeDatabase(emptyDb);
    console.log('✅ Banco de dados limpo com sucesso!');
  } catch (error) {
    console.error('Erro ao limpar banco de dados:', error);
  }
}

async function exportData(filename: string) {
  try {
    const db = await readDatabase();
    await fs.writeFile(filename, JSON.stringify(db, null, 2));
    console.log(`✅ Dados exportados para ${filename}`);
  } catch (error) {
    console.error('Erro ao exportar dados:', error);
  }
}

async function importData(filename: string) {
  try {
    const data = await fs.readFile(filename, 'utf-8');
    const db = JSON.parse(data);
    await writeDatabase(db);
    console.log(`✅ Dados importados de ${filename}`);
  } catch (error) {
    console.error('Erro ao importar dados:', error);
  }
}

function question(rl: any, query: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    if (hidden) {
      const stdin = process.openStdin();
      process.stdin.on('data', (char) => {
        char = char + '';
        if (char === '\n' || char === '\r') {
          stdin.destroy();
          rl.write('\n');
          resolve('');
        } else {
          rl.write('*\b');
        }
      });
      rl.question(query, (answer: string) => {
        resolve(answer);
      });
    } else {
      rl.question(query, (answer: string) => {
        resolve(answer);
      });
    }
  });
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help') {
    showHelp();
    return;
  }

  switch (command) {
    case 'show':
      showData();
      break;
    case 'show-members':
      showData('members');
      break;
    case 'show-credits':
      showData('credits');
      break;
    case 'show-transactions':
      showData('transactions');
      break;
    case 'add-member':
      await addMember();
      break;
    case 'add-credit':
      await addCredit();
      break;
    case 'add-transaction':
      await addTransaction();
      break;
    case 'clear':
    case 'reset':
      await clearDatabase();
      break;
    case 'export':
      if (!args[1]) {
        console.error('❌ É necessário especificar um nome de arquivo para exportação');
        return;
      }
      await exportData(args[1]);
      break;
    case 'import':
      if (!args[1]) {
        console.error('❌ É necessário especificar um nome de arquivo para importação');
        return;
      }
      await importData(args[1]);
      break;
    default:
      console.log(`❌ Comando desconhecido: ${command}`);
      showHelp();
  }
}

main().catch(console.error);