import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { consumerCode, data } = await request.json();

    if (!consumerCode || !data) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    // Em vez de gerar PDF no servidor, vamos retornar os dados formatados
    // para que o cliente possa gerar o PDF ou exibir na tela
    
    const mapaData = {
      titulo: 'PPD+ - Mapa de Créditos',
      codigoConsumidor: consumerCode,
      dataGeracao: new Date().toLocaleDateString('pt-BR'),
      credits: data.credits || [],
      totalBalance: data.totalBalance || 0,
      resumo: {
        totalCreditos: data.credits?.length || 0,
        tipos: data.credits?.reduce((acc: any, credit: any) => {
          acc[credit.type] = (acc[credit.type] || 0) + 1;
          return acc;
        }, {}) || {}
      }
    };

    return NextResponse.json({
      message: 'Dados do mapa de créditos gerados com sucesso',
      data: mapaData,
      instrucoes: 'Use estes dados para gerar o PDF no cliente ou exibir na interface'
    });

  } catch (error) {
    console.error('Erro ao gerar mapa de créditos:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar o mapa de créditos' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'API de geração de mapa de créditos',
    usage: 'POST /api/mapa-credito/gerar com { consumerCode, data }',
    descricao: 'Esta API retorna dados formatados para geração de mapa de créditos'
  });
}