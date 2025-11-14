import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Ambiente
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // Servidor
  PORT: Joi.number().default(3000),

  // Database
  DATABASE_URL: Joi.string().required(),

  // JWT (obrigatórios em produção)
  JWT_SECRET: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // PDF Storage
  PDF_STORAGE_PATH: Joi.string().default('./pdfs'),

  // Admin Seed (opcionais, mas recomendados)
  ADMIN_EMAIL: Joi.string().email().optional(),
  ADMIN_PASSWORD: Joi.string().min(6).optional(),
  ADMIN_FULL_NAME: Joi.string().optional(),

  // CORS
  CORS_ENABLED: Joi.boolean().default(true),
  CORS_ORIGIN: Joi.string().default('*'),
});
