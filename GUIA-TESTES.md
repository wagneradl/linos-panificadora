# 🧪 Guia de Testes - Linos Panificadora Backend

Este documento explica como testar o backend localmente após fazer checkout da branch com as alterações.

## 📋 Pré-requisitos

- Node.js >= 18.0.0
- Yarn instalado
- Git
- curl e jq (para script automatizado)

## 🚀 Setup Inicial

### 1. Checkout da Branch

```bash
cd /caminho/do/seu/projeto
git checkout claude/claude-md-mhz7uvvnxkolv3kl-01PUzfKznGdqzC41zWpFkYZt
```

### 2. Instalar Dependências

```bash
yarn install
```

### 3. Configurar Environment Variables

```bash
# Backend
cp apps/backend/.env.example apps/backend/.env

# Edite o arquivo apps/backend/.env:
nano apps/backend/.env
```

**Configuração mínima para testes locais:**

```env
# Database
DATABASE_URL="file:./prisma/dev.db"
NODE_ENV="development"
PORT="3000"

# JWT (pode usar defaults em dev, mas troque em produção!)
JWT_SECRET="dev-secret-key-change-in-production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="dev-refresh-secret-change-in-production"
JWT_REFRESH_EXPIRES_IN="7d"

# Admin Seed (credenciais do admin inicial)
ADMIN_EMAIL="admin@linospanificadora.com"
ADMIN_PASSWORD="admin123"
ADMIN_FULL_NAME="Administrador do Sistema"

# PDF Storage (opcional para testes)
PDF_STORAGE_PATH="./pdfs"
```

### 4. Gerar Prisma Client

```bash
yarn workspace @linos/backend prisma generate
```

**⚠️ Se der erro 403 Forbidden:**
- Você está em ambiente com bloqueio de rede
- Tente em outra máquina ou rede
- Ou use Docker (veja seção Docker abaixo)

### 5. Executar Migrations

```bash
yarn workspace @linos/backend prisma migrate deploy
```

### 6. Popular Database (Seed)

```bash
yarn workspace @linos/backend prisma db seed
```

**Isso cria o usuário admin com:**
- Email: `admin@linospanificadora.com`
- Password: `admin123`
- Role: `ADMIN`

### 7. (Opcional) Abrir Prisma Studio

Para visualizar o banco de dados graficamente:

```bash
yarn workspace @linos/backend prisma studio
```

Acesse: http://localhost:5555

---

## 🏃 Executando o Backend

### Modo Desenvolvimento (watch mode)

```bash
yarn workspace @linos/backend dev
```

O servidor estará disponível em: **http://localhost:3000**

### Modo Produção

```bash
# Build
yarn workspace @linos/backend build

# Start
yarn workspace @linos/backend start:prod
```

---

## ✅ Testes Manuais

### Opção 1: Script Automatizado (Recomendado)

Na raiz do projeto:

```bash
./test-api.sh
```

**O que o script testa:**
1. ✅ Health check endpoint
2. ✅ Autenticação (login, refresh token, obter dados do usuário)
3. ✅ Proteção de rotas (JWT Guards)
4. ✅ CRUD de Produtos (create, read, update, delete)
5. ✅ CRUD de Clientes
6. ✅ Fluxo de Pedidos com transações (criação de pedido decrementa estoque, cancelamento reverte)
7. ✅ Validações de DTOs (testa produto com preço negativo)
8. ✅ Refresh token flow

**Pré-requisitos do script:**
- Backend rodando em http://localhost:3000
- `jq` instalado (para parsing JSON):
  ```bash
  # Ubuntu/Debian
  sudo apt install jq

  # macOS
  brew install jq
  ```

### Opção 2: Testes Manuais com curl

#### 1. Health Check

```bash
curl http://localhost:3000/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "database": "connected"
}
```

#### 2. Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrUsername": "admin@linospanificadora.com",
    "password": "admin123"
  }'
```

**Resposta esperada:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@linospanificadora.com",
    "username": "admin",
    "fullName": "Administrador do Sistema",
    "role": "ADMIN",
    "isActive": true
  }
}
```

**💡 Copie o `accessToken` para usar nos próximos testes!**

#### 3. Obter Dados do Usuário Autenticado

