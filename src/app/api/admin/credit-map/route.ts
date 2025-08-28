import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const adminId = searchParams.get('adminId')
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

    // Get all credits with user details
    const credits = await db.getAllCredits()
    const users = await db.getAllUsers()
    const payments = await db.getAllPayments()

    // Generate credit map data
    const creditMapData = {
      geradoEm: new Date().toISOString(),
      administrador: {
        nome: admin.nome,
        codigoConsumidor: admin.codigoConsumidor
      },
      resumo: {
        totalUsuarios: users.length,
        totalMembros: users.filter(u => u.isMembro).length,
        totalCreditos: credits.length,
        creditosAprovados: credits.filter(c => c.status === 'aprovado').length,
        creditosPendentes: credits.filter(c => c.status === 'pendente').length,
        creditosRejeitados: credits.filter(c => c.status === 'rejeitado').length,
        valorTotalCreditos: credits.reduce((sum, c) => sum + c.valor, 0),
        valorTotalJuros: credits.reduce((sum, c) => sum + c.juros, 0),
        valorTotalPagar: credits.reduce((sum, c) => sum + c.valorTotal, 0),
        totalPagamentos: payments.reduce((sum, p) => sum + p.valor, 0),
        saldoEmAberto: credits.reduce((sum, c) => sum + c.valorTotal, 0) - payments.reduce((sum, p) => sum + p.valor, 0)
      },
      usuarios: users.map(user => {
        const userCredits = credits.filter(c => c.userId === user.id)
        const userPayments = payments.filter(p => p.userId === user.id)
        
        return {
          codigoConsumidor: user.codigoConsumidor,
          nome: user.nome,
          email: user.email,
          telefone: user.telefone,
          isMembro: user.isMembro,
          isAdmin: user.isAdmin,
          dataCadastro: user.createdAt,
          creditos: userCredits.map(credit => {
            const creditPayments = userPayments.filter(p => p.creditId === credit.id)
            const totalPago = creditPayments.reduce((sum, p) => sum + p.valor, 0)
            const saldoDevedor = credit.valorTotal - totalPago
            
            return {
              id: credit.id,
              valor: credit.valor,
              juros: credit.juros,
              valorTotal: credit.valorTotal,
              status: credit.status,
              dataSolicitacao: credit.dataSolicitacao,
              dataAprovacao: credit.dataAprovacao,
              dataVencimento: credit.dataVencimento,
              descricao: credit.descricao,
              totalPago,
              saldoDevedor,
              pagamentos: creditPayments.map(payment => ({
                id: payment.id,
                valor: payment.valor,
                dataPagamento: payment.dataPagamento,
                status: payment.status,
                metodo: payment.metodo,
                descricao: payment.descricao
              }))
            }
          }),
          resumoUsuario: {
            totalCreditos: userCredits.length,
            totalValorCreditos: userCredits.reduce((sum, c) => sum + c.valor, 0),
            totalJuros: userCredits.reduce((sum, c) => sum + c.juros, 0),
            totalValorPagar: userCredits.reduce((sum, c) => sum + c.valorTotal, 0),
            totalPago: userPayments.reduce((sum, p) => sum + p.valor, 0),
            totalEmAberto: userCredits.reduce((sum, c) => sum + c.valorTotal, 0) - userPayments.reduce((sum, p) => sum + p.valor, 0)
          }
        }
      }),
      configuracoes: await db.getAllSettings()
    }

    if (format === 'json') {
      return NextResponse.json(creditMapData)
    } else if (format === 'csv') {
      // Generate CSV format
      const csvHeaders = [
        'Código Consumidor',
        'Nome',
        'Email',
        'Telefone',
        'Membro',
        'Total Créditos',
        'Total Valor',
        'Total Pago',
        'Saldo Devedor'
      ]
      
      const csvRows = creditMapData.usuarios.map(user => [
        user.codigoConsumidor,
        user.nome,
        user.email || '',
        user.telefone || '',
        user.isMembro ? 'Sim' : 'Não',
        user.resumoUsuario.totalCreditos,
        user.resumoUsuario.totalValorPagar,
        user.resumoUsuario.totalPago,
        user.resumoUsuario.totalEmAberto
      ])
      
      const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n')
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="mapa_credito_ppd.csv"'
        }
      })
    } else {
      return NextResponse.json(
        { error: 'Formato não suportado. Use json ou csv.' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Generate credit map error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}