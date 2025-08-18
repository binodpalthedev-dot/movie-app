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

app.use(helmet());

app.use(cors({
  origin: [
    'https://movie-app-eight-lovat.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
  ],
  credentials: true,
}));

app.options('*', cors());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

const createDummyUser = async () => {
  try {
    const existingUser = await User.findOne({ email: 'test@example.com' });
    if (existingUser) return;
    const dummyUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    await dummyUser.save();
  } catch (error) {
    console.error('Error creating dummy user:', error.message);
  }
};

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