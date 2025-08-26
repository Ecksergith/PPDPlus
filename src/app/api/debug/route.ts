import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/binary-db'

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    const db = getDatabase()

    switch (action) {
      case 'reset':
        await db.resetDatabase()
        return NextResponse.json({ message: 'Banco de dados resetado com sucesso!' })
      
      case 'debug':
        db.debugListAssociados()
        const stats = db.getStats()
        return NextResponse.json({ 
          message: 'Debug information logged to console',
          stats 
        })
      
      case 'backup':
        const backupPath = await db.backup()
        return NextResponse.json({ 
          message: 'Backup criado com sucesso!',
          backupPath 
        })
      
      default:
        return NextResponse.json(
          { error: 'Ação não reconhecida' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Erro na API de debug:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}