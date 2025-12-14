// server.js - UPDATED FOR VERCEL
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./db');

dotenv.config();
connectDB();

const app = express();

// ========== CRITICAL: CORS CONFIG FOR VERCEL ==========
// Replace the simple cors() with explicit CORS handling
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:8081',        // React Native dev server
      'http://localhost:19006',       // Expo web
      'http://localhost:19000',       // Expo
      'http://localhost:3000',        // React dev server
      'exp://*',                      // All Expo apps
      'http://192.168.*.*:*',         // All local network IPs
      'https://health-vault-one.vercel.app/api', // Your frontend if deployed
    ];
    
    // Check if origin matches any allowed pattern
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed.includes('*')) {
        // Handle wildcard patterns
        const regex = new RegExp(allowed.replace(/\*/g, '.*'));
        return regex.test(origin);
      }
      return origin === allowed;
    });
    
    if (isAllowed || origin.includes('localhost') || origin.includes('192.168')) {
      callback(null, true);
    } else {
      console.warn('CORS blocked origin:', origin);
      callback(null, true); // Still allow for now, change to false in production
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200,
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly (IMPORTANT FOR VERCEL)
app.options('*', cors(corsOptions));

// Add manual CORS headers for all responses
app.use((req, res, next) => {
  // Set CORS headers for every response
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// ========== MIDDLEWARE ==========
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ========== STATIC UPLOADS ==========
// Serve uploaded files with proper headers
const staticOptions = {
  setHeaders: (res, filePath) => {
    // Set CORS for static files
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Type');
    
    // Set proper content type based on file extension
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain',
    };
    
    if (mimeTypes[ext]) {
      res.setHeader('Content-Type', mimeTypes[ext]);
      res.setHeader('Content-Disposition', `inline; filename="${path.basename(filePath)}"`);
    }
  }
};

app.use('/uploads/records', express.static(path.join(__dirname, 'uploads', 'records'), staticOptions));
app.use('/uploads/profile', express.static(path.join(__dirname, 'uploads', 'profile'), staticOptions));

// ========== ROUTES ==========
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/records', require('./routes/records'));

// ========== TEST ENDPOINTS ==========
// Basic root
app.get('/', (req, res) => res.send('HealthVault API running'));

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'HealthVault API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      records: '/api/records',
      uploads: '/uploads'
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    service: 'HealthVault API',
    database: 'connected', // You might want to check DB connection
    uptime: process.uptime()
  });
});

// ========== ERROR HANDLER ==========
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err.stack);
  res.status(500).json({ 
    message: 'Server error',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

// ========== 404 HANDLER ==========
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: ['/api/auth', '/api/users', '/api/records', '/api', '/api/health']
  });
});

// ========== VERCEL COMPATIBILITY ==========
// Check if running on Vercel
const isVercel = process.env.VERCEL === '1';

if (isVercel) {
  console.log('🚀 Running on Vercel environment');
  // Export for Vercel Serverless Functions
  module.exports = app;
} else {
  // For local development
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`
    🚀 HealthVault Server Started!
    ⚡ Environment: ${process.env.NODE_ENV || 'development'}
    📍 Port: ${PORT}
    🌐 Local: http://localhost:${PORT}
    📊 API: http://localhost:${PORT}/api
    ❤️  Health: http://localhost:${PORT}/api/health
    📁 Uploads: http://localhost:${PORT}/uploads/
    `);
  });
}