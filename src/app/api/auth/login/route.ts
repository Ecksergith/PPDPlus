import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'

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

    // Create response with user data (excluding password)
    const { senha: _, ...userWithoutPassword } = user

    return NextResponse.json({
      message: 'Login realizado com sucesso',
      user: userWithoutPassword
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}