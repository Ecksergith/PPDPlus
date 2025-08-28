import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { codigoConsumidor, nome, email, senha, telefone, endereco } = await request.json()

    if (!codigoConsumidor || !nome || !senha) {
      return NextResponse.json(
        { error: 'Código de consumidor, nome e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db.findUserByCodigo(codigoConsumidor)
    if (existingUser) {
      return NextResponse.json(
        { error: 'Código de consumidor já está em uso' },
        { status: 409 }
      )
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await db.findUserByEmail(email)
      if (existingEmail) {
        return NextResponse.json(
          { error: 'Email já está em uso' },
          { status: 409 }
        )
      }
    }

    // Create user using binary database
    const user = await db.createUser({
      codigoConsumidor,
      nome,
      email,
      senha,
      telefone,
      endereco,
      isMembro: false, // Default to non-member
      isAdmin: false, // Default to non-admin
    })

    // Create response without password
    const { senha: _, ...userWithoutPassword } = user

    return NextResponse.json({
      message: 'Usuário criado com sucesso',
      user: userWithoutPassword
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}