import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { paymentId, adminId } = await request.json()

    if (!paymentId || !adminId) {
      return NextResponse.json(
        { error: 'ID do pagamento e ID do administrador são obrigatórios' },
        { status: 400 }
      )
    }

    // Verify admin
    const admin = await db.user.findUnique({
      where: { id: adminId, isAdmin: true }
    })

    if (!admin) {
      return NextResponse.json(
        { error: 'Administrador não encontrado ou sem permissão' },
        { status: 403 }
      )
    }

    // Get payment with credit info
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: {
        credit: true,
        user: true
      }
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      )
    }

    if (payment.status !== 'pendente') {
      return NextResponse.json(
        { error: 'Este pagamento já foi processado' },
        { status: 400 }
      )
    }

    // Update payment status
    const updatedPayment = await db.payment.update({
      where: { id: paymentId },
      data: {
        status: 'confirmado'
      }
    })

    // Check if credit is fully paid
    const totalPaid = await db.payment.aggregate({
      where: { 
        creditId: payment.creditId, 
        status: 'confirmado' 
      },
      _sum: { valor: true }
    })

    if (totalPaid._sum.valor && totalPaid._sum.valor >= payment.credit.valorTotal) {
      await db.credit.update({
        where: { id: payment.creditId },
        data: { status: 'pago' }
      })
    }

    // Create notification
    await db.solicitacao.create({
      data: {
        userId: payment.userId,
        tipo: 'pagamento_confirmado',
        descricao: `Pagamento de AOA ${payment.valor.toLocaleString()} confirmado`,
        status: 'aprovado',
        dataResposta: new Date(),
        resposta: `Seu pagamento de AOA ${payment.valor.toLocaleString()} foi confirmado com sucesso`
      }
    })

    return NextResponse.json({
      message: 'Pagamento confirmado com sucesso',
      payment: updatedPayment
    })

  } catch (error) {
    console.error('Payment confirmation error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}