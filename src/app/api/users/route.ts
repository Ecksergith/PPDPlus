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
    const admin = await db.user.findUnique({
      where: { id: adminId, isAdmin: true }
    })

    if (!admin) {
      return NextResponse.json(
        { error: 'Administrador não encontrado ou sem permissão' },
        { status: 403 }
      )
    }

    const users = await db.user.findMany({
      select: {
        id: true,
        codigoConsumidor: true,
        nome: true,
        email: true,
        isMembro: true,
        isAdmin: true,
        telefone: true,
        createdAt: true,
        updatedAt: true,
        credits: {
          select: {
            id: true,
            valor: true,
            status: true,
            dataSolicitacao: true
          }
        },
        payments: {
          select: {
            id: true,
            valor: true,
            status: true,
            dataPagamento: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      users
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
    const admin = await db.user.findUnique({
      where: { id: adminId, isAdmin: true }
    })

    if (!admin) {
      return NextResponse.json(
        { error: 'Administrador não encontrado ou sem permissão' },
        { status: 403 }
      )
    }

    // Get user to update
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        isMembro: isMembro !== undefined ? isMembro : user.isMembro,
        isAdmin: isAdmin !== undefined ? isAdmin : user.isAdmin
      },
      select: {
        id: true,
        codigoConsumidor: true,
        nome: true,
        email: true,
        isMembro: true,
        isAdmin: true,
        telefone: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // Create notification
    await db.solicitacao.create({
      data: {
        userId,
        tipo: 'status_atualizado',
        descricao: 'Status do usuário atualizado pelo administrador',
        status: 'aprovado',
        dataResposta: new Date(),
        resposta: `Seu status foi atualizado: ${isMembro ? 'Membro' : 'Não-membro'}${isAdmin ? ', Administrador' : ''}`
      }
    })

    return NextResponse.json({
      message: 'Usuário atualizado com sucesso',
      user: updatedUser
    })

  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}