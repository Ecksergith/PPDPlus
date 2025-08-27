import { getDatabase } from './binary-db'

// Função para inicializar o banco de dados com dados de teste
export async function initializeTestData() {
  const db = getDatabase()
  
  try {
    // Criar alguns associados de teste
    const associado1 = await db.createAssociado({
      codigoConsumidor: 'TESTE001',
      nome: 'João Silva',
      email: 'joao.silva@email.com',
      senha: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // senha: password
      telefone: '(11) 99999-8888',
      cpf: '12345678901',
      dataNascimento: '1990-01-15',
      endereco: 'Rua Teste, 123',
      cep: '01234-567',
      cidade: 'São Paulo',
      estado: 'SP',
      tipoMembro: 'MEMBRO',
      ativo: true
    })

    const associado2 = await db.createAssociado({
      codigoConsumidor: 'TESTE002',
      nome: 'Maria Santos',
      email: 'maria.santos@email.com',
      senha: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // senha: password
      telefone: '(11) 98888-7777',
      cpf: '98765432109',
      dataNascimento: '1985-05-20',
      endereco: 'Av. Exemplo, 456',
      cep: '04567-890',
      cidade: 'São Paulo',
      estado: 'SP',
      tipoMembro: 'NAO_MEMBRO',
      ativo: true
    })

    // Criar alguns créditos de teste
    await db.createCredito({
      associadoId: associado1.id,
      valor: 150.00,
      descricao: 'Crédito acumulado - Janeiro',
      tipoCredito: 'ACUMULADO',
      utilizado: false
    })

    await db.createCredito({
      associadoId: associado1.id,
      valor: 75.50,
      descricao: 'Bônus por indicação',
      tipoCredito: 'BONUS',
      utilizado: false
    })

    await db.createCredito({
      associadoId: associado2.id,
      valor: 200.00,
      descricao: 'Crédito acumulado - Fevereiro',
      tipoCredito: 'ACUMULADO',
      utilizado: false
    })

    await db.createCredito({
      associadoId: associado2.id,
      valor: 50.00,
      descricao: 'Reembolso de despesa',
      tipoCredito: 'REEMBOLSO',
      utilizado: false
    })

    console.log('Dados de teste inicializados com sucesso!')
    console.log('Usuários de teste:')
    console.log('1. Código: TESTE001, Senha: password')
    console.log('2. Código: TESTE002, Senha: password')
    console.log('3. Código: ADMIN001, Senha: admin123 (Admin)')

  } catch (error) {
    console.error('Erro ao inicializar dados de teste:', error)
  }
}

// Exportar função para uso em outros lugares
export { getDatabase }