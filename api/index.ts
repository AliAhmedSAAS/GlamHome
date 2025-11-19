import express from "express";
import { registerRoutes } from "../server/routes";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import * as logger from "../server/logger";
import { validateConfig } from "../server/config";

// Validate configuration at startup
validateConfig();

const app = express();

// Trust proxy - required for Vercel
app.set("trust proxy", 1);

// CORS configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    if (!origin) {
      return callback(null, true);
    }

    if (process.env.NODE_ENV === 'production') {
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
      const isVercelUrl = origin.includes('.vercel.app');
      const isAllowed = allowedOrigins.some(allowed => origin.includes(allowed));
      
      if (isAllowed || isVercelUrl) {
        callback(null, true);
      } else {
        logger.warn('CORS blocked origin', { origin });
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.stripe.com"],
      frameSrc: ["'self'", "https://js.stripe.com"],
      fontSrc: ["'self'", "data:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Global rate limiter
const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !req.path.startsWith('/api'),
});

app.use(globalRateLimiter);

// Request timeout (9 seconds for Vercel)
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  const timer = setTimeout(() => {
    if (!res.headersSent) {
      logger.warn('Request timeout', {
        method: req.method,
        path: req.path,
        ip: req.ip,
      });
      res.status(408).json({ message: 'Request timeout' });
    }
  }, 9000);

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

// HTTP request logging
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

// Initialize routes
let routesInitialized = false;

async function initializeApp() {
  if (!routesInitialized) {
    await registerRoutes(app);
    routesInitialized = true;

    // Error handler - DO NOT throw to prevent crashes
    app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
      const status = err.status || err.statusCode || 500;
      
      logger.error('Request error', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        method: req.method,
        path: req.path,
        ip: req.ip,
        status,
      });

      const message = status < 500 ? err.message : "Internal Server Error";
      res.status(status).json({ message });
    });
  }
}

// Export for Vercel serverless
export default async function handler(req: any, res: any) {
  await initializeApp();
  return app(req, res);
}

