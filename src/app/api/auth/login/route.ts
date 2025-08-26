import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { codigoConsumidor, senha } = await request.json()

    if (!codigoConsumidor || !senha) {
      return NextResponse.json(
        { error: 'Código de consumidor e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar associado pelo código de consumidor
    const associado = await db.findAssociadoByCodigo(codigoConsumidor)

    if (!associado) {
      return NextResponse.json(
        { error: 'Código de consumidor ou senha inválidos' },
        { status: 401 }
      )
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, associado.senha)
    
    if (!senhaValida) {
      return NextResponse.json(
        { error: 'Código de consumidor ou senha inválidos' },
        { status: 401 }
      )
    }

    // Retornar dados do associado (sem informações sensíveis)
    const { senha: _, ...associadoSemSenha } = associado

    return NextResponse.json({
      message: 'Login realizado com sucesso',
      associado: associadoSemSenha
    })

  } catch (error) {
    console.error('Erro no login:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}