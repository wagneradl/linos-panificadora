# CLAUDE.md - AI Assistant Guide for Linos-Panificadora

This document provides AI assistants with essential information about the Linos-Panificadora codebase structure, conventions, and workflows.

## Project Overview

**Type:** Bakery Management System (Full-stack web application)
**Architecture:** Yarn Workspaces Monorepo
**Status:** Early development (core infrastructure complete, business logic modules pending)

### Tech Stack
- **Backend:** NestJS 10 + TypeScript + Prisma ORM + SQLite
- **Frontend:** Next.js 13 + React 18 + Material-UI + TypeScript
- **Runtime:** Node.js >= 18.0.0
- **Package Manager:** Yarn (workspaces enabled)

## Repository Structure

```
linos-panificadora/
├── apps/
│   ├── backend/              # NestJS REST API (@linos/backend)
│   │   ├── src/
│   │   │   ├── main.ts       # Application entry point
│   │   │   ├── app.module.ts # Root module with imports
│   │   │   ├── prisma/       # Database service (IMPLEMENTED)
│   │   │   └── health/       # Health check endpoint (IMPLEMENTED)
│   │   ├── prisma/
│   │   │   └── schema.prisma # Database schema
│   │   ├── .env              # Backend environment config
│   │   └── package.json      # Backend dependencies
│   └── frontend/             # Next.js web UI (@linos/frontend)
│       ├── next.config.js    # Next.js config with API proxy
│       ├── .env              # Frontend environment config
│       └── package.json      # Frontend dependencies
├── scripts/
│   ├── backup.js             # Database backup utility
│   ├── restore.js            # Database restore utility
│   └── adapt-for-vercel.js   # Vercel serverless adapter
├── package.json              # Monorepo root config
├── render.yaml               # Render.com deployment config
├── vercel.json               # Vercel deployment config
├── netlify.toml              # Netlify deployment config
├── Dockerfile                # Production container image
└── docker-compose.yml        # Local development with Docker
```

## Critical Conventions

### 1. Workspace Management

**ALWAYS use workspace-specific commands:**

```bash
# Correct - specify workspace
yarn workspace @linos/backend <command>
yarn workspace @linos/frontend <command>

# For root-level operations
yarn <command>  # e.g., yarn dev, yarn build
```

**Workspace names:**
- Backend: `@linos/backend`
- Frontend: `@linos/frontend`

### 2. Database Operations

**Database Schema:** `/apps/backend/prisma/schema.prisma`

**Key Models:**
- `Produto` (Product) - Product catalog
- `Cliente` (Customer) - Customer management
- `Pedido` (Order) - Sales orders
- `ItemPedido` (Order Item) - Order line items

**Prisma Commands:**
```bash
# Generate Prisma Client (required after schema changes)
yarn workspace @linos/backend prisma generate

# Create and apply migrations
yarn workspace @linos/backend prisma migrate dev --name <migration-name>

# Apply migrations in production
yarn workspace @linos/backend prisma migrate deploy

# Open Prisma Studio (database GUI)
yarn workspace @linos/backend prisma studio
```

**IMPORTANT:** After ANY schema changes, you MUST run `prisma generate` before the application can use the updated schema.

### 3. NestJS Module Architecture

**App Module Structure:** `/apps/backend/src/app.module.ts`

**Implemented Modules:**
- ✅ `PrismaModule` (Global database service)
- ✅ `HealthModule` (Health check endpoint)

**Planned Modules (NOT YET IMPLEMENTED):**
- ⏳ `ProdutosModule` (Product CRUD)
- ⏳ `ClientesModule` (Client CRUD)
- ⏳ `PedidosModule` (Order management)
- ⏳ `PdfModule` (PDF generation)
- ⏳ `RelatoriosModule` (Reporting)

**When creating new modules:**
1. Generate module: `cd apps/backend && nest g module <name>`
2. Generate controller: `cd apps/backend && nest g controller <name>`
3. Generate service: `cd apps/backend && nest g service <name>`
4. Create DTOs in `<name>/dto/` directory
5. Add module to imports in `app.module.ts`

### 4. API Conventions

**Current Endpoint:**
- `GET /health` - System health check (IMPLEMENTED)

**Expected RESTful Patterns:**
```
GET    /produtos       # List all products
POST   /produtos       # Create product
GET    /produtos/:id   # Get single product
PATCH  /produtos/:id   # Update product
DELETE /produtos/:id   # Delete product
```

**Validation:**
- Global ValidationPipe enabled in `main.ts`
- Use `class-validator` decorators in DTOs
- `whitelist: true` (strips unknown properties)
- `transform: true` (auto-transforms to DTO types)

**CORS:** Enabled globally

### 5. Frontend Architecture

**API Proxy:** Frontend proxies `/api/*` requests to backend via Next.js rewrites

