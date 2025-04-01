FROM node:18-alpine

WORKDIR /app

# Instalar dependências para compilação e runtime
RUN apk add --no-cache python3 make g++ git

# Copiar arquivos de configuração
COPY package.json yarn.lock ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/

# Instalar dependências
RUN yarn install --frozen-lockfile

# Copiar código fonte
COPY . .

# Gerar Prisma Client
RUN yarn workspace @linos/backend prisma generate

# Construir aplicação
RUN yarn build

# Criar diretórios para persistência
RUN mkdir -p /var/data /var/data/pdfs /var/data/backups

# Porta a ser exposta
EXPOSE 10000

# Comando para iniciar a aplicação
CMD ["yarn", "start:prod"]