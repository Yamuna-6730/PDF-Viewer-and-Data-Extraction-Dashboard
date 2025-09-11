import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractToken, JWTPayload } from '../utils/jwt';
import User from '../models/User';
import { IApiResponse } from '../types/invoice.types';

// Extend Request interface to include user
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Middleware to verify JWT token and authenticate user
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from header or cookies
    const token = extractToken(req.headers.authorization, req.cookies);

    if (!token) {
      const response: IApiResponse = {
        success: false,
        error: 'Access denied. No token provided.',
      };
      res.status(401).json(response);
      return;
    }

    // Verify token
    let decoded: JWTPayload;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      const response: IApiResponse = {
        success: false,
        error: 'Invalid or expired token.',
      };
      res.status(401).json(response);
      return;
    }

    // Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      const response: IApiResponse = {
        success: false,
        error: 'The user belonging to this token no longer exists.',
      };
      res.status(401).json(response);
      return;
    }

    // Add user to request object
    req.user = {
      id: user._id!.toString(),
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    const response: IApiResponse = {
      success: false,
      error: 'Authentication failed.',
    };
    res.status(500).json(response);
  }
};

/**
 * Middleware to authorize user based on roles
 */
export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      const response: IApiResponse = {
        success: false,
        error: 'You are not authenticated.',
      };
      res.status(401).json(response);
      return;
    }

    if (!roles.includes(req.user.role)) {
      const response: IApiResponse = {
        success: false,
        error: 'You do not have permission to perform this action.',
      };
      res.status(403).json(response);
      return;
    }

    next();
  };
};

/**
 * Middleware for optional authentication (doesn't fail if no token)
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from header or cookies
    const token = extractToken(req.headers.authorization, req.cookies);

    if (token) {
      try {
        const decoded = verifyToken(token);
        const user = await User.findById(decoded.id);
        
        if (user) {
          req.user = {
            id: user._id!.toString(),
            email: user.email,
            role: user.role,
          };
        }
      } catch (error) {
        // Token is invalid, but that's okay for optional auth
        console.warn('Invalid token in optional auth:', error);
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next(); // Continue even if there's an error
  }
};

export default {
  authenticate,
  authorize,
  optionalAuth,
};
