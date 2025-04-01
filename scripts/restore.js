const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configurações
const DB_PATH = process.env.DATABASE_URL?.replace('file:', '') || '/var/data/linos-padaria.db';
const BACKUP_DIR = process.env.BACKUP_DIR || '/var/data/backups';

// Interface para entrada do usuário
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Listar backups disponíveis
function listarBackups() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.error(`Diretório de backups não encontrado: ${BACKUP_DIR}`);
    process.exit(1);
  }

  const arquivos = fs.readdirSync(BACKUP_DIR)
    .filter(arquivo => arquivo.endsWith('.db'))
    .sort()
    .reverse(); // Do mais recente para o mais antigo

  if (arquivos.length === 0) {
    console.log('Nenhum backup encontrado.');
    process.exit(0);
  }

  console.log('Backups disponíveis:');
  arquivos.forEach((arquivo, index) => {
    const stats = fs.statSync(path.join(BACKUP_DIR, arquivo));
    const data = new Date(stats.mtime).toLocaleString();
    const tamanho = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`[${index + 1}] ${arquivo} (${tamanho} MB) - ${data}`);
  });

  return arquivos;
}

// Restaurar backup
function restaurarBackup(backupPath) {
  try {
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Arquivo de backup não encontrado: ${backupPath}`);
    }

    // Criar backup do banco atual antes de restaurar
    if (fs.existsSync(DB_PATH)) {
      const tempBackup = `${DB_PATH}.bak`;
      console.log(`Criando backup temporário do banco atual: ${tempBackup}`);
      fs.copyFileSync(DB_PATH, tempBackup);
    }

    // Restaurar o banco
    console.log(`Restaurando ${backupPath} para ${DB_PATH}`);
    fs.copyFileSync(backupPath, DB_PATH);
    console.log('Restauração concluída com sucesso!');
  } catch (error) {
    console.error('Erro ao restaurar backup:', error);
    process.exit(1);
  }
}

// Fluxo principal
const arquivos = listarBackups();

rl.question('Digite o número do backup para restaurar (ou CTRL+C para cancelar): ', (resposta) => {
  const indice = parseInt(resposta, 10);
  
  if (isNaN(indice) || indice < 1 || indice > arquivos.length) {
    console.error('Escolha inválida.');
    rl.close();
    process.exit(1);
  }
  
  const backupSelecionado = arquivos[indice - 1];
  const backupPath = path.join(BACKUP_DIR, backupSelecionado);
  
  rl.question(`Tem certeza que deseja restaurar o backup ${backupSelecionado}? (s/N) `, (confirmacao) => {
    if (confirmacao.toLowerCase() === 's') {
      restaurarBackup(backupPath);
    } else {
      console.log('Operação cancelada pelo usuário.');
    }
    rl.close();
  });
});