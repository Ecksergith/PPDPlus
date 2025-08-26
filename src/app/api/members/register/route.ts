import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { findMemberByEmail, findMemberByDocument, createMember } from '@/lib/db-binary';

// Schema de validação para cadastro de associado
const registerSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  phone: z.string().optional(),
  document: z.string().min(6, 'Código MEC deve ter pelo menos 6 caracteres'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  birthDate: z.string().optional(),
});

// Função para gerar código de consumidor único
function generateConsumerCode(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `PPD${timestamp}${random}`.toUpperCase();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar dados de entrada
    const validatedData = registerSchema.parse(body);
    
    // Verificar se email já existe
    const existingMemberByEmail = await findMemberByEmail(validatedData.email);
    
    if (existingMemberByEmail) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 400 }
      );
    }
    
    // Verificar se documento já existe
    const existingMemberByDocument = await findMemberByDocument(validatedData.document);
    
    if (existingMemberByDocument) {
      return NextResponse.json(
        { error: 'Código MEC já cadastrado' },
        { status: 400 }
      );
    }
    
    // Gerar código de consumidor único
    let consumerCode = generateConsumerCode();
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);
    
    // Preparar dados para criação
    const memberData = {
      ...validatedData,
      consumerCode,
      password: hashedPassword,
      birthDate: validatedData.birthDate || null,
    };
    
    // Criar associado
    const newMember = await createMember(memberData);
    
    return NextResponse.json({
      message: 'Associado cadastrado com sucesso',
      member: {
        id: newMember.id,
        consumerCode: newMember.consumerCode,
        name: newMember.name,
        email: newMember.email,
        phone: newMember.phone,
        document: newMember.document,
        address: newMember.address,
        city: newMember.city,
        state: newMember.state,
        zipCode: newMember.zipCode,
        birthDate: newMember.birthDate,
        createdAt: newMember.createdAt,
      }
    }, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Erro ao cadastrar associado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}