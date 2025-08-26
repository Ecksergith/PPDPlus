'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PiggyBank, User, Lock, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

export default function Home() {
  const [showPassword, setShowPassword] = useState(false)
  const [codigoConsumidor, setCodigoConsumidor] = useState('')
  const [senha, setSenha] = useState('')
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!codigoConsumidor || !senha) {
      toast({
        title: "Erro de autenticação",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ codigoConsumidor, senha }),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Login realizado com sucesso!",
          description: "Redirecionando para o dashboard...",
        })
        
        // Armazenar código do consumidor no localStorage
        localStorage.setItem('codigoConsumidor', codigoConsumidor)
        
        // Redirecionar para o dashboard após um pequeno delay
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 1500)
      } else {
        toast({
          title: "Erro de autenticação",
          description: "Código de consumidor ou senha inválidos.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo e Título */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full">
              <PiggyBank className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white">PPD+</h1>
          <p className="text-gray-300">Projeto Poupança Disponível (PPD)</p>
        </div>

        {/* Card de Login/Cadastro */}
        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700 text-white">
          <CardHeader>
            <CardTitle className="text-xl text-center">Bem-vindo</CardTitle>
            <CardDescription className="text-gray-300 text-center">
              Acesse sua conta de poupança
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-700">
                <TabsTrigger value="login" className="text-white">Login</TabsTrigger>
                <TabsTrigger value="register" className="text-white">Cadastro</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="codigo" className="text-gray-300">Código de Consumidor</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="codigo"
                        type="text"
                        placeholder="Digite seu código"
                        value={codigoConsumidor}
                        onChange={(e) => setCodigoConsumidor(e.target.value)}
                        className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="senha" className="text-gray-300">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="senha"
                        type={showPassword ? "text" : "password"}
                        placeholder="Digite sua senha"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        className="pl-10 pr-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-gray-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                    Entrar
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register" className="space-y-4">
                <div className="text-center py-4">
                  <p className="text-gray-300 mb-4">
                    Para se cadastrar no PPD+, clique no botão abaixo.
                  </p>
                  <Link href="/cadastro">
                    <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                      Fazer Cadastro
                    </Button>
                  </Link>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Informações adicionais */}
        <div className="text-center text-gray-400 text-sm">
          <p>© 2025 PPD+ - Projeto Poupança Disponível</p>
          <p className="mt-1">Consulta segura de créditos acumulados</p>
        </div>
      </div>
    </div>
  )
}