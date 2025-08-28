import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { creditId, userId, valor, metodo, descricao } = await request.json()

    if (!creditId || !userId || !valor) {
      return NextResponse.json(
        { error: 'ID do crédito, ID do usuário e valor são obrigatórios' },
        { status: 400 }
      )
    }

    // Get credit to verify it exists and belongs to user
    const credit = await db.getCreditById(creditId)

    if (!credit || credit.userId !== userId) {
      return NextResponse.json(
        { error: 'Crédito não encontrado ou não pertence ao usuário' },
        { status: 404 }
      )
    }

    if (credit.status !== 'aprovado') {
      return NextResponse.json(
        { error: 'Este crédito não está aprovado para pagamento' },
        { status: 400 }
      )
    }

    // Create payment
    const payment = await db.createPayment({
      creditId,
      userId,
      valor,
      metodo: metodo || 'transferencia',
      descricao: descricao || 'Pagamento de crédito',
      status: 'pendente'
    })

    // Update credit status if fully paid
    const payments = await db.getPaymentsByCreditId(creditId)
    const totalPaid = payments
      .filter(p => p.status === 'confirmado')
      .reduce((sum, p) => sum + p.valor, 0) + valor
    
    if (totalPaid >= credit.valorTotal) {
      await db.updateCredit(creditId, { status: 'pago' })
    }

    return NextResponse.json({
      message: 'Pagamento registrado com sucesso',
      payment: {
        id: payment.id,
        valor: payment.valor,
        dataPagamento: payment.dataPagamento,
        status: payment.status,
        metodo: payment.metodo,
        descricao: payment.descricao
      }
    })

  } catch (error) {
    console.error('Payment creation error:', error)
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

    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }

    const payments = await db.getPaymentsByUserId(userId)

    return NextResponse.json({
      payments
    })

  } catch (error) {
    console.error('Get payments error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}