import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { codigoConsumidor, senha } = await request.json()

    if (!codigoConsumidor || !senha) {
      return NextResponse.json(
        { error: 'Código de consumidor e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Authenticate user using binary database
    const user = await db.authenticateUser(codigoConsumidor, senha)

    if (!user) {
      return NextResponse.json(
        { error: 'Código de consumidor ou senha inválidos' },
        { status: 401 }
      )
    }

    // Check if user is admin
    if (!user.isAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado. Você não tem permissão de administrador' },
        { status: 403 }
      )
    }

    // Create response with user data (excluding password)
    const { senha: _, ...userWithoutPassword } = user

    return NextResponse.json({
      message: 'Login de administrador realizado com sucesso',
      user: userWithoutPassword,
      isAdmin: true
    })

  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}