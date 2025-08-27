'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PiggyBank, User, Mail, Phone, Calendar, MapPin, CreditCard, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

export default function CadastroPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    telefone: '',
    mec: '',
    dataNascimento: '',
    endereco: '',
    cep: '',
    cidade: '',
    estado: '',
    tipoMembro: 'MEMBRO'
  })
  const { toast } = useToast()

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value
    
    // Formatar telefone para formato angolano
    if (field === 'telefone') {
      // Remover todos os caracteres não numéricos, exceto o +
      let cleaned = value.replace(/[^\d+]/g, '')
      
      // Se começar com 244, substituir por +244
      if (cleaned.startsWith('244') && !cleaned.startsWith('+')) {
        cleaned = '+' + cleaned
      }
      
      // Se não começar com +244, adicionar o prefixo
      if (!cleaned.startsWith('+244') && cleaned.length > 0) {
        cleaned = '+244' + cleaned.replace(/^0+/, '')
      }
      
      // Limitar ao formato +2449XXXXXXXX (12 dígitos após o +244)
      if (cleaned.length > 13) {
        cleaned = cleaned.substring(0, 13)
      }
      
      formattedValue = cleaned
    }
    
    // Formatar MEC para 6 dígitos
    if (field === 'mec' || field === 'mec') {
      // Remover todos os caracteres não numéricos
      let cleaned = value.replace(/\D/g, '')
      
      // Limitar a 6 dígitos
      if (cleaned.length > 6) {
        cleaned = cleaned.substring(0, 6)
      }
      
      formattedValue = cleaned
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: formattedValue
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validações
    if (!formData.nome || !formData.email || !formData.senha || !formData.mec) {
      toast({
        title: "Erro de validação",
        description: "Nome, email, senha e MEC são obrigatórios.",
        variant: "destructive",
      })
      return
    }

    // Validar formato de telefone angolano
    if (formData.telefone && !formData.telefone.match(/^\+2449\d{8}$/)) {
      toast({
        title: "Erro de validação",
        description: "Telefone deve estar no formato +2449XXXXXXXX (ex: +244927000000).",
        variant: "destructive",
      })
      return
    }

    // Validar formato de MEC (se fornecido)
    if (formData.mec && !formData.mec.match(/^\d{6}$/)) {
      toast({
        title: "Erro de validação",
        description: "MEC deve conter 6 dígitos.",
        variant: "destructive",
      })
      return
    }

    if (formData.senha !== formData.confirmarSenha) {
      toast({
        title: "Erro de validação",
        description: "As senhas não coincidem.",
        variant: "destructive",
      })
      return
    }

    if (formData.senha.length < 6) {
      toast({
        title: "Erro de validação",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/associados', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: formData.nome,
          email: formData.email,
          senha: formData.senha,
          telefone: formData.telefone,
          mec: formData.mec,
          dataNascimento: formData.dataNascimento,
          endereco: formData.endereco,
          cep: formData.cep,
          cidade: formData.cidade,
          estado: formData.estado,
          tipoMembro: formData.tipoMembro
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Cadastro realizado com sucesso!",
          description: `Seu código de consumidor é: ${data.associado.codigoConsumidor}`,
        })
        
        // Redirecionar para a página principal após um pequeno delay
        setTimeout(() => {
          window.location.href = '/'
        }, 3000)
      } else {
        const error = await response.json()
        toast({
          title: "Erro no cadastro",
          description: error.error || "Não foi possível realizar o cadastro.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para o login
          </Link>
          <div className="flex justify-center mt-4">
            <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full">
              <PiggyBank className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white">Cadastro PPD+</h1>
          <p className="text-gray-300">Projeto Poupança Disponível (PPD)</p>
        </div>

        {/* Card de Cadastro */}
        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700 text-white">
          <CardHeader>
            <CardTitle className="text-xl text-center">Criar sua conta</CardTitle>
            <CardDescription className="text-gray-300 text-center">
              Preencha os dados abaixo para se cadastrar no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nome */}
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-gray-300">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="nome"
                      type="text"
                      placeholder="Digite seu nome completo"
                      value={formData.nome}
                      onChange={(e) => handleInputChange('nome', e.target.value)}
                      className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Digite seu email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      required
                    />
                  </div>
                </div>

                {/* MEC */}
                <div className="space-y-2">
                  <Label htmlFor="mec" className="text-gray-300">MEC</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="mec"
                      type="text"
                      placeholder="000000"
                      value={formData.mec}
                      onChange={(e) => handleInputChange('mec', e.target.value)}
                      className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-400">Formato: 6 dígitos (ex: 008814)</p>
                </div>

                {/* Telefone */}
                <div className="space-y-2">
                  <Label htmlFor="telefone" className="text-gray-300">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="telefone"
                      type="tel"
                      placeholder="+244927000000"
                      value={formData.telefone}
                      onChange={(e) => handleInputChange('telefone', e.target.value)}
                      className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                  </div>
                  <p className="text-xs text-gray-400">Formato: +244927000000</p>
                </div>

                {/* Data de Nascimento */}
                <div className="space-y-2">
                  <Label htmlFor="dataNascimento" className="text-gray-300">Data de Nascimento</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="dataNascimento"
                      type="date"
                      value={formData.dataNascimento}
                      onChange={(e) => handleInputChange('dataNascimento', e.target.value)}
                      className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                  </div>
                </div>

                {/* Tipo de Membro */}
                <div className="space-y-2">
                  <Label htmlFor="tipoMembro" className="text-gray-300">Tipo de Membro</Label>
                  <Select value={formData.tipoMembro} onValueChange={(value) => handleInputChange('tipoMembro', value)}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="MEMBRO" className="text-white">Membro</SelectItem>
                      <SelectItem value="NAO_MEMBRO" className="text-white">Não Membro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Senha */}
                <div className="space-y-2">
                  <Label htmlFor="senha" className="text-gray-300">Senha</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="senha"
                      type={showPassword ? "text" : "password"}
                      placeholder="Digite sua senha"
                      value={formData.senha}
                      onChange={(e) => handleInputChange('senha', e.target.value)}
                      className="pl-10 pr-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      required
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

                {/* Confirmar Senha */}
                <div className="space-y-2">
                  <Label htmlFor="confirmarSenha" className="text-gray-300">Confirmar Senha</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="confirmarSenha"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirme sua senha"
                      value={formData.confirmarSenha}
                      onChange={(e) => handleInputChange('confirmarSenha', e.target.value)}
                      className="pl-10 pr-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-gray-600"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-2">
                <Label htmlFor="endereco" className="text-gray-300">Endereço</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="endereco"
                    type="text"
                    placeholder="Digite seu endereço"
                    value={formData.endereco}
                    onChange={(e) => handleInputChange('endereco', e.target.value)}
                    className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* CODIGO POSTAL */}
                <div className="space-y-2">
                  <Label htmlFor="cep" className="text-gray-300">CEP</Label>
                  <Input
                    id="cep"
                    type="text"
                    placeholder="000000"
                    value={formData.cep}
                    onChange={(e) => handleInputChange('cep', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                  <p className="text-xs text-gray-400">Formato: 6 dígitos (ex: 000000)</p>
                </div>

                {/* Cidade */}
                <div className="space-y-2">
                  <Label htmlFor="cidade" className="text-gray-300">Cidade</Label>
                  <Input
                    id="cidade"
                    type="text"
                    placeholder="Sua cidade"
                    value={formData.cidade}
                    onChange={(e) => handleInputChange('cidade', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>

                {/* Província */}
                <div className="space-y-2">
                  <Label htmlFor="estado" className="text-gray-300">Província</Label>
                  <Input
                    id="estado"
                    type="text"
                    placeholder="Luanda"
                    value={formData.estado}
                    onChange={(e) => handleInputChange('estado', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={loading}
              >
                {loading ? 'Cadastrando...' : 'Cadastrar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}