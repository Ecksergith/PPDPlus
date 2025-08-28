import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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

    const users = await db.getAllUsers()

    // Add credits and payments info for each user
    const usersWithDetails = await Promise.all(
      users.map(async (user) => {
        const credits = await db.getCreditsByUserId(user.id)
        const payments = await db.getPaymentsByUserId(user.id)
        
        return {
          ...user,
          credits: credits.map(c => ({
            id: c.id,
            valor: c.valor,
            status: c.status,
            dataSolicitacao: c.dataSolicitacao
          })),
          payments: payments.map(p => ({
            id: p.id,
            valor: p.valor,
            status: p.status,
            dataPagamento: p.dataPagamento
          }))
        }
      })
    )

    return NextResponse.json({
      users: usersWithDetails
    })

  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId, adminId, isMembro, isAdmin } = await request.json()

    if (!userId || !adminId) {
      return NextResponse.json(
        { error: 'ID do usuário e ID do administrador são obrigatórios' },
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

    // Get user to update
    const user = await db.findUserById(userId)
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Update user
    const updatedUser = await db.updateUser(userId, {
      isMembro: isMembro !== undefined ? isMembro : user.isMembro,
      isAdmin: isAdmin !== undefined ? isAdmin : user.isAdmin
    })

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Não foi possível atualizar o usuário' },
        { status: 500 }
      )
    }

    // Create notification
    await db.createSolicitacao({
      userId,
      tipo: 'status_atualizado',
      descricao: 'Status do usuário atualizado pelo administrador',
      status: 'aprovado',
      dataResposta: new Date().toISOString(),
      resposta: `Seu status foi atualizado: ${isMembro ? 'Membro' : 'Não-membro'}${isAdmin ? ', Administrador' : ''}`
    })

    return NextResponse.json({
      message: 'Usuário atualizado com sucesso',
      user: {
        id: updatedUser.id,
        codigoConsumidor: updatedUser.codigoConsumidor,
        nome: updatedUser.nome,
        email: updatedUser.email,
        isMembro: updatedUser.isMembro,
        isAdmin: updatedUser.isAdmin,
        telefone: updatedUser.telefone,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      }
    })

  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}