```bash
TOKEN="<cole-seu-token-aqui>"

curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

#### 4. Listar Produtos (requer autenticação)

```bash
curl http://localhost:3000/produtos \
  -H "Authorization: Bearer $TOKEN"
```

#### 5. Criar Produto (requer role ADMIN ou OPERATOR)

```bash
curl -X POST http://localhost:3000/produtos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Pão Francês",
    "descricao": "Pão fresquinho do dia",
    "preco": 0.5,
    "estoque": 100,
    "unidade": "unidade"
  }'
```

#### 6. Criar Cliente

```bash
curl -X POST http://localhost:3000/clientes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "email": "joao@example.com",
    "telefone": "11999999999",
    "endereco": "Rua Teste, 123"
  }'
```

#### 7. Criar Pedido (testa transação de estoque)

**⚠️ Substitua os IDs pelo produto e cliente criados acima!**

```bash
curl -X POST http://localhost:3000/pedidos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clienteId": 1,
    "observacoes": "Entrega pela manhã",
    "itens": [
      {
        "produtoId": 1,
        "quantidade": 10
      }
    ]
  }'
```

**Verificação importante:**
- Após criar o pedido, consulte o produto novamente: `GET /produtos/1`
- O estoque deve ter sido **decrementado automaticamente**
- Isso valida que a **transação está funcionando**

#### 8. Cancelar Pedido (testa reversão de estoque)

```bash
curl -X POST http://localhost:3000/pedidos/1/cancelar \
  -H "Authorization: Bearer $TOKEN"
```

**Verificação importante:**
- Consulte o produto novamente: `GET /produtos/1`
- O estoque deve ter sido **revertido**
- Isso valida a **integridade transacional**

#### 9. Testar Proteção de Rotas (sem token = 401)

```bash
# Tentar acessar produtos sem token
curl http://localhost:3000/produtos
```

**Resposta esperada:** `401 Unauthorized`

#### 10. Testar Validação de DTO

```bash
# Tentar criar produto com preço negativo
curl -X POST http://localhost:3000/produtos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Produto Inválido",
    "preco": -10
  }'
```

**Resposta esperada:** `400 Bad Request` com mensagens de validação

#### 11. Refresh Token

```bash
REFRESH_TOKEN="<cole-refresh-token-do-login>"

curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}"
```

**Resposta esperada:** Novo `accessToken` e `refreshToken`

### Opção 3: Postman/Insomnia

Importe a collection (vou criar abaixo):

1. Abra Postman/Insomnia
2. Importe o arquivo `postman-collection.json`
3. Execute os requests na ordem

---

## 🐳 Alternativa: Testar com Docker

Se você está enfrentando problemas com Prisma Client no ambiente local:

### Dockerfile para Testes

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copiar package files
COPY package.json yarn.lock ./
COPY apps/backend/package.json ./apps/backend/

# Instalar dependências
RUN yarn install --frozen-lockfile

# Copiar código
COPY apps/backend ./apps/backend

# Gerar Prisma Client
WORKDIR /app/apps/backend
RUN yarn prisma generate

# Build
RUN yarn build

EXPOSE 3000

CMD ["yarn", "start:prod"]
```

**Build e run:**

```bash
# Build
docker build -t linos-backend-test .

# Run
docker run -p 3000:3000 \
  -e DATABASE_URL="file:/app/apps/backend/prisma/dev.db" \
  -e JWT_SECRET="test-secret" \
  -e JWT_REFRESH_SECRET="test-refresh-secret" \
  -e ADMIN_EMAIL="admin@linospanificadora.com" \
  -e ADMIN_PASSWORD="admin123" \
  linos-backend-test
```

---

## 🔍 Checklist de Validação

Use este checklist para validar que tudo está funcionando:

### Autenticação
- [ ] Login com credenciais corretas retorna tokens
- [ ] Login com credenciais incorretas retorna 401
- [ ] Refresh token gera novos tokens válidos
- [ ] GET /auth/me retorna dados do usuário com token válido
- [ ] GET /auth/me retorna 401 sem token

### Guards e Proteção
- [ ] Rotas protegidas retornam 401 sem token
- [ ] Rotas com @Public() funcionam sem token
- [ ] Operações ADMIN/OPERATOR bloqueiam role CLIENT
- [ ] Health endpoint é público

