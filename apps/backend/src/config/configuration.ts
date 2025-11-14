export default () => ({
  // Ambiente
  nodeEnv: process.env.NODE_ENV || 'development',

  // Servidor
  port: parseInt(process.env.PORT, 10) || 3000,

  // Database
  database: {
    url: process.env.DATABASE_URL,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // PDF Storage
  pdf: {
    storagePath: process.env.PDF_STORAGE_PATH || './pdfs',
  },

  // Admin Seed (para primeiro usuário)
  admin: {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    fullName: process.env.ADMIN_FULL_NAME || 'Administrador',
  },

  // CORS
  cors: {
    enabled: process.env.CORS_ENABLED !== 'false', // default true
    origin: process.env.CORS_ORIGIN || '*',
  },
});
