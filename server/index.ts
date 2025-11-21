// Load environment variables from .env file (for local development)
import "dotenv/config";

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeScheduler } from "./scheduler";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import * as logger from "./logger";
import { validateConfig } from "./config";

// Validate configuration at startup
validateConfig();

const app = express();

// Trust proxy - required for rate limiting behind Vercel
app.set("trust proxy", 1);

// CORS configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // In production, only allow specific domains
    if (process.env.NODE_ENV === 'production') {
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
      
      // Add Vercel deployment URLs
      const isVercelUrl = origin.includes('.vercel.app');
      const isAllowed = allowedOrigins.some(allowed => origin.includes(allowed));
      
      if (isAllowed || isVercelUrl) {
        callback(null, true);
      } else {
        logger.warn('CORS blocked origin', { origin });
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // In development, allow all origins
      callback(null, true);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Security headers with helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com"], // Required for Vite in dev and Stripe
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.stripe.com"],
      frameSrc: ["'self'", "https://js.stripe.com"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
    },
  },
  crossOriginEmbedderPolicy: false, // Required for some third-party scripts
}));

// Global rate limiter for all API routes
const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !req.path.startsWith('/api'), // Only apply to API routes
});

app.use(globalRateLimiter);

// Request timeout middleware (9 seconds for Vercel)
app.use((req: Request, res: Response, next: NextFunction) => {
  const timeout = process.env.NODE_ENV === 'production' ? 20000 : 30000;
  
  const timer = setTimeout(() => {
    if (!res.headersSent) {
      logger.warn('Request timeout', {
        method: req.method,
        path: req.path,
        ip: req.ip,
      });
      res.status(408).json({ message: 'Request timeout' });
    }
  }, timeout);

  res.on('finish', () => clearTimeout(timer));
  res.on('close', () => clearTimeout(timer));
  
  next();
});

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

// HTTP request logging with structured logger
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      logger.httpLog(
        req.method,
        req.path,
        res.statusCode,
        duration,
        {
          ip: req.ip,
          userAgent: req.get('user-agent'),
        }
      );
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Global error handler - FIXED: removed throw to prevent crashes
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    
    // Log error with context but don't expose internals to client
    logger.error('Request error', {
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      method: req.method,
      path: req.path,
      ip: req.ip,
      status,
    });

    // Send safe error message to client
    const message = status < 500 ? err.message : "Internal Server Error";
    res.status(status).json({ message });
    
    // DO NOT throw - this would crash serverless functions
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  const listenOptions: any = {
    port,
    host: "0.0.0.0",
  };
  
  // reusePort is only supported on Linux, not macOS
  if (process.platform === 'linux') {
    listenOptions.reusePort = true;
  }
  
  server.listen(listenOptions, () => {
    log(`serving on port ${port}`);
    
    // Initialize WhatsApp offer scheduler
    initializeScheduler();
  });

  // Graceful shutdown handlers
  const gracefulShutdown = async (signal: string) => {
    logger.info(`${signal} received, starting graceful shutdown`);
    
    // Stop accepting new connections
    server.close(async () => {
      logger.info('HTTP server closed');
      
      try {
        // Close database connections
        const { pool } = await import('./db');
        await pool.end();
        logger.info('Database pool closed');
        
        // Exit successfully
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown', { error });
        process.exit(1);
      }
    });

    // Force shutdown after 30 seconds (Vercel timeout)
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };

  // Handle shutdown signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  
  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', { error: error.message, stack: error.stack });
    gracefulShutdown('uncaughtException');
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection', { reason, promise });
    gracefulShutdown('unhandledRejection');
  });
})();
