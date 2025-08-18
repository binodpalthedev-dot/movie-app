// server/models/Movie.js
const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Movie title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  publishingYear: {
    type: Number,
    required: [true, 'Publishing year is required'],
    min: [1800, 'Publishing year must be after 1800'],
    max: [new Date().getFullYear() + 5, 'Publishing year cannot be too far in the future']
  },
  poster: {
    type: String,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
movieSchema.index({ title: 1, publishingYear: 1 });
movieSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Movie', movieSchema);