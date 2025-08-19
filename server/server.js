// server/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const movieRoutes = require('./routes/movieRoutes');
const errorHandler = require('./middleware/errorHandler');
const User = require('./models/User');

const app = express();

/* ------------------ Security Middlewares ------------------ */
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  'https://movie-app-eight-lovat.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, origin);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie'],
}));

// Rate limiting (100 requests per 15 mins per IP)
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' }
}));

/* ------------------ Middlewares ------------------ */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static files for poster images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ------------------ Routes ------------------ */
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

/* ------------------ Error Handling ------------------ */
app.use(errorHandler);

/* ------------------ Dummy User Creator ------------------ */
const createDummyUser = async () => {
  try {
    const existingUser = await User.findOne({ email: 'test@example.com' });

    if (existingUser) {
      console.log(`✅ Dummy user already exists: ${existingUser.email}`);
      return;
    }

    const dummyUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123', // 🔥 Hashing model middleware handle karega
    });

    await dummyUser.save();
    console.log('🎉 Dummy user created successfully!');
  } catch (error) {
    console.error('❌ Error creating dummy user:', error.message);
  }
};

/* ------------------ DB Connection & Server Start ------------------ */
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    await createDummyUser();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

startServer();