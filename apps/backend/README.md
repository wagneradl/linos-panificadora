# Backend - Linos Panificadora

Backend NestJS para o sistema de gestão da Lino's Panificadora.

## Stack Tecnológica

- **Framework:** NestJS 10
- **Linguagem:** TypeScript 5.1
- **ORM:** Prisma 5.0
- **Database:** SQLite
- **Autenticação:** JWT (Passport.js)
- **Validação:** class-validator + class-transformer

## Estrutura do Projeto

```
src/
├── config/               # Configuração centralizada (ConfigModule + Joi)
├── prisma/              # Database module (PrismaService)
├── health/              # Health check endpoint
├── auth/                # Sistema de autenticação e autorização
│   ├── strategies/      # Passport strategies (Local, JWT)
│   ├── guards/          # Guards de proteção (JwtAuthGuard, RolesGuard)
│   └── decorators/      # Decorators (@Public, @Roles, @CurrentUser)
├── users/               # Gestão de usuários (CRUD)
├── app.module.ts        # Root module
└── main.ts             # Entry point

prisma/
├── schema.prisma        # Database schema
├── migrations/          # Database migrations
└── seed.ts             # Seed script (usuário ADMIN)
```

## Configuração

### 1. Instalar Dependências

```bash
# Na raiz do monorepo
yarn install --ignore-scripts

# Gerar Prisma Client (se houver problemas de rede)
cd apps/backend
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 yarn prisma:generate
```

### 2. Configurar Variáveis de Ambiente

Copie `.env.example` para `.env` e ajuste conforme necessário:

```bash
cp .env.example .env
```

**Variáveis Principais:**

```env
# Ambiente
NODE_ENV="development"              # development | production | test
PORT="3000"                        # Porta do servidor

# Database
DATABASE_URL="file:./dev.db"       # Dev: file:./dev.db | Prod: file:/var/data/linos-padaria.db

# JWT (OBRIGATÓRIO EM PRODUÇÃO!)
JWT_SECRET="your-secret-here"
JWT_REFRESH_SECRET="your-refresh-secret-here"

# Admin Seed (opcional, mas recomendado)
ADMIN_EMAIL="admin@linospanificadora.com"
ADMIN_PASSWORD="admin123"
ADMIN_FULL_NAME="Administrador do Sistema"
```

**⚠️ IMPORTANTE:** Em produção, gere secrets fortes:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Migrations do Prisma

#### 🔴 NOTA IMPORTANTE: Migration Manual

**A migration inicial (`20251114_init`) foi criada MANUALMENTE** devido a limitações de ambiente durante o desenvolvimento (problemas de rede ao baixar binários do Prisma).

**Fluxo OFICIAL de migrations (em ambiente normal):**

```bash
# 1. Editar schema.prisma
vim prisma/schema.prisma

# 2. Criar e aplicar migration
yarn prisma:migrate:dev --name nome_da_migration

# OU diretamente
npx prisma migrate dev --name nome_da_migration
```

#### Aplicar Migrations Existentes

```bash
# Desenvolvimento (cria banco + aplica migrations)
yarn prisma:migrate:dev

# Produção (apenas aplica migrations)
yarn prisma:migrate
```

#### Verificar Coerência

O arquivo `prisma/schema.prisma` e `prisma/migrations/20251114_init/migration.sql` estão coerentes e representam o mesmo schema:

**Models:**
- `User` (users) - Usuários do sistema
- `RefreshToken` (refresh_tokens) - Tokens de refresh JWT
- `Produto` (produtos) - Produtos
- `Cliente` (clientes) - Clientes
- `Pedido` (pedidos) - Pedidos
- `ItemPedido` (itens_pedido) - Itens dos pedidos

**Enum:**
- `Role` - ADMIN, OPERATOR, CLIENT

### 4. Seed (Usuário Administrador)

O seed cria o usuário administrador inicial baseado nas variáveis de ambiente:

```bash
yarn prisma:seed

# OU
npx prisma db seed
```

**⚠️ Se as variáveis `ADMIN_EMAIL` e `ADMIN_PASSWORD` não estiverem configuradas**, o seed apenas avisa e pula a criação (não quebra a aplicação).

### 5. Iniciar o Servidor

```bash
# Desenvolvimento (watch mode)
yarn dev

# Produção
yarn start:prod
```

**Saída esperada:**
```
=========================================
🚀 Linos Panificadora - Backend Started
=========================================
📍 URL: http://localhost:3000
🌍 Environment: development
🔓 CORS: Enabled (*)
✅ Health Check: http://localhost:3000/health
=========================================
```

## API Endpoints

### Públicos (sem autenticação)

