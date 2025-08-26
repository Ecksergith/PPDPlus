import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const codigoConsumidor = searchParams.get('codigo')

    if (!codigoConsumidor) {
      return NextResponse.json(
        { error: 'Código de consumidor é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar associado pelo código de consumidor
    const associado = await db.findAssociadoByCodigo(codigoConsumidor)

    if (!associado) {
      return NextResponse.json(
        { error: 'Associado não encontrado' },
        { status: 404 }
      )
    }

    // Buscar créditos do associado
    const creditos = await db.getCreditosByAssociado(associado.id)

    return NextResponse.json({ creditos })

  } catch (error) {
    console.error('Erro ao buscar créditos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { codigoConsumidor, valor, descricao, tipoCredito, validade } = await request.json()

    if (!codigoConsumidor || !valor) {
      return NextResponse.json(
        { error: 'Código de consumidor e valor são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar associado pelo código de consumidor
    const associado = await db.findAssociadoByCodigo(codigoConsumidor)

    if (!associado) {
      return NextResponse.json(
        { error: 'Associado não encontrado' },
        { status: 404 }
      )
    }

    // Criar crédito
    const credito = await db.createCredito({
      associadoId: associado.id,
      valor: parseFloat(valor),
      descricao,
      tipoCredito: tipoCredito || 'ACUMULADO',
      validade,
      utilizado: false
    })

    // Criar transação
    await db.createTransacao({
      associadoId: associado.id,
      creditoId: credito.id,
      tipo: 'CREDITO',
      valor: parseFloat(valor),
      descricao: descricao || 'Crédito acumulado'
    })

    return NextResponse.json({
      message: 'Crédito criado com sucesso',
      credito
    })

  } catch (error) {
    console.error('Erro ao criar crédito:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}