import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "fallback_default_jwt_secret_precisely_123";

export interface AuthRequest extends Request {
  user?: {
    id?: string;
    role?: string;
    email?: string;
  };
}

/**
 * authenticate — reads JWT from HttpOnly cookie, verifies, attaches req.user
 * Returns 401 if no token, 403 if expired/invalid
 */
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const token = req.cookies?.token;

    if (!token) {
        res.status(401).json({ error: 'Unauthorized: No session token provided.' });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string; email: string };
        req.user = decoded;
        next();
    } catch (err) {
        res.status(403).json({ error: 'Forbidden: Session token is invalid or expired. Please log in again.' });
    }
};

/**
 * requireRole — must come after authenticate
 * Returns 403 if user role doesn't match the required role
 */
export const requireRole = (role: string) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized: Authentication required.' });
            return;
        }
        if (req.user.role !== role) {
            res.status(403).json({ error: `Forbidden: This route requires the "${role}" role.` });
            return;
        }
        next();
    };
};
