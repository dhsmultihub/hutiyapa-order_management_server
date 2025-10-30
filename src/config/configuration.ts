import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  // Application Configuration
  port: parseInt(process.env.PORT, 10) || 8001,
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || 'api/v1',

  // Database Configuration
  database: {
    url: process.env.DATABASE_URL,
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS, 10) || 10,
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT, 10) || 30000,
    queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT, 10) || 30000,
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-here',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-here',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // External Services Configuration
  services: {
    auth: {
      url: process.env.AUTH_SERVICE_URL || 'http://localhost:8000',
      apiKey: process.env.AUTH_SERVICE_API_KEY || 'your-auth-service-api-key',
      timeout: parseInt(process.env.AUTH_SERVICE_TIMEOUT, 10) || 5000,
    },
    product: {
      url: process.env.PRODUCT_SERVICE_URL || 'http://localhost:8002',
      apiKey: process.env.PRODUCT_SERVICE_API_KEY || 'your-product-service-api-key',
      timeout: parseInt(process.env.PRODUCT_SERVICE_TIMEOUT, 10) || 5000,
    },
    cart: {
      url: process.env.CART_SERVICE_URL || 'http://localhost:8003',
      apiKey: process.env.CART_SERVICE_API_KEY || 'your-cart-service-api-key',
      timeout: parseInt(process.env.CART_SERVICE_TIMEOUT, 10) || 5000,
    },
  },

  // Payment Gateway Configuration
  payment: {
    razorpay: {
      keyId: process.env.RAZORPAY_KEY_ID,
      keySecret: process.env.RAZORPAY_KEY_SECRET,
      webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
    },
    stripe: {
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      secretKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    },
    paypal: {
      clientId: process.env.PAYPAL_CLIENT_ID,
      clientSecret: process.env.PAYPAL_CLIENT_SECRET,
      sandbox: process.env.PAYPAL_SANDBOX === 'true',
    },
  },

  // Shipping Carrier Configuration
  shipping: {
    blueDart: {
      apiKey: process.env.BLUE_DART_API_KEY,
      apiSecret: process.env.BLUE_DART_API_SECRET,
      baseUrl: process.env.BLUE_DART_BASE_URL || 'https://api.bluedart.com',
    },
    fedex: {
      apiKey: process.env.FEDEX_API_KEY,
      apiSecret: process.env.FEDEX_API_SECRET,
      baseUrl: process.env.FEDEX_BASE_URL || 'https://api.fedex.com',
    },
    dhl: {
      apiKey: process.env.DHL_API_KEY,
      apiSecret: process.env.DHL_API_SECRET,
      baseUrl: process.env.DHL_BASE_URL || 'https://api.dhl.com',
    },
  },

  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB, 10) || 0,
    ttl: parseInt(process.env.CACHE_TTL, 10) || 3600,
    maxSize: parseInt(process.env.CACHE_MAX_SIZE, 10) || 1000,
  },

  // Email Configuration
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || 'noreply@hutiyapa.com',
    secure: process.env.SMTP_SECURE === 'true',
  },

  // SMS Configuration
  sms: {
    provider: process.env.SMS_PROVIDER || 'twilio',
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    },
  },

  // File Upload Configuration
  upload: {
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE, 10) || 10485760, // 10MB
    allowedTypes: process.env.UPLOAD_ALLOWED_TYPES?.split(',') || [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf'
    ],
  },

  // Rate Limiting Configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESS === 'true',
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: process.env.CORS_CREDENTIALS === 'true',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
    maxSize: process.env.LOG_MAX_SIZE || '10m',
    maxFiles: parseInt(process.env.LOG_MAX_FILES, 10) || 5,
  },

  // Monitoring Configuration
  monitoring: {
    prometheus: {
      enabled: process.env.PROMETHEUS_ENABLED === 'true',
      port: parseInt(process.env.PROMETHEUS_PORT, 10) || 9090,
    },
    healthCheck: {
      interval: parseInt(process.env.HEALTH_CHECK_INTERVAL, 10) || 30000,
    },
  },

  // WebSocket Configuration
  websocket: {
    port: parseInt(process.env.WEBSOCKET_PORT, 10) || 8002,
    corsOrigin: process.env.WEBSOCKET_CORS_ORIGIN || 'http://localhost:3000',
  },

  // Security Configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
    sessionSecret: process.env.SESSION_SECRET || 'your-session-secret-key',
    cookieSecret: process.env.COOKIE_SECRET || 'your-cookie-secret-key',
  },

  // External API Configuration
  externalApi: {
    timeout: parseInt(process.env.EXTERNAL_API_TIMEOUT, 10) || 30000,
    retryAttempts: parseInt(process.env.EXTERNAL_API_RETRY_ATTEMPTS, 10) || 3,
    retryDelay: parseInt(process.env.EXTERNAL_API_RETRY_DELAY, 10) || 1000,
  },
}));

// Validation schema for environment variables
export const validationSchema = {
  PORT: { type: 'number', default: 8001 },
  NODE_ENV: { type: 'string', default: 'development' },
  DATABASE_URL: { type: 'string', required: true },
  JWT_SECRET: { type: 'string', required: true },
  JWT_REFRESH_SECRET: { type: 'string', required: true },
  AUTH_SERVICE_URL: { type: 'string', default: 'http://localhost:8000' },
  PRODUCT_SERVICE_URL: { type: 'string', default: 'http://localhost:8002' },
  CART_SERVICE_URL: { type: 'string', default: 'http://localhost:8003' },
  REDIS_URL: { type: 'string', default: 'redis://localhost:6379' },
  CORS_ORIGIN: { type: 'string', default: 'http://localhost:3000' },
  LOG_LEVEL: { type: 'string', default: 'info' },
};
