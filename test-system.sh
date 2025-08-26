#!/bin/bash

echo "=== SISTEMA PPD+ - TESTE DE FUNCIONALIDADE ==="
echo ""

# Testar API de teste
echo "1. Testando API de teste..."
TEST_RESULT=$(curl -s http://localhost:3000/api/test)
TOTAL_ASSOCIADOS=$(echo $TEST_RESULT | python3 -c "import sys, json; print(json.load(sys.stdin)['totalAssociados'])")
ADMIN_ENCONTRADO=$(echo $TEST_RESULT | python3 -c "import sys, json; print(json.load(sys.stdin)['adminEncontrado'])")
SENHA_VALIDA=$(echo $TEST_RESULT | python3 -c "import sys, json; print(json.load(sys.stdin)['admin']['senhaValida'])")

echo "   Total de associados: $TOTAL_ASSOCIADOS"
echo "   Admin encontrado: $ADMIN_ENCONTRADO"
echo "   Senha do admin válida: $SENHA_VALIDA"
echo ""

# Testar login do admin
echo "2. Testando login do admin..."
LOGIN_RESULT=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"codigoConsumidor": "ADMIN001", "senha": "admin123"}')

LOGIN_SUCCESS=$(echo $LOGIN_RESULT | python3 -c "import sys, json; print('message' in json.load(sys.stdin))")
if [ "$LOGIN_SUCCESS" = "True" ]; then
    echo "   ✅ Login do admin realizado com sucesso!"
else
    echo "   ❌ Falha no login do admin!"
fi
echo ""

# Testar cadastro de novo usuário
echo "3. Testando cadastro de novo usuário..."
CADASTRO_RESULT=$(curl -s -X POST http://localhost:3000/api/associados \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Usuario Teste",
    "email": "usuario.teste@example.com",
    "senha": "teste123",
    "cpf": "12345678900",
    "tipoMembro": "MEMBRO"
  }')

CADASTRO_SUCCESS=$(echo $CADASTRO_RESULT | python3 -c "import sys, json; print('message' in json.load(sys.stdin))")
if [ "$CADASTRO_SUCCESS" = "True" ]; then
    echo "   ✅ Cadastro realizado com sucesso!"
    CODIGO_USUARIO=$(echo $CADASTRO_RESULT | python3 -c "import sys, json; print(json.load(sys.stdin)['associado']['codigoConsumidor'])")
    echo "   Código do usuário: $CODIGO_USUARIO"
else
    echo "   ❌ Falha no cadastro!"
fi
echo ""

# Testar login do novo usuário
if [ "$CADASTRO_SUCCESS" = "True" ]; then
    echo "4. Testando login do novo usuário..."
    LOGIN_USUARIO_RESULT=$(curl -s -X POST http://localhost:3000/api/auth/login \
      -H "Content-Type: application/json" \
      -d "{\"codigoConsumidor\": \"$CODIGO_USUARIO\", \"senha\": \"teste123\"}")
    
    LOGIN_USUARIO_SUCCESS=$(echo $LOGIN_USUARIO_RESULT | python3 -c "import sys, json; print('message' in json.load(sys.stdin))")
    if [ "$LOGIN_USUARIO_SUCCESS" = "True" ]; then
        echo "   ✅ Login do usuário realizado com sucesso!"
    else
        echo "   ❌ Falha no login do usuário!"
    fi
    echo ""
fi

echo "=== CREDENCIAIS PARA ACESSO ==="
echo "🔑 ADMINISTRADOR:"
echo "   Código: ADMIN001"
echo "   Senha: admin123"
echo ""
echo "👤 USUÁRIO DE TESTE:"
if [ "$CADASTRO_SUCCESS" = "True" ]; then
    echo "   Código: $CODIGO_USUARIO"
    echo "   Senha: teste123"
else
    echo "   (Não foi possível criar usuário de teste)"
fi
echo ""
echo "🌐 ACESSO:"
echo "   Página inicial: http://localhost:3000"
echo "   Cadastro: http://localhost:3000/cadastro"
echo "   Dashboard: http://localhost:3000/dashboard (após login)"
echo ""
echo "=== STATUS DO SISTEMA ==="
if [ "$ADMIN_ENCONTRADO" = "True" ] && [ "$SENHA_VALIDA" = "True" ] && [ "$LOGIN_SUCCESS" = "True" ]; then
    echo "✅ SISTEMA PPD+ FUNCIONANDO PERFEITAMENTE!"
else
    echo "❌ PROBLEMAS DETECTADOS NO SISTEMA!"
fi
echo ""