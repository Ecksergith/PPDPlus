import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jsPDF from 'jspdf'

export async function POST(request: NextRequest) {
  try {
    const { codigoConsumidor } = await request.json()

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

    // Filtrar apenas créditos não utilizados
    const creditosDisponiveis = creditos.filter(c => !c.utilizado)

    // Calcular totais
    const totalCreditos = creditosDisponiveis.reduce((sum, credito) => sum + credito.valor, 0)
    const creditosMembros = creditosDisponiveis.filter(c => c.tipoCredito === 'ACUMULADO')
    const creditosNaoMembros = creditosDisponiveis.filter(c => c.tipoCredito === 'BONUS')

    // Gerar PDF
    const pdf = new jsPDF()
    
    // Configurar fontes
    pdf.setFont('helvetica')
    
    // Cabeçalho
    pdf.setFontSize(20)
    pdf.setTextColor(0, 100, 0) // Verde escuro
    pdf.text('PPD+ - Projeto Poupança Disponível', 20, 30)
    
    pdf.setFontSize(16)
    pdf.setTextColor(0, 0, 0)
    pdf.text('Mapa de Crédito', 20, 45)
    
    // Informações do Associado
    pdf.setFontSize(12)
    pdf.text('Dados do Associado:', 20, 65)
    pdf.setFontSize(10)
    pdf.text(`Nome: ${associado.nome}`, 25, 75)
    pdf.text(`Código de Consumidor: ${associado.codigoConsumidor}`, 25, 82)
    pdf.text(`Email: ${associado.email}`, 25, 89)
    pdf.text(`Tipo de Membro: ${associado.tipoMembro === 'MEMBRO' ? 'Membro' : 'Não Membro'}`, 25, 96)
    pdf.text(`Data de Cadastro: ${new Date(associado.dataCadastro).toLocaleDateString('pt-BR')}`, 25, 103)
    
    // Resumo de Créditos
    pdf.setFontSize(12)
    pdf.text('Resumo de Créditos:', 20, 120)
    pdf.setFontSize(10)
    pdf.text(`Total de Créditos Disponíveis: R$ ${totalCreditos.toFixed(2)}`, 25, 130)
    pdf.text(`Total de Créditos (Membros): R$ ${creditosMembros.reduce((sum, c) => sum + c.valor, 0).toFixed(2)}`, 25, 137)
    pdf.text(`Total de Créditos (Não Membros): R$ ${creditosNaoMembros.reduce((sum, c) => sum + c.valor, 0).toFixed(2)}`, 25, 144)
    
    // Detalhes dos Créditos
    pdf.setFontSize(12)
    pdf.text('Detalhes dos Créditos:', 20, 165)
    
    // Cabeçalho da tabela
    pdf.setFontSize(8)
    pdf.text('Descrição', 20, 175)
    pdf.text('Valor', 80, 175)
    pdf.text('Data', 110, 175)
    pdf.text('Validade', 140, 175)
    pdf.text('Tipo', 170, 175)
    
    // Linha separadora
    pdf.line(20, 177, 190, 177)
    
    // Conteúdo da tabela
    let yPosition = 182
    creditosDisponiveis.forEach((credito) => {
      if (yPosition > 270) {
        pdf.addPage()
        yPosition = 30
      }
      
      pdf.text(credito.descricao || 'Crédito acumulado', 20, yPosition)
      pdf.text(`R$ ${credito.valor.toFixed(2)}`, 80, yPosition)
      pdf.text(new Date(credito.dataCredito).toLocaleDateString('pt-BR'), 110, yPosition)
      pdf.text(credito.validade ? new Date(credito.validade).toLocaleDateString('pt-BR') : 'N/A', 140, yPosition)
      pdf.text(credito.tipoCredito, 170, yPosition)
      
      yPosition += 7
    })
    
    // Rodapé
    pdf.setFontSize(8)
    pdf.text('Documento gerado em: ' + new Date().toLocaleDateString('pt-BR'), 20, 285)
    pdf.text('PPD+ - Todos os direitos reservados', 20, 290)
    
    // Gerar nome do arquivo
    const fileName = `mapa_credito_${associado.codigoConsumidor}_${new Date().toISOString().split('T')[0]}.pdf`
    
    // Converter PDF para base64
    const pdfBase64 = pdf.output('datauristring').split(',')[1]
    
    // Salvar informação do mapa de crédito no banco
    await db.createMapaCredito({
      associadoId: associado.id,
      titulo: `Mapa de Crédito - ${new Date().toLocaleDateString('pt-BR')}`,
      descricao: 'Mapa de crédito gerado automaticamente',
      dataValidade: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
      totalCreditos,
      creditosDetalhes: JSON.stringify(creditosDisponiveis)
    })
    
    return NextResponse.json({
      message: 'Mapa de crédito gerado com sucesso',
      arquivoPdf: `data:application/pdf;base64,${pdfBase64}`,
      fileName
    })
    
  } catch (error) {
    console.error('Erro ao gerar mapa de crédito:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}