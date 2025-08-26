import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const {
      nome,
      email,
      senha,
      telefone,
      cpf,
      dataNascimento,
      endereco,
      cep,
      cidade,
      estado,
      tipoMembro
    } = await request.json()

    // Validação básica
    if (!nome || !email || !senha || !cpf) {
      return NextResponse.json(
        { error: 'Nome, email, senha e CPF são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se email já existe
    const emailExistente = await db.findAssociadoByEmail(email)

    if (emailExistente) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 400 }
      )
    }

    // Verificar se CPF já existe
    const cpfExistente = await db.findAssociadoByCpf(cpf)

    if (cpfExistente) {
      return NextResponse.json(
        { error: 'CPF já cadastrado' },
        { status: 400 }
      )
    }

    // Gerar código de consumidor único
    const codigoConsumidor = `PPD${uuidv4().substring(0, 8).toUpperCase()}`

    // Criptografar senha
    const senhaCriptografada = await bcrypt.hash(senha, 10)

    // Criar associado
    const associado = await db.createAssociado({
      codigoConsumidor,
      nome,
      email,
      senha: senhaCriptografada,
      telefone,
      cpf,
      dataNascimento,
      endereco,
      cep,
      cidade,
      estado,
      tipoMembro: tipoMembro || 'MEMBRO',
      ativo: true
    })

    // Remover senha do retorno
    const { senha: _, ...associadoSemSenha } = associado

    return NextResponse.json({
      message: 'Associado cadastrado com sucesso',
      associado: associadoSemSenha
    })

  } catch (error) {
    console.error('Erro no cadastro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const codigoConsumidor = searchParams.get('codigo')

    if (codigoConsumidor) {
      // Buscar associado específico
      const associado = await db.findAssociadoByCodigo(codigoConsumidor)

      if (!associado) {
        return NextResponse.json(
          { error: 'Associado não encontrado' },
          { status: 404 }
        )
      }

      // Remover senha do retorno
      const { senha: _, ...associadoSemSenha } = associado

      return NextResponse.json({ associado: associadoSemSenha })
    } else {
      // Listar todos os associados (apenas dados básicos)
      const associados = await db.getAllAssociados()
      
      // Remover senhas do retorno
      const associadosSemSenha = associados.map(({ senha, ...associado }) => associado)

      return NextResponse.json({ associados: associadosSemSenha })
    }

  } catch (error) {
    console.error('Erro ao buscar associados:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}