- `GET /health` - Health check
- `POST /auth/login` - Login (retorna JWT tokens)
- `POST /auth/refresh` - Renovar tokens
- `POST /auth/logout` - Logout (invalida refresh token)

### Protegidos (requerem JWT)

**Qualquer usuário autenticado:**
- `GET /auth/me` - Dados do usuário atual

**Apenas ADMIN:**
- `GET /users` - Listar usuários
- `POST /users` - Criar usuário
- `GET /users/:id` - Obter usuário
- `PATCH /users/:id` - Atualizar usuário
- `DELETE /users/:id` - Remover usuário

## Sistema de Autenticação

### JWT com Access + Refresh Tokens

**Access Token:**
- Curta duração (15 minutos padrão)
- Usado para autenticar requisições
- Enviado via header: `Authorization: Bearer <token>`

**Refresh Token:**
- Longa duração (7 dias padrão)
- Usado para renovar access tokens
- Armazenado no banco (permite invalidação manual)

### Roles e Permissões

**ADMIN:**
- Acesso completo ao sistema
- Pode gerenciar usuários
- Pode acessar todos os recursos

**OPERATOR:**
- Acesso operacional (produtos, clientes, pedidos) - futuro
- Não pode gerenciar usuários

**CLIENT:**
- Acesso limitado (apenas seus próprios dados) - futuro

### Proteção de Rotas

**Guards Globais Aplicados:**
- `JwtAuthGuard` - Requer autenticação em todas as rotas (exceto @Public)
- `RolesGuard` - Verifica roles quando especificado (@Roles)

**Decorators Disponíveis:**
```typescript
@Public()                    // Marca rota como pública
@Roles(Role.ADMIN)          // Requer role específica
@CurrentUser() user: User   // Injeta usuário autenticado
```

## Desenvolvimento

### Comandos Úteis

```bash
# Desenvolvimento
yarn dev                          # Start em watch mode
yarn build                        # Build para produção
yarn start:prod                   # Start produção

# Prisma
yarn prisma:generate              # Gerar Prisma Client
yarn prisma:migrate:dev           # Criar e aplicar migration (dev)
yarn prisma:migrate               # Aplicar migrations (prod)
yarn prisma:studio                # Abrir Prisma Studio (GUI)
yarn prisma:seed                  # Rodar seed

# Database
yarn workspace @linos/backend prisma migrate reset    # Reset completo (dev only)
```

### Prisma Studio

Interface visual para explorar o banco:

```bash
yarn prisma:studio
# Abre em http://localhost:5555
```

## Testes

**🔴 TODO:** Adicionar testes unitários e E2E.

Estrutura sugerida:
- `**/*.spec.ts` - Testes unitários
- `test/` - Testes E2E

## Produção

### Variáveis de Ambiente Obrigatórias

```env
NODE_ENV="production"
DATABASE_URL="file:/var/data/linos-padaria.db"
JWT_SECRET="<secret-forte-gerado>"
JWT_REFRESH_SECRET="<refresh-secret-forte-gerado>"
```

### Build

```bash
yarn build
```

### Deploy

O projeto está configurado para deploy em:
- **Render.com** (configuração em `/render.yaml`)
- **Vercel** (configuração em `/vercel.json`)
- **Docker** (Dockerfile na raiz)

## Troubleshooting

### "Cannot find module @prisma/client"
**Solução:** `yarn prisma:generate`

### "Port already in use"
**Solução:** Altere `PORT` no `.env` ou mate o processo: `lsof -ti:3000 | xargs kill`

### "Database locked"
**Solução:** Feche Prisma Studio ou outras conexões abertas

### Problemas de rede com Prisma
**Solução:** Use `PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1` antes dos comandos

### TypeScript errors após mudanças no schema
**Solução:**
1. `yarn prisma:generate`
2. Reinicie o TypeScript server (VSCode: Cmd+Shift+P → "Restart TS Server")

## Arquitetura

### Injeção de Dependências

Todos os módulos usam injeção de dependência do NestJS:

```typescript
constructor(
  private prisma: PrismaService,
  private configService: ConfigService,
) {}
```

### DTOs e Validação

Todas as requisições são validadas automaticamente:

```typescript
export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
```

### Exception Handling

NestJS trata exceptions automaticamente:
- `NotFoundException` → 404
- `UnauthorizedException` → 401
- `ForbiddenException` → 403
- `ConflictException` → 409

## Contribuindo

1. Crie uma branch: `git checkout -b feature/nova-feature`
2. Commit: `git commit -m "feat: adicionar nova feature"`
3. Push: `git push origin feature/nova-feature`
4. Abra um Pull Request

## Licença

Propriedade de Lino's Panificadora.
