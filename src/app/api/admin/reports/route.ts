import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const adminId = searchParams.get('adminId')
    const type = searchParams.get('type') || 'general'
    const format = searchParams.get('format') || 'json'

    if (!adminId) {
      return NextResponse.json(
        { error: 'ID do administrador é obrigatório' },
        { status: 400 }
      )
    }

    // Verify admin
    const admin = await db.findUserById(adminId)
    if (!admin || !admin.isAdmin) {
      return NextResponse.json(
        { error: 'Administrador não encontrado ou sem permissão' },
        { status: 403 }
      )
    }

    const users = await db.getAllUsers()
    const credits = await db.getAllCredits()
    const payments = await db.getAllPayments()
    const solicitacoes = await db.getAllSolicitacoes()
    const settings = await db.getAllSettings()

    let reportData: any = {
      geradoEm: new Date().toISOString(),
      administrador: {
        nome: admin.nome,
        codigoConsumidor: admin.codigoConsumidor
      },
      tipo: type
    }

    switch (type) {
      case 'general':
        reportData = {
          ...reportData,
          resumoGeral: {
            totalUsuarios: users.length,
            totalMembros: users.filter(u => u.isMembro).length,
            totalAdmins: users.filter(u => u.isAdmin).length,
            totalCreditos: credits.length,
            creditosAprovados: credits.filter(c => c.status === 'aprovado').length,
            creditosPendentes: credits.filter(c => c.status === 'pendente').length,
            creditosRejeitados: credits.filter(c => c.status === 'rejeitado').length,
            totalPagamentos: payments.length,
            pagamentosConfirmados: payments.filter(p => p.status === 'confirmado').length,
            valorTotalCreditos: credits.reduce((sum, c) => sum + c.valor, 0),
            valorTotalJuros: credits.reduce((sum, c) => sum + c.juros, 0),
            valorTotalPagar: credits.reduce((sum, c) => sum + c.valorTotal, 0),
            valorTotalPago: payments.reduce((sum, p) => sum + p.valor, 0),
            saldoEmAberto: credits.reduce((sum, c) => sum + c.valorTotal, 0) - payments.reduce((sum, p) => sum + p.valor, 0)
          },
          estatisticasPorMes: generateMonthlyStats(credits, payments),
          desempenhoPorUsuario: users.map(user => {
            const userCredits = credits.filter(c => c.userId === user.id)
            const userPayments = payments.filter(p => p.userId === user.id)
            
            return {
              codigoConsumidor: user.codigoConsumidor,
              nome: user.nome,
              isMembro: user.isMembro,
              totalCreditos: userCredits.length,
              valorTotalCreditos: userCredits.reduce((sum, c) => sum + c.valor, 0),
              totalPago: userPayments.reduce((sum, p) => sum + p.valor, 0),
              saldoDevedor: userCredits.reduce((sum, c) => sum + c.valorTotal, 0) - userPayments.reduce((sum, p) => sum + p.valor, 0)
            }
          })
        }
        break

      case 'credits':
        reportData = {
          ...reportData,
          creditos: credits.map(credit => {
            const user = users.find(u => u.id === credit.userId)
            const creditPayments = payments.filter(p => p.creditId === credit.id)
            const totalPago = creditPayments.reduce((sum, p) => sum + p.valor, 0)
            
            return {
              id: credit.id,
              usuario: user ? `${user.nome} (${user.codigoConsumidor})` : 'N/A',
              valor: credit.valor,
              juros: credit.juros,
              valorTotal: credit.valorTotal,
              status: credit.status,
              dataSolicitacao: credit.dataSolicitacao,
              dataAprovacao: credit.dataAprovacao,
              dataVencimento: credit.dataVencimento,
              descricao: credit.descricao,
              totalPago,
              saldoDevedor: credit.valorTotal - totalPago,
              isMembro: user?.isMembro || false
            }
          }),
          resumoCreditos: {
            total: credits.length,
            aprovados: credits.filter(c => c.status === 'aprovado').length,
            pendentes: credits.filter(c => c.status === 'pendente').length,
            rejeitados: credits.filter(c => c.status === 'rejeitado').length,
            valorTotal: credits.reduce((sum, c) => sum + c.valor, 0),
            valorTotalJuros: credits.reduce((sum, c) => sum + c.juros, 0)
          }
        }
        break

      case 'payments':
        reportData = {
          ...reportData,
          pagamentos: payments.map(payment => {
            const user = users.find(u => u.id === payment.userId)
            const credit = credits.find(c => c.id === payment.creditId)
            
            return {
              id: payment.id,
              usuario: user ? `${user.nome} (${user.codigoConsumidor})` : 'N/A',
              credito: credit ? `AOA ${credit.valor.toLocaleString()}` : 'N/A',
              valor: payment.valor,
              dataPagamento: payment.dataPagamento,
              status: payment.status,
              metodo: payment.metodo || 'N/A',
              descricao: payment.descricao || 'N/A'
            }
          }),
          resumoPagamentos: {
            total: payments.length,
            confirmados: payments.filter(p => p.status === 'confirmado').length,
            pendentes: payments.filter(p => p.status === 'pendente').length,
            falhados: payments.filter(p => p.status === 'falhou').length,
            valorTotal: payments.reduce((sum, p) => sum + p.valor, 0)
          }
        }
        break

      case 'users':
        reportData = {
          ...reportData,
          usuarios: users.map(user => {
            const userCredits = credits.filter(c => c.userId === user.id)
            const userPayments = payments.filter(p => p.userId === user.id)
            
            return {
              codigoConsumidor: user.codigoConsumidor,
              nome: user.nome,
              email: user.email || 'N/A',
              telefone: user.telefone || 'N/A',
              isMembro: user.isMembro,
              isAdmin: user.isAdmin,
              dataCadastro: user.createdAt,
              totalCreditos: userCredits.length,
              valorTotalCreditos: userCredits.reduce((sum, c) => sum + c.valor, 0),
              totalPago: userPayments.reduce((sum, p) => sum + p.valor, 0),
              saldoDevedor: userCredits.reduce((sum, c) => sum + c.valorTotal, 0) - userPayments.reduce((sum, p) => sum + p.valor, 0)
            }
          }),
          resumoUsuarios: {
            total: users.length,
            membros: users.filter(u => u.isMembro).length,
            admins: users.filter(u => u.isAdmin).length,
            ativos: users.filter(u => {
              const userCredits = credits.filter(c => c.userId === u.id)
              return userCredits.length > 0
            }).length
          }
        }
        break

      default:
        return NextResponse.json(
          { error: 'Tipo de relatório não suportado' },
          { status: 400 }
        )
    }

    if (format === 'json') {
      return NextResponse.json(reportData)
    } else if (format === 'csv') {
      // Generate CSV based on report type
      let csvContent = ''
      
      switch (type) {
        case 'general':
          csvContent = generateGeneralCSV(reportData)
          break
        case 'credits':
          csvContent = generateCreditsCSV(reportData)
          break
        case 'payments':
          csvContent = generatePaymentsCSV(reportData)
          break
        case 'users':
          csvContent = generateUsersCSV(reportData)
          break
      }
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="relatorio_${type}_ppd.csv"`
        }
      })
    } else {
      return NextResponse.json(
        { error: 'Formato não suportado. Use json ou csv.' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Generate report error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

function generateMonthlyStats(credits: any[], payments: any[]) {
  const stats = []
  const currentDate = new Date()
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    const monthCredits = credits.filter(c => 
      c.dataSolicitacao.startsWith(monthKey)
    )
    const monthPayments = payments.filter(p => 
      p.dataPagamento.startsWith(monthKey)
    )
    
    stats.push({
      mes: monthKey,
      creditos: monthCredits.length,
      valorCreditos: monthCredits.reduce((sum, c) => sum + c.valor, 0),
      pagamentos: monthPayments.length,
      valorPagamentos: monthPayments.reduce((sum, p) => sum + p.valor, 0)
    })
  }
  
  return stats
}

function generateGeneralCSV(data: any) {
  const headers = ['Mês', 'Total Créditos', 'Valor Créditos', 'Total Pagamentos', 'Valor Pagamentos']
  const rows = data.estatisticasPorMes.map((stat: any) => [
    stat.mes,
    stat.creditos,
    stat.valorCreditos,
    stat.pagamentos,
    stat.valorPagamentos
  ])
  
  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
}

function generateCreditsCSV(data: any) {
  const headers = ['ID', 'Usuário', 'Valor', 'Juros', 'Total', 'Status', 'Data Solicitação', 'Data Vencimento', 'Total Pago', 'Saldo Devedor']
  const rows = data.creditos.map((credit: any) => [
    credit.id,
    credit.usuario,
    credit.valor,
    credit.juros,
    credit.valorTotal,
    credit.status,
    credit.dataSolicitacao,
    credit.dataVencimento || '',
    credit.totalPago,
    credit.saldoDevedor
  ])
  
  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
}

function generatePaymentsCSV(data: any) {
  const headers = ['ID', 'Usuário', 'Crédito', 'Valor', 'Data Pagamento', 'Status', 'Método']
  const rows = data.pagamentos.map((payment: any) => [
    payment.id,
    payment.usuario,
    payment.credito,
    payment.valor,
    payment.dataPagamento,
    payment.status,
    payment.metodo
  ])
  
  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
}

function generateUsersCSV(data: any) {
  const headers = ['Código', 'Nome', 'Email', 'Membro', 'Admin', 'Total Créditos', 'Valor Total', 'Total Pago', 'Saldo Devedor']
  const rows = data.usuarios.map((user: any) => [
    user.codigoConsumidor,
    user.nome,
    user.email,
    user.isMembro ? 'Sim' : 'Não',
    user.isAdmin ? 'Sim' : 'Não',
    user.totalCreditos,
    user.valorTotalCreditos,
    user.totalPago,
    user.saldoDevedor
  ])
  
  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
}