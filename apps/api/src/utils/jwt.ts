import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { IUser } from '../models/User';

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_COOKIE_EXPIRES_IN = process.env.JWT_COOKIE_EXPIRES_IN || '7';

export interface JWTPayload {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Sign a JWT token
 */
export const signToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

/**
 * Verify a JWT token
 */
export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
};

/**
 * Create and send JWT token as response
 */
export const createSendToken = (user: IUser, statusCode: number, res: Response): void => {
  const token = signToken({
    id: user._id!,
    email: user.email,
    role: user.role,
  });

  // Cookie options
  const cookieOptions = {
    expires: new Date(
      Date.now() + parseInt(JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
  };

  // Send cookie
  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  const { password, ...userWithoutPassword } = user;

  res.status(statusCode).json({
    success: true,
    data: {
      token,
      user: userWithoutPassword,
    },
  });
};

/**
 * Extract token from request
 */
export const extractToken = (authHeader?: string, cookies?: any): string | null => {
  let token: string | null = null;

  // Check authorization header
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }
  // Check cookies
  else if (cookies?.jwt) {
    token = cookies.jwt;
  }

  return token;
};

/**
 * Decode token without verification (for expired tokens)
 */
export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    return null;
  }
};

export default {
  signToken,
  verifyToken,
  createSendToken,
  extractToken,
  decodeToken,
};
