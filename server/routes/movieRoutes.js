const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { createMovie, getMovies, getMovie, updateMovie, deleteMovie } = require('../controllers/movieController');

router.use(protect); // All routes need auth

// Create movie (poster required)
router.post('/', upload.single('poster'), createMovie);

// Get movies
router.get('/', getMovies);

// Get single movie
router.get('/:id', getMovie);

// Update movie (poster optional)
router.put('/:id', upload.single('poster'), updateMovie);

// Delete movie
router.delete('/:id', deleteMovie);

module.exports = router;