### Validação de DTOs
- [ ] Produto com preço negativo é rejeitado
- [ ] Email inválido é rejeitado
- [ ] Campos obrigatórios ausentes retornam 400
- [ ] Mensagens de erro estão em português

### CRUD Produtos
- [ ] Criar produto com dados válidos funciona
- [ ] Listar produtos retorna array
- [ ] Buscar produto por ID retorna produto
- [ ] Atualizar produto funciona
- [ ] Deletar produto funciona

### CRUD Clientes
- [ ] Criar cliente com dados válidos funciona
- [ ] Não permite duplicar email
- [ ] Buscar clientes funciona
- [ ] Atualizar cliente funciona
- [ ] Não permite deletar cliente com pedidos

### Pedidos e Transações
- [ ] Criar pedido decrementa estoque automaticamente
- [ ] Criar pedido com estoque insuficiente retorna 400
- [ ] Cancelar pedido reverte estoque
- [ ] Não permite cancelar pedido entregue
- [ ] Atualizar status de pedido funciona

---

## 🚨 Troubleshooting

### Erro: "Cannot find module '@prisma/client'"

**Solução:**
```bash
yarn workspace @linos/backend prisma generate
```

### Erro: "Port 3000 already in use"

**Solução:**
```bash
# Encontre o processo
lsof -i :3000

# Mate o processo
kill -9 <PID>

# Ou use outra porta
PORT=3001 yarn workspace @linos/backend dev
```

### Erro: "Database locked"

**Solução:**
- Feche Prisma Studio se estiver aberto
- Reinicie o backend

### Erro: "403 Forbidden" ao gerar Prisma Client

**Solução:**
- Tente em outra rede/máquina
- Use Docker (veja seção acima)
- Ou baixe os binários manualmente (não recomendado)

### Erro: "Unauthorized" em todas as requisições

**Verificações:**
1. Token está sendo enviado corretamente?
   ```bash
   # Deve ter o header:
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

2. Token não expirou? (access token expira em 15min)
   - Use refresh token para obter novo access token

3. JWT_SECRET no .env está correto?
   - Backend e token devem usar o mesmo secret

### Build falha com erros TypeScript

**Solução:**
```bash
# Limpar e reinstalar
rm -rf node_modules
rm -rf apps/backend/node_modules
yarn install

# Regenerar Prisma Client
yarn workspace @linos/backend prisma generate

# Tentar build novamente
yarn workspace @linos/backend build
```

---

## 📊 Resultados Esperados

Após executar todos os testes, você deve observar:

### ✅ Funcionando Corretamente:
1. **Autenticação completa** (login, refresh, me)
2. **Guards globais** protegendo rotas
3. **Validação automática** de DTOs
4. **CRUD completo** de Produtos, Clientes, Pedidos
5. **Transações funcionando** (estoque sendo atualizado atomicamente)
6. **Permissões por role** (ADMIN, OPERATOR, CLIENT)
7. **Error handling** consistente com mensagens em português
8. **Health check** respondendo

### ⚠️ Limitações Conhecidas (pendente implementação futura):
- Paginação em listagens
- Rate limiting
- Email verification
- Cleanup automático de refresh tokens expirados
- Testes E2E automatizados
- Logger estruturado

---

## 📝 Reportando Problemas

Se encontrar problemas durante os testes:

1. **Verifique os logs do backend** no terminal onde executou `yarn dev`
2. **Teste com o script automatizado** (`./test-api.sh`) para ter logs detalhados
3. **Consulte a seção Troubleshooting** acima
4. **Verifique o relatório de auditoria** em `AUDITORIA-BACKEND.md`

---

## 🎯 Próximos Passos

Após validar que tudo funciona:

1. **Teste em ambiente de staging** antes de produção
2. **Configure secrets fortes** para produção (JWT_SECRET, JWT_REFRESH_SECRET)
3. **Configure backup automático** do database
4. **Implemente testes E2E** automatizados
5. **Configure CI/CD** para rodar testes em cada commit

---

**Última atualização:** 2025-11-14
**Branch testada:** `claude/claude-md-mhz7uvvnxkolv3kl-01PUzfKznGdqzC41zWpFkYZt`
