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
    
    // Block requests without origin in production
    if (env === 'production' && !origin) {
      return callback(new Error('Origin required in production'));
    }
    
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200
};

export { corsOptions };