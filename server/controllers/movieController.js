const Movie = require('../models/Movie');
const { deleteFile, getFullPath } = require('../utils/fileUtils');
const Joi = require('joi');
const mongoose = require('mongoose');

const movieSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(1)
    .max(200)
    .required()
    .messages({
      'string.empty': 'Movie title is required',
      'string.min': 'Movie title cannot be empty',
      'string.max': 'Movie title cannot exceed 200 characters'
    }),
  publishingYear: Joi.number()
    .integer()
    .min(1800)
    .max(new Date().getFullYear() + 5)
    .required()
    .messages({
      'number.base': 'Publishing year must be a valid number',
      'number.integer': 'Publishing year must be an integer',
      'number.min': 'Publishing year cannot be before 1800',
      'number.max': `Publishing year cannot be more than ${new Date().getFullYear() + 5}`
    }),
  poster: Joi.string().optional()
});

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

const searchSchema = Joi.object({
  search: Joi.string().trim().max(100).optional(),
  publishingYear: Joi.number().integer().min(1800).max(new Date().getFullYear() + 5).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

const validateObjectId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid movie ID format');
  }
};

const createMovie = async (req, res, next) => {
  try {
    const { error } = movieSchema.validate(req.body, { stripUnknown: true });
    if (error) {
      if (req.file) deleteFile(req.file.path);
      return res.status(400).json({ 
        success: false, 
        message: error.details[0].message,
        field: error.details[0].path[0]
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "Poster image is required",
        field: "poster"
      });
    }

    if (!req.user || !req.user._id) {
      if (req.file) deleteFile(req.file.path);
      return res.status(401).json({
        success: false,
        message: "User authentication required"
      });
    }

    const { title, publishingYear } = req.body;

    const existingMovie = await Movie.findOne({ 
      title: title.trim(),
      createdBy: req.user._id 
    });

    if (existingMovie) {
      if (req.file) deleteFile(req.file.path);
      return res.status(409).json({
        success: false,
        message: "Movie with this title already exists in your collection"
      });
    }

    const movie = await Movie.create({
      title: title.trim(),
      publishingYear: parseInt(publishingYear),
      poster: req.file.filename,
      createdBy: req.user._id
    });

    await movie.populate("createdBy", "username email");

    res.status(201).json({
      success: true,
      message: "Movie created successfully",
      movie
    });
  } catch (error) {
    if (req.file) deleteFile(req.file.path);
    next(error);
  }
};

const getMovies = async (req, res, next) => {
  try {
    const { error, value } = searchSchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        field: error.details[0].path[0]
      });
    }

    const { page, limit, search, publishingYear } = value;
    const skip = (page - 1) * limit;

    const query = {};
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    if (publishingYear) {
      query.publishingYear = publishingYear;
    }

    const [movies, total] = await Promise.all([
      Movie.find(query)
        .populate('createdBy', 'username email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Movie.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      movies,
      pagination: {
        currentPage: page,
        totalPages,
        totalMovies: total,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        limit
      }
    });
  } catch (error) {
    next(error);
  }
};

const getMovie = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    validateObjectId(id);

    const movie = await Movie.findById(id).populate('createdBy', 'username email');

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }

    res.json({
      success: true,
      movie
    });
  } catch (error) {
    if (error.message === 'Invalid movie ID format') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

const updateMovie = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    validateObjectId(id);

    if (!req.user || !req.user._id) {
      if (req.file) deleteFile(req.file.path);
      return res.status(401).json({
        success: false,
        message: "User authentication required"
      });
    }

    const movie = await Movie.findById(id);

    if (!movie) {
      if (req.file) deleteFile(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }

    if (movie.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      if (req.file) deleteFile(req.file.path);
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this movie'
      });
    }

    const { error } = movieSchema.validate(req.body, { stripUnknown: true });
    if (error) {
      if (req.file) deleteFile(req.file.path);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        field: error.details[0].path[0]
      });
    }

    const { title, publishingYear } = req.body;

    if (title.trim() !== movie.title) {
      const existingMovie = await Movie.findOne({ 
        title: title.trim(),
        createdBy: req.user._id,
        _id: { $ne: id }
      });

      if (existingMovie) {
        if (req.file) deleteFile(req.file.path);
        return res.status(409).json({
          success: false,
          message: "Movie with this title already exists in your collection"
        });
      }
    }

    const oldPoster = movie.poster;

    movie.title = title.trim();
    movie.publishingYear = parseInt(publishingYear);

    if (req.file) {
      movie.poster = req.file.filename;
      if (oldPoster) {
        deleteFile(getFullPath(oldPoster));
      }
    }

    await movie.save();
    await movie.populate('createdBy', 'username email');

    res.json({
      success: true,
      message: 'Movie updated successfully',
      movie
    });
  } catch (error) {
    if (req.file) deleteFile(req.file.path);
    next(error);
  }
};

const deleteMovie = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    validateObjectId(id);

    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "User authentication required"
      });
    }

    const movie = await Movie.findById(id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }

    if (movie.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this movie'
      });
    }

    if (movie.poster) {
      deleteFile(getFullPath(movie.poster));
    }

    await Movie.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Movie deleted successfully'
    });
  } catch (error) {
    if (error.message === 'Invalid movie ID format') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

module.exports = { createMovie, getMovies, getMovie, updateMovie, deleteMovie };