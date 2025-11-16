import { Request, Response, NextFunction } from 'express';
import { jwtVerify } from 'jose';
import User, { IUser } from '../models/User';

export interface AuthRequest extends Request {
  user?: IUser;
}

/**
 * Middleware to verify NextAuth JWT token and attach user to request
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

    // Verify JWT token from NextAuth
    const { payload } = await jwtVerify(token, secret);

    if (!payload.sub || !payload.email) {
      res.status(401).json({ error: 'Invalid token payload' });
      return;
    }

    // Find or create user in database
    let user = await User.findOne({ email: payload.email as string });

    if (!user) {
      // Create user if doesn't exist (first time login)
      user = await User.create({
        googleId: payload.sub,
        email: payload.email,
        name: payload.name || 'User',
        image: payload.picture as string | undefined,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Middleware to check if user has required role
 */
export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token, but attaches user if present
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

    const { payload } = await jwtVerify(token, secret);

    if (payload.email) {
      const user = await User.findOne({ email: payload.email as string });
      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continue without auth if token is invalid
    next();
  }
};
