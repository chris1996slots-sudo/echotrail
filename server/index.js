import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import personaRoutes from './routes/persona.js';
import memoryRoutes from './routes/memory.js';
import timeCapsuleRoutes from './routes/timeCapsule.js';
import wisdomRoutes from './routes/wisdom.js';
import adminRoutes from './routes/admin.js';
import aiRoutes from './routes/ai.js';
import supportRoutes from './routes/support.js';
import referralRoutes from './routes/referral.js';
import familyRoutes from './routes/family.js';
import notificationRoutes from './routes/notifications.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (same-origin, mobile apps, curl, etc.)
    if (!origin) {
      callback(null, true);
      return;
    }
    // Allow localhost in development
    if (origin.startsWith('http://localhost:')) {
      callback(null, true);
      return;
    }
    // Allow Render URLs
    if (origin.includes('.onrender.com')) {
      callback(null, true);
      return;
    }
    // Allow configured frontend URL
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
      callback(null, true);
      return;
    }
    // In production, allow same-origin requests
    if (process.env.NODE_ENV === 'production') {
      callback(null, true);
      return;
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Make prisma available to routes
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/persona', personaRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/time-capsules', timeCapsuleRoutes);
app.use('/api/wisdom', wisdomRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/referral', referralRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/notifications', notificationRoutes);

// Serve uploaded files (videos for LiveAvatar training)
const uploadsPath = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.mp4')) {
      res.setHeader('Content-Type', 'video/mp4');
    } else if (filePath.endsWith('.webm')) {
      res.setHeader('Content-Type', 'video/webm');
    }
  }
}));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');

  // Serve static files with proper MIME types
  app.use(express.static(distPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      } else if (filePath.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json');
      }
    }
  }));

  // Handle SPA routing - serve index.html for all non-API routes
  app.use((req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api')) {
      return next();
    }
    // Skip requests for static files that exist
    if (req.method !== 'GET') {
      return next();
    }
    // Serve index.html for SPA routes
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

// Initialize admin user and start server
async function initializeServer() {
  try {
    // Create admin user if doesn't exist
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@echotrail.ai';
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (!existingAdmin) {
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 12);

      await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          firstName: 'Admin',
          lastName: 'EchoTrail',
          role: 'ADMIN',
          subscription: 'PREMIUM',
        }
      });
      console.log('✅ Admin user created:', adminEmail);
    }

    // Initialize default API configs if not exist
    // New category-based services
    const apiServicesNew = [
      { service: 'llm', envKey: 'CLAUDE_API_KEY', defaultProvider: 'claude' },
      { service: 'voice', envKey: 'ELEVENLABS_API_KEY', defaultProvider: 'elevenlabs' },
      { service: 'avatar', envKey: 'HEYGEN_API_KEY', defaultProvider: 'heygen' },
      { service: 'liveavatar', envKey: 'LIVEAVATAR_API_KEY', defaultProvider: 'liveavatar' },
      { service: 'simli', envKey: 'SIMLI_API_KEY', defaultProvider: 'simli' },
    ];
    for (const { service, envKey, defaultProvider } of apiServicesNew) {
      const existing = await prisma.apiConfig.findUnique({
        where: { service }
      });
      if (!existing) {
        await prisma.apiConfig.create({
          data: {
            service,
            apiKey: process.env[envKey] || '',
            isActive: false,
            settings: { provider: defaultProvider },
          }
        });
      }
    }
    // Legacy service names for backward compatibility
    const apiServicesLegacy = ['claude', 'elevenlabs', 'heygen'];
    for (const service of apiServicesLegacy) {
      const existing = await prisma.apiConfig.findUnique({
        where: { service }
      });
      if (!existing) {
        await prisma.apiConfig.create({
          data: {
            service,
            apiKey: process.env[`${service.toUpperCase()}_API_KEY`] || '',
            isActive: false,
            settings: {},
          }
        });
      }
    }

    app.listen(PORT, () => {
      console.log(`🚀 EchoTrail Server running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
}

initializeServer();

export default app;
