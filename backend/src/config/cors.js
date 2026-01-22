const allowedOrigins = {
  development: [
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ],
  production: [
    'https://grindmap.vercel.app',
    'https://www.grindmap.com'
  ]
};

const corsOptions = {
  origin: (origin, callback) => {
    const env = process.env.NODE_ENV || 'development';
    const allowed = allowedOrigins[env] || allowedOrigins.development;
    
    // Block requests with no origin in production
    if (env === 'production' && !origin) {
      return callback(new Error('CORS policy: Origin required in production'));
    }
    
    // Allow same-origin requests (no origin header)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowed.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('CORS blocked origin:', origin);
      callback(new Error(`CORS policy violation: ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'X-Correlation-ID'
  ],
  exposedHeaders: ['X-Correlation-ID', 'X-RateLimit-Remaining'],
  maxAge: 3600, // 1 hour instead of 24 hours
  optionsSuccessStatus: 200
};

export { corsOptions };