**Configuration:** `/apps/frontend/next.config.js`
```javascript
rewrites: [
  {
    source: '/api/:path*',
    destination: process.env.BACKEND_URL || 'http://localhost:3000/:path*',
  }
]
```

**Client-side API calls should use:** `/api/produtos`, `/api/clientes`, etc.

### 6. Environment Variables

**Backend** (`/apps/backend/.env`):
```bash
DATABASE_URL="file:/var/data/linos-padaria.db"
NODE_ENV="production"
PORT="10000"
PDF_STORAGE_PATH="/var/data/pdfs"
```

**Frontend** (`/apps/frontend/.env`):
```bash
BACKEND_URL="http://localhost:10000"
NEXT_PUBLIC_API_URL="/api"
```

**IMPORTANT:** Never commit `.env` files. Always use `.env.example` as templates.

## Development Workflows

### Initial Setup

```bash
# 1. Install all dependencies (root + workspaces)
yarn install

# 2. Copy environment files
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env

# 3. Generate Prisma Client
yarn workspace @linos/backend prisma generate

# 4. Run migrations (if any exist)
yarn workspace @linos/backend prisma migrate deploy

# 5. Start development servers
yarn dev
```

### Development Commands

```bash
# Start both apps in watch mode (concurrently)
yarn dev

# Build all workspaces
yarn build

# Start production backend only
yarn start:prod

# Individual workspace commands
yarn workspace @linos/backend dev
yarn workspace @linos/backend build
yarn workspace @linos/frontend dev
yarn workspace @linos/frontend build
```

### Database Management

```bash
# Backup database
yarn backup

# Restore database (interactive)
yarn restore

# Schedule daily backups (runs at 00:00 UTC)
yarn backup:schedule
```

### Creating New Features

**Example: Adding a Products Module**

1. **Generate NestJS scaffolding:**
   ```bash
   cd apps/backend
   nest g module produtos
   nest g controller produtos
   nest g service produtos
   ```

2. **Create DTOs:**
   ```bash
   mkdir -p src/produtos/dto
   # Create: create-produto.dto.ts, update-produto.dto.ts
   ```

3. **Implement service with Prisma:**
   ```typescript
   constructor(private prisma: PrismaService) {}

   async findAll() {
     return this.prisma.produto.findMany();
   }
   ```

4. **Add validation to DTOs:**
   ```typescript
   import { IsString, IsNumber, Min } from 'class-validator';

   export class CreateProdutoDto {
     @IsString()
     nome: string;

     @IsNumber()
     @Min(0)
     preco: number;
   }
   ```

5. **Update app.module.ts if needed (may be auto-added)**

### Testing Changes Locally

```bash
# Backend only
cd apps/backend
yarn dev

# Frontend only
cd apps/frontend
yarn dev

# Both together
yarn dev  # from root
```

**Access points:**
- Backend API: http://localhost:3000 (or configured PORT)
- Frontend UI: http://localhost:3001
- Health Check: http://localhost:3000/health

## Deployment

### Platform-Specific Commands

**Render (Primary Platform):**
- Configured in `render.yaml`
- Auto-deploy on git push
- Health check: `/api/health`
- Persistent disk: `/var/data` (1GB)

**Vercel (Serverless):**
- Requires adaptation: `yarn adapt:vercel`
- Configured in `vercel.json`
- Separate builds for backend/frontend

**Docker:**
```bash
# Build image
docker build -t linos-panificadora .

# Run container
docker run -p 10000:10000 -v data:/var/data linos-panificadora

# Or use Docker Compose
docker-compose up -d
```

## Common Tasks for AI Assistants

### Task: Implement a CRUD Module

**Checklist:**
1. ✅ Check if Prisma model exists in schema
2. ✅ Generate module/controller/service
3. ✅ Create DTOs with validation
4. ✅ Implement service methods using PrismaService
5. ✅ Implement controller endpoints
6. ✅ Add Swagger decorators (if API docs needed)
7. ✅ Test endpoints manually or with tests
8. ✅ Update frontend to consume API

### Task: Modify Database Schema

**Checklist:**
1. ✅ Edit `/apps/backend/prisma/schema.prisma`
2. ✅ Run `yarn workspace @linos/backend prisma generate`
3. ✅ Create migration: `yarn workspace @linos/backend prisma migrate dev --name <name>`
4. ✅ Update affected DTOs and services
5. ✅ Test with Prisma Studio

### Task: Add New Frontend Page

**Checklist:**
1. ✅ Create page in `/apps/frontend/pages/` or `/apps/frontend/app/`
2. ✅ Create API client functions (using axios)
3. ✅ Implement UI components (using MUI)
4. ✅ Add navigation/routing
5. ✅ Test integration with backend API

### Task: Debug Issues

