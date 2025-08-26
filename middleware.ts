import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // Rotas que não requerem autenticação
  const publicRoutes = ['/', '/cadastro']
  
  // APIs públicas
  const publicApis = ['/api/auth/login', '/api/associados', '/api/test', '/api/debug']
  
  const { pathname } = request.nextUrl
  
  // Verificar se é uma rota pública
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }
  
  // Verificar se é uma API pública
  if (publicApis.some(api => pathname.startsWith(api))) {
    return NextResponse.next()
  }
  
  // Para rotas protegidas, verificar o token de autenticação
  // Em um sistema real, você usaria JWT ou outro método de autenticação
  const authHeader = request.headers.get('authorization')
  const codigoConsumidor = request.headers.get('x-codigo-consumidor')
  
  // Se não houver cabeçalho de autenticação, redirecionar para login
  if (!authHeader && !codigoConsumidor) {
    // Para APIs, retornar erro 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    // Para páginas, redirecionar para login
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  // Se houver código de consumidor, verificar se é válido
  if (codigoConsumidor) {
    try {
      // Nota: A verificação do associado será feita nas APIs individuais
      // para evitar importar o banco de dados no middleware
      
      // Adicionar informações do associado ao request
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-codigo-consumidor', codigoConsumidor)
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    } catch (error) {
      console.error('Erro na verificação de autenticação:', error)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}