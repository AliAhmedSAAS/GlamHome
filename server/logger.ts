/**
 * Structured logging utility with PII redaction
 * Replaces console.log throughout the application
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogContext {
  [key: string]: any;
}

// Sensitive fields that should be redacted
const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'token',
  'access_token',
  'refresh_token',
  'secret',
  'apiKey',
  'clientSecret',
  'stripeKey',
  'Authorization',
  'cookie',
  'sessionId',
];

// Email pattern for redaction
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

// Phone pattern for redaction
const PHONE_PATTERN = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;

/**
 * Redact sensitive information from objects
 */
function redactSensitiveData(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    // Redact emails
    let redacted = obj.replace(EMAIL_PATTERN, (match) => {
      const [localPart, domain] = match.split('@');
      return `${localPart.substring(0, 2)}***@${domain}`;
    });

    // Redact phone numbers
    redacted = redacted.replace(PHONE_PATTERN, '***-***-****');

    return redacted;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSensitiveData(item));
  }

  if (typeof obj === 'object') {
    const redacted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      
      // Check if key contains sensitive terms
      const isSensitive = SENSITIVE_FIELDS.some((field) =>
        lowerKey.includes(field.toLowerCase())
      );

      if (isSensitive) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = redactSensitiveData(value);
      }
    }
    return redacted;
  }

  return obj;
}

/**
 * Format log message as JSON for structured logging
 */
function formatLogMessage(
  level: LogLevel,
  message: string,
  context?: LogContext
): string {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...(context ? { context: redactSensitiveData(context) } : {}),
    environment: process.env.NODE_ENV || 'development',
  };

  // In production, use JSON format for log aggregation
  if (process.env.NODE_ENV === 'production') {
    return JSON.stringify(logEntry);
  }

  // In development, use human-readable format
  const contextStr = context ? ` ${JSON.stringify(redactSensitiveData(context))}` : '';
  return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
}

/**
 * Log an error message
 */
export function error(message: string, context?: LogContext): void {
  console.error(formatLogMessage('error', message, context));
}

/**
 * Log a warning message
 */
export function warn(message: string, context?: LogContext): void {
  console.warn(formatLogMessage('warn', message, context));
}

/**
 * Log an info message
 */
export function info(message: string, context?: LogContext): void {
  console.log(formatLogMessage('info', message, context));
}

/**
 * Log a debug message (only in development)
 */
export function debug(message: string, context?: LogContext): void {
  if (process.env.NODE_ENV !== 'production') {
    console.log(formatLogMessage('debug', message, context));
  }
}

/**
 * Log HTTP request/response
 */
export function httpLog(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  context?: LogContext
): void {
  const message = `${method} ${path} ${statusCode} in ${duration}ms`;
  
  if (statusCode >= 500) {
    error(message, context);
  } else if (statusCode >= 400) {
    warn(message, context);
  } else {
    info(message, context);
  }
}

/**
 * Legacy log function for backward compatibility
 * Gradually replace all calls with specific log levels
 */
export function log(message: string, source?: string): void {
  info(message, source ? { source } : undefined);
}

// Export default logger object
export default {
  error,
  warn,
  info,
  debug,
  httpLog,
  log,
};

