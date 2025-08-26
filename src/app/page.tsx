"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { PiggyBank, User, Lock, Eye, EyeOff } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [consumerCode, setConsumerCode] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consumerCode: consumerCode,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Login realizado com sucesso!",
          description: `Bem-vindo, ${data.member.name}!`,
        });
        
        // Armazenar dados do usuário no localStorage (em produção, usar cookies seguros)
        localStorage.setItem('ppd_user', JSON.stringify(data));
        
        // Redirecionar para o dashboard
        router.push('/dashboard');
      } else {
        toast({
          title: "Erro de autenticação",
          description: data.error || "Código de consumidor ou senha inválidos",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro no login:', error);
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    router.push('/register');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="p-4 bg-emerald-500 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <PiggyBank className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">PPD+</h1>
          <p className="text-slate-400">Projeto Poupança Disponível</p>
        </div>

        {/* Login Form */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Acessar Conta</CardTitle>
            <CardDescription className="text-slate-400">
              Entre com seu código de consumidor e senha
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="consumerCode">Código de Consumidor</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="consumerCode"
                    type="text"
                    placeholder="Digite seu código"
                    value={consumerCode}
                    onChange={(e) => setConsumerCode(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-slate-800 border-slate-600 text-white placeholder-slate-400"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 text-slate-400 hover:text-white"
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
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Acessando...</span>
                  </div>
                ) : (
                  "Acessar"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button 
                onClick={handleRegister}
                variant="ghost" 
                className="text-slate-400 hover:text-white"
              >
                Não tem uma conta? Cadastre-se
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}