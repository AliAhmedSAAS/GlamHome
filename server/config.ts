/**
 * Configuration validation module
 * Validates all required environment variables at startup
 */

import * as logger from "./logger";

interface Config {
  // Core
  nodeEnv: string;
  port: number;
  
  // Database
  databaseUrl: string;
  
  // Authentication
  sessionSecret: string;
  
  // Stripe
  stripeSecretKey: string;
  stripeWebhookSecret?: string;
  
  // Optional services
  openaiApiKey?: string;
  ultramsgToken?: string;
  ultramsgInstance?: string;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioWhatsappNumber?: string;
  
  // Security
  allowedOrigins?: string[];
  cronSecret?: string;
  
  // Admin
  adminEmail?: string;
  adminPassword?: string;
  
  // Replit Auth (optional)
  replId?: string;
  issuerUrl?: string;
}

/**
 * Validate required environment variables
 */
export function validateConfig(): Config {
  const errors: string[] = [];
  
  // Required variables
  const requiredVars = {
    DATABASE_URL: process.env.DATABASE_URL,
    SESSION_SECRET: process.env.SESSION_SECRET,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  };
  
  for (const [key, value] of Object.entries(requiredVars)) {
    if (!value) {
      errors.push(`Missing required environment variable: ${key}`);
    }
  }
  
  // Validate SESSION_SECRET length
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
    errors.push('SESSION_SECRET must be at least 32 characters long');
  }
  
  // Validate Stripe keys
  if (process.env.STRIPE_SECRET_KEY) {
    if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
      errors.push('STRIPE_SECRET_KEY must start with "sk_"');
    }
  }
  
  // Production-specific validations
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      logger.warn('STRIPE_WEBHOOK_SECRET not set - Stripe webhooks will fail');
    }
    
    if (!process.env.ALLOWED_ORIGINS) {
      logger.warn('ALLOWED_ORIGINS not set - CORS will allow all .vercel.app domains');
    }
  }
  
  // If there are errors, log them and throw
  if (errors.length > 0) {
    logger.error('Configuration validation failed', { errors });
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
  
  // Parse and return config
  const config: Config = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5000', 10),
    databaseUrl: process.env.DATABASE_URL!,
    sessionSecret: process.env.SESSION_SECRET!,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY!,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    openaiApiKey: process.env.OPENAI_API_KEY,
    ultramsgToken: process.env.ULTRAMSG_TOKEN,
    ultramsgInstance: process.env.ULTRAMSG_INSTANCE,
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    twilioWhatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER,
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',').map(s => s.trim()),
    cronSecret: process.env.CRON_SECRET,
    adminEmail: process.env.ADMIN_EMAIL,
    adminPassword: process.env.ADMIN_PASSWORD,
    replId: process.env.REPL_ID,
    issuerUrl: process.env.ISSUER_URL,
  };
  
  logger.info('Configuration validated successfully', {
    nodeEnv: config.nodeEnv,
    port: config.port,
    hasOpenAI: !!config.openaiApiKey,
    hasUltramsg: !!config.ultramsgToken,
    hasTwilio: !!config.twilioAccountSid,
    hasAllowedOrigins: !!config.allowedOrigins,
    hasCronSecret: !!config.cronSecret,
  });
  
  return config;
}

// Validate config on module load
let cachedConfig: Config | null = null;

export function getConfig(): Config {
  if (!cachedConfig) {
    cachedConfig = validateConfig();
  }
  return cachedConfig;
}

