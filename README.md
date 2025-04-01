# Sistema de Gestão - Lino's Panificadora

Sistema de gestão completo para a Lino's Panificadora, desenvolvido como um monorepo com backend em NestJS e frontend em Next.js.

## Estrutura do Projeto

```
linos-panificadora/
├── apps/
│   ├── backend/         # API em NestJS
│   └── frontend/        # Interface web em Next.js
├── scripts/             # Scripts utilitários
├── package.json         # Configuração do monorepo
├── render.yaml          # Configuração do Render
└── docker-compose.yml   # Configuração para desenvolvimento local
```

## Funcionalidades

- Cadastro de produtos
- Cadastro de clientes
- Gestão de pedidos
- Geração de PDFs
- Relatórios

## Requisitos

- Node.js 18+
- Yarn
- Git

## Desenvolvimento Local

1. Clone o repositório
   ```bash
   git clone https://github.com/wagneradl/linos-panificadora.git
   cd linos-panificadora
   ```

2. Instale as dependências
   ```bash
   yarn install
   ```

3. Configure as variáveis de ambiente
   ```bash
   cp apps/backend/.env.example apps/backend/.env
   cp apps/frontend/.env.example apps/frontend/.env
   ```

4. Execute o projeto em modo de desenvolvimento
   ```bash
   yarn dev
   ```

5. Acesso ao projeto
   - Backend: http://localhost:3000
   - Frontend: http://localhost:3001

## Deploy

### Render

O projeto está configurado para deploy no Render através do arquivo `render.yaml`.

1. Faça login na plataforma Render
2. Conecte ao repositório Git
3. Selecione a opção "Blueprint" e escolha o arquivo render.yaml
4. Configure as variáveis de ambiente necessárias
5. Conclua o deploy

### Docker

Para executar em ambiente de produção com Docker:

```bash
docker-compose up -d
```

## Backup e Restauração

O sistema possui scripts para backup e restauração do banco de dados SQLite:

- Para criar um backup:
  ```bash
  yarn backup
  ```

- Para restaurar um backup:
  ```bash
  yarn restore
  ```

## Migração

Para migrar o banco de dados:

```bash
yarn workspace @linos/backend prisma migrate deploy
```

## Suporte

Em caso de dúvidas ou problemas, entre em contato com o suporte técnico.
