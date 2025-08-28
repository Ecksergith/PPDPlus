import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { valor, descricao, userId } = await request.json()

    if (!valor || !userId) {
      return NextResponse.json(
        { error: 'Valor e ID do usuário são obrigatórios' },
        { status: 400 }
      )
    }

    // Get user to check if member
    const user = await db.findUserById(userId)

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Calculate interest based on membership
    const taxaJuros = user.isMembro ? 0.15 : 0.25
    const juros = valor * taxaJuros
    const valorTotal = valor + juros

    // Calculate due date (30 days from now)
    const dataVencimento = new Date()
    dataVencimento.setDate(dataVencimento.getDate() + 30)

    // Create credit request using binary database
    const credit = await db.createCredit({
      userId,
      valor,
      juros,
      valorTotal,
      status: 'pendente',
      descricao: descricao || 'Solicitação de crédito',
      dataVencimento: dataVencimento.toISOString()
    })

    return NextResponse.json({
      message: 'Solicitação de crédito enviada com sucesso',
      credit: {
        id: credit.id,
        valor: credit.valor,
        juros: credit.juros,
        valorTotal: credit.valorTotal,
        status: credit.status,
        dataSolicitacao: credit.dataSolicitacao,
        dataVencimento: credit.dataVencimento,
        taxaJuros: taxaJuros * 100
      }
    })

  } catch (error) {
    console.error('Credit application error:', error)
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

    const credits = await db.getCreditsByUserId(userId)

    return NextResponse.json({
      credits
    })

  } catch (error) {
    console.error('Get credits error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}