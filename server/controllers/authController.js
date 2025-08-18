const User = require('../models/User');
const { generateToken, setTokenCookie, clearTokenCookie } = require('../utils/jwt');
const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(3)
    .max(20)
    .pattern(/^[a-zA-Z\s]+$/)
    .required()
    .messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 3 characters long',
      'string.max': 'Name cannot exceed 20 characters',
      'string.pattern.base': 'Name can only contain letters and spaces'
    }),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .trim()
    .lowercase()
    .required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please provide a valid email address'
    }),
  password: Joi.string()
    .min(6)
    .max(50)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 6 characters long',
      'string.max': 'Password cannot exceed 50 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    })
});

const loginSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .trim()
    .lowercase()
    .required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please provide a valid email address'
    }),
  password: Joi.string()
    .min(1)
    .required()
    .messages({
      'string.empty': 'Password is required'
    }),
  remember: Joi.boolean()
    .default(false)
    .optional()
});

const emailSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .trim()
    .lowercase()
    .required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please provide a valid email address'
    })
});

const passwordResetSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'string.empty': 'Reset token is required'
    }),
  password: Joi.string()
    .min(6)
    .max(50)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 6 characters long',
      'string.max': 'Password cannot exceed 50 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'string.empty': 'Confirm password is required'
    })
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'string.empty': 'Current password is required'
    }),
  newPassword: Joi.string()
    .min(6)
    .max(50)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.empty': 'New password is required',
      'string.min': 'New password must be at least 6 characters long',
      'string.max': 'New password cannot exceed 50 characters',
      'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, and one number'
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'string.empty': 'Confirm password is required'
    })
});

const updateProfileSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(3)
    .max(20)
    .pattern(/^[a-zA-Z\s]+$/)
    .optional()
    .messages({
      'string.min': 'Name must be at least 3 characters long',
      'string.max': 'Name cannot exceed 20 characters',
      'string.pattern.base': 'Name can only contain letters and spaces'
    }),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .trim()
    .lowercase()
    .optional()
    .messages({
      'string.email': 'Please provide a valid email address'
    })
});

const register = async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body, { stripUnknown: true });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        field: error.details[0].path[0]
      });
    }

    const { name, email, password } = value;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email',
        field: 'email'
      });
    }

    const user = await User.create({
      name,
      email,
      password
    });

    const token = generateToken(user._id);
    setTokenCookie(res, token, false);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
        field: 'email'
      });
    }
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body, { stripUnknown: true });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        field: error.details[0].path[0]
      });
    }

    const { email, password, remember } = value;

    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        field: 'credentials'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        field: 'credentials'
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Account has been suspended. Please contact support.'
      });
    }

    const tokenExpiry = remember ? '30d' : (process.env.JWT_EXPIRE || '7d');
    const token = generateToken(user._id, tokenExpiry);
    
    setTokenCookie(res, token, remember);

    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

const logout = (req, res) => {
  try {
    clearTokenCookie(res);
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error during logout'
    });
  }
};

const getMe = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { error, value } = emailSchema.validate(req.body, { stripUnknown: true });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        field: error.details[0].path[0]
      });
    }

    const { email } = value;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with this email address',
        field: 'email'
      });
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save();

    res.json({
      success: true,
      message: 'Password reset token generated',
      resetToken
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { error, value } = passwordResetSchema.validate(req.body, { stripUnknown: true });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        field: error.details[0].path[0]
      });
    }

    const { token, password } = value;

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
        field: 'token'
      });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    const authToken = generateToken(user._id);
    setTokenCookie(res, authToken, false);

    res.json({
      success: true,
      message: 'Password reset successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { error, value } = changePasswordSchema.validate(req.body, { stripUnknown: true });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        field: error.details[0].path[0]
      });
    }

    const { currentPassword, newPassword } = value;

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
        field: 'currentPassword'
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password',
        field: 'newPassword'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { error, value } = updateProfileSchema.validate(req.body, { stripUnknown: true });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        field: error.details[0].path[0]
      });
    }

    const { name, email } = value;

    if (!name && !email) {
      return res.status(400).json({
        success: false,
        message: 'At least one field (name or email) must be provided for update'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists',
          field: 'email'
        });
      }
      user.email = email;
    }

    if (name && name !== user.name) {
      user.name = name;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists',
        field: 'email'
      });
    }
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isBlocked) {
      clearTokenCookie(res);
      return res.status(403).json({
        success: false,
        message: 'Account has been suspended'
      });
    }

    const token = generateToken(user._id);
    setTokenCookie(res, token, false);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { 
  register, 
  login, 
  logout, 
  getMe, 
  forgotPassword, 
  resetPassword, 
  changePassword, 
  updateProfile, 
  refreshToken 
};