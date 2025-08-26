# Banco de Dados Binário PPD+

## Visão Geral

Este projeto utiliza um sistema de banco de dados binário simples baseado em arquivo JSON, desenvolvido para evitar custos com bancos de dados tradicionais como o Prisma. O sistema armazena todos os dados em um único arquivo `db.bin` no formato JSON.

## Estrutura do Banco de Dados

O banco de dados é armazenado no arquivo `db.bin` e contém três principais coleções:

```json
{
  "members": [],
  "credits": [],
  "transactions": []
}
```

### 1. Members (Membros)
Armazena informações dos associados do PPD+:
- `id`: Identificador único
- `consumerCode`: Código de consumidor único (ex: PPDABC123XYZ)
- `name`: Nome completo
- `email`: Email único
- `password`: Senha hashada (bcrypt)
- `phone`: Telefone formatado (+244 XXX XXX XXX)
- `document`: Código MEC (6 dígitos)
- `address`: Endereço
- `city`: Cidade
- `state`: Província
- `birthDate`: Data de nascimento
- `isActive`: Status da conta
- `createdAt`: Data de criação
- `updatedAt`: Data de atualização

### 2. Credits (Créditos)
Armazena os créditos acumulados por cada membro:
- `id`: Identificador único
- `memberId`: ID do membro proprietário
- `amount`: Valor do crédito
- `type`: Tipo (ACCUMULATED, BONUS, REFUND, ADJUSTMENT)
- `description`: Descrição do crédito
- `date`: Data do crédito
- `isActive`: Status do crédito
- `createdAt`: Data de criação
- `updatedAt`: Data de atualização

### 3. Transactions (Transações)
Armazena as transações financeiras:
- `id`: Identificador único
- `memberId`: ID do membro
- `type`: Tipo (CREDIT, DEBIT, TRANSFER, PAYMENT)
- `amount`: Valor da transação
- `description`: Descrição
- `status`: Status (PENDING, COMPLETED, CANCELLED, FAILED)
- `date`: Data da transação
- `processedAt`: Data de processamento
- `createdAt`: Data de criação
- `updatedAt`: Data de atualização

## Funcionamento

### Inicialização Automática
O banco de dados é inicializado automaticamente na primeira utilização:
1. Verifica se o arquivo `db.bin` existe
2. Se não existir, cria um novo arquivo com estrutura vazia
3. Se existir, carrega os dados existentes

### Operações CRUD
O sistema implementa todas as operações necessárias:
- **Create**: Criar novos registros
- **Read**: Ler registros existentes
- **Update**: Atualizar registros
- **Delete**: Remover registros (lógico através do campo `isActive`)

### Segurança
- Senhas armazenadas com hash bcrypt (12 rounds)
- Validação de dados de entrada
- Proteção contra duplicatas (email, documento, consumerCode)

## API do Banco de Dados

O arquivo `/src/lib/db-binary.ts` exporta as seguintes funções:

### Funções para Members
```typescript
findMemberByEmail(email: string): Promise<Member | null>
findMemberByDocument(document: string): Promise<Member | null>
findMemberByConsumerCode(consumerCode: string): Promise<Member | null>
createMember(memberData: Omit<Member, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>): Promise<Member>
```

### Funções para Credits
```typescript
findCreditsByMemberId(memberId: string): Promise<Credit[]>
createCredit(creditData: Omit<Credit, 'id' | 'createdAt' | 'updatedAt'>): Promise<Credit>
```

### Funções para Transactions
```typescript
findTransactionsByMemberId(memberId: string): Promise<Transaction[]>
createTransaction(transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction>
```

### Funções Utilitárias
```typescript
readDatabase(): Promise<Database>
writeDatabase(db: Database): Promise<void>
getMemberBalance(memberId: string): Promise<number>
getMemberFullData(consumerCode: string): Promise<MemberFullData | null>
```

## Gerenciador de Banco de Dados

O projeto inclui um gerenciador de linha de comando para operações administrativas:

### Comandos Disponíveis

```bash
# Mostrar todos os dados
npm run db:manager show

# Mostrar apenas membros
npm run db:manager show-members

# Mostrar apenas créditos
npm run db:manager show-credits

# Mostrar apenas transações
npm run db:manager show-transactions

# Adicionar novo membro
npm run db:manager add-member

# Adicionar crédito
npm run db:manager add-credit

# Adicionar transação
npm run db:manager add-transaction

# Limpar banco de dados
npm run db:manager clear

# Exportar dados
npm run db:manager export backup.json

# Importar dados
npm run db:manager import backup.json

# Mostrar ajuda
npm run db:manager help
```

### Exemplos de Uso

```bash
# Ver todos os dados
npm run db:manager show

# Adicionar um novo membro interativamente
npm run db:manager add-member

# Fazer backup dos dados
npm run db:manager export backup-$(date +%Y%m%d).json

# Restaurar backup
npm run db:manager import backup.json
```

## Vantagens

### 💰 Custo-Benefício
- Zero custo com banco de dados
- Sem necessidade de serviços externos
- Ideal para projetos pequenos e médios

### 🚀 Performance
- Leitura/escrita rápida para volumes moderados
- Cache em memória durante a execução
- Sem latência de rede

### 🛡️ Segurança
- Dados armazenados localmente
- Senhas hashadas
- Validação de entrada

### 📦 Portabilidade
- Fácil backup (copiar arquivo db.bin)
- Portável entre ambientes
- Sem dependências complexas

## Limitações

### 📊 Escalabilidade
- Recomendado para até 10.000 registros
- Performance pode degradar com volumes muito grandes
- Sem recursos avançados de banco de dados

### 🔒 Concorrência
- Sem controle de concorrência nativo
- Possíveis race conditions em alta carga
- Recomendado para uso single-instance

### 💾 Persistência
- Risco de perda de dados se o arquivo for corrompido
- Necessidade de backup manual regular
- Sem transações ACID

## Boas Práticas

### Backup Regular
```bash
# Backup diário automatizado
npm run db:manager export backup-$(date +%Y%m%d).json
```

### Monitoramento
- Monitorar tamanho do arquivo db.bin
- Verificar permissões do arquivo
- Testar restauração de backup periodicamente

### Segurança
- Manter arquivo db.bin com permissões restritas
- Não incluir arquivo db.bin em repositórios Git
- Utilizar variáveis de ambiente para configurações

## Migração do Prisma

Se necessário migrar de volta para o Prisma:

1. Reinstalar dependências:
```bash
npm install prisma @prisma/client
```

2. Criar schema Prisma
3. Utilizar scripts de migração
4. Atualizar imports nos arquivos API

## Conclusão

O sistema de banco de dados binário oferece uma solução simples, econômica e eficiente para o PPD+, ideal para o contexto angolano e para projetos que precisam evitar custos com infraestrutura de banco de dados tradicional.