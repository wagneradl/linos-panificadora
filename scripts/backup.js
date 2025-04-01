const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configurações
const DB_PATH = process.env.DATABASE_URL?.replace('file:', '') || '/var/data/linos-padaria.db';
const BACKUP_DIR = process.env.BACKUP_DIR || '/var/data/backups';
const DATE_FORMAT = new Date().toISOString().replace(/:/g, '-').split('.')[0];
const BACKUP_FILENAME = `backup-${DATE_FORMAT}.db`;
const BACKUP_PATH = path.join(BACKUP_DIR, BACKUP_FILENAME);

// Criar diretório de backup se não existir
if (!fs.existsSync(BACKUP_DIR)) {
  console.log(`Criando diretório de backups: ${BACKUP_DIR}`);
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

try {
  // Verificar se o DB existe
  if (!fs.existsSync(DB_PATH)) {
    throw new Error(`Banco de dados não encontrado: ${DB_PATH}`);
  }

  // Realizar o backup
  console.log(`Copiando ${DB_PATH} para ${BACKUP_PATH}`);
  fs.copyFileSync(DB_PATH, BACKUP_PATH);
  
  // Opcionalmente compactar o backup
  console.log('Backup realizado com sucesso!');
  console.log(`Arquivo: ${BACKUP_PATH}`);
  console.log(`Tamanho: ${(fs.statSync(BACKUP_PATH).size / 1024 / 1024).toFixed(2)} MB`);
} catch (error) {
  console.error('Erro ao realizar backup:', error);
  process.exit(1);
}