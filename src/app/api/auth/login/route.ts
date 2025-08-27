import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { findMemberByConsumerCode, getMemberFullData } from '@/lib/db-binary';

// Schema de validação para login
const loginSchema = z.object({
  consumerCode: z.string().min(1, 'Código de consumidor é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar dados de entrada
    const validatedData = loginSchema.parse(body);
    
    // Buscar associado pelo código de consumidor
    const member = await findMemberByConsumerCode(validatedData.consumerCode.toUpperCase());
    
    if (!member) {
      return NextResponse.json(
        { error: 'Código de consumidor inválido ou conta inativa' },
        { status: 401 }
      );
    }
    
    // Verificar senha
    const isPasswordValid = await bcrypt.compare(validatedData.password, member.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Senha inválida' },
        { status: 401 }
      );
    }
    
    // Obter dados completos do membro
    const memberData = await getMemberFullData(validatedData.consumerCode.toUpperCase());
    
    if (!memberData) {
      return NextResponse.json(
        { error: 'Erro ao carregar dados do usuário' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'Login realizado com sucesso',
      ...memberData
    }, { status: 200 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Erro no login:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}