"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Shield, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function AdminLogin() {
  const [codigoConsumidor, setCodigoConsumidor] = useState("")
  const [senha, setSenha] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ codigoConsumidor, senha }),
      })

      const data = await response.json()

      if (response.ok) {
        // Store admin session
        localStorage.setItem('ppd_admin_user', JSON.stringify(data.user))
        
        toast({
          title: "Login de administrador realizado com sucesso!",
          description: "Bem-vindo ao painel de administração",
        })
        router.push("/admin")
      } else {
        toast({
          title: "Erro no login",
          description: data.error || "Código de consumidor ou senha inválidos",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro no login",
        description: "Ocorreu um erro ao tentar fazer login",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Back Button */}
        <div className="flex items-center space-x-2">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-purple-200 hover:text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>

        {/* Logo and Brand */}
        <div className="text-center space-y-4">
          <div className="w-24 h-24 mx-auto relative">
            <div className="w-full h-full bg-purple-600 rounded-full flex items-center justify-center">
              <Shield className="h-12 w-12 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">PPD+ Admin</h1>
            <p className="text-purple-200 text-sm">Painel de Administração</p>
          </div>
        </div>

        {/* Admin Login Card */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-white text-center">
              Acesso Administrativo
            </CardTitle>
            <CardDescription className="text-purple-200 text-center">
              Entre com suas credenciais de administrador
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="codigo" className="text-white font-medium">
                  Código de Administrador
                </Label>
                <Input
                  id="codigo"
                  type="text"
                  placeholder="Digite seu código de administrador"
                  value={codigoConsumidor}
                  onChange={(e) => setCodigoConsumidor(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-purple-200 focus:border-purple-400 focus:ring-purple-400"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="senha" className="text-white font-medium">
                  Senha de Administrador
                </Label>
                <div className="relative">
                  <Input
                    id="senha"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-purple-200 focus:border-purple-400 focus:ring-purple-400 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 text-purple-200 hover:text-white hover:bg-white/10"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="bg-purple-800/30 border border-purple-600 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-purple-400" />
                  <p className="text-purple-200 text-sm">
                    Acesso restrito a administradores autorizados
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 shadow-lg disabled:opacity-50"
              >
                {isLoading ? "Entrando..." : "Acessar Painel"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-purple-200 text-sm">
                É um usuário comum?{" "}
                <Link href="/" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                  Acesso de usuário
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}