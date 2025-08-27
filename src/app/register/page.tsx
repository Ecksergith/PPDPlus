"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  PiggyBank, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  FileText,
  ArrowLeft,
  CheckCircle,
  Loader2
} from "lucide-react";

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  document: string;
  address: string;
  city: string;
  state: string;
  birthDate: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [consumerCode, setConsumerCode] = useState("");
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    document: "",
    address: "",
    city: "",
    state: "",
    birthDate: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpar erro quando o usuário começa a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório";
    } else if (formData.name.length < 3) {
      newErrors.name = "Nome deve ter pelo menos 3 caracteres";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Senha é obrigatória";
    } else if (formData.password.length < 6) {
      newErrors.password = "Senha deve ter pelo menos 6 caracteres";
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Confirmação de senha é obrigatória";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Senhas não coincidem";
    }

    if (!formData.document.trim()) {
      newErrors.document = "Código MEC é obrigatório";
    } else if (formData.document.length !== 6) {
      newErrors.document = "Código MEC deve ter exatamente 6 dígitos";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Erro de validação",
        description: "Por favor, verifique os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/members/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setConsumerCode(data.member.consumerCode);
        setIsSubmitted(true);
        toast({
          title: "Cadastro realizado com sucesso!",
          description: `Seu código de consumidor é: ${data.member.consumerCode}`,
        });
      } else {
        toast({
          title: "Erro no cadastro",
          description: data.error || "Ocorreu um erro ao realizar o cadastro",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao cadastrar:', error);
      toast({
        title: "Erro no cadastro",
        description: "Ocorreu um erro ao realizar o cadastro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatMEC = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{6})(\d+)?/, '$1')
      .substring(0, 6);
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '+244$1 $2')
      .replace(/(\d{3})(\d)/, '$1 $2')
      .replace(/(\d{4})(\d+)?$/, '$1');
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Cadastro Concluído!</h2>
              <p className="text-slate-300 mb-6">
                Seu cadastro no PPD+ foi realizado com sucesso.
              </p>
            </div>

            <div className="bg-slate-700 rounded-lg p-4 mb-6">
              <p className="text-sm text-slate-400 mb-2">Seu Código de Consumidor</p>
              <div className="text-2xl font-mono font-bold text-emerald-400">
                {consumerCode}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Guarde este código em local seguro. Ele será necessário para acessar sua conta.
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={() => router.push('/')}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                Ir para Login
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsSubmitted(false);
                  setFormData({
                    name: "",
                    email: "",
                    password: "",
                    confirmPassword: "",
                    phone: "",
                    document: "",
                    address: "",
                    city: "",
                    state: "",
                    birthDate: "",
                  });
                }}
                className="w-full border-slate-600 text-white hover:bg-slate-700"
              >
                Cadastrar outro associado
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => router.push('/')}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-500 rounded-lg">
                <PiggyBank className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">PPD+</h1>
                <p className="text-xs text-slate-400">Cadastro de Associados</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 mb-4">
              Novo Cadastro
            </Badge>
            <h2 className="text-3xl font-bold mb-4">Junte-se ao PPD+</h2>
            <p className="text-lg text-slate-300">
              Preencha o formulário abaixo para se tornar um associado do Projeto Poupança Disponível.
            </p>
          </div>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl">Formulário de Cadastro</CardTitle>
              <CardDescription className="text-slate-400">
                Os campos marcados com * são obrigatórios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Seu nome completo"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white placeholder-slate-400"
                    />
                    {errors.name && <p className="text-red-400 text-sm">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white placeholder-slate-400"
                    />
                    {errors.email && <p className="text-red-400 text-sm">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Senha *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Digite sua senha"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white placeholder-slate-400"
                    />
                    {errors.password && <p className="text-red-400 text-sm">{errors.password}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirme sua senha"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white placeholder-slate-400"
                    />
                    {errors.confirmPassword && <p className="text-red-400 text-sm">{errors.confirmPassword}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="document">Código MEC *</Label>
                    <Input
                      id="document"
                      type="text"
                      placeholder="123456"
                      value={formData.document}
                      onChange={(e) => handleInputChange('document', formatMEC(e.target.value))}
                      className="bg-slate-800 border-slate-600 text-white placeholder-slate-400"
                      maxLength={6}
                    />
                    {errors.document && <p className="text-red-400 text-sm">{errors.document}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+244 927 000 000"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', formatPhone(e.target.value))}
                      className="bg-slate-800 border-slate-600 text-white placeholder-slate-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birthDate">Data de Nascimento</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => handleInputChange('birthDate', e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white placeholder-slate-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      type="text"
                      placeholder="Luanda"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white placeholder-slate-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">Província</Label>
                    <Input
                      id="state"
                      type="text"
                      placeholder="Luanda"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white placeholder-slate-400"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      type="text"
                      placeholder="Rua, número, complemento"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white placeholder-slate-400"
                    />
                  </div>
                </div>

                <Alert className="bg-slate-800 border-slate-600">
                  <AlertDescription className="text-slate-300">
                    Ao se cadastrar, você concorda com os Termos de Uso e Política de Privacidade do PPD+.
                    Seus dados serão protegidos de acordo com nossa política de segurança.
                  </AlertDescription>
                </Alert>

                <Button 
                  type="submit" 
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Cadastrando...</span>
                    </div>
                  ) : (
                    "Realizar Cadastro"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}