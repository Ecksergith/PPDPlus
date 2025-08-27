import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const { creditId, approved, adminId } = await request.json()

    if (!creditId || approved === undefined || !adminId) {
      return NextResponse.json(
        { error: 'ID do crédito, status de aprovação e ID do administrador são obrigatórios' },
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

    // Get credit
    const credit = await db.getCreditById(creditId)
    if (!credit) {
      return NextResponse.json(
        { error: 'Crédito não encontrado' },
        { status: 404 }
      )
    }

    if (credit.status !== 'pendente') {
      return NextResponse.json(
        { error: 'Este crédito já foi processado' },
        { status: 400 }
      )
    }

    // Update credit status using binary database
    const updatedCredit = await db.updateCredit(creditId, {
      status: approved ? 'aprovado' : 'rejeitado',
      dataAprovacao: approved ? new Date().toISOString() : undefined
    })

    if (!updatedCredit) {
      return NextResponse.json(
        { error: 'Erro ao atualizar crédito' },
        { status: 500 }
      )
    }

    // Create notification/request record
    await db.createSolicitacao({
      userId: credit.userId,
      tipo: 'credito_aprovacao',
      descricao: `Solicitação de crédito ${approved ? 'aprovada' : 'rejeitada'} pelo administrador`,
      status: approved ? 'aprovado' : 'rejeitado',
      dataResposta: new Date().toISOString(),
      resposta: `Seu crédito de AOA ${credit.valor.toLocaleString()} foi ${approved ? 'aprovado' : 'rejeitado'}`
    })

    return NextResponse.json({
      message: `Crédito ${approved ? 'aprovado' : 'rejeitado'} com sucesso`,
      credit: updatedCredit
    })

  } catch (error) {
    console.error('Credit approval error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}