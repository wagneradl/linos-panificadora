#!/bin/bash

# Script de teste manual da API - Linos Panificadora
# Execute depois de iniciar o backend com: yarn workspace @linos/backend dev

set -e

BASE_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "================================================"
echo "  🧪 TESTES MANUAIS - API Linos Panificadora"
echo "================================================"
echo ""

# Função auxiliar para fazer requisições
make_request() {
  local method=$1
  local endpoint=$2
  local data=$3
  local token=$4
  local description=$5

  echo -e "${YELLOW}[TEST]${NC} $description"
  echo "→ $method $endpoint"

  if [ -z "$token" ]; then
    if [ -z "$data" ]; then
      response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X "$method" "$BASE_URL$endpoint" \
        -H "Content-Type: application/json")
    else
      response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X "$method" "$BASE_URL$endpoint" \
        -H "Content-Type: application/json" \
        -d "$data")
    fi
  else
    if [ -z "$data" ]; then
      response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X "$method" "$BASE_URL$endpoint" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json")
    else
      response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X "$method" "$BASE_URL$endpoint" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        -d "$data")
    fi
  fi

  http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
  body=$(echo "$response" | sed '/HTTP_CODE:/d')

  if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
    echo -e "${GREEN}✓ Success${NC} (HTTP $http_code)"
  else
    echo -e "${RED}✗ Failed${NC} (HTTP $http_code)"
  fi

  echo "$body" | jq '.' 2>/dev/null || echo "$body"
  echo ""

  echo "$body"
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  Testando Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
make_request "GET" "/health" "" "" "Health check endpoint (público)"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  Testando Autenticação"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Login
login_data='{
  "emailOrUsername": "admin@linospanificadora.com",
  "password": "admin123"
}'

login_response=$(make_request "POST" "/auth/login" "$login_data" "" "Login com admin")

# Extrair accessToken
ACCESS_TOKEN=$(echo "$login_response" | jq -r '.accessToken' 2>/dev/null)

if [ "$ACCESS_TOKEN" == "null" ] || [ -z "$ACCESS_TOKEN" ]; then
  echo -e "${RED}✗ Falha ao obter token de acesso. Abortando testes.${NC}"
  echo -e "${YELLOW}⚠️  Certifique-se de que:${NC}"
  echo "   1. O backend está rodando (yarn workspace @linos/backend dev)"
  echo "   2. O seed foi executado (yarn workspace @linos/backend prisma db seed)"
  echo "   3. As credenciais no seed são: admin@linospanificadora.com / admin123"
  exit 1
fi

echo -e "${GREEN}✓ Token obtido com sucesso${NC}"
echo "Token: ${ACCESS_TOKEN:0:30}..."
echo ""

# Testar /auth/me
make_request "GET" "/auth/me" "" "$ACCESS_TOKEN" "Obter dados do usuário autenticado"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  Testando Proteção de Rotas"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Tentar acessar /produtos sem token (deve falhar com 401)
echo -e "${YELLOW}[TEST]${NC} Tentar acessar produtos SEM token (deve falhar)"
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE_URL/produtos" 2>/dev/null || echo "HTTP_CODE:000")
http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)

if [ "$http_code" == "401" ]; then
  echo -e "${GREEN}✓ Correto${NC} - Rota protegida (HTTP 401)"
else
  echo -e "${RED}✗ Falha${NC} - Esperado 401, recebido $http_code"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  Testando CRUD de Produtos"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Listar produtos
produtos_response=$(make_request "GET" "/produtos" "" "$ACCESS_TOKEN" "Listar todos os produtos")

# Criar produto
produto_data='{
  "nome": "Pão Francês",
  "descricao": "Pão fresquinho do dia",
  "preco": 0.5,
  "estoque": 100,
  "unidade": "unidade"
}'
create_response=$(make_request "POST" "/produtos" "$produto_data" "$ACCESS_TOKEN" "Criar novo produto")
PRODUTO_ID=$(echo "$create_response" | jq -r '.id' 2>/dev/null)

if [ "$PRODUTO_ID" != "null" ] && [ -n "$PRODUTO_ID" ]; then
  echo -e "${GREEN}✓ Produto criado com ID: $PRODUTO_ID${NC}"
  echo ""

  # Buscar produto por ID
  make_request "GET" "/produtos/$PRODUTO_ID" "" "$ACCESS_TOKEN" "Buscar produto por ID"

  # Atualizar produto
  update_data='{
    "preco": 0.60,
    "estoque": 150
  }'
  make_request "PATCH" "/produtos/$PRODUTO_ID" "$update_data" "$ACCESS_TOKEN" "Atualizar preço e estoque"

  # Deletar produto
  make_request "DELETE" "/produtos/$PRODUTO_ID" "" "$ACCESS_TOKEN" "Deletar produto"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  Testando CRUD de Clientes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Criar cliente
