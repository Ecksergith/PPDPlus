import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jsPDF from 'jspdf'

export async function POST(request: NextRequest) {
  try {
    const { userId, adminId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }

    // If adminId is provided, verify it's an admin
    if (adminId) {
      const admin = await db.findUserById(adminId)
      if (!admin || !admin.isAdmin) {
        return NextResponse.json(
          { error: 'Administrador não encontrado ou sem permissão' },
          { status: 403 }
        )
      }
    }

    // Get user data
    const user = await db.findUserById(userId)

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Get user's credits
    const credits = await db.getCreditsByUserId(userId)

    // Get user's payments
    const payments = await db.getPaymentsByUserId(userId)

    // Calculate totals
    const totalCredit = credits.reduce((sum, credit) => sum + credit.valor, 0)
    const totalJuros = credits.reduce((sum, credit) => sum + credit.juros, 0)
    const totalValorTotal = credits.reduce((sum, credit) => sum + credit.valorTotal, 0)
    const totalPaid = payments
      .filter(p => p.status === 'confirmado')
      .reduce((sum, payment) => sum + payment.valor, 0)
    const totalPending = totalValorTotal - totalPaid

    // Create PDF
    const doc = new jsPDF()
    
    // Title
    doc.setFontSize(20)
    doc.text('Mapa de Crédito - PPD+', 20, 30)
    
    // User info
    doc.setFontSize(12)
    doc.text(`Nome: ${user.nome}`, 20, 50)
    doc.text(`Código de Consumidor: ${user.codigoConsumidor}`, 20, 60)
    doc.text(`Status: ${user.isMembro ? 'Membro' : 'Não-membro'}`, 20, 70)
    if (user.email) doc.text(`Email: ${user.email}`, 20, 80)
    if (user.telefone) doc.text(`Telefone: ${user.telefone}`, 20, 90)
    
    // Summary
    doc.setFontSize(14)
    doc.text('Resumo Financeiro', 20, 110)
    doc.setFontSize(10)
    doc.text(`Total Crédito: AOA ${totalCredit.toLocaleString()}`, 20, 120)
    doc.text(`Total Juros: AOA ${totalJuros.toLocaleString()}`, 20, 130)
    doc.text(`Total a Pagar: AOA ${totalValorTotal.toLocaleString()}`, 20, 140)
    doc.text(`Total Pago: AOA ${totalPaid.toLocaleString()}`, 20, 150)
    doc.text(`Total Pendente: AOA ${totalPending.toLocaleString()}`, 20, 160)
    
    // Credits table
    let yPosition = 180
    doc.setFontSize(14)
    doc.text('Créditos', 20, yPosition)
    yPosition += 10
    
    doc.setFontSize(8)
    doc.text('ID', 20, yPosition)
    doc.text('Valor', 50, yPosition)
    doc.text('Juros', 80, yPosition)
    doc.text('Total', 110, yPosition)
    doc.text('Status', 140, yPosition)
    doc.text('Data', 170, yPosition)
    yPosition += 10
    
    credits.forEach((credit) => {
      if (yPosition > 270) {
        doc.addPage()
        yPosition = 30
      }
      
      doc.text(credit.id.slice(0, 8), 20, yPosition)
      doc.text(credit.valor.toLocaleString(), 50, yPosition)
      doc.text(credit.juros.toLocaleString(), 80, yPosition)
      doc.text(credit.valorTotal.toLocaleString(), 110, yPosition)
      doc.text(credit.status, 140, yPosition)
      doc.text(new Date(credit.dataSolicitacao).toLocaleDateString(), 170, yPosition)
      yPosition += 10
    })
    
    // Payments table
    yPosition += 20
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 30
    }
    
    doc.setFontSize(14)
    doc.text('Pagamentos', 20, yPosition)
    yPosition += 10
    
    doc.setFontSize(8)
    doc.text('ID', 20, yPosition)
    doc.text('Valor', 50, yPosition)
    doc.text('Método', 80, yPosition)
    doc.text('Status', 120, yPosition)
    doc.text('Data', 150, yPosition)
    yPosition += 10
    
    payments.forEach((payment) => {
      if (yPosition > 270) {
        doc.addPage()
        yPosition = 30
      }
      
      doc.text(payment.id.slice(0, 8), 20, yPosition)
      doc.text(payment.valor.toLocaleString(), 50, yPosition)
      doc.text(payment.metodo || '', 80, yPosition)
      doc.text(payment.status, 120, yPosition)
      doc.text(new Date(payment.dataPagamento).toLocaleDateString(), 150, yPosition)
      yPosition += 10
    })
    
    // Footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.text(
        `PPD+ - Projeto Poupança Disponível - Página ${i} de ${pageCount}`,
        20,
        285
      )
      doc.text(
        `Gerado em: ${new Date().toLocaleString()}`,
        150,
        285
      )
    }
    
    // Generate PDF as buffer
    const pdfBuffer = doc.output('arraybuffer')
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="mapa-credito-${user.codigoConsumidor}.pdf"`
      }
    })

  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}