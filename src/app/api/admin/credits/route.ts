import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const { valor, userId, descricao, adminId } = await request.json()

    if (!valor || !userId || !adminId) {
      return NextResponse.json(
        { error: 'Valor, ID do usuário e ID do administrador são obrigatórios' },
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

    // Get user
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
      status: 'aprovado', // Admin created credits are automatically approved
      descricao: descricao || 'Crédito criado por administrador',
      dataVencimento: dataVencimento.toISOString(),
      dataAprovacao: new Date().toISOString()
    })

    // Create notification for user
    await db.createSolicitacao({
      userId,
      tipo: 'credito_criado',
      descricao: `Crédito de AOA ${valor.toLocaleString()} criado por administrador`,
      status: 'aprovado',
      dataResposta: new Date().toISOString(),
      resposta: `Um crédito de AOA ${valor.toLocaleString()} foi criado e aprovado para você`
    })

    return NextResponse.json({
      message: 'Crédito criado com sucesso',
      credit: {
        id: credit.id,
        valor: credit.valor,
        juros: credit.juros,
        valorTotal: credit.valorTotal,
        status: credit.status,
        dataSolicitacao: credit.dataSolicitacao,
        dataAprovacao: credit.dataAprovacao,
        dataVencimento: credit.dataVencimento,
        taxaJuros: taxaJuros * 100
      }
    })

  } catch (error) {
    console.error('Admin credit creation error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const adminId = searchParams.get('adminId')

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

    const credits = await db.getAllCredits()

    // Get user details for each credit
    const creditsWithUsers = await Promise.all(
      credits.map(async (credit) => {
        const user = await db.findUserById(credit.userId)
        return {
          ...credit,
          user: user ? {
            nome: user.nome,
            codigoConsumidor: user.codigoConsumidor,
            isMembro: user.isMembro
          } : null
        }
      })
    )

    return NextResponse.json({
      credits: creditsWithUsers
    })

  } catch (error) {
    console.error('Get admin credits error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}