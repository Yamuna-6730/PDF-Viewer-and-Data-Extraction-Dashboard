import express from 'express';
import rateLimit from 'express-rate-limit';
import Joi from 'joi';
import User, { IUser } from '../models/User';
import { createSendToken } from '../utils/jwt';
import { authenticate, optionalAuth, AuthenticatedRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { IApiResponse } from '../types/invoice.types';

const router = express.Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per IP
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Login rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per IP
  message: {
    success: false,
    error: 'Too many login attempts, please try again later.'
  },
});

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required'
  }),
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 100 characters',
    'any.required': 'Name is required'
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  }),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  preferences: Joi.object({
    theme: Joi.string().valid('light', 'dark').optional(),
    language: Joi.string().optional(),
    currency: Joi.string().optional(),
    timezone: Joi.string().optional(),
  }).optional(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required'
  }),
  newPassword: Joi.string().min(6).required().messages({
    'string.min': 'New password must be at least 6 characters long',
    'any.required': 'New password is required'
  }),
});

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', authLimiter, asyncHandler(async (req, res) => {
  // Validate input
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    const response: IApiResponse = {
      success: false,
      error: error.details[0].message
    };
    res.status(400).json(response);
    return;
  }

  const { email, password, name } = value;

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    const response: IApiResponse = {
      success: false,
      error: 'User with this email already exists'
    };
    res.status(400).json(response);
    return;
  }

  // Create new user
  const user = new User({
    email: email.toLowerCase(),
    password,
    name,
    role: 'user', // Default role
  });

  await user.save();

  // Create and send token
  createSendToken(user.toObject(), 201, res);
}));

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', loginLimiter, asyncHandler(async (req, res) => {
  // Validate input
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    const response: IApiResponse = {
      success: false,
      error: error.details[0].message
    };
    res.status(400).json(response);
    return;
  }

  const { email, password } = value;

  // Check if user exists and password is correct
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    const response: IApiResponse = {
      success: false,
      error: 'Invalid email or password'
    };
    res.status(401).json(response);
    return;
  }

  // Create and send token
  createSendToken(user.toObject(), 200, res);
}));

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, asyncHandler(async (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  const response: IApiResponse = {
    success: true,
    data: { message: 'Logged out successfully' }
  };
  res.status(200).json(response);
}));

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = await User.findById(req.user!.id);
  
  if (!user) {
    const response: IApiResponse = {
      success: false,
      error: 'User not found'
    };
    res.status(404).json(response);
    return;
  }

  const response: IApiResponse = {
    success: true,
    data: { user }
  };
  res.status(200).json(response);
}));

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  // Validate input
  const { error, value } = updateProfileSchema.validate(req.body);
  if (error) {
    const response: IApiResponse = {
      success: false,
      error: error.details[0].message
    };
    res.status(400).json(response);
    return;
  }

  const user = await User.findById(req.user!.id);
  if (!user) {
    const response: IApiResponse = {
      success: false,
      error: 'User not found'
    };
    res.status(404).json(response);
    return;
  }

  // Update user fields
  if (value.name) user.name = value.name;
  if (value.preferences) {
    user.preferences = { ...user.preferences, ...value.preferences };
  }

  await user.save();

  const response: IApiResponse = {
    success: true,
    data: { user }
  };
  res.status(200).json(response);
}));

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  // Validate input
  const { error, value } = changePasswordSchema.validate(req.body);
  if (error) {
    const response: IApiResponse = {
      success: false,
      error: error.details[0].message
    };
    res.status(400).json(response);
    return;
  }

  const { currentPassword, newPassword } = value;

  // Get user with password
  const user = await User.findById(req.user!.id).select('+password');
  if (!user) {
    const response: IApiResponse = {
      success: false,
      error: 'User not found'
    };
    res.status(404).json(response);
    return;
  }

  // Check current password
  if (!(await user.comparePassword(currentPassword))) {
    const response: IApiResponse = {
      success: false,
      error: 'Current password is incorrect'
    };
    res.status(400).json(response);
    return;
  }

  // Update password
  user.password = newPassword;
  await user.save();

  const response: IApiResponse = {
    success: true,
    data: { message: 'Password changed successfully' }
  };
  res.status(200).json(response);
}));

/**
 * @route   GET /api/auth/check
 * @desc    Check if user is authenticated
 * @access  Public (optional auth)
 */
router.get('/check', optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const response: IApiResponse = {
    success: true,
    data: {
      isAuthenticated: !!req.user,
      user: req.user || null
    }
  };
  res.status(200).json(response);
}));

export default router;