**Useful Commands:**
```bash
# Check backend logs
cd apps/backend && yarn dev  # Watch mode logs

# Check Prisma Client generation
yarn workspace @linos/backend prisma generate

# Verify database schema
yarn workspace @linos/backend prisma studio

# Check environment variables
cat apps/backend/.env
cat apps/frontend/.env

# Test health endpoint
curl http://localhost:3000/health

# Check git status
git status
```

## Code Style Guidelines

### TypeScript
- Use strict TypeScript (`strict: true` in tsconfig.json)
- Prefer interfaces for DTOs
- Use classes for entities (Prisma models)
- Always type function parameters and return types

### NestJS
- Use dependency injection (constructor injection)
- Follow modular architecture (one module per feature)
- Use DTOs for request/response validation
- Implement error handling with exception filters
- Use async/await for Prisma operations

### Naming Conventions
- **Files:** kebab-case (e.g., `create-produto.dto.ts`)
- **Classes:** PascalCase (e.g., `CreateProdutoDto`)
- **Functions/Variables:** camelCase (e.g., `findAllProdutos`)
- **Database Tables:** snake_case (mapped in Prisma: `@@map("produtos")`)
- **Portuguese Terms:** Use for business entities (Produto, Cliente, Pedido)

### Prisma Best Practices
- Always use transactions for multi-step operations
- Use `select` and `include` to optimize queries
- Implement proper error handling (catch `PrismaClientKnownRequestError`)
- Use `@default`, `@updatedAt` for automatic fields
- Define proper relations with `@relation`

## Git Workflow

**Current Branch:** `claude/claude-md-mhz7uvvnxkolv3kl-01PUzfKznGdqzC41zWpFkYZt`

**Commit Guidelines:**
- Use descriptive commit messages in Portuguese or English
- Follow conventional commits format: `feat:`, `fix:`, `docs:`, `refactor:`, etc.
- Commit related changes together
- Never commit `.env` files or secrets

**Pushing Changes:**
```bash
# Stage changes
git add .

# Commit with message
git commit -m "feat: add produtos CRUD module"

# Push to feature branch
git push -u origin <branch-name>
```

## Troubleshooting

### "Cannot find module @prisma/client"
**Solution:** Run `yarn workspace @linos/backend prisma generate`

### "Port already in use"
**Solution:** Change PORT in `.env` or kill process on that port

### "Database locked" errors
**Solution:** Close Prisma Studio or other database connections

### TypeScript errors after schema changes
**Solution:** Regenerate Prisma Client, restart TypeScript server

### Frontend can't reach backend
**Solution:** Check `BACKEND_URL` in frontend `.env`, ensure backend is running

### Build failures
**Solution:**
1. Clean install: `rm -rf node_modules && yarn install`
2. Rebuild: `yarn build`
3. Check for TypeScript errors

## Important Notes for AI Assistants

1. **Database Schema:** The schema is defined but migrations have NOT been run yet. First-time setup requires creating the initial migration.

2. **Incomplete Modules:** ProdutosModule, ClientesModule, PedidosModule, PdfModule, and RelatoriosModule are imported in app.module.ts but NOT YET IMPLEMENTED. Attempting to start the app will fail until these are created or removed from imports.

3. **PDF Generation:** PDF storage path is configured (`/var/data/pdfs`) and ServeStaticModule is set up to serve PDFs at `/pdfs/*`, but PDF generation logic is not implemented.

4. **No Authentication:** There is no authentication/authorization system. This should be considered for future implementation.

5. **Testing:** No test files exist. The project would benefit from unit and e2e tests.

6. **Validation:** Global ValidationPipe is configured, so DTOs with class-validator decorators will be automatically validated.

7. **Monorepo Awareness:** Always specify the workspace when running commands inside apps. Use `yarn workspace @linos/<workspace> <command>`.

## Quick Reference

### File Locations
| What | Path |
|------|------|
| Backend main | `/apps/backend/src/main.ts` |
| App module | `/apps/backend/src/app.module.ts` |
| Database schema | `/apps/backend/prisma/schema.prisma` |
| Prisma service | `/apps/backend/src/prisma/prisma.service.ts` |
| Health controller | `/apps/backend/src/health/health.controller.ts` |
| Frontend config | `/apps/frontend/next.config.js` |
| Root package.json | `/package.json` |
| Backend .env | `/apps/backend/.env` |
| Frontend .env | `/apps/frontend/.env` |

### Port Defaults
- Backend: 3000 (dev) / 10000 (prod)
- Frontend: 3001 (Next.js default)

### Database Location
- Development: `./apps/backend/prisma/dev.db` (or as configured)
- Production: `/var/data/linos-padaria.db`

---

**Last Updated:** 2025-11-14
**Document Version:** 1.0.0

For questions or clarifications, refer to the codebase or ask the development team.
