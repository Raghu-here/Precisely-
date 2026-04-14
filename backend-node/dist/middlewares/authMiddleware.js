"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || "fallback_default_jwt_secret_precisely_123";
/**
 * authenticate — reads JWT from HttpOnly cookie, verifies, attaches req.user
 * Returns 401 if no token, 403 if expired/invalid
 */
const authenticate = (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) {
        res.status(401).json({ error: 'Unauthorized: No session token provided.' });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        res.status(403).json({ error: 'Forbidden: Session token is invalid or expired. Please log in again.' });
    }
};
exports.authenticate = authenticate;
/**
 * requireRole — must come after authenticate
 * Returns 403 if user role doesn't match the required role
 */
const requireRole = (role) => {
    return (req, res, next) => {
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
exports.requireRole = requireRole;
