"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function Home() {
  const [codigoConsumidor, setCodigoConsumidor] = useState("")
  const [senha, setSenha] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const { login } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const success = await login(codigoConsumidor, senha)
      
      if (success) {
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo ao PPD+",
        })
        router.push("/dashboard")
      } else {
        toast({
          title: "Erro no login",
          description: "Código de consumidor ou senha inválidos",
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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Brand */}
        <div className="text-center space-y-4">
          <div className="w-24 h-24 mx-auto relative">
            <img
              src="/ppd-logo.png"
              alt="PPD+ Logo"
              className="w-full h-full object-contain drop-shadow-lg"
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">PPD+</h1>
            <p className="text-blue-200 text-sm">Projeto Poupança Disponível</p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-white text-center">
              Acessar Conta
            </CardTitle>
            <CardDescription className="text-blue-200 text-center">
              Entre com suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="codigo" className="text-white font-medium">
                  Código de Consumidor
                </Label>
                <Input
                  id="codigo"
                  type="text"
                  placeholder="Digite seu código de consumidor"
                  value={codigoConsumidor}
                  onChange={(e) => setCodigoConsumidor(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:border-blue-400 focus:ring-blue-400"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="senha" className="text-white font-medium">
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="senha"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:border-blue-400 focus:ring-blue-400 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 text-blue-200 hover:text-white hover:bg-white/10"
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

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 shadow-lg disabled:opacity-50"
              >
                {isLoading ? "Entrando..." : "Acessar"}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-blue-200 text-sm">
                Não tem uma conta?{" "}
                <a href="/register" className="text-green-400 hover:text-green-300 font-medium transition-colors">
                  Cadastre-se
                </a>
              </p>
              <p className="text-blue-200 text-sm">
                É administrador?{" "}
                <a href="/admin-login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                  Acesso administrativo
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}