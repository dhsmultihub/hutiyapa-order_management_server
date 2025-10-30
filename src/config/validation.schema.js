const Joi = require('joi');

module.exports = Joi.object({
  // Application
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(8001),
  API_PREFIX: Joi.string().default('api/v1'),

  // Database
  DATABASE_URL: Joi.string().required(),
  DB_MAX_CONNECTIONS: Joi.number().default(10),
  DB_CONNECTION_TIMEOUT: Joi.number().default(30000),
  DB_QUERY_TIMEOUT: Joi.number().default(30000),

  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),

  // External Services
  AUTH_SERVICE_URL: Joi.string().default('http://localhost:8000'),
  AUTH_SERVICE_API_KEY: Joi.string().default('your-auth-service-api-key'),
  PRODUCT_SERVICE_URL: Joi.string().default('http://localhost:8002'),
  PRODUCT_SERVICE_API_KEY: Joi.string().default('your-product-service-api-key'),
  CART_SERVICE_URL: Joi.string().default('http://localhost:8003'),
  CART_SERVICE_API_KEY: Joi.string().default('your-cart-service-api-key'),

  // Payment Gateways
  RAZORPAY_KEY_ID: Joi.string().optional(),
  RAZORPAY_KEY_SECRET: Joi.string().optional(),
  STRIPE_PUBLISHABLE_KEY: Joi.string().optional(),
  STRIPE_SECRET_KEY: Joi.string().optional(),
  PAYPAL_CLIENT_ID: Joi.string().optional(),
  PAYPAL_CLIENT_SECRET: Joi.string().optional(),

  // Shipping Carriers
  BLUE_DART_API_KEY: Joi.string().optional(),
  BLUE_DART_API_SECRET: Joi.string().optional(),
  FEDEX_API_KEY: Joi.string().optional(),
  FEDEX_API_SECRET: Joi.string().optional(),
  DHL_API_KEY: Joi.string().optional(),
  DHL_API_SECRET: Joi.string().optional(),

  // Redis
  REDIS_URL: Joi.string().default('redis://localhost:6379'),
  REDIS_PASSWORD: Joi.string().allow('').default(''),
  REDIS_DB: Joi.number().default(0),

  // Email
  SMTP_HOST: Joi.string().default('smtp.gmail.com'),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().optional(),
  SMTP_PASS: Joi.string().optional(),
  SMTP_FROM: Joi.string().default('noreply@hutiyapa.com'),

  // SMS
  SMS_PROVIDER: Joi.string().default('twilio'),
  TWILIO_ACCOUNT_SID: Joi.string().optional(),
  TWILIO_AUTH_TOKEN: Joi.string().optional(),
  TWILIO_PHONE_NUMBER: Joi.string().optional(),

  // File Upload
  UPLOAD_MAX_SIZE: Joi.number().default(10485760),
  UPLOAD_ALLOWED_TYPES: Joi.string().default('image/jpeg,image/png,image/gif,application/pdf'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),

  // CORS
  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
  CORS_CREDENTIALS: Joi.boolean().default(true),

  // Logging
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug', 'verbose').default('info'),
  LOG_FILE: Joi.string().default('logs/app.log'),
  LOG_MAX_SIZE: Joi.string().default('10m'),
  LOG_MAX_FILES: Joi.number().default(5),

  // Monitoring
  PROMETHEUS_ENABLED: Joi.boolean().default(true),
  PROMETHEUS_PORT: Joi.number().default(9090),
  HEALTH_CHECK_INTERVAL: Joi.number().default(30000),

  // WebSocket
  WEBSOCKET_PORT: Joi.number().default(8002),
  WEBSOCKET_CORS_ORIGIN: Joi.string().default('http://localhost:3000'),

  // Cache
  CACHE_TTL: Joi.number().default(3600),
  CACHE_MAX_SIZE: Joi.number().default(1000),

  // Security
  BCRYPT_ROUNDS: Joi.number().default(12),
  SESSION_SECRET: Joi.string().default('your-session-secret-key'),
  COOKIE_SECRET: Joi.string().default('your-cookie-secret-key'),

  // External API
  EXTERNAL_API_TIMEOUT: Joi.number().default(30000),
  EXTERNAL_API_RETRY_ATTEMPTS: Joi.number().default(3),
  EXTERNAL_API_RETRY_DELAY: Joi.number().default(1000),
});