cliente_data='{
  "nome": "João Silva",
  "email": "joao@example.com",
  "telefone": "11999999999",
  "endereco": "Rua Teste, 123"
}'
cliente_response=$(make_request "POST" "/clientes" "$cliente_data" "$ACCESS_TOKEN" "Criar novo cliente")
CLIENTE_ID=$(echo "$cliente_response" | jq -r '.id' 2>/dev/null)

if [ "$CLIENTE_ID" != "null" ] && [ -n "$CLIENTE_ID" ]; then
  echo -e "${GREEN}✓ Cliente criado com ID: $CLIENTE_ID${NC}"
  echo ""

  # Listar clientes
  make_request "GET" "/clientes" "" "$ACCESS_TOKEN" "Listar todos os clientes"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6️⃣  Testando Fluxo de Pedidos (com transação)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$PRODUTO_ID" != "null" ] && [ "$CLIENTE_ID" != "null" ] && [ -n "$PRODUTO_ID" ] && [ -n "$CLIENTE_ID" ]; then
  # Recriar produto para testar pedido
  produto_data='{
    "nome": "Pão de Queijo",
    "preco": 1.5,
    "estoque": 50
  }'
  produto_response=$(make_request "POST" "/produtos" "$produto_data" "$ACCESS_TOKEN" "Criar produto para pedido")
  PRODUTO_ID=$(echo "$produto_response" | jq -r '.id' 2>/dev/null)

  # Criar pedido
  pedido_data=$(cat <<EOF
{
  "clienteId": $CLIENTE_ID,
  "observacoes": "Entrega pela manhã",
  "itens": [
    {
      "produtoId": $PRODUTO_ID,
      "quantidade": 10
    }
  ]
}
EOF
)
  pedido_response=$(make_request "POST" "/pedidos" "$pedido_data" "$ACCESS_TOKEN" "Criar pedido (transação: criar pedido + atualizar estoque)")
  PEDIDO_ID=$(echo "$pedido_response" | jq -r '.id' 2>/dev/null)

  if [ "$PEDIDO_ID" != "null" ] && [ -n "$PEDIDO_ID" ]; then
    echo -e "${GREEN}✓ Pedido criado com ID: $PEDIDO_ID${NC}"
    echo ""

    # Verificar estoque foi decrementado
    make_request "GET" "/produtos/$PRODUTO_ID" "" "$ACCESS_TOKEN" "Verificar estoque após pedido (deve ser 40)"

    # Cancelar pedido
    make_request "POST" "/pedidos/$PEDIDO_ID/cancelar" "" "$ACCESS_TOKEN" "Cancelar pedido (transação: reverter estoque)"

    # Verificar estoque foi revertido
    make_request "GET" "/produtos/$PRODUTO_ID" "" "$ACCESS_TOKEN" "Verificar estoque após cancelamento (deve voltar a 50)"
  fi
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7️⃣  Testando Validações"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Produto com preço negativo (deve falhar)
invalid_produto='{
  "nome": "Produto Inválido",
  "preco": -10
}'
echo -e "${YELLOW}[TEST]${NC} Criar produto com preço negativo (deve falhar com 400)"
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/produtos" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$invalid_produto")
http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_CODE:/d')

if [ "$http_code" == "400" ]; then
  echo -e "${GREEN}✓ Correto${NC} - Validação funcionou (HTTP 400)"
else
  echo -e "${RED}✗ Falha${NC} - Esperado 400, recebido $http_code"
fi
echo "$body" | jq '.' 2>/dev/null || echo "$body"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "8️⃣  Testando Refresh Token"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Extrair refresh token do login
REFRESH_TOKEN=$(echo "$login_response" | jq -r '.refreshToken' 2>/dev/null)

if [ "$REFRESH_TOKEN" != "null" ] && [ -n "$REFRESH_TOKEN" ]; then
  refresh_data="{\"refreshToken\": \"$REFRESH_TOKEN\"}"
  make_request "POST" "/auth/refresh" "$refresh_data" "" "Obter novo access token usando refresh token"
fi

echo "================================================"
echo "  ✅ TESTES CONCLUÍDOS"
echo "================================================"
echo ""
echo -e "${YELLOW}📊 Resumo:${NC}"
echo "• Health check"
echo "• Autenticação (login, refresh, me)"
echo "• Proteção de rotas (JWT Guards)"
echo "• CRUD Produtos (create, read, update, delete)"
echo "• CRUD Clientes"
echo "• Fluxo de Pedidos com transações (estoque)"
echo "• Validações de DTOs"
echo ""
echo -e "${GREEN}Para executar novamente:${NC}"
echo "  ./test-api.sh"
