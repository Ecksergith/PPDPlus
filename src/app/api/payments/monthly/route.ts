import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { userId, valor, metodo, descricao, adminId } = await request.json()

    if (!userId || !valor) {
      return NextResponse.json(
        { error: 'ID do usuário e valor são obrigatórios' },
        { status: 400 }
      )
    }

    // Get user
    const user = await db.findUserById(userId)
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Check if user is a member
    if (!user.isMembro) {
      return NextResponse.json(
        { error: 'Apenas membros podem realizar pagamentos mensais' },
        { status: 403 }
      )
    }

    // Get user's approved credits
    const userCredits = await db.getCreditsByUserId(userId)
    const approvedCredits = userCredits.filter(c => c.status === 'aprovado')
    
    if (approvedCredits.length === 0) {
      return NextResponse.json(
        { error: 'Usuário não possui créditos aprovados para pagamento' },
        { status: 400 }
      )
    }

    // Calculate total debt and distribute payment
    const totalDebt = approvedCredits.reduce((sum, credit) => {
      const creditPayments = await db.getPaymentsByCreditId(credit.id)
      const totalPaid = creditPayments.reduce((sum, p) => sum + p.valor, 0)
      return sum + (credit.valorTotal - totalPaid)
    }, 0)

    if (totalDebt <= 0) {
      return NextResponse.json(
        { error: 'Não há débitos pendentes para este usuário' },
        { status: 400 }
      )
    }

    // Create payment record
    const payment = await db.createPayment({
      userId,
      creditId: approvedCredits[0].id, // Apply to first credit (can be enhanced)
      valor,
      metodo: metodo || 'mensalidade',
      descricao: descricao || 'Pagamento mensal de mensalidade',
      status: 'confirmado'
    })

    // Create notification
    await db.createSolicitacao({
      userId,
      tipo: 'pagamento_mensal',
      descricao: `Pagamento mensal de AOA ${valor.toLocaleString()} recebido`,
      status: 'aprovado',
      dataResposta: new Date().toISOString(),
      resposta: `Seu pagamento mensal de AOA ${valor.toLocaleString()} foi confirmado`
    })

    // If admin is making the payment, create admin notification
    if (adminId) {
      const admin = await db.findUserById(adminId)
      if (admin && admin.isAdmin) {
        await db.createSolicitacao({
          userId: adminId,
          tipo: 'pagamento_registrado',
          descricao: `Pagamento mensal registrado para ${user.nome}`,
          status: 'aprovado',
          dataResposta: new Date().toISOString(),
          resposta: `Pagamento de AOA ${valor.toLocaleString()} registrado para ${user.nome}`
        })
      }
    }

    return NextResponse.json({
      message: 'Pagamento mensal realizado com sucesso',
      payment: {
        id: payment.id,
        valor: payment.valor,
        dataPagamento: payment.dataPagamento,
        status: payment.status,
        metodo: payment.metodo,
        descricao: payment.descricao
      },
      totalDebitoAnterior: totalDebt,
      novoSaldo: totalDebt - valor
    })

  } catch (error) {
    console.error('Monthly payment error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const adminId = searchParams.get('adminId')

    if (!userId && !adminId) {
      return NextResponse.json(
        { error: 'ID do usuário ou administrador é obrigatório' },
        { status: 400 }
      )
    }

    // If adminId is provided, verify admin and get all members' monthly payment info
    if (adminId) {
      const admin = await db.findUserById(adminId)
      if (!admin || !admin.isAdmin) {
        return NextResponse.json(
          { error: 'Administrador não encontrado ou sem permissão' },
          { status: 403 }
        )
      }

      const users = await db.getAllUsers()
      const members = users.filter(u => u.isMembro)
      
      const membersPaymentInfo = await Promise.all(
        members.map(async (member) => {
          const userCredits = await db.getCreditsByUserId(member.id)
          const approvedCredits = userCredits.filter(c => c.status === 'aprovado')
          
          let totalDebt = 0
          let totalPaid = 0
          let monthlyPayments = 0
          
          for (const credit of approvedCredits) {
            const creditPayments = await db.getPaymentsByCreditId(credit.id)
            const creditTotalPaid = creditPayments.reduce((sum, p) => sum + p.valor, 0)
            const creditDebt = credit.valorTotal - creditTotalPaid
            
            totalDebt += creditDebt
            totalPaid += creditTotalPaid
            monthlyPayments += creditPayments.filter(p => p.metodo === 'mensalidade').length
          }
          
          return {
            userId: member.id,
            codigoConsumidor: member.codigoConsumidor,
            nome: member.nome,
            email: member.email,
            telefone: member.telefone,
            totalCreditos: approvedCredits.length,
            totalDevido: totalDebt,
            totalPago: totalPaid,
            saldoDevedor: totalDebt,
            pagamentosMensais: monthlyPayments,
            ultimoPagamento: monthlyPayments > 0 ? 
              (await db.getPaymentsByUserId(member.id))
                .filter(p => p.metodo === 'mensalidade')
                .sort((a, b) => new Date(b.dataPagamento).getTime() - new Date(a.dataPagamento).getTime())[0]?.dataPagamento : null
          }
        })
      )

      return NextResponse.json({
        members: membersPaymentInfo,
        resumo: {
          totalMembros: members.length,
          membrosComDebito: membersPaymentInfo.filter(m => m.saldoDevedor > 0).length,
          totalDevidoGeral: membersPaymentInfo.reduce((sum, m) => sum + m.saldoDevedor, 0),
          totalPagoGeral: membersPaymentInfo.reduce((sum, m) => sum + m.totalPago, 0),
          totalPagamentosMensais: membersPaymentInfo.reduce((sum, m) => sum + m.pagamentosMensais, 0)
        }
      })
    }

    // If userId is provided, get specific user's monthly payment info
    if (userId) {
      const user = await db.findUserById(userId)
      if (!user) {
        return NextResponse.json(
          { error: 'Usuário não encontrado' },
          { status: 404 }
        )
      }

      if (!user.isMembro) {
        return NextResponse.json(
          { error: 'Apenas membros possuem informações de pagamento mensal' },
          { status: 403 }
        )
      }

      const userCredits = await db.getCreditsByUserId(userId)
      const approvedCredits = userCredits.filter(c => c.status === 'aprovado')
      
      let totalDebt = 0
      let totalPaid = 0
      const creditDetails = []
      
      for (const credit of approvedCredits) {
        const creditPayments = await db.getPaymentsByCreditId(credit.id)
        const creditTotalPaid = creditPayments.reduce((sum, p) => sum + p.valor, 0)
        const creditDebt = credit.valorTotal - creditTotalPaid
        
        totalDebt += creditDebt
        totalPaid += creditTotalPaid
        
        creditDetails.push({
          creditId: credit.id,
          valor: credit.valor,
          juros: credit.juros,
          valorTotal: credit.valorTotal,
          totalPago: creditTotalPaid,
          saldoDevedor: creditDebt,
          dataVencimento: credit.dataVencimento,
          pagamentos: creditPayments.filter(p => p.metodo === 'mensalidade')
        })
      }

      return NextResponse.json({
        user: {
          id: user.id,
          codigoConsumidor: user.codigoConsumidor,
          nome: user.nome,
          email: user.email,
          telefone: user.telefone
        },
        totalDevido: totalDebt,
        totalPago: totalPaid,
        saldoDevedor: totalDebt,
        creditos: creditDetails,
        proximoVencimento: approvedCredits
          .filter(c => new Date(c.dataVencimento!) > new Date())
          .sort((a, b) => new Date(a.dataVencimento!).getTime() - new Date(b.dataVencimento!).getTime())[0]?.dataVencimento
      })
    }

  } catch (error) {
    console.error('Get monthly payments error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}