// server/server.js
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const movieRoutes = require('./routes/movieRoutes');
const errorHandler = require('./middleware/errorHandler');
const User = require('./models/User');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: "*",
  // origin: process.env.CLIENT_URL || 'https://movie-app-eight-lovat.vercel.app/',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files for poster images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(errorHandler);

// Function to create dummy user
const createDummyUser = async () => {
  try {
    // Check if dummy user already exists
    const existingUser = await User.findOne({ email: 'test@example.com' });
    
    if (existingUser) {
      console.log('✅ Dummy user already exists:', existingUser.email);
      return;
    }

    // Create dummy user

    const dummyUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });

    await dummyUser.save();
    console.log('Dummy user created successfully!');
  } catch (error) {
    console.error('Error creating dummy user:', error.message);
  }
};

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB Connected');
    await createDummyUser();
  })
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});